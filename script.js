/* =========================
   SHOWGI249
   Main JavaScript
   + Plausible Analytics
========================= */

document.addEventListener("DOMContentLoaded", () => {

  /* =========================
     Plausible Helper
  ========================== */

  function track(eventName, props = {}, interactive = true) {

    if (typeof window.plausible !== "function") {
      return;
    }

    window.plausible(eventName, {
      props: props,
      interactive: interactive
    });

  }


  /* =========================
     Mobile Navigation
  ========================== */

  const nav = document.querySelector(".nav");
  const menu = document.querySelector(".menu-btn");
  const navLinks = document.querySelector(".nav-links");

  if (menu && navLinks) {

    menu.addEventListener("click", () => {

      const isOpen =
        navLinks.classList.toggle("open");

      menu.setAttribute(
        "aria-expanded",
        String(isOpen)
      );

      menu.setAttribute(
        "aria-label",
        isOpen
          ? "إغلاق القائمة"
          : "فتح القائمة"
      );


      track(
        isOpen
          ? "Menu Open"
          : "Menu Close"
      );

    });


    /* Close menu after clicking a link */

    navLinks
      .querySelectorAll("a")
      .forEach(link => {

        link.addEventListener("click", () => {

          const destination =
            link.getAttribute("href") || "";

          const text =
            link.textContent.trim();

          track("Navigation Click", {
            link: text,
            destination: destination
          });

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
      Math.min(
        100,
        Math.max(0, percentage)
      ) + "%";

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
     Scroll Depth Tracking
  ========================== */

  const scrollMilestones = [
    25,
    50,
    75,
    90,
    100
  ];

  const reachedMilestones =
    new Set();


  function trackScrollDepth() {

    const scrollTop =
      window.scrollY;

    const documentHeight =
      document.documentElement.scrollHeight;

    const windowHeight =
      window.innerHeight;

    const scrollableHeight =
      documentHeight - windowHeight;


    if (scrollableHeight <= 0) {
      return;
    }


    const percentage =
      Math.round(
        (scrollTop / scrollableHeight) * 100
      );


    scrollMilestones.forEach(
      milestone => {

        if (
          percentage >= milestone &&
          !reachedMilestones.has(milestone)
        ) {

          reachedMilestones.add(
            milestone
          );

          track(
            "Scroll Depth",
            {
              percentage: String(milestone)
            },
            false
          );

        }

      }
    );

  }


  window.addEventListener(
    "scroll",
    trackScrollDepth,
    { passive: true }
  );


  /* =========================
     Section View Tracking
  ========================== */

  const sections =
    document.querySelectorAll(
      "main section[id]"
    );

  const viewedSections =
    new Set();


  if ("IntersectionObserver" in window) {

    const sectionObserver =
      new IntersectionObserver(
        entries => {

          entries.forEach(entry => {

            if (
              entry.isIntersecting &&
              !viewedSections.has(
                entry.target.id
              )
            ) {

              const sectionId =
                entry.target.id;

              viewedSections.add(
                sectionId
              );


              track(
                "Section View",
                {
                  section: sectionId
                },
                false
              );

            }

          });

        },
        {
          threshold: 0.35
        }
      );


    sections.forEach(section => {
      sectionObserver.observe(section);
    });

  }


  /* =========================
     Project Tracking
  ========================== */

  document
    .querySelectorAll("#work .project")
    .forEach((project, index) => {

      project.addEventListener(
        "click",
        () => {

          const title =
            project
              .querySelector("h3")
              ?.textContent
              .trim()
              || `Project ${index + 1}`;


          track(
            "Project Click",
            {
              project: title
            }
          );

        }
      );

    });


  /* =========================
     Idea Tracking
  ========================== */

  document
    .querySelectorAll("#ideas .idea")
    .forEach((idea, index) => {

      idea.addEventListener(
        "click",
        () => {

          const title =
            idea
              .querySelector("h3")
              ?.textContent
              .trim()
              || `Idea ${index + 1}`;


          track(
            "Idea Interaction",
            {
              idea: title
            }
          );

        }
      );

    });


  /* =========================
     Social Links
  ========================== */

  const socialDomains = {
    "instagram.com": "Instagram",
    "x.com": "X",
    "twitter.com": "X",
    "t.me": "Telegram",
    "threads.com": "Threads",
    "youtube.com": "YouTube",
    "snapchat.com": "Snapchat"
  };


  document
    .querySelectorAll('a[href]')
    .forEach(link => {

      link.addEventListener(
        "click",
        () => {

          const href =
            link.href || "";

          let url;

          try {
            url = new URL(href);
          } catch {
            return;
          }


          const hostname =
            url.hostname
              .replace("www.", "");


          const platform =
            socialDomains[hostname];


          if (platform) {

            track(
              "Social Click",
              {
                platform: platform
              }
            );

          }

        }
      );

    });


  /* =========================
     Email Tracking
  ========================== */

  document
    .querySelectorAll(
      'a[href^="mailto:"]'
    )
    .forEach(link => {

      link.addEventListener(
        "click",
        () => {

          track(
            "Email Click",
            {
              method: "mailto"
            }
          );

        }
      );

    });


  /* =========================
     CTA / Button Tracking
  ========================== */

  document
    .querySelectorAll(
      "a.btn, button"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const label =
            button.textContent
              .trim()
              .replace(/\s+/g, " ");


          if (label) {

            track(
              "Button Click",
              {
                button: label
              }
            );

          }

        }
      );

    });


  /* =========================
     Time Engagement
  ========================== */

  const timeMilestones = [
    10,
    30,
    60,
    180
  ];

  const reachedTimes =
    new Set();


  timeMilestones.forEach(
    seconds => {

      setTimeout(() => {

        if (
          !reachedTimes.has(seconds)
        ) {

          reachedTimes.add(seconds);

          track(
            "Engagement Time",
            {
              seconds: String(seconds)
            },
            false
          );

        }

      }, seconds * 1000);

    }
  );


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
     When Clicking Outside
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

        navLinks.classList.remove(
          "open"
        );

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