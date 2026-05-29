const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function verifyImage(formData: FormData) {
  const res = await fetch(`${BASE}/api/verify-image`, { method: 'POST', body: formData });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function getVerification(id: string) {
  return request<any>(`/api/verifications/${id}`);
}

export async function getRecentVerifications(limit = 10) {
  return request<any>(`/api/verifications/recent?limit=${limit}`);
}

export async function getAdminStats() {
  return request<any>('/api/admin/stats');
}

export async function getAnalytics() {
  return request<any>('/api/admin/analytics');
}

export async function getAlerts(limit = 24) {
  return request<any>(`/api/alerts?limit=${limit}`);
}

export async function getTrainingMetrics() {
  return request<any>('/api/admin/training-metrics');
}

export async function getSettings() {
  return request<any>('/api/settings');
}

export async function updateSettings(payload: Record<string, unknown>) {
  return request<any>('/api/settings', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function submitReport(payload: Record<string, unknown>) {
  return request<any>('/api/reports', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getHealth() {
  return request<any>('/api/health');
}
