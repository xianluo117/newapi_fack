import { json, isAdmin, getFeedback } from '../../../../utils';

export async function onRequestGet(context) {
  const { env, request, params } = context;
  if (!isAdmin(request, env)) return json({ message: '未授权' }, 401);
  const feedback = await getFeedback(env, params.id);
  if (!feedback) return json({ message: '未找到' }, 404);

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

  return json({ messages, status: feedback.status, page, pageSize, total, totalPages });
}
