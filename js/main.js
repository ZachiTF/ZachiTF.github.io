const THEME_KEY = "theme";
const LANG_KEY = "portfolio-lang";
const TAXONOMY_FILE = "data/skill-taxonomy.json";

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
    stackFiltering: "Skill Groups",
    clearAll: "Clear All",
    connect: "Connect",
    contactPrompt: "Want to get in touch?",
    contactCta: "Contact me here",
    technicalBreakdown: "Technical Breakdown",
    filterStatus: (visible, total, filters) =>
      `Showing ${visible} of ${total} projects matching groups: ${filters}`,
    clearStatus: "Clear",
    loadError:
      "Failed to load project data. Make sure language JSON files and skill-taxonomy.json exist in the data folder.",
    langTitle: "Switch language",
    nextLang: "Deutsch",
    lastEditedAt: "Last edited",
  },
  de: {
    stackFiltering: "Skill-Gruppen",
    clearAll: "Alle löschen",
    connect: "Kontakt",
    contactPrompt: "Lust auf Austausch?",
    contactCta: "Hier kontaktieren",
    technicalBreakdown: "Technischer Einblick",
    filterStatus: (visible, total, filters) =>
      `Zeige ${visible} von ${total} Projekten passend zu Gruppen: ${filters}`,
    clearStatus: "Zurücksetzen",
    loadError:
      "Projektdaten konnten nicht geladen werden. Stelle sicher, dass die Sprach-JSON-Dateien und skill-taxonomy.json im data-Ordner vorhanden sind.",
    langTitle: "Sprache wechseln",
    nextLang: "English",
    lastEditedAt: "Zuletzt bearbeitet",
  },
};

const state = {
  lang: "en",
  profile: null,
  projects: [],
  taxonomy: null,
  activeFilters: new Set(),
};

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  bindGlobalEvents();
  setFooterYear();
  loadAndRender(getSavedLang());
  window.addEventListener("resize", updateSidebarScrollability);
});

