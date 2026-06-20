import { useState } from "react";
import { Link, Navigate } from "react-router";
import { Shield, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";

export function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const validate = () => {
    const newErrors: { username?: string; password?: string } = {};

    if (!username.trim()) {
      newErrors.username = "Username is required";
    } else if (username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    try {
      await login({ username, password });
    } catch (error) {
      // Error handled in AuthContext
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ background: "#080808" }}
      >
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-white mx-auto mb-4 animate-spin" />
          <p className="text-sm" style={{ color: "#3a3a3a" }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-center min-h-screen p-4"
      style={{ background: "#080808" }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: "#ffffff" }}
          >
            <Shield className="w-6 h-6" style={{ color: "#080808" }} />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">FaceGuard</div>
            <div className="text-sm" style={{ color: "#3a3a3a" }}>Admin Panel</div>
          </div>
        </div>

        {/* Form card */}
        <div
          className="rounded-3xl p-8"
          style={{ background: "#060606", border: "1px solid rgba(255,255,255,0.05)" }}
        >
          <h1 className="text-xl font-semibold text-white mb-2">Welcome back</h1>
          <p className="text-sm mb-6" style={{ color: "#3a3a3a" }}>
            Enter your credentials to access the admin panel
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-medium text-white mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: errors.username
                    ? "1px solid #ef4444"
                    : "1px solid rgba(255,255,255,0.07)",
                }}
                onFocus={(e) => {
                  e.target.style.border = "1px solid rgba(255,255,255,0.15)";
                  setErrors({ ...errors, username: undefined });
                }}
                onBlur={(e) => {
                  if (!errors.username) {
                    e.target.style.border = "1px solid rgba(255,255,255,0.07)";
                  }
                }}
              />
              {errors.username && (
                <p className="text-xs mt-1.5" style={{ color: "#ef4444" }}>
                  {errors.username}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-white mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: errors.password
                      ? "1px solid #ef4444"
                      : "1px solid rgba(255,255,255,0.07)",
                  }}
                  onFocus={(e) => {
                    e.target.style.border = "1px solid rgba(255,255,255,0.15)";
                    setErrors({ ...errors, password: undefined });
                  }}
                  onBlur={(e) => {
                    if (!errors.password) {
                      e.target.style.border = "1px solid rgba(255,255,255,0.07)";
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs mt-1.5" style={{ color: "#ef4444" }}>
                  {errors.password}
                </p>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-medium transition-all mt-6"
              style={{
                background: loading ? "#3a3a3a" : "#ffffff",
                color: loading ? "#808080" : "#080808",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = "#e5e5e5";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = "#ffffff";
                }
              }}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* Register link */}
          <div className="mt-6 text-center">
            <p className="text-xs" style={{ color: "#3a3a3a" }}>
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-white hover:underline font-medium"
              >
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
