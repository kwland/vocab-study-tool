const STORAGE_KEY = "vocabDeck.v2";
const OLD_STORAGE_KEY = "vocabDeck.v1";
const DAY_MS = 24 * 60 * 60 * 1000;

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
    term: "Implicit",
    definition: "Suggested or understood without being directly stated.",
    tier: "Tier 2",
    example: "The author's implicit criticism appears in the final paragraph."
  },
  {
    term: "Explicit",
    definition: "Stated clearly and directly.",
    tier: "Tier 2",
    example: "The rubric gives explicit instructions for each response."
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
  },
  {
    term: "Exacerbate",
    definition: "To make a problem, bad situation, or negative feeling worse.",
    tier: "Tier 3",
    example: "Ignoring the leak will exacerbate the damage."
  }
];

const confusingPairs = [
  ["implicit", "explicit"],
  ["mitigate", "exacerbate"],
  ["infer", "imply"],
  ["affect", "effect"],
  ["elicit", "illicit"],
  ["eminent", "imminent"],
  ["compliment", "complement"],
  ["precede", "proceed"],
  ["ambivalent", "indifferent"],
  ["tenuous", "tenacious"],
  ["adapt", "adopt"],
  ["averse", "adverse"]
];

const defaultSettings = {
  dailyGoal: 20,
  learnMode: "written",
  hardOnly: false,
  answerSide: "term",
  sessionSize: 20,
  sessionIds: []
};

