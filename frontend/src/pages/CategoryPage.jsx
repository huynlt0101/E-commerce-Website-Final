import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Headers from "../header/header";
import "../css/header.css";
import "../css/index.css";

const API_BASE = "http://localhost:5000";

export default function CategoryPage() {
  const { id } = useParams();
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  const formatVND = (n) =>
    new Intl.NumberFormat("vi-VN").format(Number(n || 0)) + "đ";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Lấy thông tin danh mục
        const catRes = await fetch(`${API_BASE}/api/categories/${id}`);
        const catData = await catRes.json();
        if (catRes.ok) setCategory(catData?.data || null);

        // Lấy sản phẩm theo danh mục
        const res = await fetch(`${API_BASE}/api/products/category/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message);

        setProducts(Array.isArray(data?.data) ? data.data : []);
      } catch (err) {
        console.error(err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  return (
    <>
     <div className="bg-light d-flex flex-column min-vh-100">
      <Headers />

      <main className="container my-4 my-md-5 flex-grow-1">
        <div className="section-wrap p-3 p-md-4">

          {/* ===== TITLE ===== */}
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
            <h2 className="fw-bold d-flex align-items-center">
              <i className="bi bi-grid-fill text-warning me-2"></i>
              {category?.name || "Danh mục"}
            </h2>

            <Link to="/" className="fw-semibold text-decoration-none">
              <i className="bi bi-arrow-left me-1"></i> Quay lại
            </Link>
          </div>

          {/* ===== CONTENT ===== */}
          {loading ? (
            <div className="text-center py-5 text-muted">
              Đang tải sản phẩm...
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-5 text-muted">
              Danh mục này chưa có sản phẩm
            </div>
          ) : (
            <div className="row g-4">
              {products.map((p) => (
                <div key={p._id} className="col-12 col-sm-6 col-md-4 col-lg-3">
                  <div className="category-card h-100">

                    <Link
                      to={`/san-pham/${p._id}`}
                      className="text-decoration-none text-reset"
                    >
                      <div className="category-img">
                        <img
                          src={`${API_BASE}/imgs/${p.image}`}
                          alt={p.name}
                          onError={(e) => {
                            e.currentTarget.src =
                              "https://via.placeholder.com/300x300?text=No+Image";
                          }}
                        />
                      </div>
                    </Link>

                    <div className="category-body d-flex flex-column">
                      <h6 className="category-name">
                        {p.name}
                      </h6>

                      <div className="category-price">
                        {formatVND(p.price)}
                      </div>

                      <div className="category-stock mb-3">
                        <i className="bi bi-box-seam"></i>
                        <span>Còn {p.quantity} sản phẩm</span>
                      </div>

                    
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="site-footer py-4 mt-4 bg-light">
        <div className="container text-center">
          © 2026 - E-commerce Website
        </div>
      </footer>
      </div>
    </>
  );
}