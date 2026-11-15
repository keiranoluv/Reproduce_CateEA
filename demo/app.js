"use strict";

const $ = (selector) => document.querySelector(selector);
const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const short = (value, length = 20) => value.length > length ? `${value.slice(0, length - 1)}…` : value;
const portraitFiles = { "Hàm Nghi": "ham-nghi", "Tự Đức": "tu-duc", "Bảo Đại": "bao-dai" };
const STORAGE_KEY = "cateea-match-lab-quiz-v1";
let data;
const state = { dataset: "ja_en", pair: "ja_en:8853", config: "noniter_wSF", weighted: false, candidate: null, graphSide: "source", caseView: "play", caseChoice: null, ics: false, caseConfig: "noniter_wSF", quizIndex: 0, quizChoice: null, answers: {}, step: 0 };
const graphTextContext = document.createElement("canvas").getContext("2d");
const graphFont = 'Inter, "Segoe UI", Arial, "CateEA CJK", sans-serif';
let graphObserver;
let graphLayoutFrame;

const entity = (id) => data.entities[id];
const dataset = (id = state.dataset) => data.datasets.find((d) => d.id === id);
const pairById = (id) => data.datasets.flatMap((d) => d.pairs).find((p) => p.id === id);
const prediction = (pair, config = state.config, mode = state.weighted ? "weighted" : "test") => pair.predictions[config][mode];
const configOptions = (selected) => Object.entries(data.configurations).map(([id, title]) => `<option value="${id}" ${id === selected ? "selected" : ""}>${escapeHTML(title)}</option>`).join("");
const portrait = (name, className = "") => `<img class="${className}" src="assets/images/${portraitFiles[name]}.webp" alt="Chân dung tư liệu ${escapeHTML(name)}" width="480" height="630" />`;

