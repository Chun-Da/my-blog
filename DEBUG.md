# iOS 文章页崩溃 — 排查文档

## 已尝试的修复（均未解决）

| 序号 | 修复方向 | 具体措施 | 结果 |
|------|----------|----------|------|
| 1 | 图片体积 | Wikimedia 外链 → 本地压缩 (8.5MB→805KB) | 未解决 |
| 2 | 图片加载策略 | `loading="lazy" decoding="async"` 注入 img 标签 | 未解决 |
| 3 | CSS 兼容 | 移除 `backdrop-filter: blur()` (iOS Safari 性能杀手) | 未解决 |
| 4 | JS 重复渲染 | 修复 hashchange 导致 showArticle 调用两次的 bug | 未解决 |
| 5 | 事件监听 | 灯箱/错误处理改为事件委托 (减少 listener 数量) | 未解决 |

## 下一步排查方向

当前怀疑链：

```
点击文章卡片 → 路由切换 → showArticle → innerHTML 插入内容
                                           │
                                           ├── 图片同时加载？(已加 lazy)
                                           ├── DOM 过大导致 reflow？
                                           ├── JS 执行错误？(iOS Safari JSC 引擎差异)
                                           └── Cloudflare 注入脚本干扰？
```

建议分阶段隔离测试：

### 阶段 1：排除图片因素

创建一篇无图片的文章，看是否仍然崩溃。
→ 如果崩溃 → 图片不是原因，问题在 JS/CSS/框架
→ 如果不崩溃 → 图片是原因，进一步排查 lazy loading 在 iOS 是否生效

### 阶段 2：排除 JS 框架因素

创建纯静态文章页（不用 SPA、不用 JS 渲染），直接 HTML。
→ 如果不崩溃 → 问题在 app.js 的路由/渲染逻辑

### 阶段 3：排除网络因素

直接访问服务器 IP 绕过 Cloudflare 测试。
