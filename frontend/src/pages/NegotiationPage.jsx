import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Send, Sparkles, ChevronRight, MessageSquare, Loader } from 'lucide-react'
import { negotiationAPI, analysisAPI } from '../api/client'
import { toast } from 'react-toastify'

const QUICK_PROMPTS = [
  'Can I reduce the notice period?',
  'Is the payment clause fair?',
  'Suggest a better termination clause',
  'Rewrite this clause in simple English',
  'Compare buyer vs seller-friendly wording',
  'What are the main negotiation risks?',
]

function SuggestionCard({ text }) {
  return (
    <div className="flex items-start gap-2 p-3 rounded-xl text-sm" style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.12)', color: '#CBD5E1', lineHeight: 1.7 }}>
      <ChevronRight size={14} style={{ color: '#60A5FA', flexShrink: 0, marginTop: 3 }} />
      {text}
    </div>
  )
}

export default function NegotiationPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [prompt, setPrompt] = useState('')
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await negotiationAPI.getHistory(id)
        setHistory(res.data)
      } catch (err) {
        console.warn('No history yet')
      } finally {
        setLoadingHistory(false)
      }
    }
    loadHistory()
  }, [id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history])

  const sendPrompt = async (text) => {
    const p = text || prompt
    if (!p.trim() || loading) return
    setPrompt('')
    setLoading(true)

    // Optimistic UI
    const temp = { id: `temp-${Date.now()}`, user_prompt: p, ai_response: null, suggestions: [], created_at: new Date().toISOString() }
    setHistory(h => [...h, temp])

    try {
      const res = await negotiationAPI.suggest({ contract_id: parseInt(id), prompt: p })
      setHistory(h => h.map(item => item.id === temp.id ? res.data : item))
    } catch (err) {
      setHistory(h => h.filter(item => item.id !== temp.id))
      toast.error(err.response?.data?.detail || 'Failed to get suggestions')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in flex gap-6 h-[calc(100vh-8rem)]">
      {/* Sidebar */}
      <div className="w-72 flex-shrink-0 flex flex-col gap-4">
        <button onClick={() => navigate(`/analysis/${id}`)} className="flex items-center gap-2 text-sm"
          style={{ color: '#64748B', background: 'none', border: 'none', cursor: 'pointer' }}>
          <ArrowLeft size={16} /> Back to Analysis
        </button>

        <div className="glass-card p-5 flex-1 overflow-y-auto">
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2 text-sm">
            <Sparkles size={15} style={{ color: '#F59E0B' }} /> Quick Prompts
          </h3>
          <div className="space-y-2">
            {QUICK_PROMPTS.map(p => (
              <button key={p} onClick={() => sendPrompt(p)}
                className="w-full text-left p-3 rounded-xl text-xs transition-all"
                style={{ background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(255,255,255,0.04)', color: '#94A3B8', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(37,99,235,0.08)'; e.currentTarget.style.color = '#CBD5E1' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(30,41,59,0.6)'; e.currentTarget.style.color = '#94A3B8' }}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat */}
      <div className="flex-1 flex flex-col glass-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2563EB, #06B6D4)' }}>
            <MessageSquare size={18} color="white" />
          </div>
          <div>
            <h1 className="font-semibold text-white">AI Negotiation Assistant</h1>
            <p className="text-xs" style={{ color: '#64748B' }}>Ask anything about your contract negotiation</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {loadingHistory ? (
            <div className="space-y-4">
              {[1,2].map(i => <div key={i} className="skeleton h-24" />)}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-16">
              <Sparkles size={48} className="mx-auto mb-4" style={{ color: '#1E293B' }} />
              <p className="font-medium" style={{ color: '#334155' }}>Start Negotiating</p>
              <p className="text-sm mt-1" style={{ color: '#1E293B' }}>Ask any question about your contract terms</p>
            </div>
          ) : (
            history.map((item, i) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                {/* User prompt */}
                <div className="flex justify-end">
                  <div className="max-w-2xl px-4 py-3 rounded-2xl text-sm" style={{ background: 'linear-gradient(135deg, #2563EB, #06B6D4)', color: 'white' }}>
                    {item.user_prompt}
                  </div>
                </div>

                {/* AI response */}
                {item.ai_response === null ? (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-2xl w-fit" style={{ background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <Loader size={16} className="animate-spin" style={{ color: '#2563EB' }} />
                    <span className="text-sm" style={{ color: '#64748B' }}>Generating negotiation strategy...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-4 rounded-2xl text-sm" style={{ background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(255,255,255,0.06)', color: '#CBD5E1', lineHeight: 1.8 }}>
                      {item.ai_response}
                    </div>
                    {item.suggestions?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium mb-2" style={{ color: '#60A5FA' }}>Suggested Actions:</p>
                        <div className="space-y-2">
                          {item.suggestions.map((s, si) => <SuggestionCard key={si} text={s} />)}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex gap-3">
            <input
              id="negotiation-input"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendPrompt()}
              placeholder="Ask about any negotiation strategy, clause fairness, or alternative wording..."
              className="flex-1 input-field"
              disabled={loading}
            />
            <button
              id="negotiation-send"
              onClick={() => sendPrompt()}
              disabled={!prompt.trim() || loading}
              className="btn-primary"
              style={{ padding: '0.875rem 1.25rem', opacity: (!prompt.trim() || loading) ? 0.5 : 1 }}
            >
              {loading ? <Loader size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
