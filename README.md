# Life OS

一个可公开分享的个人生活记录网站，包含：

- 年度倒计时
- 每日 KISS 复盘
- 每天感悟与图片
- 时间统计与图表
- 读书笔记
- 朋友生日提醒
- 日历聚合视图

## 本地运行

```bash
npm install
npm start
```

默认访问地址：

- `http://localhost:3000`

## 共享数据

现在网站数据由服务端保存到 `data/store.json`，不再依赖单个浏览器的 `localStorage`。

- 所有人访问同一个部署地址时，会看到同一份记录
- 旧版浏览器本地数据在服务器为空时会自动迁移一次
- 板块折叠状态仍然只保存在当前浏览器

## Render 部署

这个项目已经带了 `render.yaml`，适合直接部署到 Render：

1. 把项目推到 GitHub。
2. 在 Render 里选择 `New +` -> `Blueprint`。
3. 连接你的 GitHub 仓库。
4. 选择这个项目，Render 会读取 `render.yaml` 自动创建服务和持久化磁盘。
5. 部署完成后，访问 Render 分配的公网域名。

注意：

- 持久化数据依赖 Render 磁盘，记录会保存在 `data/store.json`
- 如果换成别的平台，也需要给这个目录提供持久存储