const state = {
  deck: [],
  progress: {},
  settings: { ...defaultSettings },
  filteredDeck: [],
  currentIndex: 0,
  isFlipped: false,
  filters: {
    tier: "all",
    status: "all",
    search: ""
  },
  learn: {
    currentCard: null,
    options: [],
    answered: false,
    lastAnsweredCard: null
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
  dueWords: document.querySelector("#dueWords"),
  todayReviews: document.querySelector("#todayReviews"),
  reviewStreak: document.querySelector("#reviewStreak"),
  hardWords: document.querySelector("#hardWords"),
  tierChart: document.querySelector("#tierChart"),
  wordItemTemplate: document.querySelector("#wordItemTemplate"),
  tabs: document.querySelectorAll(".tab"),
  views: document.querySelectorAll(".view"),
  learnModeButtons: document.querySelectorAll("[data-learn-mode]"),
  answerSideButtons: document.querySelectorAll("[data-answer-side]"),
  hardOnlyToggle: document.querySelector("#hardOnlyToggle"),
  sessionSizeInput: document.querySelector("#sessionSizeInput"),
  sessionDownBtn: document.querySelector("#sessionDownBtn"),
  sessionUpBtn: document.querySelector("#sessionUpBtn"),
  startSessionBtn: document.querySelector("#startSessionBtn"),
  clearSessionBtn: document.querySelector("#clearSessionBtn"),
  sessionCountLabel: document.querySelector("#sessionCountLabel"),
  dailyGoalInput: document.querySelector("#dailyGoalInput"),
  goalDownBtn: document.querySelector("#goalDownBtn"),
  goalUpBtn: document.querySelector("#goalUpBtn"),
  todayGoalLabel: document.querySelector("#todayGoalLabel"),
  todayGoalBar: document.querySelector("#todayGoalBar"),
  confusingPairText: document.querySelector("#confusingPairText"),
  learnMeta: document.querySelector("#learnMeta"),
  learnDueCount: document.querySelector("#learnDueCount"),
  questionTypeLabel: document.querySelector("#questionTypeLabel"),
  questionPrompt: document.querySelector("#questionPrompt"),
  questionClue: document.querySelector("#questionClue"),
  writtenForm: document.querySelector("#writtenForm"),
  writtenAnswer: document.querySelector("#writtenAnswer"),
  choiceGrid: document.querySelector("#choiceGrid"),
  feedbackBox: document.querySelector("#feedbackBox"),
  feedbackTitle: document.querySelector("#feedbackTitle"),
  feedbackDetail: document.querySelector("#feedbackDetail"),
  overrideIncorrectBtn: document.querySelector("#overrideIncorrectBtn"),
  overrideCorrectBtn: document.querySelector("#overrideCorrectBtn"),
  skipLearnBtn: document.querySelector("#skipLearnBtn"),
  nextQuestionBtn: document.querySelector("#nextQuestionBtn")
};

function init() {
  loadState();
  if (!state.deck.length) {
    state.deck = sampleDeck.map(normalizeCard);
  }
  hydrateSettingsControls();
  bindEvents();
  refreshAll();
  nextLearnQuestion();
}

function bindEvents() {
  els.csvFile.addEventListener("change", handleFileImport);
  els.loadSampleBtn.addEventListener("click", () => {
    state.deck = sampleDeck.map(normalizeCard);
    state.settings.sessionIds = [];
    state.currentIndex = 0;
    state.isFlipped = false;
    saveState();
    refreshAll();
    nextLearnQuestion();
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
    tab.addEventListener("click", () => {
      setView(tab.dataset.view);
      if (tab.dataset.view === "learn" && !state.learn.currentCard) nextLearnQuestion();
    });
  });

  els.learnModeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.settings.learnMode = button.dataset.learnMode;
      saveState();
      syncLearnModeButtons();
      nextLearnQuestion();
    });
  });

  els.answerSideButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.settings.answerSide = button.dataset.answerSide;
      saveState();
      syncAnswerSideButtons();
      nextLearnQuestion();
    });
  });

  els.hardOnlyToggle.addEventListener("change", (event) => {
    state.settings.hardOnly = event.target.checked;
    saveState();
    nextLearnQuestion();
  });

  els.sessionSizeInput.addEventListener("change", (event) => {
    updateSessionSize(Number(event.target.value));
  });
  els.sessionDownBtn.addEventListener("click", () => updateSessionSize(state.settings.sessionSize - 1));
  els.sessionUpBtn.addEventListener("click", () => updateSessionSize(state.settings.sessionSize + 1));
  els.startSessionBtn.addEventListener("click", startLimitedSession);
  els.clearSessionBtn.addEventListener("click", clearLimitedSession);
  els.dailyGoalInput.addEventListener("change", (event) => {
    updateDailyGoal(Number(event.target.value));
  });
  els.goalDownBtn.addEventListener("click", () => updateDailyGoal(state.settings.dailyGoal - 1));
  els.goalUpBtn.addEventListener("click", () => updateDailyGoal(state.settings.dailyGoal + 1));
  els.writtenForm.addEventListener("submit", handleWrittenSubmit);
  els.overrideIncorrectBtn.addEventListener("click", () => overrideLastAnswer(false));
  els.overrideCorrectBtn.addEventListener("click", () => overrideLastAnswer(true));
  els.skipLearnBtn.addEventListener("click", nextLearnQuestion);
  els.nextQuestionBtn.addEventListener("click", nextLearnQuestion);

  document.addEventListener("keydown", (event) => {
    if (event.target.matches("input, select, textarea")) return;
    if (document.querySelector("#study").classList.contains("is-active")) {
      if (event.key === "ArrowRight") nextCard();
      if (event.key === "ArrowLeft") previousCard();
      if (event.key.toLowerCase() === "f") flipCard();
      if (event.key === "1") markCurrentCard("dontKnow");
      if (event.key === "2") markCurrentCard("known");
    }
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
      state.settings.sessionIds = [];
      state.currentIndex = 0;
      state.isFlipped = false;
      state.learn.currentCard = null;
      saveState();
      refreshAll();
      nextLearnQuestion();
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
  renderLearnStats();
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
    const progress = getProgress(card.id);
    const statusValue = progress.status || "unknown";
    const matchesTier = tier === "all" || card.tier === tier;
    const matchesStatus = status === "all" || statusValue === status;
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
  const marked = state.filteredDeck.filter((card) => getProgress(card.id).status).length;
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
    const progress = getProgress(card.id);
    item.dataset.cardId = card.id;
    item.querySelector("h3").textContent = card.term;
    item.querySelector("p").textContent = card.definition;
    item.querySelector(".tier-pill").textContent = card.tier;
    const statusPill = item.querySelector(".status-pill");
    statusPill.textContent = statusLabel(progress.status || "unknown");
    statusPill.classList.add(progress.status || "unknown");
    item.querySelectorAll("[data-card-action]").forEach((button) => {
      button.addEventListener("click", () => markSpecificCard(card.id, button.dataset.cardAction));
    });
    fragment.append(item);
  });
  els.wordList.append(fragment);
}

