import { useState } from "react";
import "./css/login.css";
import "./css/header.css";
import Headers from "./header/header";
import CustomAlert from "./components/CustomAlert";


export default function Register() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
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

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check password confirm
    if (form.password !== form.confirmPassword) {
      return setAlert({
        type: "danger",
        message: "Mật khẩu xác nhận không khớp"
      });
    }

    try {
      setLoading(true);
      setAlert({});

      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Đăng ký thất bại");
      }

      // Thành công
      setAlert({
        type: "success",
        message: data.message || "Đăng ký thành công"
      });

      // Reset form
      setForm({
        username: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: ""
      });

    } catch (error) {
      setAlert({
        type: "danger",
        message: error.message || "Có lỗi xảy ra"
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

            {/* Left image */}
            <div className="col-12 col-lg-6 illus-box">
              <img
                className="illus"
                src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=60"
                alt="Illustration"
              />
            </div>

            {/* Right form */}
            <div className="col-12 col-lg-6">
              <div className="login-card mx-auto" style={{ maxWidth: 520 }}>
                <div className="login-title">Đăng ký tài khoản</div>

                {/* Alert đẹp */}
                <CustomAlert
                  type={alert.type}
                  message={alert.message}
                  onClose={() => setAlert({})}
                />

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <input
                      type="text"
                      name="username"
                      className="form-control pill-input"
                      placeholder="Nhập tên người dùng"
                      value={form.username}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <input
                      type="email"
                      name="email"
                      className="form-control pill-input"
                      placeholder="Nhập email"
                      value={form.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <input
                      type="tel"
                      name="phone"
                      className="form-control pill-input"
                      placeholder="Nhập số điện thoại"
                      value={form.phone}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <input
                      type="password"
                      name="password"
                      className="form-control pill-input"
                      placeholder="Nhập mật khẩu"
                      value={form.password}
                      onChange={handleChange}
                      required
                      minLength={6}
                    />
                  </div>

                  <div className="mb-3">
                    <input
                      type="password"
                      name="confirmPassword"
                      className="form-control pill-input"
                      placeholder="Xác nhận mật khẩu"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      required
                      minLength={6}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-orange w-100"
                    disabled={loading}
                  >
                    {loading ? "ĐANG XỬ LÝ..." : "ĐĂNG KÝ"}
                  </button>

                  <div className="helper-links mt-3">
                    <span className="text-muted">Đã có tài khoản?</span>
                    <a href="/dang-nhap"> Đăng nhập</a>
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
