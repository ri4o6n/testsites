const STORAGE_KEY = "hangul-study-room-state-v1";

const LEVELS = [
  { id: "all", label: "すべてのレベル" },
  { id: "basic_vowel", label: "1. 基本母音" },
  { id: "basic_consonant", label: "2. 基本子音" },
  { id: "syllable", label: "3. 音節の組み立て" },
  { id: "advanced_sound", label: "4. 激音・濃音・複合母音" },
  { id: "batchim", label: "5. パッチム" },
  { id: "word", label: "6. 単語" },
  { id: "phrase", label: "7. 短文" }
];

const QUESTION_BANK = [
  { korean: "아", reading: "a", meaning: "ア", level: "basic_vowel", type: "syllable" },
  { korean: "어", reading: "eo", meaning: "オ", level: "basic_vowel", type: "syllable" },
  { korean: "오", reading: "o", meaning: "オ", level: "basic_vowel", type: "syllable" },
  { korean: "우", reading: "u", meaning: "ウ", level: "basic_vowel", type: "syllable" },
  { korean: "이", reading: "i", meaning: "イ", level: "basic_vowel", type: "syllable" },
  { korean: "가", reading: "ga", meaning: "ガ", level: "basic_consonant", type: "syllable" },
  { korean: "나", reading: "na", meaning: "ナ", level: "basic_consonant", type: "syllable" },
  { korean: "마", reading: "ma", meaning: "マ", level: "basic_consonant", type: "syllable" },
  { korean: "사", reading: "sa", meaning: "サ", level: "basic_consonant", type: "syllable" },
  { korean: "하", reading: "ha", meaning: "ハ", level: "basic_consonant", type: "syllable" },
  { korean: "바다", reading: "bada", meaning: "海", level: "syllable", type: "word" },
  { korean: "사과", reading: "sagwa", meaning: "りんご", level: "syllable", type: "word" },
  { korean: "우유", reading: "uyu", meaning: "牛乳", level: "syllable", type: "word" },
  { korean: "오이", reading: "oi", meaning: "きゅうり", level: "syllable", type: "word" },
  { korean: "학교", reading: "hakgyo", meaning: "学校", level: "advanced_sound", type: "word", readingVariants: ["hakkyo"] },
  { korean: "커피", reading: "keopi", meaning: "コーヒー", level: "advanced_sound", type: "word" },
  { korean: "짜다", reading: "jjada", meaning: "しょっぱい", level: "advanced_sound", type: "word" },
  { korean: "왜", reading: "wae", meaning: "なぜ", level: "advanced_sound", type: "syllable" },
  { korean: "한", reading: "han", meaning: "韓", level: "batchim", type: "syllable" },
  { korean: "밥", reading: "bap", meaning: "ごはん", level: "batchim", type: "word" },
  { korean: "문", reading: "mun", meaning: "ドア", level: "batchim", type: "word" },
  { korean: "한국", reading: "hanguk", meaning: "韓国", level: "batchim", type: "word", readingVariants: ["hangug"] },
  { korean: "책", reading: "chaek", meaning: "本", level: "batchim", type: "word" },
  { korean: "사람", reading: "saram", meaning: "人", level: "word", type: "word" },
  { korean: "오늘", reading: "oneul", meaning: "今日", level: "word", type: "word" },
  { korean: "친구", reading: "chingu", meaning: "友だち", level: "word", type: "word" },
  { korean: "감사합니다", reading: "gamsahamnida", meaning: "ありがとうございます", level: "phrase", type: "phrase", readingVariants: ["kamsahamnida"] },
  { korean: "안녕하세요", reading: "annyeonghaseyo", meaning: "こんにちは", level: "phrase", type: "phrase" },
  { korean: "물 주세요", reading: "mul juseyo", meaning: "水をください", level: "phrase", type: "phrase", readingVariants: ["muljuseyo"] },
  { korean: "한국어를 공부해요", reading: "hangugeoreul gongbuhaeyo", meaning: "韓国語を勉強します", level: "phrase", type: "phrase", readingVariants: ["hangukeoreul gongbuhaeyo"] }
];

const INITIALS = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
const VOWELS = ["ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ", "ㅙ", "ㅚ", "ㅛ", "ㅜ", "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ"];
const FINALS = ["", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ", "ㄻ", "ㄼ", "ㄽ", "ㄾ", "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];

