import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Headers from "../header/header";
import "../css/header.css";
import "../css/index.css";

const API_BASE = "http://localhost:5000";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // format tiền
  const formatVND = (n) =>
    new Intl.NumberFormat("vi-VN").format(Number(n || 0)) + "đ";

  
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/products`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Lỗi tải sản phẩm");
        setProducts(Array.isArray(data?.data) ? data.data : []);
      } catch (err) {
        console.error(err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <>
      <div className="d-flex flex-column min-vh-100">
      {/* ===== HEADER ===== */}
      <Headers />

      {/* ===== MAIN ===== */}
      <main className="container my-4 my-md-5 flex-grow-1">
        <div className="section-wrap p-3 p-md-4">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
           <h2 className="section-title d-flex align-items-center">
  <i className="bi bi-stars text-warning me-2"></i>
  Gợi ý cho bạn
</h2>
            <Link to="/san-pham" className="text-decoration-none fw-bold">
              Xem tất cả <i className="bi bi-chevron-right"></i>
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-5 text-muted">Đang tải sản phẩm...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-5 text-muted">
              Chưa có sản phẩm nào
            </div>
          ) : (
            <div className="product-row">
              {products.map((p) => (
                <Link
                  key={p._id}
                  to={`/san-pham/${p._id}`}
                  className="text-decoration-none text-reset product-card"
                >
                  <div className="p-img">
                    <img
                      src={`${API_BASE}/imgs/${p.image}`}
                      alt={p.name}
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://via.placeholder.com/300x300?text=No+Image";
                      }}
                    />
                  </div>

                  <div className="p-body">
                    <div className="p-name">{p.name}</div>

                    <div className="p-price text-danger fw-bold">
                      {formatVND(p.price)}
                    </div>

                    <div className="p-meta">
                      
                      <span>• Còn {p.quantity} sản phẩm</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ===== FOOTER ===== */}
       <footer className="site-footer py-4 mt-4">
        <div className="container">
          <div className="text-center muted mt-4">
            © 2026 - E-commerce Website
          </div>
        </div>
      </footer>
      </div>
    </>
  );
}
