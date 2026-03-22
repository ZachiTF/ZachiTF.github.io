const THEME_KEY = "theme";
const LANG_KEY = "portfolio-lang";

const DATA_FILES = {
  en: {
    profile: "data/profile.en.json",
    projects: "data/projects.en.json",
  },
  de: {
    profile: "data/profile.de.json",
    projects: "data/projects.de.json",
  },
};

const UI_TEXT = {
  en: {
    stackFiltering: "Stack Filtering",
    clearAll: "Clear All",
    connect: "Connect",
    contactPrompt: "Want to get in touch?",
    contactCta: "Contact me here",
    technicalBreakdown: "Technical Breakdown",
    filterStatus: (visible, total, filters) =>
      `Showing ${visible} of ${total} projects matching: ${filters}`,
    clearStatus: "Clear",
    loadError:
      "Failed to load project data. Make sure language JSON files exist in the data folder.",
    langTitle: "Switch language",
    nextLang: "Deutsch",
  },
  de: {
    stackFiltering: "Technologie-Filter",
    clearAll: "Alle löschen",
    connect: "Kontakt",
    contactPrompt: "Lust auf Austausch?",
    contactCta: "Hier kontaktieren",
    technicalBreakdown: "Technischer Einblick",
    filterStatus: (visible, total, filters) =>
      `Zeige ${visible} von ${total} Projekten passend zu: ${filters}`,
    clearStatus: "Zurücksetzen",
    loadError:
      "Projektdaten konnten nicht geladen werden. Stelle sicher, dass die Sprach-JSON-Dateien im data-Ordner vorhanden sind.",
    langTitle: "Sprache wechseln",
    nextLang: "English",
  },
};

const state = {
  lang: "en",
  profile: null,
  projects: [],
  activeFilters: new Set(),
};

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  bindGlobalEvents();
  loadAndRender(getSavedLang());
});

function bindGlobalEvents() {
  document.addEventListener("click", (e) => {
    const themeBtn = e.target.closest(".theme-toggle");
    if (themeBtn) {
      toggleTheme();
      return;
    }

    const langBtn = e.target.closest(".lang-toggle");
    if (langBtn) {
      toggleLanguage();
      return;
    }

    const filterBtn = e.target.closest(".filter-tag");
    if (filterBtn) {
      const tech = filterBtn.getAttribute("data-tech");
      if (state.activeFilters.has(tech)) {
        state.activeFilters.delete(tech);
      } else {
        state.activeFilters.add(tech);
      }
      applyFilters();
      return;
    }

    if (e.target.closest(".clear-filters, .filter-status-clear")) {
      state.activeFilters.clear();
      applyFilters();
      return;
    }

    if (e.target.closest("#mobile-menu-btn")) {
      openMobileDrawer();
      return;
    }

    if (e.target.closest("#drawer-overlay")) {
      closeMobileDrawer();
    }
  });
}

function getSavedLang() {
  const stored = localStorage.getItem(LANG_KEY);
  return stored && DATA_FILES[stored] ? stored : "en";
}

function toggleLanguage() {
  const nextLang = state.lang === "en" ? "de" : "en";
  loadAndRender(nextLang);
}

async function loadAndRender(lang) {
  const files = DATA_FILES[lang] || DATA_FILES.en;
  const t = UI_TEXT[lang] || UI_TEXT.en;

  try {
    const [profileResponse, projectsResponse] = await Promise.all([
      fetch(files.profile),
      fetch(files.projects),
    ]);

    const [profile, projects] = await Promise.all([
      profileResponse.json(),
      projectsResponse.json(),
    ]);

    state.lang = lang;
    state.profile = profile;
    state.projects = projects;

    localStorage.setItem(LANG_KEY, lang);
    document.documentElement.lang = lang;
    document.title = profile.name || "Portfolio";

    renderSidebar(profile, projects, t);
    renderHero(profile);
    renderProjects(projects, t);
    updateStaticLanguageLabels(t);
    updateThemeIcon();
    updateLanguageButtons(t);
    applyFilters();
    closeMobileDrawer();
  } catch (err) {
    console.error("Failed to load data:", err);
    const projectList = document.getElementById("project-list");
    if (projectList) {
      projectList.innerHTML = `<p style="color:var(--color-text-secondary)">${escapeHTML(
        t.loadError
      )}</p>`;
    }
  }
}

