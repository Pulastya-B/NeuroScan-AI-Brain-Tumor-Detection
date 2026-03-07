import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid, Legend,
} from 'recharts'
import {
  TrendingUp, Brain, CheckCircle, Users, Activity,
  ScanLine, AlertTriangle, Home, Upload,
} from 'lucide-react'
import DashboardLayout from '../components/shared/DashboardLayout'
import { api } from '../hooks/useAuth'

const navItems = [
  { to: '/doctor', label: 'Dashboard', icon: Home },
  { to: '/doctor/scans', label: 'All Scans', icon: ScanLine },
  { to: '/doctor/patients', label: 'Patients', icon: Users },
  { to: '/doctor/analytics', label: 'Analytics', icon: Activity },
  { to: '/doctor/upload', label: 'Upload Scan', icon: Upload },
]

const CHART_COLORS = ['#ef4444', '#22c55e', '#6366f1', '#f59e0b', '#06b6d4']

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.1 } }),
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0d0d2b] border border-white/10 rounded-xl px-4 py-2.5 text-xs shadow-2xl">
      {label && <div className="text-neutral-400 mb-1.5 font-medium">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-neutral-300">{p.name}:</span>
          <span className="font-mono font-bold text-white">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

function StatCard({ icon: Icon, value, label, sub, color, delay }) {
  return (
    <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={delay}
      className="glass-strong rounded-2xl p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <TrendingUp className="w-4 h-4 text-neutral-600" />
      </div>
      <div className="font-display text-3xl font-bold mb-0.5">{value}</div>
      <div className="text-xs text-neutral-400">{label}</div>
      {sub && <div className="text-[10px] text-neutral-600 mt-0.5">{sub}</div>}
    </motion.div>
  )
}

export default function Analytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/scans/analytics')
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <DashboardLayout navItems={navItems}>
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-32 bg-white/5 rounded-2xl shimmer" />
            ))}
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-72 bg-white/5 rounded-2xl shimmer" />
            <div className="h-72 bg-white/5 rounded-2xl shimmer" />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout navItems={navItems}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-1">Analytics</h1>
          <p className="text-neutral-400 text-sm">Platform-wide scan metrics and detection trends</p>
        </motion.div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={ScanLine} value={data?.total_scans ?? 0} label="Total Scans" color="#6366f1" delay={0} />
          <StatCard icon={AlertTriangle} value={`${data?.detection_rate ?? 0}%`} label="Detection Rate" sub="of completed scans" color="#ef4444" delay={1} />
          <StatCard icon={Brain} value={`${data?.avg_confidence ?? 0}%`} label="Avg Confidence" sub="AI model certainty" color="#06b6d4" delay={2} />
          <StatCard icon={CheckCircle} value={`${data?.review_rate ?? 0}%`} label="Review Rate" sub="doctor reviewed" color="#22c55e" delay={3} />
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Weekly Scans Bar Chart */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4}
            className="lg:col-span-2 glass-strong rounded-2xl p-6"
          >
            <h2 className="font-display font-semibold mb-1">Weekly Scan Volume</h2>
            <p className="text-xs text-neutral-500 mb-5">Uploads and detections over the last 8 weeks</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data?.weekly_scans || []} barGap={3} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="week" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#9ca3af', paddingTop: '12px' }} />
                <Bar dataKey="scans" name="Total Scans" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="tumors" name="Tumors Found" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Detection Type Distribution */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={5}
            className="glass-strong rounded-2xl p-6"
          >
            <h2 className="font-display font-semibold mb-1">Detection Breakdown</h2>
            <p className="text-xs text-neutral-500 mb-4">Distribution of AI detection results</p>
            {data?.type_distribution?.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={data.type_distribution}
                      cx="50%" cy="50%"
                      innerRadius={45} outerRadius={72}
                      paddingAngle={3} dataKey="value"
                    >
                      {data.type_distribution.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-3">
                  {data.type_distribution.map((d, i) => (
                    <div key={d.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <span className="text-neutral-400 text-xs">{d.name}</span>
                      </div>
                      <span className="font-mono text-xs text-neutral-300">
                        {d.value}&nbsp;
                        <span className="text-neutral-600">
                          ({data.total_scans ? Math.round(d.value / data.total_scans * 100) : 0}%)
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-neutral-500 text-sm">
                <Brain className="w-10 h-10 mb-3 opacity-30" />
                No completed scans yet
              </div>
            )}
          </motion.div>
        </div>

        {/* Summary Cards Row */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              label: 'Total Patients', icon: Users, color: '#818cf8',
              value: data?.total_patients ?? 0,
            },
            {
              label: 'Tumors Detected', icon: AlertTriangle, color: '#f87171',
              value: data?.total_positive ?? 0,
            },
            {
              label: 'Scans Reviewed',
              icon: CheckCircle, color: '#4ade80',
              value: data?.total_scans
                ? Math.round((data.review_rate / 100) * data.total_scans)
                : 0,
            },
          ].map((card, i) => (
            <motion.div key={card.label} initial="hidden" animate="visible"
              variants={fadeUp} custom={6 + i}
              className="glass-strong rounded-2xl p-5 flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${card.color}20`, border: `1px solid ${card.color}40` }}>
                <card.icon className="w-6 h-6" style={{ color: card.color }} />
              </div>
              <div>
                <div className="font-display font-bold text-2xl">{card.value}</div>
                <div className="text-xs text-neutral-400">{card.label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
