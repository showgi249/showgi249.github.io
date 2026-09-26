/* ==========================================================
   SHOWGI249 — محرك عرض المحتوى + Google Sheets API
   ========================================================== */

// ⚠️ استبدل هذا الرابط بالرابط الذي حصلت عليه من Google Apps Script
const API_URL = 'ضع_رابط_Google_Apps_Script_هنا';

const postsContainer = document.getElementById("posts");
const socialPostsContainer = document.getElementById("socialPostsGrid");
const typeButtons = document.querySelectorAll(".filters button");
const platformButtons = document.querySelectorAll(".platform-filters button");

let allPosts = [];
let socialPosts = [];
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

/* ============ تحميل المنشورات من Google Sheets ============ */

async function loadSocialPosts() {
  if (!API_URL || API_URL === 'ضع_رابط_Google_Apps_Script_هنا') {
    console.warn('[SHOWGI249] لم يتم تعيين API_URL بعد');
    socialPosts = [];
    renderSocialPosts();
    return;
  }

  try {
    const res = await fetch(API_URL);
    const data = await res.json();

    if (!data.success) throw new Error(data.error || 'فشل التحميل');

    socialPosts = data.posts || [];
    console.log(`[SHOWGI249] تم تحميل ${socialPosts.length} منشور`);
  } catch (err) {
    console.error('[SHOWGI249] فشل تحميل المنشورات:', err);
    socialPosts = [];
  }

  renderSocialPosts();
}

/* ============ معالجة إرسال النموذج ============ */

function setupFormHandler() {
  const form = document.getElementById('submissionForm');
  if (!form) return;

  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    if (!API_URL || API_URL === 'ضع_رابط_Google_Apps_Script_هنا') {
      alert('⚠️ لم يتم إعداد API_URL بعد. يرجى الاتصال بالمسؤول.');
      return;
    }

    const formData = new FormData(form);
    const payload = {
      name: formData.get('name'),
      email: formData.get('email'),
      url: formData.get('url'),
      title: formData.get('title') || ''
    };

    if (!payload.url || !payload.url.startsWith('http')) {
      alert('⚠️ يرجى إدخال رابط صحيح يبدأ بـ http.');
      return;
    }

    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = '⏳ جاري النشر...';
    btn.disabled = true;

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });

      const result = await res.json();

      if (result.success) {
        alert('✅ تم نشر منشورك بنجاح! شكراً لك يا ' + payload.name);
        form.reset();
        await loadSocialPosts();
        document.getElementById('social-posts').scrollIntoView({ behavior: 'smooth' });
      } else {
        alert('❌ حدث خطأ: ' + (result.error || 'غير معروف'));
      }
    } catch (err) {
      console.error('فشل الإرسال:', err);
      alert('❌ تعذر الاتصال بالخادم. حاول مرة أخرى.');
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  });
}

/* ============ عرض منشورات السوشيال ============ */

function renderSocialPosts() {
  if (!socialPostsContainer) return;

  if (socialPosts.length === 0) {
    socialPostsContainer.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; color: #666; padding: 30px;">
        <p>لا توجد منشورات حالياً. كن أول من يضيف!</p>
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

/* ============ جلب البيانات من content.json ============ */

async function loadRemotePosts() {
  try {
    const res = await fetch("./content.json", {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

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

    allPosts = sortByDate(allPosts);
  } catch (err) {
    console.error("[SHOWGI249] فشل تحميل المحتوى:", err);
    allPosts = [];
  }

  renderPosts();
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

document.addEventListener("DOMContentLoaded", () => {
  setupFormHandler();
  loadRemotePosts();
  loadSocialPosts();
});