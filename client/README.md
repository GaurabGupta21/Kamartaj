# The Kamar-Taj Refectory — Frontend

A modern, responsive, beginner-friendly React + Vite frontend for **The Kamar-Taj Refectory — Secure Smart Mess Management & Food-Waste Analytics**, connected to the existing Node.js + Express + MongoDB backend.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js (v18 or higher recommended)
- The backend server running on port `5000` (from `../Backend`)

### 2. Install Dependencies
```bash
cd client
npm install --legacy-peer-deps
```

### 3. Configure Environment Variables
A `.env` file is included in `client/`:
```env
VITE_API_BASE_URL=http://localhost:5000
```
*(If left empty, Vite's dev server proxy will automatically route `/api/*` to `http://localhost:5000`)*.

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5. Build for Production
```bash
npm run build
```

---

## 🎨 Design & Architecture
- **Tech Stack:** React 19 + Vite, React Router v7, Plain CSS (modern design system with green accents, cards, and smooth hover effects), Recharts for admin analytics, and `html5-qrcode` for webcam QR pass scanning.
- **No Overengineering:** Pure React hooks (`useState`, `useEffect`), clear functions, and plain CSS variables without Tailwind, Redux, or TypeScript.

---

## 👥 Supported Roles & Workflows

### 1. 🎓 Student (`role: "student"`)
- **Dashboard (`/student`):** View today's date, personalized greeting, active reservation status, today's meals, and upcoming confirmed bookings.
- **Daily Menu (`/student/menu`):** Browse today's breakfast, lunch, and dinner with items, prices, and remaining capacity. Book meals with custom portion quantities.
- **My Bookings (`/student/bookings`):**
  - Track booking and payment status (`pending_payment`, `confirmed`, `redeemed`, `cancelled`).
  - Cancel unneeded bookings before payment to release reserved seats back to the kitchen.
  - Pay via Razorpay checkout integration.
  - Display and download official single-use cryptographic QR meal passes for confirmed bookings.

### 2. 🍽️ Mess Worker (`role: "staff"`)
- **Worker Hub (`/worker`):** Daily operations dashboard with capacity occupancy metrics and quick task shortcuts.
- **Menu Management (`/worker/menus`):** Create new meal menus (meal type, date, dish items, price, capacity), edit prices or capacities, and delete menus that have zero reservations.
- **QR Scanner (`/worker/scan`):** Live webcam QR pass scanner powered by `html5-qrcode` plus manual 64-character token entry fallback. Real-time verification against backend `POST /api/qr/redeem`.
- **Food Waste Log (`/worker/waste`):** Record physical measurements (in kg) for food prepared, served, and leftover to calculate loss percentages.

### 3. 🛡️ Admin (`role: "admin"`)
- **Executive Analytics (`/admin`):**
  - Metric summary cards: Total meal bookings, successfully redeemed meals, collected revenue, prepared food volume, leftover waste, and loss percentage.
  - Interactive Recharts charts:
    1. Food Prepared vs. Served vs. Wasted comparison by meal.
    2. Food Waste Percentage trend chart.
    3. Daily Revenue Inflow trend area chart.
    4. Live meal capacity vs. booked reservations breakdown table.
  - Time-range filters: Last 7 Days vs. Last 30 Days.

---

## 🔌 Connected Backend REST Endpoints

| Category | HTTP Method & Route | Backend Controller | Role Permission |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST /api/auth/register` | `authController.register` | Public (registers as `student`) |
| **Auth** | `POST /api/auth/login` | `authController.login` | Public (returns JWT & user) |
| **User** | `GET /api/users/me` | `userRoutes.js` | Protected |
| **Menu** | `GET /api/menus/today` | `menuController.getTodayMenus` | Protected (all roles) |
| **Menu** | `POST /api/menus` | `menuController.createMenu` | Protected (`staff`) |
| **Menu** | `PUT /api/menus/:id` | `menuController.updateMenu` | Protected (`staff`) |
| **Menu** | `DELETE /api/menus/:id` | `menuController.deleteMenu` | Protected (`staff`) |
| **Bookings** | `POST /api/bookings` | `bookingController.createBooking` | Protected (`student`) |
| **Bookings** | `GET /api/bookings` | `bookingController.getMyBookings` | Protected (`student`) |
| **Bookings** | `GET /api/bookings/:id` | `bookingController.getBookingById` | Protected (`student`) |
| **Bookings** | `POST /api/bookings/:id/cancel` | `bookingController.cancelBooking` | Protected (`student`) |
| **QR Code** | `GET /api/qr/:bookingId` | `qrController.getQR` | Protected (`student`) |
| **QR Code** | `POST /api/qr/redeem` | `qrController.redeemQR` | Protected (`staff`, `admin`) |
| **Payment** | `POST /api/payments/order/:bookingId` | `paymentController.createOrder` | Protected (`student`) |
| **Payment** | `POST /api/payments/verify` | `paymentController.verifyPayment` | Protected (`student`) |
| **Analytics** | `GET /api/admin/analytics/revenue` | `analyticsController.revenue` | Protected (`admin`) |
| **Analytics** | `GET /api/admin/analytics/bookings` | `analyticsController.bookings` | Protected (`admin`) |
| **Analytics** | `GET /api/admin/analytics/capacity` | `analyticsController.capacity` | Protected (`admin`) |
| **Analytics** | `POST /api/admin/analytics/wastage` | `analyticsController.addWastage` | Protected (`admin`) |
| **Analytics** | `GET /api/admin/analytics/wastage` | `analyticsController.wastage` | Protected (`admin`) |

---

## 📌 Backend Integration Notes & Missing Endpoints

1. **User / Staff Management Missing in Backend:**
   - The backend currently has no route to list or edit users (e.g. `GET /api/users` or `GET /api/admin/users`).
   - Registration creates `student` accounts. `staff` (mess worker) and `admin` roles are provisioned in MongoDB directly.
   - The Admin dashboard includes an informative integration note documenting this endpoint requirement.

2. **Wastage Route Role Permission:**
   - In `Backend/src/routes/analyticsRoutes.js`, the router sets `router.use(protect, allowRoles("admin"))`.
   - Both `POST /api/admin/analytics/wastage` and `GET /api/admin/analytics/wastage` fall under this admin restriction.
   - For mess workers (`staff`) to record kitchen wastage without 403 Access Denied, the backend route in `analyticsRoutes.js` should permit `allowRoles("admin", "staff")`. The frontend cleanly handles and displays this permission requirement.
