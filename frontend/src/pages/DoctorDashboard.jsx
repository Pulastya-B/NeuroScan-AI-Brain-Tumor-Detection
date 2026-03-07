import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Users, ScanLine, CheckCircle, Clock, AlertTriangle, Eye, Brain, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import DashboardLayout from '../components/shared/DashboardLayout'
import { useAuth, api } from '../hooks/useAuth'
import { Home, Upload, FileText, UserCheck, Activity } from 'lucide-react'
import { format } from 'date-fns'

const navItems = [
  { to: '/doctor', label: 'Dashboard', icon: Home },
  { to: '/doctor/scans', label: 'All Scans', icon: ScanLine },
  { to: '/doctor/patients', label: 'Patients', icon: Users },
  { to: '/doctor/analytics', label: 'Analytics', icon: Activity },
  { to: '/doctor/upload', label: 'Upload Scan', icon: Upload },
]

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e']
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.08 } })
}

function StatCard({ icon: Icon, value, label, color, delay }) {
  return (
    <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={delay}
      className="glass-strong rounded-2xl p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <TrendingUp className="w-4 h-4 text-neutral-600" />
      </div>
      <div className="font-display text-3xl font-bold mb-1">{value}</div>
      <div className="text-xs text-neutral-400">{label}</div>
    </motion.div>
  )
}

export default function DoctorDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [recentScans, setRecentScans] = useState([])
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/api/scans/stats'),
      api.get('/api/scans/all'),
      api.get('/api/patients/')
    ]).then(([statsRes, scansRes, patientsRes]) => {
      setStats(statsRes.data)
      setRecentScans(scansRes.data.slice(0, 6))
      setPatients(patientsRes.data)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const tumorDistribution = Object.entries(
    recentScans.reduce((acc, s) => {
      if (s.tumor_type) {
        const label = s.tumor_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        acc[label] = (acc[label] || 0) + 1
      }
      return acc
    }, {})
  ).map(([name, value]) => ({ name, value }))

  const statusBadge = (status) => {
    const map = {
      completed: 'bg-green-500/20 text-green-400 border-green-500/30',
      processing: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      pending: 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30',
      failed: 'bg-red-500/20 text-red-400 border-red-500/30',
    }
    return map[status] || map.pending
  }

  return (
    <DashboardLayout navItems={navItems}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-1">
            Good morning, <span className="gradient-text">Dr. {user?.full_name?.split(' ')[0]}</span>
          </h1>
          <p className="text-neutral-400 text-sm">{user?.specialization || 'Neurologist'} · {user?.hospital || 'NeuroScan Clinic'}</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Users} value={patients.length} label="Total Patients" color="#6366f1" delay={0} />
          <StatCard icon={ScanLine} value={stats?.total_scans ?? '—'} label="Total Scans" color="#22d3ee" delay={1} />
          <StatCard icon={AlertTriangle} value={stats?.tumor_detected ?? '—'} label="Tumors Detected" color="#ef4444" delay={2} />
          <StatCard icon={Clock} value={stats?.pending ?? '—'} label="Pending Review" color="#f59e0b" delay={3} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Recent Scans */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4} className="lg:col-span-2 glass-strong rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <h2 className="font-display font-semibold">Recent Scans</h2>
              <Link to="/doctor/scans" className="text-xs text-indigo-400 hover:text-indigo-300">View all →</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-neutral-500 text-xs uppercase">
                    <th className="text-left px-6 py-3">Patient</th>
                    <th className="text-left px-6 py-3">Result</th>
                    <th className="text-left px-6 py-3">Confidence</th>
                    <th className="text-left px-6 py-3">Status</th>
                    <th className="text-left px-6 py-3">Date</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array(4).fill(0).map((_, i) => (
                      <tr key={i} className="border-b border-white/5">
                        {Array(5).fill(0).map((_, j) => (
                          <td key={j} className="px-6 py-4"><div className="h-3 bg-white/5 rounded shimmer" /></td>
                        ))}
                      </tr>
                    ))
                  ) : recentScans.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-10 text-neutral-500">No scans yet</td></tr>
                  ) : recentScans.map(scan => (
                    <tr key={scan.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                      <td className="px-6 py-4 font-medium">{scan.patient_name || 'Unknown'}</td>
                      <td className="px-6 py-4">
                        <span className={`capitalize text-xs px-2 py-1 rounded-full border ${scan.tumor_detected ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-green-500/20 text-green-400 border-green-500/30'}`}>
                          {scan.tumor_type?.replace('_', ' ') || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-neutral-400 font-mono text-xs">
                        {scan.confidence ? `${(scan.confidence * 100).toFixed(1)}%` : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full border capitalize ${statusBadge(scan.status)}`}>{scan.status}</span>
                      </td>
                      <td className="px-6 py-4 text-neutral-500 text-xs">{format(new Date(scan.created_at), 'MMM d, yyyy')}</td>
                      <td className="px-6 py-4">
                        <Link to={`/doctor/scans/${scan.id}`} className="p-1.5 rounded-lg hover:bg-indigo-500/20 text-neutral-400 hover:text-indigo-400 transition-colors inline-flex">
                          <Eye className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Tumor distribution pie */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={5} className="glass-strong rounded-2xl p-6">
            <h2 className="font-display font-semibold mb-4">Detection Distribution</h2>
            {tumorDistribution.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={tumorDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {tumorDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1a1a3e', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {tumorDistribution.map((d, i) => (
                    <div key={d.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }} />
                        <span className="text-neutral-400">{d.name}</span>
                      </div>
                      <span className="font-mono text-xs">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-neutral-500 text-sm">
                <Brain className="w-10 h-10 mb-3 opacity-30" />
                No scan data yet
              </div>
            )}
          </motion.div>
        </div>

        {/* Patients list */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={6} className="glass-strong rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <h2 className="font-display font-semibold">Registered Patients</h2>
            <Link to="/doctor/patients" className="text-xs text-indigo-400 hover:text-indigo-300">View all →</Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {loading ? (
              Array(3).fill(0).map((_, i) => <div key={i} className="h-20 rounded-xl bg-white/5 shimmer" />)
            ) : patients.slice(0, 6).map(p => (
              <Link key={p.id} to={`/doctor/patients/${p.id}`}
                className="flex items-center gap-3 p-4 rounded-xl hover:bg-white/5 transition-colors border border-white/5 hover:border-indigo-500/30"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/30 to-cyan-500/30 flex items-center justify-center text-sm font-bold border border-indigo-500/20">
                  {p.full_name[0]}
                </div>
                <div>
                  <div className="text-sm font-medium">{p.full_name}</div>
                  <div className="text-xs text-neutral-500">{p.age ? `${p.age}y` : ''} {p.gender || ''} {p.blood_group || ''}</div>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
