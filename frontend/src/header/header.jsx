import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const API_BASE = "http://localhost:5000";
  const navigate = useNavigate();

  // Khởi tạo state user từ localStorage
  const [user, setUser] = useState(() => {
    const userData = localStorage.getItem("user");
    return userData ? JSON.parse(userData) : null;
  });

  const [showDropdown, setShowDropdown] = useState(false);

  // state search
  const [searchKeyword, setSearchKeyword] = useState("");

  // categories từ API
  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(false);

  const token = localStorage.getItem("token");

  const authHeaders = useMemo(() => {
    const h = { "Content-Type": "application/json" };
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }, [token]);

  const fetchCategories = async () => {
    try {
      setCatLoading(true);
      const res = await fetch(`${API_BASE}/api/categories`, {
        method: "GET",
        headers: authHeaders,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Lỗi tải danh mục");

      const items = Array.isArray(data?.data) ? data.data : [];
      const active = items.filter((c) => c.isActive !== false);

      setCategories(active);
    } catch (err) {
      console.error("Fetch categories error:", err.message);
      setCategories([]);
    } finally {
      setCatLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();

    const onChanged = () => fetchCategories();
    window.addEventListener("categories:changed", onChanged);

    return () => window.removeEventListener("categories:changed", onChanged);
  }, []);

  // Đăng xuất
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/";
  };

  // xử lý submit search
  const handleSearch = () => {
    const keyword = searchKeyword.trim();

    if (!keyword) {
      navigate("/san-pham");
      return;
    }

    navigate(`/san-pham?search=${encodeURIComponent(keyword)}`);
  };

  // enter để tìm kiếm
  const handleKeyDownSearch = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <>
      <header className="tgd-header">
        <div className="tgd-topbar py-2">
          <div className="container d-flex align-items-center justify-content-between gap-2">
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <span className="tgd-badge">
                <i className="bi bi-lightning-charge-fill"></i> 0949196206
              </span>
              <span className="fw-semibold d-none d-sm-inline">Sắm Tết sớm</span>
              <span className="text-danger fw-bold d-none d-sm-inline">GIÁ RẺ HƠN!</span>
            </div>

            <div className="d-none d-md-flex align-items-center gap-2">
              <span className="fw-bold text-danger">PIN KHỦNG</span>
              <span className="fw-semibold">ĐỒNG LOẠT GIẢM SỐC</span>
              <span className="fw-bold">từ</span>
              <span className="fw-bold text-danger">500 NGÀN</span>
              <span className="fw-bold">đến</span>
              <span className="fw-bold text-danger">1.5 TRIỆU</span>
            </div>
          </div>
        </div>

        <div className="container py-3">
          <div className="row align-items-center g-2">
            <div className="col-12 col-lg-2 d-flex align-items-center justify-content-between">
              <a href="/" className="text-decoration-none">
                <div className="logo-box">NexaTech</div>
              </a>

              <button
                className="btn btn-dark d-lg-none rounded-pill px-3"
                data-bs-toggle="offcanvas"
                data-bs-target="#mobileMenu"
                aria-controls="mobileMenu"
                type="button"
              >
                <i className="bi bi-list"></i>
              </button>
            </div>

            <div className="col-12 col-lg-6">
              <div className="position-relative tgd-search d-flex align-items-center">
                <i
                  className="bi bi-search"
                  onClick={handleSearch}
                  style={{ cursor: "pointer" }}
                ></i>

                <input
                  className="form-control"
                  placeholder="iPhone 17 và iPhone Air"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyDown={handleKeyDownSearch}
                />
              </div>
            </div>

            <div className="col-12 col-lg-4">
              <div className="d-flex flex-wrap justify-content-lg-end gap-2">
                {!user && (
                  <a className="tgd-pill" href="/dang-nhap">
                    <i className="bi bi-person"></i>
                    <span className="d-none d-sm-inline">Đăng nhập</span>
                  </a>
                )}

                {user && (
                  <div className="position-relative">
                    <button
                      className="tgd-pill border-0"
                      onClick={() => setShowDropdown(!showDropdown)}
                      style={{ cursor: "pointer" }}
                    >
                      <i className="bi bi-person-circle"></i>
                      <span className="d-none d-sm-inline">{user.username}</span>
                      <i
                        className="bi bi-chevron-down ms-1"
                        style={{ fontSize: "0.75rem" }}
                      ></i>
                    </button>

                    {showDropdown && (
                      <div
                        className="position-absolute end-0 mt-2 bg-white rounded shadow-lg"
                        style={{
                          minWidth: "200px",
                          zIndex: 1000,
                          border: "1px solid #ddd",
                        }}
                      >
                        <div className="p-3 border-bottom">
                          <div className="fw-bold">{user.username}</div>
                          <small className="text-muted">{user.email}</small>
                          {user.role === "admin" && (
                            <span className="badge bg-danger ms-2">Admin</span>
                          )}
                        </div>

                        <div className="py-2">
                          <a
                            href="/tai-khoan"
                            className="dropdown-item px-3 py-2 d-flex align-items-center gap-2"
                            style={{ cursor: "pointer" }}
                          >
                            <i className="bi bi-person"></i>
                            Tài khoản của tôi
                          </a>

                          <a
                            href="/don-hang"
                            className="dropdown-item px-3 py-2 d-flex align-items-center gap-2"
                            style={{ cursor: "pointer" }}
                          >
                            <i className="bi bi-box-seam"></i>
                            Đơn hàng
                          </a>

                          {user.role === "admin" && (
                            <>
                              <hr className="my-1" />
                              <a
                                href="/admin"
                                className="dropdown-item px-3 py-2 d-flex align-items-center gap-2 text-danger fw-semibold"
                                style={{ cursor: "pointer" }}
                              >
                                <i className="bi bi-shield-lock"></i>
                                Trang quản trị
                              </a>
                            </>
                          )}

                          <hr className="my-1" />

                          <button
                            onClick={handleLogout}
                            className="dropdown-item px-3 py-2 d-flex align-items-center gap-2 text-danger"
                            style={{
                              cursor: "pointer",
                              border: "none",
                              background: "none",
                              width: "100%",
                            }}
                          >
                            <i className="bi bi-box-arrow-right"></i>
                            Đăng xuất
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <a className="tgd-pill" href="/gio-hang">
                  <i className="bi bi-cart3"></i>
                  <span className="d-none d-sm-inline">Giỏ hàng</span>
                </a>
              </div>
            </div>
          </div>

          {/* MENU DANH MỤC TỪ API */}
          <div className="mt-3">
            <div className="tgd-nav-scroll">
              {catLoading ? (
                <span className="text-muted small">Đang tải danh mục...</span>
              ) : categories.length === 0 ? (
                <span className="text-muted small">Chưa có danh mục</span>
              ) : (
                categories.map((c) => (
                  <a key={c._id} href={`/danh-muc/${c._id}`}>
                    <i className={`bi ${c.icon || "bi-tag"}`}></i> {c.name}
                  </a>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Đóng dropdown khi click bên ngoài */}
        {showDropdown && (
          <div
            onClick={() => setShowDropdown(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
            }}
          />
        )}
      </header>
    </>
  );
}