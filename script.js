/* ==========================================================
   SHOWGI249 — محرك عرض المحتوى
   ========================================================== */

const postsContainer = document.getElementById("posts");
const typeButtons = document.querySelectorAll(".filters button");
const platformButtons = document.querySelectorAll(".platform-filters button");

let allPosts = [];
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

/* ============ جلب البيانات ============ */

async function loadRemotePosts() {
  try {
    const res = await fetch("./content.json", {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    let raw = [];

    if (Array.isArray(data.posts)) {
      raw = data.posts;
    } else if (Array.isArray(data.youtube_videos)) {
      raw = data.youtube_videos.map(v => ({
        id: v.videoId,
        platform: "youtube",
        type: "video",
        title: v.title || "",
        text: v.description || "",
        url: `https://www.youtube.com/watch?v=${v.videoId}`,
        media: v.thumbnail,
        date: v.publishedAt,
      }));
    } else if (Array.isArray(data)) {
      raw = data;
    }

    allPosts = sortByDate(raw);
    console.log(`[SHOWGI249] تم تحميل ${allPosts.length} منشور`);
  } catch (err) {
    console.error("[SHOWGI249] فشل تحميل المحتوى:", err);
    allPosts = [];
  }

  renderPosts();
}

/* ============ العرض ============ */

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
        <p>جرّب تغيير الفلاتر أو انتظر المزامنة التلقائية للمحتوى.</p>
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
      ? `<div class="post-media">
           <a href="${url}" target="_blank" rel="noopener noreferrer">
             <img src="${escapeHtml(post.media)}" alt="${title || 'محتوى'}" loading="lazy">
           </a>
         </div>`
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