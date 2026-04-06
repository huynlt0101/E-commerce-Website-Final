import { useState } from "react";
import "./css/login.css";
import "./css/header.css";
import Headers from "./header/header";
import CustomAlert from "./components/CustomAlert";


export default function Login() {
  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  const [alert, setAlert] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  // Xử lý input
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  // Submit đăng nhập
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      return setAlert({
        type: "danger",
        message: "Vui lòng nhập email và mật khẩu"
      });
    }

    try {
      setLoading(true);
      setAlert({});

      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Đăng nhập thất bại");
      }

      //  Lưu token + user
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setAlert({
        type: "success",
        message: " Đăng nhập thành công"
      });

      //  Redirect sau 1.5s
      setTimeout(() => {
        if (data.user.role === "admin") {
          window.location.href = "/admin";
        } else {
          window.location.href = "/";
        }
      }, 1500);

    } catch (error) {
      setAlert({
        type: "danger",
        message: error.message || "Đăng nhập thất bại"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Headers />

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
                <div className="login-title">Đăng nhập tài khoản</div>

                {/*  Alert đẹp */}
                <CustomAlert
                  type={alert.type}
                  message={alert.message}
                  onClose={() => setAlert({})}
                />

                <form onSubmit={handleSubmit}>
                  {/* Email */}
                  <div className="mb-3">
                    <input
                      type="email"
                      name="email"
                      className="form-control pill-input"
                      placeholder="Nhập email / tài khoản"
                      value={form.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {/* Password */}
                  <div className="mb-3">
                    <input
                      type="password"
                      name="password"
                      className="form-control pill-input"
                      placeholder="Nhập mật khẩu"
                      value={form.password}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <a
                      href="/quen-mat-khau"
                      className="fw-semibold text-decoration-none"
                      style={{ color: "#0d6efd" }}
                    >
                      Quên mật khẩu?
                    </a>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-orange w-100"
                    disabled={loading}
                  >
                    {loading ? "ĐANG ĐĂNG NHẬP..." : "ĐĂNG NHẬP"}
                  </button>

                  <div className="helper-links mt-3">
                    <span className="text-muted">Chưa có tài khoản?</span>
                    <a href="/dang-ky"> Đăng ký ngay</a>
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
