/**
 * Shift Platform - Custom API Client Adapter
 * Replaces the proprietary Base44 SDK with standard REST API connectivity,
 * token-based authentication, entity CRUD handlers, and offline fallback.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const FORCE_MOCK = import.meta.env.VITE_USE_MOCK === "true";
const TOKEN_STORAGE_KEY = "shift_auth_token";
const MOCK_STORAGE_PREFIX = "shift_db_";

// Token storage helpers
export const getStoredToken = () => {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY) || localStorage.getItem("base44_access_token") || null;
  } catch {
    return null;
  }
};

export const setStoredToken = (token) => {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      localStorage.setItem("base44_access_token", token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem("base44_access_token");
      localStorage.removeItem("token");
    }
  } catch (e) {
    console.error("Failed to store token", e);
  }
};

// ==========================================
// In-Memory / LocalStorage Mock DB Engine
// (Ensures frontend works seamlessly offline or before backend is booted)
// ==========================================
class LocalStorageMockDB {
  static getCollection(name) {
    try {
      const data = localStorage.getItem(`${MOCK_STORAGE_PREFIX}${name}`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static setCollection(name, items) {
    try {
      localStorage.setItem(`${MOCK_STORAGE_PREFIX}${name}`, JSON.stringify(items));
    } catch (e) {
      console.warn("MockDB storage limit reached", e);
    }
  }

  static generateId() {
    return "id_" + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
  }

  static async list(entityName, sort, limit = 500) {
    let items = this.getCollection(entityName);
    if (sort) {
      const desc = sort.startsWith("-");
      const key = desc ? sort.substring(1) : sort;
      items = [...items].sort((a, b) => {
        const valA = a[key] ?? "";
        const valB = b[key] ?? "";
        return desc ? (valB > valA ? 1 : -1) : (valA > valB ? 1 : -1);
      });
    }
    return items.slice(0, limit);
  }

  static async filter(entityName, query = {}, sort, limit = 500) {
    let items = this.getCollection(entityName);
    items = items.filter((item) => {
      return Object.entries(query).every(([k, v]) => {
        if (v === undefined || v === null) return true;
        return item[k] === v;
      });
    });

    if (sort) {
      const desc = sort.startsWith("-");
      const key = desc ? sort.substring(1) : sort;
      items = [...items].sort((a, b) => {
        const valA = a[key] ?? "";
        const valB = b[key] ?? "";
        return desc ? (valB > valA ? 1 : -1) : (valA > valB ? 1 : -1);
      });
    }
    return items.slice(0, limit);
  }

  static async get(entityName, id) {
    const items = this.getCollection(entityName);
    const item = items.find((i) => String(i.id) === String(id));
    if (!item) throw new Error(`${entityName} with id ${id} not found`);
    return item;
  }

  static async create(entityName, data) {
    const items = this.getCollection(entityName);
    const newItem = {
      id: this.generateId(),
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
      ...data,
    };
    items.unshift(newItem);
    this.setCollection(entityName, items);
    return newItem;
  }

  static async update(entityName, id, data) {
    const items = this.getCollection(entityName);
    const index = items.findIndex((i) => String(i.id) === String(id));
    if (index === -1) {
      // Auto-create if not found to prevent mock desync
      const created = { id, created_date: new Date().toISOString(), updated_date: new Date().toISOString(), ...data };
      items.unshift(created);
      this.setCollection(entityName, items);
      return created;
    }
    const updated = {
      ...items[index],
      ...data,
      updated_date: new Date().toISOString(),
    };
    items[index] = updated;
    this.setCollection(entityName, items);
    return updated;
  }

  static async delete(entityName, id) {
    const items = this.getCollection(entityName);
    const filtered = items.filter((i) => String(i.id) !== String(id));
    this.setCollection(entityName, filtered);
    return { success: true };
  }

  static async bulkUpdate(entityName, updates) {
    const items = this.getCollection(entityName);
    const updatedItems = items.map((item) => {
      const match = updates.find((u) => String(u.id) === String(item.id));
      return match ? { ...item, ...match, updated_date: new Date().toISOString() } : item;
    });
    this.setCollection(entityName, updatedItems);
    return updatedItems;
  }
}

// ==========================================
// HTTP Fetch Client Wrapper
// ==========================================
async function httpRequest(endpoint, options = {}) {
  if (FORCE_MOCK) {
    throw new Error("FORCE_MOCK_ACTIVE");
  }

  const token = getStoredToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      setStoredToken(null);
    }

    const contentType = response.headers.get("content-type");
    let data;
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const error = new Error(data?.message || data?.error || `HTTP error ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    // If backend is down or unreachable, allow graceful fallback
    if (err.name === "TypeError" && err.message.includes("fetch")) {
      console.warn(`[Shift API Client] Backend at ${url} unreachable, falling back to local storage adapter.`);
      throw new Error("NETWORK_UNREACHABLE");
    }
    throw err;
  }
}

// Convert camelCase or PascalCase entity names to URL slugs (e.g. StudentProfile -> student-profiles)
function entityToEndpoint(name) {
  const plural = name.endsWith("s") ? name : `${name}s`;
  return plural
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .toLowerCase();
}

// ==========================================
// Entity CRUD Client Creator
// ==========================================
function createEntityClient(entityName) {
  const endpoint = `entities/${entityToEndpoint(entityName)}`;

  return {
    async list(sort, limit) {
      try {
        const queryParams = new URLSearchParams();
        if (sort) queryParams.set("sort", sort);
        if (limit) queryParams.set("limit", String(limit));
        const qs = queryParams.toString();
        return await httpRequest(`${endpoint}${qs ? "?" + qs : ""}`, { method: "GET" });
      } catch (err) {
        if (FORCE_MOCK || err.message === "NETWORK_UNREACHABLE" || err.message === "FORCE_MOCK_ACTIVE") {
          return await LocalStorageMockDB.list(entityName, sort, limit);
        }
        throw err;
      }
    },

    async filter(query = {}, sort, limit) {
      try {
        const queryParams = new URLSearchParams();
        if (sort) queryParams.set("sort", sort);
        if (limit) queryParams.set("limit", String(limit));
        Object.entries(query).forEach(([k, v]) => {
          if (v !== undefined && v !== null) queryParams.set(k, String(v));
        });
        const qs = queryParams.toString();
        return await httpRequest(`${endpoint}/filter${qs ? "?" + qs : ""}`, { method: "GET" });
      } catch (err) {
        if (FORCE_MOCK || err.message === "NETWORK_UNREACHABLE" || err.message === "FORCE_MOCK_ACTIVE") {
          return await LocalStorageMockDB.filter(entityName, query, sort, limit);
        }
        throw err;
      }
    },

    async get(id) {
      try {
        return await httpRequest(`${endpoint}/${id}`, { method: "GET" });
      } catch (err) {
        if (FORCE_MOCK || err.message === "NETWORK_UNREACHABLE" || err.message === "FORCE_MOCK_ACTIVE") {
          return await LocalStorageMockDB.get(entityName, id);
        }
        throw err;
      }
    },

    async create(data) {
      try {
        return await httpRequest(endpoint, {
          method: "POST",
          body: JSON.stringify(data),
        });
      } catch (err) {
        if (FORCE_MOCK || err.message === "NETWORK_UNREACHABLE" || err.message === "FORCE_MOCK_ACTIVE") {
          return await LocalStorageMockDB.create(entityName, data);
        }
        throw err;
      }
    },

    async update(id, data) {
      try {
        return await httpRequest(`${endpoint}/${id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        });
      } catch (err) {
        if (FORCE_MOCK || err.message === "NETWORK_UNREACHABLE" || err.message === "FORCE_MOCK_ACTIVE") {
          return await LocalStorageMockDB.update(entityName, id, data);
        }
        throw err;
      }
    },

    async delete(id) {
      try {
        return await httpRequest(`${endpoint}/${id}`, { method: "DELETE" });
      } catch (err) {
        if (FORCE_MOCK || err.message === "NETWORK_UNREACHABLE" || err.message === "FORCE_MOCK_ACTIVE") {
          return await LocalStorageMockDB.delete(entityName, id);
        }
        throw err;
      }
    },

    async bulkUpdate(items = []) {
      try {
        return await httpRequest(`${endpoint}/bulk-update`, {
          method: "POST",
          body: JSON.stringify({ items }),
        });
      } catch (err) {
        if (FORCE_MOCK || err.message === "NETWORK_UNREACHABLE" || err.message === "FORCE_MOCK_ACTIVE") {
          return await LocalStorageMockDB.bulkUpdate(entityName, items);
        }
        throw err;
      }
    },
  };
}

// Proxy handler to allow dynamic `entities.<EntityName>` access without declaring all upfront
const entitiesProxy = new Proxy(
  {},
  {
    get(target, prop) {
      if (typeof prop === "string") {
        if (!target[prop]) {
          target[prop] = createEntityClient(prop);
        }
        return target[prop];
      }
      return undefined;
    },
  }
);

// ==========================================
// Authentication Adapter
// ==========================================
const auth = {
  getToken: getStoredToken,
  setToken: setStoredToken,

  async me() {
    const token = getStoredToken();
    if (!token) throw { status: 401, message: "No token" };

    try {
      return await httpRequest("auth/me", { method: "GET" });
    } catch (err) {
      if (FORCE_MOCK || err.message === "NETWORK_UNREACHABLE" || err.message === "FORCE_MOCK_ACTIVE") {
        // Return stored mock user
        const storedUser = localStorage.getItem("shift_mock_user");
        if (storedUser) return JSON.parse(storedUser);
        // Fallback default admin/demo user
        return {
          id: "usr_default_demo",
          email: "demo@shift.org",
          role: "admin",
          created_date: new Date().toISOString(),
        };
      }
      throw err;
    }
  },

  async loginViaEmailPassword(email, password) {
    try {
      const res = await httpRequest("auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (res?.access_token) {
        setStoredToken(res.access_token);
      }
      return res;
    } catch (err) {
      if (FORCE_MOCK || err.message === "NETWORK_UNREACHABLE" || err.message === "FORCE_MOCK_ACTIVE") {
        const mockUser = {
          id: "usr_" + Math.random().toString(36).substring(2, 9),
          email,
          role: email.includes("admin") ? "admin" : "student",
          created_date: new Date().toISOString(),
        };
        const token = "mock_jwt_token_" + Date.now();
        setStoredToken(token);
        localStorage.setItem("shift_mock_user", JSON.stringify(mockUser));
        return { access_token: token, user: mockUser };
      }
      throw err;
    }
  },

  async register({ email, password }) {
    try {
      return await httpRequest("auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
    } catch (err) {
      if (FORCE_MOCK || err.message === "NETWORK_UNREACHABLE" || err.message === "FORCE_MOCK_ACTIVE") {
        localStorage.setItem("shift_pending_register_email", email);
        return { message: "OTP code sent to email", email };
      }
      throw err;
    }
  },

  async verifyOtp({ email, otpCode }) {
    try {
      const res = await httpRequest("auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email, otpCode }),
      });
      if (res?.access_token) {
        setStoredToken(res.access_token);
      }
      return res;
    } catch (err) {
      if (FORCE_MOCK || err.message === "NETWORK_UNREACHABLE" || err.message === "FORCE_MOCK_ACTIVE") {
        const mockUser = {
          id: "usr_" + Math.random().toString(36).substring(2, 9),
          email: email || localStorage.getItem("shift_pending_register_email") || "user@shift.org",
          role: "user",
          created_date: new Date().toISOString(),
        };
        const token = "mock_jwt_token_" + Date.now();
        setStoredToken(token);
        localStorage.setItem("shift_mock_user", JSON.stringify(mockUser));
        return { access_token: token, user: mockUser };
      }
      throw err;
    }
  },

  async resendOtp(email) {
    try {
      return await httpRequest("auth/resend-otp", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    } catch (err) {
      if (FORCE_MOCK || err.message === "NETWORK_UNREACHABLE" || err.message === "FORCE_MOCK_ACTIVE") {
        return { success: true, message: "Code resent" };
      }
      throw err;
    }
  },

  async resetPassword({ resetToken, newPassword }) {
    try {
      return await httpRequest("auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ resetToken, newPassword }),
      });
    } catch (err) {
      if (FORCE_MOCK || err.message === "NETWORK_UNREACHABLE" || err.message === "FORCE_MOCK_ACTIVE") {
        return { success: true, message: "Password updated successfully" };
      }
      throw err;
    }
  },

  loginWithProvider(provider, returnTo = "/") {
    window.location.href = `${API_BASE_URL}/auth/${provider}?returnTo=${encodeURIComponent(returnTo)}`;
  },

  redirectToLogin(returnTo) {
    const target = returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : "/login";
    window.location.href = target;
  },

  logout(redirectUrl) {
    setStoredToken(null);
    localStorage.removeItem("shift_mock_user");
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  },
};

// ==========================================
// Integrations / File Upload Adapter
// ==========================================
const integrations = {
  Core: {
    async UploadFile({ file }) {
      if (FORCE_MOCK) {
        return handleLocalFileUpload(file);
      }

      try {
        const formData = new FormData();
        formData.append("file", file);

        const token = getStoredToken();
        const response = await fetch(`${API_BASE_URL}/upload`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });

        if (!response.ok) throw new Error("Upload failed");
        const data = await response.json();
        return { file_url: data.file_url || data.url };
      } catch (err) {
        console.warn("[Shift File Upload] Upload to backend failed, converting to local preview URL", err);
        return handleLocalFileUpload(file);
      }
    },
  },
};

function handleLocalFileUpload(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({ file_url: reader.result });
    };
    reader.onerror = () => {
      resolve({ file_url: URL.createObjectURL(file) });
    };
    reader.readAsDataURL(file);
  });
}

// ==========================================
// Cloud & AI Functions Adapter
// ==========================================
const functions = {
  async invoke(functionName, payload = {}) {
    try {
      return await httpRequest(`functions/${functionName}`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    } catch (err) {
      // Smart career assistant fallback response for Shift Bot
      if (functionName === "shiftBot") {
        const query = (payload.message || "").toLowerCase();
        const role = payload.userRole || "student";

        if (role === "student") {
          if (query.includes("major") || query.includes("find jobs")) {
            return {
              reply: "Based on your academic profile, check out the 'Find Jobs' tab where listings are ranked by relevance to your major, skills, and year of study! Make sure your profile has your latest university and skills filled out.",
            };
          }
          if (query.includes("interview") || query.includes("prepare")) {
            return {
              reply: "Here are top tips for your Shift interviews:\n1. Research the company's projects & work culture.\n2. Review your key coursework and portfolio projects.\n3. Prepare 2-3 questions for the interviewer.\n4. Test your camera and microphone in the Shift Interview Room beforehand!",
            };
          }
          if (query.includes("cv") || query.includes("resume") || query.includes("profile")) {
            return {
              reply: "To make your Shift profile stand out to employers:\n• Highlight hands-on lab and class projects.\n• List specific technical tools and frameworks.\n• Upload clear enrollment proof to get your verified badge faster!",
            };
          }
          return {
            reply: "Hello! I am your Shift Career Assistant. I can help you find jobs matched to your major, polish your student profile, or practice for upcoming interviews. What would you like to explore today?",
          };
        } else {
          if (query.includes("job") || query.includes("posting") || query.includes("description")) {
            return {
              reply: "When creating a job on Shift, be sure to specify:\n1. Clear day-to-day responsibilities.\n2. Required major & preferred year of study.\n3. Transparent employment type (Internship vs Part-time vs Full-time) to attract verified university talent.",
            };
          }
          if (query.includes("interview") || query.includes("questions")) {
            return {
              reply: "Great questions for student interviews:\n• 'Tell us about a course project where you solved an unexpected problem.'\n• 'How do you balance internship commitments with your academic schedule?'\n• 'What technologies or skills are you most eager to learn next?'",
            };
          }
          return {
            reply: "Hello! I am your Shift Hiring Assistant. I can help you craft job postings, write interview criteria, and find top verified student talent across universities.",
          };
        }
      }
      return { success: true, data: {} };
    }
  },
};

// ==========================================
// Export Unified Client
// ==========================================
export const apiClient = {
  auth,
  entities: entitiesProxy,
  integrations,
  functions,
};

export default apiClient;

