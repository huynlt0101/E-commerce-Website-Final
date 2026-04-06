import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import "../css/header.css";
import "../css/index.css";
import Headers from "../header/header";
import useCart from "../hooks/useCart";

const API_BASE = "http://localhost:5000";

export default function ProductDetail() {
  const { id } = useParams();
const navigate = useNavigate();
const { addToCart } = useCart();

const handleBuyNow = () => {
  addToCart(product, 1);     
  navigate("/gio-hang");        
};
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const formatVND = (n) =>
    new Intl.NumberFormat("vi-VN").format(Number(n || 0)) + "đ";

  // fallback ảnh nếu lỗi
  const fallbackImg = useMemo(
    () => "https://via.placeholder.com/600x600.png?text=No+Image",
    []
  );

  useEffect(() => {
    let ignore = false;

    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/products/${id}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data?.message || "Không tìm thấy sản phẩm");

        if (!ignore) setProduct(data?.data || null);
      } catch (err) {
        console.error(err);
        if (!ignore) setProduct(null);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchDetail();

    return () => {
      ignore = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="bg-light">
        <Headers />
        <div className="container py-5 text-center text-muted">Đang tải...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-light">
        <Headers />
        <div className="container py-5 text-center">
          <div className="alert alert-danger">
            Sản phẩm không tồn tại hoặc đã bị xoá.
          </div>
          <Link to="/" className="btn btn-primary rounded-pill px-4">
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  const imageUrl = product.image
    ? `${API_BASE}/imgs/${product.image}`
    : fallbackImg;

  const categoryName = product.category?.name || "Danh mục";
  const productName = product.name || "Sản phẩm";

  return (
    <div className="bg-light">
      <Headers />

      <div className="container py-3 py-md-4">
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="mb-2">
          <ol className="breadcrumb small mb-0">
            <li className="breadcrumb-item">
              <Link to="/" className="text-decoration-none">
                Trang chủ
              </Link>
            </li>
            <li className="breadcrumb-item">
              <a href="#" className="text-decoration-none">
                {categoryName}
              </a>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              {productName}
            </li>
          </ol>
        </nav>

        {/* Title row */}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
          <h3 className="m-0 fw-bold">{productName}</h3>
        </div>

        <div className="row g-3 g-lg-4">
          {/* LEFT: gallery */}
          <div className="col-12 col-lg-8">
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-body p-3 p-md-4">
                {/* Main image */}
                <div className="ratio ratio-16x9 bg-white rounded-4 overflow-hidden border">
                  <img
                    src={imageUrl}
                    alt={productName}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                    onError={(e) => {
                      e.currentTarget.src = fallbackImg;
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: buy box */}
          <div className="col-12 col-lg-4">
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-body p-3 p-md-4">
                {/* Price */}
                <div className="mb-3">
                  <div className="d-flex align-items-end gap-2 flex-wrap">
                    <div className="h4 m-0 fw-bold text-danger">
                      {formatVND(product.price)}
                    </div>
                  </div>
                  <div className="small text-muted mt-1">
                    Giá đã gồm VAT • Miễn phí giao hàng
                  </div>
                </div>

                <div className="mb-2">
                  <span className="text-muted">Danh mục: </span>
                  <span className="fw-semibold">{categoryName}</span>
                </div>

                <div className="mb-3">
                  <span className="text-muted">Số lượng còn: </span>
                  <span className="fw-semibold">{product.quantity ?? 0}</span>
                </div>

                {/* Actions */}
                <div className="d-grid gap-2">
                 <button
  className="btn btn-danger btn-lg rounded-4 fw-bold"
  onClick={handleBuyNow}
>
  MUA NGAY
</button>
                </div>

                {/* Policy */}
                <div className="mt-3 small text-muted">
                  <div className="d-flex gap-2 align-items-start mb-2">
                    <i className="bi bi-shield-check"></i>
                    <span>Bảo hành chính hãng 12 tháng</span>
                  </div>
                  <div className="d-flex gap-2 align-items-start mb-2">
                    <i className="bi bi-truck"></i>
                    <span>Giao nhanh 2h (tuỳ khu vực)</span>
                  </div>
                  <div className="d-flex gap-2 align-items-start">
                    <i className="bi bi-arrow-repeat"></i>
                    <span>Đổi trả trong 7 ngày nếu lỗi</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: description */}
       <div className="row g-3 g-lg-4 mt-1">
  <div className="col-12 col-lg-8">
    <div className="card border-0 shadow-sm rounded-4">
      <div className="card-body p-3 p-md-4">
        <h5 className="fw-bold mb-2">Mô tả sản phẩm</h5>

        <div
          className="text-muted product-description"
          dangerouslySetInnerHTML={{
            __html:
              product.description ||
              "<p>Chưa có mô tả cho sản phẩm này.</p>",
          }}
        />
      </div>
    </div>
  </div>
</div>

      </div>
        <footer className="site-footer py-4 mt-4">
        <div className="container">
          <div className="text-center muted mt-4">
            © 2026 - E-commerce Website
          </div>
        </div>
      </footer>
    </div>
  );
}