const ROMAN_TOKEN_RULES = [
  ["kk", ["kk"]], ["tt", ["tt"]], ["pp", ["pp"]], ["ss", ["ss"]], ["jj", ["jj"]],
  ["ng", ["ng"]], ["yeo", ["yeo"]], ["yae", ["yae"]], ["wae", ["wae"]], ["ae", ["ae"]],
  ["eo", ["eo"]], ["ye", ["ye"]], ["ya", ["ya"]], ["yo", ["yo"]], ["yu", ["yu"]],
  ["wa", ["wa"]], ["wo", ["wo"]], ["we", ["we"]], ["wi", ["wi"]], ["oe", ["oe"]],
  ["ui", ["ui"]], ["eu", ["eu"]], ["ch", ["ch"]], ["sh", ["s"]],
  ["g", ["gk"]], ["k", ["gk"]], ["n", ["n"]], ["d", ["dt"]], ["t", ["dt"]],
  ["r", ["rl"]], ["l", ["rl"]], ["m", ["m"]], ["b", ["bp"]], ["p", ["bp"]],
  ["s", ["s"]], ["h", ["h"]], ["j", ["j"]], ["c", ["ch"]],
  ["a", ["a"]], ["e", ["e"]], ["i", ["i"]], ["o", ["o"]], ["u", ["u"]],
  ["w", ["w"]], ["y", ["y"]]
];

const TYPE_LABELS = { syllable: "文字", word: "単語", phrase: "短文" };
const AUTO_ADVANCE_DELAY_MS = 900;
const MOBILE_MEDIA_QUERY = "(max-width: 720px)";

const elements = {
  practicePanel: document.querySelector(".practice-panel"),
  sidebar: document.querySelector(".sidebar"),
  mobileTabs: [...document.querySelectorAll(".mobile-tab")],
  sidebarPanels: [...document.querySelectorAll(".sidebar-panel")],
  questionCard: document.querySelector(".question-card"),
  modeSelect: document.querySelector("#mode-select"),
  levelSelect: document.querySelector("#level-select"),
  reviewToggle: document.querySelector("#review-toggle"),
  questionBadge: document.querySelector("#question-badge"),
  questionMode: document.querySelector("#question-mode"),
  questionInstruction: document.querySelector("#question-instruction"),
  questionPrompt: document.querySelector("#question-prompt"),
  questionSupport: document.querySelector("#question-support"),
  answerForm: document.querySelector("#answer-form"),
  answerInput: document.querySelector("#answer-input"),
  newQuestionButton: document.querySelector("#new-question-button"),
  showAnswerButton: document.querySelector("#show-answer-button"),
  feedbackPanel: document.querySelector("#feedback-panel"),
  summaryGrid: document.querySelector("#summary-grid"),
  weaknessList: document.querySelector("#weakness-list"),
  reviewList: document.querySelector("#review-list"),
  historyList: document.querySelector("#history-list"),
  heroAccuracy: document.querySelector("#hero-accuracy"),
  heroReviewCount: document.querySelector("#hero-review-count"),
  heroWeakness: document.querySelector("#hero-weakness"),
  mobileAccuracy: document.querySelector("#mobile-accuracy"),
  mobileReviewCount: document.querySelector("#mobile-review-count"),
  mobileWeakness: document.querySelector("#mobile-weakness")
};

const enrichedQuestions = QUESTION_BANK.map((item, index) => enrichQuestion(item, index));
const state = { currentQuestion: null, storage: loadState(), mobileTab: "practice" };

init();

function init() {
  updateViewportHeight();
  elements.levelSelect.innerHTML = LEVELS.map((level) => `<option value="${level.id}">${level.label}</option>`).join("");
  elements.answerForm.addEventListener("submit", handleSubmit);
  elements.newQuestionButton.addEventListener("click", nextQuestion);
  elements.showAnswerButton.addEventListener("click", showAnswer);
  elements.modeSelect.addEventListener("change", nextQuestion);
  elements.levelSelect.addEventListener("change", nextQuestion);
  elements.reviewToggle.addEventListener("change", nextQuestion);
  elements.answerInput.addEventListener("focus", handleAnswerFocus);
  elements.answerInput.addEventListener("blur", handleAnswerBlur);
  elements.mobileTabs.forEach((tab) => {
    tab.addEventListener("click", () => setMobileTab(tab.dataset.tabTarget));
  });
  globalThis.matchMedia(MOBILE_MEDIA_QUERY).addEventListener("change", syncResponsiveLayout);
  globalThis.addEventListener("resize", updateViewportHeight);
  globalThis.visualViewport?.addEventListener("resize", handleViewportResize);
  renderDashboard();
  syncResponsiveLayout();
  nextQuestion();
}

