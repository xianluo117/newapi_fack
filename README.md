# NewAPI 反馈页面 (Cloudflare)

## 功能

- Discord OAuth2 登录（identify / guilds.channels.read）并校验指定服务器/身份组
- 用户反馈提交、历史对话、只读公共反馈列表
- 管理员后台：账号密码登录、配置服务器/身份组、查看反馈与 Discord 用户名、标签状态、对话回复

## Cloudflare Pages 部署设置

1. 在 Cloudflare Pages 创建新项目并连接 Git 仓库。
2. Framework preset 选择 **None**。
3. Build command 留空（或填写 `npm run build`，但本项目无需构建）。
4. Build output directory 填写 `public`。
5. Functions 目录默认使用 `functions/`（无需额外配置）。
6. 在项目设置中配置以下环境变量（Production/Preview 均需设置）。

> 回调地址示例：`https://your-domain.com/api/auth/callback`

## Cloudflare 环境变量

- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `DISCORD_REDIRECT_URI`（必须与 Discord 应用回调一致）
- `DISCORD_BOT_TOKEN`（用于查询 guild 成员身份组）
- `ADMIN_USER`
- `ADMIN_PASS_HASH`（SHA256 后的密码）
- `ADMIN_SESSION_TOKEN`（任意字符串，用于后台 session）

## KV 绑定

在 `wrangler.toml` 中配置（需要手动补充）：

```toml
[[kv_namespaces]]
binding = "SESSIONS"
id = "xxxx"

[[kv_namespaces]]
binding = "FEEDBACKS"
id = "xxxx"

[[kv_namespaces]]
binding = "CONFIG"
id = "xxxx"
```

## 本地运行

```bash
wrangler dev
```

## 管理员密码哈希生成

```bash
node -e "require('crypto').createHash('sha256').update('yourPassword').digest('hex')"
```
