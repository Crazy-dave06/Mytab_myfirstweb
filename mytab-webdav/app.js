(() => {
  "use strict";
  const STORAGE_KEY = "mytab.bookmarks.v1";
  const THEME_KEY = "mytab.theme.v1";
  const $ = (id) => document.getElementById(id);
  const starterBookmarks = [
    { id: makeId(), title: "GitHub", url: "https://github.com", category: "开发工具", icon: "GH" },
    { id: makeId(), title: "MDN Web Docs", url: "https://developer.mozilla.org", category: "学习资料", icon: "MDN" },
    { id: makeId(), title: "Wikipedia", url: "https://www.wikipedia.org", category: "知识百科", icon: "W" },
    { id: makeId(), title: "Google", url: "https://www.google.com", category: "搜索引擎", icon: "G" },
    { id: makeId(), title: "YouTube", url: "https://www.youtube.com", category: "影音娱乐", icon: "YT" },
    { id: makeId(), title: "Stack Overflow", url: "https://stackoverflow.com", category: "开发工具", icon: "SO" }
  ];
  let bookmarks = loadBookmarks();
  let activeCategory = "全部";
  let webdavPassword = ""; // intentionally memory-only; not saved in localStorage
  let toastTimer = null;

  function makeId() {
    return (globalThis.crypto && crypto.randomUUID) ? crypto.randomUUID() :
      "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  }
  function loadBookmarks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(starterBookmarks));
        return starterBookmarks;
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error("书签数据格式不正确");
      return parsed.filter(isValidBookmark);
    } catch (error) {
      console.error(error);
      return starterBookmarks;
    }
  }
  function isValidBookmark(item) {
    return item && typeof item.id === "string" && typeof item.title === "string" &&
      typeof item.url === "string" && typeof item.category === "string";
  }
  function saveLocal() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
    render();
  }
  function normalizeUrl(value) {
    const url = new URL(value.trim());
    if (!["http:", "https:"].includes(url.protocol)) throw new Error("只允许 http:// 或 https:// 网站地址");
    return url.href;
  }
  function escapeText(value) {
    return String(value).replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[ch]);
  }
  function showToast(message) {
    const toast = $("toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
  }
  function setStatus(message, state = "") {
    $("statusText").textContent = message;
    $("statusDot").className = state;
  }
  function categories() {
    return ["全部", ...new Set(bookmarks.map(b => b.category.trim()).filter(Boolean))];
  }
  function renderFilters() {
    const wrap = $("categoryFilters");
    wrap.replaceChildren();
    categories().forEach(category => {
      const button = document.createElement("button");
      button.className = "filter-btn" + (activeCategory === category ? " active" : "");
      button.textContent = category;
      button.type = "button";
      button.addEventListener("click", () => { activeCategory = category; render(); });
      wrap.append(button);
    });
    if (!categories().includes(activeCategory)) activeCategory = "全部";
  }
  function faviconFor(url) {
    try {
      const u = new URL(url);
      return "https://www.google.com/s2/favicons?domain=" + encodeURIComponent(u.hostname) + "&sz=96";
    } catch { return ""; }
  }
  function render() {
    renderFilters();
    const query = $("searchInput").value.trim().toLowerCase();
    const visible = bookmarks.filter(b => {
      const matchesCategory = activeCategory === "全部" || b.category === activeCategory;
      const matchesQuery = !query || [b.title, b.url, b.category].some(v => String(v).toLowerCase().includes(query));
      return matchesCategory && matchesQuery;
    });
    const grid = $("bookmarkGrid");
    grid.replaceChildren();
    visible.forEach(b => {
      const card = document.createElement("article");
      card.className = "bookmark-card";
      const link = document.createElement("a");
      link.className = "card-link";
      link.href = b.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.setAttribute("aria-label", "打开 " + b.title);
      const icon = document.createElement("div");
      icon.className = "site-icon";
      const img = document.createElement("img");
      img.src = faviconFor(b.url);
      img.alt = "";
      img.loading = "lazy";
      img.referrerPolicy = "no-referrer";
      img.onerror = () => { img.remove(); icon.textContent = b.icon || b.title.slice(0, 2).toUpperCase(); };
      icon.append(img);
      const title = document.createElement("div");
      title.className = "site-title";
      title.textContent = b.title;
      const category = document.createElement("div");
      category.className = "site-category";
      category.textContent = b.category || "未分类";
      link.append(icon, title, category);
      const actions = document.createElement("div");
      actions.className = "card-actions";
      const edit = document.createElement("button");
      edit.className = "mini-btn"; edit.type = "button"; edit.title = "编辑"; edit.textContent = "✎";
      edit.addEventListener("click", () => openBookmarkDialog(b));
      const del = document.createElement("button");
      del.className = "mini-btn"; del.type = "button"; del.title = "删除"; del.textContent = "×";
      del.addEventListener("click", () => deleteBookmark(b));
      actions.append(edit, del);
      card.append(link, actions);
      grid.append(card);
    });
    $("emptyState").classList.toggle("hidden", visible.length !== 0);
    grid.classList.toggle("hidden", visible.length === 0);
    $("bookmarkCount").textContent = `${bookmarks.length} 个书签`;
  }
  function openBookmarkDialog(bookmark = null) {
    $("bookmarkForm").reset();
    $("bookmarkId").value = bookmark?.id || "";
    $("bookmarkTitle").value = bookmark?.title || "";
    $("bookmarkUrl").value = bookmark?.url || "";
    $("bookmarkCategory").value = bookmark?.category || "";
    $("bookmarkIcon").value = bookmark?.icon || "";
    $("bookmarkDialogTitle").textContent = bookmark ? "编辑书签" : "添加书签";
    $("bookmarkDialog").showModal();
    $("bookmarkTitle").focus();
  }
  function deleteBookmark(bookmark) {
    if (!confirm(`确定删除书签“${bookmark.title}”吗？`)) return;
    bookmarks = bookmarks.filter(b => b.id !== bookmark.id);
    saveLocal();
    setStatus("本地已保存；记得上传同步");
    showToast("书签已删除");
  }
  function openSettings() {
    $("davUrl").value = sessionStorage.getItem("mytab.davUrl") || "";
    $("davUser").value = sessionStorage.getItem("mytab.davUser") || "";
    $("davPassword").value = webdavPassword;
    $("settingsMessage").textContent = "";
    $("settingsMessage").className = "settings-message";
    $("settingsDialog").showModal();
  }
  function getDavConfig() {
    const urlText = $("davUrl").value.trim();
    if (!urlText) throw new Error("请填写书签 JSON 文件的完整 URL");
    const url = new URL(urlText);
    if (!["https:", "http:"].includes(url.protocol)) throw new Error("WebDAV 地址必须使用 HTTP 或 HTTPS");
    if (location.protocol === "https:" && url.protocol !== "https:") throw new Error("HTTPS 网页不能访问 HTTP WebDAV 地址，请改用 HTTPS");
    const username = $("davUser").value.trim();
    const password = $("davPassword").value;
    if (!username || !password) throw new Error("请填写 WebDAV 用户名和密码");
    webdavPassword = password;
    sessionStorage.setItem("mytab.davUrl", url.href);
    sessionStorage.setItem("mytab.davUser", username);
    return { url: url.href, username, password };
  }
  function basicAuth(username, password) {
    const bytes = new TextEncoder().encode(`${username}:${password}`);
    let binary = "";
    bytes.forEach(byte => binary += String.fromCharCode(byte));
    return "Basic " + btoa(binary);
  }
  async function davRequest(method, body) {
    const cfg = getDavConfig();
    const headers = { "Authorization": basicAuth(cfg.username, cfg.password) };
    const options = { method, headers, mode: "cors", cache: "no-store" };
    if (body !== undefined) {
      headers["Content-Type"] = "application/json; charset=utf-8";
      options.body = body;
    }
    let response;
    try {
      response = await fetch(cfg.url, options);
    } catch (err) {
      throw new Error("网络或 CORS 请求失败。请检查服务器地址、HTTPS、CORS 和浏览器控制台。");
    }
    return response;
  }
  function showSettingsMessage(message, state = "") {
    $("settingsMessage").textContent = message;
    $("settingsMessage").className = "settings-message " + state;
  }
  async function testDav() {
    showSettingsMessage("正在测试读取权限……");
    try {
      const response = await davRequest("GET");
      if (response.ok) {
        const text = await response.text();
        try {
          const data = JSON.parse(text);
          if (!Array.isArray(data)) throw new Error("远程文件不是书签数组");
        } catch (e) {
          throw new Error("连接成功，但文件内容不是有效的 MyTab JSON 数组。");
        }
        showSettingsMessage("连接成功：已能读取远程书签文件。", "success");
      } else if (response.status === 404) {
        showSettingsMessage("服务器可访问，但文件不存在。可以点击“上传本地书签”创建文件。", "success");
      } else if (response.status === 401 || response.status === 403) {
        showSettingsMessage(`服务器拒绝访问（HTTP ${response.status}），请检查用户名、密码和文件权限。`, "error");
      } else {
        showSettingsMessage(`服务器返回 HTTP ${response.status}。`, "error");
      }
    } catch (error) { showSettingsMessage(error.message, "error"); }
  }
  async function uploadDav() {
    if (!confirm("将把本设备的书签覆盖写入 WebDAV 文件。建议先确认远程文件没有更新，是否继续？")) return;
    showSettingsMessage("正在上传书签……");
    try {
      const payload = JSON.stringify(bookmarks, null, 2);
      const response = await davRequest("PUT", payload);
      if (!response.ok && response.status !== 201 && response.status !== 204) {
        throw new Error(`上传失败：HTTP ${response.status}。检查文件写入权限及服务器是否允许 PUT。`);
      }
      setStatus("已上传到 WebDAV", "ok");
      showSettingsMessage(`上传成功：${bookmarks.length} 个书签已写入远程文件。`, "success");
      showToast("书签已上传到 WebDAV");
    } catch (error) {
      setStatus("同步失败", "error");
      showSettingsMessage(error.message, "error");
    }
  }
  async function downloadDav() {
    if (!confirm("下载会用云端书签替换本设备当前书签。建议先上传或导出本地数据，是否继续？")) return;
    showSettingsMessage("正在下载远程书签……");
    try {
      const response = await davRequest("GET");
      if (response.status === 404) throw new Error("远程文件不存在。请先在一台设备上上传书签。");
      if (!response.ok) throw new Error(`下载失败：HTTP ${response.status}。`);
      const data = await response.json();
      if (!Array.isArray(data) || !data.every(isValidBookmark)) {
        throw new Error("远程文件格式无效，已保留本地书签。");
      }
      bookmarks = data;
      saveLocal();
      setStatus("已从 WebDAV 下载", "ok");
      showSettingsMessage(`下载成功：已导入 ${bookmarks.length} 个书签。`, "success");
      showToast("云端书签已下载");
    } catch (error) {
      setStatus("同步失败", "error");
      showSettingsMessage(error.message, "error");
    }
  }
  function updateClock() {
    const now = new Date();
    const hour = now.getHours();
    const greeting = hour < 6 ? "夜深了，注意休息。" : hour < 12 ? "早上好，开始新的一天。" : hour < 18 ? "下午好，继续加油。" : "晚上好，欢迎回来。";
    $("clock").textContent = greeting;
    $("todayLabel").textContent = now.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "long" }).toUpperCase();
  }

  $("addBtn").addEventListener("click", () => openBookmarkDialog());
  $("emptyAddBtn").addEventListener("click", () => openBookmarkDialog());
  $("settingsBtn").addEventListener("click", openSettings);
  $("searchInput").addEventListener("input", render);
  $("testDavBtn").addEventListener("click", testDav);
  $("uploadDavBtn").addEventListener("click", uploadDav);
  $("downloadDavBtn").addEventListener("click", downloadDav);
  $("themeBtn").addEventListener("click", () => {
    document.body.classList.toggle("dark");
    localStorage.setItem(THEME_KEY, document.body.classList.contains("dark") ? "dark" : "light");
  });
  $("bookmarkForm").addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      const id = $("bookmarkId").value || makeId();
      const bookmark = {
        id,
        title: $("bookmarkTitle").value.trim(),
        url: normalizeUrl($("bookmarkUrl").value),
        category: $("bookmarkCategory").value.trim() || "未分类",
        icon: $("bookmarkIcon").value.trim()
      };
      if (!bookmark.title) throw new Error("请填写网站名称");
      const index = bookmarks.findIndex(b => b.id === id);
      if (index >= 0) bookmarks[index] = bookmark; else bookmarks.push(bookmark);
      activeCategory = "全部";
      saveLocal();
      $("bookmarkDialog").close();
      setStatus("本地已保存；记得上传同步");
      showToast(index >= 0 ? "书签已更新" : "书签已添加");
    } catch (error) { showToast(error.message || "请检查输入内容"); }
  });
  document.querySelectorAll("[data-close]").forEach(button => {
    button.addEventListener("click", () => $(button.dataset.close).close());
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
      event.preventDefault(); $("searchInput").focus();
    }
    if (event.key === "Escape") {
      if ($("bookmarkDialog").open) $("bookmarkDialog").close();
      if ($("settingsDialog").open) $("settingsDialog").close();
    }
  });
  if (localStorage.getItem(THEME_KEY) === "dark") document.body.classList.add("dark");
  updateClock();
  render();
})();