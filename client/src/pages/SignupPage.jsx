import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signup } from "../services/api";
import { useAuth } from "../context/AuthContext";

const SignupPage = () => {
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ cafeName: "", ownerName: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isStrongPassword = (password) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(password);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!isStrongPassword(form.password)) {
      setError("Password must be 8+ chars with uppercase, lowercase, number, and special character.");
      return;
    }
    setLoading(true);
    try {
      const data = await signup(form);
      loginUser(data);
      navigate("/owner/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "11px 14px", background: "#a68a64",
    border: "1px solid #c4a882", borderRadius: "10px", fontSize: "13px",
    color: "#faedcd", outline: "none", boxSizing: "border-box"
  };

  return (
    <div style={{
      height: "100vh", overflow: "hidden", display: "flex",
      alignItems: "center", justifyContent: "center",
      background: "#a68a64", padding: "16px"
    }}>
      <div style={{
        width: "100%", maxWidth: "820px", display: "flex",
        borderRadius: "28px", overflow: "hidden",
        boxShadow: "0 30px 80px rgba(127,85,57,0.4)", height: "520px",
      }}>
        {/* Left cream panel */}
        <div style={{
          width: "44%", background: "#faedcd", flexShrink: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "40px 28px", position: "relative", zIndex: 2
        }}>
          <svg viewBox="0 0 60 500" preserveAspectRatio="none"
            style={{ position: "absolute", right: "-29px", top: 0, height: "100%", width: "60px", zIndex: 3 }}>
            <path d="M0,0 C40,80 -20,160 40,250 C100,340 0,420 0,500 L60,500 L60,0 Z" fill="#faedcd" />
          </svg>

          <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
            <div style={{ fontSize: "80px", lineHeight: 1 }}>☕</div>
            <div style={{ position: "absolute", top: "-12px", right: "4px", fontSize: "16px", color: "#a68a64", opacity: 0.7 }}>✦</div>
            <div style={{ position: "absolute", top: "6px", left: "0px", fontSize: "11px", color: "#a68a64", opacity: 0.5 }}>✦</div>
            <h2 style={{ color: "#7f5539", fontSize: "20px", fontWeight: "800", marginTop: "12px", fontFamily: "Georgia, serif" }}>Cafe-OS</h2>
            <p style={{ color: "#a68a64", fontSize: "12px", marginTop: "6px", lineHeight: 1.6 }}>
              Start managing your cafe<br />smarter today
            </p>
            <div style={{ marginTop: "14px", background: "rgba(127,85,57,0.1)", borderRadius: "12px",
              padding: "10px 14px", border: "1px solid #d4a373" }}>
              <p style={{ color: "#7f5539", fontSize: "12px", fontWeight: "700" }}>🎉 14-day free trial</p>
              <p style={{ color: "#a68a64", fontSize: "11px", marginTop: "3px" }}>No credit card required</p>
            </div>
          </div>
        </div>

        {/* Right brown panel */}
        <div style={{
          flex: 1, background: "#7f5539",
          display: "flex", flexDirection: "column",
          justifyContent: "center", padding: "36px 40px 36px 52px",
          position: "relative"
        }}>
          <div style={{ position: "absolute", top: "20px", right: "24px",
            width: "40px", height: "40px", background: "#a68a64",
            borderRadius: "50%", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: "18px" }}>☕</div>

          <h1 style={{ fontSize: "20px", fontWeight: "800", lineHeight: 1.35, marginBottom: "4px" }}>
            <span style={{ color: "#faedcd" }}>Create Account,</span>
            <br />
            <span style={{ color: "#ffffff" }}>Join hundreds of cafe owners</span>
          </h1>

          {error && (
            <div style={{ background: "rgba(255,80,80,0.2)", border: "1px solid rgba(255,80,80,0.4)",
              color: "#ffaaaa", borderRadius: "8px", padding: "8px 12px", fontSize: "12px", marginTop: "8px" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ fontSize: "11px", color: "#faedcd", opacity: 0.7, display: "block", marginBottom: "4px" }}>Cafe Name</label>
                <input name="cafeName" placeholder="The Coffee Spot" value={form.cafeName} onChange={handleChange} required style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = "#faedcd"; e.target.style.background = "#956048" }}
                  onBlur={e => { e.target.style.borderColor = "#c4a882"; e.target.style.background = "#a68a64" }} />
              </div>
              <div>
                <label style={{ fontSize: "11px", color: "#faedcd", opacity: 0.7, display: "block", marginBottom: "4px" }}>Your Name</label>
                <input name="ownerName" placeholder="Full name" value={form.ownerName} onChange={handleChange} required style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = "#faedcd"; e.target.style.background = "#956048" }}
                  onBlur={e => { e.target.style.borderColor = "#c4a882"; e.target.style.background = "#a68a64" }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: "11px", color: "#faedcd", opacity: 0.7, display: "block", marginBottom: "4px" }}>Email Address</label>
              <input name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required style={inputStyle}
                onFocus={e => { e.target.style.borderColor = "#faedcd"; e.target.style.background = "#956048" }}
                onBlur={e => { e.target.style.borderColor = "#c4a882"; e.target.style.background = "#a68a64" }} />
            </div>

            <div>
              <label style={{ fontSize: "11px", color: "#faedcd", opacity: 0.7, display: "block", marginBottom: "4px" }}>Password</label>
              <div style={{ position: "relative" }}>
                <input name="password" type={showPassword ? "text" : "password"}
                  placeholder="Min 8 characters" value={form.password} onChange={handleChange} required
                  style={{ ...inputStyle, paddingRight: "40px" }}
                  onFocus={e => { e.target.style.borderColor = "#faedcd"; e.target.style.background = "#956048" }}
                  onBlur={e => { e.target.style.borderColor = "#c4a882"; e.target.style.background = "#a68a64" }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", fontSize: "14px", color: "#faedcd" }}>
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
              <div style={{ marginTop: "6px", fontSize: "11px", color: "#f3d6b3", opacity: 0.9 }}>
                Use 8+ chars with uppercase, lowercase, number, and special character.
              </div>
            </div>

            <button type="submit" disabled={loading}
              style={{ width: "100%", padding: "12px", background: "#faedcd", color: "#7f5539",
                border: "none", borderRadius: "50px", fontSize: "14px", fontWeight: "700",
                cursor: loading ? "not-allowed" : "pointer", transition: "all 0.2s", marginTop: "4px" }}
              onMouseOver={e => { if (!loading) e.target.style.background = "#f0ddb8" }}
              onMouseOut={e => { if (!loading) e.target.style.background = "#faedcd" }}
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p style={{ textAlign: "center", fontSize: "12px", color: "#faedcd", opacity: 0.6, marginTop: "14px" }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: "#faedcd", fontWeight: "700", textDecoration: "none", opacity: 1 }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