function nextQuestion() {
  const selectedLevel = elements.levelSelect.value || "all";
  const reviewOnly = elements.reviewToggle.checked;
  let pool = enrichedQuestions.filter((question) => selectedLevel === "all" || question.level === selectedLevel);
  if (reviewOnly) {
    const reviewSet = new Set(state.storage.reviewQueue);
    pool = pool.filter((question) => reviewSet.has(question.id));
  }

  if (!pool.length) {
    state.currentQuestion = null;
    elements.questionBadge.textContent = "問題なし";
    elements.questionMode.textContent = "条件に合う問題がありません";
    elements.questionInstruction.textContent = "レベルまたは復習条件を変更してください。";
    elements.questionPrompt.textContent = "—";
    elements.questionSupport.textContent = "";
    elements.answerInput.value = "";
    renderFeedbackEmpty("問題に答えると、ここに判定と分析が出ます。");
    return;
  }

  const selected = pool[Math.floor(Math.random() * pool.length)];
  const mode = elements.modeSelect.value === "mixed" ? (Math.random() > 0.5 ? "reading" : "writing") : elements.modeSelect.value;
  state.currentQuestion = buildPromptVariant(selected, mode);
  renderQuestion();
  renderFeedbackEmpty("問題に答えると、ここに判定と分析が出ます。");
}

function buildPromptVariant(question, mode) {
  if (mode === "reading") {
    const answerType = Math.random() > 0.4 ? "reading" : "meaning";
    return {
      ...question,
      practiceMode: "reading",
      answerType,
      prompt: question.korean,
      support: answerType === "reading" ? "ローマ字で読みを入力してください。" : "日本語の意味を入力してください。"
    };
  }
  return {
    ...question,
    practiceMode: "writing",
    answerType: "korean",
    prompt: question.meaning,
    support: `読み: ${question.reading} / ハングルで入力してください。`
  };
}

function renderQuestion() {
  const question = state.currentQuestion;
  elements.questionBadge.textContent = `${LEVELS.find((level) => level.id === question.level)?.label ?? question.level} · ${TYPE_LABELS[question.type]}`;
  elements.questionMode.textContent = question.practiceMode === "reading" ? "読む練習" : "書く練習";
  elements.questionInstruction.textContent = question.practiceMode === "reading"
    ? (question.answerType === "reading" ? "表示されたハングルの読みを答えてください。" : "表示されたハングルの意味を答えてください。")
    : "日本語の意味を見て、対応するハングルをハングルで答えてください。";
  elements.questionPrompt.textContent = question.prompt;
  elements.questionSupport.textContent = question.support;
  elements.answerInput.placeholder = question.answerType === "meaning"
    ? "意味を日本語で入力"
    : question.practiceMode === "writing"
      ? "ハングルで入力してください"
      : "ローマ字でもハングルでも入力できます";
  elements.answerInput.value = "";
  elements.answerInput.focus();
}

function handleSubmit(event) {
  event.preventDefault();
  if (!state.currentQuestion) return;
  const userInput = elements.answerInput.value.trim();
  if (!userInput) {
    renderFeedbackEmpty("空欄では判定できません。回答を入力してください。");
    return;
  }
  const result = judgeAnswer(state.currentQuestion, userInput);
  persistAttempt(result);
  renderFeedback(result);
  renderDashboard();
  if (result.correct) {
    globalThis.setTimeout(() => {
      if (state.currentQuestion?.id === result.questionId) {
        nextQuestion();
      }
    }, AUTO_ADVANCE_DELAY_MS);
  }
}

function showAnswer() {
  if (!state.currentQuestion) return;
  const answer = state.currentQuestion.practiceMode === "writing"
    ? `${state.currentQuestion.korean} / ${state.currentQuestion.reading}`
    : state.currentQuestion.answerType === "meaning"
      ? state.currentQuestion.meaning
      : `${state.currentQuestion.reading} / ${state.currentQuestion.meaning}`;
  renderFeedbackEmpty(`正解: ${answer}`);
}

