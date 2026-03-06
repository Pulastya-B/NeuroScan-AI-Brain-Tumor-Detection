import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Upload, ScanLine, CheckCircle, Clock, Brain, Eye, AlertTriangle, FileText, Home, ArrowRight, TrendingUp } from 'lucide-react'
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

const tumorColors = { brain_tumor: '#ef4444', eye: '#60a5fa', no_tumor: '#22c55e' }

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

  useEffect(() => {
    Promise.all([api.get('/api/scans/'), api.get('/api/scans/stats')])
      .then(([s, st]) => { setScans(s.data); setStats(st.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Recent tumor-detected scans for the "attention needed" card
  const recentTumors = scans.filter(s => s.tumor_detected && !s.is_reviewed).slice(0, 3)

  return (
    <DashboardLayout navItems={navItems}>
      <div className="max-w-6xl mx-auto">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-1">
            Hello, <span className="gradient-text">{user?.full_name?.split(' ')[0]}</span>
          </h1>
          <p className="text-neutral-400 text-sm">Track your brain health and scan results</p>
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
          {/* Quick actions + alerts */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upload CTA */}
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4}>
              <Link to="/patient/upload"
                className="block glass-strong rounded-2xl p-6 hover:border-indigo-500/30 border border-transparent transition-all group"
              >
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Upload className="w-7 h-7 text-indigo-400" />
                </div>
                <h3 className="font-display font-semibold mb-1 flex items-center gap-2">
                  Upload New Scan
                  <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform" />
                </h3>
                <p className="text-xs text-neutral-500">Drop an MRI scan for AI-powered tumor detection with bounding boxes</p>
              </Link>
            </motion.div>

            {/* Attention needed */}
            {recentTumors.length > 0 && (
              <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={5}
                className="glass-strong rounded-2xl p-5"
              >
                <h3 className="font-display font-semibold text-sm mb-3 flex items-center gap-2 text-red-400">
                  <AlertTriangle className="w-4 h-4" />
                  Needs Attention
                </h3>
                <div className="space-y-2">
                  {recentTumors.map(scan => {
                    const c = tumorColors[scan.tumor_type] || '#ef4444'
                    return (
                      <Link key={scan.id} to={`/patient/scans/${scan.id}`}
                        className="flex items-center gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 transition-colors"
                      >
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c }} />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate">{scan.original_filename}</div>
                          <div className="text-[10px] text-neutral-500 capitalize">{scan.tumor_type?.replace('_', ' ')} · {(scan.confidence * 100).toFixed(0)}%</div>
                        </div>
                        <Eye className="w-3.5 h-3.5 text-neutral-600" />
                      </Link>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* Quick links */}
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={6}
              className="grid grid-cols-2 gap-3"
            >
              <Link to="/patient/scans" className="glass-strong rounded-xl p-4 hover:bg-white/5 transition-colors text-center">
                <ScanLine className="w-5 h-5 mx-auto mb-2 text-cyan-400" />
                <span className="text-xs font-medium">My Scans</span>
              </Link>
              <Link to="/patient/reports" className="glass-strong rounded-xl p-4 hover:bg-white/5 transition-colors text-center">
                <FileText className="w-5 h-5 mx-auto mb-2 text-indigo-400" />
                <span className="text-xs font-medium">Reports</span>
              </Link>
            </motion.div>
          </div>

          {/* Recent scan history */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={5} className="lg:col-span-3 glass-strong rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <h2 className="font-display font-semibold">Recent Scans</h2>
              <Link to="/patient/scans" className="text-xs text-indigo-400 hover:text-indigo-300">View all →</Link>
            </div>
            <div className="divide-y divide-white/5">
              {loading ? (
                Array(4).fill(0).map((_, i) => <div key={i} className="px-6 py-4"><div className="h-12 bg-white/5 rounded-xl shimmer" /></div>)
              ) : scans.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-neutral-500">
                  <ScanLine className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm mb-3">No scans yet</p>
                  <Link to="/patient/upload" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                    <Upload className="w-3 h-3" /> Upload your first MRI
                  </Link>
                </div>
              ) : scans.slice(0, 6).map(scan => (
                <Link key={scan.id} to={`/patient/scans/${scan.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-white/3 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    scan.tumor_detected ? 'bg-red-500/20 border border-red-500/30' : scan.status === 'completed' ? 'bg-green-500/20 border border-green-500/30' : 'bg-neutral-500/20 border border-neutral-500/30'
                  }`}>
                    {scan.tumor_detected ? <AlertTriangle className="w-5 h-5 text-red-400" /> : scan.status === 'completed' ? <CheckCircle className="w-5 h-5 text-green-400" /> : <Clock className="w-5 h-5 text-neutral-400" />}
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
