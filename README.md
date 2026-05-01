# Nexatech Shop

A full-stack e-commerce platform built on the **MERN stack**, featuring a dual-panel architecture for customers and administrators, MoMo payment gateway integration with cryptographic signature verification, and atomic inventory management designed to prevent overselling under concurrent load.

---

## Key Features

### Customer
- Browse products by category with full-text search and filtering
- Persistent shopping cart backed by `localStorage` (survives page refresh)
- Address lookup powered by Open API Provinces VN (province → district → ward cascade)
- Checkout with **COD** or **MoMo e-wallet** payment
- Real-time payment status tracking after MoMo redirect
- Product review system with star ratings (one review per user per product, enforced at the database level)
- Password reset via secure tokenized email (nodemailer + Gmail SMTP)

### Admin
- Dashboard with monthly revenue and order statistics (MongoDB aggregation pipeline)
- Full CRUD for products (with image upload via Multer) and categories
- Order management with fulfillment status updates
- User management with active/inactive toggle

### Security & Data Integrity
- **HMAC-SHA256 signature** on every MoMo payment request and IPN callback — tampered payloads are rejected before any order state changes
- **Atomic inventory deduction** using MongoDB `findOneAndUpdate` with `$gte` + `$inc` — stock check and decrement happen in a single database operation, eliminating race conditions
- **Idempotency guards** — `isPaid` flag on orders and `inventoryDeducted` flag on inventory deduction prevent double-processing when both MoMo IPN and return URL callbacks fire
- **Server-side price validation** — checkout controller fetches authoritative prices from the database and ignores all client-submitted prices
- **bcrypt password hashing** via Mongoose `pre('save')` hook; password field excluded from all queries by default (`select: false`)
- **JWT authentication** with role-based access control (`user` / `admin`)

---

## Project Structure

```
nexatech-shop/
├── backend/
│   ├── config/          # Database connection (Mongoose)
│   ├── controllers/     # Route handlers — auth, orders, products, momo, reviews, users
│   ├── middleware/      # JWT protect, role authorize, Multer image upload
│   ├── models/          # Mongoose schemas — User, Product, Category, Order, Review
│   ├── routes/          # Express routers — one file per resource
│   ├── utils/           # HMAC-SHA256 MoMo signature helpers, email sender
│   ├── imgs/            # Uploaded product images (served as static files)
│   └── server.js        # Entry point — Express app, middleware, route registration
│
└── frontend/
    ├── public/
    └── src/
        ├── admin/       # Admin dashboard pages and components
        ├── context/     # CartProvider (Context API + localStorage persistence)
        ├── user/        # Customer-facing pages — Home, Product, Checkout, Orders
        ├── components/  # Shared UI components
        └── main.jsx     # App entry point — React Router, CartProvider wrapper
```

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19.2.0 | UI library |
| Vite | 7.2.4 | Build tool & HMR dev server |
| React Router DOM | 7.12.0 | Client-side routing |
| Bootstrap | 5.3.8 | Responsive layout & UI components |
| Chart.js + react-chartjs-2 | 4.5.1 / 5.3.1 | Admin revenue & order charts |
| TipTap | 3.18.0 | Rich-text product description editor |
| SweetAlert2 | 11.26.18 | Confirmation modals |
| React Toastify | 11.0.5 | Toast notifications |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | — | JavaScript runtime |
| Express | 5.2.1 | HTTP server & routing |
| jsonwebtoken | 9.0.3 | JWT generation & verification |
| bcryptjs | 3.0.3 | Password hashing |
| Multer | 2.0.2 | Multipart image upload |
| nodemailer | 8.0.1 | Transactional email (password reset) |
| crypto (built-in) | — | HMAC-SHA256 MoMo signatures |
| dotenv | 17.2.3 | Environment variable management |
| cors | 2.8.6 | Cross-origin resource sharing |

### Database
| Technology | Version | Purpose |
|---|---|---|
| MongoDB | — | Document database |
| Mongoose | 9.1.5 | ODM — schema definition, validation, population |

---

## Installation

### Prerequisites
- Node.js >= 18
- MongoDB running locally on port `27017` (or a MongoDB Atlas URI)
- A MoMo developer sandbox account

### 1. Clone the repository

```bash
git clone https://github.com/huynlt0101/nexatech-shop.git
cd nexatech-shop
```

### 2. Configure backend environment

Create `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ecommerce

JWT_SECRET=your_jwt_secret_key

# MoMo Sandbox
MOMO_PARTNER_CODE=MOMO_ATM
MOMO_ACCESS_KEY=your_access_key
MOMO_SECRET_KEY=your_secret_key
MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create
MOMO_REDIRECT_URL=http://localhost:5000/api/momo/return
MOMO_IPN_URL=https://your-ngrok-url.ngrok.io/api/momo/ipn
MOMO_FRONTEND_RETURN_URL=http://localhost:5173/gio-hang

# Gmail SMTP (password reset)
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_app_password
```

> **MoMo IPN note:** The IPN URL must be publicly reachable. Use [ngrok](https://ngrok.com/) during local development: `ngrok http 5000`.

### 3. Install dependencies and start the backend

```bash
cd backend
npm install
npm run dev
```

The API server starts on `http://localhost:5000`.

### 4. Install dependencies and start the frontend

```bash
cd frontend
npm install
npm run dev
```

The React app starts on `http://localhost:5173`.

---

## Security Highlights

| Concern | Implementation |
|---|---|
| Payment authenticity | Every MoMo IPN payload is verified with HMAC-SHA256 before any order state is modified |
| Overselling prevention | Inventory deduction uses a single atomic `findOneAndUpdate` with a `$gte` stock check |
| Double-processing prevention | `isPaid` and `inventoryDeducted` flags ensure IPN + return URL callbacks are both safe to fire |
| Price manipulation | Server recalculates order total from database prices — client-submitted prices are ignored |
| Credential security | Passwords are hashed with bcrypt (cost 10) and excluded from all query results by default |
| Authorization | `protect` middleware verifies JWT on every protected route; `authorize("admin")` guards admin endpoints |

---

## API Overview

| Group | Base Path | Key Endpoints |
|---|---|---|
| Auth | `/api/auth` | `POST /register`, `POST /login`, `POST /forgot-password`, `GET /me` |
| Products | `/api/products` | `GET /`, `GET /:id`, `POST /` (admin), `PUT /:id` (admin) |
| Categories | `/api/categories` | `GET /`, `POST /` (admin), `PATCH /:id/toggle` (admin) |
| Orders | `/api/orders` | `POST /`, `GET /my`, `PATCH /:id/status` (admin) |
| Reviews | `/api/reviews` | `GET /product/:id`, `POST /` (auth), `PUT /:id` (auth) |
| MoMo | `/api/momo` | `POST /create` (auth), `POST /ipn` (public), `GET /return` (public) |
| Users | `/api/users` | `GET /` (admin), `GET /total` (admin) |

---

## License

This project was developed as part of the COMP1682 module. All rights reserved.
