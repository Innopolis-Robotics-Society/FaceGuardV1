import { Navigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center h-screen"
        style={{ background: "#080808" }}
      >
        <div className="text-center">
          <div
            className="w-12 h-12 rounded-full border-2 border-white/10 border-t-white mx-auto mb-4 animate-spin"
          />
          <p className="text-sm" style={{ color: "#3a3a3a" }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
