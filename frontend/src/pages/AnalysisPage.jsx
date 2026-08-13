import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, AlertTriangle, CheckCircle, ChevronDown, ChevronUp,
  Download, MessageSquare, GitCompare, ArrowLeft, FileText,
  Zap, TrendingUp, Info, ExternalLink
} from 'lucide-react'
import { analysisAPI, exportAPI } from '../api/client'
import { Doughnut, Radar } from 'react-chartjs-2'
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  RadialLinearScale, PointElement, LineElement, Filler
} from 'chart.js'
import { toast } from 'react-toastify'

ChartJS.register(ArcElement, Tooltip, Legend, RadialLinearScale, PointElement, LineElement, Filler)

function RiskBadge({ level }) {
  if (level === 'high') return <span className="badge-high"><AlertTriangle size={10} />High Risk</span>
  if (level === 'medium') return <span className="badge-medium">Medium Risk</span>
  return <span className="badge-low"><CheckCircle size={10} />Low Risk</span>
}

function ScoreRing({ score }) {
  const color = score >= 75 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444'
  const label = score >= 75 ? 'Healthy' : score >= 50 ? 'Moderate' : 'Risky'
  const circumference = 2 * Math.PI * 54
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r="54" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
        <circle cx="70" cy="70" r="54" fill="none" stroke={color} strokeWidth="12"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dashoffset 1s ease' }} />
        <text x="70" y="65" textAnchor="middle" fill="white" fontSize="28" fontWeight="bold" fontFamily="Outfit, sans-serif">{score}</text>
        <text x="70" y="85" textAnchor="middle" fill="#64748B" fontSize="11">/100</text>
      </svg>
      <p className="text-sm font-semibold mt-1" style={{ color }}>{label}</p>
    </div>
  )
}