function renderDashboard() {
  const total = state.deck.length;
  const known = state.deck.filter((card) => getProgress(card.id).status === "known").length;
  const dontKnow = state.deck.filter((card) => getProgress(card.id).status === "dontKnow").length;
  const mastery = total ? Math.round((known / total) * 100) : 0;
  const due = state.deck.filter(isDue).length;
  const hard = state.deck.filter(isHardCard).length;
  const today = getTodayReviews();

  els.totalWords.textContent = total;
  els.knownWords.textContent = known;
  els.dontKnowWords.textContent = dontKnow;
  els.masteryRate.textContent = `${mastery}%`;
  els.dueWords.textContent = due;
  els.todayReviews.textContent = today;
  els.reviewStreak.textContent = `${getReviewStreak()}`;
  els.hardWords.textContent = hard;
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
  const status = card ? getProgress(card.id).status : "";
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

  markCardStatus(card.id, status, true);
  window.setTimeout(nextCard, 180);
}

function markSpecificCard(cardId, status) {
  markCardStatus(cardId, status, false);
  if (state.learn.currentCard?.id === cardId) renderLearnQuestion();
}

function markCardStatus(cardId, status, countReview) {
  const progress = getProgress(cardId);
  progress.status = status;
  progress.updatedAt = new Date().toISOString();
  progress.lastReviewedAt = progress.updatedAt;
  if (countReview) progress.reviews = (progress.reviews || 0) + 1;
  saveState();
  syncAnswerButtons();
  renderMeter();
  renderLibrary();
  renderDashboard();
  renderLearnStats();
}

function nextLearnQuestion() {
  const card = selectLearnCard();
  state.learn.currentCard = card;
  state.learn.answered = false;
  state.learn.options = card ? buildChoices(card) : [];
  renderLearnQuestion();
}

function selectLearnCard() {
  const pool = getLearnPool();
  if (!pool.length) return state.deck[0] || null;

  const currentId = state.learn.currentCard?.id;
  const sorted = [...pool].sort((a, b) => getPriorityScore(b) - getPriorityScore(a));
  const weighted = [];
  sorted.forEach((card, index) => {
    const weight = Math.max(1, Math.round(getPriorityScore(card)) + (index < 4 ? 2 : 0));
    for (let count = 0; count < weight; count += 1) weighted.push(card);
  });

  const candidates = shuffle(weighted).filter((card) => card.id !== currentId);
  return candidates[0] || sorted[0] || null;
}

function getLearnPool() {
  const sessionIds = new Set(state.settings.sessionIds || []);
  return state.deck.filter((card) => {
    const inSession = !sessionIds.size || sessionIds.has(card.id);
    const passesHardFilter = !state.settings.hardOnly || isHardCard(card);
    return inSession && passesHardFilter;
  });
}

