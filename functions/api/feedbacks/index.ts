import { json, requireUser, randomId, saveFeedback, listFeedbacks } from '../../utils';

export async function onRequestGet(context) {
  const { env, request } = context;
  try {
    const user = await requireUser(request, env);
    const all = await listFeedbacks(env);
    const items = all.filter(item => item.ownerId === user.id);
    return json({ items });
  } catch (err) {
    return json({ message: err.message || '未登录' }, 401);
  }
}

export async function onRequestPost(context) {
  const { env, request } = context;
  try {
    const user = await requireUser(request, env);
    const body = await request.json();
    const id = randomId();
    const now = Date.now();
    const feedback = {
      id,
      title: body.title,
      status: 'open',
      ownerId: user.id,
      ownerUsername: user.username,
      createdAt: now,
      updatedAt: now,
      messages: [
        {
          id: randomId(),
          author: user.username,
          authorId: user.id,
          content: body.content,
          createdAt: now,
        },
      ],
      public: true,
    };
    await saveFeedback(env, feedback);
    return json({ id });
  } catch (err) {
    return json({ message: err.message || '提交失败' }, 400);
  }
}
