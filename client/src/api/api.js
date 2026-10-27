// Centralized API helper for The Kamar-Taj Refectory
// Connects to existing Node.js + Express backend

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

// Token & User storage helpers
export const getStoredToken = () => {
  return localStorage.getItem("refectory_token") || null;
};

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem("refectory_user");
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error("Error parsing stored user", err);
    return null;
  }
};

export const setAuthData = (token, user) => {
  if (token) localStorage.setItem("refectory_token", token);
  if (user) localStorage.setItem("refectory_user", JSON.stringify(user));
};

export const clearAuthData = () => {
  localStorage.removeItem("refectory_token");
  localStorage.removeItem("refectory_user");
};

// Generic request wrapper with auth header & error handling
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getStoredToken();

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (networkError) {
    console.error(`Network error when calling ${endpoint}:`, networkError);
    throw new Error("Unable to connect to the server. Please ensure the backend is running.");
  }

  // Handle 401 Unauthorized - session expired
  if (response.status === 401) {
    // If not already on login page or attempting to log in, notify listener
    const isAuthRoute = endpoint.startsWith("/api/auth/");
    if (!isAuthRoute) {
      clearAuthData();
      window.dispatchEvent(new Event("refectory:unauthorized"));
    }
  }

  let data;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const message = (data && data.message) || response.statusText || `Request failed (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// 1. Authentication APIs
export const authAPI = {
  login: async (email, password) => {
    return request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  register: async (name, email, password) => {
    return request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
  },

  getMe: async () => {
    return request("/api/users/me", {
      method: "GET",
    });
  },
};

// 2. Menu APIs
export const menuAPI = {
  getTodayMenus: async () => {
    return request("/api/menus/today", {
      method: "GET",
    });
  },

  getMenuById: async (id) => {
    return request(`/api/menus/${id}`, {
      method: "GET",
    });
  },

  createMenu: async ({ mealType, date, items, price, capacity }) => {
    return request("/api/menus", {
      method: "POST",
      body: JSON.stringify({
        mealType,
        date,
        items,
        price: Number(price),
        capacity: Number(capacity),
      }),
    });
  },

  updateMenu: async (id, data) => {
    return request(`/api/menus/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  deleteMenu: async (id) => {
    return request(`/api/menus/${id}`, {
      method: "DELETE",
    });
  },
};

// 3. Booking APIs (Student)
export const bookingAPI = {
  createBooking: async (menuId, quantity = 1) => {
    return request("/api/bookings", {
      method: "POST",
      body: JSON.stringify({ menuId, quantity: Number(quantity) }),
    });
  },

  getMyBookings: async () => {
    return request("/api/bookings", {
      method: "GET",
    });
  },

  getBookingById: async (id) => {
    return request(`/api/bookings/${id}`, {
      method: "GET",
    });
  },

  getBookingStatus: async (id) => {
    return request(`/api/bookings/${id}/status`, {
      method: "GET",
    });
  },

  cancelBooking: async (id) => {
    return request(`/api/bookings/${id}/cancel`, {
      method: "POST",
    });
  },
};

// 4. QR Code APIs
export const qrAPI = {
  getQR: async (bookingId) => {
    return request(`/api/qr/${bookingId}`, {
      method: "GET",
    });
  },

  redeemQR: async (token) => {
    return request("/api/qr/redeem", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  },
};

// 5. Payment APIs (Razorpay)
export const paymentAPI = {
  createOrder: async (bookingId) => {
    return request(`/api/payments/order/${bookingId}`, {
      method: "POST",
    });
  },

  verifyPayment: async (paymentData) => {
    return request("/api/payments/verify", {
      method: "POST",
      body: JSON.stringify(paymentData),
    });
  },
};

// 6. Admin & Analytics APIs
export const analyticsAPI = {
  getRevenue: async (days = 7) => {
    return request(`/api/admin/analytics/revenue?days=${days}`, {
      method: "GET",
    });
  },

  getBookings: async (days = 7) => {
    return request(`/api/admin/analytics/bookings?days=${days}`, {
      method: "GET",
    });
  },

  getCapacity: async () => {
    return request("/api/admin/analytics/capacity", {
      method: "GET",
    });
  },

  addWastage: async ({ date, mealType, preparedKg, servedKg, wastedKg }) => {
    return request("/api/admin/analytics/wastage", {
      method: "POST",
      body: JSON.stringify({
        date,
        mealType,
        preparedKg: Number(preparedKg),
        servedKg: Number(servedKg),
        wastedKg: Number(wastedKg),
      }),
    });
  },

  getWastage: async (days = 7) => {
    return request(`/api/admin/analytics/wastage?days=${days}`, {
      method: "GET",
    });
  },
};
