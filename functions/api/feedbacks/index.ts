import {
  getErrorMessage,
  json,
  listFeedbacks,
  randomId,
  requireUser,
  saveFeedback,
  type FeedbackItem,
  type PagesFunctionContext,
} from '../../utils';

export async function onRequestGet(context: PagesFunctionContext): Promise<Response> {
  const { env, request } = context;
  try {
    const user = await requireUser(request, env);
    const all = await listFeedbacks(env);
    const items = all.filter((item) => item.ownerId === user.id);
    return json({ items });
  } catch (err: unknown) {
    return json({ message: getErrorMessage(err, '未登录') }, 401);
  }
}

export async function onRequestPost(context: PagesFunctionContext): Promise<Response> {
  const { env, request } = context;
  try {
    const user = await requireUser(request, env);
    const body = (await request.json()) as { title?: string; content?: string };
    const id = randomId();
    const now = Date.now();
    const feedback: FeedbackItem = {
      id,
      title: body.title || '',
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
          content: body.content || '',
          createdAt: now,
        },
      ],
      public: true,
    };
    await saveFeedback(env, feedback);
    return json({ id });
  } catch (err: unknown) {
    return json({ message: getErrorMessage(err, '提交失败') }, 400);
  }
}
