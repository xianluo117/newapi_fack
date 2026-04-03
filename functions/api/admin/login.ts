import { json, setCookie, sha256, requireEnv } from '../../../utils';

export async function onRequestPost(context) {
  const { env, request } = context;
  try {
    const body = await request.json();
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
    setCookie(headers, 'admin', env.ADMIN_SESSION_TOKEN, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      path: '/',
      maxAge: 60 * 60 * 8,
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...Object.fromEntries(headers), 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return json({ message: err.message || '登录失败' }, 400);
  }
}
