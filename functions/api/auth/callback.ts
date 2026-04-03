import {
  getConfig,
  json,
  randomId,
  setCookie,
  setSession,
  type Env,
  type GuildRoleConfig,
  type PagesFunctionContext,
} from '../../utils';

interface DiscordTokenResponse {
  access_token: string;
}

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
}

interface DiscordMember {
  roles: string[];
}

async function exchangeToken(code: string, env: Env): Promise<DiscordTokenResponse> {
  const body = new URLSearchParams({
    client_id: env.DISCORD_CLIENT_ID || '',
    client_secret: env.DISCORD_CLIENT_SECRET || '',
    grant_type: 'authorization_code',
    code,
    redirect_uri: env.DISCORD_REDIRECT_URI || '',
  });

  const res = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error('Discord 授权失败');
  return (await res.json()) as DiscordTokenResponse;
}

async function fetchUser(token: string): Promise<DiscordUser> {
  const res = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('获取用户信息失败');
  return (await res.json()) as DiscordUser;
}

async function fetchMember(guildId: string, userId: string, env: Env): Promise<DiscordMember | null> {
  const res = await fetch(`https://discord.com/api/guilds/${guildId}/members/${userId}`, {
    headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN || ''}` },
  });
  if (!res.ok) return null;
  return (await res.json()) as DiscordMember;
}

export async function onRequest(context: PagesFunctionContext): Promise<Response> {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code || !state) return json({ message: '缺少参数' }, 400);

  const valid = await env.SESSIONS.get(`state:${state}`);
  if (!valid) return json({ message: '状态无效' }, 400);

  const token = await exchangeToken(code, env);
  const user = await fetchUser(token.access_token);

  const config = await getConfig(env);
  let allowed = false;
  const matched: GuildRoleConfig[] = [];

  for (const item of config) {
    const member = await fetchMember(item.guildId, user.id, env);
    if (member?.roles?.includes(item.roleId)) {
      allowed = true;
      matched.push(item);
    }
  }

  if (!allowed) {
    return json({ message: '未满足身份组要求' }, 403);
  }

  const sessionId = randomId();
  await setSession(
    sessionId,
    {
      id: user.id,
      username: `${user.username}#${user.discriminator}`,
      matched,
    },
    env
  );

  const headers = new Headers();
  setCookie(headers, 'session', sessionId, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  headers.set('Location', '/');

  return new Response(null, {
    status: 302,
    headers,
  });
}
