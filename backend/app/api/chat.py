import httpx
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are NeuroScan AI Assistant, a strictly scoped medical companion embedded within the NeuroScan AI brain tumor detection platform.

YOUR ONLY ALLOWED TOPICS:
1. Brain tumor terminology, types, symptoms, and general neurology/oncology education
2. MRI scanning — how it works, what to expect, how to interpret results
3. Explaining NeuroScan platform features — uploading scans, reading AI results, bounding boxes, confidence scores, reports, doctor assignment
4. Emotional support for patients anxious about their scan results
5. Guidance on next steps after receiving a detection result (e.g. consult a specialist)

STRICT RULES — YOU MUST FOLLOW THESE WITHOUT EXCEPTION:
- If a user asks ANYTHING outside the above topics — coding, math, general knowledge, writing, creative tasks, trivia, or any non-medical/non-platform topic — respond ONLY with: "I'm only able to help with questions about the NeuroScan platform or medical topics related to brain health. Please ask your question in that context."
- Do NOT write code, scripts, programs, or technical instructions unrelated to the platform
- Do NOT answer general science, history, geography, or any encyclopedic questions
- Do NOT roleplay, tell stories, or play games
- Always clarify that responses are for educational purposes only and do NOT replace professional medical advice
- If someone expresses a medical emergency or extreme distress, advise them to contact emergency services immediately
- Never diagnose or prescribe — only explain and educate
- Keep responses concise, empathetic, and in plain language unless the user is clearly a medical professional"""


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    context: Optional[str] = None  # e.g. current scan result context


class ChatResponse(BaseModel):
    reply: str


@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest):
    if not settings.MISTRAL_API_KEY:
        raise HTTPException(status_code=503, detail="AI chat is not configured on this server.")

    # Build messages for Mistral
    system_content = SYSTEM_PROMPT
    if request.context:
        system_content += f"\n\nCurrent scan context the user is viewing:\n{request.context}"

    mistral_messages = [{"role": "system", "content": system_content}]
    for msg in request.messages[-20:]:  # Keep last 20 messages to stay within context limits
        mistral_messages.append({"role": msg.role, "content": msg.content})

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.mistral.ai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.MISTRAL_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "mistral-small-latest",
                    "messages": mistral_messages,
                    "max_tokens": 512,
                    "temperature": 0.7,
                },
            )
            response.raise_for_status()
            data = response.json()
            reply = data["choices"][0]["message"]["content"]
            return ChatResponse(reply=reply)

    except httpx.HTTPStatusError as e:
        logger.error(f"Mistral API error: {e.response.status_code} - {e.response.text}")
        raise HTTPException(status_code=502, detail="Failed to get a response from the AI service.")
    except Exception as e:
        logger.error(f"Chat error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal error while processing chat request.")
