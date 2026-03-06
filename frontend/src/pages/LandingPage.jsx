import { Suspense } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Brain, Shield, Zap, BarChart3, ArrowRight, CheckCircle, Stethoscope, Users, Activity, Lock } from 'lucide-react'
import { lazy } from 'react'

const BrainScene = lazy(() => import('../components/3d/BrainScene'))

/* shared viewport config – animate once, trigger early */
const vp = { once: true, amount: 0.15 }

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.7, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }
  })
}

const features = [
  { icon: Brain, title: 'AI-Powered Detection', desc: 'YOLO v8 model trained on thousands of MRI scans detects glioma, meningioma, and pituitary tumors with >94% accuracy.', color: '#6366f1' },
  { icon: Shield, title: 'Secure & HIPAA-Ready', desc: 'End-to-end encrypted data storage. Role-based access ensures only authorized personnel view patient records.', color: '#22d3ee' },
  { icon: Zap, title: 'Instant Analysis', desc: 'Results in under 30 seconds. Real-time notifications alert doctors and patients the moment analysis completes.', color: '#818cf8' },
  { icon: BarChart3, title: 'Comprehensive Reports', desc: 'Downloadable PDF reports with annotated scan images, detection confidence scores, and doctor diagnosis notes.', color: '#34d399' },
  { icon: Stethoscope, title: 'Doctor Workflow', desc: 'Dedicated doctor dashboard for reviewing scans, adding diagnoses, managing patient records, and tracking cases.', color: '#f472b6' },
  { icon: Lock, title: 'Role-Based Access', desc: 'Separate secure portals for doctors and patients. Each role sees only what they need with full audit logging.', color: '#fb923c' },
]

const stats = [
  { value: '94.7%', label: 'Detection Accuracy' },
  { value: '<30s', label: 'Analysis Time' },
  { value: '4', label: 'Tumor Types Detected' },
  { value: '100%', label: 'Secure & Encrypted' },
]

const tumorTypes = [
  { name: 'Glioma', desc: 'Most common malignant brain tumor', color: '#ef4444' },
  { name: 'Meningioma', desc: 'Arises from meninges membranes', color: '#f97316' },
  { name: 'Pituitary', desc: 'Affects hormonal regulation', color: '#eab308' },
  { name: 'No Tumor', desc: 'Healthy scan confirmation', color: '#22c55e' },
]

