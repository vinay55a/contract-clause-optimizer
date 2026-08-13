import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileText, Upload, TrendingUp, MessageSquare, Plus, ArrowRight, Clock, Shield, AlertTriangle, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { contractsAPI, authAPI } from '../api/client'
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { toast } from 'react-toastify'

ChartJS.register(ArcElement, Tooltip, Legend)

function StatCard({ icon: Icon, label, value, color, gradient, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass-card p-6 flex items-center gap-4"
      style={{ background: gradient }}
    >
      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}22`, border: `1px solid ${color}33` }}>
        <Icon size={22} color={color} />
      </div>
      <div>
        <p className="text-2xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>{value}</p>
        <p className="text-sm" style={{ color: '#64748B' }}>{label}</p>
      </div>
    </motion.div>
  )
}

function ContractRow({ contract, onClick }) {
  const riskColor = contract.risk_score >= 75 ? '#10B981' : contract.risk_score >= 50 ? '#F59E0B' : '#EF4444'
  const status = contract.status

  return (
    <div onClick={onClick} className="flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all"
      style={{ background: 'rgba(30,41,59,0.4)', border: '1px solid rgba(255,255,255,0.04)' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(37,99,235,0.06)'; e.currentTarget.style.borderColor = 'rgba(37,99,235,0.15)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(30,41,59,0.4)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)' }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.2)' }}>
        <FileText size={18} color="#60A5FA" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white truncate">{contract.title}</p>
        <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>
          {contract.word_count?.toLocaleString()} words · {new Date(contract.uploaded_at).toLocaleDateString()}
        </p>
      </div>
      <div className="flex items-center gap-3">
        {status === 'analyzed' && contract.risk_score != null && (
          <div className="text-right">
            <p className="text-sm font-semibold" style={{ color: riskColor }}>{contract.risk_score}/100</p>
            <p className="text-xs" style={{ color: '#475569' }}>Health</p>
          </div>
        )}
        <span className="text-xs px-2.5 py-1 rounded-full font-medium"
          style={{
            background: status === 'analyzed' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
            color: status === 'analyzed' ? '#6EE7B7' : '#FCD34D',
            border: `1px solid ${status === 'analyzed' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`,
          }}>
          {status}
        </span>
        <ArrowRight size={16} style={{ color: '#475569' }} />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [contracts, setContracts] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [contractsRes, statsRes] = await Promise.all([
          contractsAPI.list(0, 5),
          authAPI.getStats(),
        ])
        setContracts(contractsRes.data)
        setStats(statsRes.data)
      } catch (err) {
        toast.error('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const analyzed = contracts.filter(c => c.status === 'analyzed')
  const avgRisk = analyzed.length > 0
    ? Math.round(analyzed.reduce((s, c) => s + (c.risk_score || 0), 0) / analyzed.length)
    : null

  const chartData = {
    labels: ['High Risk', 'Medium Risk', 'Low Risk'],
    datasets: [{
      data: [
        analyzed.filter(c => c.risk_score < 40).length,
        analyzed.filter(c => c.risk_score >= 40 && c.risk_score < 70).length,
        analyzed.filter(c => c.risk_score >= 70).length,
      ],
      backgroundColor: ['rgba(239,68,68,0.8)', 'rgba(245,158,11,0.8)', 'rgba(16,185,129,0.8)'],
      borderColor: ['#EF4444', '#F59E0B', '#10B981'],
      borderWidth: 2,
    }],
  }

  const chartOptions = {
    plugins: { legend: { labels: { color: '#94A3B8', font: { size: 12 } } } },
    cutout: '70%',
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="section-title">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
            <span style={{ background: 'linear-gradient(135deg, #2563EB, #06B6D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {user?.name?.split(' ')[0]}
            </span> 👋
          </h1>
          <p className="section-subtitle">Here's your contract intelligence overview</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/upload')}
          id="dashboard-upload-btn"
          className="btn-primary"
        >
          <Plus size={18} /> New Contract
        </motion.button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={FileText} label="Total Contracts" value={loading ? '—' : (stats?.total_contracts ?? 0)} color="#2563EB" gradient="rgba(37,99,235,0.05)" delay={0} />
        <StatCard icon={Shield} label="Analyzed" value={loading ? '—' : (stats?.analyzed_contracts ?? 0)} color="#10B981" gradient="rgba(16,185,129,0.05)" delay={0.05} />
        <StatCard icon={TrendingUp} label="Avg Health Score" value={loading || avgRisk === null ? '—' : `${avgRisk}/100`} color="#F59E0B" gradient="rgba(245,158,11,0.05)" delay={0.1} />
        <StatCard icon={MessageSquare} label="AI Chats" value={loading ? '—' : (stats?.total_chats ?? 0)} color="#8B5CF6" gradient="rgba(139,92,246,0.05)" delay={0.15} />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Recent Contracts */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Clock size={18} style={{ color: '#60A5FA' }} /> Recent Contracts
            </h2>
            <button onClick={() => navigate('/history')} className="text-sm font-medium" style={{ color: '#60A5FA', background: 'none', border: 'none', cursor: 'pointer' }}>
              View all →
            </button>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="skeleton h-16" />)}
            </div>
          ) : contracts.length === 0 ? (
            <div className="text-center py-12">
              <FileText size={40} className="mx-auto mb-3" style={{ color: '#1E293B' }} />
              <p className="font-medium" style={{ color: '#334155' }}>No contracts yet</p>
              <p className="text-sm mt-1" style={{ color: '#1E293B' }}>Upload your first contract to get started</p>
              <button onClick={() => navigate('/upload')} className="btn-primary mt-4 text-sm" style={{ padding: '0.5rem 1.5rem' }}>
                <Upload size={16} /> Upload Contract
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {contracts.map(c => (
                <ContractRow
                  key={c.id}
                  contract={c}
                  onClick={() => c.status === 'analyzed' ? navigate(`/analysis/${c.id}`) : navigate('/upload')}
                />
              ))}
            </div>
          )}
        </div>

        {/* Risk Distribution Chart */}
        <div className="glass-card p-6">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Shield size={18} style={{ color: '#10B981' }} /> Risk Distribution
          </h2>
          {analyzed.length > 0 ? (
            <div>
              <div className="relative flex items-center justify-center mb-6" style={{ height: 180 }}>
                <Doughnut data={chartData} options={chartOptions} />
                {avgRisk !== null && (
                  <div className="absolute text-center">
                    <p className="text-2xl font-bold text-white">{avgRisk}</p>
                    <p className="text-xs" style={{ color: '#64748B' }}>Avg Score</p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                {[
                  { label: 'High Risk (< 40)', color: '#EF4444', count: analyzed.filter(c => c.risk_score < 40).length },
                  { label: 'Medium Risk (40-70)', color: '#F59E0B', count: analyzed.filter(c => c.risk_score >= 40 && c.risk_score < 70).length },
                  { label: 'Low Risk (> 70)', color: '#10B981', count: analyzed.filter(c => c.risk_score >= 70).length },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                      <span className="text-xs" style={{ color: '#94A3B8' }}>{item.label}</span>
                    </div>
                    <span className="text-sm font-medium" style={{ color: item.color }}>{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <TrendingUp size={36} className="mx-auto mb-3" style={{ color: '#1E293B' }} />
              <p className="text-sm" style={{ color: '#334155' }}>Analyze contracts to see distribution</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass-card p-6">
        <h2 className="font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Upload, label: 'Upload Contract', desc: 'PDF, DOCX, or text', color: '#2563EB', action: () => navigate('/upload') },
            { icon: FileText, label: 'View History', desc: 'Past analyses', color: '#10B981', action: () => navigate('/history') },
            { icon: MessageSquare, label: 'AI Chatbot', desc: 'Ask legal questions', color: '#8B5CF6', action: () => {} },
            { icon: Shield, label: 'Risk Guide', desc: 'Understanding scores', color: '#F59E0B', action: () => {} },
          ].map(({ icon: Icon, label, desc, color, action }) => (
            <button key={label} onClick={action} className="text-left p-4 rounded-xl transition-all"
              style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}33` }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)' }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                style={{ background: `${color}18`, border: `1px solid ${color}28` }}>
                <Icon size={18} color={color} />
              </div>
              <p className="text-sm font-medium text-white">{label}</p>
              <p className="text-xs mt-0.5" style={{ color: '#475569' }}>{desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
