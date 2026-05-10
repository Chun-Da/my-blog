# 博客技术文档

## 架构总览

```
用户 → https://blog.yuchai.ccwu.cc
       │
       ▼
  Cloudflare CDN (SSL termination + cache)
       │
       ▼ Cloudflare Origin Rule: hostname=blog.yuchai.ccwu.cc → port 8443
       │
  DigitalOcean 159.223.72.92
       ├── :8443  Nginx HTTPS (自签证书，Full SSL 模式可用)
       ├── :80    Nginx HTTP (备用)
       └── :443   Xray VLESS+REALITY (不受影响)
```

## 服务器

| 项目 | 值 |
|------|-----|
| 主机 | DigitalOcean Droplet `sg-2` |
| IP | `159.223.72.92` |
| 系统 | Ubuntu 24.04 LTS |
| SSH | `root@159.223.72.92` (key) |
| Web 目录 | `/var/www/my-blog/` |
| Nginx 配置 | `/etc/nginx/sites-available/my-blog` |
| SSL 证书 | `/etc/nginx/ssl/my-blog.{crt,key}` (自签, 10年) |

## Nginx 配置要点

```nginx
# 两个 server block 均设为 default_server
# :80  — HTTP
# :8443 — HTTPS (自签证书，Cloudflare Full SSL 模式回源)
# JS/CSS/图片设 Cache-Control: no-cache 防 CDN 缓存旧版本
```

### 开放端口（DO 防火墙）

| 端口 | 协议 | 用途 |
|------|------|------|
| 80 | TCP | HTTP（备用） |
| 8443 | TCP | HTTPS 回源（Cloudflare → Nginx） |

## 部署架构

### 文件结构

```
/var/www/my-blog/
├── index.html       # SPA 外壳
├── css/styles.css   # 样式
├── js/
│   ├── articles.js  # 文章数据（唯一需要编辑的文件）
│   └── app.js       # 渲染逻辑
└── img/             # 文章图片（本地压缩版）
```

### 核心技术点

| 功能 | 实现 |
|------|------|
| 路由 | Hash-based SPA (`#article/xxx`, `#about`) |
| 文章数据 | JS 数组 `ARTICLES`，编辑 `articles.js` 即可发文章 |
| 图片优化 | 插入 DOM 前注入 `loading="lazy" decoding="async"` |
| 图片灯箱 | 事件委托（单 listener 管所有图片） |
| 图片加载失败 | 事件委托兜底（隐藏图片+配文） |
| CDN 缓存策略 | JS/CSS 版本号 `?v=N` + `Cache-Control: no-cache` |

## iOS 兼容性修复记录

### 问题 1：点进文章卡死

**原因**：
1. `optimizeImages()` 在 `innerHTML` 之后才给 `<img>` 加 `loading="lazy"`，此时浏览器已开始同步下载所有图片
2. `backdrop-filter: blur()` 在 iOS Safari sticky header 上引发严重渲染性能问题

**修复**：
1. 用 `prepImages()` 在 HTML 字符串插入 DOM **之前**，正则替换 `<img ` → `<img loading="lazy" decoding="async" `
2. 移除 `.site-header` 的 `backdrop-filter: blur(8px)`
3. 添加 `-webkit-text-size-adjust: 100%` 防止 iOS 字号缩放

### 问题 2：图片不显示

**原因**：Wikimedia Commons 可能对跨域 hotlinking 有限制

**修复**：图片下载到服务器本地 `/var/www/my-blog/img/`，压缩后（8.5MB → 805KB）自托管

| 文件 | 原始大小 | 压缩后 |
|------|----------|--------|
| cover.jpg | 1.9 MB | 243 KB |
| golden.jpg | 2.2 MB | 251 KB |
| misty.jpg | 372 KB | 107 KB |
| summit.jpg | 4.2 MB | 204 KB |

## 日常操作

### 发布新文章

1. 编辑 `js/articles.js`，在 `ARTICLES` 数组最前面添加对象：

```js
{
  id: "my-post",
  title: "文章标题",
  date: "2026-05-09",
  excerpt: "摘要",
  cover: "img/xxx.jpg",  // 可选
  tags: ["标签1", "标签2"],  // 可选
  content: `<p>正文...</p>`,
}
```

2. 如果有新图片，放入 `img/` 目录
3. 上传：

```bash
scp js/articles.js root@159.223.72.92:/var/www/my-blog/js/
# 如有新图片：
scp img/*.jpg root@159.223.72.92:/var/www/my-blog/img/
```

## Cloudflare 配置

| 设置 | 值 |
|------|-----|
| SSL/TLS 模式 | Full |
| DNS A 记录 `blog` | `159.223.72.92`（橙色云朵）|
| Origin Rule | hostname=`blog.yuchai.ccwu.cc` → destination port `8443` |

## 已知注意事项

- `yuchai.ccwu.cc` 根域名未配置 Origin Rule，直接访问会走 443 端口（Xray），可能显示异常
- 博客地址统一使用 `https://blog.yuchai.ccwu.cc/`
- JS/CSS 版本号在 `index.html` 中，如果 Cloudflare 缓存了旧版，修改 `?v=N` 的值即可强制刷新
- 图片尽量压缩到 <300KB 后再上传，避免移动端内存压力
