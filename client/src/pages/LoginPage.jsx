import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../services/api";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await login(form);
      loginUser(data);
      navigate(data.user.role === "superadmin" ? "/admin/dashboard" : "/owner/dashboard", {
        replace: true,
      });
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      width: "100vw", height: "100vh", overflow: "hidden",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #a68a64 0%, #7f5539 100%)",
      fontFamily: "'Segoe UI', sans-serif"
    }}>
      <div style={{
        width: "820px", height: "480px", display: "flex",
        borderRadius: "24px", overflow: "hidden",
        boxShadow: "0 25px 60px rgba(0,0,0,0.3)"
      }}>

        {/* ── LEFT cream panel ── */}
        <div style={{
          width: "380px", flexShrink: 0,
          background: "#faedcd",
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative", overflow: "hidden"
        }}>
          {/* wavy divider */}
          <svg viewBox="0 0 80 480" preserveAspectRatio="none"
            style={{ position: "absolute", right: 0, top: 0, height: "100%", width: "80px" }}>
            <path d="M0,0 C50,80 -10,160 50,240 C110,320 0,400 0,480 L80,480 L80,0 Z"
              fill="#7f5539" />
          </svg>

          <div style={{ textAlign: "center", zIndex: 1, paddingRight: "40px" }}>
            <div style={{ fontSize: "90px", lineHeight: 1 }}>☕</div>
            <h2 style={{
              color: "#7f5539", fontSize: "22px", fontWeight: "800",
              marginTop: "12px", fontFamily: "Georgia, serif"
            }}>Cafe-OS</h2>
            <p style={{ color: "#a68a64", fontSize: "12px", marginTop: "8px", lineHeight: 1.7 }}>
              find the best coffee<br />to accompany your days
            </p>
            <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-start" }}>
              {["Menu Management", "Staff Control", "Analytics"].map(f => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: "#d4a373", fontWeight: "700" }}>✓</span>
                  <span style={{ color: "#7f5539", fontSize: "12px" }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT dark brown panel ── */}
        <div style={{
          flex: 1,
          background: "#7f5539",
          display: "flex", flexDirection: "column", justifyContent: "center",
          padding: "36px 40px 36px 48px", position: "relative"
        }}>
          {/* top-right coffee icon */}
          <div style={{
            position: "absolute", top: "18px", right: "20px",
            width: "38px", height: "38px", background: "#a68a64",
            borderRadius: "50%", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: "17px"
          }}>☕</div>

          <h1 style={{ fontSize: "20px", fontWeight: "800", lineHeight: 1.4, marginBottom: "20px" }}>
            <span style={{ color: "#faedcd" }}>Welcome Back,</span><br />
            <span style={{ color: "#fff" }}>Please login to your account</span>
          </h1>

          {error && (
            <div style={{ background: "rgba(255,80,80,0.2)", border: "1px solid rgba(255,80,80,0.4)", color: "#ffaaaa", borderRadius: "8px", padding: "8px 12px", fontSize: "12px", marginBottom: "10px" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label style={{ fontSize: "11px", color: "#faedcd", opacity: 0.75, display: "block", marginBottom: "5px" }}>Email Address</label>
              <input name="email" type="email" placeholder="you@example.com"
                value={form.email} onChange={handleChange} required
                style={{ width: "100%", padding: "10px 14px", background: "#a68a64", border: "1.5px solid #c4a882", borderRadius: "10px", fontSize: "13px", color: "#faedcd", outline: "none", boxSizing: "border-box" }}
                onFocus={e => { e.target.style.borderColor = "#faedcd"; e.target.style.background = "#956048" }}
                onBlur={e => { e.target.style.borderColor = "#c4a882"; e.target.style.background = "#a68a64" }} />
            </div>

            <div>
              <label style={{ fontSize: "11px", color: "#faedcd", opacity: 0.75, display: "block", marginBottom: "5px" }}>Password</label>
              <div style={{ position: "relative" }}>
                <input name="password" type={showPassword ? "text" : "password"} placeholder="••••••••"
                  value={form.password} onChange={handleChange} required
                  style={{ width: "100%", padding: "10px 40px 10px 14px", background: "#a68a64", border: "1.5px solid #c4a882", borderRadius: "10px", fontSize: "13px", color: "#faedcd", outline: "none", boxSizing: "border-box" }}
                  onFocus={e => { e.target.style.borderColor = "#faedcd"; e.target.style.background = "#956048" }}
                  onBlur={e => { e.target.style.borderColor = "#c4a882"; e.target.style.background = "#a68a64" }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#faedcd", fontSize: "14px" }}>
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#faedcd", opacity: 0.7, cursor: "pointer" }}>
                <input type="checkbox" style={{ accentColor: "#faedcd" }} /> Remember me
              </label>
              <a href="#" style={{ fontSize: "12px", color: "#faedcd", textDecoration: "none", fontWeight: "600" }}>Forgot password?</a>
            </div>

            <button type="submit" disabled={loading}
              style={{ width: "100%", padding: "11px", background: "#faedcd", color: "#7f5539", border: "none", borderRadius: "50px", fontSize: "14px", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer", transition: "all 0.2s", marginTop: "2px" }}
              onMouseOver={e => { if (!loading) e.target.style.background = "#f0ddb8" }}
              onMouseOut={e => { if (!loading) e.target.style.background = "#faedcd" }}>
              {loading ? "Signing in..." : "Sign in"}
            </button>

          </form>

          <p style={{ textAlign: "center", fontSize: "12px", color: "#faedcd", opacity: 0.6, marginTop: "14px" }}>
            New here?{" "}
            <Link to="/signup" style={{ color: "#faedcd", fontWeight: "700", textDecoration: "none", opacity: 1 }}>Create Account</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