function renderCase() {
  document.querySelectorAll("[data-case-view]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.caseView === state.caseView)));
  if (state.caseView === "play") {
    const correct = state.caseChoice === "Hàm Nghi";
    $("#case-content").innerHTML = `<div class="case-play"><div class="case-question"><span class="tiny-label">THỰC THỂ NGUỒN · TIẾNG NHẬT</span><div class="japanese-name" lang="ja">咸宜帝</div><h3>Bạn sẽ nối tên này với ai?</h3><p>Chọn một trong ba ứng viên. Tên trong các đồ thị có thể khác ngôn ngữ.</p></div><div><div class="candidate-grid">${["Hàm Nghi", "Tự Đức", "Bảo Đại"].map((name) => `<button type="button" class="person-option ${state.caseChoice === name ? "selected" : ""}" data-case-choice="${name}" aria-pressed="${state.caseChoice === name}">${portrait(name)}<strong>${name}</strong><small>ỨNG VIÊN · ĐỒ THỊ EN</small></button>`).join("")}</div>${state.caseChoice ? `<div class="case-feedback ${correct ? "" : "wrong"}" role="status"><p><strong>${correct ? "Đúng danh tính: Hàm Nghi." : `${escapeHTML(state.caseChoice)} là một thực thể khác.`}</strong><br />Cặp chuẩn trong DBP15K là 咸宜帝 (#8853) ↔ Hàm Nghi (#19353).</p><button type="button" class="text-button" data-show-case="paper">Xem kết quả paper →</button></div>` : `<p class="small-note" style="margin-top:15px">Ảnh là gợi ý cho bạn. Bài thử này giúp hiểu bài toán ghép cặp.</p>`}</div></div>`;
  } else if (state.caseView === "paper") {
    const name = state.ics ? "Hàm Nghi" : "Tự Đức";
    $("#case-content").innerHTML = `<div class="paper-replay"><div class="replay-source"><span class="tiny-label">NGUỒN · JA #8853</span><strong lang="ja">咸宜帝</strong><span class="small-note">Đáp án chuẩn: Hàm Nghi</span></div><div class="replay-controls"><div class="segmented" role="group" aria-label="ICS trong kết quả paper"><button type="button" data-ics="off" aria-pressed="${!state.ics}">Không ICS</button><button type="button" data-ics="on" aria-pressed="${state.ics}">Có ICS</button></div><div class="replay-arrow" aria-hidden="true">⟶</div><p>Dự đoán được báo cáo<br />trong Table 6 của paper</p></div><div class="replay-target">${portrait(name)}<div><span class="tiny-label">DỰ ĐOÁN ĐÍCH · EN</span><h3>${name}</h3><span class="badge ${state.ics ? "" : "orange"}">${state.ics ? "✓ ĐÚNG THỰC THỂ" : "↗ KHÁC THỰC THỂ"}</span></div></div></div><p class="case-explanation"><strong>${state.ics ? "Với ICS, tác giả báo cáo ghép đúng Hàm Nghi." : "Không ICS, tác giả báo cáo nhầm sang Tự Đức."}</strong> Cùng thuộc một nhóm quen thuộc chưa đủ để xác định danh tính. Paper dùng category ẩn học từ embedding; Table 6 không cung cấp nhãn category hay điểm số của từng ứng viên. <button type="button" class="text-button" data-show-case="repo">Đối chiếu bản tái lập →</button></p>`;
  } else {
    const pair = pairById("ja_en:8853");
    $("#case-content").innerHTML = `<div class="repo-case"><div class="repo-case-heading"><div><h3>Dữ liệu từ lượt tái lập</h3><p>JA–EN · Seed 42 · Epoch cuối 999 · Chiều JA → EN</p></div><label><span class="sr-only">Cấu hình case Hàm Nghi</span><select id="case-config">${configOptions(state.caseConfig)}</select></label></div><div class="ranking-columns">${rankingPanel(pair, state.caseConfig, "test", "test · Chưa áp dụng weighting")}${rankingPanel(pair, state.caseConfig, "weighted", "weighted_test · Có weighting")}</div><div class="repo-note">${state.caseConfig.endsWith("_wSF") ? "Ở cấu hình có dùng tên này, Hàm Nghi chưa lên hạng 1; category weighting giữ nguyên thứ hạng của đáp án đúng." : "Ở cấu hình không dùng tên này, Hàm Nghi đã được xếp hạng 1 ở cả hai cách đánh giá."} Hai cột đều dùng mô hình CateEA đã huấn luyện với category supervision; chỉ khác category weighting lúc đánh giá.<button type="button" class="text-button" data-case-to-lab>Mở cặp này trên hai đồ thị →</button></div></div>`;
  }
}

function rankingPanel(pair, config, mode, title) {
  const row = prediction(pair, config, mode);
  return `<div class="ranking-panel"><h3>${title}</h3><p class="rank-summary">Hàm Nghi ở hạng <b>#${row.rank}</b> / 10.500</p>${row.top3.map((id, i) => `<div class="ranking-row"><span>0${i + 1}</span><span>${escapeHTML(entity(id).label)}</span>${id === pair.target ? "<b>✓ Cặp chuẩn</b>" : ""}</div>`).join("")}<button class="ranking-source text-button" type="button" data-prediction-pair="${pair.id}" data-prediction-config="${config}" data-prediction-mode="${mode}">Nguồn: ${escapeHTML(row.source.path.split("/").slice(-2).join("/"))}:${row.source.line} ↗</button></div>`;
}

function renderPaperTable() {
  $("#paper-table").innerHTML = data.paperCases.map((row) => `<tr><td>${row.sourceId}</td><td>${escapeHTML(row.target)}</td><td>${escapeHTML(row.withoutICS)}</td><td>${escapeHTML(row.withICS)}</td><td><button type="button" class="text-button" data-jump-pair="${row.source}" data-jump-config="noniter_woSF">Xem tái lập ↗</button></td></tr>`).join("");
}

function renderPairList() {
  const search = $("#entity-search").value.trim().toLocaleLowerCase();
  const visible = dataset().pairs.filter((pair) => [pair.title, entity(pair.source).label, entity(pair.source).numericId].some((value) => String(value).toLocaleLowerCase().includes(search)));
  $("#pair-count").textContent = `${visible.length} / ${dataset().pairs.length}`;
  $("#pair-list").innerHTML = visible.length ? visible.map((pair) => `<button type="button" class="pair-item ${pair.id === state.pair ? "active" : ""}" data-pair="${pair.id}" aria-pressed="${pair.id === state.pair}"><strong>${escapeHTML(entity(pair.source).label)}</strong><small>${escapeHTML(pair.title)}</small></button>`).join("") : `<p class="empty-search">Không tìm thấy cặp phù hợp. Thử tên tiếng Anh hoặc ID nguồn.</p>`;
}

function measureGraphText(text, fontSize, weight = 500) {
  if (!graphTextContext) return Array.from(text).length * fontSize;
  graphTextContext.font = `${weight} ${fontSize}px ${graphFont}`;
  return graphTextContext.measureText(text).width;
}

function wrapGraphLabel(label, maxWidth, fontSize, weight = 500) {
  const lines = [];
  let line = "";
  for (let word of label.split(/\s+/u)) {
    const joined = line ? `${line} ${word}` : word;
    if (measureGraphText(joined, fontSize, weight) <= maxWidth) { line = joined; continue; }
    if (line) { lines.push(line); line = ""; }
    let piece = "";
    for (const character of word) {
      if (piece && measureGraphText(piece + character, fontSize, weight) > maxWidth) {
        lines.push(piece); piece = "";
      }
      piece += character;
    }
    line = piece;
  }
  if (line) lines.push(line);
  if (lines.length <= 3) return lines;
  const visible = lines.slice(0, 3);
  let last = Array.from(visible[2]);
  while (last.length && measureGraphText(last.join("") + "…", fontSize, weight) > maxWidth) last.pop();
  visible[2] = last.join("") + "…";
  return visible;
}

function miniGraph(rootId, prefix, expanded = false) {
  return `<div class="graph-surface ${expanded ? "expanded" : ""}" data-graph-root="${rootId}" data-graph-prefix="${prefix}" data-graph-expanded="${expanded}"><svg class="mini-graph" role="group" aria-label="Đồ thị ngữ cảnh của ${escapeHTML(entity(rootId).label)}"></svg></div>`;
}

function graphNode(id, x, y, width, height, fontSize, center = false) {
  const row = entity(id), weight = center ? 600 : 500;
  const lines = wrapGraphLabel(row.label, width - 24, fontSize, weight);
  const lineHeight = fontSize + 5;
  return `<g class="graph-node" role="button" tabindex="0" data-inspect="${id}" aria-label="Đọc thực thể ${escapeHTML(row.label)}"><title>${escapeHTML(row.label)}</title><rect class="${center ? "center-node" : "node"}" x="${x - width / 2}" y="${y - height / 2}" width="${width}" height="${height}" rx="10"/><text class="graph-node-label" text-anchor="middle" dominant-baseline="middle" style="font-size:${fontSize}px;font-weight:${weight}">${lines.map((line, i) => `<tspan x="${x}" y="${y + (i - (lines.length - 1) / 2) * lineHeight}">${escapeHTML(line)}</tspan>`).join("")}</text></g>`;
}

function drawGraph(surface, force = false) {
  const width = Math.floor(surface.clientWidth) - 2;
  if (width < 140 || (!force && Number(surface.dataset.layoutWidth) === width)) return;
  surface.dataset.layoutWidth = width;
  const rootId = surface.dataset.graphRoot, root = entity(rootId), prefix = surface.dataset.graphPrefix;
  const expanded = surface.dataset.graphExpanded === "true";
  const padding = 16, sideHeight = expanded ? 92 : 84, rootHeight = expanded ? 100 : 94, gap = 42;
  const sideWidth = Math.min(expanded ? 260 : 180, (width - 3 * padding) / 2);
  const rootWidth = Math.min(expanded ? 320 : 240, width - 2 * padding);
  const height = root.neighbors.length ? 2 * padding + 2 * sideHeight + rootHeight + 2 * gap : 220;
  const center = [width / 2, root.neighbors.length ? padding + sideHeight + gap + rootHeight / 2 : height / 2];
  const left = padding + sideWidth / 2, right = width - padding - sideWidth / 2;
  const top = padding + sideHeight / 2, bottom = height - padding - sideHeight / 2;
  const positions = [[left, top], [right, top], [left, bottom], [right, bottom]];
  const lines = root.neighbors.map((edge, i) => {
    const [x, y] = positions[i], dx = x - center[0], dy = y - center[1];
    const startScale = Math.min((rootWidth / 2 + 2) / Math.abs(dx), (rootHeight / 2 + 2) / Math.abs(dy));
    const endScale = Math.min((sideWidth / 2 + 3) / Math.abs(dx), (sideHeight / 2 + 3) / Math.abs(dy));
    let x1 = center[0] + dx * startScale, y1 = center[1] + dy * startScale;
    let x2 = x - dx * endScale, y2 = y - dy * endScale;
    if (edge.direction === "in") [x1, y1, x2, y2] = [x2, y2, x1, y1];
    const label = `r:${edge.relation}`, labelWidth = measureGraphText(label, 12) + 12;
    let labelX = (x1 + x2) / 2;
    labelX = x < center[0] ? Math.min(labelX, center[0] - labelWidth / 2 - 8) : Math.max(labelX, center[0] + labelWidth / 2 + 8);
    labelX = Math.max(labelWidth / 2 + 4, Math.min(width - labelWidth / 2 - 4, labelX));
    const labelY = (y1 + y2) / 2;
    return `<g class="graph-edge" role="button" tabindex="0" data-edge-root="${rootId}" data-edge-index="${i}" aria-label="Xem quan hệ ${edge.relation} với ${escapeHTML(entity(edge.entity).label)}"><title>Quan hệ ID ${edge.relation} · ${edge.direction === "out" ? "đi ra" : "đi vào"}</title><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="transparent" stroke-width="16"/><line class="edge" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" marker-end="url(#arrow-${prefix})"/><rect class="relation-background" x="${labelX - labelWidth / 2}" y="${labelY - 11}" width="${labelWidth}" height="22" rx="5"/><text class="relation-label" x="${labelX}" y="${labelY + 1}" text-anchor="middle" dominant-baseline="middle" style="font-size:12px;font-weight:500">${label}</text></g>`;
  }).join("");
  const nodes = root.neighbors.map((edge, i) => graphNode(edge.entity, ...positions[i], sideWidth, sideHeight, expanded ? 18 : 16)).join("");
  const svg = surface.querySelector("svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.style.height = `${height + 2}px`;
  svg.innerHTML = `<defs><marker id="arrow-${prefix}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 10 5 0 10" fill="${root.side === 1 ? "#7f9e70" : "#a38ab8"}"/></marker></defs>${lines}${nodes}${graphNode(rootId, ...center, rootWidth, rootHeight, expanded ? 20 : 18, true)}${root.neighbors.length ? "" : `<text x="${width / 2}" y="${height - 25}" text-anchor="middle" style="font-size:14px">Không có cạnh trong snapshot</text>`}`;
}

function layoutGraphSurfaces(force = false) {
  document.querySelectorAll(".graph-surface").forEach((surface) => drawGraph(surface, force));
}

function observeGraphSurfaces() {
  if (!graphObserver && "ResizeObserver" in window) {
    graphObserver = new ResizeObserver(() => {
      if (graphLayoutFrame) cancelAnimationFrame(graphLayoutFrame);
      graphLayoutFrame = requestAnimationFrame(() => { graphLayoutFrame = null; layoutGraphSurfaces(); });
    });
  }
  graphObserver?.disconnect();
  document.querySelectorAll(".graph-surface").forEach((surface) => graphObserver?.observe(surface));
  layoutGraphSurfaces(true);
}

function setGraphSide(side) {
  state.graphSide = side;
  $(".graph-pair").dataset.activeView = side;
  document.querySelectorAll("[data-graph-view]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.graphView === side)));
  layoutGraphSurfaces();
}

function openGraph(id) {
  const row = entity(id);
  $("#graph-dialog-title").textContent = row.label;
  $("#graph-dialog-meta").textContent = `${dataset(row.dataset).label} · ${row.side === 1 ? "Nguồn" : "Ứng viên"} · #${row.numericId}`;
  $("#graph-dialog-content").classList.toggle("target", row.side === 2);
  $("#graph-dialog-content").innerHTML = miniGraph(id, "expanded", true) + (row.neighbors.length ? `<div class="graph-neighbor-list"><h3>Thực thể lân cận</h3>${row.neighbors.map((edge) => `<button type="button" data-inspect="${edge.entity}"><span>${escapeHTML(entity(edge.entity).label)}</span><small>${edge.direction === "out" ? "→" : "←"} r:${edge.relation}</small></button>`).join("")}</div>` : "");
  $("#graph-dialog").showModal();
  observeGraphSurfaces();
}

function graphPanel(row, source) {
  return `<div class="entity-graph-panel ${source ? "source" : "target"}"><div class="entity-heading"><div><span class="tiny-label">${source ? `NGUỒN · ${state.dataset === "ja_en" ? "JA" : "ZH"}` : "ỨNG VIÊN · EN"} #${row.numericId}</span><h3>${escapeHTML(row.label)}</h3></div><div class="graph-actions"><button type="button" class="text-button graph-expand" data-expand-graph="${row.id}" aria-label="Phóng to đồ thị ${source ? "nguồn" : "ứng viên"}">Phóng to ⤢</button><button type="button" class="inspect-icon" data-inspect="${row.id}" aria-label="Chi tiết ${source ? "thực thể nguồn" : "ứng viên"}">↗</button></div></div>${miniGraph(row.id, source ? "source" : "target")}</div>`;
}

function renderLab() {
  const pair = pairById(state.pair);
  const row = prediction(pair);
  if (!state.candidate || !entity(state.candidate)) state.candidate = row.top3[0];
  const source = entity(pair.source), target = entity(state.candidate);
  document.querySelectorAll("[data-dataset]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.dataset === state.dataset)));
  $("#lab-config").value = state.config;
  $("#weighting-toggle").checked = state.weighted;
  renderPairList();
  $("#lab-content").innerHTML = `<div class="comparison-stage"><div class="graph-viewbar"><span>NGỮ CẢNH ĐỒ THỊ</span><div class="segmented graph-view-tabs" role="group" aria-label="Chọn đồ thị"><button type="button" data-graph-view="source" aria-pressed="${state.graphSide === "source"}">Nguồn</button><button type="button" data-graph-view="target" aria-pressed="${state.graphSide === "target"}">Ứng viên</button></div></div><div class="graph-pair" data-active-view="${state.graphSide}">${graphPanel(source, true)}<div class="graph-connector" aria-hidden="true">↔</div>${graphPanel(target, false)}</div><p class="match-status ${target.id === pair.target ? "" : "other"}">${target.id === pair.target ? "✓ Trùng với cặp chuẩn trong benchmark" : "↔ Đang đối chiếu một ứng viên khác với cặp chuẩn"}</p></div><div class="model-candidates"><div class="candidate-heading"><span>TOP 3 · ${state.weighted ? "WEIGHTED_TEST" : "TEST"}</span><span>ĐÁP ÁN CHUẨN Ở HẠNG <b>#${row.rank}</b></span></div><div class="candidate-strip">${row.top3.map((id, i) => `<button type="button" class="model-candidate ${id === state.candidate ? "active" : ""}" data-candidate="${id}" aria-pressed="${id === state.candidate}"><span class="candidate-rank">HẠNG 0${i + 1}</span><strong>${escapeHTML(entity(id).label)}</strong>${id === pair.target ? "<small>✓ Cặp chuẩn</small>" : ""}</button>`).join("")}</div>${!row.top3.includes(pair.target) ? `<div class="ground-truth-outside"><span>Đáp án chuẩn nằm ngoài top 3 · Hạng #${row.rank}</span><button type="button" class="text-button" data-candidate="${pair.target}">Xem ${escapeHTML(short(pair.title, 25))} →</button></div>` : ""}</div><div class="graph-note"><span>Bấm thẻ để đọc tên đầy đủ; bấm cạnh để xem nguồn. r:ID là mã quan hệ gốc.</span><button type="button" class="text-button" data-prediction-pair="${pair.id}" data-prediction-config="${state.config}" data-prediction-mode="${state.weighted ? "weighted" : "test"}">Bản ghi dự đoán ↗</button></div>`;
  observeGraphSurfaces();
}

function jumpToPair(id, config = "noniter_woSF") {
  const pair = pairById(id);
  if (!pair) return;
  state.dataset = id.split(":")[0]; state.pair = id; state.config = config; state.weighted = false; state.candidate = null; state.graphSide = "source";
  $("#entity-search").value = "";
  renderLab();
  $("#lab").scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
}

function renderStories() {
  const stories = [
    { id: "ja_en:8853", eyebrow: "CASE TỪ PAPER", title: "Một nhầm lẫn rất gần", text: "Hàm Nghi và Tự Đức: xem paper bên cạnh các cấu hình tái lập.", config: "noniter_wSF" },
    { title: "Weighting giúp lên hạng", eyebrow: "THỨ HẠNG TĂNG", target: "Lua (programming language)", text: "Lua từ hạng 2 lên hạng 1 trong snapshot JA–EN.", config: "noniter_woSF" },
    { title: "Có lúc thứ hạng giảm", eyebrow: "THỨ HẠNG GIẢM", target: "Ticket to Ride", text: "Cặp đúng từ hạng 1 xuống hạng 2 sau category weighting.", config: "noniter_woSF" },
    { id: "zh_en:6450", eyebrow: "CÙNG NGỮ CẢNH", title: "Kyoto giữa nhiều địa danh", text: "Đáp án đúng ở hạng 6; các ứng viên đầu đều là địa danh.", config: "noniter_woSF" },
  ];
  $("#story-cards").innerHTML = stories.map((story) => {
    const pair = story.id ? pairById(story.id) : dataset("ja_en").pairs.find((p) => p.title === story.target);
    return `<button type="button" class="story-card" data-jump-pair="${pair.id}" data-jump-config="${story.config}"><span class="tiny-label">${story.eyebrow}</span><span class="story-arrow">↗</span><h3>${story.title}</h3><p>${story.text}</p></button>`;
  }).join("");
}

function quizChoices(index) {
  const quiz = data.quizzes[index], pair = pairById(quiz.pair);
  const choices = [...new Set([pair.target, ...prediction(pair, "noniter_woSF", "test").top3])];
  const pool = Object.values(data.entities).filter((e) => e.dataset === pair.id.split(":")[0] && e.side === 2);
  if (quiz.extra) {
    const extra = pool.find((e) => e.label === quiz.extra);
    if (extra && !choices.includes(extra.id)) choices.push(extra.id);
  }
  if (pair.id === "ja_en:8853") {
    const emperor = pool.find((e) => e.label === "Hiệp Hòa");
    if (emperor && !choices.includes(emperor.id)) choices.push(emperor.id);
  }
  for (const other of dataset(pair.id.split(":")[0]).pairs) {
    if (choices.length >= 4) break;
    if (!choices.includes(other.target)) choices.push(other.target);
  }
  const hash = (id) => [...`${index}:${id}`].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 17);
  return choices.slice(0, 4).sort((a, b) => hash(a) - hash(b));
}

function saveQuiz() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ index: state.quizIndex, answers: state.answers })); } catch { /* Progress remains available in this tab. */ }
}