function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `linear-gradient(rgba(99,102,241,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.15) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#060614]/50 to-[#060614]" />
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#060614] text-white overflow-x-hidden font-body">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 glass-strong">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#22d3ee] flex items-center justify-center neural-glow">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight">
            Neuro<span className="gradient-text">Scan</span> AI
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-neutral-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
          <a href="#tumor-types" className="hover:text-white transition-colors">Detection</a>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm text-neutral-400 hover:text-white px-4 py-2 transition-colors">
            Sign In
          </Link>
          <Link to="/register" className="text-sm px-5 py-2.5 bg-gradient-to-r from-[#6366f1] to-[#4f46e5] rounded-xl hover:opacity-90 transition-opacity font-medium neural-glow">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center">
        <GridBackground />

        {/* 3D Brain - right side */}
        <div className="absolute right-0 top-0 bottom-0 w-full md:w-[55%] opacity-90">
          <Suspense fallback={<div className="w-full h-full" />}>
            <BrainScene />
          </Suspense>
        </div>

        {/* Radial glow behind brain – GPU-promoted layers */}
        <div className="absolute right-[10%] top-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#6366f1] opacity-10 blur-[100px] pointer-events-none" style={{ willChange: 'transform', transform: 'translateZ(0) translateY(-50%)' }} />
        <div className="absolute right-[20%] top-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-[#22d3ee] opacity-10 blur-[60px] pointer-events-none" style={{ willChange: 'transform', transform: 'translateZ(0) translateY(-50%)' }} />

        {/* Hero content */}
        <div className="relative z-10 px-8 md:px-16 lg:px-24 max-w-2xl pt-24">
          <motion.div
            initial="hidden" animate="visible" variants={fadeUp} custom={0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-[#6366f1]/30 text-xs text-[#818cf8] mb-6 font-mono"
          >
            <span className="w-2 h-2 rounded-full bg-[#22d3ee] animate-pulse" />
            AI-Powered Neuroimaging Platform
          </motion.div>

          <motion.h1
            initial="hidden" animate="visible" variants={fadeUp} custom={1}
            className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] mb-6"
          >
            Detect Brain<br />
            <span className="gradient-text">Tumors</span> with<br />
            AI Precision
          </motion.h1>

          <motion.p
            initial="hidden" animate="visible" variants={fadeUp} custom={2}
            className="text-lg text-neutral-400 mb-10 leading-relaxed"
          >
            Upload an MRI scan and get AI-powered tumor detection in seconds.
            Built for doctors and patients — with role-based access, real-time alerts,
            and comprehensive diagnostic reports.
          </motion.p>

          <motion.div
            initial="hidden" animate="visible" variants={fadeUp} custom={3}
            className="flex flex-wrap gap-4"
          >
            <Link
              to="/register?role=doctor"
              className="group flex items-center gap-2 px-7 py-4 bg-gradient-to-r from-[#6366f1] to-[#4f46e5] rounded-2xl font-semibold text-base hover:opacity-95 transition-all neural-glow"
            >
              <Stethoscope className="w-5 h-5" />
              Doctor Portal
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/register?role=patient"
              className="group flex items-center gap-2 px-7 py-4 glass border border-[#6366f1]/30 rounded-2xl font-semibold text-base hover:border-[#6366f1]/70 transition-all"
            >
              <Users className="w-5 h-5 text-[#22d3ee]" />
              Patient Portal
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial="hidden" animate="visible" variants={fadeUp} custom={4}
            className="flex flex-wrap gap-5 mt-10"
          >
            {['94.7% Accuracy', 'YOLO v8 Model', 'HIPAA Ready', '<30s Results'].map(badge => (
              <div key={badge} className="flex items-center gap-2 text-sm text-neutral-400">
                <CheckCircle className="w-4 h-4 text-[#22d3ee]" />
                {badge}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative py-16 px-8">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial="hidden" whileInView="visible" viewport={vp} variants={fadeUp} custom={i}
              className="glass-strong rounded-2xl p-6 text-center"
            >
              <div className="font-display text-4xl font-bold gradient-text mb-2">{stat.value}</div>
              <div className="text-sm text-neutral-400">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden" whileInView="visible" viewport={vp} variants={fadeUp}
            className="text-center mb-16"
          >
            <span className="text-sm text-[#818cf8] font-mono uppercase tracking-widest">Platform Features</span>
            <h2 className="font-display text-4xl md:text-5xl font-bold mt-3">
              Everything You Need for<br /><span className="gradient-text">Clinical AI Imaging</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feat, i) => (
              <motion.div
                key={feat.title}
                initial="hidden" whileInView="visible" viewport={vp} variants={fadeUp} custom={i * 0.1}
                className="glass-strong rounded-2xl p-6 hover:border-[#6366f1]/40 transition-all group cursor-default"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                  style={{ background: `${feat.color}20`, border: `1px solid ${feat.color}40` }}
                >
                  <feat.icon className="w-6 h-6" style={{ color: feat.color }} />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{feat.title}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-8 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#6366f1]/5 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial="hidden" whileInView="visible" viewport={vp} variants={fadeUp}
            className="text-center mb-16"
          >
            <span className="text-sm text-[#818cf8] font-mono uppercase tracking-widest">Workflow</span>
            <h2 className="font-display text-4xl font-bold mt-3">How NeuroScan AI Works</h2>
          </motion.div>

          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-[#6366f1] via-[#22d3ee] to-[#6366f1] opacity-40" />

            {[
              { step: '01', title: 'Register & Login', desc: 'Sign up as a Doctor or Patient. Each role gets a dedicated, secure dashboard with tailored features.', icon: Lock },
              { step: '02', title: 'Upload MRI Scan', desc: 'Patient or doctor uploads a brain MRI image (JPEG/PNG/DICOM). Scans are encrypted and stored securely.', icon: Activity },
              { step: '03', title: 'AI Detection Runs', desc: 'YOLO v8 model analyzes the scan in real-time, detecting tumors and classifying type with confidence scores.', icon: Brain },
              { step: '04', title: 'Doctor Reviews', desc: 'Doctor is notified, reviews the AI findings, adds clinical diagnosis notes, and confirms the report.', icon: Stethoscope },
              { step: '05', title: 'Patient Gets Results', desc: 'Patient receives a notification and can download a full PDF report with annotated scan and diagnosis.', icon: CheckCircle },
            ].map((step, i) => (
              <motion.div
                key={step.step}
                initial="hidden" whileInView="visible" viewport={vp} variants={fadeUp} custom={i * 0.1}
                className="flex gap-8 mb-10 relative"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-[#6366f1] to-[#22d3ee] flex items-center justify-center z-10 font-mono text-sm font-bold">
                  {step.step}
                </div>
                <div className="glass-strong rounded-2xl p-6 flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <step.icon className="w-5 h-5 text-[#22d3ee]" />
                    <h3 className="font-display font-semibold text-lg">{step.title}</h3>
                  </div>
                  <p className="text-neutral-400 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tumor Types */}
      <section id="tumor-types" className="py-24 px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden" whileInView="visible" viewport={vp} variants={fadeUp}
            className="text-center mb-16"
          >
            <span className="text-sm text-[#818cf8] font-mono uppercase tracking-widest">Detection Classes</span>
            <h2 className="font-display text-4xl font-bold mt-3">What Our AI Can Detect</h2>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {tumorTypes.map((t, i) => (
              <motion.div
                key={t.name}
                initial="hidden" whileInView="visible" viewport={vp} variants={fadeUp} custom={i * 0.1}
                className="glass-strong rounded-2xl p-6 text-center group hover:scale-105 transition-transform"
              >
                <div
                  className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
                  style={{ background: `${t.color}20`, border: `2px solid ${t.color}60` }}
                >
                  <div className="w-5 h-5 rounded-full" style={{ background: t.color, boxShadow: `0 0 12px ${t.color}` }} />
                </div>
                <h3 className="font-display font-semibold mb-1">{t.name}</h3>
                <p className="text-xs text-neutral-400">{t.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-8">
        <motion.div
          initial="hidden" whileInView="visible" viewport={vp} variants={fadeUp}
          className="max-w-3xl mx-auto text-center glass-strong rounded-3xl p-14 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#6366f1]/10 via-transparent to-[#22d3ee]/10 pointer-events-none" />
          <Brain className="w-14 h-14 mx-auto mb-6 text-[#6366f1]" style={{ filter: 'drop-shadow(0 0 20px #6366f1)' }} />
          <h2 className="font-display text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-neutral-400 mb-8 text-lg">Join NeuroScan AI and bring intelligent brain tumor detection to your practice or get your own scan analyzed.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/register?role=doctor" className="px-8 py-4 bg-gradient-to-r from-[#6366f1] to-[#4f46e5] rounded-2xl font-semibold hover:opacity-90 transition-opacity neural-glow">
              Register as Doctor
            </Link>
            <Link to="/register?role=patient" className="px-8 py-4 glass border border-[#6366f1]/30 rounded-2xl font-semibold hover:border-[#6366f1]/60 transition-all">
              Register as Patient
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-8 py-8 text-center text-sm text-neutral-500">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Brain className="w-4 h-4 text-[#6366f1]" />
          <span className="font-display font-semibold text-white">NeuroScan AI</span>
        </div>
        <p>Minor Project — Brain Tumor Detection using YOLO v8 & FastAPI</p>
      </footer>
    </div>
  )
}
