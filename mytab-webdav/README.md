# MyTab - WebDAV 同步书签面板

一个原生 HTML / CSS / JavaScript 的响应式书签起始页。无需构建工具。

## 文件

- `index.html`：页面结构
- `style.css`：样式与响应式布局
- `app.js`：书签管理和 WebDAV GET/PUT 同步

## 本地运行

推荐使用 VS Code 的 Live Server，或任意静态 HTTP 服务器。也可以在开发阶段直接打开 `index.html`，但部署和 WebDAV 测试推荐通过 HTTPS 网站运行。

如果电脑安装了 Python，可在项目目录执行：

```bash
python -m http.server 8080
```

然后打开 `http://localhost:8080`。这只用于本机测试；手机无法通过 localhost 访问电脑。若希望手机也访问，请将项目部署到 HTTPS 静态网站，或在同一局域网使用电脑局域网 IP 并自行处理 HTTPS/CORS 限制。

## WebDAV 配置

1. 在可信任的 WebDAV 服务中准备一个可读写文件地址，例如 `https://dav.example.com/remote.php/dav/files/用户名/mytab-bookmarks.json`。
2. 先在一台设备添加书签。
3. 点击右上角“同步设置”，填入**文件完整 URL**、用户名和密码/应用专用密码。
4. 点击“测试连接”。远程文件尚不存在时，显示 404 是正常的。
5. 点击“上传本地书签”创建或更新远程 JSON 文件。
6. 在另一台设备打开同一页面，填写同一个 WebDAV 地址和账号，点击“从云端下载”。

## WebDAV 服务器要求

- 必须允许 `GET` 和 `PUT` 访问这个文件。
- 由于网页和 WebDAV 服务器通常不同源，WebDAV 服务器必须正确响应 CORS 预检请求 `OPTIONS`。
- CORS 配置应允许页面的精确 Origin、`GET, PUT, OPTIONS` 方法以及 `Authorization, Content-Type` 请求头。
- 使用 Basic Auth 时，服务器需要允许 Authorization 请求头。建议只使用 HTTPS。
- 如果服务器不支持浏览器 CORS，纯前端无法绕过；需要修改服务器配置或搭建同源后端代理。

## 安全说明

- 密码仅保存在当前页面 JavaScript 内存中；刷新页面后需要重新输入。
- WebDAV URL 和用户名保存在当前浏览器的 `sessionStorage` 中。
- 不要把 WebDAV 密码写进代码、提交到 Git 仓库或放进公开配置文件。
- 不要在不可信的公共电脑上输入 WebDAV 凭据。
- `PUT` 会覆盖远程 JSON 文件；本版不做自动冲突合并。多设备编辑前，请先下载云端最新版本；上传前请确认不会覆盖其他设备的新数据。
- 建议在 WebDAV 服务端启用版本历史或定期备份。
- 此版本未实现加密、自动同步、冲突合并或多用户权限管理。

## 测试清单

1. 添加一个书签，刷新页面，确认还存在。
2. 编辑、删除书签，测试分类筛选与搜索。
3. 配置 WebDAV，测试读取已有文件或首次上传。
4. 在另一台设备下载远程文件，检查书签是否一致。
5. 修改第二台设备上的一个书签并上传，再回到第一台设备下载，检查更新。
6. 在开发者工具的 Network / Console 中检查 CORS、401/403、404、405 等错误。

## 常见错误

- `TypeError: Failed to fetch`：常见原因是 CORS、网络连接、TLS 证书、混合内容或重定向。
- `401`：认证信息不正确，或服务要求应用专用密码。
- `403`：账号已认证但没有该文件的读取/写入权限。
- `404`：远程文件还不存在，先上传创建。
- `405`：服务器不允许 GET 或 PUT，需检查 WebDAV 服务端配置。
- `OPTIONS` 失败：服务端 CORS 预检响应配置不正确。

## 部署

把这三个文件上传到支持静态站点的 HTTPS 托管服务即可。不要把 `README.md` 或任何账号密码写入公开站点不是必须的。若使用 GitHub Pages，可将 `index.html`、`style.css`、`app.js` 放进仓库并启用 Pages。
