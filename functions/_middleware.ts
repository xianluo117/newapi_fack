import { getCookie, type PagesFunctionContext } from './utils';

export async function onRequest(context: PagesFunctionContext): Promise<Response> {
  const { request, next } = context;

  if (request.method === 'OPTIONS') {
    const origin = request.headers.get('Origin') || '*';
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      },
    });
  }

  const response = await next();
  const origin = request.headers.get('Origin');

  if (origin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  }

  const session = getCookie(request, 'session');
  if (session) {
    response.headers.set('Set-Cookie', `session=${session}; Path=/; HttpOnly; SameSite=Lax; Secure`);
  }

  return response;
}
