const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:4000/api";
const TOKEN_KEY = "phakathi_auth_token";

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
}

async function request(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const error = new Error(payload?.message || payload || "API request failed");
    error.status = response.status;
    error.data = payload;
    throw error;
  }

  return payload;
}

function createEntityClient(entityName) {
  return {
    list: (sort, limit) => request(`/entities/${entityName}?${new URLSearchParams({ ...(sort ? { sort } : {}), ...(limit ? { limit } : {}) })}`),
    filter: (query = {}, sort, limit) => request(`/entities/${entityName}/filter`, {
      method: "POST",
      body: JSON.stringify({ query, sort, limit }),
    }),
    get: (id) => request(`/entities/${entityName}/${encodeURIComponent(id)}`),
    create: (data) => request(`/entities/${entityName}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
    update: (id, data) => request(`/entities/${entityName}/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
    delete: (id) => request(`/entities/${entityName}/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
    bulkCreate: (items) => request(`/entities/${entityName}/bulk`, {
      method: "POST",
      body: JSON.stringify({ items }),
    }),
    bulkUpdate: (items) => request(`/entities/${entityName}/bulk`, {
      method: "PATCH",
      body: JSON.stringify({ items }),
    }),
    updateMany: (query, update) => request(`/entities/${entityName}/many`, {
      method: "PATCH",
      body: JSON.stringify({ query, update }),
    }),
    deleteMany: (query) => request(`/entities/${entityName}/many`, {
      method: "DELETE",
      body: JSON.stringify({ query }),
    }),
    schema: () => request(`/entities/${entityName}/schema`),
    subscribe: () => () => {},
  };
}

async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const api = {
  auth: {
    me: () => request("/auth/me"),
    isAuthenticated: async () => Boolean(getToken()),
    updateMe: (data) => request("/auth/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
    loginOrRegister: async ({ email, full_name, password } = {}) => {
      const result = await request("/auth/login-or-register", {
        method: "POST",
        body: JSON.stringify({ email, full_name, password }),
      });
      setToken(result.token);
      return result.user;
    },
    logout: () => {
      localStorage.removeItem(TOKEN_KEY);
      window.location.reload();
    },
    redirectToLogin: async () => {
      const email = window.prompt("Enter your work email to sign in or register:");
      if (!email) return;
      const full_name = window.prompt("Your full name:") || email.split("@")[0];
      await api.auth.loginOrRegister({ email, full_name });
      window.location.reload();
    },
  },
  entities: new Proxy({}, {
    get(target, prop) {
      if (typeof prop !== "string") return target[prop];
      if (!target[prop]) target[prop] = createEntityClient(prop);
      return target[prop];
    },
  }),
  users: {
    inviteUser: (email, role = "user") => request("/auth/invite", {
      method: "POST",
      body: JSON.stringify({ email, role }),
    }),
  },
  integrations: {
    Core: {
      InvokeLLM: (data) => request("/integrations/ai/invoke", {
        method: "POST",
        body: JSON.stringify(data),
      }),
      SendEmail: (data) => request("/integrations/send-email", {
        method: "POST",
        body: JSON.stringify(data),
      }),
      SendSMS: (data) => request("/integrations/send-sms", {
        method: "POST",
        body: JSON.stringify(data),
      }),
      GenerateImage: (data) => request("/integrations/ai/generate-image", {
        method: "POST",
        body: JSON.stringify(data),
      }),
      ExtractDataFromUploadedFile: (data) => request("/integrations/ai/extract-data", {
        method: "POST",
        body: JSON.stringify(data),
      }),
      CreateFileSignedUrl: ({ file_url }) => Promise.resolve({ signed_url: file_url }),
      UploadPrivateFile: async ({ file }) => api.integrations.Core.UploadFile({ file, private: true }),
      UploadFile: async ({ file, ...rest }) => {
        const dataUrl = await fileToDataUrl(file);
        return request("/integrations/upload-file", {
          method: "POST",
          body: JSON.stringify({
            name: file.name,
            type: file.type,
            size: file.size,
            dataUrl,
            ...rest,
          }),
        });
      },
      GenerateSpeech: (data) => request("/integrations/ai/generate-speech", {
        method: "POST",
        body: JSON.stringify(data),
      }),
      GenerateVideo: (data) => request("/integrations/ai/generate-video", {
        method: "POST",
        body: JSON.stringify(data),
      }),
      TranscribeAudio: (data) => request("/integrations/ai/transcribe-audio", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    },
  },
  functions: {
    invoke: (functionName, payload) => request(`/functions/${functionName}`, {
      method: "POST",
      body: JSON.stringify(payload || {}),
    }),
  },
  analytics: {
    track: (event) => request("/analytics/track", {
      method: "POST",
      body: JSON.stringify(event),
    }).catch(() => null),
  },
};