function judgeAnswer(question, userInput) {
  const inputType = detectInputType(userInput);
  const result = {
    id: (globalThis.crypto?.randomUUID?.() ?? `attempt-${Date.now()}`),
    questionId: question.id,
    korean: question.korean,
    meaning: question.meaning,
    reading: question.reading,
    practiceMode: question.practiceMode,
    answerType: question.answerType,
    userInput,
    correct: false,
    note: "",
    tagResults: question.tags.map((tag) => ({ key: tag, correct: false })),
    componentResults: question.componentKeys.map((key) => ({ key, correct: false }))
  };

  if (question.answerType === "meaning") {
    result.correct = normalizeMeaning(userInput) === normalizeMeaning(question.meaning);
    result.note = result.correct ? "意味が一致しました。" : `意味は「${question.meaning}」です。`;
    return applyUniformResults(result, result.correct);
  }

  if (question.answerType === "reading") {
    const inputTokens = normalizeRomanTokens(userInput);
    const correctSets = [question.romanTokens, ...question.readingVariantTokens];
    result.correct = correctSets.some((tokens) => tokenArrayEquals(tokens, inputTokens));
    result.note = result.correct ? "ローマ字の揺れを吸収して正解にしました。" : `読みは「${question.reading}」です。`;
    return applyUniformResults(result, result.correct);
  }

  if (inputType === "hangul") {
    result.correct = normalizeHangul(userInput) === question.normalizedKorean;
    result.note = result.correct ? "ハングル入力で正解です。" : `正解は「${question.korean}」です。`;
    return compareHangulComponents(question, normalizeHangul(userInput), result);
  }

  if (inputType === "latin") {
    result.note = "書き問題はハングル入力のみです。ハングルで入力してください。";
    result.componentResults.push({ key: "input-method", correct: false });
    return applyUniformResults(result, false);
  }

  result.note = "文字種を判定できませんでした。";
  return applyUniformResults(result, false);
}

function applyUniformResults(result, correct) {
  result.tagResults = result.tagResults.map((item) => ({ ...item, correct }));
  result.componentResults = result.componentResults.map((item) => ({ ...item, correct }));
  return result;
}

function compareHangulComponents(question, normalizedInput, result) {
  if (result.correct) {
    return applyUniformResults(result, true);
  }

  const inputComponents = decomposeText(normalizedInput);
  if (inputComponents.length !== question.components.length) {
    return applyUniformResults(result, false);
  }

  const map = new Map(result.componentResults.map((item) => [item.key, item]));
  question.components.forEach((expected, index) => {
    const actual = inputComponents[index];
    const checks = [
      [`initial:${expected.initial}`, actual?.initial === expected.initial],
      [`vowel:${expected.vowel}`, actual?.vowel === expected.vowel],
      [`final:${expected.final || "none"}`, actual?.final === expected.final]
    ];
    checks.forEach(([key, correct]) => {
      if (map.has(key)) map.get(key).correct = Boolean(correct);
    });
  });

  result.tagResults = result.tagResults.map((item) => {
    const keys = question.componentResultsByTag[item.key] ?? [];
    return { ...item, correct: keys.length ? keys.every((key) => map.get(key)?.correct) : false };
  });
  return result;
}

function persistAttempt(result) {
  state.storage.history.unshift(result);
  state.storage.history = state.storage.history.slice(0, 120);
  const reviewSet = new Set(state.storage.reviewQueue);
  if (result.correct) reviewSet.delete(result.questionId);
  else reviewSet.add(result.questionId);
  state.storage.reviewQueue = [...reviewSet];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.storage));
}

