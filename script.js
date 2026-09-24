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
   بيانات المحتوى
   ==========================================

   لاحقًا سيأتي هذا المحتوى تلقائيًا
   من Backend / APIs الخاصة بالمنصات.

   لا نضع API Keys هنا.
   ========================================== */

let posts = [];


/* ==========================================
   حالة الفلاتر
   ========================================== */

let activeType = "all";
let activePlatform = "all";


/* ==========================================
   تحميل المحتوى من Backend
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

    if (Array.isArray(data)) {

      posts = data;

    }

  } catch (error) {

    /*
      GitHub Pages حاليًا لا يملك Backend.

      لذلك الموقع يعمل طبيعيًا حتى يتم
      إنشاء Backend وربطه لاحقًا.
    */

    posts = [];

  }

  renderPosts();
}


/* ==========================================
  