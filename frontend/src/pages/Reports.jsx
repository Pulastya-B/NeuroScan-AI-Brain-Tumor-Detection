import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileText, Download, ScanLine, Home, Upload, CheckCircle, Clock, AlertTriangle, Brain, Printer, Eye } from 'lucide-react'
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

const tumorColors = { brain_tumor: '#ef4444', eye: '#60a5fa', no_tumor: '#22c55e' }

function ReportCard({ scan, index }) {
  const color = tumorColors[scan.tumor_type] || '#6366f1'

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>NeuroScan AI Report - Scan #${scan.id}</title>
        <style>
          body { font-family: 'Segoe UI', system-ui, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #1a1a2e; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #6366f1; padding-bottom: 16px; margin-bottom: 24px; }
          .logo { font-size: 24px; font-weight: 700; color: #6366f1; }
          .badge { padding: 6px 16px; border-radius: 20px; font-weight: 600; font-size: 14px; }
          .section { margin-bottom: 20px; }
          .section h3 { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-bottom: 8px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
          .field { padding: 10px; background: #f8f9fa; border-radius: 8px; }
          .field .label { font-size: 11px; color: #888; text-transform: uppercase; }
          .field .value { font-size: 14px; font-weight: 600; margin-top: 2px; }
          .confidence-bar { height: 8px; background: #e9ecef; border-radius: 8px; overflow: hidden; margin-top: 8px; }
          .confidence-fill { height: 100%; border-radius: 8px; }
          .result-img { max-width: 100%; border-radius: 12px; margin: 16px 0; border: 1px solid #e9ecef; }
          .notes { padding: 12px; background: #f0f4ff; border-radius: 8px; border-left: 3px solid #6366f1; }
          .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e9ecef; text-align: center; font-size: 11px; color: #999; }
          @media print { body { margin: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">NeuroScan AI</div>
          <div class="badge" style="background: ${color}20; color: ${color}">
            ${scan.tumor_detected ? 'TUMOR DETECTED' : 'CLEAR'}
          </div>
        </div>

        <div class="section">
          <h3>Scan Information</h3>
          <div class="grid">
            <div class="field"><div class="label">Scan ID</div><div class="value">#${scan.id}</div></div>
            <div class="field"><div class="label">Date</div><div class="value">${format(new Date(scan.created_at), 'MMMM d, yyyy · h:mm a')}</div></div>
            <div class="field"><div class="label">File</div><div class="value">${scan.original_filename}</div></div>
            <div class="field"><div class="label">Patient</div><div class="value">${scan.patient_name || 'N/A'}</div></div>
          </div>
        </div>

        <div class="section">
          <h3>AI Detection Result</h3>
          <div class="grid">
            <div class="field"><div class="label">Classification</div><div class="value" style="color: ${color}; text-transform: capitalize">${scan.tumor_type?.replace('_', ' ') || 'N/A'}</div></div>
            <div class="field"><div class="label">Confidence</div><div class="value">${scan.confidence ? (scan.confidence * 100).toFixed(1) + '%' : 'N/A'}</div></div>
          </div>
          <div class="confidence-bar"><div class="confidence-fill" style="width: ${(scan.confidence || 0) * 100}%; background: ${color}"></div></div>
        </div>

        ${scan.result_image_path ? `<div class="section"><h3>Annotated Scan</h3><img src="${window.location.origin}/${scan.result_image_path}" class="result-img" /></div>` : ''}

        ${scan.doctor_notes || scan.doctor_diagnosis ? `
          <div class="section">
            <h3>Doctor's Review</h3>
            ${scan.doctor_name ? `<p style="font-size: 13px; color: #666; margin-bottom: 8px;">Dr. ${scan.doctor_name} · ${scan.reviewed_at ? format(new Date(scan.reviewed_at), 'MMM d, yyyy') : ''}</p>` : ''}
            ${scan.doctor_notes ? `<div class="notes" style="margin-bottom: 12px"><strong>Clinical Notes:</strong><br/>${scan.doctor_notes}</div>` : ''}
            ${scan.doctor_diagnosis ? `<div class="notes"><strong>Diagnosis:</strong><br/>${scan.doctor_diagnosis}</div>` : ''}
          </div>
        ` : ''}

        <div class="footer">
          Generated by NeuroScan AI · ${format(new Date(), 'MMMM d, yyyy')} · This report is AI-generated and should be used for informational purposes only. Consult a medical professional for diagnosis.
        </div>
      </body>
      </html>
    `)
    printWindow.document.close()
    setTimeout(() => printWindow.print(), 500)
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={index * 0.5}
      className="glass-strong rounded-2xl overflow-hidden"
    >
      <div className="flex items-start gap-4 p-5">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}15`, border: `1px solid ${color}30` }}
        >
          {scan.tumor_detected ? (
            <AlertTriangle className="w-6 h-6" style={{ color }} />
          ) : (
            <CheckCircle className="w-6 h-6 text-green-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold truncate">{scan.original_filename}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full capitalize font-medium"
              style={{ background: `${color}20`, color, border: `1px solid ${color}30` }}
            >
              {scan.tumor_type?.replace('_', ' ')}
            </span>
          </div>
          <div className="text-xs text-neutral-500 mb-2">
            Scan #{scan.id} · {format(new Date(scan.created_at), 'MMM d, yyyy · h:mm a')}
            {scan.confidence > 0 && (
              <span className="ml-2 font-mono" style={{ color }}>{(scan.confidence * 100).toFixed(1)}% confidence</span>
            )}
          </div>
          {scan.doctor_diagnosis && (
            <div className="text-xs text-neutral-400 p-2 bg-white/3 rounded-lg mt-2 line-clamp-2">
              <strong className="text-neutral-300">Diagnosis:</strong> {scan.doctor_diagnosis}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link to={`/patient/scans/${scan.id}`}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors text-neutral-500 hover:text-white"
            title="View scan"
          >
            <Eye className="w-4 h-4" />
          </Link>
          <button onClick={handlePrint}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors text-neutral-500 hover:text-white"
            title="Print / Download report"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Review status bar */}
      <div className="px-5 py-2.5 border-t border-white/5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-neutral-500">
          {scan.is_reviewed ? (
            <>
              <CheckCircle className="w-3.5 h-3.5 text-green-400" />
              <span>Reviewed by Dr. {scan.doctor_name}</span>
            </>
          ) : (
            <>
              <Clock className="w-3.5 h-3.5" />
              <span>{scan.doctor_name ? `Assigned to Dr. ${scan.doctor_name}` : 'Awaiting review'}</span>
            </>
          )}
        </div>
        {scan.reviewed_at && (
          <span className="text-neutral-600">{format(new Date(scan.reviewed_at), 'MMM d, yyyy')}</span>
        )}
      </div>
    </motion.div>
  )
}

export default function Reports() {
  const [scans, setScans] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    api.get('/api/scans/')
      .then(r => setScans(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const completedScans = useMemo(() => {
    let list = scans.filter(s => s.status === 'completed')
    if (filter === 'reviewed') list = list.filter(s => s.is_reviewed)
    if (filter === 'tumor') list = list.filter(s => s.tumor_detected)
    if (filter === 'clear') list = list.filter(s => !s.tumor_detected)
    return list
  }, [scans, filter])

  const stats = useMemo(() => ({
    total: scans.filter(s => s.status === 'completed').length,
    reviewed: scans.filter(s => s.is_reviewed).length,
    tumors: scans.filter(s => s.tumor_detected).length,
    clear: scans.filter(s => s.status === 'completed' && !s.tumor_detected).length,
  }), [scans])

  return (
    <DashboardLayout navItems={navItems}>
      <div className="max-w-4xl mx-auto">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="mb-6">
          <h1 className="font-display text-3xl font-bold mb-1">Reports</h1>
          <p className="text-neutral-400 text-sm">View and print your scan analysis reports</p>
        </motion.div>

        {/* Summary row */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}
          className="grid grid-cols-4 gap-3 mb-6"
        >
          {[
            { label: 'Total Reports', value: stats.total, color: '#6366f1' },
            { label: 'Reviewed', value: stats.reviewed, color: '#22c55e' },
            { label: 'Tumors', value: stats.tumors, color: '#ef4444' },
            { label: 'Clear', value: stats.clear, color: '#22c55e' },
          ].map(s => (
            <div key={s.label} className="glass-strong rounded-xl p-3 text-center">
              <div className="font-display text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[10px] text-neutral-500 uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Filter tabs */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}
          className="flex gap-1.5 mb-6"
        >
          {[
            { key: 'all', label: 'All Reports' },
            { key: 'reviewed', label: 'Doctor Reviewed' },
            { key: 'tumor', label: 'Tumor Detected' },
            { key: 'clear', label: 'Clear' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setFilter(tab.key)}
              className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-all ${
                filter === tab.key
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                  : 'bg-white/5 text-neutral-400 border border-white/5 hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Reports list */}
        {loading ? (
          <div className="space-y-4">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-28 bg-white/5 rounded-2xl shimmer" />
            ))}
          </div>
        ) : completedScans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
            <FileText className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-sm mb-1">No reports available</p>
            <p className="text-xs text-neutral-600">
              {filter !== 'all' ? 'Try a different filter' : 'Completed scan analyses will appear here'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {completedScans.map((scan, i) => (
              <ReportCard key={scan.id} scan={scan} index={i} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
