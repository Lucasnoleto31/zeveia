import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSocio?: boolean;
}

export function ProtectedRoute({ children, requireSocio = false }: ProtectedRouteProps) {
  const { user, loading, isSocio } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requireSocio && !isSocio) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