function renderLearnQuestion() {
  const card = state.learn.currentCard;
  renderLearnStats();
  clearFeedback();
  els.choiceGrid.innerHTML = "";
  els.writtenAnswer.value = "";

  syncLearnModeButtons();
  els.hardOnlyToggle.checked = state.settings.hardOnly;
  els.dailyGoalInput.value = state.settings.dailyGoal;

  if (!card) {
    els.learnMeta.textContent = "No deck loaded";
    els.questionTypeLabel.textContent = "Learn";
    els.questionPrompt.textContent = "Import a CSV to start learning.";
    els.questionClue.textContent = "The sample deck is also available from the Study screen.";
    els.writtenForm.style.display = "none";
    els.choiceGrid.style.display = "none";
    els.confusingPairText.textContent = "Practice will flag common look-alikes when they appear.";
    return;
  }

  const progress = getProgress(card.id);
  const mode = state.settings.learnMode;
  const answerSide = getActiveAnswerSide();
  const dueText = isDue(card) ? "Due now" : `Due ${formatDue(progress.dueAt)}`;
  els.learnMeta.textContent = `${card.tier} - ${dueText} - ${answerSide === "term" ? "Answer term" : "Answer definition"}`;

  if (mode === "written") {
    els.questionTypeLabel.textContent = "Written answer";
    els.questionPrompt.textContent = getQuestionPrompt(card);
    els.questionClue.textContent = answerSide === "term"
      ? "Type the vocabulary word. Case and punctuation do not matter."
      : "Type the definition in your own words. Key meaning words matter most.";
    els.writtenAnswer.placeholder = answerSide === "term" ? "Type the vocabulary word" : "Type the definition";
    els.writtenForm.style.display = "grid";
    els.choiceGrid.style.display = "none";
    window.setTimeout(() => els.writtenAnswer.focus(), 0);
  } else {
    els.questionTypeLabel.textContent = mode === "sat" ? "SAT-style blank" : "Multiple choice";
    els.questionPrompt.textContent = mode === "sat" ? makeBlankSentence(card) : getQuestionPrompt(card);
    els.questionClue.textContent = mode === "sat"
      ? card.definition
      : answerSide === "term"
        ? "Choose the term that matches this definition."
        : "Choose the definition that matches this term.";
    els.writtenForm.style.display = "none";
    els.choiceGrid.style.display = "grid";
    renderChoices(card);
  }

  const pair = getConfusingPair(card);
  els.confusingPairText.textContent = pair
    ? `${card.term} is commonly confused with ${pair}. Watch the direction of the meaning.`
    : "No common confusing pair detected for this word.";
}

function renderChoices(card) {
  els.choiceGrid.innerHTML = "";
  state.learn.options.forEach((option) => {
    const button = document.createElement("button");
    button.className = "choice-button";
    button.type = "button";
    button.textContent = getAnswerText(option);
    button.dataset.answer = getAnswerText(option);
    button.addEventListener("click", () => handleChoiceAnswer(card, button.dataset.answer, button));
    els.choiceGrid.append(button);
  });
}

function getActiveAnswerSide() {
  return state.settings.learnMode === "sat" ? "term" : state.settings.answerSide;
}

function getQuestionPrompt(card) {
  return getActiveAnswerSide() === "term" ? card.definition : card.term;
}

function getAnswerText(card) {
  return getActiveAnswerSide() === "term" ? card.term : card.definition;
}

function getCorrectAnswer(card) {
  return getAnswerText(card);
}

function handleWrittenSubmit(event) {
  event.preventDefault();
  const card = state.learn.currentCard;
  if (!card || state.learn.answered) return;

  const answer = els.writtenAnswer.value;
  const isCorrect = isAnswerCorrect(answer, getCorrectAnswer(card), card);
  recordLearnAnswer(card, isCorrect);
  showFeedback(isCorrect, card, answer);
}

function handleChoiceAnswer(card, selectedAnswer, selectedButton) {
  if (state.learn.answered) return;
  const isCorrect = normalizeAnswer(selectedAnswer) === normalizeAnswer(getCorrectAnswer(card));
  recordLearnAnswer(card, isCorrect);

  els.choiceGrid.querySelectorAll(".choice-button").forEach((button) => {
    const buttonIsCorrect = normalizeAnswer(button.dataset.answer) === normalizeAnswer(getCorrectAnswer(card));
    button.disabled = true;
    if (buttonIsCorrect) button.classList.add("correct");
  });
  if (!isCorrect) selectedButton.classList.add("incorrect");
  showFeedback(isCorrect, card, selectedAnswer);
}

