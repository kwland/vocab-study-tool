const STORAGE_KEY = "vocabDeck.v1";

const sampleDeck = [
  {
    term: "Abate",
    definition: "To become less intense or widespread.",
    tier: "Tier 1",
    example: "The storm began to abate after midnight."
  },
  {
    term: "Bolster",
    definition: "To support or strengthen.",
    tier: "Tier 1",
    example: "Extra evidence can bolster an argument."
  },
  {
    term: "Candid",
    definition: "Truthful and straightforward.",
    tier: "Tier 1",
    example: "Her candid response made the discussion easier."
  },
  {
    term: "Deference",
    definition: "Respectful submission to another person's judgment.",
    tier: "Tier 2",
    example: "The staff listened in deference to the expert."
  },
  {
    term: "Ephemeral",
    definition: "Lasting for a very short time.",
    tier: "Tier 2",
    example: "The app's popularity proved ephemeral."
  },
  {
    term: "Fastidious",
    definition: "Very attentive to detail and accuracy.",
    tier: "Tier 2",
    example: "A fastidious editor catches tiny mistakes."
  },
  {
    term: "Garrulous",
    definition: "Excessively talkative, especially on trivial matters.",
    tier: "Tier 3",
    example: "The garrulous host barely paused for breath."
  },
  {
    term: "Mitigate",
    definition: "To make something less severe or harmful.",
    tier: "Tier 3",
    example: "Shade trees can mitigate heat in cities."
  }
];

const state = {
  deck: [],
  progress: {},
  filteredDeck: [],
  currentIndex: 0,
  isFlipped: false,
  filters: {
    tier: "all",
    status: "all",
    search: ""
  }
};

const els = {
  csvFile: document.querySelector("#csvFile"),
  loadSampleBtn: document.querySelector("#loadSampleBtn"),
  searchInput: document.querySelector("#searchInput"),
  tierFilter: document.querySelector("#tierFilter"),
  statusFilter: document.querySelector("#statusFilter"),
  shuffleBtn: document.querySelector("#shuffleBtn"),
  resetFiltersBtn: document.querySelector("#resetFiltersBtn"),
  flashcard: document.querySelector("#flashcard"),
  cardTerm: document.querySelector("#cardTerm"),
  cardDefinition: document.querySelector("#cardDefinition"),
  cardExample: document.querySelector("#cardExample"),
  currentTier: document.querySelector("#currentTier"),
  cardCounter: document.querySelector("#cardCounter"),
  knowBtn: document.querySelector("#knowBtn"),
  dontKnowBtn: document.querySelector("#dontKnowBtn"),
  prevBtn: document.querySelector("#prevBtn"),
  nextBtn: document.querySelector("#nextBtn"),
  flipBtn: document.querySelector("#flipBtn"),
  meterLabel: document.querySelector("#meterLabel"),
  meterPercent: document.querySelector("#meterPercent"),
  meterBar: document.querySelector("#meterBar"),
  wordList: document.querySelector("#wordList"),
  exportBtn: document.querySelector("#exportBtn"),
  clearProgressBtn: document.querySelector("#clearProgressBtn"),
  totalWords: document.querySelector("#totalWords"),
  knownWords: document.querySelector("#knownWords"),
  dontKnowWords: document.querySelector("#dontKnowWords"),
  masteryRate: document.querySelector("#masteryRate"),
  tierChart: document.querySelector("#tierChart"),
  wordItemTemplate: document.querySelector("#wordItemTemplate"),
  tabs: document.querySelectorAll(".tab"),
  views: document.querySelectorAll(".view")
};

function init() {
  loadState();
  if (!state.deck.length) {
    state.deck = sampleDeck.map(normalizeCard);
  }
  bindEvents();
  refreshAll();
}

