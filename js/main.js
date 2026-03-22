document.addEventListener("DOMContentLoaded", () => {
  let profileData = {};
  let activeFilters = new Set();

  Promise.all([
    fetch("data/profile.json").then((r) => r.json()),
    fetch("data/projects.json").then((r) => r.json()),
  ])
    .then(([profile, projects]) => {
      profileData = profile;
      renderSidebar(profile, projects);
      renderHero(profile);
      renderProjects(projects);
      initThemeToggle();
      initFilters(projects);
      initMobileDrawer();
    })
    .catch((err) => {
      console.error("Failed to load data:", err);
      document.getElementById("project-list").innerHTML =
        '<p style="color:var(--color-text-secondary)">Failed to load project data. Make sure data/projects.json and data/profile.json exist.</p>';
    });

  /* ===== Render sidebar ===== */
  function renderSidebar(profile, projects) {
    // Collect all unique tags from projects for filter buttons
    const allTags = [
      ...new Set(projects.flatMap((p) => p.tags.map((t) => t))),
    ];

    const sidebarHTML = buildSidebarContent(profile, allTags);
    document.getElementById("sidebar-content").innerHTML = sidebarHTML;

    // Mobile brand
    document.getElementById("mobile-brand").textContent = profile.name;
  }

  function buildSidebarContent(profile, allTags) {
    const linksHTML = profile.links
      .map(
        (link) => `
      <a href="${escapeAttr(link.url)}" target="_blank" rel="noopener noreferrer" class="connect-link">
        <span class="material-symbols-outlined">${escapeHTML(link.icon)}</span>
        <span>${escapeHTML(link.label)}</span>
      </a>`
      )
      .join("");

    const filterTagsHTML = allTags
      .map(
        (tag) => `
      <button class="filter-tag" data-tech="${escapeAttr(tag)}">${escapeHTML(tag)}</button>`
      )
      .join("");

    return `
      <div class="sidebar-top">
        <div>
          <div class="profile-header">
            <div class="profile-image">
              <img src="${escapeAttr(profile.profileImage)}" alt="${escapeAttr(profile.name)}" onerror="this.style.display='none'"/>
            </div>
            <button class="theme-toggle" id="theme-toggle" aria-label="Toggle theme">
              <span class="material-symbols-outlined">dark_mode</span>
            </button>
          </div>
          <h1 class="profile-name font-headline">${escapeHTML(profile.name)}</h1>
          <p class="profile-title font-label">${escapeHTML(profile.title)}</p>
          <p class="profile-bio">${escapeHTML(profile.bio)}</p>
        </div>

        <div class="filter-section">
          <div class="filter-header">
            <div class="filter-label font-label">
              <span>Stack Filtering</span>
              <span class="filter-indicator" id="filter-indicator"></span>
            </div>
            <button class="clear-filters font-label" id="clear-filters">Clear All</button>
          </div>
          <div class="filter-tags" id="tech-filters">
            ${filterTagsHTML}
          </div>
        </div>

        <div class="connect-section">
          <h3 class="font-label">Connect</h3>
          ${linksHTML}
        </div>
      </div>

      <div class="sidebar-bottom">
        <a href="mailto:${escapeAttr(profile.email)}" class="contact-cta">
          <span class="contact-cta-label">Want to get in touch?</span>
          <div class="contact-cta-content">
            <span class="material-symbols-outlined" style="font-size:1.125rem">alternate_email</span>
            <span>Contact me here</span>
          </div>
        </a>
        <div class="sidebar-footer font-label">
          <span>${escapeHTML(profile.location)}</span>
          <span class="dot"></span>
          <span>${escapeHTML(profile.email)}</span>
        </div>
      </div>`;
  }

  /* ===== Render hero ===== */
  function renderHero(profile) {
    document.getElementById("hero-badge").textContent = profile.heroBadge;
    document.getElementById("hero-tagline").textContent = profile.heroTagline;
    document.getElementById("hero-subtitle").textContent = profile.heroSubtitle;
  }

  /* ===== Render projects ===== */
  function renderProjects(projects) {
    const list = document.getElementById("project-list");
    list.innerHTML = projects
      .map((proj) => {
        const tagsHTML = proj.tags
          .map((t) => `<span class="project-tag">${escapeHTML(t)}</span>`)
          .join("");

        const techStack = proj.tags.map((t) => t.toLowerCase()).join(",");

        const imageHTML = proj.image
          ? `<div class="details-image"><img src="${escapeAttr(proj.image)}" alt="${escapeAttr(proj.title)} detail"/></div>`
          : "";

        const bulletsHTML =
          proj.bullets && proj.bullets.length
            ? `<ul class="details-bullets font-label">${proj.bullets.map((b) => `<li>${escapeHTML(b)}</li>`).join("")}</ul>`
            : "";

        return `
        <article class="project-card" data-tech-stack="${escapeAttr(techStack)}">
          <div class="project-grid">
            <div class="project-meta">
              <span class="project-id font-label">${escapeHTML(proj.id)} / ${escapeHTML(proj.category)}</span>
              <h3 class="project-title font-headline">${escapeHTML(proj.title)}</h3>
              <div class="project-tags">${tagsHTML}</div>
            </div>
            <div class="project-body">
              <p class="project-description">${escapeHTML(proj.description)}</p>
              <details class="project-details">
                <summary>
                  <span>Technical Breakdown</span>
                  <span class="material-symbols-outlined expand-icon">expand_more</span>
                </summary>
                <div class="details-content">
                  ${imageHTML}
                  <p class="details-text">${escapeHTML(proj.longDescription)}</p>
                  ${bulletsHTML}
                </div>
              </details>
            </div>
          </div>
        </article>`;
      })
      .join("");
  }

  /* ===== Theme toggle ===== */
  function initThemeToggle() {
    const html = document.documentElement;

    // Load saved preference
    if (localStorage.getItem("theme") === "dark") {
      html.classList.add("dark");
    }
    updateAllThemeIcons();

    // Delegate clicks on any theme toggle button
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".theme-toggle, #theme-toggle-mobile");
      if (!btn) return;
      html.classList.toggle("dark");
      localStorage.setItem(
        "theme",
        html.classList.contains("dark") ? "dark" : "light"
      );
      updateAllThemeIcons();
    });
  }

  function updateAllThemeIcons() {
    const isDark = document.documentElement.classList.contains("dark");
    const iconName = isDark ? "light_mode" : "dark_mode";
    document.querySelectorAll(".theme-toggle span, #theme-toggle-mobile span").forEach((el) => {
      el.textContent = iconName;
    });
  }

  /* ===== Filtering ===== */
  function initFilters() {
    document.addEventListener("click", (e) => {
      // Filter tag click
      const filterBtn = e.target.closest(".filter-tag");
      if (filterBtn) {
        const tech = filterBtn.getAttribute("data-tech");
        if (activeFilters.has(tech)) {
          activeFilters.delete(tech);
        } else {
          activeFilters.add(tech);
        }
        applyFilters();
        return;
      }

      // Clear all
      if (e.target.closest(".clear-filters, .filter-status-clear")) {
        activeFilters.clear();
        applyFilters();
      }
    });
  }

  function applyFilters() {
    const cards = document.querySelectorAll(".project-card");
    const indicator = document.getElementById("filter-indicator");
    const statusBar = document.getElementById("filter-status");
    const drawerIndicator = document.querySelector(
      "#drawer-mirror .filter-indicator"
    );

    if (activeFilters.size === 0) {
      cards.forEach((c) => c.classList.remove("hidden-filtered"));
      if (indicator) indicator.classList.remove("active");
      if (drawerIndicator) drawerIndicator.classList.remove("active");
      if (statusBar) statusBar.classList.remove("active");
    } else {
      if (indicator) indicator.classList.add("active");
      if (drawerIndicator) drawerIndicator.classList.add("active");

      let visibleCount = 0;
      cards.forEach((card) => {
        const stack = card.getAttribute("data-tech-stack").split(",");
        const match = Array.from(activeFilters).some((f) =>
          stack.includes(f.toLowerCase())
        );
        card.classList.toggle("hidden-filtered", !match);
        if (match) visibleCount++;
      });

      if (statusBar) {
        statusBar.classList.add("active");
        const filtersText = Array.from(activeFilters).join(", ");
        statusBar.querySelector(".filter-status-text").textContent =
          `Showing ${visibleCount} of ${cards.length} projects matching: ${filtersText}`;
      }
    }

    // Sync active state on all filter tag buttons (sidebar + drawer)
    document.querySelectorAll(".filter-tag").forEach((btn) => {
      const tech = btn.getAttribute("data-tech");
      btn.classList.toggle("active", activeFilters.has(tech));
    });
  }

  /* ===== Mobile Drawer ===== */
  function initMobileDrawer() {
    const menuBtn = document.getElementById("mobile-menu-btn");
    const drawer = document.getElementById("mobile-drawer");
    const overlay = document.getElementById("drawer-overlay");
    const mirror = document.getElementById("drawer-mirror");
    const sidebarContent = document.getElementById("sidebar-content");

    menuBtn.addEventListener("click", () => {
      // Clone sidebar content into drawer
      mirror.innerHTML = sidebarContent.innerHTML;
      // Sync filter states
      mirror.querySelectorAll(".filter-tag").forEach((btn) => {
        if (activeFilters.has(btn.getAttribute("data-tech"))) {
          btn.classList.add("active");
        }
      });
      drawer.classList.add("open");
    });

    overlay.addEventListener("click", () => {
      drawer.classList.remove("open");
    });
  }

  /* ===== Helpers ===== */
  function escapeHTML(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function escapeAttr(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
});
