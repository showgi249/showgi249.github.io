const nav = document.querySelector(".nav");
const menu = document.querySelector(".menu-btn");

if (menu && nav) {
  menu.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menu.setAttribute("aria-expanded", open);
  });

  document.querySelectorAll(".nav-links a").forEach(a => {
    a.addEventListener("click", () => {
      nav.classList.remove("open");
      menu.setAttribute("aria-expanded", "false");
    });
  });
}


// ظهور العناصر أثناء التمرير
const io = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
        io.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.12
  }
);

document.querySelectorAll(".reveal").forEach(el => {
  io.observe(el);
});


// شريط التقدم
const progress = document.querySelector(".progress");

if (progress) {
  window.addEventListener("scroll", () => {
    const scrollHeight =
      document.documentElement.scrollHeight - window.innerHeight;

    if (scrollHeight > 0) {
      const scrollPercent =
        (window.scrollY / scrollHeight) * 100;

      progress.style.width = scrollPercent + "%";
    }
  });
}


// السنة الحالية
const year = document.getElementById("year");

if (year) {
  year.textContent = new Date().getFullYear();
}