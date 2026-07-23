# lanlan world摄影网站

这是一个基于 Next.js 的个人摄影网站，用于展示旅行照片、城市足迹、摄影作品和博客文章，同时提供后台管理能力。项目当前只保留一种部署方式：Docker Compose 内置 PostgreSQL，外接 S3 兼容对象存储（当前服务使用腾讯云 COS）。

## 项目描述

`photo_travel_world` 是一个面向个人旅行摄影作品集的全栈网站。公开页面侧重作品浏览、旅行城市归档、地图探索和文章阅读；管理员页面提供照片、城市、文章、个人资料和登录会话管理，适合长期维护个人摄影内容库。

项目已经整理为单一部署形态：应用和 PostgreSQL 通过 Docker Compose 运行，照片原图和公开资源存放在 S3 兼容对象存储中。这样可以把数据库状态、应用运行和大文件存储拆开，方便在低内存服务器上稳定部署和后续迁移。

## 项目展示

![首页与近期旅行](public/showcase/home-latest-travel.png)

![旅行城市作品](public/showcase/travel-grid.png)

![全屏作品墙](public/showcase/screensaver-gallery.png)

![地图发现](public/showcase/discover-map.png)

## 功能概览

- 首页展示个人信息、精选内容、近期旅行和摄影设备。
- 发现页通过地图展示公开照片的位置分布。
- 旅行页按城市组织照片合集。
- 博客页展示文章列表和文章详情。
- 单张照片页展示作品详情和元数据。
- 屏保页以全屏网格方式轮播公开照片。
- 后台管理照片、城市、文章、个人资料和登录会话。
- 支持照片上传、EXIF 信息提取、S3 兼容对象存储、公开/私密可见性控制。
- 支持 Mapbox 地图、Better Auth 邮箱密码登录、PostgreSQL 数据库。

## 技术栈

- Next.js 16，React 19，App Router
- TypeScript
- Tailwind CSS 4
- tRPC 11
- TanStack Query 5
- Drizzle ORM
- PostgreSQL，本项目部署固定使用普通 `pg` 连接
- Better Auth
- S3 兼容对象存储，当前服务使用腾讯云 COS
- Mapbox GL JS
- Bun 作为默认包管理器和脚本运行时
- Docker / Docker Compose

## 目录结构

```text
.
├── data/                  # 初始内容导入 SQL
├── public/                # 运行时静态资源
├── scripts/               # 数据维护脚本
├── src/
│   ├── app/               # Next.js 路由、布局、API route
│   ├── components/        # 通用组件、UI 组件、编辑器组件
│   ├── db/                # Drizzle schema 和数据库连接
│   ├── hooks/             # 通用 React hooks
│   ├── lib/               # 通用工具
│   ├── modules/           # 按业务域组织的功能模块
│   ├── trpc/              # tRPC 初始化、路由和客户端
│   ├── env.ts             # 服务端环境变量校验
│   ├── proxy.ts           # 后台访问保护
│   └── site.config.ts     # 站点品牌和基础配置
├── Dockerfile
├── docker-compose.yml     # 唯一保留的部署入口：PostgreSQL + App + 外部对象存储
├── DEPLOYMENT.md          # 部署和运维说明
└── package.json
```

## 关键文件

- `src/site.config.ts`：站点名称、简介、头像、SEO 文案、Mapbox 样式、图片 loader、摄影设备信息。
- `src/env.ts`：服务端必要环境变量校验，缺少关键配置时会让应用快速失败。
- `src/db/schema.ts`：用户、会话、照片、城市集合、文章和分类的数据表定义。
- `src/proxy.ts`：保护 `/dashboard` 后台路径，未登录用户会跳转到 `/sign-in`。
- `next.config.ts`：Next.js standalone 输出、图片配置和对象存储公开域名配置。
- `Dockerfile`：包含依赖安装、运行时构建和可选预构建 runner 阶段。
- `docker-compose.yml`：启动 PostgreSQL、执行 schema 迁移、导入初始 SQL、构建并启动应用。
- `data/lanlan-photo-import.sql`：当前照片和城市初始化数据。
- `data/lanlan-blog-import.sql`：当前博客初始化数据。
- `scripts/README.md`：维护脚本说明。

## 环境变量

复制 `.env.example` 后填写真实配置：

```bash
cp .env.example .env
```

核心变量如下：

