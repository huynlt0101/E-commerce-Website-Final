import { useEffect, useMemo, useState } from "react";
import Headers from "../header/header";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";
import { NavLink } from "react-router-dom";
function SidebarMenu() {
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  

  return (
    <div className="p-3">
      <div className="d-flex align-items-center gap-2 mb-3">
        <i className="bi bi-speedometer2 fs-4 text-primary"></i>
        <div className="admin-brand">ADMIN PANEL</div>
      </div>

      <div className="nav flex-column admin-menu">
        <NavLink to="/admin" end className="nav-link">
          <i className="bi bi-grid"></i> Dashboard
        </NavLink>

        <NavLink to="/admin/users" className="nav-link">
          <i className="bi bi-people"></i> Quản lý người dùng
        </NavLink>
    <NavLink to="/admin/categories" className="nav-link">
          <i className="bi bi-tags"></i> Quản lý danh mục
        </NavLink>
        <NavLink to="/admin/products" className="nav-link">
          <i className="bi bi-box-seam"></i> Quản lý sản phẩm
        </NavLink>

        <NavLink to="/admin/orders" className="nav-link">
          <i className="bi bi-receipt"></i> Quản lý đơn hàng
        </NavLink>
      </div>

      <hr />

      <button onClick={handleLogout} className="btn btn-outline-danger w-100 rounded-pill">
        <i className="bi bi-box-arrow-right me-2"></i>
        Đăng xuất
      </button>
    </div>
  );
}