function restoreQuiz() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!saved || typeof saved !== "object") return;
    if (Number.isInteger(saved.index) && saved.index >= 0 && saved.index < data.quizzes.length) state.quizIndex = saved.index;
    data.quizzes.forEach((quiz, i) => {
      if (quizChoices(i).includes(saved.answers?.[quiz.pair])) state.answers[quiz.pair] = saved.answers[quiz.pair];
    });
  } catch { /* Invalid or unavailable storage starts a fresh quiz. */ }
}

function renderQuiz() {
  const index = state.quizIndex, quiz = data.quizzes[index], pair = pairById(quiz.pair);
  const answer = state.answers[quiz.pair], chosen = answer || state.quizChoice;
  const correct = answer === pair.target;
  const baseline = prediction(pair, "noniter_woSF", "test"), weighted = prediction(pair, "noniter_woSF", "weighted");
  $("#quiz-progress").innerHTML = data.quizzes.map((q, i) => `<button type="button" data-quiz-index="${i}" class="${state.answers[q.pair] ? "done" : ""} ${i === index ? "active" : ""}" aria-label="Câu ${i + 1}${state.answers[q.pair] ? ", đã trả lời" : ""}" aria-pressed="${i === index}">${i + 1}</button>`).join("");
  const answeredCount = Object.keys(state.answers).length;
  const score = data.quizzes.filter((q) => state.answers[q.pair] === pairById(q.pair).target).length;
  $("#quiz-content").innerHTML = `<div class="quiz-body"><div><span class="question-number">CÂU 0${index + 1} / 06 · ${dataset(pair.id.split(":")[0]).label} · TEST</span><div class="quiz-source-name">${escapeHTML(entity(pair.source).label)}</div><h3>${quiz.title}</h3><details class="quiz-hint"><summary>Mở một gợi ý +</summary><p>${quiz.hint}</p></details><p class="small-note" style="margin-top:17px">Thực thể này tương ứng với ai hoặc điều gì trong đồ thị tiếng Anh?</p></div><div class="quiz-right"><div class="quiz-choices">${quizChoices(index).map((id, i) => `<button type="button" class="quiz-option ${chosen === id ? "selected" : ""} ${answer && id === pair.target ? "correct" : ""} ${answer === id && !correct ? "incorrect" : ""}" data-quiz-choice="${id}" ${answer ? "disabled" : ""} aria-pressed="${chosen === id}"><span>${"ABCD"[i]}</span><span>${escapeHTML(entity(id).label)}</span></button>`).join("")}</div><div class="quiz-actions">${answer ? `<button class="button primary" type="button" data-next-quiz>${index === data.quizzes.length - 1 ? "Về câu đầu ↺" : "Câu tiếp theo →"}</button>` : `<button class="button primary" type="button" data-check-quiz ${chosen ? "" : "disabled"}>Kiểm tra đáp án →</button>`}<span>Gợi ý có thể tiết lộ đáp án.</span></div>${answer ? `<div class="quiz-feedback" role="status"><strong>${correct ? "✓ Bạn đã ghép đúng." : `Đáp án chuẩn: ${escapeHTML(pair.title)}.`}</strong><p>Mô hình không lặp, không dùng tên: đáp án đúng ở hạng <b>#${baseline.rank}</b>; sau category weighting ở hạng <b>#${weighted.rank}</b>. Đây là thứ hạng trong 10.500 ứng viên, trước khi tuyển chọn cho câu hỏi.</p><button type="button" class="text-button" data-jump-pair="${pair.id}" data-jump-config="noniter_woSF">Đọc ngữ cảnh trên hai đồ thị ↗</button>${pair.id === "ja_en:8853" ? '<button type="button" class="text-button" data-open-paper>Xem case này trong paper ↗</button>' : ""}</div>` : ""}</div></div><div class="quiz-score">Đã trả lời <b>${answeredCount}/6</b> · Ghép đúng <b>${score}</b> cặp. <span class="small-note">Bài thử cho người xem; không phải phép đánh giá mô hình.</span></div>`;
}

