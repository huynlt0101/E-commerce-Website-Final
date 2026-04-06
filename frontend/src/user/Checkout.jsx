import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Headers from "../header/header";
import useCart from "../hooks/useCart";

const API_BASE = "http://localhost:5000";
const API_LOCATION_BASE = "https://provinces.open-api.vn/api/v2";

export default function Checkout() {
  const navigate = useNavigate();
  const { items, subtotal, clear } = useCart();

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    province: "",
    ward: "",
    addressLine: "",
    note: "",
  });

  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState([]);

  const [loadingProvince, setLoadingProvince] = useState(false);
  const [loadingWard, setLoadingWard] = useState(false);

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const formatVND = (n) =>
    new Intl.NumberFormat("vi-VN").format(Number(n || 0)) + "đ";

  const fetchJson = async (url) => {
    const res = await fetch(url);
    const text = await res.text();
    let data = null;

    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    if (!res.ok) {
      throw new Error(data?.message || "Không thể tải dữ liệu địa chỉ");
    }

    return data;
  };

  const findName = (arr, code) =>
    arr.find((x) => String(x.code) === String(code))?.name || "";

  // ====== LOAD PROVINCES ======
  useEffect(() => {
    let ignore = false;

    (async () => {
      try {
        setLoadingProvince(true);
        const data = await fetchJson(`${API_LOCATION_BASE}/p/`);
        if (!ignore) {
          setProvinces(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Load provinces error:", err);
        if (!ignore) {
          setProvinces([]);
        }
      } finally {
        if (!ignore) {
          setLoadingProvince(false);
        }
      }
    })();

    return () => {
      ignore = true;
    };
  }, []);

  // ====== LOAD WARDS BY PROVINCE ======
  useEffect(() => {
    let ignore = false;

    if (!form.province) {
      setWards([]);
      return;
    }

    (async () => {
      try {
        setLoadingWard(true);
        setWards([]);

        const data = await fetchJson(
          `${API_LOCATION_BASE}/w/?province=${encodeURIComponent(form.province)}`
        );

        if (!ignore) {
          setWards(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Load wards error:", err);
        if (!ignore) {
          setWards([]);
        }
      } finally {
        if (!ignore) {
          setLoadingWard(false);
        }
      }
    })();

    return () => {
      ignore = true;
    };
  }, [form.province]);

  // ====== USER CHECK LOGIN ======
  const user = useMemo(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !user) {
      localStorage.setItem("redirectAfterLogin", "/checkout");
      navigate("/dang-nhap");
      return;
    }

    setForm((prev) => ({
      ...prev,
      fullName: user?.username || user?.fullName || user?.email || "",
      phone: user?.phone || user?.sdt || "",
    }));
  }, [navigate, user]);

  const totalItems = useMemo(
    () => items.reduce((sum, x) => sum + Number(x.qty || 0), 0),
    [items]
  );

  const shippingFee = 0;
  const total = subtotal + shippingFee;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => {
      if (name === "province") {
        return {
          ...prev,
          province: value,
          ward: "",
        };
      }

      return {
        ...prev,
        [name]: value,
      };
    });

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const validate = () => {
    const next = {};

    if (!form.fullName.trim()) next.fullName = "Vui lòng nhập họ tên";
    if (!form.phone.trim()) next.phone = "Vui lòng nhập số điện thoại";
    if (!form.province) next.province = "Chọn tỉnh/thành";
    if (!form.ward) next.ward = "Chọn phường/xã";
    if (!form.addressLine.trim()) next.addressLine = "Nhập địa chỉ cụ thể";
    if (!items.length) next.cart = "Giỏ hàng trống";

    return next;
  };

  // ====== SUBMIT ORDER ======
  const handleSubmit = async (e) => {
    e.preventDefault();

    const nextErrors = validate();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return Swal.fire("Thiếu thông tin", "Vui lòng kiểm tra lại.", "warning");
    }

    const token = localStorage.getItem("token");

    try {
      setSubmitting(true);

      const payload = {
        shippingAddress: {
          fullName: form.fullName,
          phone: form.phone,
          provinceCode: form.province,
          wardCode: form.ward,
          provinceName: findName(provinces, form.province),
          wardName: findName(wards, form.ward),
          addressLine: form.addressLine,
          note: form.note,
        },
        items: items.map((x) => ({
          productId: x._id,
          qty: x.qty,
        })),
      };

      const res = await fetch(`${API_BASE}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let data = null;

      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }

      if (!res.ok) {
        throw new Error(data?.message || "Không thể đặt hàng");
      }

      await Swal.fire(
        "Thành công!",
        "Đơn hàng đã tạo và đang chờ xác minh.",
        "success"
      );

      clear();
      navigate("/");
    } catch (err) {
      Swal.fire("Lỗi", err.message || "Không thể đặt hàng", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-light">
      <Headers />

      <div className="container py-3 py-md-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            <h4 className="m-0 fw-bold">Thanh toán</h4>
            <div className="text-muted small">
              Vui lòng nhập thông tin giao hàng để hoàn tất đơn.
            </div>
          </div>

          <Link to="/gio-hang" className="btn btn-outline-secondary rounded-4">
            ← Quay lại giỏ hàng
          </Link>
        </div>

        {errors.cart ? (
          <div className="alert alert-warning rounded-4">
            {errors.cart}. <Link to="/gio-hang">Về giỏ hàng</Link>
          </div>
        ) : null}

        <div className="row g-3 g-lg-4">
          <div className="col-12 col-lg-7">
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-body p-3 p-md-4">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <i className="bi bi-truck fs-5"></i>
                  <h5 className="m-0 fw-bold">Thông tin giao hàng</h5>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label fw-semibold">
                        Họ tên người thanh toán
                      </label>
                      <input
                        name="fullName"
                        value={form.fullName}
                        onChange={handleChange}
                        className={`form-control rounded-4 ${
                          errors.fullName ? "is-invalid" : ""
                        }`}
                        placeholder="Ví dụ: Nguyễn Văn A"
                      />
                      {errors.fullName ? (
                        <div className="invalid-feedback">{errors.fullName}</div>
                      ) : null}
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">
                        Số điện thoại
                      </label>
                      <input
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        className={`form-control rounded-4 ${
                          errors.phone ? "is-invalid" : ""
                        }`}
                        placeholder="Ví dụ: 09xxxxxxxx"
                      />
                      {errors.phone ? (
                        <div className="invalid-feedback">{errors.phone}</div>
                      ) : null}
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">
                        Ghi chú (tuỳ chọn)
                      </label>
                      <input
                        name="note"
                        value={form.note}
                        onChange={handleChange}
                        className="form-control rounded-4"
                        placeholder="Ví dụ: Giao giờ hành chính…"
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">
                        Tỉnh / Thành
                      </label>
                      <select
                        name="province"
                        value={form.province}
                        onChange={handleChange}
                        className={`form-select rounded-4 ${
                          errors.province ? "is-invalid" : ""
                        }`}
                        disabled={loadingProvince}
                      >
                        <option value="">
                          {loadingProvince
                            ? "Đang tải tỉnh/thành..."
                            : "-- Chọn tỉnh/thành --"}
                        </option>

                        {provinces.map((p) => (
                          <option key={p.code} value={p.code}>
                            {p.name}
                          </option>
                        ))}
                      </select>

                      {errors.province ? (
                        <div className="invalid-feedback">{errors.province}</div>
                      ) : null}
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">
                        Phường / Xã
                      </label>
                      <select
                        name="ward"
                        value={form.ward}
                        onChange={handleChange}
                        className={`form-select rounded-4 ${
                          errors.ward ? "is-invalid" : ""
                        }`}
                        disabled={!form.province || loadingWard}
                      >
                        <option value="">
                          {!form.province
                            ? "Chọn tỉnh trước"
                            : loadingWard
                            ? "Đang tải phường/xã..."
                            : "-- Chọn phường/xã --"}
                        </option>

                        {wards.map((w) => (
                          <option key={w.code} value={w.code}>
                            {w.name}
                          </option>
                        ))}
                      </select>

                      {errors.ward ? (
                        <div className="invalid-feedback">{errors.ward}</div>
                      ) : null}
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-semibold">
                        Địa chỉ cụ thể
                      </label>
                      <input
                        name="addressLine"
                        value={form.addressLine}
                        onChange={handleChange}
                        className={`form-control rounded-4 ${
                          errors.addressLine ? "is-invalid" : ""
                        }`}
                        placeholder="Số nhà, tên đường…"
                      />
                      {errors.addressLine ? (
                        <div className="invalid-feedback">
                          {errors.addressLine}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-danger btn-lg w-100 rounded-4 fw-bold mt-4"
                    disabled={submitting}
                  >
                    {submitting ? "ĐANG XỬ LÝ..." : "ĐẶT HÀNG"}
                  </button>

                  <div className="small text-muted mt-2">
                    Nhấn “Đặt hàng” nghĩa là bạn đồng ý với điều khoản của cửa
                    hàng.
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-5">
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-body p-3 p-md-4">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <i className="bi bi-receipt fs-5"></i>
                  <h5 className="m-0 fw-bold">Tóm tắt đơn hàng</h5>
                </div>

                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Số sản phẩm</span>
                  <span className="fw-semibold">{totalItems}</span>
                </div>

                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Tạm tính</span>
                  <span className="fw-bold">{formatVND(subtotal)}</span>
                </div>

                <div className="d-flex justify-content-between mb-3">
                  <span className="text-muted">Phí ship</span>
                  <span className="fw-bold">{formatVND(shippingFee)}</span>
                </div>

                <hr />

                <div className="d-flex justify-content-between align-items-center">
                  <span className="fw-bold">Tổng thanh toán</span>
                  <span className="h5 m-0 fw-bold text-danger">
                    {formatVND(total)}
                  </span>
                </div>

                <div className="mt-3 small text-muted">
                  Bạn có thể kiểm tra lại số lượng trong giỏ hàng trước khi đặt.
                </div>

                <Link
                  to="/gio-hang"
                  className="btn btn-outline-secondary w-100 rounded-4 mt-3"
                >
                  Chỉnh sửa giỏ hàng
                </Link>
              </div>
            </div>

            <div className="card border-0 shadow-sm rounded-4 mt-3">
              <div className="card-body p-3 p-md-4">
                <div className="fw-bold mb-2">Cam kết</div>

                <div className="small text-muted d-flex gap-2 align-items-start mb-2">
                  <i className="bi bi-shield-check"></i>
                  <span>Đóng gói kỹ, giao nhanh</span>
                </div>

                <div className="small text-muted d-flex gap-2 align-items-start mb-2">
                  <i className="bi bi-arrow-repeat"></i>
                  <span>Đổi trả 7 ngày nếu lỗi</span>
                </div>

                <div className="small text-muted d-flex gap-2 align-items-start">
                  <i className="bi bi-telephone"></i>
                  <span>Hỗ trợ khách hàng 24/7</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {items.length ? (
          <div className="card border-0 shadow-sm rounded-4 mt-3">
            <div className="card-body p-3 p-md-4">
              <div className="fw-bold mb-3">Sản phẩm trong đơn</div>

              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead>
                    <tr className="text-muted small">
                      <th>Sản phẩm</th>
                      <th className="text-end">Đơn giá</th>
                      <th className="text-end">SL</th>
                      <th className="text-end">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((x) => (
                      <tr key={x._id}>
                        <td className="fw-semibold">{x.name}</td>
                        <td className="text-end">{formatVND(x.price)}</td>
                        <td className="text-end">{x.qty}</td>
                        <td className="text-end fw-bold">
                          {formatVND(Number(x.price) * Number(x.qty))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}