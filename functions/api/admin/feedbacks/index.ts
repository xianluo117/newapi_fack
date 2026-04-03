import { json, isAdmin, listFeedbacks } from '../../../utils';

export async function onRequestGet(context) {
  const { env, request } = context;
  if (!isAdmin(request, env)) return json({ message: '未授权' }, 401);
  const url = new URL(request.url);
  const search = (url.searchParams.get('search') || '').toLowerCase();
  const status = url.searchParams.get('status') || 'all';
  const items = await listFeedbacks(env);
  const filtered = items.filter((item) => {
    if (status !== 'all' && item.status !== status) return false;
    if (!search) return true;
    return (
      item.title.toLowerCase().includes(search) ||
      item.ownerUsername.toLowerCase().includes(search) ||
      item.id.toLowerCase().includes(search)
    );
  });

  return json({
    items: filtered.map(item => ({
      id: item.id,
      title: item.title,
      status: item.status,
      username: item.ownerUsername,
    })),
  });
}
