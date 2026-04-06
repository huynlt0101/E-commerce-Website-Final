import { useEffect, useMemo, useState } from "react";
import { CartContext } from "../context/CartContext";

const LS_KEY = "cart_items_v1";

export default function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  }, [items]);

  const addToCart = (product, qty = 1) => {
    if (!product?._id) return;

    setItems((prev) => {
      const idx = prev.findIndex((x) => x._id === product._id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + qty };
        return next;
      }
      return [
        ...prev,
        {
          _id: product._id,
          name: product.name || "Sản phẩm",
          price: Number(product.price || 0),
          image: product.image || "",
          qty,
        },
      ];
    });
  };

  const inc = (id) =>
    setItems((prev) => prev.map((x) => (x._id === id ? { ...x, qty: x.qty + 1 } : x)));

  const dec = (id) =>
    setItems((prev) =>
      prev
        .map((x) => (x._id === id ? { ...x, qty: x.qty - 1 } : x))
        .filter((x) => x.qty > 0)
    );

  const remove = (id) => setItems((prev) => prev.filter((x) => x._id !== id));
  const clear = () => setItems([]);

  const subtotal = useMemo(
    () => items.reduce((sum, x) => sum + Number(x.price || 0) * Number(x.qty || 0), 0),
    [items]
  );

  const value = useMemo(
    () => ({ items, addToCart, inc, dec, remove, clear, subtotal }),
    [items, subtotal]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