function ClauseCard({ clause }) {
  const [expanded, setExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState('explanation')

  const tabs = [
    { key: 'explanation', label: 'Explanation' },
    { key: 'optimized', label: 'Optimized' },
    { key: 'versions', label: 'Versions' },
    { key: 'negotiation', label: 'Negotiate' },
  ]

  return (
    <motion.div
      layout
      className="glass-card overflow-hidden"
      style={{ borderColor: expanded ? 'rgba(37,99,235,0.2)' : 'rgba(255,255,255,0.07)' }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-4 p-5 text-left"
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <span className="font-semibold text-white">{clause.clause_type}</span>
            <RiskBadge level={clause.risk_level} />
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: '#64748B' }}>
              {Math.round((clause.confidence || 0) * 100)}% confidence
            </span>
          </div>
          <p className="text-sm line-clamp-2" style={{ color: '#64748B', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {clause.clause_text?.substring(0, 180)}...
          </p>
        </div>
        <div className="flex-shrink-0" style={{ color: '#475569' }}>
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {/* Tab bar */}
              <div className="flex gap-1 p-3 pb-0">
                {tabs.map(({ key, label }) => (
                  <button key={key} onClick={() => setActiveTab(key)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: activeTab === key ? 'rgba(37,99,235,0.2)' : 'transparent',
                      color: activeTab === key ? '#60A5FA' : '#475569',
                      border: 'none', cursor: 'pointer',
                    }}>
                    {label}
                  </button>
                ))}
              </div>

              <div className="p-5 pt-3 space-y-4">
                {/* Original text */}
                <div>
                  <p className="text-xs font-medium mb-2" style={{ color: '#475569' }}>ORIGINAL CLAUSE</p>
                  <div className="p-3 rounded-xl text-sm" style={{ background: 'rgba(15,23,42,0.5)', color: '#94A3B8', fontFamily: 'monospace', lineHeight: 1.7 }}>
                    {clause.clause_text}
                  </div>
                </div>

                {activeTab === 'explanation' && (
                  <div className="space-y-4">
                    {clause.explanation && (
                      <div>
                        <p className="text-xs font-medium mb-2 flex items-center gap-1.5" style={{ color: '#60A5FA' }}>
                          <Info size={12} /> Plain English Explanation
                        </p>
                        <p className="text-sm" style={{ color: '#CBD5E1', lineHeight: 1.7 }}>{clause.explanation}</p>
                      </div>
                    )}
                    {clause.why_risky && (
                      <div className="p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)' }}>
                        <p className="text-xs font-medium mb-1 flex items-center gap-1.5" style={{ color: '#FCA5A5' }}>
                          <AlertTriangle size={12} /> Why It's Risky
                        </p>
                        <p className="text-sm" style={{ color: '#CBD5E1', lineHeight: 1.7 }}>{clause.why_risky}</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'optimized' && clause.optimized_text && (
                  <div>
                    <p className="text-xs font-medium mb-2 flex items-center gap-1.5" style={{ color: '#10B981' }}>
                      <Zap size={12} /> AI Optimized Version
                    </p>
                    <div className="p-3 rounded-xl text-sm diff-added" style={{ color: '#CBD5E1', lineHeight: 1.7 }}>
                      {clause.optimized_text}
                    </div>
                    {clause.shorter_version && (
                      <div className="mt-3">
                        <p className="text-xs font-medium mb-2" style={{ color: '#60A5FA' }}>Shorter Version</p>
                        <div className="p-3 rounded-xl text-sm" style={{ background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.12)', color: '#CBD5E1', lineHeight: 1.7 }}>
                          {clause.shorter_version}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'versions' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {clause.client_favorable && (
                      <div>
                        <p className="text-xs font-medium mb-2" style={{ color: '#06B6D4' }}>🔵 Client-Favorable</p>
                        <div className="p-3 rounded-xl text-sm" style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.12)', color: '#CBD5E1', lineHeight: 1.7 }}>
                          {clause.client_favorable}
                        </div>
                      </div>
                    )}
                    {clause.vendor_favorable && (
                      <div>
                        <p className="text-xs font-medium mb-2" style={{ color: '#F59E0B' }}>🟡 Vendor-Favorable</p>
                        <div className="p-3 rounded-xl text-sm" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)', color: '#CBD5E1', lineHeight: 1.7 }}>
                          {clause.vendor_favorable}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'negotiation' && clause.negotiation_tip && (
                  <div className="p-4 rounded-xl" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
                    <p className="text-xs font-medium mb-2 flex items-center gap-1.5" style={{ color: '#C4B5FD' }}>
                      <TrendingUp size={12} /> Negotiation Strategy
                    </p>
                    <p className="text-sm" style={{ color: '#CBD5E1', lineHeight: 1.7 }}>{clause.negotiation_tip}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function AnalysisPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [filterRisk, setFilterRisk] = useState('all')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await analysisAPI.get(id)
        setData(res.data)
      } catch (err) {
        toast.error('Failed to load analysis. Make sure the contract has been analyzed.')
        navigate('/history')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleExport = async (type) => {
    setExporting(true)
    try {
      const res = type === 'pdf' ? await exportAPI.pdf(id) : await exportAPI.docx(id)
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `analysis.${type}`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`${type.toUpperCase()} downloaded!`)
    } catch {
      toast.error('Export failed')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="skeleton h-10 w-64" />
        <div className="skeleton h-48" />
        <div className="skeleton h-32" />
        <div className="skeleton h-32" />
      </div>
    )
  }

  if (!data) return null

  const filteredClauses = filterRisk === 'all'
    ? data.clauses
    : data.clauses.filter(c => c.risk_level === filterRisk)

  const radarData = {
    labels: ['Liability', 'Termination', 'Payment', 'Confidentiality', 'Disputes'],
    datasets: [{
      label: 'Score',
      data: [
        data.risk_breakdown?.liability_balance || 10,
        data.risk_breakdown?.termination_rights || 10,
        data.risk_breakdown?.payment_terms || 10,
        data.risk_breakdown?.confidentiality || 10,
        data.risk_breakdown?.dispute_resolution || 10,
      ],
      backgroundColor: 'rgba(37,99,235,0.15)',
      borderColor: '#2563EB',
      borderWidth: 2,
      pointBackgroundColor: '#2563EB',
    }],
  }

  const radarOptions = {
    scales: {
      r: {
        max: 20,
        min: 0,
        ticks: { color: '#475569', stepSize: 5, font: { size: 10 } },
        grid: { color: 'rgba(255,255,255,0.05)' },
        pointLabels: { color: '#94A3B8', font: { size: 11 } },
        angleLines: { color: 'rgba(255,255,255,0.05)' },
      },
    },
    plugins: { legend: { display: false } },
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/history')} className="p-2 rounded-xl transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)', border: 'none', cursor: 'pointer', color: '#64748B' }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="section-title">Contract Analysis</h1>
            <p className="section-subtitle">{data.total_clauses} clauses detected · AI-powered insights</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate(`/negotiation/${id}`)} className="btn-secondary" style={{ padding: '0.625rem 1.125rem', fontSize: '0.875rem' }}>
            <MessageSquare size={16} /> Negotiate
          </button>
          <button onClick={() => navigate(`/comparison/${id}`)} className="btn-secondary" style={{ padding: '0.625rem 1.125rem', fontSize: '0.875rem' }}>
            <GitCompare size={16} /> Compare
          </button>
          <div className="relative">
            <button onClick={() => handleExport('pdf')} disabled={exporting} className="btn-primary" style={{ padding: '0.625rem 1.125rem', fontSize: '0.875rem' }}>
              <Download size={16} /> Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* Score + Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Ring */}
        <div className="glass-card p-6 flex flex-col items-center text-center">
          <ScoreRing score={Math.round(data.risk_score)} />
          <p className="text-xs mt-4" style={{ color: '#475569' }}>Contract Health Score</p>
          <div className="grid grid-cols-3 gap-3 w-full mt-5">
            {[
              { label: 'High', count: data.high_risk_count, color: '#EF4444' },
              { label: 'Medium', count: data.medium_risk_count, color: '#F59E0B' },
              { label: 'Low', count: data.low_risk_count, color: '#10B981' },
            ].map(({ label, count, color }) => (
              <div key={label} className="text-center p-2 rounded-xl" style={{ background: `${color}12`, border: `1px solid ${color}22` }}>
                <p className="text-lg font-bold" style={{ color }}>{count}</p>
                <p className="text-xs" style={{ color: '#475569' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Radar Chart */}
        <div className="glass-card p-6">
          <h3 className="font-semibold text-white mb-4 text-sm">Category Breakdown</h3>
          <div style={{ height: 200 }}>
            <Radar data={radarData} options={radarOptions} />
          </div>
        </div>

        {/* Summary */}
        <div className="glass-card p-6">
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
            <FileText size={16} style={{ color: '#60A5FA' }} /> AI Summary
          </h3>
          <p className="text-sm" style={{ color: '#94A3B8', lineHeight: 1.8 }}>{data.summary}</p>
        </div>
      </div>

      {/* Clauses */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Detected Clauses ({filteredClauses.length})</h2>
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(15,23,42,0.6)' }}>
            {['all', 'high', 'medium', 'low'].map(r => (
              <button key={r} onClick={() => setFilterRisk(r)}
                className="px-3 py-1 rounded-lg text-xs font-medium transition-all capitalize"
                style={{
                  background: filterRisk === r ? 'rgba(37,99,235,0.2)' : 'transparent',
                  color: filterRisk === r ? '#60A5FA' : '#475569',
                  border: 'none', cursor: 'pointer',
                }}>
                {r}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          {filteredClauses.map((clause, i) => (
            <motion.div
              key={clause.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <ClauseCard clause={clause} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
