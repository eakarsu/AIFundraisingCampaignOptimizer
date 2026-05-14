const API = '/api';

// Global event bus for auth and rate-limit errors
export const apiEvents = new EventTarget();

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  };
  const res = await fetch(`${API}${path}`, config);
  const data = await res.json();
  if (res.status === 401) {
    apiEvents.dispatchEvent(new CustomEvent('unauthorized'));
    throw new Error(data.error || 'Unauthorized');
  }
  if (res.status === 429) {
    apiEvents.dispatchEvent(new CustomEvent('ratelimit', { detail: data.error || 'AI rate limit exceeded. Max 20 requests/hour.' }));
    throw new Error(data.error || 'Rate limit exceeded');
  }
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  // Auth
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  getMe: () => request('/auth/me'),

  // Generic CRUD
  getAll: (resource, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/${resource}${qs ? '?' + qs : ''}`);
  },
  getOne: (resource, id) => request(`/${resource}/${id}`),
  create: (resource, body) => request(`/${resource}`, { method: 'POST', body: JSON.stringify(body) }),
  update: (resource, id, body) => request(`/${resource}/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (resource, id) => request(`/${resource}/${id}`, { method: 'DELETE' }),

  // AI endpoints
  ai: (resource, action, body) => request(`/${resource}/ai/${action}`, { method: 'POST', body: JSON.stringify(body) }),
  aiCenter: (agent, body) => request(`/ai/${agent}`, { method: 'POST', body: JSON.stringify(body) }),

  // Campaign-donor linking
  getCampaignDonors: (campaignId) => request(`/campaigns/${campaignId}/donors`),
  linkDonorToCampaign: (campaignId, body) => request(`/campaigns/${campaignId}/donors`, { method: 'POST', body: JSON.stringify(body) }),

  // Stats
  getStats: () => request('/stats/overview'),
};