function recordLearnAnswer(card, isCorrect) {
  const progress = getProgress(card.id);
  const now = new Date();
  progress.reviews = (progress.reviews || 0) + 1;
  progress.learnReviews = (progress.learnReviews || 0) + 1;
  applyAnswerResult(progress, isCorrect, now);
  if (isCorrect) adjustActivity(now, 1);
  state.learn.answered = true;
  state.learn.lastAnsweredCard = {
    id: card.id,
    originalCorrect: isCorrect,
    countedCorrect: isCorrect
  };
  saveState();
  refreshAll();
  playAnswerAnimation(isCorrect);
}

function applyAnswerResult(progress, isCorrect, now) {
  const nowIso = now.toISOString();
  const previousInterval = Number(progress.intervalDays || 0);
  const previousEase = Number(progress.ease || 2.3);

  progress.correct = (progress.correct || 0) + (isCorrect ? 1 : 0);
  progress.incorrect = (progress.incorrect || 0) + (isCorrect ? 0 : 1);
  progress.lastAnswerCorrect = isCorrect;
  progress.lastReviewedAt = nowIso;
  progress.updatedAt = nowIso;
  progress.status = isCorrect ? "known" : "dontKnow";

  if (isCorrect) {
    const nextInterval = previousInterval < 1 ? 1 : Math.ceil(previousInterval * previousEase);
    progress.intervalDays = Math.min(nextInterval, 120);
    progress.ease = Math.min(previousEase + 0.12, 3);
    progress.dueAt = new Date(now.getTime() + progress.intervalDays * DAY_MS).toISOString();
  } else {
    progress.intervalDays = 0;
    progress.ease = Math.max(previousEase - 0.22, 1.3);
    progress.dueAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString();
  }
}

function showFeedback(isCorrect, card, submittedAnswer) {
  els.feedbackBox.hidden = false;
  els.feedbackBox.classList.toggle("correct", isCorrect);
  els.feedbackBox.classList.toggle("incorrect", !isCorrect);
  els.feedbackTitle.textContent = isCorrect ? "Correct" : "Not quite";
  els.feedbackDetail.textContent = isCorrect
    ? `${card.term}: ${card.definition}`
    : `You answered "${String(submittedAnswer || "").trim() || "blank"}". Correct answer: ${sentenceWithPeriod(getCorrectAnswer(card))} ${card.term}: ${card.definition}`;
}

function overrideLastAnswer(isCorrect) {
  const card = state.learn.lastAnsweredCard
    ? state.deck.find((candidate) => candidate.id === state.learn.lastAnsweredCard.id)
    : state.learn.currentCard;
  if (!card) return;

  const progress = getProgress(card.id);
  const previous = progress.lastAnswerCorrect;
  if (previous === true) progress.correct = Math.max(0, (progress.correct || 0) - 1);
  if (previous === false) progress.incorrect = Math.max(0, (progress.incorrect || 0) - 1);
  const now = new Date();
  applyAnswerResult(progress, isCorrect, now);
  if (previous !== isCorrect) {
    adjustActivity(now, isCorrect ? 1 : -1);
  }
  state.learn.answered = true;
  state.learn.lastAnsweredCard = { id: card.id, originalCorrect: isCorrect, countedCorrect: isCorrect };
  saveState();
  refreshAll();
  showFeedback(isCorrect, card, "manual override");
  playAnswerAnimation(isCorrect);
}

function clearFeedback() {
  els.feedbackBox.hidden = true;
  els.feedbackBox.classList.remove("correct", "incorrect");
  els.feedbackTitle.textContent = "";
  els.feedbackDetail.textContent = "";
}

