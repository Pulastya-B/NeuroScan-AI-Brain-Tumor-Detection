import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ScanLine, CheckCircle, Clock, AlertTriangle, Eye, Search, Filter, Home, Upload, FileText, Brain } from 'lucide-react'
import DashboardLayout from '../components/shared/DashboardLayout'
import { api } from '../hooks/useAuth'
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

const statusTabs = [
  { key: 'all', label: 'All Scans' },
  { key: 'completed', label: 'Completed' },
  { key: 'pending', label: 'Pending' },
  { key: 'tumor', label: 'Tumor Detected' },
  { key: 'clear', label: 'Clear' },
]

const tumorColors = { brain_tumor: '#ef4444', eye: '#60a5fa', no_tumor: '#22c55e' }

export default function MyScans() {
  const [scans, setScans] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/api/scans/')
      .then(r => setScans(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let list = scans
    if (activeTab === 'completed') list = list.filter(s => s.status === 'completed')
    else if (activeTab === 'pending') list = list.filter(s => s.status === 'pending' || s.status === 'processing')
    else if (activeTab === 'tumor') list = list.filter(s => s.tumor_detected === true)
    else if (activeTab === 'clear') list = list.filter(s => s.status === 'completed' && !s.tumor_detected)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(s =>
        s.original_filename?.toLowerCase().includes(q) ||
        s.tumor_type?.toLowerCase().includes(q) ||
        s.doctor_name?.toLowerCase().includes(q)
      )
    }
    return list
  }, [scans, activeTab, search])

  return (
    <DashboardLayout navItems={navItems}>
      <div className="max-w-6xl mx-auto">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="mb-6">
          <h1 className="font-display text-3xl font-bold mb-1">My Scans</h1>
          <p className="text-neutral-400 text-sm">View and manage all your MRI scan results</p>
        </motion.div>

        {/* Search and filters */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}
          className="flex flex-col md:flex-row gap-4 mb-6"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by filename, tumor type, or doctor..."
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500/60 transition-all"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {statusTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3.5 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                  activeTab === tab.key
                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                    : 'bg-white/5 text-neutral-400 border border-white/5 hover:bg-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Results count */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}
          className="text-xs text-neutral-500 mb-4"
        >
          {loading ? 'Loading...' : `${filtered.length} scan${filtered.length !== 1 ? 's' : ''} found`}
        </motion.div>

        {/* Scan grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-64 bg-white/5 rounded-2xl shimmer" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
            <ScanLine className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-sm mb-1">No scans found</p>
            <p className="text-xs text-neutral-600">
              {activeTab !== 'all' ? 'Try a different filter' : 'Upload your first MRI scan to get started'}
            </p>
            {activeTab === 'all' && (
              <Link to="/patient/upload" className="mt-4 px-4 py-2 bg-indigo-500/20 text-indigo-400 text-xs rounded-lg border border-indigo-500/30 hover:bg-indigo-500/30 transition-colors">
                Upload Scan
              </Link>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((scan, i) => {
              const color = tumorColors[scan.tumor_type] || '#6366f1'
              return (
                <motion.div
                  key={scan.id}
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                  custom={i * 0.5}
                >
                  <Link to={`/patient/scans/${scan.id}`}
                    className="block glass-strong rounded-2xl overflow-hidden hover:border-white/10 transition-all group"
                  >
                    {/* Scan thumbnail */}
                    <div className="relative bg-black/50 h-40 flex items-center justify-center overflow-hidden">
                      {scan.result_image_path ? (
                        <img
                          src={`/${scan.result_image_path}`}
                          alt="Scan result"
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <Brain className="w-12 h-12 text-neutral-700" />
                      )}
                      {/* Status overlay */}
                      {scan.status !== 'completed' && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <div className="text-center">
                            <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mx-auto mb-2" />
                            <span className="text-xs text-neutral-400 capitalize">{scan.status}...</span>
                          </div>
                        </div>
                      )}
                      {/* Tumor badge */}
                      {scan.status === 'completed' && (
                        <div className="absolute top-2 right-2">
                          <span
                            className="text-[10px] font-semibold px-2 py-1 rounded-full border capitalize"
                            style={{ background: `${color}20`, color, borderColor: `${color}40` }}
                          >
                            {scan.tumor_type?.replace('_', ' ') || 'Unknown'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium truncate max-w-[70%]">{scan.original_filename}</span>
                        {scan.confidence > 0 && (
                          <span className="text-xs font-mono" style={{ color }}>
                            {(scan.confidence * 100).toFixed(1)}%
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-neutral-500">
                          {format(new Date(scan.created_at), 'MMM d, yyyy')}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                          {scan.is_reviewed ? (
                            <>
                              <CheckCircle className="w-3 h-3 text-green-400" />
                              <span>Reviewed</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" />
                              <span>Pending</span>
                            </>
                          )}
                        </div>
                      </div>
                      {scan.doctor_name && (
                        <div className="mt-2 text-xs text-neutral-500">Dr. {scan.doctor_name}</div>
                      )}
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
