# Travel Log

Travel Log 是一个面向旅行摄影的全栈 Web 应用，用于整理照片、旅行城市、地图足迹和文字记录。它同时提供公开浏览页面与后台管理界面，适合作为个人摄影档案、旅行日志或作品集的基础项目。

> 本仓库是经过安全清理的公开代码快照。数据库导出文件、真实照片、静态图片资源、环境文件、账号密码、运行日志和部署私密配置均未上传。

## 功能

- 首页展示旅行记录、精选照片和摄影信息
- 按城市浏览旅行相册与城市详情
- 地图发现页展示照片的地理分布
- 博客文章列表与文章详情
- 单张照片详情与全屏屏保展示
- 后台管理照片、城市、文章和个人资料
- 照片上传、可见性控制、EXIF 元数据与对象存储适配
- Better Auth 登录、会话保护和后台路由权限控制
- 支持本地文件存储与 S3 兼容对象存储的切换

## 技术栈

- Next.js 16、React 19、TypeScript
- Tailwind CSS 4
- tRPC、TanStack Query
- Drizzle ORM、PostgreSQL、`pg`
- Better Auth
- Leaflet / React Leaflet 地图组件
- S3 兼容对象存储适配
- ESLint、Dockerfile

## 目录结构

```text
src/
├─ app/                 # 页面路由、布局和 API Route
├─ components/          # 通用 UI 与编辑器组件
├─ db/                  # 数据库连接与 Drizzle schema
├─ modules/             # auth、photos、travel、blog、dashboard 等业务模块
├─ trpc/                # tRPC 客户端、服务端与路由
├─ env.ts               # 服务端环境变量校验
└─ site.config.ts       # 站点基础配置
public/world.geojson    # 地图数据
```

## 本地运行

公开快照不包含任何真实环境配置。请在本地自行准备数据库、认证密钥和存储配置，并通过环境变量注入，不要把真实凭据写入仓库。

```bash
npm install
npm run dev
```

生产构建与检查：

```bash
npm run build
npx tsc --noEmit
npx eslint
```

服务端至少需要配置数据库连接和认证相关变量；如果使用 S3 兼容存储，还需要配置对应的 endpoint、bucket、访问密钥和公开 URL。变量名称与校验规则以 [`src/env.ts`](src/env.ts) 及相关存储模块为准。

## 主要页面

公开页面：

- `/`：首页
- `/discover`：地图发现
- `/travel`：旅行城市列表
- `/travel/[city]`：城市照片集合
- `/blog`：博客列表
- `/blog/[slug]`：博客详情
- `/p/[id]`：照片详情
- `/screensaver`：屏保展示

后台页面：

- `/sign-in`：登录
- `/dashboard`：后台首页
- `/dashboard/photos`：照片管理
- `/dashboard/cities`：城市管理
- `/dashboard/posts`：文章管理
- `/dashboard/profile`：个人资料

## 安全说明

请勿提交以下内容：

- `.env`、访问令牌、认证密钥、数据库密码或对象存储密钥
- 数据库备份、SQL 导出文件和本地运行数据
- 原始照片、用户头像、上传目录和本地截图
- 日志、临时文件、构建产物和运行时缓存

如果凭据曾经被提交到任何远程仓库，应立即撤销并重新生成，而不是只删除工作区文件。

## License

详见 [`LICENSE`](LICENSE)。