function playAnswerAnimation(isCorrect) {
  const card = document.querySelector(".question-card");
  if (!card) return;

  card.classList.remove("answer-correct", "answer-incorrect");
  void card.offsetWidth;
  card.classList.add(isCorrect ? "answer-correct" : "answer-incorrect");

  if (!isCorrect || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const burst = document.createElement("div");
  burst.className = "success-burst";
  for (let index = 0; index < 14; index += 1) {
    const particle = document.createElement("span");
    particle.style.setProperty("--angle", `${(360 / 14) * index}deg`);
    particle.style.setProperty("--distance", `${58 + (index % 4) * 12}px`);
    particle.style.setProperty("--delay", `${index * 14}ms`);
    burst.append(particle);
  }
  card.append(burst);
  window.setTimeout(() => burst.remove(), 900);
}

function buildChoices(card) {
  const byId = new Map();
  byId.set(card.id, card);

  const confusingTerm = getConfusingPair(card);
  if (confusingTerm) {
    const confusingCard = state.deck.find((candidate) => normalizeAnswer(candidate.term) === normalizeAnswer(confusingTerm));
    if (confusingCard) byId.set(confusingCard.id, confusingCard);
  }

  const scored = state.deck
    .filter((candidate) => candidate.id !== card.id)
    .map((candidate) => ({
      card: candidate,
      score: getDistractorScore(card, candidate)
    }))
    .sort((a, b) => b.score - a.score);

  scored.forEach(({ card: candidate }) => {
    if (byId.size < 4) byId.set(candidate.id, candidate);
  });

  return shuffle([...byId.values()]).slice(0, Math.min(4, state.deck.length));
}

function getDistractorScore(card, candidate) {
  let score = 0;
  if (card.tier === candidate.tier) score += 5;
  score += Math.max(0, 6 - Math.abs(card.term.length - candidate.term.length));
  score += sharedPrefixLength(card.term, candidate.term);
  score += sharedLetters(card.term, candidate.term) / 3;
  if (getConfusingPair(card) && normalizeAnswer(getConfusingPair(card)) === normalizeAnswer(candidate.term)) score += 20;
  return score;
}

function makeBlankSentence(card) {
  if (card.example && includesTerm(card.example, card.term)) {
    return card.example.replace(new RegExp(`\\b${escapeRegExp(card.term)}\\b`, "i"), "_____");
  }
  if (card.example) {
    return `${card.example} Which word best captures this idea?`;
  }
  return `The most precise word for "${card.definition}" is _____.`;
}

function includesTerm(sentence, term) {
  return new RegExp(`\\b${escapeRegExp(term)}\\b`, "i").test(sentence);
}

function isAnswerCorrect(answer, correctAnswer, card) {
  const normalizedAnswer = normalizeAnswer(answer);
  const normalizedCorrect = normalizeAnswer(correctAnswer);
  if (!normalizedAnswer) return false;
  if (normalizedAnswer === normalizedCorrect) return true;
  if (getActiveAnswerSide() === "term") {
    return normalizedCorrect.length >= 6 && levenshtein(normalizedAnswer, normalizedCorrect) <= 1;
  }
  return definitionSimilarity(normalizedAnswer, normalizeAnswer(card.definition)) >= 0.58;
}

function definitionSimilarity(answer, definition) {
  const answerWords = importantWords(answer);
  const definitionWords = importantWords(definition);
  if (!answerWords.length || !definitionWords.length) return 0;
  const matches = definitionWords.filter((word) => answerWords.includes(word)).length;
  return matches / definitionWords.length;
}

function importantWords(value) {
  const stopWords = new Set([
    "a",
    "an",
    "and",
    "are",
    "as",
    "be",
    "being",
    "for",
    "in",
    "is",
    "it",
    "of",
    "or",
    "the",
    "to",
    "very",
    "with"
  ]);
  return normalizeAnswer(value)
    .split(" ")
    .filter((word) => word.length > 2 && !stopWords.has(word));
}

function normalizeAnswer(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getProgress(cardId) {
  if (!state.progress[cardId]) {
    state.progress[cardId] = {
      status: "unknown",
      reviews: 0,
      learnReviews: 0,
      correct: 0,
      incorrect: 0,
      intervalDays: 0,
      ease: 2.3,
      dueAt: null,
      updatedAt: null
    };
  }
  return state.progress[cardId];
}

function isDue(card) {
  const progress = getProgress(card.id);
  return !progress.dueAt || new Date(progress.dueAt).getTime() <= Date.now();
}

function isHardCard(card) {
  const progress = getProgress(card.id);
  const attempts = (progress.correct || 0) + (progress.incorrect || 0);
  const accuracy = attempts ? progress.correct / attempts : 0;
  return progress.status === "dontKnow" || progress.incorrect > progress.correct || (attempts > 0 && accuracy < 0.7) || isDue(card);
}

function getPriorityScore(card) {
  const progress = getProgress(card.id);
  const dueBoost = isDue(card) ? 5 : 0;
  const weakBoost = (progress.incorrect || 0) * 3 - (progress.correct || 0);
  const statusBoost = progress.status === "dontKnow" ? 4 : progress.status === "known" ? 0 : 2;
  const hardBoost = isHardCard(card) ? 2 : 0;
  return Math.max(1, dueBoost + weakBoost + statusBoost + hardBoost);
}

function getConfusingPair(card) {
  const term = normalizeAnswer(card.term);
  const pair = confusingPairs.find(([first, second]) => first === term || second === term);
  if (!pair) return "";
  return pair[0] === term ? titleCase(pair[1]) : titleCase(pair[0]);
}

function adjustActivity(date, delta) {
  const key = dayKey(date);
  if (!state.progress.__activity) state.progress.__activity = {};
  state.progress.__activity[key] = Math.max(0, (state.progress.__activity[key] || 0) + delta);
  if (state.progress.__activity[key] === 0) delete state.progress.__activity[key];
}

function getTodayReviews() {
  return state.progress.__activity?.[dayKey(new Date())] || 0;
}

function getReviewStreak() {
  const activity = state.progress.__activity || {};
  let streak = 0;
  let cursor = startOfDay(new Date());

  while ((activity[dayKey(cursor)] || 0) > 0) {
    streak += 1;
    cursor = new Date(cursor.getTime() - DAY_MS);
  }

  return streak;
}

function renderLearnStats() {
  const today = getTodayReviews();
  const goal = state.settings.dailyGoal;
  const percent = Math.min(100, Math.round((today / goal) * 100));
  const sessionIds = new Set(state.settings.sessionIds || []);
  const due = getLearnPool().filter(isDue).length;
  els.todayGoalLabel.textContent = `${today} / ${goal}`;
  els.todayGoalBar.style.width = `${percent}%`;
  els.learnDueCount.textContent = `${due} due`;
  els.sessionCountLabel.textContent = sessionIds.size ? `${sessionIds.size} selected` : "All cards";
}

function hydrateSettingsControls() {
  els.dailyGoalInput.value = state.settings.dailyGoal;
  els.sessionSizeInput.value = state.settings.sessionSize;
  els.hardOnlyToggle.checked = state.settings.hardOnly;
  syncLearnModeButtons();
  syncAnswerSideButtons();
}

function syncLearnModeButtons() {
  els.learnModeButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.learnMode === state.settings.learnMode);
  });
}

