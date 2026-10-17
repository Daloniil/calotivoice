(function () {
  var header = document.querySelector("[data-header]");
  var navToggle = document.querySelector("[data-nav-toggle]");
  var navList = document.querySelector("[data-nav-list]");
  var waitlist = document.querySelector("[data-waitlist]");
  var waitlistStatus = document.querySelector("[data-waitlist-status]");
  var yearEl = document.querySelector("[data-year]");

  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  if (navToggle && navList) {
    navToggle.addEventListener("click", function () {
      var open = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", open ? "false" : "true");
      navList.classList.toggle("is-open", !open);
    });

    navList.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        navToggle.setAttribute("aria-expanded", "false");
        navList.classList.remove("is-open");
      });
    });
  }

  if (waitlist && waitlistStatus) {
    waitlist.addEventListener("submit", function (event) {
      event.preventDefault();
      waitlistStatus.hidden = false;
      waitlistStatus.classList.remove("is-error");
      waitlistStatus.textContent = "Thanks — we'll reach out before launch.";
    });
  }

  function animateStat(el) {
    var key = el.getAttribute("data-stat");
    if (!key || key === "inf") {
      return;
    }
    var target = parseInt(key, 10);
    if (Number.isNaN(target)) {
      return;
    }
    var start = 0;
    var duration = 900;
    var startTime = null;
    function tick(now) {
      if (!startTime) {
        startTime = now;
      }
      var t = Math.min(1, (now - startTime) / duration);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = String(Math.round(start + (target - start) * eased));
      if (t < 1) {
        requestAnimationFrame(tick);
      }
    }
    el.textContent = "0";
    requestAnimationFrame(tick);
  }

  var revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length && "IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            var stat = entry.target.querySelector("[data-stat]");
            if (stat && !stat.dataset.animated) {
              stat.dataset.animated = "1";
              animateStat(stat);
            }
            if (entry.target.matches("[data-stat]") && !entry.target.dataset.animated) {
              entry.target.dataset.animated = "1";
              animateStat(entry.target);
            }
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    revealEls.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }
})();
