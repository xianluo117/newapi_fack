const encoder = new TextEncoder();

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function getCookie(request, name) {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(new RegExp(`${name}=([^;]+)`));
  return match ? match[1] : null;
}

export function setCookie(headers, name, value, options = {}) {
  const parts = [`${name}=${value}`];
  if (options.httpOnly) parts.push('HttpOnly');
  if (options.secure) parts.push('Secure');
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  if (options.path) parts.push(`Path=${options.path}`);
  if (options.maxAge) parts.push(`Max-Age=${options.maxAge}`);
  headers.append('Set-Cookie', parts.join('; '));
}

export function requireEnv(env, key) {
  const value = env[key];
  if (!value) throw new Error(`${key} 未配置`);
  return value;
}

export async function sha256(input) {
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function randomId() {
  return crypto.randomUUID();
}

export function isAdmin(request, env) {
  const adminToken = getCookie(request, 'admin');
  if (!adminToken) return false;
  return adminToken === env.ADMIN_SESSION_TOKEN;
}

export async function getSession(sessionId, env) {
  if (!sessionId) return null;
  const data = await env.SESSIONS.get(sessionId);
  return data ? JSON.parse(data) : null;
}

export async function setSession(sessionId, data, env) {
  await env.SESSIONS.put(sessionId, JSON.stringify(data), { expirationTtl: 60 * 60 * 24 * 7 });
}

export async function requireUser(request, env) {
  const sessionId = getCookie(request, 'session');
  const session = await getSession(sessionId, env);
  if (!session) throw new Error('未登录');
  return session;
}

export async function getConfig(env) {
  const data = await env.CONFIG.get('guildConfig');
  return data ? JSON.parse(data) : [];
}

export async function setConfig(env, config) {
  await env.CONFIG.put('guildConfig', JSON.stringify(config));
}

export async function saveFeedback(env, feedback) {
  await env.FEEDBACKS.put(`feedback:${feedback.id}`, JSON.stringify(feedback));
}

export async function listFeedbacks(env) {
  const list = await env.FEEDBACKS.list({ prefix: 'feedback:' });
  const items = [];
  for (const key of list.keys) {
    const data = await env.FEEDBACKS.get(key.name);
    if (data) items.push(JSON.parse(data));
  }
  return items.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getFeedback(env, id) {
  const data = await env.FEEDBACKS.get(`feedback:${id}`);
  return data ? JSON.parse(data) : null;
}

export async function updateFeedback(env, id, updater) {
  const feedback = await getFeedback(env, id);
  if (!feedback) return null;
  const next = updater(feedback) || feedback;
  await saveFeedback(env, next);
  return next;
}
