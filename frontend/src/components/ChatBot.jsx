import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Bot, User, Loader2, Brain, AlertCircle } from 'lucide-react'
import axios from 'axios'

const WELCOME_MESSAGE = {
  role: 'assistant',
  content: "Hi! I'm your NeuroScan AI Assistant 🧠 I can help you understand brain tumor terminology, explain your scan results, or guide you through the platform. What would you like to know?",
}

const SUGGESTION_CHIPS = [
  "What does brain tumor detection mean?",
  "How do I read my scan results?",
  "What is a confidence score?",
  "How do I share results with my doctor?",
]

export default function ChatBot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [unavailable, setUnavailable] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (text) => {
    const userText = (text || input).trim()
    if (!userText || loading) return

    setInput('')
    setError(null)
    const userMsg = { role: 'user', content: userText }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setLoading(true)

    try {
      // Only send actual conversation history (skip the welcome message for the API)
      const history = updatedMessages.filter((_, i) => i > 0 || messages[0].role !== 'assistant' || i !== 0)
      const res = await axios.post('/api/chat/', {
        messages: updatedMessages.filter(m => m !== WELCOME_MESSAGE || updatedMessages.indexOf(m) > 0 ? true : false).map(m => ({ role: m.role, content: m.content })),
      })
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }])
    } catch (err) {
      if (err.response?.status === 503) {
        setUnavailable(true)
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: "I'm not available right now — the AI service hasn't been configured on this server yet. Please contact the administrator.",
        }])
      } else {
        setError("Something went wrong. Please try again.")
        setMessages(prev => prev.slice(0, -1)) // Remove user message on failure
      }
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* Floating toggle button */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl"
        style={{
          background: open
            ? 'linear-gradient(135deg, #ef4444, #dc2626)'
            : 'linear-gradient(135deg, #6366f1, #06b6d4)',
          boxShadow: open
            ? '0 0 30px rgba(239,68,68,0.4)'
            : '0 0 30px rgba(99,102,241,0.5)',
        }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        aria-label={open ? 'Close chat' : 'Open AI assistant'}
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X className="w-6 h-6 text-white" />
            </motion.div>
          ) : (
            <motion.div key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <Brain className="w-6 h-6 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="fixed bottom-24 right-6 z-50 w-[370px] flex flex-col rounded-2xl overflow-hidden shadow-2xl"
            style={{
              height: '520px',
              background: 'rgba(10, 10, 30, 0.96)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(20px)',
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/5"
              style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(6,182,212,0.1))' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)', boxShadow: '0 0 16px rgba(99,102,241,0.4)' }}>
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white font-display">NeuroScan Assistant</div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] text-emerald-400">Powered by Mistral AI</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                  className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'user'
                      ? 'bg-indigo-500'
                      : 'bg-gradient-to-br from-indigo-500 to-cyan-400'
                  }`}>
                    {msg.role === 'user'
                      ? <User className="w-3.5 h-3.5 text-white" />
                      : <Bot className="w-3.5 h-3.5 text-white" />
                    }
                  </div>
                  <div
                    className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-sm'
                        : 'bg-white/5 text-neutral-200 rounded-tl-sm border border-white/5'
                    }`}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="bg-white/5 border border-white/5 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1">
                    {[0, 1, 2].map(i => (
                      <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                        animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Error */}
              {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {error}
                </motion.div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Suggestion chips — only show before user sends first message */}
            {messages.length === 1 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                {SUGGESTION_CHIPS.map(chip => (
                  <button key={chip} onClick={() => sendMessage(chip)}
                    className="text-[11px] px-2.5 py-1 rounded-full border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/15 hover:border-indigo-400/50 transition-all whitespace-nowrap">
                    {chip}
                  </button>
                ))}
              </div>
            )}

            {/* Disclaimer */}
            <div className="px-4 pt-1 pb-1">
              <p className="text-[10px] text-neutral-600 text-center leading-snug">
                For educational purposes only. Not a substitute for medical advice.
              </p>
            </div>

            {/* Input */}
            <div className="px-3 pb-3">
              <div className="flex items-end gap-2 bg-white/5 border border-white/8 rounded-xl px-3 py-2 focus-within:border-indigo-500/40 transition-colors">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about brain tumors, scans, or results…"
                  rows={1}
                  disabled={loading || unavailable}
                  className="flex-1 bg-transparent text-sm text-white placeholder-neutral-500 resize-none outline-none leading-relaxed max-h-24 overflow-y-auto disabled:opacity-50"
                  style={{ minHeight: '22px' }}
                  onInput={e => {
                    e.target.style.height = 'auto'
                    e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px'
                  }}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading || unavailable}
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ background: input.trim() && !loading ? 'linear-gradient(135deg, #6366f1, #06b6d4)' : 'rgba(99,102,241,0.2)' }}
                >
                  {loading
                    ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                    : <Send className="w-4 h-4 text-white" />
                  }
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
