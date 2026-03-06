import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import LandingPage from './pages/LandingPage'
import { LoginPage, RegisterPage } from './pages/AuthPages'
import DoctorDashboard from './pages/DoctorDashboard'
import PatientDashboard from './pages/PatientDashboard'
import MyScans from './pages/MyScans'
import UploadScan from './pages/UploadScan'
import Reports from './pages/Reports'
import ScanDetail from './pages/ScanDetail'

function ProtectedRoute({ children, allowedRole }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-[#060614] flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  if (allowedRole && user.role !== allowedRole) return <Navigate to={user.role === 'doctor' ? '/doctor' : '/patient'} replace />
  return children
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={user ? <Navigate to={user.role === 'doctor' ? '/doctor' : '/patient'} /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to={user.role === 'doctor' ? '/doctor' : '/patient'} /> : <RegisterPage />} />
      <Route path="/doctor" element={<ProtectedRoute allowedRole="doctor"><DoctorDashboard /></ProtectedRoute>} />
      <Route path="/doctor/scans/:id" element={<ProtectedRoute allowedRole="doctor"><ScanDetail /></ProtectedRoute>} />
      <Route path="/doctor/scans" element={<ProtectedRoute allowedRole="doctor"><DoctorDashboard /></ProtectedRoute>} />
      <Route path="/doctor/patients" element={<ProtectedRoute allowedRole="doctor"><DoctorDashboard /></ProtectedRoute>} />
      <Route path="/doctor/upload" element={<ProtectedRoute allowedRole="doctor"><DoctorDashboard /></ProtectedRoute>} />
      <Route path="/patient" element={<ProtectedRoute allowedRole="patient"><PatientDashboard /></ProtectedRoute>} />
      <Route path="/patient/scans/:id" element={<ProtectedRoute allowedRole="patient"><ScanDetail /></ProtectedRoute>} />
      <Route path="/patient/scans" element={<ProtectedRoute allowedRole="patient"><MyScans /></ProtectedRoute>} />
      <Route path="/patient/upload" element={<ProtectedRoute allowedRole="patient"><UploadScan /></ProtectedRoute>} />
      <Route path="/patient/reports" element={<ProtectedRoute allowedRole="patient"><Reports /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