| 变量 | 说明 |
| --- | --- |
| `POSTGRES_USER` | Compose 内 PostgreSQL 用户 |
| `POSTGRES_PASSWORD` | Compose 内 PostgreSQL 密码 |
| `POSTGRES_DB` | Compose 内 PostgreSQL 数据库名 |
| `DATABASE_URL` | 应用连接 PostgreSQL 的连接字符串，Compose 内使用 `postgres` 主机名 |
| `DATABASE_PROVIDER` | 固定使用 `local` |
| `BETTER_AUTH_SECRET` | Better Auth 加密密钥，生产环境必须是长随机字符串 |
| `BETTER_AUTH_URL` | 应用最终访问地址，例如 `http://170.106.67.154:3000` 或正式域名 |
| `NEXT_PUBLIC_APP_URL` | 浏览器侧应用地址，通常与 `BETTER_AUTH_URL` 一致 |
| `S3_REGION` | 对象存储 region |
| `S3_ENDPOINT` | 服务端访问对象存储 API 的 endpoint |
| `S3_BUCKET_NAME` | bucket 名称 |
| `S3_PUBLIC_URL` | 服务端使用的对象公开访问前缀 |
| `S3_ACCESS_KEY_ID` | 对象存储 access key |
| `S3_SECRET_ACCESS_KEY` | 对象存储 secret key |
| `NEXT_PUBLIC_S3_PUBLIC_URL` | 浏览器展示图片使用的公开访问前缀 |
| `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` | Mapbox access token |
| `SEED_USER_EMAIL` | 初始化管理员邮箱 |
| `SEED_USER_PASSWORD` | 初始化管理员密码 |
| `SEED_USER_NAME` | 初始化管理员名称 |
| `ALLOW_FIRST_USER_SIGNUP` | 是否允许第一个用户通过注册接口创建，生产建议保持 `false` |

说明：

- 数据库中的 `photos.url` 保存对象 key，例如 `photos/lanlan/travel/beijing/a.jpg`。
- 页面展示图片时使用 `NEXT_PUBLIC_S3_PUBLIC_URL` 拼接完整 URL。
- 更换 CDN 或对象存储公开域名时，通常只需要改 `.env`，不需要批量改数据库。

## 常用命令

```bash
# 安装依赖
bun install

# 本地开发，仅在内存足够时使用
bun run dev

# 生产构建
bun run build

# 启动已构建应用
bun run start

# 推送数据库结构
bun run db:push

# 打开 Drizzle Studio
bun run db:studio

# 创建初始管理员
bun run seed:user

# 代码检查
bun run lint

# 清理数据库中的历史完整图片 URL，只保留对象 key
bun run clean:photo-urls

# 回滚图片 URL 清理
bun run rollback:photo-urls
```

低内存服务器上不要直接跑 `bun run dev` 或重复并行构建。生产更新优先使用 Compose 重新构建并替换应用容器。

## Docker 部署

当前项目只保留默认 Compose 部署入口：

```bash
docker compose up -d --build
```

查看状态和日志：

```bash
docker compose ps
docker compose logs -f app
```

重启应用：

```bash
docker compose restart app
```

停止服务：

```bash
docker compose down
```

如果需要清空 Compose 内 PostgreSQL 数据卷，先确认已备份，再执行：

```bash
docker compose down -v
```

## 页面入口

公开页面：

- `/`：首页
- `/about`：关于
- `/discover`：地图发现
- `/travel`：旅行城市列表
- `/travel/[city]`：城市照片合集
- `/blog`：博客列表
- `/blog/[slug]`：博客详情
- `/p/[id]`：单张照片详情
- `/screensaver`：屏保展示

后台页面：

- `/sign-in`：登录
- `/dashboard`：后台首页
- `/dashboard/photos`：照片管理
- `/dashboard/cities`：城市管理
- `/dashboard/posts`：文章管理
- `/dashboard/profile`：个人资料

## 初始数据和静态资源

项目保留以下运行相关数据和资源：

- `data/lanlan-photo-import.sql`：照片、城市集合等初始化数据。
- `data/lanlan-blog-import.sql`：博客文章初始化数据。
- `public/avatar.jpg`：头像。
- `public/bg.jpg`：登录页和 About 页面背景。
- `public/world.geojson`：后台地图统计使用的世界地图数据。
- `public/*_logo.svg`：设备品牌 logo。
- `public/placeholder.svg`：图片 fallback。

不要在未确认引用前删除 `public` 目录资源，尤其是 `world.geojson`、`avatar.jpg`、`bg.jpg`、`placeholder.svg` 和品牌 logo。

## 维护注意事项

- 不要提交 `.env`、`.env.*`、部署凭据、对象存储上传清单、原始素材包和本地截图。
- 修改数据库 schema 后，先备份生产数据库，再执行 `docker compose up -d --build`，或在本机确认后执行 `bun run db:push`。
- `DATABASE_PROVIDER` 在当前部署方式中固定为 `local`。
- 初始化管理员推荐通过 `bun run seed:user` 创建，生产环境不建议开放注册。
- 更换对象存储域名时优先修改 `NEXT_PUBLIC_S3_PUBLIC_URL` 和 `S3_PUBLIC_URL`。
- 清理照片 URL 前先读 `scripts/README.md`，脚本会在 `scripts/photo-urls-backup.json` 生成回滚备份，该文件不要提交。
