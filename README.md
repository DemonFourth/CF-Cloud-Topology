# Cloud-Topology (云拓扑)

> 基于 React Flow 与 Cloudflare Serverless 架构的多平台、多账号、多域名与应用关系可视化拓扑管理看板。

Cloud-Topology 是一个运行在 Cloudflare 免费生态上的轻量全栈应用，前端使用 Cloudflare Pages 托管，后端使用 Cloudflare Workers，数据存储使用 D1 SQLite。它通过拖拽节点和连线的方式，帮助个人开发者管理 Cloudflare 账号、域名、应用、部署平台之间的复杂关系。

[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare-workers&logoColor=white)](https://workers.cloudflare.com/)
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-F38020?logo=cloudflare&logoColor=white)](https://pages.cloudflare.com/)
[![React Flow](https://img.shields.io/badge/React_Flow-xyflow-FF007F?logo=react&logoColor=white)](https://reactflow.dev/)

---

## 项目信息

当前前端项目目录：

```text
cloud-topology-ui/
```

当前已部署 Worker API：

```text
https://cloud-topology-api.loor1232026.workers.dev
```

本地 `.env` 应配置为：

```env
VITE_API_URL=https://cloud-topology-api.loor1232026.workers.dev
```

后端健康检查地址：

```text
https://cloud-topology-api.loor1232026.workers.dev/api/graph
```

如果返回下面内容，说明 Worker 与 D1 已打通：

```json
{"nodes":[],"edges":[]}
```

直接访问 Worker 根路径返回 `{"error":"Not Found"}` 是正常现象，因为后端只提供 `/api/*` 接口。

---

## 系统架构

```text
+-----------------------------------+
|        React Flow Frontend        |  Cloudflare Pages 托管
|    拖拽、连线、节点表单、画布交互     |
+-----------------------------------+
                 |
                 | HTTPS / JSON
                 v
+-----------------------------------+
|        Vanilla JS Worker API      |  Cloudflare Workers 边缘计算
|      路由处理、CORS、D1 数据读写     |
+-----------------------------------+
                 |
                 | SQL Binding: env.DB
                 v
+-----------------------------------+
|          D1 SQL Database          |  Cloudflare D1 SQLite
|          nodes / edges 两张表       |
+-----------------------------------+
```

核心数据模型是一个轻量图结构：

- `nodes` 表保存节点，也就是 Provider、Domain、App。
- `edges` 表保存连线，也就是节点之间的依赖、托管、解析或绑定关系。
- `metadata` 字段保存不同节点类型的扩展信息，例如平台名称、登录邮箱、应用 URL。

---

## 本地开发

安装依赖：

```bash
npm install
```

启动开发服务：

```bash
npm run dev
```

浏览器访问：

```text
http://localhost:5173
```

生产构建：

```bash
npm run build
```

本地预览生产包：

```bash
npm run preview
```

注意：修改 `.env` 后需要重启 `npm run dev`，否则 Vite 不会重新读取环境变量。

---

## 前端目录结构

```text
cloud-topology-ui/
├── .env
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── App.tsx
    ├── index.css
    ├── main.tsx
    ├── vite-env.d.ts
    └── components/
        └── CustomNode.tsx
```

主要文件说明：

- `src/App.tsx`：主画布、节点创建表单、React Flow 状态同步逻辑。
- `src/components/CustomNode.tsx`：自定义节点 UI，负责展示节点类型、名称、metadata 和删除按钮。
- `src/index.css`：Tailwind CSS 入口与全局布局尺寸。
- `.env`：本地开发使用的 Worker API 地址。
- `vite.config.ts`：Vite + React 构建配置。
- `tailwind.config.js`：Tailwind 与 daisyUI 配置。

---

## Worker 后端部署

后端可以直接在 Cloudflare 控制台中完成，无需本地安装 Wrangler。

### 1. 创建 D1 数据库

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)。
2. 进入 **Storage & Databases** -> **D1**。
3. 点击 **Create database**。
4. 数据库名称填写：

```text
cloud-topology-db
```

5. 创建完成后进入数据库页面，打开 **Console**。
6. 执行下面的 SQL：

```sql
CREATE TABLE IF NOT EXISTS nodes (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    label TEXT NOT NULL,
    position_x REAL NOT NULL,
    position_y REAL NOT NULL,
    metadata TEXT DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS edges (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL,
    target TEXT NOT NULL,
    label TEXT
);
```

### 2. 创建 Worker

1. 进入 **Workers & Pages**。
2. 点击 **Create** -> **Create Worker**。
3. Worker 名称建议填写：

```text
cloud-topology-api
```

4. 部署后进入 **Edit Code**。
5. 将 `worker.js` 替换为以下代码并保存部署：

```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      if (path === '/api/graph' && method === 'GET') {
        const { results: dbNodes } = await env.DB.prepare('SELECT * FROM nodes').all();
        const { results: dbEdges } = await env.DB.prepare('SELECT * FROM edges').all();

        const nodes = dbNodes.map((node) => ({
          id: node.id,
          type: 'custom',
          position: { x: node.position_x, y: node.position_y },
          data: {
            label: node.label,
            type: node.type,
            metadata: JSON.parse(node.metadata || '{}'),
          },
        }));

        const edges = dbEdges.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.label || '',
        }));

        return Response.json({ nodes, edges }, { headers: corsHeaders });
      }

      if (path === '/api/nodes' && method === 'POST') {
        const body = await request.json();
        const { id, type, label, position, data } = body;
        const metadata = JSON.stringify(data?.metadata || {});

        await env.DB.prepare(`
          INSERT INTO nodes (id, type, label, position_x, position_y, metadata)
          VALUES (?1, ?2, ?3, ?4, ?5, ?6)
          ON CONFLICT(id) DO UPDATE SET
            type = excluded.type,
            label = excluded.label,
            position_x = excluded.position_x,
            position_y = excluded.position_y,
            metadata = excluded.metadata
        `).bind(id, type, label, position.x, position.y, metadata).run();

        return Response.json({ success: true }, { headers: corsHeaders });
      }

      if (path.startsWith('/api/nodes/') && method === 'DELETE') {
        const id = path.split('/').pop();

        await env.DB.batch([
          env.DB.prepare('DELETE FROM nodes WHERE id = ?').bind(id),
          env.DB.prepare('DELETE FROM edges WHERE source = ? OR target = ?').bind(id, id),
        ]);

        return Response.json({ success: true }, { headers: corsHeaders });
      }

      if (path === '/api/edges' && method === 'POST') {
        const body = await request.json();
        const { id, source, target, label } = body;

        await env.DB.prepare(`
          INSERT INTO edges (id, source, target, label)
          VALUES (?1, ?2, ?3, ?4)
          ON CONFLICT(id) DO NOTHING
        `).bind(id, source, target, label || '').run();

        return Response.json({ success: true }, { headers: corsHeaders });
      }

      if (path.startsWith('/api/edges/') && method === 'DELETE') {
        const id = path.split('/').pop();

        await env.DB.prepare('DELETE FROM edges WHERE id = ?').bind(id).run();

        return Response.json({ success: true }, { headers: corsHeaders });
      }

      return Response.json({ error: 'Not Found' }, { status: 404, headers: corsHeaders });
    } catch (error) {
      return Response.json(
        {
          error: `D1 数据库异常，请确认绑定名是否为 DB。错误详情: ${error.message}`,
        },
        { status: 500, headers: corsHeaders },
      );
    }
  },
};
```

### 3. 绑定 D1 到 Worker

1. 回到 `cloud-topology-api` Worker 管理页。
2. 进入 **Settings** -> **Variables and Bindings**。
3. 找到 **D1 Database Bindings**。
4. 添加绑定：

```text
Variable name: DB
D1 database: cloud-topology-db
```

5. 保存并重新部署 Worker。

### 4. 验证 Worker

访问：

```text
https://cloud-topology-api.loor1232026.workers.dev/api/graph
```

正常返回示例：

```json
{"nodes":[],"edges":[]}
```

如果返回 D1 绑定错误，重点检查 Worker 的 D1 绑定变量名是否严格为 `DB`。

---

## API 接口

### 获取拓扑图

```http
GET /api/graph
```

返回：

```json
{
  "nodes": [],
  "edges": []
}
```

### 新增或更新节点

```http
POST /api/nodes
```

请求体示例：

```json
{
  "id": "provider-1710000000000",
  "type": "provider",
  "label": "Cloudflare Personal",
  "position": { "x": 120, "y": 160 },
  "data": {
    "type": "provider",
    "label": "Cloudflare Personal",
    "metadata": {
      "platform": "cloudflare",
      "email": "me@example.com"
    }
  }
}
```

### 删除节点

```http
DELETE /api/nodes/:id
```

删除节点时，Worker 会同时删除与该节点相关的连线。

### 新增连线

```http
POST /api/edges
```

请求体示例：

```json
{
  "id": "e-provider-1-domain-1",
  "source": "provider-1",
  "target": "domain-1",
  "label": ""
}
```

### 删除连线

```http
DELETE /api/edges/:id
```

---

## Pages 前端部署

前端基于 Vite + React + React Flow 构建。

### 1. 推送代码到 GitHub

将当前 `cloud-topology-ui` 目录推送到 GitHub 仓库，建议使用私有仓库。

### 2. 创建 Cloudflare Pages

1. 进入 Cloudflare Dashboard。
2. 打开 **Workers & Pages**。
3. 点击 **Create** -> **Pages** -> **Connect to Git**。
4. 选择当前前端仓库。

构建配置：

```text
Framework preset: Vite
Build command: npm run build
Build output directory: dist
```

环境变量：

```text
VITE_API_URL=https://cloud-topology-api.loor1232026.workers.dev
```

注意：`VITE_API_URL` 末尾不要加 `/`。

部署完成后访问生成的 `*.pages.dev` 域名即可使用。

---

## 前端同步策略

当前前端采用“本地优先 + 后端同步”的方式：

- 点击“放入画布”后，节点会立即出现在画布中。
- 如果 Worker API 可用，前端会同步写入 D1。
- 如果 Worker API 暂时不可用，前端会切换为本地测试模式，并写入浏览器 `localStorage`。
- 页面右上角会显示当前是 `API 同步` 还是 `本地测试`。

这能避免后端未启动或 API 地址配置错误时，用户点击后没有任何反馈。

---

## 常见问题

### 点击“放入画布”后没有保存到云端

优先检查 `.env` 或 Cloudflare Pages 环境变量：

```env
VITE_API_URL=https://cloud-topology-api.loor1232026.workers.dev
```

修改 `.env` 后必须重启开发服务：

```bash
npm run dev
```

### `/api/graph` 返回 D1 绑定错误

检查 Worker 设置中的 D1 绑定变量名是否为：

```text
DB
```

变量名大小写敏感。

### 前端部署后仍然请求旧 API

Cloudflare Pages 的环境变量是在构建时注入的。修改 `VITE_API_URL` 后，需要重新部署 Pages。

### 浏览器中看到旧数据

如果之前进入过本地测试模式，浏览器 `localStorage` 里可能有缓存数据。可以在开发者工具中清理当前站点的 localStorage，或在控制台执行：

```javascript
localStorage.removeItem('cloud-topology-local-graph');
```

---

## 安全性建议

该看板可能包含平台账号、域名、应用 URL、部署关系等敏感资产信息，不建议公开访问。

推荐使用 Cloudflare Access 保护 Pages 前端：

1. 进入 Cloudflare **Zero Trust**。
2. 打开 **Access** -> **Applications**。
3. 添加一个 **Self-hosted** 应用。
4. 绑定你的 Pages 前端域名。
5. 配置策略，只允许你的邮箱或 GitHub 账号访问。

这样可以让看板只对你本人可见。

---

## 后续开发规划

- 节点详情侧边栏，支持编辑 metadata。
- 支持删除连线的 UI 操作。
- 支持搜索节点、按类型筛选节点。
- 支持导入和导出 JSON 备份。
- 支持更多节点类型，例如 Database、Bucket、Repository、VPS。
- 支持节点分组和标签。
- 支持更细粒度的鉴权与只读分享模式。

---

## License

本项目计划采用 MIT License 协议开源。
