import { useMemo, useState, useEffect } from "react";
import "../css/login.css";
import "../css/header.css";
import Headers from "../header/header";
import CustomAlert from "../components/CustomAlert";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [alert, setAlert] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  // Lấy thông tin user khi component mount
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      window.location.href = "/dang-nhap";
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    
    // Set form với dữ liệu user
    setForm({
      username: parsedUser.username || "",
      email: parsedUser.email || "",
      phone: parsedUser.phone || "",
      password: "",
      confirmPassword: "",
    });
  }, []);

  const initials = useMemo(() => {
    const name = (form.username || "").trim();
    if (!name) return "U";
    const parts = name.split(/\s+/);
    const a = parts[0]?.[0] || "U";
    const b = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (a + b).toUpperCase();
  }, [form.username]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate password nếu có nhập
    if (form.password || form.confirmPassword) {
      if (form.password.length < 6) {
        return setAlert({
          type: "danger",
          message: "Mật khẩu tối thiểu 6 ký tự!"
        });
      }
      if (form.password !== form.confirmPassword) {
        return setAlert({
          type: "danger",
          message: "Mật khẩu xác nhận không khớp!"
        });
      }
    }

    try {
      setLoading(true);
      setAlert({});

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Vui lòng đăng nhập lại");
      }

      // Tạo payload
      const payload = {
        username: form.username.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      };

      // Chỉ thêm password nếu có nhập
      if (form.password) {
        payload.password = form.password;
      }

      // Gọi API cập nhật profile
      const res = await fetch("http://localhost:5000/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Cập nhật thất bại");
      }

      // Cập nhật user trong localStorage
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);

      // Reset password fields
      setForm((prev) => ({
        ...prev,
        password: "",
        confirmPassword: ""
      }));

      setAlert({
        type: "success",
        message: "Cập nhật thông tin thành công!"
      });

      // Scroll to top để thấy alert
      window.scrollTo({ top: 0, behavior: "smooth" });

    } catch (error) {
      setAlert({
        type: "danger",
        message: error.message || "Cập nhật thất bại"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm((prev) => ({ ...prev, password: "", confirmPassword: "" }));
  };

  // Loading state
  if (!user) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-light min-vh-100">
      <Headers />

      <div className="container py-4">
        {/* Alert */}
        <CustomAlert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({})}
        />

        {/* Title */}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
          <div>
            <h3 className="fw-bold mb-1">Hồ sơ cá nhân</h3>
            <div className="text-muted">Cập nhật thông tin tài khoản của bạn</div>
          </div>

          <a href="/" className="btn btn-outline-secondary rounded-pill px-3">
            <i className="bi bi-arrow-left me-2"></i> Trang chủ
          </a>
        </div>

        {/* Card */}
        <div className="card border-0 shadow-sm rounded-4">
          <div className="card-body p-3 p-md-4">
            {/* Header profile */}
            <div className="d-flex flex-wrap align-items-center gap-3 mb-4">
              <div
                className="d-flex align-items-center justify-content-center rounded-circle fw-bold text-white"
                style={{
                  width: 56,
                  height: 56,
                  background: "linear-gradient(135deg, #ff6a2a, #ffb703)",
                  letterSpacing: 1,
                }}
              >
                {initials}
              </div>

              <div className="flex-grow-1">
                <div className="fw-bold fs-5">{form.username || "Người dùng"}</div>
                <div className="text-muted d-flex flex-wrap gap-3">
                  <span><i className="bi bi-envelope me-1"></i>{form.email}</span>
                  <span><i className="bi bi-telephone me-1"></i>{form.phone}</span>
                </div>
              </div>

              <span className={`badge ${user.role === 'admin' ? 'text-bg-danger' : 'text-bg-light border'} rounded-pill px-3 py-2`}>
                <i className={`bi ${user.role === 'admin' ? 'bi-shield-fill-check' : 'bi-shield-check'} me-1`}></i>
                {user.role === 'admin' ? 'Admin' : 'Tài khoản'}
              </span>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                {/* Left: Info */}
                <div className="col-12 col-lg-7">
                  <div className="p-3 p-md-4 border rounded-4 bg-white h-100">
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <i className="bi bi-person-lines-fill text-primary"></i>
                      <div className="fw-bold">Thông tin cá nhân</div>
                    </div>

                    <div className="row g-3">
                      <div className="col-12">
                        <label className="form-label fw-semibold">Tên người dùng</label>
                        <input
                          name="username"
                          type="text"
                          className="form-control rounded-pill"
                          value={form.username}
                          onChange={handleChange}
                          placeholder="Nhập tên người dùng"
                          required
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label fw-semibold">Email</label>
                        <div className="input-group">
                          <span className="input-group-text bg-white">
                            <i className="bi bi-envelope"></i>
                          </span>
                          <input
                            name="email"
                            type="email"
                            className="form-control"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="Nhập email"
                            required
                            disabled
                            title="Email không thể thay đổi"
                          />
                        </div>
                        <small className="text-muted">Email không thể thay đổi</small>
                      </div>

                      <div className="col-12">
                        <label className="form-label fw-semibold">Số điện thoại</label>
                        <div className="input-group">
                          <span className="input-group-text bg-white">
                            <i className="bi bi-telephone"></i>
                          </span>
                          <input
                            name="phone"
                            type="tel"
                            className="form-control"
                            value={form.phone}
                            onChange={handleChange}
                            placeholder="Nhập số điện thoại"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Password */}
                <div className="col-12 col-lg-5">
                  <div className="p-3 p-md-4 border rounded-4 bg-white h-100">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <i className="bi bi-lock-fill text-danger"></i>
                      <div className="fw-bold">Đổi mật khẩu</div>
                    </div>
                    <div className="text-muted small mb-3">
                      Bỏ trống nếu bạn không muốn đổi mật khẩu.
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-semibold">Mật khẩu mới</label>
                      <input
                        name="password"
                        type="password"
                        className="form-control"
                        value={form.password}
                        onChange={handleChange}
                        placeholder="Nhập mật khẩu mới"
                        minLength={6}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-semibold">Xác nhận mật khẩu</label>
                      <input
                        name="confirmPassword"
                        type="password"
                        className="form-control"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        placeholder="Nhập lại mật khẩu"
                        minLength={6}
                      />
                    </div>

                    <button
                      type="button"
                      className="btn btn-outline-secondary w-100"
                      onClick={handleReset}
                    >
                      <i className="bi bi-arrow-counterclockwise me-2"></i>
                      Xoá mật khẩu đã nhập
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="col-12">
                  <div className="d-flex flex-wrap justify-content-end gap-2 mt-1">
                    <button 
                      type="submit" 
                      className="btn btn-orange px-4"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          ĐANG CẬP NHẬT...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check2-circle me-2"></i>
                          CẬP NHẬT
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>

          </div>
        </div>
      </div>
    </div>
  );
}