import { useState } from "react";
import "./css/login.css";
import "./css/header.css";
import Headers from "./header/header";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_BASE = "http://localhost:5000";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      toast.error("Vui lòng nhập email!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json().catch(() => ({}));

      // backend của mình trả kiểu: {status:"success", message:"..."}
      if (!res.ok || data.status === "error" || data.status === "fail") {
        toast.error(data.message );
        return;
      }

      toast.success(
        data.message 
      );
      setEmail("");
    } catch (err) {
      console.error(err);
      toast.error("Không kết nối được server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Headers />

      {/* ToastContainer đặt 1 lần trong app cũng được (App.jsx). 
          Đặt ở đây để bạn chạy ngay */}
      <ToastContainer position="top-right" autoClose={2500} />

      <main className="login login-wrap">
        <div className="container">
          <div className="row align-items-center g-4">
            {/* Left Illustration */}
            <div className="col-12 col-lg-6 illus-box">
              <img
                className="illus"
                src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=60"
                alt="Illustration"
              />
            </div>

            {/* Right Card */}
            <div className="col-12 col-lg-6">
              <div className="login-card mx-auto" style={{ maxWidth: 520 }}>
                <div className="login-title">Quên mật khẩu</div>

                <p
                  className="text-muted text-center mb-4"
                  style={{ marginTop: -6 }}
                >
                  Nhập email đã đăng ký để lấy mật khẩu mới.
                </p>

                <form onSubmit={handleSubmit}>
                  {/* Email */}
                  <div className="mb-3 position-relative">
                    <input
                      type="email"
                      className="form-control pill-input"
                      placeholder="Nhập email của bạn"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-orange"
                    disabled={loading}
                  >
                    {loading ? "ĐANG GỬI..." : "XÁC NHẬN"}
                  </button>

                  <div className="helper-links">
                    <span className="text-muted">Nhớ mật khẩu rồi?</span>
                    <a href="/dang-nhap">Đăng nhập</a>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}