export default function AdminCategories() {
  const API_BASE = "http://localhost:5000";
  const token = localStorage.getItem("token");

  const authHeaders = useMemo(() => {
    const h = { "Content-Type": "application/json" };
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }, [token]);

  const iconOptions = [
    { value: "bi-phone", label: "📱 Điện thoại" },
    { value: "bi-laptop", label: "💻 Laptop" },
    { value: "bi-tablet", label: "📱 Tablet" },
    { value: "bi-headphones", label: "🎧 Tai nghe" },
    { value: "bi-smartwatch", label: "⌚ Đồng hồ" },
    { value: "bi-tv", label: "📺 TV" },
    { value: "bi-speaker", label: "🔊 Loa" },
    { value: "bi-camera", label: "📷 Camera" },
    { value: "bi-tag", label: "🏷️ Khác" }
  ];

  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    icon: "bi-tag",
    isActive: true
  });

  const normalizeCategory = (c) => ({
    id: c._id || c.id,
    name: c.name,
    icon: c.icon || "bi-tag",
    isActive: Boolean(c.isActive),
    createdAt: c.createdAt ? new Date(c.createdAt).toISOString().slice(0, 10) : "",
    productCount: c.productCount ?? 0
  });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/categories`, {
        method: "GET",
        headers: authHeaders
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Lỗi tải danh mục");

      const items = Array.isArray(data?.data) ? data.data.map(normalizeCategory) : [];
      setCategories(items);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleAdd = () => {
    setEditingCategory(null);
    setFormData({
      name: "",
      icon: "bi-tag",
      isActive: true
    });
    setShowModal(true);
    window.dispatchEvent(new Event("categories:changed"));
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      icon: category.icon,
      isActive: category.isActive
    });
    setShowModal(true);
    window.dispatchEvent(new Event("categories:changed"));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.warning("Vui lòng nhập tên danh mục");
      return;
    }

    try {
      setSaving(true);

      if (editingCategory) {
        const res = await fetch(`${API_BASE}/api/categories/${editingCategory.id}`, {
          method: "PUT",
          headers: authHeaders,
          body: JSON.stringify({
            name: formData.name,
            icon: formData.icon,
            isActive: formData.isActive
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Cập nhật thất bại");

        const updated = normalizeCategory(data.data);
        setCategories((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
        toast.success("Cập nhật danh mục thành công!");
              window.dispatchEvent(new Event("categories:changed"));
      } else {
        const res = await fetch(`${API_BASE}/api/categories`, {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            name: formData.name,
            icon: formData.icon,
            isActive: formData.isActive
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Thêm thất bại");

        const created = normalizeCategory(data.data);
        setCategories((prev) => [created, ...prev]);
        toast.success("Thêm danh mục thành công!");
        window.dispatchEvent(new Event("categories:changed"));
      }

      setShowModal(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const category = categories.find((c) => c.id === id);
    if (!category) return;

    const result = await Swal.fire({
      title: "Xác nhận xóa?",
      text: `Bạn có chắc muốn xóa danh mục "${category.name}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
      reverseButtons: true
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`${API_BASE}/api/categories/${id}`, {
        method: "DELETE",
        headers: authHeaders
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Xóa thất bại");

      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast.success("Đã xóa danh mục!");
      window.dispatchEvent(new Event("categories:changed"));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const toggleStatus = async (id) => {
    const prev = categories;
    setCategories((cur) => cur.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c)));

    try {
      const res = await fetch(`${API_BASE}/api/categories/${id}/toggle`, {
        method: "PATCH",
        headers: authHeaders
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Đổi trạng thái thất bại");

      const updated = normalizeCategory(data.data);
      setCategories((cur) => cur.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));

      toast.success(`Đã đổi trạng thái: ${updated.isActive ? "Hoạt động" : "Tạm dừng"}`);
    } catch (err) {
      setCategories(prev);
      toast.error(err.message);
    }
  };

  const totalProducts = categories.reduce((sum, c) => sum + (c.productCount || 0), 0);
  const activeCategories = categories.filter((c) => c.isActive).length;
  const inactiveCategories = categories.filter((c) => !c.isActive).length;

  return (
    <div className="admin-layout">
      <Headers />

      {/*  Toast container (đặt ở đây nếu bạn chưa muốn sửa App.jsx) */}
      <ToastContainer position="top-right" autoClose={2500} newestOnTop />

      <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
        <aside
          className="d-none d-lg-block"
          style={{ width: 260, borderRight: "1px solid #dee2e6", backgroundColor: "white" }}
        >
          <SidebarMenu />
        </aside>

        <main className="flex-grow-1">
          <div className="d-lg-none p-3 bg-white border-bottom">
            <button className="btn btn-dark rounded-pill px-3" data-bs-toggle="offcanvas" data-bs-target="#adminMenu">
              <i className="bi bi-list me-2"></i> Menu
            </button>
          </div>

          <div className="container py-4">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
              <div>
                <h3 className="fw-bold mb-1">Quản lý danh mục</h3>
                <div className="text-muted">Danh sách danh mục sản phẩm {loading ? "(đang tải...)" : ""}</div>
              </div>

              <button onClick={handleAdd} className="btn btn-primary rounded-pill px-4" disabled={loading}>
                <i className="bi bi-plus-lg me-2"></i>
                Thêm danh mục
              </button>
            </div>

            {/* Stats */}
            <div className="row g-3 mb-4">
              <div className="col-md-3 col-6">
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <div className="d-flex align-items-center gap-3">
                      <div className="rounded-circle bg-primary bg-opacity-10 p-3">
                        <i className="bi bi-tags fs-4 text-primary"></i>
                      </div>
                      <div>
                        <div className="text-muted small">Tổng danh mục</div>
                        <div className="fs-4 fw-bold">{categories.length}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-3 col-6">
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <div className="d-flex align-items-center gap-3">
                      <div className="rounded-circle bg-success bg-opacity-10 p-3">
                        <i className="bi bi-check-circle fs-4 text-success"></i>
                      </div>
                      <div>
                        <div className="text-muted small">Đang hoạt động</div>
                        <div className="fs-4 fw-bold">{activeCategories}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-3 col-6">
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <div className="d-flex align-items-center gap-3">
                      <div className="rounded-circle bg-warning bg-opacity-10 p-3">
                        <i className="bi bi-pause-circle fs-4 text-warning"></i>
                      </div>
                      <div>
                        <div className="text-muted small">Tạm dừng</div>
                        <div className="fs-4 fw-bold">{inactiveCategories}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-3 col-6">
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <div className="d-flex align-items-center gap-3">
                      <div className="rounded-circle bg-info bg-opacity-10 p-3">
                        <i className="bi bi-box-seam fs-4 text-info"></i>
                      </div>
                      <div>
                        <div className="text-muted small">Tổng sản phẩm</div>
                        <div className="fs-4 fw-bold">{totalProducts}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: 60 }}>#</th>
                        <th style={{ width: 80 }}>Icon</th>
                        <th style={{ minWidth: 240 }}>Tên danh mục</th>
                        <th style={{ width: 120 }}>Sản phẩm</th>
                        <th style={{ width: 160 }}>Trạng thái</th>
                        <th style={{ width: 150 }}>Thao tác</th>
                      </tr>
                    </thead>

                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={6} className="text-center text-muted py-4">
                            Đang tải dữ liệu...
                          </td>
                        </tr>
                      ) : categories.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center text-muted py-4">
                            Chưa có danh mục nào.
                          </td>
                        </tr>
                      ) : (
                        categories.map((cat, idx) => (
                          <tr key={cat.id}>
                            <td className="text-muted">{idx + 1}</td>
                            <td>
                              <div
                                className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center"
                                style={{ width: 40, height: 40 }}
                              >
                                <i className={`bi ${cat.icon} fs-5 text-primary`}></i>
                              </div>
                            </td>
                            <td>
                              <div className="fw-bold">{cat.name}</div>
                              <small className="text-muted">{cat.createdAt || "-"}</small>
                            </td>
                            <td>
                              <span className="badge bg-info">{cat.productCount || 0} SP</span>
                            </td>
                            <td>
                              <div className="form-check form-switch">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={cat.isActive}
                                  onChange={() => toggleStatus(cat.id)}
                                  style={{ cursor: "pointer" }}
                                />
                                <label className="form-check-label small">
                                  {cat.isActive ? "Hoạt động" : "Tạm dừng"}
                                </label>
                              </div>
                            </td>
                            <td>
                              <div className="d-flex gap-1">
                                <button onClick={() => handleEdit(cat)} className="btn btn-sm btn-outline-primary" title="Sửa">
                                  <i className="bi bi-pencil"></i>
                                </button>
                                <button onClick={() => handleDelete(cat.id)} className="btn btn-sm btn-outline-danger" title="Xóa">
                                  <i className="bi bi-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Offcanvas sidebar mobile */}
        <div className="offcanvas offcanvas-start d-lg-none" tabIndex="-1" id="adminMenu">
          <div className="offcanvas-header">
            <h5 className="offcanvas-title">Admin Menu</h5>
            <button type="button" className="btn-close" data-bs-dismiss="offcanvas"></button>
          </div>
          <div className="offcanvas-body p-0">
            <SidebarMenu />
          </div>
        </div>

        {/* Modal Thêm/Sửa */}
        {showModal && (
          <>
            <div className="modal-backdrop fade show" onClick={() => !saving && setShowModal(false)}></div>

            <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1055 }}>
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title fw-bold">
                      {editingCategory ? (
                        <>
                          <i className="bi bi-pencil me-2"></i>
                          Sửa danh mục
                        </>
                      ) : (
                        <>
                          <i className="bi bi-plus-lg me-2"></i>
                          Thêm danh mục mới
                        </>
                      )}
                    </h5>
                    <button type="button" className="btn-close" onClick={() => !saving && setShowModal(false)}></button>
                  </div>

                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">
                        Tên danh mục <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="VD: Điện thoại"
                        disabled={saving}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-semibold">Icon</label>
                      <select
                        className="form-select"
                        name="icon"
                        value={formData.icon}
                        onChange={handleInputChange}
                        disabled={saving}
                      >
                        {iconOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <div className="mt-2 p-2 bg-light rounded text-center">
                        <i className={`bi ${formData.icon} fs-1 text-primary`}></i>
                        <div className="small text-muted mt-1">Preview icon</div>
                      </div>
                    </div>

                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                        id="isActive"
                        disabled={saving}
                      />
                      <label className="form-check-label" htmlFor="isActive">
                        <i className="bi bi-check-circle text-success me-1"></i>
                        Kích hoạt danh mục ngay
                      </label>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={saving}>
                      <i className="bi bi-x-lg me-2"></i>
                      Hủy
                    </button>
                    <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
                      <i className="bi bi-check-lg me-2"></i>
                      {saving ? "Đang lưu..." : editingCategory ? "Cập nhật" : "Thêm mới"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
