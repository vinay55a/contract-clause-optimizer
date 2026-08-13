import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Calendar, FileText, Shield, MessageSquare, TrendingUp } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../api/client'

export default function ProfilePage() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    authAPI.getStats().then(r => setStats(r.data)).catch(() => {})
  }, [])

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <h1 className="section-title mb-8">My Profile</h1>

      {/* Avatar + Info */}
      <div className="glass-card p-8 mb-6 flex items-center gap-6">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white flex-shrink-0"
          style={{ background: user?.avatar_color || '#2563EB' }}>
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>{user?.name}</h2>
          <div className="flex items-center gap-2 mt-1" style={{ color: '#64748B' }}>
            <Mail size={14} /> <span className="text-sm">{user?.email}</span>
          </div>
          <div className="flex items-center gap-2 mt-1" style={{ color: '#64748B' }}>
            <Calendar size={14} />
            <span className="text-sm">
              Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Usage Stats */}
      <div className="glass-card p-6 mb-6">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp size={16} style={{ color: '#60A5FA' }} /> Usage Statistics
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: FileText, label: 'Contracts', value: stats?.total_contracts ?? '—', color: '#2563EB' },
            { icon: Shield, label: 'Analyzed', value: stats?.analyzed_contracts ?? '—', color: '#10B981' },
            { icon: MessageSquare, label: 'AI Chats', value: stats?.total_chats ?? '—', color: '#8B5CF6' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="text-center p-4 rounded-xl" style={{ background: `${color}10`, border: `1px solid ${color}20` }}>
              <Icon size={20} className="mx-auto mb-2" style={{ color }} />
              <p className="text-2xl font-bold" style={{ color, fontFamily: 'Outfit, sans-serif' }}>{value}</p>
              <p className="text-xs mt-1" style={{ color: '#475569' }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* API Config */}
      <div className="glass-card p-6">
        <h3 className="font-semibold text-white mb-4">API Configuration</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(15,23,42,0.5)' }}>
            <div>
              <p className="text-sm font-medium text-white">Gemini API</p>
              <p className="text-xs" style={{ color: '#475569' }}>Google Gemini AI integration</p>
            </div>
            <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(245,158,11,0.12)', color: '#FCD34D', border: '1px solid rgba(245,158,11,0.2)' }}>
              Mock Mode
            </span>
          </div>
          <p className="text-xs" style={{ color: '#334155' }}>
            To enable real AI, add your GEMINI_API_KEY to the backend .env file and set USE_MOCK_AI=false.
          </p>
        </div>
      </div>
    </div>
  )
}