function syncAnswerSideButtons() {
  els.answerSideButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.answerSide === state.settings.answerSide);
  });
}

function updateSessionSize(value) {
  state.settings.sessionSize = Math.max(1, Math.min(200, Number.isFinite(value) ? Math.round(value) : 20));
  els.sessionSizeInput.value = state.settings.sessionSize;
  saveState();
  renderLearnStats();
}

function startLimitedSession() {
  updateSessionSize(Number(els.sessionSizeInput.value));
  const pool = state.deck.filter((card) => !state.settings.hardOnly || isHardCard(card));
  const sorted = shuffle([...pool].sort((a, b) => getPriorityScore(b) - getPriorityScore(a)));
  const picked = sorted.slice(0, Math.min(state.settings.sessionSize, sorted.length));
  state.settings.sessionIds = picked.map((card) => card.id);
  saveState();
  nextLearnQuestion();
}

function clearLimitedSession() {
  state.settings.sessionIds = [];
  saveState();
  nextLearnQuestion();
}

function updateDailyGoal(value) {
  state.settings.dailyGoal = Math.max(1, Math.min(200, Number.isFinite(value) ? Math.round(value) : 20));
  els.dailyGoalInput.value = state.settings.dailyGoal;
  saveState();
  renderLearnStats();
  renderDashboard();
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
  if (!confirm("Reset all saved study progress, streaks, and spaced repetition data?")) return;
  state.progress = {};
  saveState();
  refreshAll();
  nextLearnQuestion();
}

