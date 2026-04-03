import { getCookie } from './utils';

export async function onRequest(context) {
  const { request, env, next } = context;
  const response = await next();
  const origin = request.headers.get('Origin');

  if (origin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: response.headers });
  }

  const session = getCookie(request, 'session');
  if (session) {
    response.headers.set('Set-Cookie', `session=${session}; Path=/; HttpOnly; SameSite=Lax; Secure`);
  }

  return response;
}
