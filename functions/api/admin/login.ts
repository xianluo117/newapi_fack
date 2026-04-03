import {
  getErrorMessage,
  json,
  requireEnv,
  setCookie,
  sha256,
  type PagesFunctionContext,
} from '../../utils';

export async function onRequestPost(context: PagesFunctionContext): Promise<Response> {
  const { env, request } = context;
  try {
    const body = (await request.json()) as { user?: string; password?: string };
    const user = body.user || '';
    const password = body.password || '';
    if (!user || !password) return json({ message: '缺少账号' }, 400);

    const expectedUser = requireEnv(env, 'ADMIN_USER');
    const expectedHash = requireEnv(env, 'ADMIN_PASS_HASH');
    const hash = await sha256(password);

    if (user !== expectedUser || hash !== expectedHash) {
      return json({ message: '账号或密码错误' }, 401);
    }

    const headers = new Headers();
    setCookie(headers, 'admin', requireEnv(env, 'ADMIN_SESSION_TOKEN'), {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      path: '/',
      maxAge: 60 * 60 * 8,
    });
    headers.set('Content-Type', 'application/json');

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers,
    });
  } catch (err: unknown) {
    return json({ message: getErrorMessage(err, '登录失败') }, 400);
  }
}