function exportProgress() {
  const rows = [[
    "term",
    "definition",
    "tier",
    "example",
    "status",
    "reviews",
    "learnReviews",
    "correct",
    "incorrect",
    "intervalDays",
    "ease",
    "dueAt",
    "updatedAt"
  ]];

  state.deck.forEach((card) => {
    const progress = getProgress(card.id);
    rows.push([
      card.term,
      card.definition,
      card.tier,
      card.example,
      progress.status || "",
      progress.reviews || 0,
      progress.learnReviews || 0,
      progress.correct || 0,
      progress.incorrect || 0,
      progress.intervalDays || 0,
      progress.ease || "",
      progress.dueAt || "",
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
      progress: state.progress,
      settings: state.settings
    })
  );
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || migrateOldState();
    state.deck = Array.isArray(saved.deck) ? saved.deck.map(normalizeCard) : [];
    state.progress = saved.progress || {};
    state.settings = { ...defaultSettings, ...(saved.settings || {}) };
    if (!Array.isArray(state.settings.sessionIds)) state.settings.sessionIds = [];
  } catch {
    state.deck = [];
    state.progress = {};
    state.settings = { ...defaultSettings };
  }
}

function migrateOldState() {
  const old = JSON.parse(localStorage.getItem(OLD_STORAGE_KEY) || "{}");
  if (!old.deck && !old.progress) return {};
  return {
    deck: old.deck || [],
    progress: old.progress || {},
    settings: { ...defaultSettings }
  };
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

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sharedPrefixLength(first, second) {
  const a = normalizeAnswer(first);
  const b = normalizeAnswer(second);
  let count = 0;
  while (count < a.length && count < b.length && a[count] === b[count]) count += 1;
  return count;
}

function sharedLetters(first, second) {
  const a = new Set(normalizeAnswer(first).replace(/\s/g, ""));
  const b = new Set(normalizeAnswer(second).replace(/\s/g, ""));
  return [...a].filter((letter) => b.has(letter)).length;
}

function levenshtein(first, second) {
  const a = normalizeAnswer(first);
  const b = normalizeAnswer(second);
  const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));

  for (let index = 0; index <= a.length; index += 1) matrix[index][0] = index;
  for (let index = 0; index <= b.length; index += 1) matrix[0][index] = index;

  for (let row = 1; row <= a.length; row += 1) {
    for (let column = 1; column <= b.length; column += 1) {
      const cost = a[row - 1] === b[column - 1] ? 0 : 1;
      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dayKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDue(dueAt) {
  if (!dueAt) return "now";
  const diff = new Date(dueAt).getTime() - Date.now();
  if (diff <= 0) return "now";
  const minutes = Math.ceil(diff / 60000);
  if (minutes < 60) return `in ${minutes} min`;
  const hours = Math.ceil(minutes / 60);
  if (hours < 24) return `in ${hours} hr`;
  return `in ${Math.ceil(hours / 24)} days`;
}

function titleCase(value) {
  return String(value).replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function sentenceWithPeriod(value) {
  const text = String(value || "").trim();
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

init();