function bindEvents() {
  els.csvFile.addEventListener("change", handleFileImport);
  els.loadSampleBtn.addEventListener("click", () => {
    state.deck = sampleDeck.map(normalizeCard);
    state.currentIndex = 0;
    state.isFlipped = false;
    saveState();
    refreshAll();
  });

  els.searchInput.addEventListener("input", (event) => {
    state.filters.search = event.target.value.trim().toLowerCase();
    state.currentIndex = 0;
    refreshAll();
  });

  els.tierFilter.addEventListener("change", (event) => {
    state.filters.tier = event.target.value;
    state.currentIndex = 0;
    refreshAll();
  });

  els.statusFilter.addEventListener("change", (event) => {
    state.filters.status = event.target.value;
    state.currentIndex = 0;
    refreshAll();
  });

  els.shuffleBtn.addEventListener("click", () => {
    state.filteredDeck = shuffle(state.filteredDeck);
    state.currentIndex = 0;
    state.isFlipped = false;
    renderCard();
    renderMeter();
  });

  els.resetFiltersBtn.addEventListener("click", () => {
    state.filters = { tier: "all", status: "all", search: "" };
    els.searchInput.value = "";
    els.statusFilter.value = "all";
    state.currentIndex = 0;
    refreshAll();
  });

  els.flashcard.addEventListener("click", flipCard);
  els.flashcard.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      flipCard();
    }
  });
  els.flipBtn.addEventListener("click", flipCard);
  els.prevBtn.addEventListener("click", previousCard);
  els.nextBtn.addEventListener("click", nextCard);
  els.knowBtn.addEventListener("click", () => markCurrentCard("known"));
  els.dontKnowBtn.addEventListener("click", () => markCurrentCard("dontKnow"));
  els.exportBtn.addEventListener("click", exportProgress);
  els.clearProgressBtn.addEventListener("click", clearProgress);

  els.tabs.forEach((tab) => {
    tab.addEventListener("click", () => setView(tab.dataset.view));
  });

  document.addEventListener("keydown", (event) => {
    if (event.target.matches("input, select, textarea")) return;
    if (event.key === "ArrowRight") nextCard();
    if (event.key === "ArrowLeft") previousCard();
    if (event.key.toLowerCase() === "f") flipCard();
    if (event.key === "1") markCurrentCard("dontKnow");
    if (event.key === "2") markCurrentCard("known");
  });
}

function handleFileImport(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = parseCsv(String(reader.result || ""));
      if (!imported.length) throw new Error("No vocabulary rows found.");
      state.deck = imported.map(normalizeCard).filter((card) => card.term && card.definition);
      state.currentIndex = 0;
      state.isFlipped = false;
      saveState();
      refreshAll();
    } catch (error) {
      alert(error.message || "Could not import that CSV.");
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsText(file);
}

function parseCsv(csv) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const next = csv[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }

  const cleanRows = rows
    .map((csvRow) => csvRow.map((cell) => cell.trim()))
    .filter((csvRow) => csvRow.some(Boolean));

  const headers = cleanRows.shift()?.map((header) => header.toLowerCase()) || [];
  const hasHeaders = headers.some((header) => ["term", "word", "definition", "meaning"].includes(header));

  if (!hasHeaders) {
    return [headers, ...cleanRows].map((csvRow) => ({
      term: csvRow[0],
      definition: csvRow[1],
      tier: csvRow[2] || "Unsorted",
      example: csvRow[3] || ""
    }));
  }

  return cleanRows.map((csvRow) => {
    const values = Object.fromEntries(headers.map((header, index) => [header, csvRow[index] || ""]));
    return {
      term: values.term || values.word || values.vocabulary || "",
      definition: values.definition || values.meaning || values.back || "",
      tier: values.tier || values.level || values.group || "Unsorted",
      example: values.example || values.sentence || ""
    };
  });
}

