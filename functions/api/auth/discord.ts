import { randomId, requireEnv, type PagesFunctionContext } from '../../utils';

export async function onRequest(context: PagesFunctionContext): Promise<Response> {
  const { env } = context;
  const clientId = requireEnv(env, 'DISCORD_CLIENT_ID');
  const redirectUri = requireEnv(env, 'DISCORD_REDIRECT_URI');
  const state = randomId();

  await env.SESSIONS.put(`state:${state}`, '1', { expirationTtl: 600 });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'identify guilds.channels.read',
    state,
  });

  return Response.redirect(`https://discord.com/api/oauth2/authorize?${params.toString()}`, 302);
}
