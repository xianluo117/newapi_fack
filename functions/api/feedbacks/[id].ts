import { json, requireUser, getFeedback } from '../../utils';

export async function onRequestGet(context) {
  const { env, request, params } = context;
  try {
    const user = await requireUser(request, env);
    const feedback = await getFeedback(env, params.id);
    if (!feedback || feedback.ownerId !== user.id) {
      return json({ message: '无权限' }, 403);
    }

    const url = new URL(request.url);
    const pageSize = Math.max(1, Number(url.searchParams.get('pageSize') || 6));
    const total = feedback.messages.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const pageParam = url.searchParams.get('page');
    const page = Math.min(
      Math.max(1, Number(pageParam || totalPages)),
      totalPages
    );
    const start = (page - 1) * pageSize;
    const messages = feedback.messages.slice(start, start + pageSize);

    return json({ messages, page, pageSize, total, totalPages });
  } catch (err) {
    return json({ message: err.message || '未登录' }, 401);
  }
}