function renderMethod() {
  document.querySelectorAll("[data-step]").forEach((button) => button.setAttribute("aria-pressed", String(Number(button.dataset.step) === state.step)));
  const names = ["MULTIMODAL EMBEDDING", "PSEUDO-CATEGORY LABELS", "CATEGORY ALIGNMENT"];
  const captions = ["Nhiều nguồn thông tin cùng tạo một biểu diễn cho mỗi thực thể.", "Các cụm embedding tạo tín hiệu category để cùng học với tác vụ alignment.", "Thông tin category tham gia điều chỉnh phép so sánh giữa hai đồ thị."];
  $("#method-stage-name").textContent = names[state.step];
  $("#method-caption").textContent = captions[state.step];
  const colors = ["#629e81", "#a08ab8", "#c4aa68", "#7d9db8", "#b88c83"];
  let markup = "";
  if (state.step === 2) {
    for (let i = 0; i < 5; i++) markup += `<path d="M145 ${47 + i*45} C210 ${47+i*45} 250 ${47+i*45} 315 ${47+i*45}" fill="none" stroke="${colors[i]}" stroke-width="1.5" stroke-dasharray="4 5" opacity=".6"/>`;
    markup += '<text x="135" y="20" text-anchor="middle" font-size="12">ĐỒ THỊ NGUỒN</text><text x="325" y="20" text-anchor="middle" font-size="12">ĐỒ THỊ ĐÍCH</text>';
  }
  for (let i = 0; i < 45; i++) {
    const cluster = i % 5, offset = Math.floor(i / 5);
    let x, y;
    if (state.step === 0) { x = 45 + (i * 67) % 365; y = 40 + (i * 43) % 207; }
    else if (state.step === 1) { const centers = [[105, 75], [300, 65], [225, 145], [95, 215], [345, 215]]; x = centers[cluster][0] + Math.cos(offset * 2.4) * (12 + offset * 3); y = centers[cluster][1] + Math.sin(offset * 2.4) * (9 + offset * 2.5); }
    else { const side = offset % 2; x = (side ? 325 : 135) + Math.cos(offset * 2.4) * (7 + offset * 2); y = 47 + cluster * 45 + Math.sin(offset * 2.4) * 12; }
    markup += `<circle class="method-dot" cx="${x}" cy="${y}" r="${state.step === 0 ? 5 : 5.5}" fill="${state.step === 0 ? "#a7b99b" : colors[cluster]}" opacity="${state.step === 0 ? .65 : .85}"/>`;
  }
  if (state.step === 1) markup += '<text x="232" y="283" text-anchor="middle" font-size="12">Màu là nhãn cụm minh họa, không phải nhãn phân loại có sẵn</text>';
  $("#method-svg").innerHTML = markup;
}

