# NewAPI 反馈页面 (Cloudflare)

## 功能

- Discord OAuth2 登录（identify / guilds.channels.read）并校验指定服务器/身份组
- 用户页强制 Discord 登录，未登录会自动跳转授权
- 用户反馈提交、历史对话、只读公共反馈列表
- 管理员后台从 `/admin` 进入：账号密码登录、配置服务器/身份组、查看反馈与 Discord 用户名、标签状态、对话回复
- 管理员搜索/筛选、用户/管理员对话分页

## 页面说明

- `/`：用户前台页面，强制 Discord 登录
- `/admin`：管理员后台入口，使用环境变量中的管理员账号密码登录

## Cloudflare Pages 部署设置

1. 在 Cloudflare Pages 创建新项目并连接 Git 仓库。
2. Framework preset 选择 **None**。
3. Build command 留空。
4. Build output directory 填写 `public`。
5. Functions 目录使用项目根目录下的 `functions/`。
6. 在项目设置中配置环境变量与 KV 绑定。
7. Discord OAuth 回调地址填写：`https://你的域名/api/auth/callback`

## Cloudflare 环境变量

- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `DISCORD_REDIRECT_URI`
- `DISCORD_BOT_TOKEN`
- `ADMIN_USER`
- `ADMIN_PASS_HASH`（SHA256 后的密码）
- `ADMIN_SESSION_TOKEN`（管理员后台 cookie token）

## KV 绑定

在 Cloudflare Pages 项目的 **Settings -> Functions -> KV namespace bindings** 中添加：

- `SESSIONS`
- `FEEDBACKS`
- `CONFIG`

如果使用 `wrangler.toml`，可参考：

```toml
name = "newapi-feedback"
compatibility_date = "2024-10-01"

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

## 安装依赖

```bash
npm install
```

## 本地运行

```bash
npm run dev
```

## TypeScript 检查

```bash
npm run type-check
```

## 管理员密码哈希生成

```bash
node -e "require('crypto').createHash('sha256').update('yourPassword').digest('hex')"
```