function renderSidebar(profile, projects, t) {
  const allTags = [...new Set(projects.flatMap((project) => project.tags || []))];
  const sidebarHTML = buildSidebarContent(profile, allTags, t);

  const sidebar = document.getElementById("sidebar-content");
  if (sidebar) {
    sidebar.innerHTML = sidebarHTML;
  }

  const mobileBrand = document.getElementById("mobile-brand");
  if (mobileBrand) {
    mobileBrand.textContent = profile.name || "Portfolio";
  }
}

function buildSidebarContent(profile, allTags, t) {
  const linksHTML = (profile.links || [])
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
            <img src="${escapeAttr(profile.profileImage)}" alt="${escapeAttr(
    profile.name
  )}" onerror="this.style.display='none'"/>
          </div>
          <button class="theme-toggle" aria-label="Toggle theme">
            <span class="material-symbols-outlined">dark_mode</span>
          </button>
          <button class="lang-toggle" aria-label="${escapeAttr(t.langTitle)}" title="${escapeAttr(
    t.nextLang
  )}">
            <span class="material-symbols-outlined">translate</span>
          </button>
        </div>
        <h1 class="profile-name font-headline">${escapeHTML(profile.name)}</h1>
        <p class="profile-title font-label">${escapeHTML(profile.title)}</p>
        <p class="profile-bio">${escapeHTML(profile.bio)}</p>
      </div>

      <div class="filter-section">
        <div class="filter-header">
          <div class="filter-label font-label">
            <span>${escapeHTML(t.stackFiltering)}</span>
            <span class="filter-indicator" id="filter-indicator"></span>
          </div>
          <button class="clear-filters font-label" id="clear-filters">${escapeHTML(
            t.clearAll
          )}</button>
        </div>
        <div class="filter-tags" id="tech-filters">
          ${filterTagsHTML}
        </div>
      </div>

      <div class="connect-section">
        <h3 class="font-label">${escapeHTML(t.connect)}</h3>
        ${linksHTML}
      </div>
    </div>

    <div class="sidebar-bottom">
      <a href="mailto:${escapeAttr(profile.email)}" class="contact-cta">
        <span class="contact-cta-label">${escapeHTML(t.contactPrompt)}</span>
        <div class="contact-cta-content">
          <span class="material-symbols-outlined" style="font-size:1.125rem">alternate_email</span>
          <span>${escapeHTML(t.contactCta)}</span>
        </div>
      </a>
      <div class="sidebar-footer font-label">
        <span>${escapeHTML(profile.location)}</span>
        <span class="dot"></span>
        <span>${escapeHTML(profile.email)}</span>
      </div>
    </div>`;
}

function renderHero(profile) {
  const badge = document.getElementById("hero-badge");
  const tagline = document.getElementById("hero-tagline");
  const subtitle = document.getElementById("hero-subtitle");

  if (badge) badge.textContent = profile.heroBadge || "";
  if (tagline) tagline.textContent = profile.heroTagline || "";
  if (subtitle) subtitle.textContent = profile.heroSubtitle || "";
}

function renderProjects(projects, t) {
  const list = document.getElementById("project-list");
  if (!list) return;

  list.innerHTML = projects
    .map((project) => {
      const tagsHTML = (project.tags || [])
        .map((tag) => `<span class="project-tag">${escapeHTML(tag)}</span>`)
        .join("");

      const techStack = (project.tags || []).map((tag) => tag.toLowerCase()).join(",");

      const imageHTML = project.image
        ? `<div class="details-image"><img src="${escapeAttr(project.image)}" alt="${escapeAttr(
            project.title
          )} detail"/></div>`
        : "";

      const bulletsHTML =
        project.bullets && project.bullets.length
          ? `<ul class="details-bullets font-label">${project.bullets
              .map((bullet) => `<li>${escapeHTML(bullet)}</li>`)
              .join("")}</ul>`
          : "";

      return `
        <article class="project-card" data-tech-stack="${escapeAttr(techStack)}">
          <div class="project-grid">
            <div class="project-meta">
              <span class="project-id font-label">${escapeHTML(project.id)} / ${escapeHTML(
        project.category
      )}</span>
              <h3 class="project-title font-headline">${escapeHTML(project.title)}</h3>
              <div class="project-tags">${tagsHTML}</div>
            </div>
            <div class="project-body">
              <p class="project-description">${escapeHTML(project.description)}</p>
              <details class="project-details">
                <summary>
                  <span>${escapeHTML(t.technicalBreakdown)}</span>
                  <span class="material-symbols-outlined expand-icon">expand_more</span>
                </summary>
                <div class="details-content">
                  ${imageHTML}
                  <p class="details-text">${escapeHTML(project.longDescription)}</p>
                  ${bulletsHTML}
                </div>
              </details>
            </div>
          </div>
        </article>`;
    })
    .join("");
}

