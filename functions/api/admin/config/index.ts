import { getConfig, isAdmin, json, setConfig, type PagesFunctionContext } from '../../../utils';

export async function onRequestGet(context: PagesFunctionContext): Promise<Response> {
  const { env, request } = context;
  if (!isAdmin(request, env)) return json({ message: '未授权' }, 401);
  const config = await getConfig(env);
  return json({ config });
}

export async function onRequestPut(context: PagesFunctionContext): Promise<Response> {
  const { env, request } = context;
  if (!isAdmin(request, env)) return json({ message: '未授权' }, 401);
  const body = (await request.json()) as { config?: Array<{ guildId: string; roleId: string; label?: string }> };
  await setConfig(env, body.config || []);
  return json({ ok: true });
}
