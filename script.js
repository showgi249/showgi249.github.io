/* ==========================================================
   SHOWGI249 — محرك عرض المحتوى
   ========================================================== */

const postsContainer = document.getElementById("posts");
const socialPostsContainer = document.getElementById("socialPostsGrid");
const contentLinksGrid = document.getElementById("contentLinksGrid");
const typeButtons = document.querySelectorAll(".filters button");
const platformButtons = document.querySelectorAll(".platform-filters button");

let allPosts = [];
let socialPosts = [];
let allContentLinks = [];
let filterState = { type: "all", platform: "all" };

/* ============ دوال مساعدة ============ */

function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function truncate(str, max = 140) {
  if (!str) return "";
  if (str.length <= max) return str;
  const cut = str.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(" ")) + "…";
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  try { return d.toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" }); }
  catch { return d.toISOString().split("T")[0]; }
}

function sortByDate(posts) {
  return [...posts].sort((a, b) => {
    const da = new Date(a.date || 0).getTime();
    const db = new Date(b.date || 0).getTime();
    return db - da;
  });
}

function detectPlatform(url) {
  if (!url) return { platform: "unknown", name: "منشور", icon: "🔗" };
  if (url.includes("youtube.com") || url.includes("youtu.be")) return { platform: "youtube", name: "YouTube", icon: "🎬" };
  if (url.includes("twitter.com") || url.includes("x.com")) return { platform: "x", name: "X (Twitter)", icon: "🐦" };
  if (url.includes("instagram.com")) return { platform: "instagram", name: "Instagram", icon: "📸" };
  if (url.includes("tiktok.com")) return { platform: "tiktok", name: "TikTok", icon: "🎵" };
  if (url.includes("facebook.com") || url.includes("fb.com")) return { platform: "facebook", name: "Facebook", icon: "👤" };
  if (url.includes("threads.com") || url.includes("threads.net")) return { platform: "threads", name: "Threads", icon: "🧵" };
  if (url.includes("t.me")) return { platform: "telegram", name: "Telegram", icon: "✈️" };
  if (url.includes("snapchat.com")) return { platform: "snapchat", name: "Snapchat", icon: "👻" };
  if (url.includes("linkedin.com")) return { platform: "linkedin", name: "LinkedIn", icon: "💼" };
  if (url.includes("reddit.com")) return { platform: "reddit", name: "Reddit", icon: "👽" };
  if (url.includes("pinterest.com")) return { platform: "pinterest", name: "Pinterest", icon: "📌" };
  if (url.includes("vimeo.com")) return { platform: "vimeo", name: "Vimeo", icon: "🎥" };
  if (url.includes("github.com")) return { platform: "github", name: "GitHub", icon: "🐙" };
  if (url.includes("bsky.app")) return { platform: "bluesky", name: "Bluesky", icon: "🦋" };
  return { platform: "unknown", name: "منشور", icon: "🔗" };
}

/* ============ جلب البيانات ============ */

