import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Brain, AlertTriangle, CheckCircle, Clock, Eye, Home, ScanLine, FileText, X, ZoomIn, Maximize2 } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import DashboardLayout from '../components/shared/DashboardLayout'
import { api } from '../hooks/useAuth'

const navItems = [
  { to: '/patient', label: 'Dashboard', icon: Home },
  { to: '/patient/scans', label: 'My Scans', icon: ScanLine },
  { to: '/patient/upload', label: 'Upload Scan', icon: Upload },
  { to: '/patient/reports', label: 'Reports', icon: FileText },
]

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.08 } })
}

const tumorColors = { brain_tumor: '#ef4444', eye: '#60a5fa', no_tumor: '#22c55e' }
const tumorDescriptions = {
  brain_tumor: 'A brain tumor has been detected in this MRI scan. Brain tumors can range from benign to malignant. Please consult your neurologist or neurosurgeon immediately for further evaluation, which may include additional imaging and biopsy.',
  no_tumor: 'No abnormal masses or tumors were detected in this MRI scan. The brain tissue appears normal based on the AI analysis. Regular checkups are recommended.',
}

function BoundingBoxOverlay({ boxes, imageRef }) {
  const [dims, setDims] = useState({ w: 0, h: 0, natW: 1, natH: 1 })

  useEffect(() => {
    const img = imageRef.current
    if (!img) return
    const update = () => {
      setDims({
        w: img.clientWidth,
        h: img.clientHeight,
        natW: img.naturalWidth || 1,
        natH: img.naturalHeight || 1,
      })
    }
    update()
    img.addEventListener('load', update)
    const ro = new ResizeObserver(update)
    ro.observe(img)
    return () => { img.removeEventListener('load', update); ro.disconnect() }
  }, [imageRef])

  if (!boxes?.length || dims.w === 0) return null

  const scaleX = dims.w / dims.natW
  const scaleY = dims.h / dims.natH

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 10 }}>
      {boxes.map((box, i) => {
        const [x1, y1, x2, y2] = box.bbox
        const color = tumorColors[box.class] || '#6366f1'
        return (
          <g key={i}>
            <rect
              x={x1 * scaleX} y={y1 * scaleY}
              width={(x2 - x1) * scaleX} height={(y2 - y1) * scaleY}
              fill="none" stroke={color} strokeWidth={2.5}
              strokeDasharray="6 3" rx={4}
            />
            <rect
              x={x1 * scaleX} y={y1 * scaleY - 22}
              width={Math.max(80, (box.class?.length || 6) * 8 + 50)}
              height={20} rx={4}
              fill={color} opacity={0.9}
            />
            <text
              x={x1 * scaleX + 6} y={y1 * scaleY - 7}
              fill="white" fontSize={11} fontWeight={600} fontFamily="monospace"
            >
              {box.class?.replace('_', ' ')} {(box.confidence * 100).toFixed(0)}%
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export default function UploadScan() {
  const [uploading, setUploading] = useState(false)
  const [doctors, setDoctors] = useState([])
  const [selectedDoctor, setSelectedDoctor] = useState('')
  const [result, setResult] = useState(null)
  const [polling, setPolling] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const resultImgRef = useRef(null)
  const originalImgRef = useRef(null)
  const pollTimer = useRef(null)
  const wsRef = useRef(null)

  useEffect(() => {
    api.get('/api/doctors/').then(r => setDoctors(r.data)).catch(() => {})
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current)
      if (wsRef.current) wsRef.current.close()
    }
  }, [])

  const pollScanResult = useCallback((scanId) => {
    setPolling(true)
    let attempts = 0
    pollTimer.current = setInterval(async () => {
      attempts++
      try {
        const res = await api.get(`/api/scans/${scanId}`)
        const scan = res.data
        if (scan.status === 'completed' || scan.status === 'failed') {
          clearInterval(pollTimer.current)
          setResult(scan)
          setPolling(false)
          if (scan.status === 'completed') {
            toast.success(scan.tumor_detected ? 'Analysis complete — tumor detected' : 'Analysis complete — no tumor found')
          } else {
            toast.error('Analysis failed. Please try again.')
          }
        }
      } catch { /* keep polling */ }
      if (attempts > 60) {
        clearInterval(pollTimer.current)
        setPolling(false)
        toast.error('Analysis timed out. Check My Scans later.')
      }
    }, 2000)
  }, [])

  // WebSocket-based real-time status — falls back to polling on error
  const connectScanWebSocket = useCallback((scanId) => {
    setPolling(true)
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const ws = new WebSocket(`${protocol}//${window.location.host}/api/scans/${scanId}/ws`)
      wsRef.current = ws

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.ping) return
          if (data.status === 'completed' || data.status === 'failed') {
            ws.close()
            const res = await api.get(`/api/scans/${scanId}`)
            setResult(res.data)
            setPolling(false)
            if (data.status === 'completed') {
              toast.success(res.data.tumor_detected ? 'Analysis complete — tumor detected' : 'Analysis complete — no tumor found')
            } else {
              toast.error('Analysis failed. Please try again.')
            }
          } else if (data.status) {
            setResult(prev => prev ? { ...prev, status: data.status } : prev)
          }
        } catch { /* ignore malformed frames */ }
      }

      ws.onerror = () => { ws.close(); pollScanResult(scanId) }
      ws.onclose = () => { wsRef.current = null }
    } catch {
      pollScanResult(scanId)
    }
  }, [pollScanResult])

  const onDrop = useCallback(async (files) => {
    if (!files.length) return
    setUploading(true)
    setResult(null)
    try {
      const form = new FormData()
      form.append('file', files[0])
      if (selectedDoctor) form.append('doctor_id', selectedDoctor)
      const res = await api.post('/api/scans/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      const scan = res.data
      toast.success('Scan uploaded! AI analysis running...')

      if (scan.status === 'completed') {
        setResult(scan)
      } else {
        setResult(scan)
        connectScanWebSocket(scan.id)
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }, [selectedDoctor, pollScanResult])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': ['.jpg', '.jpeg', '.png'] }, maxFiles: 1, disabled: uploading || polling
  })

  const resetUpload = () => {
    setResult(null)
    setPolling(false)
    if (pollTimer.current) clearInterval(pollTimer.current)
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null }
  }

  const tumorColor = result?.tumor_type ? tumorColors[result.tumor_type] || '#6366f1' : '#6366f1'

  return (
    <DashboardLayout navItems={navItems}>
      <div className="max-w-5xl mx-auto">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="mb-6">
          <h1 className="font-display text-3xl font-bold mb-1">Upload Scan</h1>
          <p className="text-neutral-400 text-sm">Upload an MRI scan for AI-powered tumor detection</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {!result ? (
            /* Upload Form */
            <motion.div key="upload" initial="hidden" animate="visible" exit={{ opacity: 0, y: -20 }} variants={fadeUp} custom={1}
              className="glass-strong rounded-2xl p-8 max-w-2xl mx-auto"
            >
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-2 uppercase tracking-wider">Assign to Doctor (Optional)</label>
                  <select value={selectedDoctor} onChange={e => setSelectedDoctor(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-indigo-500/60 transition-all"
                  >
                    <option value="">Select a doctor...</option>
                    {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.full_name} {d.specialization ? `— ${d.specialization}` : ''}</option>)}
                  </select>
                </div>

                <div
                  {...getRootProps()}
                  className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
                    isDragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 hover:border-indigo-500/40 hover:bg-white/3'
                  } ${uploading ? 'opacity-60 cursor-wait' : ''}`}
                >
                  <input {...getInputProps()} />
                  {uploading ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                      <div>
                        <p className="text-sm font-medium text-indigo-400 mb-1">Uploading & analyzing...</p>
                        <p className="text-xs text-neutral-500">This may take a few moments</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-6">
                        <Upload className="w-10 h-10 text-indigo-400" />
                      </div>
                      <p className="text-lg font-semibold mb-2">{isDragActive ? 'Drop to upload' : 'Drop your MRI scan here'}</p>
                      <p className="text-sm text-neutral-500 mb-4">or click to browse your files</p>
                      <div className="flex items-center justify-center gap-4 text-xs text-neutral-600">
                        <span>JPG, PNG</span>
                        <span className="w-1 h-1 rounded-full bg-neutral-700" />
                        <span>Max 10MB</span>
                        <span className="w-1 h-1 rounded-full bg-neutral-700" />
                        <span>Brain MRI</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            /* Result View */
            <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              {/* Action bar */}
              <div className="flex items-center justify-between mb-6">
                <button onClick={resetUpload}
                  className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Upload Another Scan
                </button>
                <Link to={`/patient/scans/${result.id}`}
                  className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  View Full Details
                </Link>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Left column – Images */}
                <div className="space-y-4">
                  {/* Result image with bounding boxes */}
                  <div className="glass-strong rounded-2xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                      <h3 className="font-display font-semibold text-sm flex items-center gap-2">
                        <Brain className="w-4 h-4 text-indigo-400" />
                        AI Detection Result
                      </h3>
                      <button onClick={() => setFullscreen(true)}
                        className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                        title="View fullscreen"
                      >
                        <Maximize2 className="w-4 h-4 text-neutral-500" />
                      </button>
                    </div>
                    <div className="relative bg-black">
                      {polling ? (
                        <div className="w-full h-64 flex items-center justify-center">
                          <div className="text-center">
                            <div className="w-12 h-12 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mx-auto mb-3" />
                            <p className="text-sm text-indigo-400 mb-1">AI analysis in progress...</p>
                            <p className="text-xs text-neutral-500">This usually takes 10-30 seconds</p>
                          </div>
                        </div>
                      ) : result.result_image_path ? (
                        <div className="relative">
                          <img
                            ref={resultImgRef}
                            src={`/${result.result_image_path}`}
                            alt="Detection result with bounding boxes"
                            className="w-full object-contain max-h-[400px]"
                          />
                          {/* SVG bounding box overlay for interactive boxes */}
                          {result.bounding_boxes?.length > 0 && (
                            <BoundingBoxOverlay boxes={result.bounding_boxes} imageRef={resultImgRef} />
                          )}
                        </div>
                      ) : (
                        <div className="w-full h-64 flex items-center justify-center text-neutral-600">
                          <Brain className="w-16 h-16 opacity-30" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Original image shown below */}
                  {result.file_path && (
                    <div className="glass-strong rounded-2xl overflow-hidden">
                      <div className="px-4 py-3 border-b border-white/5">
                        <h3 className="font-display font-semibold text-sm text-neutral-400">Original Upload</h3>
                      </div>
                      <div className="relative bg-black/50">
                        <img
                          ref={originalImgRef}
                          src={`/${result.file_path}`}
                          alt="Original MRI"
                          className="w-full object-contain max-h-48"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Right column – Analysis details */}
                <div className="space-y-4">
                  {/* Main result card */}
                  <div className="glass-strong rounded-2xl p-6">
                    <div className={`flex items-center gap-4 p-4 rounded-xl mb-5`}
                      style={{ background: `${tumorColor}15`, border: `1px solid ${tumorColor}30` }}
                    >
                      {result.tumor_detected ? (
                        <AlertTriangle className="w-8 h-8 flex-shrink-0" style={{ color: tumorColor }} />
                      ) : (
                        <CheckCircle className="w-8 h-8 flex-shrink-0 text-green-400" />
                      )}
                      <div className="flex-1">
                        <div className="font-display text-lg font-bold capitalize" style={{ color: tumorColor }}>
                          {result.tumor_type?.replace('_', ' ') || 'Unknown'}
                        </div>
                        <div className="text-sm text-neutral-400">
                          {result.tumor_detected ? 'Tumor Detected' : 'No Tumor Detected'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-2xl font-bold" style={{ color: tumorColor }}>
                          {result.confidence ? `${(result.confidence * 100).toFixed(1)}%` : '—'}
                        </div>
                        <div className="text-xs text-neutral-500">Confidence</div>
                      </div>
                    </div>

                    {/* Confidence bar */}
                    <div className="mb-5">
                      <div className="flex justify-between text-xs text-neutral-500 mb-1.5">
                        <span>Detection Confidence</span>
                        <span className="font-mono">{result.confidence ? `${(result.confidence * 100).toFixed(1)}%` : '—'}</span>
                      </div>
                      <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(result.confidence || 0) * 100}%` }}
                          transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                          className="h-full rounded-full"
                          style={{ background: `linear-gradient(90deg, ${tumorColor}80, ${tumorColor})` }}
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div className="text-sm text-neutral-400 leading-relaxed p-4 bg-white/3 rounded-xl">
                      {tumorDescriptions[result.tumor_type] || 'Analysis complete. Consult your doctor for professional evaluation.'}
                    </div>
                  </div>

                  {/* Bounding box details */}
                  {result.bounding_boxes?.length > 0 && (
                    <div className="glass-strong rounded-2xl p-6">
                      <h3 className="font-display font-semibold mb-4 text-sm flex items-center gap-2">
                        <Eye className="w-4 h-4 text-cyan-400" />
                        Detection Details
                      </h3>
                      <div className="space-y-2">
                        {result.bounding_boxes.map((box, i) => {
                          const c = tumorColors[box.class] || '#6366f1'
                          return (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/3">
                              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: c }} />
                              <span className="capitalize text-sm flex-1">{box.class?.replace('_', ' ')}</span>
                              <span className="font-mono text-xs" style={{ color: c }}>
                                {(box.confidence * 100).toFixed(1)}%
                              </span>
                              <span className="text-[10px] text-neutral-600 font-mono">
                                [{box.bbox?.map(v => Math.round(v)).join(', ')}]
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Review status */}
                  <div className="glass-strong rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-display font-semibold text-sm mb-1">Doctor Review</h3>
                        <p className="text-xs text-neutral-500">
                          {result.is_reviewed ? 'Your scan has been reviewed' : 'Awaiting doctor review'}
                        </p>
                      </div>
                      {result.is_reviewed ? (
                        <CheckCircle className="w-6 h-6 text-green-400" />
                      ) : (
                        <Clock className="w-6 h-6 text-neutral-600" />
                      )}
                    </div>
                    {result.doctor_name && (
                      <div className="mt-3 text-xs text-neutral-400">Assigned to Dr. {result.doctor_name}</div>
                    )}
                  </div>

                  {/* File info */}
                  <div className="glass-strong rounded-2xl p-6">
                    <h3 className="font-display font-semibold text-sm mb-3">File Information</h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between"><span className="text-neutral-500">Filename</span><span className="text-neutral-300 font-mono">{result.original_filename}</span></div>
                      <div className="flex justify-between"><span className="text-neutral-500">Scan ID</span><span className="text-neutral-300 font-mono">#{result.id}</span></div>
                      <div className="flex justify-between"><span className="text-neutral-500">Status</span><span className="capitalize text-neutral-300">{result.status}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fullscreen overlay */}
        <AnimatePresence>
          {fullscreen && result?.result_image_path && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
              onClick={() => setFullscreen(false)}
            >
              <button onClick={() => setFullscreen(false)}
                className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={`/${result.result_image_path}`}
                alt="Detection result fullscreen"
                className="max-w-full max-h-full object-contain"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  )
}