function normalizeCard(card, index = 0) {
  const term = String(card.term || "").trim();
  const definition = String(card.definition || "").trim();
  const tier = String(card.tier || "Unsorted").trim() || "Unsorted";
  const example = String(card.example || "").trim();
  return {
    id: slugify(`${term}-${definition}`) || `card-${index}`,
    term,
    definition,
    tier,
    example
  };
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function refreshAll() {
  populateTierFilter();
  applyFilters();
  renderCard();
  renderMeter();
  renderLibrary();
  renderDashboard();
}

function populateTierFilter() {
  const selected = state.filters.tier;
  const tiers = [...new Set(state.deck.map((card) => card.tier))].sort((a, b) => a.localeCompare(b));
  els.tierFilter.innerHTML = '<option value="all">All tiers</option>';
  tiers.forEach((tier) => {
    const option = document.createElement("option");
    option.value = tier;
    option.textContent = tier;
    els.tierFilter.append(option);
  });
  els.tierFilter.value = tiers.includes(selected) ? selected : "all";
  state.filters.tier = els.tierFilter.value;
}

function applyFilters() {
  const { tier, status, search } = state.filters;
  state.filteredDeck = state.deck.filter((card) => {
    const progress = state.progress[card.id]?.status || "unknown";
    const matchesTier = tier === "all" || card.tier === tier;
    const matchesStatus = status === "all" || progress === status;
    const searchable = `${card.term} ${card.definition} ${card.example}`.toLowerCase();
    const matchesSearch = !search || searchable.includes(search);
    return matchesTier && matchesStatus && matchesSearch;
  });

  if (state.currentIndex >= state.filteredDeck.length) {
    state.currentIndex = Math.max(state.filteredDeck.length - 1, 0);
  }
}

function renderCard() {
  const card = getCurrentCard();
  els.flashcard.classList.toggle("is-flipped", state.isFlipped);

  if (!card) {
    els.currentTier.textContent = state.deck.length ? "No matching cards" : "No deck loaded";
    els.cardCounter.textContent = "0 cards";
    els.cardTerm.textContent = state.deck.length ? "No matches" : "Import a CSV to begin";
    els.cardDefinition.textContent = state.deck.length ? "Try changing the filters." : "Your words will appear here.";
    els.cardExample.textContent = "";
    syncAnswerButtons();
    return;
  }

  els.currentTier.textContent = card.tier;
  els.cardCounter.textContent = `${state.currentIndex + 1} / ${state.filteredDeck.length}`;
  els.cardTerm.textContent = card.term;
  els.cardDefinition.textContent = card.definition;
  els.cardExample.textContent = card.example ? `Example: ${card.example}` : "";
  syncAnswerButtons();
}

function renderMeter() {
  const total = state.filteredDeck.length;
  const marked = state.filteredDeck.filter((card) => state.progress[card.id]?.status).length;
  const percent = total ? Math.round((marked / total) * 100) : 0;
  els.meterLabel.textContent = `${marked} of ${total}`;
  els.meterPercent.textContent = `${percent}%`;
  els.meterBar.style.width = `${percent}%`;
}

function renderLibrary() {
  els.wordList.innerHTML = "";

  if (!state.filteredDeck.length) {
    els.wordList.innerHTML = '<div class="empty-state">No words match the current filters.</div>';
    return;
  }

  const fragment = document.createDocumentFragment();
  state.filteredDeck.forEach((card) => {
    const item = els.wordItemTemplate.content.firstElementChild.cloneNode(true);
    const status = state.progress[card.id]?.status || "unknown";
    item.querySelector("h3").textContent = card.term;
    item.querySelector("p").textContent = card.definition;
    item.querySelector(".tier-pill").textContent = card.tier;
    const statusPill = item.querySelector(".status-pill");
    statusPill.textContent = statusLabel(status);
    statusPill.classList.add(status);
    fragment.append(item);
  });
  els.wordList.append(fragment);
}

function renderDashboard() {
  const total = state.deck.length;
  const known = state.deck.filter((card) => state.progress[card.id]?.status === "known").length;
  const dontKnow = state.deck.filter((card) => state.progress[card.id]?.status === "dontKnow").length;
  const mastery = total ? Math.round((known / total) * 100) : 0;

  els.totalWords.textContent = total;
  els.knownWords.textContent = known;
  els.dontKnowWords.textContent = dontKnow;
  els.masteryRate.textContent = `${mastery}%`;
  renderTierChart();
}

function renderTierChart() {
  els.tierChart.innerHTML = "";
  if (!state.deck.length) {
    els.tierChart.innerHTML = '<div class="empty-state">Import words to see a breakdown.</div>';
    return;
  }

  const totals = state.deck.reduce((acc, card) => {
    acc[card.tier] = (acc[card.tier] || 0) + 1;
    return acc;
  }, {});
  const max = Math.max(...Object.values(totals));
  const fragment = document.createDocumentFragment();

  Object.entries(totals)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([tier, count]) => {
      const row = document.createElement("div");
      row.className = "tier-row";
      row.innerHTML = `
        <span>${escapeHtml(tier)}</span>
        <div class="tier-bar"><span style="width: ${(count / max) * 100}%"></span></div>
        <strong>${count}</strong>
      `;
      fragment.append(row);
    });

  els.tierChart.append(fragment);
}