function renderFeedback(result) {
  const answerLine = result.practiceMode === "writing"
    ? `正解: <strong>${escapeHtml(result.korean)}</strong> <span class="subtle">(${escapeHtml(result.reading)} / ${escapeHtml(result.meaning)})</span>`
    : `正解: <strong>${escapeHtml(result.answerType === "meaning" ? result.meaning : result.reading)}</strong>`;
  const tagLine = summarizeIncorrectItems(result.tagResults, "カテゴリ");
  const componentLine = summarizeIncorrectItems(result.componentResults, "要素");
  elements.feedbackPanel.className = `feedback-panel ${result.correct ? "is-correct" : "is-incorrect"}`;
  elements.feedbackPanel.innerHTML = `
    <h3 class="feedback-title">${result.correct ? "正解" : "不正解"}</h3>
    <p class="feedback-copy">${answerLine}</p>
    <p class="feedback-copy">${escapeHtml(result.note)}</p>
    ${tagLine ? `<p class="feedback-copy">${escapeHtml(tagLine)}</p>` : ""}
    ${componentLine ? `<p class="feedback-copy">${escapeHtml(componentLine)}</p>` : ""}
  `;
}

function renderFeedbackEmpty(message) {
  elements.feedbackPanel.className = "feedback-panel";
  elements.feedbackPanel.innerHTML = `<p class="feedback-empty">${escapeHtml(message)}</p>`;
}

function renderDashboard() {
  const metrics = buildMetrics(state.storage.history);
  elements.summaryGrid.innerHTML = [
    { label: "総回答数", value: `${metrics.totalAttempts}`, note: "ブラウザ保存" },
    { label: "正答率", value: `${metrics.overallAccuracy}%`, note: "全レベル合算" },
    { label: "読む練習", value: `${metrics.readingAccuracy}%`, note: `${metrics.readingCorrect}/${metrics.readingTotal}` },
    { label: "書く練習", value: `${metrics.writingAccuracy}%`, note: `${metrics.writingCorrect}/${metrics.writingTotal}` }
  ].map((card) => `
    <article class="summary-item">
      <span>${escapeHtml(card.label)}</span>
      <strong>${escapeHtml(card.value)}</strong>
      <span>${escapeHtml(card.note)}</span>
    </article>
  `).join("");

  elements.weaknessList.innerHTML = metrics.weakCategories.length
    ? metrics.weakCategories.slice(0, 5).map((item) => `
      <article class="stack-item">
        <strong>${escapeHtml(item.label)}</strong>
        <span>正答率 ${item.accuracy}% · ${item.correct}/${item.total}</span>
      </article>
    `).join("")
    : `<p class="empty-state">回答が増えると、ここに弱点カテゴリが出ます。</p>`;

  elements.reviewList.innerHTML = state.storage.reviewQueue.length
    ? state.storage.reviewQueue.map((id) => enrichedQuestions.find((question) => question.id === id)).filter(Boolean).slice(0, 6).map((question) => `
      <article class="stack-item">
        <strong>${escapeHtml(question.korean)}</strong>
        <span>${escapeHtml(question.meaning)} / ${escapeHtml(question.reading)}</span>
      </article>
    `).join("")
    : `<p class="empty-state">復習キューは空です。</p>`;

  elements.historyList.innerHTML = state.storage.history.length
    ? state.storage.history.slice(0, 6).map((item) => `
      <article class="stack-item">
        <strong class="${item.correct ? "status-correct" : "status-incorrect"}">${item.correct ? "正解" : "不正解"} · ${escapeHtml(item.korean)}</strong>
        <span>${escapeHtml(item.userInput)} → ${escapeHtml(item.practiceMode === "writing" ? item.korean : item.answerType === "meaning" ? item.meaning : item.reading)}</span>
      </article>
    `).join("")
    : `<p class="empty-state">まだ回答履歴がありません。</p>`;

  elements.heroAccuracy.textContent = `${metrics.overallAccuracy}%`;
  elements.heroReviewCount.textContent = `${state.storage.reviewQueue.length}問`;
  elements.heroWeakness.textContent = metrics.weakCategories[0]?.label ?? "-";
  elements.mobileAccuracy.textContent = `${metrics.overallAccuracy}%`;
  elements.mobileReviewCount.textContent = `${state.storage.reviewQueue.length}`;
  elements.mobileWeakness.textContent = metrics.weakCategories[0]?.label ?? "-";
}

function setMobileTab(tabName) {
  state.mobileTab = tabName;
  if (!globalThis.matchMedia(MOBILE_MEDIA_QUERY).matches) {
    return;
  }
  elements.mobileTabs.forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.tabTarget === tabName);
  });

  const isPractice = tabName === "practice";
  if (!isPractice) {
    document.body.classList.remove("keyboard-active");
  }
  elements.practicePanel.classList.toggle("is-mobile-hidden", !isPractice);
  elements.sidebar.style.display = isPractice ? "none" : "grid";
  elements.sidebarPanels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.tabPanel === tabName);
  });
}

