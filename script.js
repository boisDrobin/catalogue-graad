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
  select.innerHTML = "";
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
  if (
    value.includes("e-learning") ||
    value.includes("elearning") ||
    value.includes("non présentiel") ||
    value.includes("non presentiel")
  ) {
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

function normalizeForMatch(value) {
  return cleanNotionText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "'")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getPublicFamily(rawPublic) {
  const normalized = normalizeForMatch(rawPublic);

  const medecinsKeywords = [
    "generaliste",
    "generalistes",
    "medecine generale",
    "cardiologie",
    "cardiologue",
    "cardiologues",
    "medecine cardiovasculaire",
    "gynecologie",
    "gynecologue",
    "gynecologues",
    "gynecologie medicale",
    "gynecologie obstetrique",
    "ophtalmologie",
    "ophtalmologue",
    "ophtalmologues",
    "pediatrie",
    "pediatre",
    "pediatres",
    "dermatologie",
    "dermatologie et venereologie",
    "dermatologue",
    "dermatologues",
    "anesthesie reanimation",
    "anesthesiste",
    "anesthesistes",
    "immunologie",
    "immunologue",
    "immunologues",
    "medecine interne",
    "endocrinologie",
    "endocrinologue",
    "endocrinologues",
    "oncologie",
    "oncologue",
    "oncologues",
    "psychiatrie",
    "psychiatre",
    "psychiatres",
    "hepato gastro enterologie",
    "hepato gastro enterologue",
    "hepato gastro enterologues",
    "geriatrie",
    "geriatre",
    "geriatres"
  ];

  if (medecinsKeywords.some(keyword => normalized === keyword)) return "medecins";
  if (
    normalized === "infirmier diplome d'etat (ide)" ||
    normalized === "infirmier diplome d'etat ide"
  ) return "infirmiers";
  if (
    normalized === "pharmacien" ||
    normalized === "pharmacien titulaire d'officine" ||
    normalized === "pharmacien adjoint d'officine"
  ) return "pharmaciens";
  if (
    normalized === "sage femme" ||
    normalized === "sage-femme" ||
    normalized === "sages-femmes" ||
    normalized === "sages femmes"
  ) return "sages-femmes";
  if (
    normalized === "masseur kinesitherapeute" ||
    normalized === "masseurs kinesitherapeutes"
  ) return "kines";
  if (normalized === "chirurgie dentaire (omnipraticiens)") return "dentistes";

  return "";
}

function getMedicalSpecialtyLabel(rawPublic) {
  const normalized = normalizeForMatch(rawPublic);

  const map = {
    "generaliste": "Médecin - Généraliste",
    "generalistes": "Médecin - Généraliste",
    "medecine generale": "Médecin - Médecine générale",
    "cardiologie": "Médecin - Cardiologie",
    "cardiologue": "Médecin - Cardiologie",
    "cardiologues": "Médecin - Cardiologie",
    "medecine cardiovasculaire": "Médecin - Médecine cardiovasculaire",
    "gynecologie": "Médecin - Gynécologie",
    "gynecologue": "Médecin - Gynécologie",
    "gynecologues": "Médecin - Gynécologie",
    "gynecologie medicale": "Médecin - Gynécologie",
    "gynecologie obstetrique": "Médecin - Gynécologie",
    "ophtalmologie": "Médecin - Ophtalmologie",
    "ophtalmologue": "Médecin - Ophtalmologie",
    "ophtalmologues": "Médecin - Ophtalmologie",
    "pediatrie": "Médecin - Pédiatrie",
    "pediatre": "Médecin - Pédiatrie",
    "pediatres": "Médecin - Pédiatrie",
    "dermatologie": "Médecin - Dermatologie",
    "dermatologie et venereologie": "Médecin - Dermatologie et vénéréologie",
    "dermatologue": "Médecin - Dermatologie",
    "dermatologues": "Médecin - Dermatologie",
    "anesthesie reanimation": "Médecin - Anesthésie-réanimation",
    "anesthesiste": "Médecin - Anesthésie-réanimation",
    "anesthesistes": "Médecin - Anesthésie-réanimation",
    "immunologie": "Médecin - Immunologie",
    "immunologue": "Médecin - Immunologie",
    "immunologues": "Médecin - Immunologie",
    "medecine interne": "Médecin - Médecine interne",
    "endocrinologie": "Médecin - Endocrinologie",
    "endocrinologue": "Médecin - Endocrinologie",
    "endocrinologues": "Médecin - Endocrinologie",
    "oncologie": "Médecin - Oncologie",
    "oncologue": "Médecin - Oncologie",
    "oncologues": "Médecin - Oncologie",
    "psychiatrie": "Médecin - Psychiatrie",
    "psychiatre": "Médecin - Psychiatrie",
    "psychiatres": "Médecin - Psychiatrie",
    "hepato gastro enterologie": "Médecin - Hépato-gastro-entérologie",
    "hepato gastro enterologue": "Médecin - Hépato-gastro-entérologie",
    "hepato gastro enterologues": "Médecin - Hépato-gastro-entérologie",
    "geriatrie": "Médecin - Gériatrie",
    "geriatre": "Médecin - Gériatrie",
    "geriatres": "Médecin - Gériatrie"
  };

  return map[normalized] || "";
}

function getProfessionFamiliesForCard(publics) {
  return [...new Set(
    (publics || [])
      .map(getPublicFamily)
      .filter(Boolean)
  )];
}

function getMedicalSpecialtiesForCard(publics) {
  return [...new Set(
    (publics || [])
      .map(getMedicalSpecialtyLabel)
      .filter(Boolean)
  )];
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

function getPublicBadge(publics) {
  if (!publics || !publics.length) return "";

  const cleaned = publics.map(v => cleanNotionText(v)).filter(Boolean);

  if (cleaned.length === 1) {
    const medicalLabel = getMedicalSpecialtyLabel(cleaned[0]);
    if (medicalLabel) return medicalLabel;
    return cleaned[0];
  }

  const normalized = cleaned.map(normalizeForMatch);

  const hasOnlyValues = (expectedValues) => {
    const expected = expectedValues.map(normalizeForMatch);
    if (normalized.length !== expected.length) return false;
    return expected.every(value => normalized.includes(value));
  };

  if (
    hasOnlyValues([
      "Gynécologie médicale",
      "Gynécologie obstétrique"
    ])
  ) {
    return "Médecin - Gynécologie";
  }

  if (
    hasOnlyValues([
      "Pharmacien titulaire d'officine",
      "Pharmacien adjoint d'officine"
    ])
  ) {
    return "Pharmacien";
  }

  return "Public Mixte";
}

function getPublicBadgeClass(label) {
  const normalized = cleanNotionText(label)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "'")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (normalized === "public mixte") {
    return "badge-public-mixte";
  }

  if (normalized === "chirurgie dentaire (omnipraticiens)") {
    return "badge-public-dentaire";
  }

  if (
    normalized === "infirmier diplome d'etat (ide)" ||
    normalized === "infirmier diplome d'etat ide"
  ) {
    return "badge-public-ide";
  }

  if (
    normalized === "masseur kinesitherapeute" ||
    normalized === "masseurs kinesitherapeutes"
  ) {
    return "badge-public-kine";
  }

  if (
    normalized === "pharmacien" ||
    normalized === "pharmacien titulaire d'officine" ||
    normalized === "pharmacien adjoint d'officine"
  ) {
    return "badge-public-pharmacien";
  }

  if (
    normalized === "sage femme" ||
    normalized === "sage-femme" ||
    normalized === "sages-femmes" ||
    normalized === "sages femmes"
  ) {
    return "badge-public-sagefemme";
  }

  return "badge-public-default";
}

function createInfoBlock(label, value, options = {}) {
  const helpType = options.helpType || "";
  const isHtmlValue = options.isHtmlValue || false;

  const popoverContent =
    helpType === "type-epp"
      ? getTypeEppHelpContent()
      : helpType === "typologie"
        ? getTypologieHelpContent()
        : "";

  const finalValue = isHtmlValue ? (value || "-") : escapeHtml(value || "-");

  return `
    <div class="info-block">
      <div class="info-block-header">
        <div class="info-icon" aria-hidden="true">
          ${getInfoIcon(label)}
        </div>

        <div class="info-content">
          <div class="info-label-row">
            <span class="info-label">${escapeHtml(label)}</span>
            ${helpType ? `
              <button
                type="button"
                class="info-help-button"
                aria-label="Afficher une aide sur ${escapeHtml(label)}"
                aria-expanded="false"
              >?</button>
              <div class="info-popover" hidden>
                ${popoverContent}
              </div>
            ` : ""}
          </div>
          <div class="info-value">${finalValue}</div>
        </div>
      </div>
    </div>
  `;
}

function createPublicConcerneBlock(publics, index) {
  if (!publics || !publics.length) {
    return createInfoBlock("Public concerné", "-");
  }

  if (publics.length === 1) {
    return createInfoBlock("Public concerné", publics[0]);
  }

  const first = escapeHtml(publics[0]);
  const rest = publics.slice(1).map(escapeHtml).join(", ");
  const targetId = `public-extra-${index}`;

  const htmlValue = `
    <span class="public-value-inline">${first}</span><span id="${targetId}" class="public-extra" hidden>, ${rest}</span>
    <button
      class="content-toggle"
      type="button"
      aria-expanded="false"
      data-target="${targetId}"
      data-more-label="Voir plus"
      data-less-label="Voir moins"
    >
      Voir plus
    </button>
  `;

  return createInfoBlock("Public concerné", htmlValue, { isHtmlValue: true });
}

function createContextBlock(contexte, index) {
  if (!contexte) return "";

  const safeText = escapeHtml(contexte);
  const shouldCollapse = contexte.length > 260;
  const textId = `context-text-${index}`;

  return `
    <div class="section-block">
      <div class="section-inner">
        <span class="section-title">Contexte de la formation</span>
        <p id="${textId}" class="context-text ${shouldCollapse ? "is-collapsed" : ""}">${safeText}</p>
      </div>
      ${shouldCollapse ? `
        <div class="context-actions">
          <button
            class="content-toggle"
            type="button"
            aria-expanded="false"
            data-target="${textId}"
            data-more-label="Voir plus"
            data-less-label="Voir moins"
          >
            Voir plus
          </button>
        </div>
      ` : ""}
    </div>
  `;
}

function createMemoButton(url) {
  if (!url) return "";

  const safeUrl = escapeHtml(url);

  return `
    <div class="card-actions">
      <a
        class="memo-button"
        href="${safeUrl}"
        target="_blank"
        rel="noopener noreferrer"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z"></path>
          <path d="M14 3v6h6"></path>
          <path d="M9 15h6"></path>
          <path d="M9 11h3"></path>
        </svg>
        Voir le mémo PDF
      </a>
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

function bindContentToggles() {
  const buttons = document.querySelectorAll(".content-toggle");

  buttons.forEach(button => {
    button.onclick = (event) => {
      event.stopPropagation();

      const targetId = button.getAttribute("data-target");
      const target = document.getElementById(targetId);
      if (!target) return;

      const moreLabel = button.getAttribute("data-more-label") || "Voir plus";
      const lessLabel = button.getAttribute("data-less-label") || "Voir moins";
      const isExpanded = button.getAttribute("aria-expanded") === "true";

      if (target.classList.contains("context-text")) {
        if (isExpanded) {
          target.classList.add("is-collapsed");
          button.textContent = moreLabel;
          button.setAttribute("aria-expanded", "false");
        } else {
          target.classList.remove("is-collapsed");
          button.textContent = lessLabel;
          button.setAttribute("aria-expanded", "true");
        }
      } else {
        const isHidden = target.hidden;
        target.hidden = !isHidden;
        button.textContent = isHidden ? lessLabel : moreLabel;
        button.setAttribute("aria-expanded", isHidden ? "true" : "false");
      }
    };
  });
}

function bindCardToggles() {
  const headers = document.querySelectorAll(".card-header");

  headers.forEach(header => {
    header.onclick = (event) => {
      const interactiveTarget = event.target.closest("button, a");
      if (interactiveTarget) return;

      const card = header.closest(".card");
      if (!card) return;

      const isOpen = card.classList.contains("is-open");
      const toggleText = card.querySelector(".card-toggle-text");
      const ariaExpanded = card.querySelector(".card-header");

      if (isOpen) {
        card.classList.remove("is-open");
        if (toggleText) toggleText.textContent = "Voir le détail";
        if (ariaExpanded) ariaExpanded.setAttribute("aria-expanded", "false");
      } else {
        card.classList.add("is-open");
        if (toggleText) toggleText.textContent = "Masquer le détail";
        if (ariaExpanded) ariaExpanded.setAttribute("aria-expanded", "true");
      }
    };

    header.onkeydown = (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        header.click();
      }
    };
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

function updateSpecialtyFilterOptions() {
  const familySelect = document.getElementById("filter-public-family");
  const specialtyGroup = document.getElementById("specialty-filter-group");
  const specialtySelect = document.getElementById("filter-specialty");

  if (familySelect.value !== "medecins") {
    specialtyGroup.classList.add("is-hidden");
    specialtySelect.innerHTML = `<option value="">Toutes</option>`;
    specialtySelect.value = "";
    return;
  }

  const specialties = [...new Set(
    catalogue.flatMap(item => {
      const publics = splitMultiValue(getField(item, ["Public concerné", "Public Concerné"]));
      return getMedicalSpecialtiesForCard(publics);
    })
  )].sort((a, b) => a.localeCompare(b, "fr"));

  specialtyGroup.classList.remove("is-hidden");

  specialtySelect.innerHTML = `<option value="">Toutes</option>`;
  specialties.forEach(value => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value.replace(/^Médecin\s-\s/, "");
    specialtySelect.appendChild(option);
  });
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

    const memoPdf = cleanNotionText(getField(item, [
      "Fiche mémo pdf",
      "Fiche mémo PDF",
      "Fiche memo pdf",
      "Fiche memo PDF"
    ]));

    const formatDisplay = formatLabel(formatRaw) || formatRaw;
    const typologieDisplay = formatLabel(typologieRaw) || typologieRaw;
    const typeEppDisplay = formatLabel(typeEppRaw) || typeEppRaw;
    const formatClass = getFormatClass(formatDisplay);
    const showFormateurs = shouldShowFormateurs(formatDisplay);

    const publicBadge = getPublicBadge(publicConcerne);
    const publicBadgeClass = getPublicBadgeClass(publicBadge);

    return `
      <article class="card ${formatClass}">
        <div class="card-header" role="button" tabindex="0" aria-expanded="false">
          <div class="card-header-main">
            <h2 class="card-title">${escapeHtml(title || "Sans titre")}</h2>
            <div class="card-badges">
              ${publicBadge ? `
                <span class="badge ${publicBadgeClass}">
                  ${escapeHtml(publicBadge)}
                </span>
              ` : ""}
              ${formatDisplay ? `
                <span class="badge badge-format ${formatClass.replace("format-", "badge-format-")}">
                  ${escapeHtml(formatDisplay)}
                </span>
              ` : ""}
            </div>
          </div>

          <div class="card-toggle">
            <span class="card-toggle-text">Voir le détail</span>
            <span class="card-toggle-icon" aria-hidden="true">⌄</span>
          </div>
        </div>

        <div class="card-details">
          <div class="card-details-inner">
            <div class="card-grid">
              ${createInfoBlock("Numéro de dépôt", numeroDepot)}
              ${createPublicConcerneBlock(publicConcerne, index)}
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
            ${createMemoButton(memoPdf)}
          </div>
        </div>
      </article>
    `;
  }).join("");

  bindContentToggles();
  bindInfoPopovers();
  bindCardToggles();
}

function applyFilters() {
  const searchValue = normalize(document.getElementById("search").value).toLowerCase();
  const familyValue = normalize(document.getElementById("filter-public-family").value);
  const specialtyValue = normalize(document.getElementById("filter-specialty").value);
  const formatValue = normalize(document.getElementById("filter-format").value);
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

    const publics = splitMultiValue(getField(item, [
      "Public concerné",
      "Public Concerné"
    ]));

    const publicLabels = publics.map(v => v.toLowerCase());
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

    const families = getProfessionFamiliesForCard(publics);
    const medicalSpecialties = getMedicalSpecialtiesForCard(publics);

    const matchesSearch =
      !searchValue ||
      title.includes(searchValue) ||
      numeroDepot.includes(searchValue) ||
      publicLabels.join(", ").includes(searchValue) ||
      contexte.includes(searchValue);

    const matchesFamily =
      !familyValue ||
      families.includes(familyValue);

    const matchesSpecialty =
      familyValue !== "medecins" ||
      !specialtyValue ||
      medicalSpecialties.includes(specialtyValue);

    const matchesFormat = !formatValue || formatDisplay === formatValue;
    const matchesTypologie = !typologieValue || typologieDisplay === typologieValue;

    return (
      matchesSearch &&
      matchesFamily &&
      matchesSpecialty &&
      matchesFormat &&
      matchesTypologie
    );
  });

  renderCards(filtered);
}

function initFilters(data) {
  const formatSelect = document.getElementById("filter-format");
  const typologieSelect = document.getElementById("filter-typologie");
  const familySelect = document.getElementById("filter-public-family");
  const specialtySelect = document.getElementById("filter-specialty");

  const formats = [...new Set(
    data.map(item => formatLabel(getField(item, ["Format (ANDPC)", "Format ANDPC"]))).filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, "fr"));

  const typologies = [...new Set(
    data.map(item => formatLabel(getField(item, ["Typologie de formation"]))).filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, "fr"));

  formatSelect.innerHTML = `<option value="">Tous</option>`;
  formats.forEach(value => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    formatSelect.appendChild(option);
  });

  typologieSelect.innerHTML = `<option value="">Toutes</option>`;
  typologies.forEach(value => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    typologieSelect.appendChild(option);
  });

  specialtySelect.innerHTML = `<option value="">Toutes</option>`;

  document.getElementById("search").addEventListener("input", applyFilters);

  familySelect.addEventListener("change", () => {
    updateSpecialtyFilterOptions();
    applyFilters();
  });

  specialtySelect.addEventListener("change", applyFilters);
  formatSelect.addEventListener("change", applyFilters);
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
    updateSpecialtyFilterOptions();
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
