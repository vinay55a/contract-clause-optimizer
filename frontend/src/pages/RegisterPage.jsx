import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Scale, Mail, Lock, User, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-toastify'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      await register(form.name, form.email, form.password)
      toast.success('Account created! Welcome to ClauseAI 🎉')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #0f1f3a 100%)' }}>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background: '#06B6D4' }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="glass-card p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'linear-gradient(135deg, #2563EB, #06B6D4)' }}>
              <Scale size={28} color="white" />
            </div>
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>Create your account</h1>
            <p className="text-sm mt-1" style={{ color: '#64748B' }}>Start analyzing contracts with AI today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="input-label">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
                <input id="register-name" type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="John Smith" className="input-field" style={{ paddingLeft: '2.5rem' }} required />
              </div>
            </div>

            <div>
              <label className="input-label">Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
                <input id="register-email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="you@example.com" className="input-field" style={{ paddingLeft: '2.5rem' }} required />
              </div>
            </div>

            <div>
              <label className="input-label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
                <input id="register-password" type={showPw ? 'text' : 'password'} value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Min. 6 characters" className="input-field" style={{ paddingLeft: '2.5rem', paddingRight: '2.75rem' }} required />
                <button type="button" onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#475569', background: 'none', border: 'none', cursor: 'pointer' }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button id="register-submit" type="submit" disabled={loading} className="btn-primary w-full justify-center text-base"
              style={{ opacity: loading ? 0.7 : 1, marginTop: '0.5rem' }}>
              {loading ? 'Creating account...' : <>Create Account <ArrowRight size={18} /></>}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: '#475569' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-medium" style={{ color: '#60A5FA' }}>Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
