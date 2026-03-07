import httpx
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are NeuroScan AI Assistant, an intelligent medical companion embedded within the NeuroScan AI brain tumor detection platform.

Your role is to:
1. Help patients and doctors understand brain tumor terminology, MRI scan results, and detection reports
2. Explain brain conditions clearly — including what tumor detections mean, confidence scores, and bounding boxes
3. Guide users through the platform's features: uploading scans, viewing AI results, generating reports, and working with doctors
4. Provide empathetic, calm support to patients who may be anxious about their results
5. Answer general questions about MRI scanning, brain anatomy, neurology, and oncology

Important rules:
- Always remind users that your responses are for general educational purposes only and do NOT replace professional medical advice
- Encourage users to discuss their specific results with their assigned doctor or a qualified specialist
- If someone expresses distress or emergency symptoms, advise them to contact emergency services immediately
- Keep responses concise, clear, and empathetic
- Use plain language unless the user is clearly a medical professional
- Never diagnose or prescribe — only explain and educate"""


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
