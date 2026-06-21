import { useState } from "react";
import { Link, Navigate } from "react-router";
import { Shield, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";

export function RegisterPage() {
  const { register, isAuthenticated, isLoading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const validate = () => {
    const newErrors: {
      username?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!username.trim()) {
      newErrors.username = "Username is required";
    } else if (username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (username.length > 100) {
      newErrors.username = "Username must be less than 100 characters";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (password.length > 100) {
      newErrors.password = "Password must be less than 100 characters";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    try {
      await register({ username, password, role: "admin" });
    } catch (error) {
      // Error handled in AuthContext
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = () => {
    if (!password) return { strength: 0, label: "", color: "" };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2) return { strength, label: "Weak", color: "#ef4444" };
    if (strength <= 3) return { strength, label: "Medium", color: "#f59e0b" };
    return { strength, label: "Strong", color: "#10b981" };
  };

  const passwordStrength = getPasswordStrength();

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
          <h1 className="text-xl font-semibold text-white mb-2">Create account</h1>
          <p className="text-sm mb-6" style={{ color: "#3a3a3a" }}>
            Register to access the admin panel
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
                placeholder="Choose a username"
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
                  placeholder="Create a password"
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
              {password && !errors.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs" style={{ color: "#3a3a3a" }}>
                      Password strength
                    </span>
                    <span className="text-xs font-medium" style={{ color: passwordStrength.color }}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div
                    className="h-1.5 rounded-full overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.05)" }}
                  >
                    <div
                      className="h-full transition-all duration-300 rounded-full"
                      style={{
                        width: `${(passwordStrength.strength / 5) * 100}%`,
                        background: passwordStrength.color,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-medium text-white mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: errors.confirmPassword
                      ? "1px solid #ef4444"
                      : confirmPassword && password === confirmPassword
                      ? "1px solid #10b981"
                      : "1px solid rgba(255,255,255,0.07)",
                  }}
                  onFocus={(e) => {
                    e.target.style.border = "1px solid rgba(255,255,255,0.15)";
                    setErrors({ ...errors, confirmPassword: undefined });
                  }}
                  onBlur={(e) => {
                    if (!errors.confirmPassword) {
                      if (confirmPassword && password === confirmPassword) {
                        e.target.style.border = "1px solid #10b981";
                      } else {
                        e.target.style.border = "1px solid rgba(255,255,255,0.07)";
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
                {confirmPassword && password === confirmPassword && !errors.confirmPassword && (
                  <CheckCircle2
                    className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: "#10b981" }}
                  />
                )}
              </div>
              {errors.confirmPassword && (
                <p className="text-xs mt-1.5" style={{ color: "#ef4444" }}>
                  {errors.confirmPassword}
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
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          {/* Login link */}
          <div className="mt-6 text-center">
            <p className="text-xs" style={{ color: "#3a3a3a" }}>
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-white hover:underline font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
