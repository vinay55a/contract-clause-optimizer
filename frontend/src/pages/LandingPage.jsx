import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Scale, ArrowRight, Shield, Zap, FileSearch, MessageSquare, Star, ChevronRight } from 'lucide-react'

const features = [
  { icon: FileSearch, title: 'Smart Clause Detection', desc: 'AI automatically identifies and classifies 12+ clause types with confidence scores', color: '#2563EB' },
  { icon: Shield, title: 'Risk Assessment', desc: 'Get a comprehensive contract health score with detailed risk breakdown per category', color: '#10B981' },
  { icon: Zap, title: 'AI Optimization', desc: 'Receive optimized rewrites, plain English explanations, and negotiation tips instantly', color: '#F59E0B' },
  { icon: MessageSquare, title: 'Legal AI Chatbot', desc: 'Chat with ClauseAI to analyze, explain, and improve any contract clause on demand', color: '#8B5CF6' },
]

const stats = [
  { value: '12+', label: 'Clause Types' },
  { value: '95%', label: 'Detection Accuracy' },
  { value: '100', label: 'Health Score Points' },
  { value: 'Gemini', label: 'AI Powered' },
]

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-hero text-white overflow-hidden">
      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background: '#2563EB' }} />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full opacity-8 blur-3xl" style={{ background: '#06B6D4' }} />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2563EB, #06B6D4)' }}>
            <Scale size={18} color="white" />
          </div>
          <span className="font-bold text-lg text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>ClauseAI</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/login')} className="btn-secondary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}>
            Sign In
          </button>
          <button onClick={() => navigate('/register')} className="btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}>
            Get Started Free
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 text-center py-24 px-6">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full text-sm font-medium"
            style={{ background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.3)', color: '#93C5FD' }}>
            <Star size={14} fill="#93C5FD" />
            Powered by Google Gemini AI
          </div>

          <h1 className="text-6xl font-extrabold mb-6 leading-tight" style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.03em' }}>
            Negotiate Contracts
            <br />
            <span style={{ background: 'linear-gradient(135deg, #2563EB, #06B6D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Like a Legal Expert
            </span>
          </h1>

          <p className="text-xl mb-10 max-w-2xl mx-auto" style={{ color: '#94A3B8', lineHeight: 1.8 }}>
            Upload any contract and get instant AI-powered clause analysis, risk assessment, 
            optimized rewrites, and negotiation strategies — all in one place.
          </p>

          <div className="flex items-center justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/register')}
              className="btn-primary text-base"
              style={{ padding: '0.875rem 2.5rem' }}
            >
              Analyze Your Contract Free <ArrowRight size={18} />
            </motion.button>
            <button onClick={() => navigate('/login')} className="btn-secondary text-base" style={{ padding: '0.875rem 2rem' }}>
              View Demo
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-12 mt-16 flex-wrap"
        >
          {stats.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', background: 'linear-gradient(135deg, #2563EB, #06B6D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{value}</p>
              <p className="text-sm mt-1" style={{ color: '#64748B' }}>{label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative z-10 py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Everything You Need</h2>
          <p style={{ color: '#64748B' }}>From upload to negotiation — AI handles the entire contract lifecycle</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map(({ icon: Icon, title, desc, color }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6 flex gap-4"
            >
              <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center"
                style={{ background: `${color}22`, border: `1px solid ${color}33` }}>
                <Icon size={22} color={color} />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm" style={{ color: '#64748B', lineHeight: 1.7 }}>{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-20 px-6 text-center">
        <div className="glass-card max-w-2xl mx-auto p-12" style={{ background: 'rgba(37,99,235,0.08)', borderColor: 'rgba(37,99,235,0.2)' }}>
          <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Ready to Review Your Contract?</h2>
          <p className="mb-8" style={{ color: '#94A3B8' }}>Join thousands of professionals using AI to negotiate better deals.</p>
          <button onClick={() => navigate('/register')} className="btn-primary text-lg" style={{ padding: '1rem 3rem' }}>
            Start For Free <ArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 text-center py-8" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', color: '#334155' }}>
        <p className="text-sm">© 2025 ClauseAI. AI-powered contract intelligence.</p>
      </footer>
    </div>
  )
}
