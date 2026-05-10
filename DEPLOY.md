# 博客部署 - 待完成步骤

## 当前状态

- 服务器：DigitalOcean `159.223.72.92`（新加坡）
- Nginx 已安装，配置文件在 `/etc/nginx/sites-available/my-blog`
- 网站文件在 `/var/www/my-blog/`
- 本地访问正常（curl localhost → 200）

## 你需要做的

### 1. 开放 80 端口（DigitalOcean 云防火墙）

DO 后台 → Networking → Firewalls → 找到这个 Droplet 关联的防火墙 → 添加 Inbound Rule：

| 类型 | 协议 | 端口 |
|------|------|------|
| HTTP | TCP | 80 |

添加后外部才能访问网站。

### 2. 配置 Cloudflare DNS

在 Cloudflare 控制台添加一条 A 记录：

| 类型 | 名称 | 内容 | 代理状态 |
|------|------|------|----------|
| A | @（或 blog）| 159.223.72.92 | 开启（橙色云朵）|

如果只是博客用，建议加子域名 `blog`：

| 类型 | 名称 | 内容 |
|------|------|------|
| A | blog | 159.223.72.92 |

### 3. （可选）Cloudflare SSL

由于 443 端口已被其他服务占用，可以靠 Cloudflare 的 Flexible SSL 来提供 HTTPS：

1. Cloudflare → 你的域名 → SSL/TLS → 设为 **Flexible**
2. 用户访问 `https://blog.yuchai.ccwu.cc` → Cloudflare 加密 → 服务器 80 端口

不需要动服务器的 443 端口。

## 发布新文章

编辑 `js/articles.js`，在 `ARTICLES` 数组最前面添加：

```js
{
  id: "my-post",
  title: "文章标题",
  date: "2026-05-09",
  excerpt: "摘要",
  content: `<p>正文...</p>`,
},
```

然后上传到服务器：

```bash
scp js/articles.js root@159.223.72.92:/var/www/my-blog/js/
```