function renderMetrics() {
  const checkpoint = $("#metrics-checkpoint").value, mode = $("#metrics-mode").value;
  const percent = (value) => (Number(value) * 100).toFixed(2);
  $("#metrics-table").innerHTML = data.metrics.filter((row) => row.checkpoint === checkpoint).map((row) => {
    const delta = (Number(row[`${mode}_h1_avg`]) - Number(row.paper_h1)) * 100;
    return `<tr><td>${escapeHTML(row.configuration)}</td><td>${row.epoch}</td><td>${percent(row.paper_h1)}</td><td>${percent(row[`${mode}_h1_avg`])}</td><td class="${delta >= 0 ? "delta-positive" : "delta-negative"}">${delta >= 0 ? "+" : ""}${delta.toFixed(2)}</td><td>${percent(row[`${mode}_h10_avg`])}</td><td>${percent(row[`${mode}_mrr_avg`])}</td></tr>`;
  }).join("");
}

function showDialog(title, content) {
  $("#dialog-title").textContent = title;
  $("#dialog-content").innerHTML = content;
  if (!$("#evidence-dialog").open) $("#evidence-dialog").showModal();
}

function showEntity(id) {
  const row = entity(id);
  const properties = row.attributes.properties;
  showDialog("Thực thể trong benchmark", `<span class="badge ${row.side === 2 ? "purple" : ""}">${dataset(row.dataset).label} · ${row.side === 1 ? "NGUỒN" : "ĐÍCH"} · #${row.numericId}</span><h3>${escapeHTML(row.label)}</h3><p><a href="${escapeHTML(row.uri)}" target="_blank" rel="noopener noreferrer">Mở URI DBpedia ↗</a></p><p><code>${escapeHTML(row.uri)}</code></p><p>Nguồn tên và ID: <code>${escapeHTML(row.source.path)}:${row.source.line}</code></p><p><b>Tên thuộc tính trong dữ liệu</b> · ${row.attributes.total} trường</p><div class="attribute-list">${properties.length ? properties.map((uri) => `<span title="${escapeHTML(uri)}">${escapeHTML(uri.split("/").pop())}</span>`).join("") : '<span>Không có tên thuộc tính được đóng gói cho nút này</span>'}</div><p class="small-note">Các trường này chỉ có tên thuộc tính, không có giá trị. Không có tên trường trong snapshot không đồng nghĩa mô hình thiếu modality.</p>${row.attributes.source ? `<p>Nguồn thuộc tính: <code>${escapeHTML(row.attributes.source.path)}:${row.attributes.source.line}</code></p>` : ""}<p class="small-note">Bấm cạnh trên đồ thị để xem triple và dòng nguồn. Đồ thị trình bày ngữ cảnh, không phải attribution nhân quả của dự đoán.</p>`);
}

