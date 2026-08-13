import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, X, CheckCircle, Loader, FileUp, Type, AlertCircle } from 'lucide-react'
import { contractsAPI, analysisAPI } from '../api/client'
import { toast } from 'react-toastify'

const ACCEPTED = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
}

export default function UploadPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('file') // 'file' | 'text'
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')
  const [rawText, setRawText] = useState('')
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState('idle') // idle | uploading | analyzing | done | error
  const [contractId, setContractId] = useState(null)

  const onDrop = useCallback((accepted, rejected) => {
    if (rejected.length > 0) {
      toast.error('Unsupported file type. Use PDF, DOCX, or TXT')
      return
    }
    if (accepted[0]) {
      setFile(accepted[0])
      if (!title) setTitle(accepted[0].name.replace(/\.[^.]+$/, ''))
    }
  }, [title])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024,
  })

  const handleSubmit = async () => {
    if (!title.trim()) { toast.error('Please enter a contract title'); return }
    if (tab === 'file' && !file) { toast.error('Please select a file'); return }
    if (tab === 'text' && !rawText.trim()) { toast.error('Please paste contract text'); return }

    setStage('uploading')
    setProgress(20)

    try {
      const formData = new FormData()
      formData.append('title', title)
      if (tab === 'file' && file) formData.append('file', file)
      if (tab === 'text' && rawText) formData.append('raw_text', rawText)

      const uploadRes = await contractsAPI.upload(formData)
      const cId = uploadRes.data.id
      setContractId(cId)
      setProgress(50)

      setStage('analyzing')
      toast.info('Running AI analysis...')

      await analysisAPI.run(cId)
      setProgress(100)
      setStage('done')
      toast.success('Analysis complete!')

      setTimeout(() => navigate(`/analysis/${cId}`), 1200)
    } catch (err) {
      setStage('error')
      setProgress(0)
      toast.error(err.response?.data?.detail || 'Upload failed. Please try again.')
    }
  }

  const reset = () => {
    setFile(null)
    setTitle('')
    setRawText('')
    setProgress(0)
    setStage('idle')
    setContractId(null)
  }

  const isProcessing = stage === 'uploading' || stage === 'analyzing'

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="section-title">Upload Contract</h1>
        <p className="section-subtitle">Upload PDF, DOCX, or paste text for instant AI analysis</p>
      </div>

      {/* Progress overlay */}
      <AnimatePresence>
        {(isProcessing || stage === 'done') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="glass-card p-8 mb-6 text-center"
          >
            {stage === 'done' ? (
              <div>
                <CheckCircle size={48} className="mx-auto mb-3 text-emerald-400" style={{ color: '#10B981' }} />
                <p className="text-lg font-semibold text-white">Analysis Complete!</p>
                <p className="text-sm mt-1" style={{ color: '#64748B' }}>Redirecting to results...</p>
              </div>
            ) : (
              <div>
                <Loader size={40} className="mx-auto mb-4 animate-spin" style={{ color: '#2563EB' }} />
                <p className="text-lg font-semibold text-white mb-2">
                  {stage === 'uploading' ? 'Uploading & parsing contract...' : 'Running AI clause analysis...'}
                </p>
                <div className="progress-bar max-w-xs mx-auto mt-4">
                  <motion.div
                    className="progress-fill"
                    animate={{ width: `${progress}%` }}
                    style={{ background: 'linear-gradient(135deg, #2563EB, #06B6D4)' }}
                  />
                </div>
                <p className="text-sm mt-2" style={{ color: '#475569' }}>{progress}% complete</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!isProcessing && stage !== 'done' && (
        <div className="glass-card p-6">
          {/* Title */}
          <div className="mb-5">
            <label className="input-label">Contract Title *</label>
            <input id="contract-title" type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Software Development Agreement 2025" className="input-field" />
          </div>

          {/* Tab toggle */}
          <div className="flex gap-1 p-1 rounded-xl mb-5" style={{ background: 'rgba(15,23,42,0.6)' }}>
            {[
              { key: 'file', icon: FileUp, label: 'Upload File' },
              { key: 'text', icon: Type, label: 'Paste Text' },
            ].map(({ key, icon: Icon, label }) => (
              <button key={key} onClick={() => setTab(key)} id={`tab-${key}`}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: tab === key ? 'rgba(37,99,235,0.2)' : 'transparent',
                  color: tab === key ? '#60A5FA' : '#475569',
                  border: tab === key ? '1px solid rgba(37,99,235,0.3)' : '1px solid transparent',
                  cursor: 'pointer',
                }}>
                <Icon size={16} /> {label}
              </button>
            ))}
          </div>

          {/* File Drop */}
          {tab === 'file' && (
            <div>
              {file ? (
                <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)' }}>
                  <FileText size={32} style={{ color: '#60A5FA' }} />
                  <div className="flex-1">
                    <p className="font-medium text-white">{file.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>
                      {(file.size / 1024).toFixed(0)} KB · {file.type.includes('pdf') ? 'PDF' : file.type.includes('word') ? 'DOCX' : 'TXT'}
                    </p>
                  </div>
                  <button onClick={() => setFile(null)} style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`} id="dropzone">
                  <input {...getInputProps()} id="file-input" />
                  <Upload size={40} className="mx-auto mb-4" style={{ color: isDragActive ? '#2563EB' : '#334155' }} />
                  <p className="font-semibold text-white mb-1">
                    {isDragActive ? 'Drop your contract here' : 'Drag & drop your contract'}
                  </p>
                  <p className="text-sm mb-4" style={{ color: '#64748B' }}>or click to browse files</p>
                  <p className="text-xs" style={{ color: '#334155' }}>Supports PDF, DOCX, TXT · Max 20MB</p>
                </div>
              )}
            </div>
          )}

          {/* Text Input */}
          {tab === 'text' && (
            <div>
              <label className="input-label">Contract Text *</label>
              <textarea
                id="contract-text"
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                placeholder="Paste your full contract text here..."
                rows={12}
                className="input-field"
                style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '0.875rem', lineHeight: 1.7 }}
              />
              {rawText && (
                <p className="text-xs mt-2" style={{ color: '#475569' }}>
                  {rawText.split(/\s+/).filter(Boolean).length.toLocaleString()} words · ~{Math.ceil(rawText.split(/\s+/).filter(Boolean).length / 400)} pages
                </p>
              )}
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3 mt-6">
            <button id="analyze-btn" onClick={handleSubmit} className="btn-primary flex-1 justify-center text-base"
              style={{ padding: '0.875rem' }}>
              <Upload size={18} /> Analyze Contract with AI
            </button>
            {(file || rawText || title) && (
              <button onClick={reset} className="btn-secondary" style={{ padding: '0.875rem 1.25rem' }}>
                Reset
              </button>
            )}
          </div>

          {/* Info box */}
          <div className="mt-4 p-4 rounded-xl flex gap-3" style={{ background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.15)' }}>
            <AlertCircle size={16} style={{ color: '#60A5FA', flexShrink: 0, marginTop: 2 }} />
            <p className="text-xs" style={{ color: '#64748B', lineHeight: 1.7 }}>
              Your contract will be analyzed for clause types, risk levels, and optimization opportunities. 
              Analysis typically takes 5-15 seconds. Powered by AI with mock responses in development mode.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
