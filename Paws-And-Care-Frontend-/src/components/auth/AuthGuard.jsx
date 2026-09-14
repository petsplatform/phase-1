import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AuthGuard({ children }) {
  const { user, authStatus } = useAuth() || {};
  const location = useLocation();

  if (authStatus === 'checking') {
    return (
      <div className="min-h-[50vh] flex items-center justify-center bg-brand-bg">
        <div className="w-10 h-10 rounded-full border-4 border-brand-border border-t-brand-teal animate-spin" />
      </div>
    );
  }

  if (!user) {
    // Preserve target path to redirect back on successful authentication
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