async function loadRemotePosts() {
  try {
    const res = await fetch("./content.json?t=" + Date.now(), {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (Array.isArray(data.youtube_videos)) {
      allPosts = data.youtube_videos.map(v => ({
        id: v.videoId, platform: "youtube", type: "video",
        title: v.title || "", text: v.description || "",
        url: `https://www.youtube.com/watch?v=${v.videoId}`,
        media: v.thumbnail, date: v.publishedAt,
      }));
    } else if (Array.isArray(data.posts) && data.posts.length > 0 && data.posts[0].type) {
      allPosts = data.posts;
    } else {
      allPosts = [];
    }

    if (Array.isArray(data.posts)) {
      socialPosts = data.posts.filter(p => p.url && !p.type);
    }

    if (Array.isArray(data.content_links)) {
      allContentLinks = data.content_links;
    } else {
      allContentLinks = [];
    }

    allPosts = sortByDate(allPosts);
    console.log(`[SHOWGI249] محتوى: ${allPosts.length} | منشورات: ${socialPosts.length} | روابط: ${allContentLinks.length}`);
  } catch (err) {
    console.error("[SHOWGI249] فشل التحميل:", err);
    allPosts = []; socialPosts = []; allContentLinks = [];
  }

  renderPosts();
  renderSocialPosts();
  renderContentLinks();
}

/* ============ عرض مركز المحتوى ============ */

function renderPosts() {
  if (!postsContainer) return;
  const filtered = allPosts.filter(p => {
    const matchType = filterState.type === "all" || p.type === filterState.type;
    const matchPlatform = filterState.platform === "all" || p.platform === filterState.platform;
    return matchType && matchPlatform;
  });

  if (filtered.length === 0) {
    postsContainer.innerHTML = `
      <div class="empty-content">
        <div class="empty-icon">✦</div>
        <h3>لا يوجد محتوى لعرضه حالياً</h3>
        <p>سيظهر المحتوى هنا تلقائياً عند إضافته إلى content.json</p>
      </div>`;
    return;
  }

  postsContainer.innerHTML = filtered.map(post => {
    const title = post.title ? escapeHtml(post.title) : "";
    const text = post.text ? escapeHtml(truncate(post.text, 140)) : "";
    const date = formatDate(post.date);
    const url = escapeHtml(post.url || "#");
    const platform = escapeHtml(post.platform || "unknown");
    const mediaHtml = post.media
      ? `<div class="post-media"><a href="${url}" target="_blank" rel="noopener noreferrer"><img src="${escapeHtml(post.media)}" alt="${title || 'محتوى'}" loading="lazy"></a></div>`
      : "";
    return `
      <article class="post-card" data-platform="${platform}">
        ${mediaHtml}
        <div class="post-body">
          <div class="post-meta">
            <span class="platform-badge ${platform}">${platform}</span>
            ${date ? `<time datetime="${escapeHtml(post.date)}">${date}</time>` : ""}
          </div>
          ${title ? `<h3 class="post-title"><a href="${url}" target="_blank" rel="noopener noreferrer">${title}</a></h3>` : ""}
          ${text ? `<p class="post-text">${text}</p>` : ""}
          <a class="post-link" href="${url}" target="_blank" rel="noopener noreferrer">مشاهدة المحتوى ←</a>
        </div>
      </article>`;
  }).join("");
}

/* ============ كشف منصات روابط المحتوى ============ */

function detectContentPlatform(url) {
  if (!url) return { name: "منصة", icon: "🔗", color: "#666" };
  if (url.includes("youtube.com") || url.includes("youtu.be")) return { name: "YouTube", icon: "🎬", color: "#ff0000" };
  if (url.includes("vimeo.com")) return { name: "Vimeo", icon: "🎥", color: "#1ab7ea" };
  if (url.includes("twitter.com") || url.includes("x.com")) return { name: "X (Twitter)", icon: "🐦", color: "#1d9bf0" };
  if (url.includes("instagram.com")) return { name: "Instagram", icon: "📸", color: "#e1306c" };
  if (url.includes("tiktok.com")) return { name: "TikTok", icon: "🎵", color: "#ff0050" };
  if (url.includes("facebook.com") || url.includes("fb.com")) return { name: "Facebook", icon: "👤", color: "#1877f2" };
  if (url.includes("threads.com") || url.includes("threads.net")) return { name: "Threads", icon: "🧵", color: "#333" };
  if (url.includes("t.me")) return { name: "Telegram", icon: "✈️", color: "#0088cc" };
  if (url.includes("snapchat.com")) return { name: "Snapchat", icon: "👻", color: "#fffc00" };
  if (url.includes("linkedin.com")) return { name: "LinkedIn", icon: "💼", color: "#0a66c2" };
  if (url.includes("reddit.com")) return { name: "Reddit", icon: "👽", color: "#ff4500" };
  if (url.includes("pinterest.com")) return { name: "Pinterest", icon: "📌", color: "#e60023" };
  if (url.includes("github.com")) return { name: "GitHub", icon: "🐙", color: "#333" };
  if (url.includes("bsky.app")) return { name: "Bluesky", icon: "🦋", color: "#0085ff" };
  return { name: "المنصة", icon: "🔗", color: "#666" };
}

function getEmbedUrl(url) {
  let ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) return { type: "iframe", src: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&mute=0` };

  let vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return { type: "iframe", src: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1` };

  if (url.includes("t.me")) {
    let tgMatch = url.match(/t\.me\/([^\/]+)\/(\d+)/);
    if (tgMatch) return { type: "iframe", src: `https://t.me/${tgMatch[1]}/${tgMatch[2]}?embed=1` };
  }

  return { type: "embed-social", src: url };
}

/* ============ عرض منشورات السوشيال (مع تشغيل تلقائي للفيديو) ============ */

function renderSocialPosts() {
  if (!socialPostsContainer) return;

  if (socialPosts.length === 0) {
    socialPostsContainer.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; color: #666; padding: 30px;">
        <p>لا توجد منشورات حالياً.</p>
      </div>`;
    return;
  }

  socialPostsContainer.innerHTML = socialPosts.map((post, index) => {
    const { name, icon, color } = detectContentPlatform(post.url);
    const title = post.title ? escapeHtml(post.title) : name;
    const embed = getEmbedUrl(post.url);

    // إذا كان فيديو قابل للتضمين المباشر (YouTube, Vimeo, Telegram)
    // → نعرض الفيديو مباشرة بدون زر تشغيل
    let mediaContent = "";
    if (embed.type === "iframe") {
      mediaContent = `
        <div style="width: 100%; aspect-ratio: 16/9; background: #000; border-radius: 10px; overflow: hidden;">
          <iframe src="${embed.src}"
                  style="width: 100%; height: 100%; border: none;"
                  frameborder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowfullscreen>
          </iframe>
        </div>`;
    } else {
      // منصات أخرى — عرض بواسطة social-embed (تلقائي أيضاً)
      mediaContent = `
        <div style="background: #0d1017; border-radius: 10px; padding: 10px; min-height: 180px;">
          <social-embed url="${escapeHtml(post.url)}" style="width: 100%;"></social-embed>
        </div>`;
    }

    return `
      <div style="background: linear-gradient(135deg, rgba(26, 29, 36, 0.95), rgba(15, 18, 28, 0.95)); border: 1px solid #2a2e38; border-radius: 16px; padding: 18px; display: flex; flex-direction: column; gap: 12px; transition: all 0.3s;"
           onmouseover="this.style.transform='translateY(-5px)'; this.style.borderColor='${color}';"
           onmouseout="this.style.transform='translateY(0)'; this.style.borderColor='#2a2e38';">

        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="display: inline-flex; align-items: center; gap: 8px; color: #fff; font-weight: 700; font-size: 0.9rem;">
            <span style="display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; background: ${color}22; border: 1px solid ${color}55; border-radius: 8px; font-size: 1rem;">${icon}</span>
            ${name}
          </span>
        </div>

        ${mediaContent}

        <div style="color: #fff; font-weight: 700; font-size: 0.95rem; line-height: 1.4;">
          ${title}
        </div>

        <a href="${escapeHtml(post.url)}" target="_blank" rel="noopener"
           style="display: block; background: ${color}; color: #fff; padding: 10px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 0.85rem; text-align: center;">
          ↗ فتح في ${name}
        </a>
      </div>`;
  }).join("");
}

/* ============ روابط المحتوى ============ */

function renderContentLinks() {
  if (!contentLinksGrid) return;
  const links = Array.isArray(allContentLinks) ? allContentLinks : [];
  if (links.length === 0) {
    contentLinksGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; color: #666; padding: 30px;">
        <p>لا توجد روابط حالياً.</p>
      </div>`;
    return;
  }
  contentLinksGrid.innerHTML = links.map((item, index) => {
    const { name, icon, color } = detectContentPlatform(item.url);
    const title = item.title ? escapeHtml(item.title) : name;
    const uniqueId = `content-${index}`;
    return `
      <div style="background: linear-gradient(135deg, rgba(26, 29, 36, 0.95), rgba(15, 18, 28, 0.95)); border: 1px solid #2a2e38; border-radius: 16px; padding: 18px; display: flex; flex-direction: column; gap: 12px; transition: all 0.3s;"
           onmouseover="this.style.transform='translateY(-5px)'; this.style.borderColor='${color}';"
           onmouseout="this.style.transform='translateY(0)'; this.style.borderColor='#2a2e38';">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="display: inline-flex; align-items: center; gap: 8px; color: #fff; font-weight: 700; font-size: 0.9rem;">
            <span style="display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; background: ${color}22; border: 1px solid ${color}55; border-radius: 8px; font-size: 1rem;">${icon}</span>
            ${name}
          </span>
        </div>
        <div id="${uniqueId}" style="background: #0d1017; border-radius: 10px; min-height: 180px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
          <div style="text-align: center; padding: 30px 20px; width: 100%;">
            <div style="font-size: 3rem; margin-bottom: 10px; opacity: 0.5;">${icon}</div>
            <p style="color: #888; font-size: 0.85rem; margin: 0;">اضغط زر التشغيل</p>
          </div>
        </div>
        <div style="color: #fff; font-weight: 700; font-size: 0.95rem;">${title}</div>
        <div style="display: flex; gap: 8px;">
          <button onclick="playContent('${uniqueId}', '${escapeHtml(item.url)}')"
                  style="flex: 1; background: linear-gradient(135deg, #7c3aed, #06b6d4); color: #fff; border: none; padding: 10px; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 0.85rem; font-family: inherit;">▶️ تشغيل</button>
          <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener"
             style="flex: 1; background: ${color}; color: #fff; padding: 10px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 0.85rem; text-align: center;">↗ فتح في ${name}</a>
        </div>
      </div>`;
  }).join("");
}

function playContent(containerId, url) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const embed = getEmbedUrl(url);
  if (embed.type === "iframe") {
    container.innerHTML = `<iframe src="${embed.src}" style="width:100%;height:100%;min-height:180px;border:none;border-radius:10px;" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    container.style.height = "200px";
    container.style.display = "block";
  } else if (embed.type === "embed-social") {
    container.innerHTML = `<social-embed url="${escapeHtml(url)}" style="width: 100%;"></social-embed>`;
  } else {
    window.open(url, '_blank', 'noopener');
  }
}

/* ============ الفلاتر ============ */

typeButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    typeButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    filterState.type = btn.dataset.type || "all";
    renderPosts();
  });
});

platformButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    platformButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    filterState.platform = btn.dataset.platform || "all";
    renderPosts();
  });
});

document.addEventListener("DOMContentLoaded", loadRemotePosts);