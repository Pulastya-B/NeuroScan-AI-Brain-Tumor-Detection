import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Brain, AlertTriangle, CheckCircle, Clock, User, Stethoscope, Save, Download, Maximize2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import DashboardLayout from '../components/shared/DashboardLayout'
import { useAuth, api } from '../hooks/useAuth'
import { format } from 'date-fns'
import { Home, Upload, FileText, Users, ScanLine } from 'lucide-react'

const doctorNav = [
  { to: '/doctor', label: 'Dashboard', icon: Home },
  { to: '/doctor/scans', label: 'All Scans', icon: ScanLine },
  { to: '/doctor/patients', label: 'Patients', icon: Users },
  { to: '/doctor/upload', label: 'Upload Scan', icon: Upload },
]

const patientNav = [
  { to: '/patient', label: 'Dashboard', icon: Home },
  { to: '/patient/scans', label: 'My Scans', icon: ScanLine },
  { to: '/patient/upload', label: 'Upload Scan', icon: Upload },
  { to: '/patient/reports', label: 'Reports', icon: FileText },
]

const tumorColorMap = { brain_tumor: '#ef4444', eye: '#60a5fa', no_tumor: '#22c55e' }

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
        const color = tumorColorMap[box.class] || '#6366f1'
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

export default function ScanDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [scan, setScan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [saving, setSaving] = useState(false)
  const [severity, setSeverity] = useState('')
  const [fullscreen, setFullscreen] = useState(false)
  const resultImgRef = useRef(null)

  const isDoctor = user?.role === 'doctor'
  const navItems = isDoctor ? doctorNav : patientNav

  useEffect(() => {
    api.get(`/api/scans/${id}`).then(r => {
      setScan(r.data)
      setNotes(r.data.doctor_notes || '')
      setDiagnosis(r.data.doctor_diagnosis || '')
      setSeverity(r.data.doctor_severity || '')
    }).catch(() => toast.error('Scan not found')).finally(() => setLoading(false))
  }, [id])

  const handleReview = async () => {
    if (!notes.trim() || !diagnosis.trim()) {
      toast.error('Please fill in both notes and diagnosis')
      return
    }
    setSaving(true)
    try {
      const res = await api.put(`/api/scans/${id}/review`, { doctor_notes: notes, doctor_diagnosis: diagnosis, doctor_severity: severity })
      setScan(res.data)
      toast.success('Review saved and patient notified!')
    } catch { toast.error('Failed to save review') }
    finally { setSaving(false) }
  }

  const tumorColors = { brain_tumor: '#ef4444', eye: '#60a5fa', no_tumor: '#22c55e' }
  const tumorColor = scan?.tumor_type ? tumorColors[scan.tumor_type] || '#6366f1' : '#6366f1'

  return (
    <DashboardLayout navItems={navItems}>
      <div className="max-w-5xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-neutral-400 hover:text-white mb-6 text-sm group transition-colors">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back
        </button>

        {loading ? (
          <div className="grid lg:grid-cols-2 gap-6">
            {[1, 2].map(i => <div key={i} className="h-72 bg-white/5 rounded-2xl shimmer" />)}
          </div>
        ) : !scan ? (
          <div className="text-center py-20 text-neutral-500">Scan not found</div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left - Scan image & AI result */}
            <div className="space-y-5">
              {/* Scan image */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-strong rounded-2xl overflow-hidden">
                <div className="relative bg-black">
                  {scan.result_image_path ? (
                    <div className="relative">
                      <img
                        ref={resultImgRef}
                        src={`/${scan.result_image_path}`}
                        alt="MRI Scan Result"
                        className="w-full object-contain max-h-72"
                      />
                      {scan.bounding_boxes?.length > 0 && (
                        <BoundingBoxOverlay boxes={scan.bounding_boxes} imageRef={resultImgRef} />
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-64 flex items-center justify-center">
                      <div className="text-center text-neutral-600">
                        <Brain className="w-16 h-16 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">
                          {scan.status === 'processing' || scan.status === 'pending' ? 'AI analysis in progress...' : 'No result image available'}
                        </p>
                        {(scan.status === 'processing' || scan.status === 'pending') && (
                          <div className="mt-3 flex justify-center"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
                        )}
                      </div>
                    </div>
                  )}
                  {/* Scan line effect if processing */}
                  {(scan.status === 'processing') && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      <div className="scan-line" />
                    </div>
                  )}
                </div>
                <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-xs text-neutral-500 font-mono">{scan.original_filename}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-500">{format(new Date(scan.created_at), 'MMM d, yyyy')}</span>
                    {scan.result_image_path && (
                      <button onClick={() => setFullscreen(true)} className="p-1 rounded-lg hover:bg-white/5 transition-colors" title="View fullscreen">
                        <Maximize2 className="w-3.5 h-3.5 text-neutral-500" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* AI Detection Result */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="glass-strong rounded-2xl p-5"
              >
                <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-indigo-400" />
                  AI Detection Result
                </h3>
                {scan.status === 'completed' ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: `${tumorColor}15`, border: `1px solid ${tumorColor}30` }}>
                      {scan.tumor_detected ? <AlertTriangle className="w-6 h-6" style={{ color: tumorColor }} /> : <CheckCircle className="w-6 h-6 text-green-400" />}
                      <div>
                        <div className="font-semibold capitalize" style={{ color: tumorColor }}>
                          {scan.tumor_type?.replace('_', ' ') || 'Unknown'}
                        </div>
                        <div className="text-xs text-neutral-400">{scan.tumor_detected ? 'Tumor Detected' : 'No Tumor Found'}</div>
                      </div>
                      <div className="ml-auto text-right">
                        <div className="font-mono font-bold" style={{ color: tumorColor }}>
                          {scan.confidence ? `${(scan.confidence * 100).toFixed(1)}%` : '—'}
                        </div>
                        <div className="text-xs text-neutral-500">Confidence</div>
                      </div>
                    </div>

                    {/* Confidence bar */}
                    <div>
                      <div className="flex justify-between text-xs text-neutral-500 mb-1.5">
                        <span>Detection Confidence</span>
                        <span className="font-mono">{scan.confidence ? `${(scan.confidence * 100).toFixed(1)}%` : '—'}</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }} animate={{ width: `${(scan.confidence || 0) * 100}%` }}
                          transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                          className="h-full rounded-full"
                          style={{ background: `linear-gradient(90deg, ${tumorColor}80, ${tumorColor})` }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-neutral-400 text-sm">
                    <Clock className="w-5 h-5" />
                    {scan.status === 'pending' || scan.status === 'processing' ? 'Analysis in progress...' : `Status: ${scan.status}`}
                  </div>
                )}
              </motion.div>

              {/* Patient info */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="glass-strong rounded-2xl p-5"
              >
                <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-cyan-400" />
                  Patient
                </h3>
                <div className="text-sm text-neutral-300">{scan.patient_name || 'Unknown'}</div>
                {scan.doctor_name && (
                  <div className="text-sm text-neutral-400 mt-1 flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-indigo-400" />
                    Dr. {scan.doctor_name}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Right - Doctor review */}
            <div className="space-y-5">
              {/* Review status */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="glass-strong rounded-2xl p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-semibold flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-indigo-400" />
                    Doctor's Review
                  </h3>
                  <span className={`text-xs px-2.5 py-1 rounded-full border ${scan.is_reviewed ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30'}`}>
                    {scan.is_reviewed ? 'Reviewed' : 'Pending Review'}
                  </span>
                </div>

                {isDoctor ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">Urgency Level</label>
                      <div className="flex gap-2">
                        {[
                          { value: 'urgent', label: 'Urgent', color: '#ef4444' },
                          { value: 'routine', label: 'Routine', color: '#22c55e' },
                          { value: 'follow_up', label: 'Follow-up', color: '#f59e0b' },
                        ].map(opt => (
                          <button key={opt.value} type="button" onClick={() => setSeverity(opt.value)}
                            className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all border"
                            style={severity === opt.value
                              ? { background: `${opt.color}20`, border: `1px solid ${opt.color}50`, color: opt.color }
                              : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#9ca3af' }
                            }
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">Clinical Notes</label>
                      <textarea
                        value={notes} onChange={e => setNotes(e.target.value)} rows={4}
                        placeholder="Add your clinical observations about the scan..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500/60 transition-all resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">Diagnosis</label>
                      <textarea
                        value={diagnosis} onChange={e => setDiagnosis(e.target.value)} rows={3}
                        placeholder="Final diagnosis and recommended treatment..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500/60 transition-all resize-none"
                      />
                    </div>
                    <button
                      onClick={handleReview} disabled={saving}
                      className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
                      style={{ boxShadow: '0 0 20px rgba(99,102,241,0.3)' }}
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving...' : scan.is_reviewed ? 'Update Review' : 'Submit Review'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {scan.doctor_notes ? (
                      <>
                        <div>
                          <div className="text-xs text-neutral-500 mb-1.5 uppercase tracking-wider">Clinical Notes</div>
                          <div className="text-sm text-neutral-300 leading-relaxed p-3 bg-white/3 rounded-xl">{scan.doctor_notes}</div>
                        </div>
                        <div>
                          <div className="text-xs text-neutral-500 mb-1.5 uppercase tracking-wider">Diagnosis</div>
                          <div className="text-sm text-neutral-300 leading-relaxed p-3 bg-white/3 rounded-xl">{scan.doctor_diagnosis}</div>
                        </div>
                        {scan.reviewed_at && (
                          <div className="text-xs text-neutral-500">Reviewed {format(new Date(scan.reviewed_at), 'MMM d, yyyy · h:mm a')}</div>
                        )}                        {scan.doctor_severity && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                              scan.doctor_severity === 'urgent'
                                ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                : scan.doctor_severity === 'follow_up'
                                  ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                  : 'bg-green-500/20 text-green-400 border-green-500/30'
                            }`}>
                              {scan.doctor_severity.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Priority
                            </span>
                          </div>
                        )}                      </>
                    ) : (
                      <div className="text-sm text-neutral-500 text-center py-6">
                        <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        Awaiting doctor review
                      </div>
                    )}
                  </div>
                )}
              </motion.div>

              {/* Detection details */}
              {scan.bounding_boxes && scan.bounding_boxes.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                  className="glass-strong rounded-2xl p-5"
                >
                  <h3 className="font-display font-semibold mb-3 text-sm">Detection Details</h3>
                  <div className="space-y-2">
                    {scan.bounding_boxes.map((box, i) => (
                      <div key={i} className="flex items-center justify-between text-sm p-2 rounded-xl bg-white/3">
                        <span className="capitalize text-neutral-300">{box.class?.replace('_', ' ')}</span>
                        <span className="font-mono text-xs text-indigo-400">{(box.confidence * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen overlay */}
      {fullscreen && scan?.result_image_path && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setFullscreen(false)}
        >
          <button onClick={() => setFullscreen(false)}
            className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={`/${scan.result_image_path}`}
            alt="Detection result fullscreen"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </DashboardLayout>
  )
}
