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

function createInfoBlock(label, value) {
  return `
    <div class="info-block">
      <span class="info-label">${escapeHtml(label)}</span>
      <div class="info-value">${escapeHtml(value || "-")}</div>
    </div>
  `;
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
  if (value.includes("e-learning") || value.includes("elearning")) return "format-elearning";

  return "format-default";
}

function createContextBlock(contexte, index) {
  if (!contexte) return "";

  const safeText = escapeHtml(contexte);
  const shouldCollapse = contexte.length > 260;
  const textId = `context-text-${index}`;

  return `
    <div class="context-wrapper">
      <div class="context-inner">
        <span class="info-label">Contexte</span>
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

    const dureeTotale = cleanNotionText(getField(item, [
      "Durée totale",
      "Durée Totale"
    ]));

    const priseEnCharge = cleanNotionText(getField(item, [
      "Prise en charge"
    ]));

    const indemnites = cleanNotionText(getField(item, [
      "Indemnités PS",
      "Indemnites PS"
    ]));

    const commercialisation = cleanNotionText(getField(item, [
      "Commercialisation"
    ]));

    const formatDisplay = formatLabel(formatRaw) || formatRaw;
    const typologieDisplay = formatLabel(typologieRaw) || typologieRaw;
    const typeEppDisplay = formatLabel(typeEppRaw) || typeEppRaw;
    const formatClass = getFormatClass(formatDisplay);

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
          ${createInfoBlock("Typologie", typologieDisplay || "-")}
          ${createInfoBlock("Type d’EPP", typeEppDisplay || "-")}
          ${createInfoBlock("Durée totale", dureeTotale || "-")}
          ${createInfoBlock("Prise en charge", priseEnCharge || "-")}
          ${createInfoBlock("Indemnités PS", indemnites || "-")}
        </div>

        ${createContextBlock(contexte, index)}
      </article>
    `;
  }).join("");

  bindContextToggles();
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

function applyFilters() {
  const searchValue = normalize(document.getElementById("search").value).toLowerCase();
  const formatValue = normalize(document.getElementById("filter-format").value);
  const publicValue = normalize(document.getElementById("filter-public").value);
  const typologieValue = normalize(document.getElementById("filter-typologie").value);

  const filtered = catalogue.filter(item => {
    const title = cleanNotionText(getField(item, [
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

Papa.parse("./data/catalogue.csv", {
  download: true,
  header: true,
  skipEmptyLines: true,
  complete: function(results) {
    const rawData = results.data || [];

    catalogue = rawData.filter(item => {
      const commercialisation = cleanNotionText(getField(item, ["Commercialisation"]));
      return commercialisation.toLowerCase().includes("commercialisée");
    });

    initFilters(catalogue);
    renderCards(catalogue);
  },
  error: function(error) {
    console.error(error);
    document.getElementById("results").innerHTML = `
      <div class="empty-state">
        Erreur lors du chargement du catalogue CSV.
      </div>
    `;
    document.getElementById("results-count").textContent = "Erreur de chargement";
  }
});