function updateStaticLanguageLabels(t) {
  const clearStatus = document.querySelector(".filter-status-clear");
  if (clearStatus) {
    clearStatus.textContent = t.clearStatus;
  }
}

function updateLanguageButtons(t) {
  document.querySelectorAll(".lang-toggle").forEach((button) => {
    button.setAttribute("aria-label", t.langTitle);
    button.setAttribute("title", t.nextLang);
    const icon = button.querySelector("span");
    if (icon) {
      icon.textContent = "translate";
    }
  });
}

function applyFilters() {
  const cards = document.querySelectorAll(".project-card");
  const indicator = document.getElementById("filter-indicator");
  const statusBar = document.getElementById("filter-status");
  const drawerIndicator = document.querySelector("#drawer-mirror .filter-indicator");

  if (state.activeFilters.size === 0) {
    cards.forEach((card) => card.classList.remove("hidden-filtered"));
    if (indicator) indicator.classList.remove("active");
    if (drawerIndicator) drawerIndicator.classList.remove("active");
    if (statusBar) statusBar.classList.remove("active");
  } else {
    if (indicator) indicator.classList.add("active");
    if (drawerIndicator) drawerIndicator.classList.add("active");

    let visibleCount = 0;
    cards.forEach((card) => {
      const stack = (card.getAttribute("data-tech-stack") || "").split(",");
      const matches = Array.from(state.activeFilters).some((filter) =>
        stack.includes(filter.toLowerCase())
      );
      card.classList.toggle("hidden-filtered", !matches);
      if (matches) visibleCount += 1;
    });

    if (statusBar) {
      const t = UI_TEXT[state.lang] || UI_TEXT.en;
      const filtersText = Array.from(state.activeFilters).join(", ");
      statusBar.classList.add("active");
      const statusText = statusBar.querySelector(".filter-status-text");
      if (statusText) {
        statusText.textContent = t.filterStatus(visibleCount, cards.length, filtersText);
      }
    }
  }

  document.querySelectorAll(".filter-tag").forEach((button) => {
    const tech = button.getAttribute("data-tech");
    button.classList.toggle("active", state.activeFilters.has(tech));
  });
}

function openMobileDrawer() {
  const drawer = document.getElementById("mobile-drawer");
  const mirror = document.getElementById("drawer-mirror");
  const sidebarContent = document.getElementById("sidebar-content");
  if (!drawer || !mirror || !sidebarContent) return;

  mirror.innerHTML = sidebarContent.innerHTML;
  mirror.querySelectorAll(".filter-tag").forEach((button) => {
    const tech = button.getAttribute("data-tech");
    if (state.activeFilters.has(tech)) {
      button.classList.add("active");
    }
  });

  updateLanguageButtons(UI_TEXT[state.lang] || UI_TEXT.en);
  updateThemeIcon();
  drawer.classList.add("open");
}

function closeMobileDrawer() {
  const drawer = document.getElementById("mobile-drawer");
  if (drawer) {
    drawer.classList.remove("open");
  }
}

function initTheme() {
  if (localStorage.getItem(THEME_KEY) === "dark") {
    document.documentElement.classList.add("dark");
  }
  updateThemeIcon();
}

function toggleTheme() {
  const html = document.documentElement;
  html.classList.toggle("dark");
  localStorage.setItem(THEME_KEY, html.classList.contains("dark") ? "dark" : "light");
  updateThemeIcon();
}

function updateThemeIcon() {
  const isDark = document.documentElement.classList.contains("dark");
  const iconName = isDark ? "light_mode" : "dark_mode";
  document.querySelectorAll(".theme-toggle span").forEach((icon) => {
    icon.textContent = iconName;
  });
}

function escapeHTML(str) {
  if (str === null || str === undefined) return "";
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(String(str)));
  return div.innerHTML;
}

function escapeAttr(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
