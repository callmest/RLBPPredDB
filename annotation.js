const searchInput = document.getElementById("search");
const speciesFilter = document.getElementById("species-filter");
const reviewedFilter = document.getElementById("reviewed-filter");
const minConfidence = document.getElementById("min-confidence");
const sortBy = document.getElementById("sort-by");
const exactId = document.getElementById("exact-id");
const annotationBody = document.getElementById("annotation-body");
const resultSummary = document.getElementById("result-summary");
const prevPageBtn = document.getElementById("prev-page");
const nextPageBtn = document.getElementById("next-page");
const pageInfo = document.getElementById("page-info");
const pageSizeSelect = document.getElementById("page-size");

let annotations = [];
let filteredRows = [];
let currentPage = 1;

function normalize(text) {
  return String(text || "").toLowerCase().trim();
}

function escapeHtml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function confidenceValue(item) {
  const n = Number(item.confidence);
  return Number.isFinite(n) ? n : -1;
}

function lengthValue(item) {
  const n = Number(item.length);
  return Number.isFinite(n) ? n : -1;
}

function matchesKeyword(item, keyword, exactMode) {
  if (!keyword) return true;

  const idText = normalize(item.uniprot_id);
  if (exactMode) return idText === keyword;

  const blob = normalize(
    [
      item.uniprot_id,
      item.gene_name,
      item.gene_names_all,
      item.protein_name,
      item.functional_annotation,
      item.gene_description,
      item.entry_name,
    ].join(" ")
  );
  return blob.includes(keyword);
}

function applyFilters() {
  const keyword = normalize(searchInput.value);
  const species = speciesFilter.value;
  const reviewed = reviewedFilter.value;
  const minConf = Math.max(0, Math.min(1, Number(minConfidence.value || 0)));
  const exactMode = exactId.checked;

  filteredRows = annotations.filter((item) => {
    const speciesMatch = species === "all" || item.species === species;

    let reviewedMatch = true;
    if (reviewed === "reviewed") reviewedMatch = item.reviewed === true;
    if (reviewed === "unreviewed") reviewedMatch = item.reviewed === false;

    const conf = confidenceValue(item);
    const confidenceMatch = conf >= minConf;
    const keywordMatch = matchesKeyword(item, keyword, exactMode);

    return speciesMatch && reviewedMatch && confidenceMatch && keywordMatch;
  });

  const sortMode = sortBy.value;
  filteredRows.sort((a, b) => {
    if (sortMode === "confidence_desc") return confidenceValue(b) - confidenceValue(a);
    if (sortMode === "confidence_asc") return confidenceValue(a) - confidenceValue(b);
    if (sortMode === "length_desc") return lengthValue(b) - lengthValue(a);
    if (sortMode === "length_asc") return lengthValue(a) - lengthValue(b);
    return String(a.uniprot_id || "").localeCompare(String(b.uniprot_id || ""));
  });
}

function renderPage() {
  const pageSize = Number(pageSizeSelect.value || 50);
  const totalRows = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));

  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  const start = (currentPage - 1) * pageSize;
  const pageRows = filteredRows.slice(start, start + pageSize);

  if (!pageRows.length) {
    annotationBody.innerHTML = '<tr><td colspan="8" class="empty">No annotation matches current filters.</td></tr>';
  } else {
    annotationBody.innerHTML = pageRows
      .map((item) => {
        const conf = confidenceValue(item);
        const confText = conf >= 0 ? conf.toFixed(6) : "NA";
        const reviewedText = item.reviewed ? "Yes" : "No";
        const lenText = Number.isFinite(Number(item.length)) ? String(item.length) : "NA";
        const uniprotLink = item.uniprot_page_source
          ? `<a href="${escapeHtml(item.uniprot_page_source)}" target="_blank" rel="noopener noreferrer">UniProt</a>`
          : "-";

        return `
          <tr>
            <td>${escapeHtml(item.uniprot_id)}</td>
            <td>${escapeHtml(item.species)}</td>
            <td>${escapeHtml(item.gene_name || "-")}</td>
            <td title="${escapeHtml(item.functional_annotation || item.gene_description || "")}">${escapeHtml(item.protein_name || "-")}</td>
            <td title="raw: ${conf >= 0 ? conf : "NA"}">${confText}</td>
            <td>${reviewedText}</td>
            <td>${lenText}</td>
            <td>${uniprotLink}</td>
          </tr>
        `;
      })
      .join("");
  }

  const from = totalRows === 0 ? 0 : start + 1;
  const to = Math.min(start + pageSize, totalRows);
  resultSummary.textContent = `Loaded ${annotations.length.toLocaleString()} records | Matched ${totalRows.toLocaleString()} | Showing ${from.toLocaleString()}-${to.toLocaleString()}`;
  pageInfo.textContent = `Page ${currentPage} / ${totalPages}`;
  prevPageBtn.disabled = currentPage <= 1;
  nextPageBtn.disabled = currentPage >= totalPages;
}

function refreshAndRender(resetPage = true) {
  if (resetPage) currentPage = 1;
  applyFilters();
  renderPage();
}

[searchInput, speciesFilter, reviewedFilter, minConfidence, sortBy, exactId].forEach((el) => {
  el.addEventListener("input", () => refreshAndRender(true));
  el.addEventListener("change", () => refreshAndRender(true));
});

pageSizeSelect.addEventListener("change", () => refreshAndRender(true));
prevPageBtn.addEventListener("click", () => {
  currentPage -= 1;
  renderPage();
});
nextPageBtn.addEventListener("click", () => {
  currentPage += 1;
  renderPage();
});

async function init() {
  try {
    const response = await fetch("rlbp_annotations.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    annotations = await response.json();

    // Ensure reviewed is boolean if source data mixed representation.
    annotations = annotations.map((item) => ({
      ...item,
      reviewed: item.reviewed === true || String(item.reviewed).toLowerCase() === "true",
    }));

    refreshAndRender(true);
  } catch (error) {
    resultSummary.textContent = `Failed to load annotation DB: ${error.message}`;
    annotationBody.innerHTML = '<tr><td colspan="8" class="empty">Unable to load rlbp_annotations.json.</td></tr>';
  }
}

init();
