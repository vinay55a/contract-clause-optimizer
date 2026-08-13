import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, GitCompare, CheckCircle, AlertTriangle } from 'lucide-react'
import { analysisAPI } from '../api/client'
import { toast } from 'react-toastify'

function DiffSection({ original, optimized, clauseType, riskLevel }) {
  const riskColor = riskLevel === 'high' ? '#EF4444' : riskLevel === 'medium' ? '#F59E0B' : '#10B981'

  return (
    <div className="glass-card p-5 mb-4">
      <div className="flex items-center gap-3 mb-4">
        <span className="font-semibold text-white">{clauseType}</span>
        <span className="text-xs px-2.5 py-1 rounded-full font-medium"
          style={{ background: `${riskColor}18`, color: riskColor, border: `1px solid ${riskColor}28` }}>
          {riskLevel} risk
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={14} style={{ color: '#EF4444' }} />
            <span className="text-xs font-medium" style={{ color: '#EF4444' }}>ORIGINAL</span>
          </div>
          <div className="p-3 rounded-xl text-sm diff-removed" style={{ color: '#CBD5E1', lineHeight: 1.7, fontFamily: 'monospace' }}>
            {original}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={14} style={{ color: '#10B981' }} />
            <span className="text-xs font-medium" style={{ color: '#10B981' }}>AI OPTIMIZED</span>
          </div>
          <div className="p-3 rounded-xl text-sm diff-added" style={{ color: '#CBD5E1', lineHeight: 1.7, fontFamily: 'monospace' }}>
            {optimized || '(No changes recommended)'}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ComparisonPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await analysisAPI.get(id)
        setData(res.data)
      } catch (err) {
        toast.error('Failed to load comparison data')
        navigate(`/analysis/${id}`)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(`/analysis/${id}`)} className="p-2 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: 'none', cursor: 'pointer', color: '#64748B' }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="section-title flex items-center gap-2">
            <GitCompare size={24} style={{ color: '#06B6D4' }} /> Side-by-Side Comparison
          </h1>
          <p className="section-subtitle">Original vs AI-optimized clauses</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mb-6 p-4 rounded-xl glass-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ background: 'rgba(239,68,68,0.3)', border: '2px solid #EF4444' }} />
          <span className="text-sm" style={{ color: '#94A3B8' }}>Original (may have issues)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ background: 'rgba(16,185,129,0.3)', border: '2px solid #10B981' }} />
          <span className="text-sm" style={{ color: '#94A3B8' }}>AI Optimized (improved)</span>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-40" />)}
        </div>
      ) : data?.clauses?.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p style={{ color: '#475569' }}>No clauses found. Please run analysis first.</p>
        </div>
      ) : (
        <div>
          {data.clauses.map((clause, i) => (
            <motion.div key={clause.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <DiffSection
                original={clause.clause_text}
                optimized={clause.optimized_text}
                clauseType={clause.clause_type}
                riskLevel={clause.risk_level}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
