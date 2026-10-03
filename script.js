/* ==========================================================
   SHOWGI249 — محرك عرض المحتوى (المنصات القابلة للتشغيل فقط)
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

/* ============ المنصات المدعومة للتشغيل التلقائي ============ */
const PLAYABLE_PLATFORMS = [
  { key: "youtube", name: "YouTube", icon: "🎬", color: "#ff0000",
    match: (url) => url.includes("youtube.com") || url.includes("youtu.be") },
  { key: "vimeo", name: "Vimeo", icon: "🎥", color: "#1ab7ea",
    match: (url) => url.includes("vimeo.com") },
  { key: "telegram", name: "Telegram", icon: "✈️", color: "#0088cc",
    match: (url) => url.includes("t.me") || url.includes("telegram") },
  { key: "dailymotion", name: "Dailymotion", icon: "📺", color: "#0066dc",
    match: (url) => url.includes("dailymotion.com") || url.includes("dai.ly") }
];

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

/* ============ كشف المنصة (فقط القابلة للتشغيل) ============ */

function detectPlayablePlatform(url) {
  if (!url) return null;
  for (const p of PLAYABLE_PLATFORMS) {
    if (p.match(url)) return p;
  }
  return null;
}

/* ============ توليد رابط التضمين ============ */

function getEmbedUrl(url) {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) {
    return {
      type: "iframe",
      src: `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`
    };
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return {
      type: "iframe",
      src: `https://player.vimeo.com/video/${vimeoMatch[1]}?byline=0&portrait=0`
    };
  }

  // Telegram
  if (url.includes("t.me")) {
    const tgMatch = url.match(/t\.me\/([^\/]+)\/(\d+)/);
    if (tgMatch) {
      return {
        type: "iframe",
        src: `https://t.me/${tgMatch[1]}/${tgMatch[2]}?embed=1&mode=tme`
      };
    }
    return { type: "link", src: url };
  }

  // Dailymotion
  const dmMatch = url.match(/dailymotion\.com\/video\/([a-zA-Z0-9]+)/) ||
                  url.match(/dai\.ly\/([a-zA-Z0-9]+)/);
  if (dmMatch) {
    return {
      type: "iframe",
      src: `https://www.dailymotion.com/embed/video/${dmMatch[1]}`
    };
  }

  return { type: "link", src: url };
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

    // منشوراتي: فقط المنصات القابلة للتشغيل
    if (Array.isArray(data.posts)) {
      socialPosts = data.posts.filter(p => p.url && !p.type && detectPlayablePlatform(p.url));
    }

    // روابط المحتوى: فقط المنصات القابلة للتشغيل
    if (Array.isArray(data.content_links)) {
      allContentLinks = data.content_links.filter(p => p.url && detectPlayablePlatform(p.url));
    } else {
      allContentLinks = [];
    }

    allPosts = sortByDate(allPosts);
    console.log(`[SHOWGI249] محتوى: ${allPosts.length} | منشورات قابلة للتشغيل: ${socialPosts.length} | روابط قابلة للتشغيل: ${allContentLinks.length}`);
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
        <p>سيظهر المحتوى هنا تلقائياً</p>
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

/* ============ عرض منشوراتي (فقط القابلة للتشغيل) ============ */

function renderSocialPosts() {
  if (!socialPostsContainer) return;

  if (socialPosts.length === 0) {
    socialPostsContainer.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; color: #666; padding: 30px;">
        <p>لا توجد فيديوهات قابلة للتشغيل حالياً.</p>
        <p style="font-size: 0.85rem; margin-top: 8px;">يدعم: YouTube · Vimeo · Telegram · Dailymotion</p>
      </div>`;
    return;
  }

  socialPostsContainer.innerHTML = socialPosts.map((post) => {
    const platform = detectPlayablePlatform(post.url);
    if (!platform) return "";
    const { name, icon, color } = platform;
    const title = post.title ? escapeHtml(post.title) : name;
    const embed = getEmbedUrl(post.url);

    const mediaContent = embed.type === "iframe"
      ? `<div style="width: 100%; aspect-ratio: 16/9; background: #000; border-radius: 10px; overflow: hidden;">
           <iframe src="${embed.src}"
                   style="width: 100%; height: 100%; border: none;"
                   frameborder="0"
                   loading="lazy"
                   allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                   allowfullscreen>
           </iframe>
         </div>`
      : `<a href="${escapeHtml(post.url)}" target="_blank" rel="noopener" style="display: block; padding: 30px; text-align: center; color: #94a3b8; background: #0d1017; border-radius: 10px;">🔗 مشاهدة على ${name}</a>`;

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

/* ============ عرض روابط المحتوى (فقط القابلة للتشغيل) ============ */

function renderContentLinks() {
  if (!contentLinksGrid) return;
  const links = Array.isArray(allContentLinks) ? allContentLinks : [];

  if (links.length === 0) {
    contentLinksGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; color: #666; padding: 30px;">
        <p>لا توجد روابط حالياً.</p>
        <p style="font-size: 0.85rem; margin-top: 8px;">يدعم: YouTube · Vimeo · Telegram · Dailymotion</p>
      </div>`;
    return;
  }

  contentLinksGrid.innerHTML = links.map((item) => {
    const platform = detectPlayablePlatform(item.url);
    if (!platform) return "";
    const { name, icon, color } = platform;
    const title = item.title ? escapeHtml(item.title) : name;
    const embed = getEmbedUrl(item.url);

    const mediaContent = embed.type === "iframe"
      ? `<div style="width: 100%; aspect-ratio: 16/9; background: #000; border-radius: 10px; overflow: hidden;">
           <iframe src="${embed.src}"
                   style="width: 100%; height: 100%; border: none;"
                   frameborder="0"
                   loading="lazy"
                   allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                   allowfullscreen>
           </iframe>
         </div>`
      : `<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener" style="display: block; padding: 30px; text-align: center; color: #94a3b8; background: #0d1017; border-radius: 10px;">🔗 مشاهدة على ${name}</a>`;

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

        <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener"
           style="display: block; background: ${color}; color: #fff; padding: 10px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 0.85rem; text-align: center;">
          ↗ فتح في ${name}
        </a>
      </div>`;
  }).join("");
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