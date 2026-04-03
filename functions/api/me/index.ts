import { getErrorMessage, json, requireUser, type PagesFunctionContext } from '../../utils';

export async function onRequestGet(context: PagesFunctionContext): Promise<Response> {
  const { env, request } = context;
  try {
    const user = await requireUser(request, env);
    return json({ user });
  } catch (err: unknown) {
    return json({ message: getErrorMessage(err, '未登录') }, 401);
  }
}
