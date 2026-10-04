/* config.js 의 내용을 읽어 화면을 그립니다. 내용 수정은 config.js 에서 하세요. */
(function () {
  const C = window.SITE_CONFIG;
  if (!C) {
    document.body.insertAdjacentHTML("afterbegin", "<p style='padding:20px'>config.js 를 불러오지 못했습니다.</p>");
    return;
  }

  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const get = (path) => path.split(".").reduce((o, k) => (o ? o[k] : undefined), C);
  const head = (h, lead) =>
    `<div class="section-head"><h2>${esc(h)}</h2>${lead ? `<p>${esc(lead)}</p>` : ""}</div>`;
  const list = (arr, fn) => (arr || []).map(fn).join("");
  const render = (id, html) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  };

  /* ===== 움직임 허용 여부 (문 열림 등) — config 의 welcome.respectReducedMotion 이 false 면 항상 허용 ===== */
  const motionOK =
    C.welcome?.respectReducedMotion === false || !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.body.classList.toggle("motion-ok", motionOK);

  /* ===== 공통 틀: 색상 · 상징 문양 · 탭 아이콘 ===== */
  const THEME = C.theme || {};
  const rootStyle = document.documentElement.style;
  if (THEME.accent) rootStyle.setProperty("--pink", THEME.accent);
  if (THEME.accentSoft) rootStyle.setProperty("--pink-soft", THEME.accentSoft);
  if (THEME.accentDeep) rootStyle.setProperty("--pink-deep", THEME.accentDeep);
  if (C.site.badgeIcon !== undefined) rootStyle.setProperty("--badge-icon", C.site.badgeIcon ? JSON.stringify(C.site.badgeIcon + " ") : "none");
  const emblem = C.site.emblem || C.site.title.charAt(0);
  document.querySelector(".brand-mark").textContent = emblem;
  const icon = document.createElement("link");
  icon.rel = "icon";
  icon.href =
    "data:image/svg+xml," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="4" y="4" width="56" height="56" rx="8" fill="${
        THEME.accentDeep || "#244a2e"
      }"/><text x="32" y="46" font-size="40" text-anchor="middle" font-family="serif" font-weight="700" fill="#15111c">${esc(
        [...emblem][0]
      )}</text></svg>`
    );
  document.head.appendChild(icon);

  /* ===== 히어로 ===== */
  document.querySelectorAll("[data-bind]").forEach((el) => {
    el.textContent = get(el.dataset.bind) ?? "";
    if (!el.textContent && el.classList.contains("hero-ja")) el.hidden = true;
  });
  document.title = `${C.site.title} | ${C.site.university} ${C.site.department}`;
  document.querySelector(".hero-eyebrow").textContent = `${C.site.university} ${C.site.department}`;
  render(
    "hero-buttons",
    list(C.site.buttons, (b) => `<a class="btn${b.primary ? "" : " btn-ghost"}" href="${esc(b.target)}">${esc(b.text)}</a>`)
  );
  render(
    "quick-info",
    list(
      C.quickInfo,
      (q) => `<div class="card quick-item"><span class="quick-icon">${esc(q.icon)}</span>
        <div><p class="quick-label">${esc(q.label)}</p><p class="quick-value">${esc(q.value)}</p></div></div>`
    )
  );

  /* ===== 섹션 보이기/숨기기 (config 의 sections 에서 false 로 둔 섹션은 감추고 메뉴에서도 뺍니다) ===== */
  Object.entries(C.sections || {}).forEach(([id, on]) => {
    const el = document.getElementById(id);
    if (on === false && el && el.tagName === "SECTION") el.hidden = true;
  });
  const navItems = (C.nav || []).filter((n) => {
    const el = document.getElementById(n.target);
    return el && !el.hidden;
  });

  /* ===== 메뉴 ===== */
  const nav = document.getElementById("site-nav");
  nav.innerHTML = list(navItems, (n) => `<a href="#${esc(n.target)}">${esc(n.label)}</a>`);

  /* ===== 프로그램 소개: 통계 + 강점 슬라이드 ===== */
  const A = C.about;
  render(
    "about",
    head(A.heading, A.lead) +
      `<div class="grid stats">${list(
        A.stats,
        (s) => `<div class="card stat"><p class="stat-num"><span data-count="${Number(s.value) || 0}">0</span><small>${esc(
          s.suffix
        )}</small></p><p class="stat-label">${esc(s.label)}</p></div>`
      )}</div>
      <h3 class="sub-heading">${esc(A.strengthsHeading)}</h3>
      <div class="slider">
        <button class="slider-btn prev" aria-label="이전">‹</button>
        <div class="slider-track" tabindex="0">${list(
          A.strengths,
          (c) => `<article class="card slide"><div class="feature-icon">${esc(c.icon)}</div>
            <h3>${esc(c.title)}</h3><p>${esc(c.body)}</p></article>`
        )}</div>
        <button class="slider-btn next" aria-label="다음">›</button>
      </div>
      <div class="slider-dots"></div>`
  );

  /* ===== 페이지 편집 도우미 =====
   * 관리자가 '편집 모드'를 켜면(body.editing) 아래 섹션들이 그 자리에서 고칠 수 있는 모양으로 다시 그려집니다.
   * 실제 고치기·저장은 editor.js 가 맡습니다. */
  const editing = () => document.body.classList.contains("editing");
  // 글자를 그 자리에서 고칠 수 있게 표시 (편집 모드가 아니면 아무것도 붙지 않음)
  const E = (path, opt = {}) =>
    editing()
      ? ` data-edit="${path}" contenteditable="true" spellcheck="false" data-ph="${esc(opt.ph || "내용 입력")}"${opt.multi ? " data-multi" : ""}`
      : "";
  // 날짜·링크처럼 입력칸이 필요한 값
  const EI = (path, value, label, type = "text", extra = "") =>
    editing()
      ? `<label class="ei"><span>${label}</span><input type="${type}" data-edit-input="${path}" value="${esc(value ?? "")}" ${extra}/></label>`
      : "";
  // 목록 항목 옆의 ↑ ↓ ✕ 버튼
  const ETools = (arrPath, i, len, more = "") =>
    editing()
      ? `<span class="edit-tools">${more}<button type="button" data-act="up" data-path="${arrPath}" data-i="${i}" ${i === 0 ? "disabled" : ""} title="위로" aria-label="위로">↑</button><button type="button" data-act="down" data-path="${arrPath}" data-i="${i}" ${i === len - 1 ? "disabled" : ""} title="아래로" aria-label="아래로">↓</button><button type="button" class="danger" data-act="del" data-path="${arrPath}" data-i="${i}" title="삭제" aria-label="삭제">✕</button></span>`
      : "";
  const EAdd = (arrPath, tpl, label, i) =>
    editing()
      ? `<button type="button" class="edit-add" data-act="${i === undefined ? "add" : "add-after"}" data-path="${arrPath}" data-tpl="${tpl}"${i === undefined ? "" : ` data-i="${i}"`}>+ ${label}</button>`
      : "";
  const headE = (sec, path) =>
    `<div class="section-head"><h2${E(path + ".heading", { ph: "제목" })}>${esc(sec.heading)}</h2>${
      sec.lead || editing() ? `<p${E(path + ".lead", { ph: "안내 문구 (비워 두면 숨김)" })}>${esc(sec.lead || "")}</p>` : ""
    }</div>`;

  /* ===== 커리큘럼: 날짜 계산 ===== */
  const K = C.curriculum;
  const DOW = ["일", "월", "화", "수", "목", "금", "토"];
  const parseDate = (s) => {
    // "YYYY-MM-DD" 또는 "YYYY-MM-DDTHH:MM" 을 현지 시각으로 해석
    const [d, t = "00:00"] = String(s || "").split("T");
    const [y, m, day] = d.split("-").map(Number);
    const [hh, mm] = t.split(":").map(Number);
    return new Date(y || 2000, (m || 1) - 1, day || 1, hh || 0, mm || 0);
  };
  const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const fmtDate = (d) => `${d.getMonth() + 1}월 ${d.getDate()}일 (${DOW[d.getDay()]})`;
  const fmtDue = (d) => `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}. (${DOW[d.getDay()]}) ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  const now = () => (K.previewToday ? parseDate(K.previewToday) : new Date());

  // 주차별 수업일, 날짜별 수업·마감 정보 — 편집으로 일정이 바뀌면 다시 계산합니다.
  let weeks = [], byDate = {}, firstDay, lastDay, holidayIdx = {}, weekStart;
  function computeSchedule() {
    K.weeks ||= [];
    K.holidays ||= [];
    K.weeks.forEach((w) => {
      w.sessions ||= [];
      w.videos ||= [];
    });
    holidayIdx = Object.fromEntries(K.holidays.map((h, i) => [h.date, i]));
    const classDays = (K.classDays && K.classDays.length ? K.classDays : [1]).slice().sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
    const start = parseDate(K.startDate);
    weekStart = addDays(start, -((start.getDay() + 6) % 7)); // 1주차가 시작되는 월요일
    byDate = {};
    const slot = (key) => (byDate[key] ||= { sessions: [], dues: [] });
    weeks = K.weeks.map((w, i) => {
      const monday = addDays(weekStart, i * 7);
      const days = classDays
        .map((dow, j) => ({ j, date: addDays(monday, (dow + 6) % 7) }))
        .filter(({ date }) => date >= start) // 개강일 이전 요일은 수업 없음
        .map(({ j, date }) => {
          const key = ymd(date);
          const hi = holidayIdx[key];
          const s = { week: i + 1, j, date, key, topic: w.sessions[j] || w.title, rawTopic: w.sessions[j] || "", holiday: hi === undefined ? undefined : K.holidays[hi].name || "휴강", hi };
          slot(key).sessions.push(s);
          return s;
        });
      const a = w.assignment ? { ...w.assignment, week: i + 1, dueDate: parseDate(w.assignment.due) } : null;
      if (a) slot(ymd(a.dueDate)).dues.push(a);
      return { ...w, no: i + 1, days, assignment: a, location: w.location || K.location };
    });
    const allDays = weeks.flatMap((w) => w.days);
    firstDay = allDays[0]?.date || start;
    lastDay = allDays[allDays.length - 1]?.date || start;
    if (window.COURSE) Object.assign(window.COURSE, { weeks, byDate });
  }
  computeSchedule();
  // 그 주의 일요일 23:59 (새 과제의 기본 마감)
  const weekSunday = (i) => `${ymd(addDays(weekStart, i * 7 + 6))}T23:59`;

  // 마감까지 남은 시간
  const remain = (due) => {
    const ms = due - now();
    if (ms <= 0) return { text: "마감되었습니다", cls: "closed", closed: true };
    const d = Math.floor(ms / 864e5), h = Math.floor((ms % 864e5) / 36e5), m = Math.floor((ms % 36e5) / 6e4);
    const text = d > 0 ? `D-${d} · ${d}일 ${h}시간 남음` : h > 0 ? `오늘 마감 · ${h}시간 ${m}분 남음` : `곧 마감 · ${m}분 남음`;
    return { text, cls: d < 1 ? "urgent" : d < 3 ? "soon" : "", closed: false };
  };

  const assignmentHTML = (a, p) => `
    <div class="assignment" data-due="${esc(a.due)}">
      <div class="assignment-head"><span class="tag">과제</span><h4${E(p + ".title", { ph: "과제 제목" })}>${esc(a.title)}</h4>
        ${editing() ? `<button type="button" class="edit-add danger" data-act="del-key" data-path="${p}">과제 없애기</button>` : ""}</div>
      <p class="pre-line"${E(p + ".desc", { multi: true, ph: "과제 설명" })}>${esc(a.desc)}</p>
      ${EI(p + ".due", a.due, "마감 일시", "datetime-local")}
      <div class="assignment-foot">
        <div><p class="due-label">마감 ${esc(fmtDue(a.dueDate))}</p><p class="countdown"></p></div>
        ${
          a.submitUrl || K.submitUrl
            ? `<a class="btn btn-sm submit-btn" href="${esc(a.submitUrl || K.submitUrl)}" target="_blank" rel="noopener">제출하기</a>`
            : `<a class="btn btn-sm submit-btn" href="#portal" data-submit-week="${a.week}">제출하기</a>`
        }
      </div>
    </div>`;

  const sessionLine = (s, p) => {
    const topic = editing()
      ? `<span class="s-topic"${E(`${p}.sessions.${s.j}`, { ph: "이 날 수업 내용" })}>${esc(s.rawTopic)}</span>`
      : `<span class="s-topic">${esc(s.topic)}</span>`;
    if (!s.holiday) return `<li><span class="s-date">${esc(fmtDate(s.date))}</span>${topic}</li>`;
    return editing()
      ? `<li class="is-holiday"><span class="s-date">${esc(fmtDate(s.date))}</span><span class="s-topic">휴강 — <span${E(`curriculum.holidays.${s.hi}.name`, { ph: "휴강 사유" })}>${esc(s.holiday)}</span></span></li>`
      : `<li class="is-holiday"><span class="s-date">${esc(fmtDate(s.date))}</span><span class="s-topic">휴강 — ${esc(s.holiday)}</span></li>`;
  };

  // 편집 모드: 수업 기본 설정(개강일·요일·시간·장소·휴강일)
  const scheduleSettings = () => {
    if (!editing()) return "";
    const days = K.classDays || [];
    return `<div class="card edit-panel">
      <p class="edit-panel-title">⚙️ 수업 기본 설정 <small>바꾸면 모든 날짜가 다시 계산됩니다</small></p>
      <div class="edit-grid">
        ${EI("curriculum.startDate", K.startDate, "개강일", "date")}
        <div class="ei"><span>수업 요일</span><div class="day-checks">${[1, 2, 3, 4, 5, 6, 0]
          .map((d) => `<label><input type="checkbox" data-edit-days value="${d}" ${days.includes(d) ? "checked" : ""}/>${DOW[d]}</label>`)
          .join("")}</div></div>
        ${EI("curriculum.time", K.time, "수업 시간")}
        ${EI("curriculum.location", K.location, "기본 장소")}
        ${EI("curriculum.submitUrl", K.submitUrl, "외부 제출 링크 (비우면 사이트 안에서 제출)", "url", 'placeholder="https://"')}
        ${EI("curriculum.previewToday", K.previewToday, "미리보기 날짜 (평소엔 비움)", "datetime-local")}
      </div>
      <div class="ei"><span>휴강일 — 달력에서 날짜를 눌러 지정할 수도 있어요</span><div class="chips">${
        K.holidays.length
          ? K.holidays
              .map((h, i) => `<span class="chip-edit">${esc(h.date)} ${esc(h.name)}<button type="button" data-act="del" data-path="curriculum.holidays" data-i="${i}" aria-label="휴강일 삭제">✕</button></span>`)
              .join("")
          : `<span class="muted small">없음</span>`
      }</div></div>
    </div>`;
  };

  const weekHTML = (w) => {
    const i = w.no - 1, p = `curriculum.weeks.${i}`;
    const range = w.days.length
      ? [...new Set([w.days[0], w.days[w.days.length - 1]].map((d) => fmtDate(d.date).replace(/ \(.\)/, "")))].join(" – ")
      : "수업일 없음";
    return `<details class="card week-item" id="week-${w.no}">
      <summary>
        <span class="week-no">${w.no}주</span>
        <span class="week-title"><strong>${esc(w.title)}</strong><small>${esc(w.desc)}</small></span>
        <span class="week-meta">${esc(range)}${w.assignment ? `<span class="tag">과제</span>` : ""}</span>
        <span class="chev" aria-hidden="true"></span>
      </summary>
      <div class="week-body">
        ${
          editing()
            ? `<div class="edit-row-head">${ETools("curriculum.weeks", i, weeks.length)}</div>
               <div class="edit-fields">
                 <div class="ef"><span>주차 제목</span><strong${E(p + ".title", { ph: "주차 제목" })}>${esc(K.weeks[i].title)}</strong></div>
                 <div class="ef"><span>한 줄 설명</span><span${E(p + ".desc", { ph: "한 줄 설명" })}>${esc(K.weeks[i].desc)}</span></div>
                 ${EI(p + ".location", K.weeks[i].location || "", "이 주만 장소가 다르면", "text", `placeholder="${esc(K.location)}"`)}
               </div>`
            : ""
        }
        <div class="week-facts">
          <div><span>📅 날짜</span>${w.days.map((d) => esc(fmtDate(d.date))).join(" · ") || "—"}</div>
          <div><span>⏰ 시간</span>${esc(K.time)}</div>
          <div><span>📍 장소</span>${esc(w.location)}</div>
        </div>
        <h4>학습 내용</h4>
        <ul class="sessions">${list(w.days, (s) => sessionLine(s, p))}</ul>
        ${
          editing()
            ? `<h4>참고 영상</h4><ul class="videos edit">${list(
                K.weeks[i].videos,
                (v, k) => `<li><span${E(`${p}.videos.${k}.title`, { ph: "영상 제목" })}>${esc(v.title)}</span>
                  ${EI(`${p}.videos.${k}.url`, v.url, "링크", "url")}${ETools(p + ".videos", k, K.weeks[i].videos.length)}</li>`
              )}</ul>${EAdd(p + ".videos", "video", "영상 추가")}`
            : (w.videos || []).length
            ? `<h4>참고 영상</h4><ul class="videos">${list(
                w.videos,
                (v) => `<li><a href="${esc(v.url)}" target="_blank" rel="noopener">▶ ${esc(v.title)}</a></li>`
              )}</ul>`
            : ""
        }
        ${w.assignment ? assignmentHTML(w.assignment, p + ".assignment") : editing() ? `<p><button type="button" class="edit-add" data-act="add-assignment" data-i="${i}">+ 과제 추가</button></p>` : ""}
        ${editing() ? `<div class="edit-after">${EAdd("curriculum.weeks", "week", "이 다음에 주차 넣기", i)}</div>` : ""}
      </div>
    </details>`;
  };

  // 화면 상태 (다시 그려도 유지)
  const today0 = now();
  let view = today0 >= firstDay && today0 <= addDays(lastDay, 7) ? new Date(today0.getFullYear(), today0.getMonth(), 1) : new Date(firstDay.getFullYear(), firstDay.getMonth(), 1);
  let selected = ymd(today0 >= firstDay && today0 <= lastDay ? today0 : firstDay);
  const curEl = document.getElementById("curriculum");

  function renderCurriculum() {
    const openWeeks = [...curEl.querySelectorAll(".week-item[open]")].map((d) => d.id);
    computeSchedule();
    curEl.innerHTML =
      headE(K, "curriculum") +
      scheduleSettings() +
      `<div class="week-list">${list(weeks, weekHTML)}</div>
      ${editing() && !weeks.length ? `<p class="center">${EAdd("curriculum.weeks", "week", "주차 추가")}</p>` : ""}
      <h3 class="sub-heading"${E("curriculum.calendarHeading", { ph: "달력 제목" })}>${esc(K.calendarHeading)}</h3>
      <p class="sub-lead"${E("curriculum.calendarLead", { ph: "달력 안내 문구" })}>${esc(K.calendarLead)}</p>
      <div class="calendar-wrap">
        <div class="card calendar">
          <div class="cal-head">
            <button class="cal-nav" data-step="-1" aria-label="이전 달">‹</button>
            <h4 class="cal-title" aria-live="polite"></h4>
            <button class="cal-nav" data-step="1" aria-label="다음 달">›</button>
          </div>
          <div class="cal-grid cal-dow">${DOW.map((d) => `<span>${d}</span>`).join("")}</div>
          <div class="cal-grid cal-days"></div>
          <div class="cal-legend"><span><i class="lg-class"></i>수업</span><span><i class="lg-holiday"></i>휴강</span><span><i class="lg-due"></i>과제 마감</span><span><i class="lg-today"></i>오늘</span></div>
        </div>
        <div class="card day-panel" aria-live="polite"></div>
      </div>`;
    openWeeks.forEach((id) => {
      const d = document.getElementById(id);
      if (d) d.open = true;
    });
    drawCalendar();
    drawPanel();
    updateCountdowns();
  }

  // participate.js 등 다른 스크립트에서 쓸 수 있도록 일정 정보를 공개
  window.COURSE = { weeks, byDate, now, parseDate, ymd, fmtDate, fmtDue, remain, esc };

  /* 남은 시간 표시 (1분마다 갱신) */
  function updateCountdowns() {
    curEl.querySelectorAll(".assignment").forEach((el) => {
      const r = remain(parseDate(el.dataset.due));
      const cd = el.querySelector(".countdown");
      cd.textContent = r.text;
      cd.className = "countdown " + r.cls;
      const btn = el.querySelector(".submit-btn");
      btn.classList.toggle("disabled", r.closed);
      btn.textContent = r.closed ? "제출 마감" : "제출하기";
      r.closed ? btn.setAttribute("aria-disabled", "true") : btn.removeAttribute("aria-disabled");
    });
  }

  /* ===== 월간 달력 ===== */
  function drawCalendar() {
    const today = now();
    const y = view.getFullYear(), m = view.getMonth();
    curEl.querySelector(".cal-title").textContent = `${y}년 ${m + 1}월`;
    const lead = new Date(y, m, 1).getDay();
    const total = new Date(y, m + 1, 0).getDate();
    let html = "";
    for (let i = 0; i < lead; i++) html += `<span class="cal-empty"></span>`;
    for (let d = 1; d <= total; d++) {
      const date = new Date(y, m, d);
      const key = ymd(date);
      const info = byDate[key];
      const cls = ["cal-day"];
      if (info?.sessions.length) cls.push(info.sessions.every((s) => s.holiday) ? "has-holiday" : "has-class");
      if (info?.dues.length) cls.push("has-due");
      if (key === ymd(today)) cls.push("is-today");
      if (key === selected) cls.push("is-selected");
      if (date.getDay() === 0) cls.push("sun");
      if (date.getDay() === 6) cls.push("sat");
      const label = info?.sessions.length ? `${info.sessions[0].week}주` : "";
      html += `<button class="${cls.join(" ")}" data-key="${key}" aria-pressed="${key === selected}" aria-label="${m + 1}월 ${d}일">
        <span class="d-num">${d}</span>${label ? `<span class="d-label">${label}</span>` : ""}${info?.dues.length ? `<i class="d-due"></i>` : ""}</button>`;
    }
    curEl.querySelector(".cal-days").innerHTML = html;
  }

  function drawPanel() {
    const panel = curEl.querySelector(".day-panel");
    const date = parseDate(selected);
    const info = byDate[selected];
    let html = `<p class="panel-date">${esc(`${date.getFullYear()}년 ${fmtDate(date)}`)}</p>`;
    if (!info) {
      html += `<p class="panel-empty">이 날은 수업이 없습니다.</p>`;
    } else {
      info.sessions.forEach((s) => {
        const w = weeks[s.week - 1];
        const p = `curriculum.weeks.${s.week - 1}`;
        if (s.holiday) {
          html += `<div class="panel-block holiday"><span class="tag">휴강</span><h4${E(`curriculum.holidays.${s.hi}.name`, { ph: "휴강 사유" })}>${esc(s.holiday)}</h4>
            <p>${s.week}주차 「${esc(w.title)}」 수업이 없습니다.</p>
            ${editing() ? `<button type="button" class="edit-add" data-act="holiday-off" data-date="${s.key}">휴강 해제</button>` : ""}</div>`;
        } else {
          html += `<div class="panel-block"><span class="tag">${s.week}주차</span>
            ${editing() ? `<p class="edit-hint">이 날 수업 내용</p><h4${E(`${p}.sessions.${s.j}`, { ph: "이 날 수업 내용" })}>${esc(s.rawTopic)}</h4>` : `<h4>${esc(s.topic)}</h4>`}
            <p class="muted">${esc(w.title)} — ${esc(w.desc)}</p>
            <ul class="panel-facts"><li>⏰ ${esc(K.time)}</li><li>📍 ${esc(w.location)}</li></ul>
            <a class="text-link" href="#week-${s.week}" data-open-week="${s.week}">${s.week}주차 자세히 보기 →</a>
            ${editing() ? `<p><button type="button" class="edit-add danger" data-act="holiday-on" data-date="${s.key}">이 날 휴강으로 지정</button></p>` : ""}</div>`;
        }
      });
      info.dues.forEach((a) => {
        html += `<div class="panel-block due"><span class="tag">과제 마감</span><h4>${esc(a.title)}</h4>
          <p class="muted">${esc(fmtDue(a.dueDate))} 마감 · ${esc(remain(a.dueDate).text)}</p>
          <a class="text-link" href="#week-${a.week}" data-open-week="${a.week}">${a.week}주차 과제 보기 →</a></div>`;
      });
    }
    panel.innerHTML = html;
  }

  // 커리큘럼 영역의 클릭 (다시 그려도 계속 동작하도록 섹션에 한 번만 연결)
  curEl.addEventListener("click", (e) => {
    if (e.target.closest(".submit-btn.disabled")) return e.preventDefault();
    const nav = e.target.closest(".cal-nav");
    if (nav) {
      view = new Date(view.getFullYear(), view.getMonth() + Number(nav.dataset.step), 1);
      return drawCalendar();
    }
    const day = e.target.closest(".cal-day");
    if (day) {
      selected = day.dataset.key;
      drawCalendar();
      drawPanel();
      if (window.innerWidth < 960) curEl.querySelector(".day-panel").scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }
    // 달력에서 "자세히 보기"를 누르면 해당 주차를 펼쳐서 이동
    const open = e.target.closest("[data-open-week]");
    if (open) {
      e.preventDefault();
      const item = document.getElementById("week-" + open.dataset.openWeek);
      item.open = true;
      item.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  renderCurriculum();
  setInterval(() => {
    updateCountdowns();
    if (!editing()) drawPanel(); // 편집 중에는 쓰고 있는 글이 지워지지 않도록 다시 그리지 않음
  }, 60000);

  /* ===== 우수 과제 포트폴리오 ===== */
  const pfEl = document.getElementById("portfolio");
  function renderPortfolio() {
    if (!pfEl) return;
    const PF = (C.portfolio ||= { heading: "우수 과제 포트폴리오", lead: "", items: [] });
    PF.items ||= [];
    const cards = list(PF.items, (it, i) => {
      const p = `portfolio.items.${i}`;
      const cover = it.image
        ? `<img src="${esc(it.image)}" alt="${esc(it.title)}" loading="lazy" />`
        : `<span class="pf-emblem" aria-hidden="true">${esc(C.site.emblem || C.site.title.charAt(0))}</span>`;
      return `<article class="card pf-card">
        <div class="pf-cover">${cover}${
          editing()
            ? `<div class="pf-cover-tools"><label class="edit-add">🖼 이미지 ${it.image ? "바꾸기" : "올리기"}<input type="file" accept="image/*" data-edit-image="${p}.image" hidden /></label>${
                it.image ? `<button type="button" class="edit-add danger" data-act="clear" data-path="${p}.image">이미지 지우기</button>` : ""
              }</div>`
            : ""
        }</div>
        <div class="pf-body">
          ${it.assignment || editing() ? `<span class="tag"${E(p + ".assignment", { ph: "과제 이름" })}>${esc(it.assignment || "")}</span>` : ""}
          <h3${E(p + ".title", { ph: "작품 제목" })}>${esc(it.title)}</h3>
          <p class="pf-student"${E(p + ".student", { ph: "수강생 이름" })}>${esc(it.student)}</p>
          <p class="pf-desc pre-line"${E(p + ".desc", { multi: true, ph: "작품 소개" })}>${esc(it.desc)}</p>
          ${
            editing()
              ? EI(p + ".link", it.link, "작품 링크 (선택)", "url", 'placeholder="https://"') + ETools("portfolio.items", i, PF.items.length)
              : it.link
              ? `<a class="text-link" href="${esc(it.link)}" target="_blank" rel="noopener">작품 보기 →</a>`
              : ""
          }
        </div>
      </article>`;
    });
    pfEl.innerHTML =
      headE(PF, "portfolio") +
      (PF.items.length ? `<div class="grid pf-grid">${cards}</div>` : `<p class="center muted">아직 등록된 작품이 없습니다.</p>`) +
      `<p class="center">${EAdd("portfolio.items", "portfolio", "작품 추가")}</p>`;
  }
  renderPortfolio();

  /* ===== 실습 도구 ===== */
  const T = C.tools;
  render(
    "tools",
    head(T.heading, T.lead) +
      `<div class="grid grid-4">${list(
        T.items,
        (t) => `<article class="card tool"><div class="tool-icon">${esc(t.icon)}</div>
          <h3>${esc(t.name)}</h3><p>${esc(t.use)}</p></article>`
      )}</div>`
  );

  /* ===== 수강 안내 + 준비물 ===== */
  const EN = C.enroll;
  render(
    "enroll",
    head(EN.heading, EN.lead) +
      `<div class="card narrow"><dl class="info-list">${list(
        EN.items,
        (i) => `<div class="info-row"><dt>${esc(i.label)}</dt><dd>${esc(i.value)}</dd></div>`
      )}</dl></div>
      <h3 class="sub-heading">${esc(EN.prepHeading)}</h3>
      <div class="grid grid-4">${list(
        EN.prep,
        (p) => `<article class="card prep"><span class="prep-icon">${esc(p.icon)}</span>
          <h3>${esc(p.title)}</h3><p>${esc(p.desc)}</p></article>`
      )}</div>`
  );

  /* ===== FAQ ===== */
  const faqEl = document.getElementById("faq");
  function renderFAQ() {
    const F = C.faq;
    F.items ||= [];
    faqEl.innerHTML =
      headE(F, "faq") +
      `<div class="faq-list">${list(F.items, (f, i) =>
        editing()
          ? `<div class="card faq-item faq-edit">
              <div class="faq-q"><span class="faq-mark">Q.</span><strong${E(`faq.items.${i}.q`, { ph: "질문" })}>${esc(f.q)}</strong>${ETools("faq.items", i, F.items.length)}</div>
              <div class="answer pre-line"${E(`faq.items.${i}.a`, { multi: true, ph: "답변" })}>${esc(f.a)}</div>
            </div>`
          : `<details class="card faq-item"><summary>${esc(f.q)}</summary>
              <div class="answer pre-line">${esc(f.a)}</div></details>`
      )}</div>
      <p class="center">${EAdd("faq.items", "faq", "질문 추가")}</p>`;
  }
  renderFAQ();

  /* ===== 공지사항 + 공지 팝업 =====
   * 공지마다 '팝업으로 띄우기'(popup: true)를 켜면 접속할 때 팝업으로 보여 줍니다.
   * 편집 모드에서는 공지와 팝업 설정을 본문·팝업 안에서 바로 고칩니다. */
  const noticeEl = document.getElementById("notice");
  const store = {
    get(k, d) {
      try {
        const v = localStorage.getItem((window.SITE_NS || "course:") + k);
        return v == null ? d : JSON.parse(v);
      } catch {
        return d;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem((window.SITE_NS || "course:") + k, JSON.stringify(v));
      } catch {}
    },
  };
  const realToday = ymd(new Date());
  const fmtNoticeDate = (d) => String(d || "").replace(/-/g, ".");
  // 중요 공지 먼저, 그다음 최신순 (편집용 경로를 위해 원래 위치 i 를 함께 보관)
  const sortedNotices = () =>
    (C.notices || [])
      .map((n, i) => ({ n, i }))
      .sort((a, b) => (b.n.pinned ? 1 : 0) - (a.n.pinned ? 1 : 0) || String(b.n.date).localeCompare(String(a.n.date)));
  // 팝업에 띄울 공지: 기본은 '가장 최신 공지 1개'(popup.show: "latest"), "selected" 면 '팝업으로 띄우기'를 켠 공지들
  const popupMode = () => (C.popup?.show === "selected" ? "selected" : "latest");
  const latestNotice = () =>
    (C.notices || [])
      .map((n, i) => ({ n, i }))
      .reduce((best, x) => (!best || String(x.n.date) >= String(best.n.date) ? x : best), null);
  const popupNotices = () =>
    popupMode() === "latest" ? (latestNotice() ? [latestNotice()] : []) : sortedNotices().filter(({ n }) => n.popup);
  const popsUp = (i) => popupNotices().some((x) => x.i === i);

  function renderNotices() {
    if (!noticeEl) return;
    C.notices ||= [];
    const PU = (C.popup ||= {});
    const list2 = sortedNotices();
    const off = C.sections?.notice === false;
    noticeEl.hidden = off || (!list2.length && !editing());
    if (noticeEl.hidden) return (noticeEl.innerHTML = "");

    if (editing()) {
      const settings = `<div class="card edit-panel">
        <p class="edit-panel-title">📢 공지 팝업 설정 <small>접속할 때 공지를 팝업으로 보여 줍니다</small></p>
        <div class="edit-grid">
          <label class="ei-check"><input type="checkbox" data-edit-input="popup.enabled" data-type="bool" ${PU.enabled ? "checked" : ""}/> 공지 팝업 사용</label>
          <label class="ei-check"><input type="checkbox" data-edit-input="popup.confetti" data-type="bool" ${PU.confetti !== false ? "checked" : ""}/> 팝업이 뜰 때 폭죽 🎉</label>
          <label class="ei"><span>어떤 공지를 띄울까요?</span><select data-edit-input="popup.show">
            <option value="latest" ${popupMode() === "latest" ? "selected" : ""}>가장 최신 공지 1개 (자동)</option>
            <option value="selected" ${popupMode() === "selected" ? "selected" : ""}>'팝업으로 띄우기'를 켠 공지</option>
          </select></label>
          ${EI("popup.delaySeconds", PU.delaySeconds ?? 1.5, "접속 후 뜨는 시간(초)", "number", 'min="0" step="0.5" data-type="num"')}
          <div class="ef"><span>팝업 위쪽 배지</span><span${E("popup.badge", { ph: "공지사항" })}>${esc(PU.badge || "")}</span></div>
          <div class="ef"><span>'하루 보지 않기' 문구</span><span${E("popup.hideTodayText", { ph: "오늘 하루 보지 않기" })}>${esc(PU.hideTodayText || "")}</span></div>
        </div>
        <p class="edit-hint">지금 팝업에 뜨는 공지: ${
          popupNotices().length ? popupNotices().map(({ n }) => `「${esc(n.title)}」`).join(", ") : "없음"
        } ${
          popupNotices().length ? `<button type="button" class="edit-add" data-popup-preview>👀 팝업 미리보기 (팝업 안에서도 바로 고칠 수 있어요)</button>` : ""
        }</p>
      </div>`;
      noticeEl.innerHTML =
        head("공지사항") +
        settings +
        `<div class="notice-list">${list(
          list2,
          ({ n, i }) => `<div class="card notice-item notice-edit${n.pinned ? " pinned" : ""}">
            <div class="ne-top">
              ${n.pinned ? `<span class="tag">중요</span>` : ""}${popsUp(i) ? `<span class="tag tag-popup">팝업</span>` : ""}
              <strong${E(`notices.${i}.title`, { ph: "공지 제목" })}>${esc(n.title)}</strong>
              <span class="edit-tools"><button type="button" class="danger" data-act="del" data-path="notices" data-i="${i}" aria-label="공지 삭제" title="삭제">✕</button></span>
            </div>
            <p class="pre-line"${E(`notices.${i}.body`, { multi: true, ph: "공지 내용" })}>${esc(n.body)}</p>
            <div class="fe-opts">
              ${EI(`notices.${i}.date`, n.date, "게시일", "date")}
              <label class="ei-check"><input type="checkbox" data-edit-input="notices.${i}.pinned" data-type="bool" ${n.pinned ? "checked" : ""}/> 중요 공지로 맨 위에 고정</label>
              ${
                popupMode() === "selected"
                  ? `<label class="ei-check"><input type="checkbox" data-edit-input="notices.${i}.popup" data-type="bool" ${n.popup ? "checked" : ""}/> 팝업으로 띄우기</label>`
                  : ""
              }
            </div>
            <div class="fe-opts">
              ${EI(`notices.${i}.buttonText`, n.buttonText, "팝업 버튼 문구 (선택)", "text", 'placeholder="예: 자세히 보기"')}
              ${EI(`notices.${i}.buttonTarget`, n.buttonTarget, "버튼 이동 위치 (선택)", "text", 'placeholder="#curriculum 또는 https://"')}
            </div>
          </div>`
        )}</div>
        <p class="center">${EAdd("notices", "notice", "공지 추가")}</p>`;
      return;
    }

    noticeEl.innerHTML =
      head("공지사항") +
      `<div class="notice-list">${list(
        list2,
        ({ n }, k) => `<details class="card notice-item${n.pinned ? " pinned" : ""}" ${k === 0 ? "open" : ""}>
          <summary>${n.pinned ? `<span class="tag">중요</span>` : ""}<strong>${esc(n.title)}</strong><time>${esc(fmtNoticeDate(n.date))}</time></summary>
          <p class="pre-line">${esc(n.body)}</p>
          ${n.buttonText && n.buttonTarget ? `<p class="notice-link"><a class="text-link" href="${esc(n.buttonTarget)}">${esc(n.buttonText)} →</a></p>` : ""}</details>`
      )}</div>`;
  }
  renderNotices();

  // 공지 팝업 (여러 개면 ‹ › 로 넘겨 보기)
  let popupWrap = null;
  function openNoticePopup(preview = false) {
    const items = popupNotices();
    if (!items.length || popupWrap) return;
    if (!preview && document.body.classList.contains("admin-open")) return; // 관리자 창 작업 중에는 띄우지 않음
    const PU = C.popup || {};
    let page = 0;
    const lastFocus = document.activeElement;
    popupWrap = document.createElement("div");
    popupWrap.className = "modal-backdrop";
    const draw = () => {
      const { n, i } = items[page];
      const p = `notices.${i}`;
      const hasBtn = (n.buttonText && n.buttonTarget) || editing();
      popupWrap.innerHTML = `
        <div class="modal card notice-modal" role="dialog" aria-modal="true" aria-labelledby="np-title">
          <button class="modal-close" type="button" aria-label="닫기">×</button>
          <span class="hero-badge"${E("popup.badge", { ph: "공지사항" })}>${esc(PU.badge || "공지사항")}</span>
          ${preview && editing() ? `<p class="edit-hint">미리보기 — 점선 부분을 눌러 바로 고칠 수 있어요</p>` : ""}
          <p class="np-date">${n.pinned ? `<span class="tag">중요</span> ` : ""}${esc(fmtNoticeDate(n.date))}</p>
          <h3 id="np-title"${E(p + ".title", { ph: "공지 제목" })}>${esc(n.title)}</h3>
          <p class="np-body pre-line"${E(p + ".body", { multi: true, ph: "공지 내용" })}>${esc(n.body)}</p>
          ${
            hasBtn
              ? editing()
                ? `<p class="np-btn-edit"><span class="btn"${E(p + ".buttonText", { ph: "버튼 문구 (비우면 버튼 없음)" })}>${esc(n.buttonText || "")}</span></p>
                   ${EI(p + ".buttonTarget", n.buttonTarget, "버튼 이동 위치", "text", 'placeholder="#curriculum 또는 https://"')}`
                : `<a class="btn modal-cta" href="${esc(n.buttonTarget)}">${esc(n.buttonText)}</a>`
              : ""
          }
          ${
            items.length > 1
              ? `<div class="np-pager"><button type="button" class="cal-nav" data-np="-1" aria-label="이전 공지" ${page === 0 ? "disabled" : ""}>‹</button>
                 <span>${page + 1} / ${items.length}</span>
                 <button type="button" class="cal-nav" data-np="1" aria-label="다음 공지" ${page === items.length - 1 ? "disabled" : ""}>›</button></div>`
              : ""
          }
          <div class="modal-foot">
            <label><input type="checkbox" class="hide-today" /> <span${E("popup.hideTodayText", { ph: "오늘 하루 보지 않기" })}>${esc(PU.hideTodayText || "오늘 하루 보지 않기")}</span></label>
            <button class="text-btn modal-close-2" type="button">닫기</button>
          </div>
        </div>`;
    };
    draw();
    document.body.appendChild(popupWrap);
    requestAnimationFrame(() => popupWrap?.classList.add("show"));
    // 팝업과 함께 폭죽 (participate.js 의 폭죽 효과 사용)
    if (PU.confetti !== false) setTimeout(() => window.CELEBRATE?.(140), 150);
    popupWrap.querySelector(".modal-close").focus();

    const close = () => {
      const wrap = popupWrap;
      if (!wrap) return;
      if (!preview && wrap.querySelector(".hide-today")?.checked) store.set("popupHideDate", realToday);
      wrap.classList.remove("show");
      document.removeEventListener("keydown", onKey);
      setTimeout(() => wrap.remove(), 300);
      popupWrap = null;
      if (editing()) renderNotices(); // 팝업 안에서 고친 내용을 본문에도 반영
      lastFocus?.focus?.();
    };
    const onKey = (e) => {
      if (e.key === "Escape" && !e.target.closest?.("[data-edit]")) close();
      if (e.key === "Tab") {
        const f = [...popupWrap.querySelectorAll("button:not([disabled]), a, input, [contenteditable='true']")];
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) (e.preventDefault(), last.focus());
        else if (!e.shiftKey && document.activeElement === last) (e.preventDefault(), first.focus());
      }
    };
    document.addEventListener("keydown", onKey);
    popupWrap.addEventListener("click", (e) => {
      const nav = e.target.closest("[data-np]");
      if (nav) {
        page = Math.max(0, Math.min(items.length - 1, page + Number(nav.dataset.np)));
        draw();
        return;
      }
      if (e.target === popupWrap || e.target.closest(".modal-close, .modal-close-2, .modal-cta")) close();
    });
  }
  noticeEl?.addEventListener("click", (e) => {
    if (e.target.closest("[data-popup-preview]")) openNoticePopup(true);
  });
  // 접속하면 잠시 뒤 공지 팝업 (편집 중이거나 '오늘 하루 보지 않기'를 고른 날은 제외)
  if (C.popup?.enabled && popupNotices().length && store.get("popupHideDate", "") !== realToday) {
    setTimeout(() => {
      if (!editing()) openNoticePopup(false);
    }, (Number(C.popup.delaySeconds) || 0) * 1000);
  }

  /* ===== 다른 스크립트(editor.js, participate.js)에서 쓰는 기능 ===== */
  window.APP = {
    editing,
    E,
    EI,
    ETools,
    EAdd,
    weekSunday,
    openNoticePopup: (preview) => openNoticePopup(preview),
    rerender(id) {
      if (id === "curriculum") renderCurriculum();
      else if (id === "portfolio") renderPortfolio();
      else if (id === "faq") renderFAQ();
      else if (id === "participate") window.PARTICIPATE?.redraw();
      else if (id === "notices" || id === "popup" || id === "notice") renderNotices();
    },
    rerenderAll() {
      ["notices", "curriculum", "portfolio", "faq", "participate"].forEach((id) => this.rerender(id));
    },
  };

  /* ===== 푸터: 교수자 ===== */
  const I = C.instructor;
  const avatar = I.photo
    ? `<img class="avatar" src="${esc(I.photo)}" alt="${esc(I.name)}" />`
    : `<div class="avatar avatar-fallback" aria-hidden="true">${esc((I.name || "?").charAt(0))}</div>`;
  render(
    "instructor",
    `<div class="footer-inner">
      <p class="footer-heading">${esc(I.heading)}</p>
      <div class="instructor-card">${avatar}<div>
        <h3>${esc(I.name)}</h3><p class="role">${esc(I.title)}</p><p class="bio">${esc(I.bio)}</p>
        <ul class="contacts">${list(
          I.contacts,
          (c) =>
            `<li><span class="c-label">${esc(c.icon)} ${esc(c.label)}</span>${
              c.href ? `<a href="${esc(c.href)}">${esc(c.value)}</a>` : esc(c.value)
            }</li>`
        )}</ul></div></div>
      <p class="copyright">${esc(C.footer.text)}</p>
    </div>`
  );

  /* ===== 모바일 메뉴 토글 ===== */
  const toggle = document.querySelector(".nav-toggle");
  const setOpen = (open) => {
    nav.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", open);
    toggle.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
  };
  toggle.addEventListener("click", () => setOpen(!nav.classList.contains("open")));
  nav.addEventListener("click", (e) => e.target.closest("a") && setOpen(false));

  /* ===== 스크롤: 헤더 그림자, 맨 위로 버튼, 현재 메뉴 강조 ===== */
  const header = document.querySelector(".site-header");
  const toTop = document.querySelector(".to-top");
  const links = [...nav.querySelectorAll("a")];
  const sections = navItems.map((n) => document.getElementById(n.target));
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle("scrolled", y > 8);
    toTop.classList.toggle("show", y > 500);
    const atBottom = window.innerHeight + y >= document.documentElement.scrollHeight - 4;
    const probe = y + window.innerHeight * 0.3;
    let current = "";
    sections.forEach((s) => s.offsetTop <= probe && (current = s.id));
    if (atBottom && sections.length) current = sections[sections.length - 1].id;
    links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + current));
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  /* ===== 통계 숫자 카운트업 ===== */
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const countUp = (el) => {
    const target = Number(el.dataset.count);
    if (reduceMotion) return (el.textContent = target);
    const start = performance.now();
    const dur = 1400;
    const step = (t) => {
      const p = Math.min((t - start) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const counters = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            countUp(e.target);
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.5 }
    );
    counters.forEach((el) => io.observe(el));
  } else counters.forEach(countUp);

  /* ===== 강점 슬라이드 (버튼·점·스와이프·키보드) ===== */
  const track = document.querySelector(".slider-track");
  if (track) {
    const slides = [...track.children];
    const dots = document.querySelector(".slider-dots");
    dots.innerHTML = slides.map((_, i) => `<button aria-label="${i + 1}번 슬라이드"></button>`).join("");
    const dotBtns = [...dots.children];
    const slideW = () => slides[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0);
    const goTo = (i) => {
      i = Math.max(0, Math.min(i, slides.length - 1));
      track.scrollTo({ left: slides[i].offsetLeft - track.offsetLeft, behavior: reduceMotion ? "auto" : "smooth" });
    };
    const currentIndex = () => Math.round(track.scrollLeft / slideW());
    const update = () => {
      const i = currentIndex();
      const maxScroll = track.scrollWidth - track.clientWidth - 2;
      dotBtns.forEach((d, k) => d.classList.toggle("active", k === i || (track.scrollLeft >= maxScroll && k === slides.length - 1)));
      document.querySelector(".slider-btn.prev").disabled = track.scrollLeft <= 2;
      document.querySelector(".slider-btn.next").disabled = track.scrollLeft >= maxScroll;
    };
    document.querySelector(".slider-btn.prev").addEventListener("click", () => goTo(currentIndex() - 1));
    document.querySelector(".slider-btn.next").addEventListener("click", () => goTo(currentIndex() + 1));
    dotBtns.forEach((d, i) => d.addEventListener("click", () => goTo(i)));
    track.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") goTo(currentIndex() + 1);
      if (e.key === "ArrowLeft") goTo(currentIndex() - 1);
    });
    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ===== 꽃잎 장식 (꽃잎·잎사귀·노란 꽃잎이 섞여 떨어짐) ===== */
  const petals = document.querySelector(".petals");
  const count = C.site.petals === false ? 0 : window.innerWidth < 600 ? 10 : 18; // site.petals: false 면 꽃잎 끔
  for (let i = 0; i < count; i++) {
    const p = document.createElement("span");
    const kind = Math.random();
    p.className = kind < 0.45 ? "petal leaf" : kind < 0.65 ? "petal sun" : "petal";
    const size = 8 + Math.random() * 8;
    p.style.cssText = `left:${Math.random() * 110}%;width:${size}px;height:${size * 0.8}px;
      animation-duration:${10 + Math.random() * 12}s;animation-delay:${-Math.random() * 20}s;
      opacity:${0.25 + Math.random() * 0.45}`;
    petals.appendChild(p);
  }
})();
