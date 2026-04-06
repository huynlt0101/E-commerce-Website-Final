import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import Headers from "../header/header";
import "../css/admin.css";
import Swal from "sweetalert2";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DescriptionEditor from "../components/editor/DescriptionEditor";

/* ====== Sidebar ====== */
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

/* ====== Helpers ====== */
const API_BASE = "http://localhost:5000";

const emptyForm = {
  id: null,
  name: "",
  price: "",
  quantity: "",
  category: "",
  description: "",
  image: null
};

const formatVND = (n) => new Intl.NumberFormat("vi-VN").format(Number(n || 0)) + "đ";

export default function AdminProducts() {
  const token = localStorage.getItem("token");

  const authHeaders = useMemo(() => {
    const h = {};
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }, [token]);

  // data
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  // loading states
  const [loading, setLoading] = useState(false);
  const [catLoading, setCatLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // search
  const [search, setSearch] = useState("");

  // modal
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState("add"); // add | edit
  const [form, setForm] = useState(emptyForm);

  /* ============================ FETCH ============================ */
  const fetchProducts = async (searchText = "") => {
    try {
      setLoading(true);
      const qs = searchText ? `?search=${encodeURIComponent(searchText)}` : "";
      const res = await fetch(`${API_BASE}/api/products${qs}`, { method: "GET" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Lỗi tải sản phẩm");
      setProducts(Array.isArray(data?.data) ? data.data : []);
    } catch (err) {
      toast.error(err.message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setCatLoading(true);
      const res = await fetch(`${API_BASE}/api/categories`, {
        method: "GET",
        headers: authHeaders // nếu API categories không cần token vẫn OK
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Lỗi tải danh mục");
      const items = Array.isArray(data?.data) ? data.data : [];
      setCategories(items.filter((c) => c.isActive !== false));
    } catch (err) {
      toast.error(err.message);
      setCategories([]);
    } finally {
      setCatLoading(false);
    }
  };

 
  useEffect(() => {
    let ignore = false;

    const init = async () => {
      try {
        setCatLoading(true);
        const resCat = await fetch(`${API_BASE}/api/categories`, {
          method: "GET",
          headers: authHeaders
        });
        const dataCat = await resCat.json();
        if (!resCat.ok) throw new Error(dataCat?.message || "Lỗi tải danh mục");
        const items = Array.isArray(dataCat?.data) ? dataCat.data : [];
        if (!ignore) setCategories(items.filter((c) => c.isActive !== false));
      } catch (e) {
        if (!ignore) {
          toast.error(e.message);
          setCategories([]);
        }
      } finally {
        if (!ignore) setCatLoading(false);
      }

      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/products`, { method: "GET" });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Lỗi tải sản phẩm");
        if (!ignore) setProducts(Array.isArray(data?.data) ? data.data : []);
      } catch (e) {
        if (!ignore) {
          toast.error(e.message);
          setProducts([]);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    init();

    // lắng nghe event refresh categories/header (nếu bạn đã làm)
    const onCategoriesChanged = () => fetchCategories();
    window.addEventListener("categories:changed", onCategoriesChanged);

    return () => {
      ignore = true;
      window.removeEventListener("categories:changed", onCategoriesChanged);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ============================ MODAL ============================ */
  const openAdd = () => {
    setMode("add");
    setForm({ ...emptyForm, category: categories?.[0]?._id || "" });
    setShowModal(true);
  };

  const openEdit = (p) => {
    setMode("edit");
    setForm({
      id: p._id,
      name: p.name || "",
      price: String(p.price ?? ""),
      quantity: String(p.quantity ?? ""),
      category: p.category?._id || p.category || "",
      description: p.description || "",
      image: null
    });
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setForm(emptyForm);
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
  };

  const validate = () => {
    if (!form.name.trim()) return "Vui lòng nhập tên sản phẩm";
    if (form.price === "" || Number(form.price) < 0) return "Giá không hợp lệ";
    if (form.quantity === "" || Number(form.quantity) < 0) return "Số lượng không hợp lệ";
    if (!form.category) return "Vui lòng chọn danh mục";
    if (mode === "add" && !form.image) return "Vui lòng chọn ảnh sản phẩm";
    return "";
  };

  /* ============================ SUBMIT ============================ */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) return toast.warning(err);

    try {
      setSaving(true);

      const fd = new FormData();
      fd.append("name", form.name.trim());
      fd.append("price", String(form.price));
      fd.append("quantity", String(form.quantity));
      fd.append("category", form.category);
      fd.append("description", form.description || "");
      if (form.image) fd.append("image", form.image);

      const url =
        mode === "add"
          ? `${API_BASE}/api/products`
          : `${API_BASE}/api/products/${form.id}`;

      const res = await fetch(url, {
        method: mode === "add" ? "POST" : "PUT",
        headers: authHeaders, // ❗ KHÔNG set Content-Type khi gửi FormData
        body: fd
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Lưu thất bại");

      toast.success(mode === "add" ? "Thêm sản phẩm thành công!" : "Cập nhật sản phẩm thành công!");
      closeModal();
      fetchProducts(search);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  /* ============================ DELETE ============================ */
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Xoá sản phẩm?",
      text: "Bạn chắc chắn muốn xoá sản phẩm này?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xoá",
      cancelButtonText: "Huỷ",
      confirmButtonColor: "#dc3545",
      cancelButtonColor: "#6c757d"
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`${API_BASE}/api/products/${id}`, {
        method: "DELETE",
        headers: authHeaders
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Xoá thất bại");

      toast.success("Đã xoá sản phẩm!");
      fetchProducts(search);
    } catch (err) {
      toast.error(err.message);
    }
  };

  /* ============================ SEARCH ============================ */
  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts(search);
  };

  return (
    <div className="admin-layout">
      <Headers />

      {/* toast */}
      <ToastContainer position="top-right" autoClose={2500} newestOnTop />

      {/* mobile menu button */}
      <div className="d-lg-none container pt-3">
        <button className="btn btn-dark rounded-pill px-3" data-bs-toggle="offcanvas" data-bs-target="#adminMenu">
          <i className="bi bi-list me-2"></i> Menu
        </button>
      </div>

      {/* offcanvas sidebar mobile */}
      <div className="offcanvas offcanvas-start d-lg-none" tabIndex="-1" id="adminMenu">
        <div className="offcanvas-header">
          <h5 className="offcanvas-title">Admin Menu</h5>
          <button type="button" className="btn-close" data-bs-dismiss="offcanvas"></button>
        </div>
        <div className="offcanvas-body p-0">
          <SidebarMenu />
        </div>
      </div>

      <div className="d-flex">
        {/* desktop sidebar */}
        <aside className="admin-sidebar">
          <SidebarMenu />
        </aside>

        {/* content */}
        <main className="admin-content">
          <div className="container py-4">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
              <div>
                <h3 className="fw-bold mb-1">Quản lý sản phẩm</h3>
                <div className="text-muted">Thêm / sửa / xoá sản phẩm</div>
              </div>

              <button onClick={openAdd} className="btn btn-primary rounded-pill px-3" disabled={catLoading}>
                <i className="bi bi-plus-lg me-2"></i> Thêm sản phẩm
              </button>
            </div>

            {/* search bar */}
            <form onSubmit={handleSearch} className="d-flex gap-2 mb-3">
              <input
                className="form-control"
                placeholder="Tìm theo tên sản phẩm (vd: ip, mac...)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button className="btn btn-outline-primary" type="submit" disabled={loading}>
                <i className="bi bi-search me-1"></i> Tìm
              </button>
              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={() => {
                  setSearch("");
                  fetchProducts("");
                }}
              >
                Reset
              </button>
            </form>

            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{ minWidth: 240 }}>Sản phẩm</th>
                        <th style={{ width: 140 }}>Giá</th>
                        <th style={{ width: 110 }}>SL</th>
                        <th style={{ width: 170 }}>Danh mục</th>
                        <th style={{ width: 110 }}>Ảnh</th>
                        <th style={{ minWidth: 260 }}>Mô tả</th>
                        <th style={{ width: 160 }} className="text-end">
                          Hành động
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={7} className="text-center text-muted py-4">
                            Đang tải dữ liệu...
                          </td>
                        </tr>
                      ) : products.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center text-muted py-4">
                            Chưa có sản phẩm nào.
                          </td>
                        </tr>
                      ) : (
                        products.map((p) => (
                          <tr key={p._id}>
                            <td className="fw-semibold">{p.name}</td>
                            <td className="text-danger fw-bold">{formatVND(p.price)}</td>
                            <td>{p.quantity}</td>
                            <td>
                              <span className="badge text-bg-light border">
                                {p.category?.name || "—"}
                              </span>
                            </td>
                            <td>
                              <img
                                src={`${API_BASE}/imgs/${p.image}`}
                                alt={p.name}
                                style={{ width: 54, height: 54, objectFit: "cover", borderRadius: 10 }}
                                onError={(e) => {
                                  e.currentTarget.src =
                                    "https://via.placeholder.com/54x54.png?text=No+Img";
                                }}
                              />
                            </td>
                            <td className="text-muted">
  <div
    style={{ maxWidth: 520 }}
    dangerouslySetInnerHTML={{
      __html: p.description || "<p>Chưa có mô tả cho sản phẩm này.</p>",
    }}
  />
</td>
                            <td className="text-end">
                              <div className="btn-group">
                                <button className="btn btn-outline-primary btn-sm" onClick={() => openEdit(p)}>
                                  <i className="bi bi-pencil-square me-1"></i> Sửa
                                </button>
                                <button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(p._id)}>
                                  <i className="bi bi-trash me-1"></i> Xoá
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="small text-muted mt-2">
                  * Dữ liệu đang lấy trực tiếp từ API: <b>/api/products</b> và <b>/api/categories</b>
                </div>
              </div>
            </div>
          </div>

          {/* MODAL */}
          {showModal && (
            <div className="modal show" style={{ display: "block", background: "rgba(0,0,0,.45)" }} role="dialog" aria-modal="true">
              <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content rounded-4 border-0">
                  <div className="modal-header">
                    <h5 className="modal-title fw-bold">{mode === "add" ? "Thêm sản phẩm" : "Sửa sản phẩm"}</h5>
                    <button type="button" className="btn-close" onClick={closeModal}></button>
                  </div>

                  <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                      <div className="row g-3">
                        <div className="col-12">
                          <label className="form-label fw-semibold">Tên sản phẩm</label>
                          <input
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            className="form-control"
                            placeholder="VD: iPhone 15 Pro Max..."
                            disabled={saving}
                          />
                        </div>

                        <div className="col-12 col-md-4">
                          <label className="form-label fw-semibold">Số lượng</label>
                          <input
                            name="quantity"
                            value={form.quantity}
                            onChange={handleChange}
                            type="number"
                            min="0"
                            className="form-control"
                            placeholder="VD: 10"
                            disabled={saving}
                          />
                        </div>

                        <div className="col-12 col-md-4">
                          <label className="form-label fw-semibold">Giá tiền (VND)</label>
                          <input
                            name="price"
                            value={form.price}
                            onChange={handleChange}
                            type="number"
                            min="0"
                            className="form-control"
                            placeholder="VD: 39990000"
                            disabled={saving}
                          />
                          <div className="small text-muted mt-1">
                            Hiển thị: <b>{formatVND(form.price)}</b>
                          </div>
                        </div>

                        <div className="col-12 col-md-4">
                          <label className="form-label fw-semibold">Danh mục</label>
                          <select
                            name="category"
                            value={form.category}
                            onChange={handleChange}
                            className="form-select"
                            disabled={saving || catLoading}
                          >
                            <option value="">{catLoading ? "Đang tải danh mục..." : "-- Chọn danh mục --"}</option>
                            {categories.map((c) => (
                              <option key={c._id} value={c._id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="col-12">
                          <label className="form-label fw-semibold">Mô tả</label>
                        <DescriptionEditor
    value={form.description}
    disabled={saving}
    onChange={(html) =>
      setForm((prev) => ({ ...prev, description: html }))
    }
  />
                        </div>

                        <div className="col-12">
                          <label className="form-label fw-semibold">
                            Ảnh sản phẩm {mode === "edit" ? <span className="text-muted">(chọn nếu muốn thay ảnh)</span> : null}
                          </label>
                          <input name="image" onChange={handleChange} type="file" className="form-control" disabled={saving} />
                        </div>
                      </div>
                    </div>

                    <div className="modal-footer">
                      <button type="button" className="btn btn-outline-secondary" onClick={closeModal} disabled={saving}>
                        Huỷ
                      </button>
                      <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? "Đang lưu..." : mode === "add" ? "Thêm" : "Lưu thay đổi"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
