document.addEventListener("DOMContentLoaded", function () {
  // 0. Load shared header & footer components
  loadComponents();

  // 1. Sticky Navbar scroll handler
  const navbar = document.querySelector(".navbar");

  window.addEventListener("scroll", function () {
    if (navbar) {
      if (window.scrollY > 50) navbar.classList.add("navbar-scrolled");
      else navbar.classList.remove("navbar-scrolled");
    }

    const scrollToTopBtn = document.getElementById("scrollToTop");
    if (scrollToTopBtn) {
      scrollToTopBtn.style.display = window.scrollY > 300 ? "flex" : "none";
    }
  });

  // 3. Highlight Active Navigation Item
  highlightActiveLink();

  // 4. Counter Animation (for statistics sections)
  initializeCounters();

  // 5. Contact Form Validator
  initializeForms();

  // 6. Portfolio Navigation Filter
  initializePortfolioFilters();

  // 7. Intercept empty/dummy links and redirect to 404
  document.addEventListener("click", function (event) {
    if (window.location.pathname.includes("404.html")) {
      return;
    }

    const link = event.target.closest("a");
    if (!link) return;

    const href = link.getAttribute("href");

    if (href === "" || href === "#" || !href) {
      event.preventDefault();
      const isRoot = !window.location.pathname.includes("/pages/");
      const errorPagePath = isRoot ? "404.html" : "../404.html";
      window.location.href = errorPagePath;
    }
  });
});

/**
 * Loads header and footer HTML components into placeholder elements.
 * Resolves paths based on data-base attribute on the placeholder.
 */
function loadComponents() {
  const headerEl = document.getElementById("header-placeholder");
  const footerEl = document.getElementById("footer-placeholder");

  if (!headerEl && !footerEl) return;

  // Determine if we're at root or inside pages/
  const isRoot = !window.location.pathname.includes("/pages/");
  const base = isRoot ? "" : "../";
  const pages = isRoot ? "pages/" : "";
  const componentBase = isRoot ? "pages/components/" : "components/";

  function injectComponent(el, file) {
    fetch(componentBase + file)
      .then((r) => r.text())
      .then((html) => {
        el.outerHTML = html
          .replace(/\{\{BASE\}\}/g, base)
          .replace(/\{\{PAGES\}\}/g, pages);
        if (file === "header.html") {
          highlightActiveLink();
          updateHeaderForLoggedInUser(pages);
        }
        if (file === "footer.html") {
          const scrollToTopBtn = document.getElementById("scrollToTop");
          if (scrollToTopBtn) {
            scrollToTopBtn.addEventListener("click", function () {
              window.scrollTo({ top: 0, behavior: "smooth" });
            });
          }
        }
      });
  }

  if (headerEl) injectComponent(headerEl, "header.html");
  if (footerEl) injectComponent(footerEl, "footer.html");
}

/**
 * Highlights the active link in the navigation menu based on current path
 */
function highlightActiveLink() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll(".navbar-nav .nav-link");

  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;

    // Strip folder path to get pure filename (e.g. index.html, about.html)
    const filename = href.substring(href.lastIndexOf("/") + 1);
    const currentFilename = currentPath.substring(
      currentPath.lastIndexOf("/") + 1,
    );

    // Normalize matching (defaulting empty paths or folders to index.html)
    const isHome = currentFilename === "" || currentFilename === "index.html";
    const linkIsHome = filename === "index.html" || href === "index.html";

    if (isHome && linkIsHome) {
      link.classList.add("active");
    } else if (
      !isHome &&
      currentFilename === filename &&
      filename !== "index.html"
    ) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

/**
 * Animates statistical numbers counting up when visible on viewport
 */
function initializeCounters() {
  const counterElements = document.querySelectorAll(".counter-value");

  if (counterElements.length === 0) return;

  const counterObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = entry.target;
          const countTo = parseInt(target.getAttribute("data-target"), 10);
          let count = 0;
          const duration = 2000; // 2 seconds
          const increment = Math.ceil(countTo / (duration / 16)); // ~60fps

          const timer = setInterval(() => {
            count += increment;
            if (count >= countTo) {
              target.innerText = countTo;
              clearInterval(timer);
            } else {
              target.innerText = count;
            }
          }, 16);

          observer.unobserve(target); // Only animate once
        }
      });
    },
    { threshold: 0.5 },
  );

  counterElements.forEach((el) => counterObserver.observe(el));
}

/**
 * Validates form submission inputs for clean client-side feedback
 */
