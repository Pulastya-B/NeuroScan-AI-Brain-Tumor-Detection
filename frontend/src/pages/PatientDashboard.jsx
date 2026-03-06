import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Upload, ScanLine, CheckCircle, Clock, Brain, Eye, AlertTriangle, FileText, Home } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import DashboardLayout from '../components/shared/DashboardLayout'
import { useAuth, api } from '../hooks/useAuth'
import { format } from 'date-fns'

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

function UploadZone({ onUpload }) {
  const [uploading, setUploading] = useState(false)
  const [doctors, setDoctors] = useState([])
  const [selectedDoctor, setSelectedDoctor] = useState('')

  useEffect(() => { api.get('/api/doctors/').then(r => setDoctors(r.data)).catch(() => {}) }, [])

  const onDrop = useCallback(async (files) => {
    if (!files.length) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', files[0])
      if (selectedDoctor) form.append('doctor_id', selectedDoctor)
      const res = await api.post('/api/scans/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Scan uploaded! AI analysis running...')
      onUpload(res.data)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }, [selectedDoctor, onUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': ['.jpg', '.jpeg', '.png'] }, maxFiles: 1, disabled: uploading
  })

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">Assign to Doctor (Optional)</label>
        <select value={selectedDoctor} onChange={e => setSelectedDoctor(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-indigo-500/60 transition-all"
        >
          <option value="">Select a doctor...</option>
          {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.full_name} {d.specialization ? `— ${d.specialization}` : ''}</option>)}
        </select>
      </div>

      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
          isDragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 hover:border-indigo-500/40 hover:bg-white/3'
        } ${uploading ? 'opacity-60 cursor-wait' : ''}`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            <p className="text-sm text-indigo-400">Uploading & analyzing...</p>
          </div>
        ) : (
          <>
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4">
              <Upload className="w-7 h-7 text-indigo-400" />
            </div>
            <p className="text-sm font-medium mb-1">{isDragActive ? 'Drop to upload' : 'Drop your MRI scan here'}</p>
            <p className="text-xs text-neutral-500">or click to browse · JPG, PNG · Max 10MB</p>
          </>
        )}
      </div>
    </div>
  )
}

function TumorResultBadge({ scan }) {
  if (!scan.tumor_detected && scan.status === 'completed') {
    return <span className="text-xs px-2.5 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">No Tumor</span>
  }
  if (scan.tumor_detected) {
    return <span className="text-xs px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 capitalize">{scan.tumor_type?.replace('_', ' ')}</span>
  }
  return <span className="text-xs px-2.5 py-1 rounded-full bg-neutral-500/20 text-neutral-400 border border-neutral-500/30 capitalize">{scan.status}</span>
}

export default function PatientDashboard() {
  const { user } = useAuth()
  const [scans, setScans] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadData = () => {
    Promise.all([api.get('/api/scans/'), api.get('/api/scans/stats')])
      .then(([s, st]) => { setScans(s.data); setStats(st.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])

  const handleUpload = (newScan) => {
    setScans(s => [newScan, ...s])
    setTimeout(loadData, 5000)
  }

  return (
    <DashboardLayout navItems={navItems}>
      <div className="max-w-6xl mx-auto">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-1">
            Hello, <span className="gradient-text">{user?.full_name?.split(' ')[0]}</span>
          </h1>
          <p className="text-neutral-400 text-sm">Upload your MRI scans and track your brain health</p>
        </motion.div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Scans', value: stats?.total_scans ?? '—', icon: ScanLine, color: '#6366f1' },
            { label: 'Reviewed', value: stats?.reviewed ?? '—', icon: CheckCircle, color: '#22c55e' },
            { label: 'Tumors Found', value: stats?.tumor_detected ?? '—', icon: AlertTriangle, color: '#ef4444' },
            { label: 'Pending', value: stats?.pending ?? '—', icon: Clock, color: '#f59e0b' },
          ].map((s, i) => (
            <motion.div key={s.label} initial="hidden" animate="visible" variants={fadeUp} custom={i}
              className="glass-strong rounded-2xl p-5"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${s.color}20`, border: `1px solid ${s.color}40` }}>
                <s.icon className="w-4.5 h-4.5" style={{ color: s.color }} />
              </div>
              <div className="font-display text-2xl font-bold mb-0.5">{s.value}</div>
              <div className="text-xs text-neutral-400">{s.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Upload zone */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4} className="lg:col-span-2 glass-strong rounded-2xl p-6">
            <h2 className="font-display font-semibold mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-indigo-400" />
              Upload New Scan
            </h2>
            <UploadZone onUpload={handleUpload} />
          </motion.div>

          {/* Scan history */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={5} className="lg:col-span-3 glass-strong rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <h2 className="font-display font-semibold">Scan History</h2>
              <Link to="/patient/scans" className="text-xs text-indigo-400 hover:text-indigo-300">View all →</Link>
            </div>
            <div className="divide-y divide-white/5">
              {loading ? (
                Array(4).fill(0).map((_, i) => <div key={i} className="px-6 py-4"><div className="h-12 bg-white/5 rounded-xl shimmer" /></div>)
              ) : scans.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-neutral-500">
                  <ScanLine className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm">No scans yet. Upload your first MRI!</p>
                </div>
              ) : scans.slice(0, 6).map(scan => (
                <Link key={scan.id} to={`/patient/scans/${scan.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-white/3 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    scan.tumor_detected ? 'bg-red-500/20 border border-red-500/30' : 'bg-green-500/20 border border-green-500/30'
                  }`}>
                    {scan.tumor_detected ? <AlertTriangle className="w-5 h-5 text-red-400" /> : <CheckCircle className="w-5 h-5 text-green-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{scan.original_filename}</div>
                    <div className="text-xs text-neutral-500">{format(new Date(scan.created_at), 'MMM d, yyyy · h:mm a')}</div>
                  </div>
                  <TumorResultBadge scan={scan} />
                  <div className="flex items-center gap-1 text-xs text-neutral-500">
                    {scan.is_reviewed ? <CheckCircle className="w-3.5 h-3.5 text-green-400" /> : <Clock className="w-3.5 h-3.5" />}
                    {scan.is_reviewed ? 'Reviewed' : 'Pending'}
                  </div>
                  <Eye className="w-4 h-4 text-neutral-600 flex-shrink-0" />
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  )
}