function setFooterYear() {
  const yearEl = document.getElementById("footer-year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }
}

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
      const groupId = filterBtn.getAttribute("data-group");
      if (!groupId) return;

      if (state.activeFilters.has(groupId)) {
        state.activeFilters.delete(groupId);
      } else {
        state.activeFilters.add(groupId);
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
      return;
    }

    const expandIcon = e.target.closest(".expand-icon");
    if (expandIcon) {
      const card = expandIcon.closest(".project-card");
      if (card) {
        card.classList.toggle("open");
      }
      return;
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

async function loadTaxonomy() {
  if (state.taxonomy) return state.taxonomy;
  const response = await fetch(TAXONOMY_FILE);
  const taxonomy = await response.json();
  state.taxonomy = taxonomy;
  return taxonomy;
}

async function loadAndRender(lang) {
  const files = DATA_FILES[lang] || DATA_FILES.en;
  const t = UI_TEXT[lang] || UI_TEXT.en;

  try {
    const taxonomyPromise = loadTaxonomy();
    const [profileResponse, projectsResponse, taxonomy] = await Promise.all([
      fetch(files.profile),
      fetch(files.projects),
      taxonomyPromise,
    ]);

    const [profile, projects] = await Promise.all([
      profileResponse.json(),
      projectsResponse.json(),
    ]);

    state.lang = lang;
    state.profile = profile;
    state.projects = projects;
    state.taxonomy = taxonomy;

    localStorage.setItem(LANG_KEY, lang);
    document.documentElement.lang = lang;
    document.title = profile.name || "Portfolio";

    renderSidebar(profile, projects, taxonomy, t, lang);
    renderHero(profile);
    renderProjects(projects, taxonomy, t);
    updateStaticLanguageLabels(t);
    updateThemeIcon();
    updateLanguageButtons(t);
    applyFilters();
    closeMobileDrawer();
  } catch (err) {
    console.error("Failed to load data:", err);
    const projectList = document.getElementById("project-list");
    if (projectList) {
      projectList.innerHTML = `<p class="load-error">${escapeHTML(
        t.loadError
      )}</p>`;
    }
  }
}

function renderSidebar(profile, projects, taxonomy, t, lang) {
  const groups = collectAvailableGroups(projects, taxonomy, lang);
  const sidebarHTML = buildSidebarContent(profile, groups, t);

  const sidebar = document.getElementById("sidebar-content");
  if (sidebar) {
    sidebar.innerHTML = sidebarHTML;
  }

  const mobileBrand = document.getElementById("mobile-brand");
  if (mobileBrand) {
    mobileBrand.textContent = profile.name || "Portfolio";
  }

  requestAnimationFrame(updateSidebarScrollability);
}

function collectAvailableGroups(projects, taxonomy, lang) {
  const usedGroupIds = new Set();

  projects.forEach((project) => {
    (project.tags || []).forEach((tag) => {
      usedGroupIds.add(resolveGroupId(tag, taxonomy));
    });
  });

  const order = taxonomy.groupOrder || Object.keys(taxonomy.groups || {});
  return order
    .filter((groupId) => usedGroupIds.has(groupId) && taxonomy.groups?.[groupId])
    .map((groupId) => {
      const group = taxonomy.groups[groupId];
      return {
        id: groupId,
        label: group.label?.[lang] || group.label?.en || groupId,
        cssClass: group.cssClass || "",
      };
    });
}

function buildSidebarContent(profile, groups, t) {
  const linksHTML = (profile.links || [])
    .map(
      (link) => `
      <a href="${escapeAttr(link.url)}" target="_blank" rel="noopener noreferrer" class="connect-link">
        <span class="material-symbols-outlined">${escapeHTML(link.icon)}</span>
        <span>${escapeHTML(link.label)}</span>
      </a>`
    )
    .join("");

  const filterTagsHTML = groups
    .map(
      (group) => `
      <button class="filter-tag ${escapeAttr(group.cssClass)}" data-group="${escapeAttr(group.id)}">${escapeHTML(group.label)}</button>`
    )
    .join("");

  const lastEditedAt = formatLastEdited(profile.lastEditedAt, state.lang);

  return `
    <div class="sidebar-top">
      <div>
        <div class="profile-header">
          <div class="profile-image">
            <img src="${escapeAttr(profile.profileImage)}" alt="${escapeAttr(
    profile.name
  )}" onerror="this.style.display='none'"/>
          </div>
          <div class="profile-info">
            <div class="profile-controls">
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
          </div>
        </div>
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
          <span class="material-symbols-outlined contact-cta-icon">alternate_email</span>
          <span>${escapeHTML(t.contactCta)}</span>
        </div>
      </a>
      <div class="sidebar-footer font-label">
        <span>${escapeHTML(profile.location)}</span>
        ${lastEditedAt ? `<span class="dot"></span><span>${escapeHTML(`${t.lastEditedAt} ${lastEditedAt}`)}</span>` : ""}
      </div>
    </div>`;
}

function formatLastEdited(isoDate, lang) {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  const locale = lang === "de" ? "de-DE" : "en-US";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function updateSidebarScrollability() {
  const targets = [
    document.getElementById("sidebar-content"),
    document.getElementById("drawer-mirror"),
  ];

  targets.forEach((container) => {
    if (!container) return;
    const canScroll = container.scrollHeight > container.clientHeight + 1;
    container.classList.toggle("is-scrollable", canScroll);
  });
}

function renderHero(profile) {
  const badge = document.getElementById("hero-badge");
  const tagline = document.getElementById("hero-tagline");
  const subtitle = document.getElementById("hero-subtitle");

  if (badge) badge.textContent = profile.heroBadge || "";
  if (tagline) tagline.textContent = profile.heroTagline || "";
  if (subtitle) subtitle.textContent = profile.heroSubtitle || "";
}

function renderProjects(projects, taxonomy) {
  const list = document.getElementById("project-list");
  if (!list) return;

  list.innerHTML = projects
    .map((project) => {
      const groupIds = getProjectGroupIds(project, taxonomy);
      const groupStack = groupIds.join(",");

      const tagsHTML = (project.tags || [])
        .map((tag) => {
          const groupId = resolveGroupId(tag, taxonomy);
          const cssClass = taxonomy.groups?.[groupId]?.cssClass || "";
          return `<span class="project-tag ${escapeAttr(cssClass)}">${escapeHTML(tag)}</span>`;
        })
        .join("");

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

      const detailLinksHTML =
        Array.isArray(project.links) && project.links.length
          ? `<div class="details-links">${project.links
              .map(
                (link) =>
                  `<a href="${escapeAttr(link.url)}" target="_blank" rel="noopener noreferrer" class="details-link">
                    <span class="material-symbols-outlined">open_in_new</span>
                    <span>${escapeHTML(link.label)}</span>
                  </a>`
              )
              .join("")}</div>`
          : "";

      return `
        <article class="project-card" data-group-stack="${escapeAttr(groupStack)}">
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
              <div class="project-expand">
                <div class="details-content">
                  ${imageHTML}
                  <p class="details-text">${escapeHTML(project.longDescription)}</p>
                  ${bulletsHTML}
                  ${detailLinksHTML}
                </div>
              </div>
            </div>
          </div>
          <span class="material-symbols-outlined expand-icon" tabindex="0" role="button" aria-label="Expand/collapse project details">expand_more</span>
        </article>`;
    })
    .join("");
}

function getProjectGroupIds(project, taxonomy) {
  const ids = new Set();
  (project.tags || []).forEach((tag) => ids.add(resolveGroupId(tag, taxonomy)));
  return Array.from(ids);
}

function normalizeSkillLabel(skill) {
  return String(skill || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function resolveGroupId(skill, taxonomy) {
  const normalized = normalizeSkillLabel(skill);
  const groupId = taxonomy.skillToGroup?.[normalized];
  if (groupId && taxonomy.groups?.[groupId]) {
    return groupId;
  }
  return taxonomy.fallbackGroup && taxonomy.groups?.[taxonomy.fallbackGroup]
    ? taxonomy.fallbackGroup
    : Object.keys(taxonomy.groups || {})[0] || "";
}

function getFilterLabels() {
  if (!state.taxonomy) return [];
  return Array.from(state.activeFilters)
    .map((groupId) => {
      const group = state.taxonomy.groups?.[groupId];
      if (!group) return null;
      return group.label?.[state.lang] || group.label?.en || groupId;
    })
    .filter(Boolean);
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
      const stack = (card.getAttribute("data-group-stack") || "").split(",");
      const matches = Array.from(state.activeFilters).some((filter) =>
        stack.includes(filter)
      );
      card.classList.toggle("hidden-filtered", !matches);
      if (matches) visibleCount += 1;
    });

    if (statusBar) {
      const t = UI_TEXT[state.lang] || UI_TEXT.en;
      const filtersText = getFilterLabels().join(", ");
      statusBar.classList.add("active");
      const statusText = statusBar.querySelector(".filter-status-text");
      if (statusText) {
        statusText.textContent = t.filterStatus(visibleCount, cards.length, filtersText);
      }
    }
  }

  document.querySelectorAll(".filter-tag").forEach((button) => {
    const groupId = button.getAttribute("data-group");
    button.classList.toggle("active", state.activeFilters.has(groupId));
  });
}

function openMobileDrawer() {
  const drawer = document.getElementById("mobile-drawer");
  const mirror = document.getElementById("drawer-mirror");
  const sidebarContent = document.getElementById("sidebar-content");
  if (!drawer || !mirror || !sidebarContent) return;

  mirror.innerHTML = sidebarContent.innerHTML;
  mirror.querySelectorAll(".filter-tag").forEach((button) => {
    const groupId = button.getAttribute("data-group");
    if (state.activeFilters.has(groupId)) {
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