function syncResponsiveLayout() {
  const isMobile = globalThis.matchMedia(MOBILE_MEDIA_QUERY).matches;
  if (!isMobile) {
    document.body.classList.remove("keyboard-active");
    elements.practicePanel.classList.remove("is-mobile-hidden");
    elements.sidebar.style.display = "";
    elements.mobileTabs.forEach((tab) => {
      tab.classList.toggle("is-active", tab.dataset.tabTarget === state.mobileTab);
    });
    elements.sidebarPanels.forEach((panel) => {
      panel.classList.remove("is-active");
    });
    return;
  }
  setMobileTab(state.mobileTab);
}

function updateViewportHeight() {
  const viewportHeight = globalThis.visualViewport?.height ?? globalThis.innerHeight;
  document.documentElement.style.setProperty("--app-height", `${Math.round(viewportHeight)}px`);
}

function handleViewportResize() {
  updateViewportHeight();
  if (!globalThis.matchMedia(MOBILE_MEDIA_QUERY).matches) {
    return;
  }
  const viewportHeight = globalThis.visualViewport?.height ?? globalThis.innerHeight;
  const keyboardOpen = viewportHeight < globalThis.innerHeight * 0.82;
  document.body.classList.toggle("keyboard-active", keyboardOpen && state.mobileTab === "practice");
}

function handleAnswerFocus() {
  if (!globalThis.matchMedia(MOBILE_MEDIA_QUERY).matches) {
    return;
  }
  document.body.classList.add("keyboard-active");
  updateViewportHeight();
  globalThis.setTimeout(() => {
    elements.questionCard?.scrollIntoView({ block: "start", behavior: "smooth" });
    elements.answerInput?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, 120);
}

function handleAnswerBlur() {
  if (!globalThis.matchMedia(MOBILE_MEDIA_QUERY).matches) {
    return;
  }
  globalThis.setTimeout(() => {
    document.body.classList.remove("keyboard-active");
    updateViewportHeight();
  }, 120);
}

function buildMetrics(history) {
  const totalAttempts = history.length;
  const totalCorrect = history.filter((item) => item.correct).length;
  const readingTotal = history.filter((item) => item.practiceMode === "reading").length;
  const readingCorrect = history.filter((item) => item.practiceMode === "reading" && item.correct).length;
  const writingTotal = history.filter((item) => item.practiceMode === "writing").length;
  const writingCorrect = history.filter((item) => item.practiceMode === "writing" && item.correct).length;
  const categoryMap = new Map();

  history.forEach((item) => {
    [...item.tagResults, ...item.componentResults].forEach((entry) => {
      const current = categoryMap.get(entry.key) ?? { label: humanizeKey(entry.key), total: 0, correct: 0 };
      current.total += 1;
      if (entry.correct) current.correct += 1;
      categoryMap.set(entry.key, current);
    });
  });

  const weakCategories = [...categoryMap.values()]
    .filter((entry) => entry.total >= 2)
    .map((entry) => ({ ...entry, accuracy: Math.round((entry.correct / entry.total) * 100) }))
    .sort((left, right) => left.accuracy - right.accuracy || right.total - left.total);

  return {
    totalAttempts,
    totalCorrect,
    readingTotal,
    readingCorrect,
    writingTotal,
    writingCorrect,
    overallAccuracy: percentage(totalCorrect, totalAttempts),
    readingAccuracy: percentage(readingCorrect, readingTotal),
    writingAccuracy: percentage(writingCorrect, writingTotal),
    weakCategories
  };
}

function enrichQuestion(item, index) {
  const normalizedKorean = normalizeHangul(item.korean);
  const components = decomposeText(normalizedKorean);
  const tags = buildTags(components, item);
  const componentKeys = [];
  const componentResultsByTag = { "母音": [], "子音": [], "パッチム": [] };

  components.forEach((component) => {
    const initialKey = `initial:${component.initial}`;
    const vowelKey = `vowel:${component.vowel}`;
    const finalKey = `final:${component.final || "none"}`;
    componentKeys.push(initialKey, vowelKey, finalKey);
    componentResultsByTag["子音"].push(initialKey);
    componentResultsByTag["母音"].push(vowelKey);
    if (component.final) componentResultsByTag["パッチム"].push(finalKey);
  });

  return {
    ...item,
    id: `q-${index + 1}`,
    normalizedKorean,
    romanTokens: normalizeRomanTokens(item.reading),
    readingVariantTokens: (item.readingVariants ?? []).map((reading) => normalizeRomanTokens(reading)),
    components,
    componentKeys: [...new Set(componentKeys)],
    componentResultsByTag,
    tags
  };
}

function buildTags(components, item) {
  const tags = new Set(["母音", "子音"]);
  if (components.some((component) => component.final)) tags.add("パッチム");
  if (components.some((component) => ["ㅘ", "ㅙ", "ㅚ", "ㅝ", "ㅞ", "ㅟ", "ㅢ", "ㅒ", "ㅖ"].includes(component.vowel))) tags.add("複合母音");
  if (components.some((component) => ["ㄲ", "ㄸ", "ㅃ", "ㅆ", "ㅉ"].includes(component.initial))) tags.add("濃音");
  if (components.some((component) => ["ㅋ", "ㅌ", "ㅍ", "ㅊ"].includes(component.initial))) tags.add("激音");
  if (item.type === "word") tags.add("語彙");
  if (item.type === "phrase") tags.add("短文");
  return [...tags];
}

function decomposeText(text) {
  return [...text].filter(isHangulSyllable).map((char) => {
    const code = char.charCodeAt(0) - 0xac00;
    return {
      syllable: char,
      initial: INITIALS[Math.floor(code / 588)],
      vowel: VOWELS[Math.floor((code % 588) / 28)],
      final: FINALS[code % 28]
    };
  });
}

function detectInputType(input) {
  if (/[가-힣]/.test(input)) return "hangul";
  if (/[a-z]/i.test(input)) return "latin";
  if (/[ぁ-んァ-ヶ一-龠々]/.test(input)) return "meaning";
  return "unknown";
}

function normalizeHangul(text) {
  return text.normalize("NFC").replace(/[^\p{Script=Hangul}]/gu, "");
}

function normalizeMeaning(text) {
  return text.normalize("NFKC").toLowerCase().replace(/[^\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}a-z0-9]/gu, "");
}

