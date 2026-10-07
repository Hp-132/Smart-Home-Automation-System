// Thin client for the Java REST API (smarthome.web.SmartHomeServer).

export class ApiError extends Error {
  constructor(message, { status = 0, network = false } = {}) {
    super(message);
    this.status = status;
    this.network = network;
  }
}

async function request(path, { method = 'GET', body, timeout = 8000 } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  let res;
  try {
    res = await fetch(path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
      cache: 'no-store',
    });
  } catch (e) {
    const timedOut = e.name === 'AbortError';
    throw new ApiError(timedOut ? 'The server did not respond in time.' : 'Cannot reach the smart home server.', { network: true });
  } finally {
    clearTimeout(timer);
  }
  let data = null;
  try { data = await res.json(); } catch { /* non-JSON */ }
  if (!res.ok || (data && data.ok === false)) {
    const msg = (data && data.error) || `Request failed (${res.status}).`;
    throw new ApiError(msg, { status: res.status });
  }
  return data;
}

export const api = {
  home: () => request('/api/home'),
  activity: () => request('/api/activity'),
  command: (id, action, value) =>
    request(`/api/devices/${encodeURIComponent(id)}/commands`, { method: 'POST', body: value === undefined ? { action } : { action, value } }),
  routine: (id) => request(`/api/routines/${encodeURIComponent(id)}/run`, { method: 'POST', timeout: 15000 }),
};
