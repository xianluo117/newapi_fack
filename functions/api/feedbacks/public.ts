import { json, listFeedbacks, type PagesFunctionContext } from '../../utils';

export async function onRequestGet(context: PagesFunctionContext): Promise<Response> {
  const { env } = context;
  const all = await listFeedbacks(env);
  const items = all
    .filter((item) => item.public)
    .map((item) => ({
      id: item.id,
      title: item.title,
      preview: item.messages[0]?.content?.slice(0, 80) || '',
      status: item.status,
    }));
  return json({ items });
}
