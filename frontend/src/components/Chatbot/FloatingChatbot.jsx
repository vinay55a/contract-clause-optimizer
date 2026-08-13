import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Minimize2, Sparkles, Bot } from 'lucide-react'
import { chatAPI } from '../../api/client'
import { useAuth } from '../../context/AuthContext'

const WELCOME = {
  id: 'welcome',
  role: 'ai',
  content: "👋 Hi! I'm **ClauseAI**, your AI legal assistant.\n\nI can help you:\n• Explain contract clauses\n• Analyze risks\n• Suggest negotiation strategies\n• Rewrite clauses in plain English\n\nWhat would you like to know?",
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map(i => (
        <div key={i} className="typing-dot" style={{ animationDelay: `${i * 0.2}s` }} />
      ))}
    </div>
  )
}

function MessageBubble({ msg }) {
  const isAI = msg.role === 'ai'
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isAI ? 'justify-start' : 'justify-end'} mb-3`}
    >
      {isAI && (
        <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mr-2 mt-1"
          style={{ background: 'linear-gradient(135deg, #2563EB, #06B6D4)' }}>
          <Bot size={14} color="white" />
        </div>
      )}
      <div
        className="max-w-[80%] rounded-2xl px-4 py-3 text-sm"
        style={{
          background: isAI
            ? 'rgba(30, 41, 59, 0.9)'
            : 'linear-gradient(135deg, #2563EB, #06B6D4)',
          color: '#F1F5F9',
          border: isAI ? '1px solid rgba(255,255,255,0.06)' : 'none',
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
        }}
      >
        {msg.content}
      </div>
    </motion.div>
  )
}

export default function FloatingChatbot() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [messages, setMessages] = useState([WELCOME])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, open, typing])

  const sendMessage = async () => {
    if (!input.trim() || typing) return
    const userMsg = { id: Date.now(), role: 'user', content: input.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setTyping(true)

    try {
      if (user) {
        const res = await chatAPI.sendMessage({ message: userMsg.content })
        setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', content: res.data.response }])
      } else {
        // Demo mode without auth
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: Date.now() + 1,
            role: 'ai',
            content: "Please sign in to use the full AI legal assistant. You can register for free!",
          }])
        }, 800)
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'ai',
        content: "I'm having trouble connecting to the AI right now. Please check that the backend is running.",
      }])
    } finally {
      setTyping(false)
    }
  }

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setOpen(true)}
            id="chatbot-toggle"
            className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center z-50 animate-pulse-glow"
            style={{ background: 'linear-gradient(135deg, #2563EB, #06B6D4)', boxShadow: '0 8px 30px rgba(37,99,235,0.5)' }}
          >
            <MessageCircle size={24} color="white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-6 right-6 z-50 flex flex-col"
            style={{
              width: 380,
              height: minimized ? 60 : 560,
              borderRadius: '1.5rem',
              background: 'rgba(10, 16, 32, 0.97)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(37,99,235,0.25)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(37,99,235,0.1)',
              overflow: 'hidden',
              transition: 'height 0.3s ease',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.2), rgba(6,182,212,0.1))', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2563EB, #06B6D4)' }}>
                  <Sparkles size={15} color="white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">ClauseAI Assistant</p>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <p className="text-xs" style={{ color: '#64748B' }}>Online</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setMinimized(m => !m)} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors" style={{ color: '#64748B' }}>
                  <Minimize2 size={15} />
                </button>
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors" style={{ color: '#64748B' }}>
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Messages */}
            {!minimized && (
              <>
                <div className="flex-1 overflow-y-auto p-4">
                  {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
                  {typing && (
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2563EB, #06B6D4)' }}>
                        <Bot size={14} color="white" />
                      </div>
                      <div className="rounded-2xl" style={{ background: 'rgba(30, 41, 59, 0.9)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <TypingIndicator />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick prompts */}
                <div className="px-4 pb-2 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                  {['Explain this clause', 'Is this risky?', 'Negotiation tips'].map(p => (
                    <button key={p} onClick={() => { setInput(p) }} className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full transition-colors"
                      style={{ background: 'rgba(37,99,235,0.15)', color: '#93C5FD', border: '1px solid rgba(37,99,235,0.2)', cursor: 'pointer' }}>
                      {p}
                    </button>
                  ))}
                </div>

                {/* Input */}
                <div className="p-3 flex gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <input
                    id="chatbot-input"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Ask anything about your contract..."
                    className="flex-1 text-sm outline-none bg-transparent"
                    style={{
                      padding: '0.625rem 1rem',
                      background: 'rgba(30,41,59,0.8)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '0.75rem',
                      color: '#F1F5F9',
                    }}
                  />
                  <button
                    id="chatbot-send"
                    onClick={sendMessage}
                    disabled={!input.trim() || typing}
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                    style={{
                      background: input.trim() ? 'linear-gradient(135deg, #2563EB, #06B6D4)' : 'rgba(37,99,235,0.2)',
                      cursor: input.trim() ? 'pointer' : 'not-allowed',
                    }}
                  >
                    <Send size={16} color="white" />
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
