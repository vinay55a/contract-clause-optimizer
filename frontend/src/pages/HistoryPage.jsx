import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileText, Search, Trash2, ArrowRight, Shield, Calendar, AlertTriangle, CheckCircle } from 'lucide-react'
import { contractsAPI } from '../api/client'
import { toast } from 'react-toastify'

export default function HistoryPage() {
  const navigate = useNavigate()
  const [contracts, setContracts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await contractsAPI.list(0, 50)
        setContracts(res.data)
      } catch {
        toast.error('Failed to load contracts')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    if (!confirm('Delete this contract and all its analysis data?')) return
    setDeleting(id)
    try {
      await contractsAPI.delete(id)
      setContracts(c => c.filter(x => x.id !== id))
      toast.success('Contract deleted')
    } catch {
      toast.error('Failed to delete')
    } finally {
      setDeleting(null)
    }
  }

  const filtered = contracts.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    (c.file_name && c.file_name.toLowerCase().includes(search.toLowerCase()))
  )

  const getRiskColor = (score) => score >= 75 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444'

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="section-title">Contract History</h1>
          <p className="section-subtitle">{contracts.length} contracts total</p>
        </div>
        <button onClick={() => navigate('/upload')} className="btn-primary">
          + New Contract
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
        <input
          id="history-search"
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search contracts..."
          className="input-field"
          style={{ paddingLeft: '2.75rem' }}
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-24" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <FileText size={48} className="mx-auto mb-4" style={{ color: '#1E293B' }} />
          <p className="text-lg font-semibold" style={{ color: '#334155' }}>
            {search ? 'No contracts match your search' : 'No contracts yet'}
          </p>
          <p className="text-sm mt-2 mb-6" style={{ color: '#1E293B' }}>
            {search ? 'Try a different search term' : 'Upload your first contract to get started'}
          </p>
          {!search && (
            <button onClick={() => navigate('/upload')} className="btn-primary" style={{ padding: '0.625rem 1.5rem' }}>
              Upload Contract
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((contract, i) => (
            <motion.div
              key={contract.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="glass-card p-5 flex items-center gap-4 cursor-pointer"
              onClick={() => contract.status === 'analyzed' && navigate(`/analysis/${contract.id}`)}
              style={{ cursor: contract.status === 'analyzed' ? 'pointer' : 'default' }}
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.2)' }}>
                <FileText size={20} style={{ color: '#60A5FA' }} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">{contract.title}</p>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="text-xs flex items-center gap-1" style={{ color: '#475569' }}>
                    <Calendar size={11} /> {new Date(contract.uploaded_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                  {contract.word_count > 0 && (
                    <span className="text-xs" style={{ color: '#475569' }}>{contract.word_count.toLocaleString()} words</span>
                  )}
                  {contract.file_name && (
                    <span className="text-xs" style={{ color: '#475569' }}>{contract.file_name}</span>
                  )}
                </div>
              </div>

              {/* Risk Score */}
              {contract.status === 'analyzed' && contract.risk_score != null && (
                <div className="text-right flex-shrink-0">
                  <p className="text-xl font-bold" style={{ color: getRiskColor(contract.risk_score), fontFamily: 'Outfit, sans-serif' }}>
                    {Math.round(contract.risk_score)}
                  </p>
                  <p className="text-xs" style={{ color: '#475569' }}>health</p>
                </div>
              )}

              {/* Status */}
              <span className="text-xs px-3 py-1.5 rounded-full font-medium flex-shrink-0"
                style={{
                  background: contract.status === 'analyzed' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                  color: contract.status === 'analyzed' ? '#6EE7B7' : '#FCD34D',
                  border: `1px solid ${contract.status === 'analyzed' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`,
                }}>
                {contract.status === 'analyzed' ? <CheckCircle size={11} className="inline mr-1" /> : <AlertTriangle size={11} className="inline mr-1" />}
                {contract.status}
              </span>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {contract.status === 'analyzed' && (
                  <ArrowRight size={16} style={{ color: '#475569' }} />
                )}
                <button
                  onClick={(e) => handleDelete(contract.id, e)}
                  disabled={deleting === contract.id}
                  className="p-2 rounded-lg transition-colors"
                  style={{ color: '#475569', background: 'none', border: 'none', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
                  onMouseLeave={e => e.currentTarget.style.color = '#475569'}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