function showEdge(id, index) {
  const root = entity(id), edge = root.neighbors[index];
  const head = edge.direction === "out" ? root : entity(edge.entity), tail = edge.direction === "out" ? entity(edge.entity) : root;
  showDialog("Quan hệ trong dữ liệu gốc", `<span class="badge">${dataset(root.dataset).label} · GRAPH TRIPLE</span><h3>${escapeHTML(head.label)} → ${escapeHTML(tail.label)}</h3><p>Mã quan hệ: <b>${edge.relation}</b>. Bundle local không có bảng ánh xạ sang tên quan hệ.</p><p>Triple gốc: <code>${head.numericId}\t${edge.relation}\t${tail.numericId}</code></p><p>Nguồn: <code>${escapeHTML(edge.source.path)}:${edge.source.line}</code></p><p><code>${escapeHTML(head.uri)}</code><br /><code>${escapeHTML(tail.uri)}</code></p><p class="small-note">Đây là cạnh trong đồ thị nguồn/đích, khác với cặp alignment giữa hai đồ thị.</p>`);
}

function showPrediction(id, config, mode) {
  const pair = pairById(id), row = prediction(pair, config, mode);
  showDialog("Bản ghi dự đoán đã lưu", `<span class="badge">${dataset(id.split(":")[0]).label} · ${mode === "test" ? "TEST" : "WEIGHTED_TEST"}</span><h3>${escapeHTML(entity(pair.source).label)} ↔ ${escapeHTML(pair.title)}</h3><p>${escapeHTML(data.configurations[config])} · Seed 42 · Epoch 999 · Chiều nguồn → đích.</p><p>Hạng đáp án chuẩn: <b>#${row.rank} / 10.500</b></p><ol>${row.top3.map((key) => `<li>${escapeHTML(entity(key).label)} · #${entity(key).numericId}</li>`).join("")}</ol><p>Nguồn: <code>${escapeHTML(row.source.path)}:${row.source.line}</code></p><p>Alignment chuẩn: <code>${escapeHTML(pair.alignmentSource.path)}:${pair.alignmentSource.line}</code></p><p class="small-note">File gốc lưu rank bắt đầu từ 0; giao diện cộng 1 để hiển thị. Thứ tự top 3 giữ nguyên từ toàn bộ tập ứng viên test, không xếp hạng lại trên số thẻ đang thấy. File dự đoán không lưu điểm số.</p><p class="small-note">Cả test và weighted_test đều dùng CateEA đã huấn luyện với category supervision. Hai cách đánh giá khác ở category weighting; không phải một ablation bỏ category khỏi huấn luyện.</p>`);
}

function snapshotInfo() {
  showDialog("Cách đọc snapshot", `<p>Demo dùng <b>48 cặp test tuyển chọn</b> từ DBP15K JA–EN và ZH–EN, cùng dự đoán đã lưu của bốn cấu hình mỗi dataset.</p><p>Trình duyệt đọc JSON; không chạy inference. Các xếp hạng thuộc epoch cuối (999), chiều nguồn → đích, trên <b>10.500 ứng viên test</b>.</p><p>Table 6 là kết quả được tác giả báo cáo, trình bày riêng với kết quả tái lập. Bảng chỉ số cho phép chọn best/latest; best được chọn theo test H@1 trung bình hai chiều.</p><p>Đồ thị giữ ID quan hệ gốc. Thuộc tính chỉ có tên trường, không có giá trị. Ảnh tư liệu bổ sung không được xác nhận là ảnh gốc tạo embedding.</p><p><a href="data/provenance.json" target="_blank" rel="noopener noreferrer">File nguồn, SHA256 và quy ước ↗</a></p><p><a href="https://aclanthology.org/2025.coling-main.399.pdf#page=12" target="_blank" rel="noopener noreferrer">Đọc case study gốc · A.5, Table 6 ↗</a></p>`);
}

function installEvents() {
  document.addEventListener("click", (event) => {
    const button = event.target.closest("button, [data-inspect], [data-edge-root]");
    if (!button || button.disabled) return;
    const d = button.dataset;
    if (d.caseView || d.showCase) { state.caseView = d.caseView || d.showCase; renderCase(); }
    else if (d.caseChoice) { state.caseChoice = d.caseChoice; renderCase(); }
    else if (d.ics) { state.ics = d.ics === "on"; renderCase(); }
    else if (d.caseToLab !== undefined) jumpToPair("ja_en:8853", state.caseConfig);
    else if (d.dataset) { state.dataset = d.dataset; state.pair = d.dataset === "ja_en" ? "ja_en:8853" : "zh_en:9867"; state.candidate = null; state.graphSide = "source"; $("#entity-search").value = ""; renderLab(); }
    else if (d.pair) { state.pair = d.pair; state.candidate = null; state.graphSide = "source"; renderLab(); }
    else if (d.candidate) { state.candidate = d.candidate; state.graphSide = "target"; renderLab(); }
    else if (d.jumpPair) jumpToPair(d.jumpPair, d.jumpConfig);
    else if (d.graphView) setGraphSide(d.graphView);
    else if (d.expandGraph) openGraph(d.expandGraph);
    else if (d.inspect) showEntity(d.inspect);
    else if (d.edgeRoot) showEdge(d.edgeRoot, Number(d.edgeIndex));
    else if (d.predictionPair) showPrediction(d.predictionPair, d.predictionConfig, d.predictionMode);
    else if (d.quizIndex !== undefined) { state.quizIndex = Number(d.quizIndex); state.quizChoice = null; saveQuiz(); renderQuiz(); }
    else if (d.quizChoice) { state.quizChoice = d.quizChoice; renderQuiz(); }
    else if (d.checkQuiz !== undefined && state.quizChoice) { state.answers[data.quizzes[state.quizIndex].pair] = state.quizChoice; saveQuiz(); renderQuiz(); }
    else if (d.nextQuiz !== undefined) { state.quizIndex = (state.quizIndex + 1) % data.quizzes.length; state.quizChoice = null; saveQuiz(); renderQuiz(); }
    else if (d.openPaper !== undefined) { state.caseView = "paper"; renderCase(); $("#paper-case").scrollIntoView(); }
    else if (d.step !== undefined) { state.step = Number(d.step); renderMethod(); }
  });
  document.addEventListener("keydown", (event) => {
    if ((event.key === "Enter" || event.key === " ") && event.target.matches("svg [role=button]")) { event.preventDefault(); event.target.dispatchEvent(new MouseEvent("click", { bubbles: true })); }
  });
  $("#entity-search").addEventListener("input", renderPairList);
  $("#lab-config").addEventListener("change", (event) => { state.config = event.target.value; state.candidate = null; renderLab(); });
  $("#weighting-toggle").addEventListener("change", (event) => { state.weighted = event.target.checked; state.candidate = null; renderLab(); });
  $("#case-content").addEventListener("change", (event) => { if (event.target.id === "case-config") { state.caseConfig = event.target.value; renderCase(); } });
  $("#quiz-reset").addEventListener("click", () => { state.answers = {}; state.quizIndex = 0; state.quizChoice = null; saveQuiz(); renderQuiz(); });
  $("#metrics-checkpoint").addEventListener("change", renderMetrics);
  $("#metrics-mode").addEventListener("change", renderMetrics);
  $("#snapshot-info").addEventListener("click", snapshotInfo);
  $("#dialog-close").addEventListener("click", () => $("#evidence-dialog").close());
  $("#graph-dialog-close").addEventListener("click", () => $("#graph-dialog").close());
  for (const dialog of [$("#evidence-dialog"), $("#graph-dialog")]) {
    dialog.addEventListener("click", (event) => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) event.currentTarget.close(); } });
  }
  window.addEventListener("resize", () => layoutGraphSurfaces());
}

