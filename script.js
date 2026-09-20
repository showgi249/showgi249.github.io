/* =========================
   SHOWGI249
   Main JavaScript
========================= */

document.addEventListener("DOMContentLoaded", () => {

  /* =========================
     Mobile Navigation
  ========================== */

  const nav = document.querySelector(".nav");
  const menu = document.querySelector(".menu-btn");
  const navLinks = document.querySelector(".nav-links");

  if (menu && navLinks) {

    menu.addEventListener("click", () => {

      const isOpen = navLinks.classList.toggle("open");

      menu.setAttribute(
        "aria-expanded",
        String(isOpen)
      );

      menu.setAttribute(
        "aria-label",
        isOpen ? "إغلاق القائمة" : "فتح القائمة"
      );

    });


    /* Close menu after clicking a link */

    navLinks
      .querySelectorAll("a")
      .forEach(link => {

        link.addEventListener("click", () => {

          navLinks.classList.remove("open");

          menu.setAttribute(
            "aria-expanded",
            "false"
          );

          menu.setAttribute(
            "aria-label",
            "فتح القائمة"
          );

        });

      });

  }


  /* =========================
     Reveal Animation
  ========================== */

  const revealElements =
    document.querySelectorAll(".reveal");


  if ("IntersectionObserver" in window) {

    const observer =
      new IntersectionObserver(
        entries => {

          entries.forEach(entry => {

            if (entry.isIntersecting) {

              entry.target.classList.add("show");

              observer.unobserve(
                entry.target
              );

            }

          });

        },
        {
          threshold: 0.12
        }
      );


    revealElements.forEach(element => {
      observer.observe(element);
    });

  } else {

    /* Fallback for old browsers */

    revealElements.forEach(element => {
      element.classList.add("show");
    });

  }


  /* =========================
     Reading Progress
  ========================== */

  const progress =
    document.querySelector(".progress");


  function updateProgress() {

    if (!progress) {
      return;
    }

    const documentHeight =
      document.documentElement.scrollHeight;

    const windowHeight =
      window.innerHeight;

    const scrollableHeight =
      documentHeight - windowHeight;


    if (scrollableHeight <= 0) {

      progress.style.width = "100%";

      return;

    }


    const percentage =
      (window.scrollY / scrollableHeight) * 100;


    progress.style.width =
      Math.min(100, Math.max(0, percentage)) + "%";

  }


  window.addEventListener(
    "scroll",
    updateProgress,
    { passive: true }
  );

  window.addEventListener(
    "resize",
    updateProgress
  );

  updateProgress();


  /* =========================
     Current Year
  ========================== */

  const year =
    document.getElementById("year");


  if (year) {

    year.textContent =
      new Date().getFullYear();

  }


  /* =========================
     Close Mobile Menu
     When clicking outside
  ========================== */

  document.addEventListener(
    "click",
    event => {

      if (
        !nav ||
        !menu ||
        !navLinks
      ) {
        return;
      }


      const clickedInsideNav =
        nav.contains(event.target);


      if (
        !clickedInsideNav &&
        navLinks.classList.contains("open")
      ) {

        navLinks.classList.remove("open");

        menu.setAttribute(
          "aria-expanded",
          "false"
        );

        menu.setAttribute(
          "aria-label",
          "فتح القائمة"
        );

      }

    }
  );

});