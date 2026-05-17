import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'

// Pages
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Visualizer from './pages/Visualizer'
import Compiler from './pages/Compiler'
import AITutor from './pages/AITutor'
import Practice from './pages/Practice'
import Performance from './pages/Performance'
import Reports from './pages/Reports'
import TreesGraphs from './pages/TreesGraphs'
import SortingSearch from './pages/SortingSearch'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-900">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading AlgoVision...</p>
      </div>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/visualizer" element={<ProtectedRoute><Visualizer /></ProtectedRoute>} />
          <Route path="/trees-graphs" element={<ProtectedRoute><TreesGraphs /></ProtectedRoute>} />
          <Route path="/sorting" element={<ProtectedRoute><SortingSearch /></ProtectedRoute>} />
          <Route path="/compiler" element={<ProtectedRoute><Compiler /></ProtectedRoute>} />
          <Route path="/ai-tutor" element={<ProtectedRoute><AITutor /></ProtectedRoute>} />
          <Route path="/practice" element={<ProtectedRoute><Practice /></ProtectedRoute>} />
          <Route path="/performance" element={<ProtectedRoute><Performance /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
