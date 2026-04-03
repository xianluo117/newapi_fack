import { json, requireUser, updateFeedback, randomId } from '../../../utils';

export async function onRequestPost(context) {
  const { env, request, params } = context;
  try {
    const user = await requireUser(request, env);
    const body = await request.json();
    const feedback = await updateFeedback(env, params.id, (item) => {
      if (item.ownerId !== user.id) throw new Error('无权限');
      const now = Date.now();
      item.messages.push({
        id: randomId(),
        author: user.username,
        authorId: user.id,
        content: body.content,
        createdAt: now,
      });
      item.updatedAt = now;
      return item;
    });
    if (!feedback) return json({ message: '未找到' }, 404);
    return json({ ok: true });
  } catch (err) {
    return json({ message: err.message || '发送失败' }, 400);
  }
}