async function start() {
  try {
    const response = await fetch("data/demo.json");
    if (!response.ok) throw new Error("Snapshot unavailable");
    data = await response.json();
    $("#lab-config").innerHTML = configOptions(state.config);
    restoreQuiz();
    renderCase(); renderPaperTable(); renderLab(); renderStories(); renderQuiz(); renderMethod(); renderMetrics();
    installEvents();
    $("#load-status").hidden = true;
    $("#app").hidden = false;
    layoutGraphSurfaces(true);
    document.fonts?.ready.then(() => layoutGraphSurfaces(true));
    if (location.hash) requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView());
    try {
      const creditsResponse = await fetch("assets/image-sources.json");
      if (creditsResponse.ok) {
        const credits = await creditsResponse.json();
        $("#image-credits").innerHTML = credits.images.map((image) => `<p><a href="${escapeHTML(image.source_page)}" target="_blank" rel="noopener noreferrer">${escapeHTML(image.entity)} ↗</a> · ${escapeHTML(image.author)} · ${escapeHTML(image.date)} · Public domain.</p>`).join("");
      }
    } catch { /* Core demo does not depend on loading the credits panel. */ }
  } catch (error) {
    $("#load-status").innerHTML = 'Chưa tải được snapshot. Hãy mở demo qua HTTP server rồi tải lại trang. Xem hướng dẫn trong demo/README.md.';
    console.error("Could not initialize CateEA demo", error);
  }
}

start();