function normalizeRomanTokens(text) {
  const source = text.normalize("NFKC").toLowerCase().replace(/[^a-z]/g, "");
  const tokens = [];
  let cursor = 0;
  while (cursor < source.length) {
    let matched = false;
    for (const [pattern, output] of ROMAN_TOKEN_RULES) {
      if (source.startsWith(pattern, cursor)) {
        tokens.push(...output);
        cursor += pattern.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      tokens.push(source[cursor]);
      cursor += 1;
    }
  }
  return tokens.filter((token, index, all) => {
    if ((token === "w" || token === "y") && index < all.length - 1) return false;
    return true;
  });
}

function tokenArrayEquals(left, right) {
  return left.length === right.length && left.every((token, index) => token === right[index]);
}

function summarizeIncorrectItems(items, prefix) {
  const incorrect = items.filter((item) => !item.correct).map((item) => humanizeKey(item.key));
  return incorrect.length ? `${prefix}: ${incorrect.join(" / ")}` : "";
}

function humanizeKey(key) {
  if (key === "input-method") return "入力方式";
  if (key === "romanization") return "ローマ字変換";
  if (key.startsWith("initial:")) return `初声 ${key.replace("initial:", "")}`;
  if (key.startsWith("vowel:")) return `母音 ${key.replace("vowel:", "")}`;
  if (key.startsWith("final:")) {
    const value = key.replace("final:", "");
    return value === "none" ? "パッチムなし" : `パッチム ${value}`;
  }
  return key;
}

function percentage(correct, total) {
  return total ? Math.round((correct / total) * 100) : 0;
}

function isHangulSyllable(char) {
  const code = char.charCodeAt(0);
  return code >= 0xac00 && code <= 0xd7a3;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { history: [], reviewQueue: [] };
    const parsed = JSON.parse(raw);
    return {
      history: Array.isArray(parsed.history) ? parsed.history : [],
      reviewQueue: Array.isArray(parsed.reviewQueue) ? parsed.reviewQueue : []
    };
  } catch {
    return { history: [], reviewQueue: [] };
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
