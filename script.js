/* ==========================================
   SHOWGI249 — CONTENT CENTER
   Front-end content engine
   ========================================== */

const postsContainer = document.getElementById("posts");

const typeButtons = document.querySelectorAll(
  ".filters button"
);

const platformButtons = document.querySelectorAll(
  ".platform-filters button"
);


/* ==========================================
   إعدادات الحسابات
   ========================================== */

const socialAccounts = {

  instagram: {
    name: "Instagram",
    username: "@showgi249",
    url: "https://www.instagram.com/showgi249"
  },

  tiktok: {
    name: "TikTok",
    username: "@showgi249",
    url: "https://www.tiktok.com/@showgi249"
  },

  youtube: {
    name: "YouTube",
    username: "@showgi249",
    url: "https://youtube.com/@showgi249"
  },

  facebook: {
    name: "Facebook",
    username: "showgi249",
    url: "https://www.facebook.com/showgi249"
  },

  threads: {
    name: "Threads",
    username: "@showgi249",
    url: "https://www.threads.com/@showgi249"
  },

  snapchat: {
    name: "Snapchat",
    username: "showgi249",
    url: "https://www.snapchat.com/add/showgi249"
  },

  x: {
    name: "X",
    username: "@showgi249",
    url: "https://x.com/showgi249"
  },

  telegram: {
    name: "Telegram",
    username: "@showgi249",
    url: "https://t.me/showgi249"
  }

};


/* ==========================================
   بيانات المحتوى وحالة الفلاتر
   ========================================== */

let posts = [];
let activeType = "all";
let activePlatform = "all";


/* ==========================================
   تحميل المحتوى من Backend / content.json
   ========================================== */

async function loadRemotePosts() {

  try {

    const response = await fetch(
      "./content.json",
      {
        method: "GET",
        headers: {
          "Accept": "application/json"
        }
      }
    );

    if (!response.ok) {
      throw new Error("API unavailable");
    }

    const data = await response.json();
    let fetchedPosts = [];

    // قراءة فيديوهات يوتيوب وتحويلها لشكل المنشورات
    if (data.youtube_videos && Array.isArray(data.youtube_videos)) {
      const ytPosts = data.youtube_videos.map(video => ({
        id: video.videoId,
        type: "video",
        platform: "youtube",
        title: video.title || "فيديو يوتيوب",
        text: video.description || "",
        url: `https://www.youtube.com/watch?v=${video.videoId}`,
        media: video.thumbnail,
        date: video.publishedAt
      }));
      fetchedPosts = fetchedPosts.concat(ytPosts);
    } else if (Array.isArray(data)) {
      fetchedPosts = data;
    }

    posts = fetchedPosts;

  } catch (error) {

    console.error("خطأ في تحميل ملف البيانات:", error);
    posts = [];

  }

  renderPosts();
}


/* ==========================================
   عرض المنشورات (Render Posts)
   ========================================== */

function renderPosts() {

  if (!postsContainer) return;

  const filtered = posts.filter(post => {
    const matchesType = activeType === "all" || post.type === activeType;
    const matchesPlatform = activePlatform === "all" || post.platform === activePlatform;
    return matchesType && matchesPlatform;
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

  postsContainer.innerHTML = filtered.map(post => `
    <article class="post-card" data-platform="${post.platform}">
      ${post.media ? `
        <div class="post-media">
          <a href="${post.url}" target="_blank" rel="noopener">
            <img src="${post.media}" alt="${post.title || 'صورة المحتوى'}" loading="lazy">
          </a>
        </div>
      ` : ''}
      <div class="post-content">
        <div class="post-meta">
          <span class="platform-badge ${post.platform}">${post.platform.toUpperCase()}</span>
          ${post.date ? `<time>${new Date(post.date).toLocaleDateString("ar-EG")}</time>` : ''}
        </div>
        ${post.title ? `<h3><a href="${post.url}" target="_blank" rel="noopener">${post.title}</a></h3>` : ''}
        ${post.text ? `<p>${post.text.length > 120 ? post.text.substring(0, 120) + '...' : post.text}</p>` : ''}
        <a href="${post.url}" target="_blank" rel="noopener" class="post-link">مشاهدة المحتوى ←</a>
      </div>
    </article>
  `).join("");

}


/* ==========================================
   إدارة الأحداث والتفاعل مع الفلاتر
   ========================================== */

typeButtons.forEach(button => {
  button.addEventListener("click", () => {
    typeButtons.forEach(b => b.classList.remove("active"));
    button.classList.add("active");
    activeType = button.getAttribute("data-type") || "all";
    renderPosts();
  });
});

platformButtons.forEach(button => {
  button.addEventListener("click", () => {
    platformButtons.forEach(b => b.classList.remove("active"));
    button.classList.add("active");
    activePlatform = button.getAttribute("data-platform") || "all";
    renderPosts();
  });
});


/* ==========================================
   التشغيل المباشر عند فتح الصفحة
   ========================================== */

document.addEventListener("DOMContentLoaded", () => {
  loadRemotePosts();
});
