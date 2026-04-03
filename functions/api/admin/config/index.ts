import { json, isAdmin, getConfig, setConfig } from '../../../utils';

export async function onRequestGet(context) {
  const { env, request } = context;
  if (!isAdmin(request, env)) return json({ message: '未授权' }, 401);
  const config = await getConfig(env);
  return json({ config });
}

export async function onRequestPut(context) {
  const { env, request } = context;
  if (!isAdmin(request, env)) return json({ message: '未授权' }, 401);
  const body = await request.json();
  await setConfig(env, body.config || []);
  return json({ ok: true });
}
