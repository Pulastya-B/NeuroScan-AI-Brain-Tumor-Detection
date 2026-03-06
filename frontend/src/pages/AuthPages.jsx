import { useState, useEffect, Suspense, lazy } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Stethoscope, User, Mail, Lock, Eye, EyeOff, Phone, Award, Building, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'

const BrainScene = lazy(() => import('../components/3d/BrainScene'))

function InputField({ label, type = 'text', value, onChange, placeholder, icon: Icon, required }) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  return (
    <div>
      <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />}
        <input
          type={isPassword && show ? 'text' : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className={`w-full bg-white/5 border border-white/10 rounded-xl py-3 pr-4 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-[#6366f1]/60 focus:bg-white/8 transition-all ${Icon ? 'pl-10' : 'pl-4'}`}
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(!show)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors">
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  )
}

export function LoginPage() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) navigate(user.role === 'doctor' ? '/doctor' : '/patient')
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const u = await login(email, password)
      toast.success(`Welcome back, ${u.full_name.split(' ')[0]}!`)
      navigate(u.role === 'doctor' ? '/doctor' : '/patient')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#060614] flex">
      {/* Left panel - 3D */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <Suspense fallback={null}>
          <BrainScene />
        </Suspense>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#060614]" />
        <div className="absolute bottom-12 left-12 right-12">
          <div className="font-display text-3xl font-bold mb-3">
            AI-Powered<br /><span className="gradient-text">Brain Tumor Detection</span>
          </div>
          <p className="text-neutral-400 text-sm">Secure, fast, and accurate neuroimaging analysis for doctors and patients.</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="w-full max-w-sm"
        >
          <Link to="/" className="flex items-center gap-2 text-neutral-500 hover:text-white text-sm mb-8 transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to home
          </Link>

          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#22d3ee] flex items-center justify-center">
              <Brain className="w-5 h-5" />
            </div>
            <span className="font-display font-bold text-xl">NeuroScan AI</span>
          </div>

          <h1 className="font-display text-3xl font-bold mb-2">Welcome back</h1>
          <p className="text-neutral-400 text-sm mb-8">Sign in to your account to continue</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <InputField label="Email Address" type="email" value={email} onChange={setEmail} placeholder="you@hospital.com" icon={Mail} required />
            <InputField label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" icon={Lock} required />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-[#6366f1] to-[#4f46e5] rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity neural-glow disabled:opacity-50 mt-2"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-neutral-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#818cf8] hover:text-[#6366f1] transition-colors font-medium">
              Create one
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}

export function RegisterPage() {
  const [searchParams] = useSearchParams()
  const { register } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState(searchParams.get('role') || null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', phone: '',
    specialization: '', license_number: '', hospital: '',
    age: '', gender: '', blood_group: '', medical_history: ''
  })

  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = { ...form, role, age: form.age ? parseInt(form.age) : undefined }
      await register(payload, role)
      toast.success('Account created! Please sign in.')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  if (!role) {
    return (
      <div className="min-h-screen bg-[#060614] flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="flex items-center gap-2 text-neutral-500 hover:text-white text-sm mb-8 transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to home
          </Link>

          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#22d3ee] flex items-center justify-center">
              <Brain className="w-5 h-5" />
            </div>
            <span className="font-display font-bold text-xl">NeuroScan AI</span>
          </div>

          <h1 className="font-display text-3xl font-bold mb-3">Create your account</h1>
          <p className="text-neutral-400 mb-10">Choose your role to get started with the right portal.</p>

          <div className="grid grid-cols-2 gap-4">
            {[
              { role: 'doctor', icon: Stethoscope, title: 'Doctor', desc: 'Manage patients, review scans, add diagnoses', color: '#6366f1' },
              { role: 'patient', icon: User, title: 'Patient', desc: 'Upload MRI scans, view results and reports', color: '#22d3ee' },
            ].map(opt => (
              <button
                key={opt.role}
                onClick={() => setRole(opt.role)}
                className="glass-strong rounded-2xl p-6 text-left hover:border-[#6366f1]/50 transition-all group"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                  style={{ background: `${opt.color}20`, border: `1px solid ${opt.color}40` }}
                >
                  <opt.icon className="w-6 h-6" style={{ color: opt.color }} />
                </div>
                <div className="font-display font-bold text-lg mb-1">{opt.title}</div>
                <div className="text-xs text-neutral-400">{opt.desc}</div>
              </button>
            ))}
          </div>

          <p className="text-center text-sm text-neutral-500 mt-8">
            Already have an account?{' '}
            <Link to="/login" className="text-[#818cf8] hover:text-[#6366f1] transition-colors font-medium">Sign in</Link>
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#060614] flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <button onClick={() => setRole(null)} className="flex items-center gap-2 text-neutral-500 hover:text-white text-sm mb-8 transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Choose different role
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: role === 'doctor' ? '#6366f120' : '#22d3ee20', border: `1px solid ${role === 'doctor' ? '#6366f1' : '#22d3ee'}40` }}>
            {role === 'doctor' ? <Stethoscope className="w-5 h-5 text-[#6366f1]" /> : <User className="w-5 h-5 text-[#22d3ee]" />}
          </div>
          <div>
            <h1 className="font-display text-xl font-bold">Register as {role === 'doctor' ? 'Doctor' : 'Patient'}</h1>
            <p className="text-xs text-neutral-500">Fill in your details to create an account</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <InputField label="Full Name" value={form.full_name} onChange={set('full_name')} placeholder="Dr. Jane Smith" icon={User} required />
          <InputField label="Email" type="email" value={form.email} onChange={set('email')} placeholder="you@hospital.com" icon={Mail} required />
          <InputField label="Password" type="password" value={form.password} onChange={set('password')} placeholder="Min. 8 characters" icon={Lock} required />
          <InputField label="Phone" value={form.phone} onChange={set('phone')} placeholder="+91 9876543210" icon={Phone} />

          {role === 'doctor' && (
            <>
              <InputField label="Specialization" value={form.specialization} onChange={set('specialization')} placeholder="Neurology" icon={Award} />
              <InputField label="License Number" value={form.license_number} onChange={set('license_number')} placeholder="MCI-XXXXX" icon={Award} />
              <InputField label="Hospital / Institution" value={form.hospital} onChange={set('hospital')} placeholder="City Hospital" icon={Building} />
            </>
          )}

          {role === 'patient' && (
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Age" type="number" value={form.age} onChange={set('age')} placeholder="25" />
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">Gender</label>
                <select value={form.gender} onChange={e => set('gender')(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-[#6366f1]/60 transition-all">
                  <option value="">Select</option>
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
              <InputField label="Blood Group" value={form.blood_group} onChange={set('blood_group')} placeholder="O+" />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-[#6366f1] to-[#4f46e5] rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity neural-glow disabled:opacity-50 mt-2"
          >
            {loading ? 'Creating Account...' : `Create ${role === 'doctor' ? 'Doctor' : 'Patient'} Account`}
          </button>
        </form>

        <p className="text-center text-sm text-neutral-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-[#818cf8] hover:text-[#6366f1] transition-colors font-medium">Sign in</Link>
        </p>
      </motion.div>
    </div>
  )
}
