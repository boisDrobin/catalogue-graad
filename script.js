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

function createInfoBlock(label, value) {
  return `
    <div class="info-block">
      <span class="info-label">${label}</span>
      <div class="info-value">${value || "-"}</div>
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

  results.innerHTML = data.map(item => {
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

    const format = cleanNotionText(getField(item, [
      "Format (ANDPC)",
      "Format ANDPC"
    ]));

    const typologie = cleanNotionText(getField(item, [
      "Typologie de formation"
    ]));

    const typeEpp = cleanNotionText(getField(item, [
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

    return `
      <article class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">${title || "Sans titre"}</h2>
          </div>
          <span class="badge">${commercialisation || "Commercialisée"}</span>
        </div>

        <div class="card-grid">
          ${createInfoBlock("Numéro de dépôt", numeroDepot)}
          ${createInfoBlock("Public concerné", publicConcerne.length ? publicConcerne.join(", ") : "-")}
          ${createInfoBlock("Format", format)}
          ${createInfoBlock("Typologie", typologie)}
          ${createInfoBlock("Type d’EPP", typeEpp)}
          ${createInfoBlock("Durée totale", dureeTotale)}
          ${createInfoBlock("Prise en charge", priseEnCharge)}
          ${createInfoBlock("Indemnités PS", indemnites)}
        </div>

        ${contexte ? `
          <div class="context-block">
            <span class="info-label">Contexte</span>
            <div class="info-value">${contexte}</div>
          </div>
        ` : ""}
      </article>
    `;
  }).join("");
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

    const format = cleanNotionText(getField(item, [
      "Format (ANDPC)",
      "Format ANDPC"
    ]));

    const typologie = cleanNotionText(getField(item, [
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

    const matchesFormat = !formatValue || format === formatValue;
    const matchesPublic = !publicValue || publicConcerne.includes(publicValue);
    const matchesTypologie = !typologieValue || typologie === typologieValue;

    return matchesSearch && matchesFormat && matchesPublic && matchesTypologie;
  });

  renderCards(filtered);
}

function initFilters(data) {
  const formatSelect = document.getElementById("filter-format");
  const publicSelect = document.getElementById("filter-public");
  const typologieSelect = document.getElementById("filter-typologie");

  const formats = [...new Set(
    data.map(item => cleanNotionText(getField(item, ["Format (ANDPC)", "Format ANDPC"]))).filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, "fr"));

  const publics = [...new Set(
    data.flatMap(item =>
      splitMultiValue(getField(item, ["Public concerné", "Public Concerné"]))
    ).filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, "fr"));

  const typologies = [...new Set(
    data.map(item => cleanNotionText(getField(item, ["Typologie de formation"]))).filter(Boolean)
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
