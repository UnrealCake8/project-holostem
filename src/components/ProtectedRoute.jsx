import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <p className="p-8 text-center">Loading...</p>
  if (!user) return <Navigate to="/auth" replace />
  return children
}
