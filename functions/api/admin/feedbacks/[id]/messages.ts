import {
  getErrorMessage,
  isAdmin,
  json,
  randomId,
  updateFeedback,
  type PagesFunctionContext,
} from '../../../../utils';

export async function onRequestPost(context: PagesFunctionContext): Promise<Response> {
  const { env, request, params } = context;
  if (!isAdmin(request, env)) return json({ message: '未授权' }, 401);
  try {
    const body = (await request.json()) as { content?: string; status?: 'open' | 'closed' };
    const feedback = await updateFeedback(env, params.id, (item) => {
      const now = Date.now();
      item.messages.push({
        id: randomId(),
        author: '管理员',
        authorId: 'admin',
        content: body.content || '',
        createdAt: now,
      });
      if (body.status) item.status = body.status;
      item.updatedAt = now;
      return item;
    });
    if (!feedback) return json({ message: '未找到' }, 404);
    return json({ ok: true });
  } catch (err: unknown) {
    return json({ message: getErrorMessage(err, '发送失败') }, 400);
  }
}