function syncAnswerButtons() {
  const card = getCurrentCard();
  const status = card ? state.progress[card.id]?.status : "";
  els.knowBtn.classList.toggle("is-selected", status === "known");
  els.dontKnowBtn.classList.toggle("is-selected", status === "dontKnow");
}

function getCurrentCard() {
  return state.filteredDeck[state.currentIndex] || null;
}

function flipCard() {
  if (!getCurrentCard()) return;
  state.isFlipped = !state.isFlipped;
  renderCard();
}

function nextCard() {
  if (!state.filteredDeck.length) return;
  state.currentIndex = (state.currentIndex + 1) % state.filteredDeck.length;
  state.isFlipped = false;
  renderCard();
  renderMeter();
}

function previousCard() {
  if (!state.filteredDeck.length) return;
  state.currentIndex = (state.currentIndex - 1 + state.filteredDeck.length) % state.filteredDeck.length;
  state.isFlipped = false;
  renderCard();
  renderMeter();
}

function markCurrentCard(status) {
  const card = getCurrentCard();
  if (!card) return;

  state.progress[card.id] = {
    status,
    updatedAt: new Date().toISOString(),
    reviews: (state.progress[card.id]?.reviews || 0) + 1
  };
  saveState();
  syncAnswerButtons();
  renderMeter();
  renderLibrary();
  renderDashboard();
  window.setTimeout(nextCard, 180);
}

function setView(viewId) {
  els.tabs.forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.view === viewId);
  });
  els.views.forEach((view) => {
    view.classList.toggle("is-active", view.id === viewId);
  });
}

function clearProgress() {
  if (!confirm("Reset all saved Know / Don't Know marks?")) return;
  state.progress = {};
  saveState();
  refreshAll();
}

function exportProgress() {
  const rows = [["term", "definition", "tier", "example", "status", "reviews", "updatedAt"]];
  state.deck.forEach((card) => {
    const progress = state.progress[card.id] || {};
    rows.push([
      card.term,
      card.definition,
      card.tier,
      card.example,
      progress.status || "",
      progress.reviews || 0,
      progress.updatedAt || ""
    ]);
  });

  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "vocab-progress.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      deck: state.deck,
      progress: state.progress
    })
  );
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    state.deck = Array.isArray(saved.deck) ? saved.deck.map(normalizeCard) : [];
    state.progress = saved.progress || {};
  } catch {
    state.deck = [];
    state.progress = {};
  }
}

function shuffle(cards) {
  const copy = [...cards];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function statusLabel(status) {
  if (status === "known") return "Know";
  if (status === "dontKnow") return "Don't know";
  return "Not marked";
}

function csvEscape(value) {
  const stringValue = String(value ?? "");
  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

init();
