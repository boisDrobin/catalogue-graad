let catalogue = [];

function normalize(value) {
  return String(value || "").trim();
}

function getField(item, keys) {
  for (const key of keys) {
    if (item[key] !== undefined && item[key] !== null && normalize(item[key]) !== "") {
      return normalize(item[key]);
    }
  }
  return "";
}

function cleanNotionText(value) {
  return normalize(value).replace(/\s*\(https?:\/\/[^\)]+\)/g, "").trim();
}

function splitMultiValue(value) {
  return cleanNotionText(value)
    .split(",")
    .map(v => v.trim())
    .filter(Boolean);
}

function fillSelect(select, values) {
  values.forEach(value => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatLabel(value) {
  const raw = cleanNotionText(value);
  if (!raw) return "";

  const map = {
    "AC": "Audit clinique",
    "FC": "Formation continue",
    "PI": "Programme intégré",
    "EPP": "Évaluation des pratiques professionnelles",
    "CV": "Classe virtuelle",
    "VC": "Vignette clinique",
    "NA (FC)": "Aucune",
    "NA(FC)": "Aucune",
    "NON PRÉSENTIEL": "E-learning",
    "NON PRESENTIEL": "E-learning",
    "ELEARNING": "E-learning",
    "E-LEARNING": "E-learning",
    "PRÉSENTIEL": "Présentiel",
    "PRESENTIEL": "Présentiel",
    "MIXTE": "Mixte"
  };

  const upper = raw.toUpperCase();
  if (map[upper]) return map[upper];

  const parts = raw.split(",").map(part => {
    const trimmed = part.trim();
    const upperPart = trimmed.toUpperCase();
    return map[upperPart] || trimmed;
  });

  return parts.join(", ");
}

function getFormatClass(formatValue) {
  const value = cleanNotionText(formatValue).toLowerCase();

  if (value.includes("mixte")) return "format-mixte";
  if (value.includes("classe virtuelle")) return "format-classe-virtuelle";
  if (value.includes("présentiel") || value.includes("presentiel")) return "format-presentiel";
  if (value.includes("e-learning") || value.includes("elearning") || value.includes("non présentiel") || value.includes("non presentiel")) {
    return "format-elearning";
  }

  return "format-default";
}

function formatHours(value) {
  const raw = cleanNotionText(value);
  if (!raw) return "";

  const normalized = raw.replace(",", ".").trim();
  const number = Number(normalized);

  if (!Number.isNaN(number)) {
    const label = number > 1 ? "heures" : "heure";
    const display = Number.isInteger(number) ? String(number) : String(number).replace(".", ",");
    return `${display} ${label}`;
  }

  return raw.toLowerCase().includes("heure") ? raw : `${raw} heures`;
}

function shouldShowFormateurs(formatDisplay) {
  const value = cleanNotionText(formatDisplay).toLowerCase();
  return !value.includes("classe virtuelle") && !value.includes("présentiel") && !value.includes("presentiel");
}

function isZeroOrEmptyDuration(value) {
  const raw = cleanNotionText(value);
  if (!raw) return true;

  const normalized = raw.replace(",", ".").trim();
  const number = Number(normalized);

  if (!Number.isNaN(number)) {
    return number === 0;
  }

  return raw === "0";
}

function getTypeEppHelpContent() {
  return `
    <div class="info-popover-title">Type d’EPP</div>
    <p><strong>Audit clinique</strong> : démarche qui compare les pratiques à des références pour identifier des pistes d’amélioration.</p>
    <p><strong>Vignette clinique</strong> : cas pratique permettant d’analyser le raisonnement et les choix professionnels.</p>
  `;
}

function getTypologieHelpContent() {
  return `
    <div class="info-popover-title">Typologie</div>
    <p><strong>Formation continue</strong> : temps de formation destiné à actualiser ou renforcer les connaissances et compétences.</p>
    <p><strong>Évaluation des pratiques professionnelles</strong> : démarche qui permet d’analyser sa pratique pour l’améliorer.</p>
    <p><strong>Programme intégré</strong> : formation qui combine un temps de formation continue et un temps d’évaluation des pratiques professionnelles.</p>
  `;
}

function createInfoBlock(label, value, options = {}) {
  const helpType = options.helpType || "";
  const popoverContent =
    helpType === "type-epp"
      ? getTypeEppHelpContent()
      : helpType === "typologie"
        ? getTypologieHelpContent()
        : "";

  return `
    <div class="info-block">
      <div class="info-label-row">
        <span class="info-label">${escapeHtml(label)}</span>
        ${helpType ? `
          <button
            type="button"
            class="info-help-button"
            aria-label="Afficher une aide sur ${escapeHtml(label)}"
            aria-expanded="false"
          >ⓘ</button>
          <div class="info-popover" hidden>
            ${popoverContent}
          </div>
        ` : ""}
      </div>
      <div class="info-value">${escapeHtml(value || "-")}</div>
    </div>
  `;
}

function createContextBlock(contexte, index) {
  if (!contexte) return "";

  const safeText = escapeHtml(contexte);
  const shouldCollapse = contexte.length > 260;
  const textId = `context-text-${index}`;

  return `
    <div class="section-block">
      <div class="section-inner">
        <span class="section-title">Contexte</span>
        <p id="${textId}" class="context-text ${shouldCollapse ? "is-collapsed" : ""}">${safeText}</p>
      </div>
      ${shouldCollapse ? `
        <div class="context-actions">
          <button
            class="context-toggle"
            type="button"
            aria-expanded="false"
            data-target="${textId}"
          >
            Voir plus
          </button>
        </div>
      ` : ""}
    </div>
  `;
}

function getUnitData(item, unitNumber) {
  const typologie = formatLabel(getField(item, [`U${unitNumber} - Typologie`]));
  const format = formatLabel(getField(item, [`U${unitNumber} - Format`]));
  const dureeRaw = cleanNotionText(getField(item, [`U${unitNumber} - Nb d'heure(s) total`]));
  const duree = formatHours(dureeRaw);

  if (!typologie && !format && !dureeRaw) return null;

  return {
    unit: `U${unitNumber} (Étape ${unitNumber})`,
    typologie,
    format,
    duree,
    dureeRaw
  };
}

function createStepBadge(value, className) {
  if (!value) return "";
  return `<span class="step-badge ${className}">${escapeHtml(value)}</span>`;
}

function createArticulationBlock(item) {
  const u1 = getUnitData(item, 1);
  const u2 = getUnitData(item, 2);
  const u3 = getUnitData(item, 3);

  const hasU2 = u2 && !isZeroOrEmptyDuration(u2.dureeRaw);
  const hasU3 = u3 && !isZeroOrEmptyDuration(u3.dureeRaw);

  if (!hasU2 && !hasU3) {
    return "";
  }

  const units = [u1, u2, u3].filter(unit => unit && !isZeroOrEmptyDuration(unit.dureeRaw));
  if (!units.length) return "";

  const stepsHtml = units.map((unit, index) => {
    const stepHtml = `
      <div class="articulation-step">
        <h3 class="articulation-step-title">${escapeHtml(unit.unit)}</h3>
        <div class="step-badges">
          ${createStepBadge(unit.typologie, "step-badge-typologie")}
          ${createStepBadge(unit.format, "step-badge-format")}
          ${createStepBadge(unit.duree, "step-badge-duree")}
        </div>
      </div>
    `;

    if (index < units.length - 1) {
      return `${stepHtml}<div class="articulation-arrow" aria-hidden="true">→</div>`;
    }

    return stepHtml;
  }).join("");

  return `
    <div class="section-block">
      <div class="section-inner">
        <div class="section-title-row">
          <span class="section-title">Articulation de la formation</span>
        </div>
        <div class="articulation-timeline">
          ${stepsHtml}
        </div>
      </div>
    </div>
  `;
}

function bindContextToggles() {
  const buttons = document.querySelectorAll(".context-toggle");

  buttons.forEach(button => {
    button.addEventListener("click", () => {
      const targetId = button.getAttribute("data-target");
      const target = document.getElementById(targetId);
      if (!target) return;

      const isCollapsed = target.classList.contains("is-collapsed");

      if (isCollapsed) {
        target.classList.remove("is-collapsed");
        button.textContent = "Voir moins";
        button.setAttribute("aria-expanded", "true");
      } else {
        target.classList.add("is-collapsed");
        button.textContent = "Voir plus";
        button.setAttribute("aria-expanded", "false");
      }
    });
  });
}

function closeAllPopovers() {
  document.querySelectorAll(".info-popover").forEach(popover => {
    popover.hidden = true;
  });

  document.querySelectorAll(".info-help-button").forEach(button => {
    button.setAttribute("aria-expanded", "false");
  });
}

let popoverEventsBound = false;

function bindInfoPopovers() {
  const buttons = document.querySelectorAll(".info-help-button");

  buttons.forEach(button => {
    button.onclick = (event) => {
      event.stopPropagation();

      const popover = button.parentElement.querySelector(".info-popover");
      if (!popover) return;

      const isOpen = !popover.hidden;
      closeAllPopovers();

      if (!isOpen) {
        popover.hidden = false;
        button.setAttribute("aria-expanded", "true");
      }
    };
  });

  if (!popoverEventsBound) {
    document.addEventListener("click", closeAllPopovers);
    popoverEventsBound = true;
  }
}

function formatDateFr(date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

function tryParseDate(value) {
  const raw = cleanNotionText(value);
  if (!raw) return null;

  const direct = new Date(raw);
  if (!Number.isNaN(direct.getTime())) return direct;

  const frMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (frMatch) {
    const [, d, m, y] = frMatch;
    const parsed = new Date(`${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}T00:00:00`);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return null;
}

function findExportDateInData(rows) {
  if (!rows.length) return null;

  const candidateKeys = [
    "Date d'export",
    "Date export",
    "Export du",
    "Date de l'export",
    "Dernière mise à jour",
    "Derniere mise a jour",
    "Mise à jour",
    "Mise a jour"
  ];

  for (const key of candidateKeys) {
    const value = getField(rows[0], [key]);
    const parsed = tryParseDate(value);
    if (parsed) return parsed;
  }

  return null;
}

function setSubtitle(exportDate, lastModifiedDate) {
  const subtitle = document.getElementById("subtitle-text");
  if (!subtitle) return;

  const dateToUse = exportDate || lastModifiedDate;

  if (dateToUse) {
    subtitle.textContent = `Catalogue mis à jour à partir d’un export Notion - Dernière mise à jour le ${formatDateFr(dateToUse)}`;
    return;
  }

  subtitle.textContent = "Catalogue mis à jour à partir d’un export Notion";
}

function renderCards(data) {
  const results = document.getElementById("results");
  const resultsCount = document.getElementById("results-count");

  resultsCount.textContent = `${data.length} formation${data.length > 1 ? "s" : ""} affichée${data.length > 1 ? "s" : ""}`;

  if (!data.length) {
    results.innerHTML = `
      <div class="empty-state">
        Aucune formation ne correspond aux filtres sélectionnés.
      </div>
    `;
    return;
  }

  results.innerHTML = data.map((item, index) => {
    const title = cleanNotionText(getField(item, [
      "Thématiques 2628",
      "Intitulé de l'action",
      "Intitulé",
      "Nom",
      "Name",
      "Titre",
      "Title"
    ]));

    const numeroDepot = cleanNotionText(getField(item, [
      "Numéro de dépôt",
      "Numero de dépôt",
      "Numéro",
      "Numero"
    ]));

    const publicConcerne = splitMultiValue(getField(item, [
      "Public concerné",
      "Public Concerné"
    ]));

    const contexte = cleanNotionText(getField(item, [
      "Contexte"
    ]));

    const formatRaw = cleanNotionText(getField(item, [
      "Format (ANDPC)",
      "Format ANDPC"
    ]));

    const typologieRaw = cleanNotionText(getField(item, [
      "Typologie de formation"
    ]));

    const typeEppRaw = cleanNotionText(getField(item, [
      "Type d'EPP",
      "Type EPP"
    ]));

    const dureeTotaleRaw = cleanNotionText(getField(item, [
      "Durée totale",
      "Durée Totale"
    ]));
    const dureeTotale = formatHours(dureeTotaleRaw);

    const priseEnCharge = cleanNotionText(getField(item, [
      "Prise en charge"
    ]));

    const indemnites = cleanNotionText(getField(item, [
      "Indemnités PS",
      "Indemnites PS"
    ]));

    const formateurs = cleanNotionText(getField(item, [
      "Formateur(s)",
      "Formateurs"
    ]));

    const odpc = cleanNotionText(getField(item, [
      "ODPC"
    ]));

    const commercialisation = cleanNotionText(getField(item, [
      "Commercialisation"
    ]));

    const formatDisplay = formatLabel(formatRaw) || formatRaw;
    const typologieDisplay = formatLabel(typologieRaw) || typologieRaw;
    const typeEppDisplay = formatLabel(typeEppRaw) || typeEppRaw;
    const formatClass = getFormatClass(formatDisplay);
    const showFormateurs = shouldShowFormateurs(formatDisplay);

    return `
      <article class="card ${formatClass}">
        <div class="card-header">
          <div class="card-header-main">
            <h2 class="card-title">${escapeHtml(title || "Sans titre")}</h2>
            <div class="card-badges">
              <span class="badge badge-commercialisation">
                ${escapeHtml(commercialisation || "Commercialisée")}
              </span>
              ${formatDisplay ? `
                <span class="badge badge-format ${formatClass.replace("format-", "badge-format-")}">
                  ${escapeHtml(formatDisplay)}
                </span>
              ` : ""}
            </div>
          </div>
        </div>

        <div class="card-grid">
          ${createInfoBlock("Numéro de dépôt", numeroDepot)}
          ${createInfoBlock("Public concerné", publicConcerne.length ? publicConcerne.join(", ") : "-")}
          ${createInfoBlock("Format", formatDisplay || "-")}
          ${createInfoBlock("Typologie", typologieDisplay || "-", { helpType: "typologie" })}
          ${createInfoBlock("Type d’EPP", typeEppDisplay || "-", { helpType: "type-epp" })}
          ${createInfoBlock("Durée totale", dureeTotale || "-")}
          ${createInfoBlock("ODPC", odpc || "-")}
          ${showFormateurs ? createInfoBlock("Formateur(s)", formateurs || "-") : ""}
          ${createInfoBlock("Prise en charge", priseEnCharge || "-")}
          ${createInfoBlock("Indemnités PS", indemnites || "-")}
        </div>

        ${createArticulationBlock(item)}
        ${createContextBlock(contexte, index)}
      </article>
    `;
  }).join("");

  bindContextToggles();
  bindInfoPopovers();
}

function applyFilters() {
  const searchValue = normalize(document.getElementById("search").value).toLowerCase();
  const formatValue = normalize(document.getElementById("filter-format").value);
  const publicValue = normalize(document.getElementById("filter-public").value);
  const typologieValue = normalize(document.getElementById("filter-typologie").value);

  const filtered = catalogue.filter(item => {
    const title = cleanNotionText(getField(item, [
      "Thématiques 2628",
      "Intitulé de l'action",
      "Intitulé",
      "Nom",
      "Name",
      "Titre",
      "Title"
    ])).toLowerCase();

    const numeroDepot = cleanNotionText(getField(item, [
      "Numéro de dépôt",
      "Numero de dépôt",
      "Numéro",
      "Numero"
    ])).toLowerCase();

    const publicConcerne = splitMultiValue(getField(item, [
      "Public concerné",
      "Public Concerné"
    ]));

    const formatDisplay = formatLabel(getField(item, [
      "Format (ANDPC)",
      "Format ANDPC"
    ]));

    const typologieDisplay = formatLabel(getField(item, [
      "Typologie de formation"
    ]));

    const contexte = cleanNotionText(getField(item, [
      "Contexte"
    ])).toLowerCase();

    const matchesSearch =
      !searchValue ||
      title.includes(searchValue) ||
      numeroDepot.includes(searchValue) ||
      publicConcerne.join(", ").toLowerCase().includes(searchValue) ||
      contexte.includes(searchValue);

    const matchesFormat = !formatValue || formatDisplay === formatValue;
    const matchesPublic = !publicValue || publicConcerne.includes(publicValue);
    const matchesTypologie = !typologieValue || typologieDisplay === typologieValue;

    return matchesSearch && matchesFormat && matchesPublic && matchesTypologie;
  });

  renderCards(filtered);
}

function initFilters(data) {
  const formatSelect = document.getElementById("filter-format");
  const publicSelect = document.getElementById("filter-public");
  const typologieSelect = document.getElementById("filter-typologie");

  const formats = [...new Set(
    data.map(item => formatLabel(getField(item, ["Format (ANDPC)", "Format ANDPC"]))).filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, "fr"));

  const publics = [...new Set(
    data.flatMap(item =>
      splitMultiValue(getField(item, ["Public concerné", "Public Concerné"]))
    ).filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, "fr"));

  const typologies = [...new Set(
    data.map(item => formatLabel(getField(item, ["Typologie de formation"]))).filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, "fr"));

  fillSelect(formatSelect, formats);
  fillSelect(publicSelect, publics);
  fillSelect(typologieSelect, typologies);

  document.getElementById("search").addEventListener("input", applyFilters);
  formatSelect.addEventListener("change", applyFilters);
  publicSelect.addEventListener("change", applyFilters);
  typologieSelect.addEventListener("change", applyFilters);
}

async function loadCatalogue() {
  try {
    const response = await fetch("./data/catalogue.csv");
    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status}`);
    }

    const csvText = await response.text();

    const lastModifiedHeader = response.headers.get("last-modified");
    const lastModifiedDate = lastModifiedHeader ? new Date(lastModifiedHeader) : null;
    const usableLastModifiedDate =
      lastModifiedDate && !Number.isNaN(lastModifiedDate.getTime()) ? lastModifiedDate : null;

    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true
    });

    const rawData = parsed.data || [];
    const exportDate = findExportDateInData(rawData);

    setSubtitle(exportDate, usableLastModifiedDate);

    catalogue = rawData.filter(item => {
      const commercialisation = cleanNotionText(getField(item, ["Commercialisation"]));
      return commercialisation.toLowerCase().includes("commercialisée");
    });

    initFilters(catalogue);
    renderCards(catalogue);
  } catch (error) {
    console.error(error);
    document.getElementById("results").innerHTML = `
      <div class="empty-state">
        Erreur lors du chargement du catalogue CSV.
      </div>
    `;
    document.getElementById("results-count").textContent = "Erreur de chargement";
    setSubtitle(null, null);
  }
}

loadCatalogue();
