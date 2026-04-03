export interface KvNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  list(options?: { prefix?: string }): Promise<{ keys: Array<{ name: string }> }>;
}

export interface GuildRoleConfig {
  guildId: string;
  roleId: string;
  label?: string;
}

export interface SessionData {
  id: string;
  username: string;
  matched: GuildRoleConfig[];
}

export interface FeedbackMessage {
  id: string;
  author: string;
  authorId: string;
  content: string;
  createdAt: number;
}

export interface FeedbackItem {
  id: string;
  title: string;
  status: 'open' | 'closed';
  ownerId: string;
  ownerUsername: string;
  createdAt: number;
  updatedAt: number;
  messages: FeedbackMessage[];
  public: boolean;
}

export interface Env {
  DISCORD_CLIENT_ID?: string;
  DISCORD_CLIENT_SECRET?: string;
  DISCORD_REDIRECT_URI?: string;
  DISCORD_BOT_TOKEN?: string;
  ADMIN_USER?: string;
  ADMIN_PASS_HASH?: string;
  ADMIN_SESSION_TOKEN?: string;
  SESSIONS: KvNamespace;
  FEEDBACKS: KvNamespace;
  CONFIG: KvNamespace;
}

export interface PagesFunctionContext {
  request: Request;
  env: Env;
  params: Record<string, string>;
  next: () => Promise<Response>;
}

export interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'Lax' | 'Strict' | 'None';
  path?: string;
  maxAge?: number;
}

const encoder = new TextEncoder();

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function getCookie(request: Request, name: string): string | null {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(new RegExp(`${name}=([^;]+)`));
  return match ? match[1] : null;
}

export function setCookie(headers: Headers, name: string, value: string, options: CookieOptions = {}): void {
  const parts = [`${name}=${value}`];
  if (options.httpOnly) parts.push('HttpOnly');
  if (options.secure) parts.push('Secure');
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  if (options.path) parts.push(`Path=${options.path}`);
  if (typeof options.maxAge === 'number') parts.push(`Max-Age=${options.maxAge}`);
  headers.append('Set-Cookie', parts.join('; '));
}

export function requireEnv(env: Env, key: keyof Env): string {
  const value = env[key];
  if (typeof value !== 'string' || !value) throw new Error(`${String(key)} 未配置`);
  return value;
}

export async function sha256(input: string): Promise<string> {
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function randomId(): string {
  return crypto.randomUUID();
}

export function isAdmin(request: Request, env: Env): boolean {
  const adminToken = getCookie(request, 'admin');
  if (!adminToken) return false;
  return adminToken === env.ADMIN_SESSION_TOKEN;
}

export async function getSession(sessionId: string | null, env: Env): Promise<SessionData | null> {
  if (!sessionId) return null;
  const data = await env.SESSIONS.get(sessionId);
  return data ? (JSON.parse(data) as SessionData) : null;
}

export async function setSession(sessionId: string, data: SessionData, env: Env): Promise<void> {
  await env.SESSIONS.put(sessionId, JSON.stringify(data), { expirationTtl: 60 * 60 * 24 * 7 });
}

export async function requireUser(request: Request, env: Env): Promise<SessionData> {
  const sessionId = getCookie(request, 'session');
  const session = await getSession(sessionId, env);
  if (!session) throw new Error('未登录');
  return session;
}

export async function getConfig(env: Env): Promise<GuildRoleConfig[]> {
  const data = await env.CONFIG.get('guildConfig');
  return data ? (JSON.parse(data) as GuildRoleConfig[]) : [];
}

export async function setConfig(env: Env, config: GuildRoleConfig[]): Promise<void> {
  await env.CONFIG.put('guildConfig', JSON.stringify(config));
}

export async function saveFeedback(env: Env, feedback: FeedbackItem): Promise<void> {
  await env.FEEDBACKS.put(`feedback:${feedback.id}`, JSON.stringify(feedback));
}

export async function listFeedbacks(env: Env): Promise<FeedbackItem[]> {
  const list = await env.FEEDBACKS.list({ prefix: 'feedback:' });
  const items: FeedbackItem[] = [];
  for (const key of list.keys) {
    const data = await env.FEEDBACKS.get(key.name);
    if (data) items.push(JSON.parse(data) as FeedbackItem);
  }
  return items.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getFeedback(env: Env, id: string): Promise<FeedbackItem | null> {
  const data = await env.FEEDBACKS.get(`feedback:${id}`);
  return data ? (JSON.parse(data) as FeedbackItem) : null;
}

export async function updateFeedback(
  env: Env,
  id: string,
  updater: (feedback: FeedbackItem) => FeedbackItem
): Promise<FeedbackItem | null> {
  const feedback = await getFeedback(env, id);
  if (!feedback) return null;
  const next = updater(feedback);
  await saveFeedback(env, next);
  return next;
}