function initializeForms() {
  // 1. Keypress constraints (block invalid keys as they are typed)
  document.addEventListener("keypress", function (event) {
    const target = event.target;
    if (target.matches('input[data-type="fullname"]')) {
      const key = event.key;
      // Allow key only if it's a letter or space.
      if (key.length === 1 && !/^[a-zA-Z\s]$/.test(key)) {
        event.preventDefault();
      }
    } else if (target.matches('input[data-type="phone"]')) {
      const key = event.key;
      // Allow key only if it's a digit 0-9
      if (key.length === 1 && !/^[0-9]$/.test(key)) {
        event.preventDefault();
      }
    }
  });

  // 2. Input constraints (sanitize immediately on change/paste)
  document.addEventListener("input", function (event) {
    const target = event.target;
    if (target.matches('input[data-type="fullname"]')) {
      const originalValue = target.value;
      const sanitizedValue = originalValue.replace(/[^a-zA-Z\s]/g, "");
      if (originalValue !== sanitizedValue) {
        target.value = sanitizedValue;
      }
    } else if (target.matches('input[data-type="phone"]')) {
      const originalValue = target.value;
      const sanitizedValue = originalValue.replace(/[^0-9]/g, "");
      if (originalValue !== sanitizedValue) {
        target.value = sanitizedValue;
      }
    }

    // Also handle bootstrap "is-invalid" class removal on key/input
    if (target.matches("input, textarea, select")) {
      if (target.type === "checkbox") {
        if (target.checked) {
          target.classList.remove("is-invalid");
        }
      } else {
        if (target.value.trim()) {
          target.classList.remove("is-invalid");
        }
      }
    }
  });

  // 3. Form submit delegation
  document.addEventListener("submit", function (event) {
    const form = event.target.closest("form");
    if (!form) return;

    let isValid = true;
    const requiredInputs = form.querySelectorAll("[required]");

    requiredInputs.forEach((input) => {
      if (input.type === "checkbox") {
        if (!input.checked) {
          isValid = false;
          input.classList.add("is-invalid");
        } else {
          input.classList.remove("is-invalid");
        }
      } else {
        if (!input.value.trim()) {
          isValid = false;
          input.classList.add("is-invalid");
        } else {
          input.classList.remove("is-invalid");

          // Simple email pattern check
          if (input.type === "email") {
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(input.value.trim())) {
              isValid = false;
              input.classList.add("is-invalid");
            }
          }
        }
      }
    });

    if (!isValid) {
      event.preventDefault();
      event.stopPropagation();
    } else {
      // Check if this form should redirect to 404
      if (form.hasAttribute("data-redirect-404")) {
        event.preventDefault();
        const isRoot = !window.location.pathname.includes("/pages/");
        const redirectUrl = isRoot ? "404.html" : "../404.html";
        window.location.href = redirectUrl;
      } else {
        // Prevent actually navigating on dummy form action
        const formAction = form.getAttribute("action");
        if (formAction === "#") {
          event.preventDefault();
          form.reset();
        }
      }
    }
  });
}

/**
 * Handles filtering of project cards by category
 */
function initializePortfolioFilters() {
  const filterButtons = document.querySelectorAll(
    ".portfolio-filter-nav .filter-btn",
  );
  const portfolioItems = document.querySelectorAll(".portfolio-item");

  if (filterButtons.length === 0 || portfolioItems.length === 0) return;

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Toggle active class on buttons
      filterButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      const filterValue = button.getAttribute("data-filter");

      portfolioItems.forEach((item) => {
        // Clear any running timeouts to prevent glitching
        if (item.dataset.timeoutId) {
          clearTimeout(Number(item.dataset.timeoutId));
          item.removeAttribute("data-timeout-id");
        }

        if (
          filterValue === "all" ||
          item.getAttribute("data-category") === filterValue
        ) {
          item.classList.remove("d-none");
          // Allow display change to register, then trigger transition
          requestAnimationFrame(() => {
            item.style.opacity = "1";
            item.style.transform = "scale(1)";
          });
        } else {
          item.style.opacity = "0";
          item.style.transform = "scale(0.95)";
          const timeoutId = setTimeout(() => {
            item.classList.add("d-none");
          }, 300); // 300ms matches the CSS transition
          item.dataset.timeoutId = String(timeoutId);
        }
      });
    });
  });
}

/**
 * Updates the header navigation button for logged-in sessions.
 */
function updateHeaderForLoggedInUser(pages) {
  const userRole = sessionStorage.getItem("userRole");
  const userEmail = sessionStorage.getItem("userEmail");
  if (userRole && userEmail) {
    const btnTalk = document.querySelector(".btn-talk");
    if (btnTalk) {
      btnTalk.setAttribute("href", pages + "dashboard.html");
      btnTalk.innerHTML =
        '<i class="fa-solid fa-gauge-high me-1"></i> Dashboard';
    }
  }
}
