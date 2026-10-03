/* ==========================================================
   SHOWGI249 — محرك عرض المحتوى + روابط المحتوى
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
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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
  try {
    return d.toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return d.toISOString().split("T")[0];
  }
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
  if (url.includes("youtube.com") || url.includes("youtu.be"))
    return { platform: "youtube", name: "YouTube", icon: "🎬" };
  if (url.includes("twitter.com") || url.includes("x.com"))
    return { platform: "x", name: "X (Twitter)", icon: "🐦" };
  if (url.includes("instagram.com"))
    return { platform: "instagram", name: "Instagram", icon: "📸" };
  if (url.includes("tiktok.com"))
    return { platform: "tiktok", name: "TikTok", icon: "🎵" };
  if (url.includes("facebook.com") || url.includes("fb.com"))
    return { platform: "facebook", name: "Facebook", icon: "👤" };
  if (url.includes("threads.com") || url.includes("threads.net"))
    return { platform: "threads", name: "Threads", icon: "🧵" };
  if (url.includes("bsky.app"))
    return { platform: "bluesky", name: "Bluesky", icon: "🦋" };
  return { platform: "unknown", name: "منشور", icon: "🔗" };
}

/* ============ جلب البيانات ============ */

async function loadRemotePosts() {
  try {
    const res = await fetch("./content.json", {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // محتوى مركز المحتوى
    if (Array.isArray(data.youtube_videos)) {
      allPosts = data.youtube_videos.map(v => ({
        id: v.videoId,
        platform: "youtube",
        type: "video",
        title: v.title || "",
        text: v.description || "",
        url: `https://www.youtube.com/watch?v=${v.videoId}`,
        media: v.thumbnail,
        date: v.publishedAt,
      }));
    } else if (Array.isArray(data.posts) && data.posts.length > 0 && data.posts[0].type) {
      allPosts = data.posts;
    } else {
      allPosts = [];
    }

    // منشورات السوشيال (بدون type)
    if (Array.isArray(data.posts)) {
      socialPosts = data.posts.filter(p => p.url && !p.type);
    }

    // روابط المحتوى
    if (Array.isArray(data.content_links)) {
      allContentLinks = data.content_links;
    } else {
      allContentLinks = [];
    }

    allPosts = sortByDate(allPosts);
    console.log(`[SHOWGI249] محتوى: ${allPosts.length} | منشورات: ${socialPosts.length} | روابط: ${allContentLinks.length}`);
  } catch (err) {
    console.error("[SHOWGI249] فشل تحميل المحتوى:", err);
    allPosts = [];
    socialPosts = [];
    allContentLinks = [];
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
      </div>
    `;
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
      </article>
    `;
  }).join("");
}

/* ============ عرض منشورات السوشيال ============ */

function renderSocialPosts() {
  if (!socialPostsContainer) return;

  if (socialPosts.length === 0) {
    socialPostsContainer.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; color: #666; padding: 30px;">
        <p>لا توجد منشورات حالياً. كن أول من يقترح منشوراً!</p>
      </div>
    `;
    return;
  }

  socialPostsContainer.innerHTML = socialPosts.map(post => {
    const { name, icon } = detectPlatform(post.url);
    return `
      <div style="background: #1a1d24; border: 1px solid #2a2e38; border-radius: 12px; padding: 15px; display: flex; flex-direction: column; gap: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: #fff; font-weight: bold; font-size: 0.9rem;">${icon} ${name}</span>
        </div>
        ${post.title ? `<p style="color: #ddd; font-size: 0.9rem; margin: 0;">${escapeHtml(post.title)}</p>` : ""}
        ${post.name ? `<p style="color: #666; font-size: 0.75rem; margin: 0;">بواسطة: ${escapeHtml(post.name)}</p>` : ""}
        <social-embed url="${escapeHtml(post.url)}" style="width: 100%; border-radius: 8px; overflow: hidden;"></social-embed>
        <a href="${escapeHtml(post.url)}" target="_blank" rel="noopener" style="color: #7c3aed; text-decoration: none; font-size: 0.85rem; text-align: center; word-break: break-all;">🔗 فتح في ${name}</a>
      </div>
    `;
  }).join("");
}

/* ============ روابط المحتوى ============ */

function detectContentPlatform(url) {
  if (!url) return { name: "منصة", icon: "🔗", color: "#666" };
  if (url.includes("youtube.com") || url.includes("youtu.be"))
    return { name: "YouTube", icon: "🎬", color: "#ff0000" };
  if (url.includes("twitter.com") || url.includes("x.com"))
    return { name: "X (Twitter)", icon: "🐦", color: "#1d9bf0" };
  if (url.includes("instagram.com"))
    return { name: "Instagram", icon: "📸", color: "#e1306c" };
  if (url.includes("tiktok.com"))
    return { name: "TikTok", icon: "🎵", color: "#ff0050" };
  if (url.includes("facebook.com") || url.includes("fb.com"))
    return { name: "Facebook", icon: "👤", color: "#1877f2" };
  return { name: "المنصة", icon: "🔗", color: "#666" };
}

function getEmbedUrl(url) {
  let ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) return { type: "iframe", src: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1` };

  let vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return { type: "iframe", src: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1` };

  if (url.includes("x.com") || url.includes("twitter.com"))
    return { type: "embed-social", src: url };
  if (url.includes("tiktok.com"))
    return { type: "embed-social", src: url };
  if (url.includes("instagram.com"))
    return { type: "embed-social", src: url };
  if (url.includes("facebook.com"))
    return { type: "embed-social", src: url };

  return { type: "link", src: url };
}

function renderContentLinks() {
  if (!contentLinksGrid) return;

  const links = Array.isArray(allContentLinks) ? allContentLinks : [];

  if (links.length === 0) {
    contentLinksGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; color: #666; padding: 30px;">
        <p>لا توجد روابط حالياً. أضف روابطك في content.json</p>
      </div>
    `;
    return;
  }

  contentLinksGrid.innerHTML = links.map((item, index) => {
    const { name, icon, color } = detectContentPlatform(item.url);
    const title = item.title ? escapeHtml(item.title) : name;
    const uniqueId = `content-${index}`;

    return `
      <div style="background: linear-gradient(135deg, rgba(26, 29, 36, 0.95), rgba(15, 18, 28, 0.95)); border: 1px solid #2a2e38; border-radius: 16px; padding: 18px; display: flex; flex-direction: column; gap: 12px; transition: all 0.3s; position: relative; overflow: hidden;"
           onmouseover="this.style.transform='translateY(-5px)'; this.style.borderColor='${color}'; this.style.boxShadow='0 15px 40px rgba(0,0,0,0.3)';"
           onmouseout="this.style.transform='translateY(0)'; this.style.borderColor='#2a2e38'; this.style.boxShadow='none';">

        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="display: inline-flex; align-items: center; gap: 8px; color: #fff; font-weight: 700; font-size: 0.9rem;">
            <span style="display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; background: ${color}22; border: 1px solid ${color}55; border-radius: 8px; font-size: 1rem;">${icon}</span>
            ${name}
          </span>
          <span style="background: ${color}22; color: ${color}; font-size: 0.7rem; padding: 3px 10px; border-radius: 20px; font-weight: 700;">جديد</span>
        </div>

        <div id="${uniqueId}" style="background: #0d1017; border-radius: 10px; min-height: 180px; display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative;">
          <div style="text-align: center; padding: 30px 20px; width: 100%;">
            <div style="font-size: 3rem; margin-bottom: 10px; opacity: 0.5;">${icon}</div>
            <p style="color: #888; font-size: 0.85rem; margin: 0;">اضغط زر التشغيل لعرض المحتوى</p>
          </div>
        </div>

        <div style="color: #fff; font-weight: 700; font-size: 0.95rem; line-height: 1.4;">
          ${title}
        </div>

        <div style="display: flex; gap: 8px; margin-top: auto;">
          <button onclick="playContent('${uniqueId}', '${escapeHtml(item.url)}')"
                  style="flex: 1; background: linear-gradient(135deg, #7c3aed, #06b6d4); color: #fff; border: none; padding: 10px; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 0.85rem; font-family: inherit; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
            ▶️ تشغيل
          </button>
          <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener"
             style="flex: 1; background: ${color}; color: #fff; border: none; padding: 10px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 0.85rem; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
            ↗ فتح في ${name}
          </a>
        </div>
      </div>
    `;
  }).join("");
}

function playContent(containerId, url) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const embed = getEmbedUrl(url);

  if (embed.type === "iframe") {
    container.innerHTML = `
      <iframe src="${embed.src}"
              style="width: 100%; height: 100%; min-height: 180px; border: none; border-radius: 10px;"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen>
      </iframe>
    `;
    container.style.height = "200px";
    container.style.display = "block";
  } else if (embed.type === "embed-social") {
    container.innerHTML = `
      <social-embed url="${escapeHtml(url)}" style="width: 100%;"></social-embed>
    `;
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

/* ============ التشغيل ============ */

document.addEventListener("DOMContentLoaded", loadRemotePosts);