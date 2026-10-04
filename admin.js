/* 관리자 모드: 오른쪽 위 🔒 → 비밀번호 → 관리자 화면
 * - 사이트 내용 편집, 공지, 수강생 명단, 출석·과제·신청 내역 확인과 CSV(엑셀) 내려받기
 * - 설정 파일(config.js) 내보내기·불러오기, 비밀번호 변경
 * 수정한 내용은 먼저 이 브라우저에 저장되고, 모든 방문자에게 적용하려면 내보낸 config.js 로 교체해 배포합니다. */
(function () {
  const X = window.COURSE;
  if (!X) return;
  const { esc } = X;
  const NS = window.SITE_NS || "course:";

  /* ===== 저장소 도우미 ===== */
  const ls = {
    get(k, d) {
      try {
        const v = localStorage.getItem(NS + k);
        return v == null ? d : JSON.parse(v);
      } catch {
        return d;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem(NS + k, JSON.stringify(v));
        return true;
      } catch {
        return false;
      }
    },
    remove(k) {
      try {
        localStorage.removeItem(NS + k);
      } catch {}
    },
    keys(prefix) {
      try {
        return Object.keys(localStorage)
          .filter((k) => k.startsWith(NS + prefix))
          .map((k) => k.slice(NS.length));
      } catch {
        return [];
      }
    },
  };
  const ss = {
    get(k) {
      try {
        return sessionStorage.getItem(NS + k);
      } catch {
        return null;
      }
    },
    set(k, v) {
      try {
        sessionStorage.setItem(NS + k, v);
      } catch {}
    },
    remove(k) {
      try {
        sessionStorage.removeItem(NS + k);
      } catch {}
    },
  };
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const pad = (n) => String(n).padStart(2, "0");
  const stamp = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;

  /* ===== SHA-256 (Web Crypto, 안 되면 직접 계산) ===== */
  async function sha256(str) {
    try {
      if (window.crypto?.subtle) {
        const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
        return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
      }
    } catch {}
    return sha256js(str);
  }
  function sha256js(str) {
    const K = [], H = [];
    const frac = (x) => ((x - Math.floor(x)) * 4294967296) | 0;
    for (let n = 2, c = 0; c < 64; n++) {
      let prime = true;
      for (let d = 2; d * d <= n; d++) if (n % d === 0) prime = false;
      if (!prime) continue;
      if (c < 8) H[c] = frac(Math.pow(n, 1 / 2));
      K[c++] = frac(Math.pow(n, 1 / 3));
    }
    const bytes = new TextEncoder().encode(str);
    const len = bytes.length;
    const buf = new Uint8Array(((len + 9 + 63) >> 6) << 6);
    buf.set(bytes);
    buf[len] = 0x80;
    const dv = new DataView(buf.buffer);
    dv.setUint32(buf.length - 4, (len * 8) >>> 0);
    dv.setUint32(buf.length - 8, Math.floor((len * 8) / 4294967296));
    const W = new Int32Array(64);
    let h = H.slice();
    const rotr = (x, n) => (x >>> n) | (x << (32 - n));
    for (let i = 0; i < buf.length; i += 64) {
      for (let t = 0; t < 16; t++) W[t] = dv.getInt32(i + t * 4);
      for (let t = 16; t < 64; t++) {
        const s0 = rotr(W[t - 15], 7) ^ rotr(W[t - 15], 18) ^ (W[t - 15] >>> 3);
        const s1 = rotr(W[t - 2], 17) ^ rotr(W[t - 2], 19) ^ (W[t - 2] >>> 10);
        W[t] = (W[t - 16] + s0 + W[t - 7] + s1) | 0;
      }
      let [a, b, c, d, e, f, g, hh] = h;
      for (let t = 0; t < 64; t++) {
        const t1 = (hh + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[t] + W[t]) | 0;
        const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
        hh = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      h = [a, b, c, d, e, f, g, hh].map((v, k) => (v + h[k]) | 0);
    }
    return h.map((v) => (v >>> 0).toString(16).padStart(8, "0")).join("");
  }
  window.__sha256js = sha256js; // 점검용

  /* ===== 파일 내려받기 · CSV ===== */
  function download(name, text, type) {
    const blob = new Blob([text], { type });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 1000);
  }
  // 엑셀에서 한글이 깨지지 않도록 BOM 을 붙이고, 수식으로 해석될 수 있는 값은 막아 둡니다.
  const toCSV = (rows) =>
    "﻿" +
    rows
      .map((r) =>
        r
          .map((c) => {
            let s = String(c ?? "");
            if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
            return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
          })
          .join(",")
      )
      .join("\r\n");
  const downloadCSV = (name, rows) => download(`${name}_${stamp().slice(0, 10)}.csv`, toCSV(rows), "text/csv;charset=utf-8");

  /* ===== 편집 대상: 현재 설정의 복사본 ===== */
  let draft = clone(window.SITE_CONFIG);
  let dirty = false;
  const normalize = (cfg) => {
    cfg.notices ||= [];
    cfg.portfolio ||= { heading: "우수 과제 포트폴리오", lead: "", items: [] };
    cfg.participate ||= {};
    cfg.participate.portal ||= {};
    cfg.participate.portal.roster ||= [];
    (cfg.curriculum?.weeks || []).forEach((w) => {
      if (!("assignment" in w)) w.assignment = null;
      if (!("videos" in w)) w.videos = [];
    });
    return cfg;
  };
  normalize(draft);

  /* ===== 라벨 ===== */
  const LABELS = {
    site: "기본 정보", badge: "배지", title: "제목", titleAlt: "보조 제목(원어·영문)", emblem: "상징 문양(1~2글자)", petals: "꽃잎 효과", badgeIcon: "배지 아이콘", theme: "색상", accent: "강조색", accentSoft: "제목 강조색", accentDeep: "진한 강조색", sections: "섹션 보이기", notice: "공지사항", subtitle: "부제", university: "대학",
    department: "학과", description: "설명", buttons: "버튼", text: "문구", target: "이동 위치(#id)", primary: "강조 버튼",
    quickInfo: "한눈에 보기", icon: "아이콘", label: "이름", value: "값", nav: "상단 메뉴", footer: "하단 문구",
    about: "프로그램 소개", heading: "제목", lead: "안내 문구", stats: "통계 카드", suffix: "단위",
    strengthsHeading: "강점 제목", strengths: "강점 슬라이드", body: "내용",
    curriculum: "커리큘럼", startDate: "1주차 시작일(월)", classDays: "수업 요일(0=일 1=월 … 6=토)", time: "수업 시간",
    location: "기본 장소", submitUrl: "외부 제출 링크(비우면 사이트 안에서 제출)", holidays: "휴강일", date: "날짜", name: "이름",
    previewToday: "미리보기 날짜(평소엔 비움)", calendarHeading: "달력 제목", calendarLead: "달력 안내", weeks: "주차",
    desc: "설명", sessions: "수업별 학습 내용(월·수 순서)", videos: "참고 영상", url: "링크", assignment: "과제", due: "마감 일시",
    tools: "실습 도구", items: "항목", use: "활용", enroll: "수강 안내", prepHeading: "준비물 제목", prep: "준비물",
    participate: "수강생 참여", demoNote: "체험 모드 안내", poll: "투표", options: "선택지", id: "식별자(영문·숫자)",
    apply: "수강 신청서", endpoint: "신청서 접수 주소(선택)", fields: "입력 항목", type: "형식", required: "필수",
    placeholder: "예시 문구", pattern: "형식 검사(정규식)", patternMessage: "형식 오류 안내", minLength: "최소 글자 수",
    submitText: "제출 버튼 문구", successTitle: "완료 제목", successBody: "완료 안내", portal: "수강생 공간",
    maxFileMB: "최대 파일 크기(MB)", accept: "허용 확장자", popup: "공지 팝업", enabled: "사용", delaySeconds: "뜨는 시간(초)",
    highlights: "강조 정보", buttonText: "버튼 문구", buttonTarget: "버튼 이동 위치", hideTodayText: "하루 보지 않기 문구",
    welcome: "첫 방문 환영", confetti: "폭죽", show: "팝업에 띄울 공지(latest=최신 / selected=고른 공지)", message: "환영 메시지", respectReducedMotion: "동작 줄이기 설정 존중",
    faq: "FAQ", q: "질문", a: "답변", portfolio: "우수 과제 포트폴리오", student: "수강생", image: "이미지", link: "작품 링크(선택)", instructor: "교수자", photo: "사진", bio: "소개", contacts: "연락처", href: "링크(선택)",
  };
  const LONG = new Set(["description", "lead", "body", "desc", "bio", "a", "use", "successBody", "demoNote", "calendarLead"]);
  const HIDE = new Set(["admin", "notices", "roster"]);
  const TEMPLATES = {
    holidays: { date: "", name: "" },
    videos: { title: "", url: "" },
    contacts: { icon: "", label: "", value: "", href: "" },
    assignment: { title: "", desc: "", due: "" },
    buttons: { text: "", target: "#", primary: false },
    highlights: { label: "", value: "" },
    sessions: "",
  };
  const blankLike = (v) =>
    v === null ? null : Array.isArray(v) ? [] : typeof v === "object" ? Object.fromEntries(Object.keys(v).map((k) => [k, blankLike(v[k])])) : typeof v === "number" ? 0 : typeof v === "boolean" ? false : "";
  const getAt = (o, path) => path.reduce((x, k) => x?.[k], o);
  const setAt = (o, path, v) => {
    getAt(o, path.slice(0, -1))[path[path.length - 1]] = v;
  };

  /* ===== 일반 편집기 (설정 구조를 그대로 폼으로) ===== */
  const P = (path) => esc(JSON.stringify(path));
  const itemTitle = (v, i, key) => {
    if (key === "weeks") return `${i + 1}주차 · ${v.title || ""}`;
    if (v && typeof v === "object") return v.title || v.label || v.name || v.q || v.text || v.date || `${i + 1}번`;
    return `${i + 1}`;
  };
  function editor(value, path, key, inArray = false) {
    const label = esc(LABELS[key] ?? key);
    if (value === null) {
      return TEMPLATES[key]
        ? `<div class="ed-row"><span class="ed-label">${label}</span><button type="button" class="ed-btn" data-act="create" data-path="${P(path)}" data-key="${esc(key)}">+ ${label} 추가</button></div>`
        : "";
    }
    if (Array.isArray(value)) {
      const primitive = value.length ? typeof value[0] !== "object" : typeof TEMPLATES[key] !== "object";
      const items = value
        .map((v, i) => {
          const tools = `<span class="ed-tools">
            <button type="button" data-act="up" data-path="${P([...path, i])}" aria-label="위로" ${i === 0 ? "disabled" : ""}>↑</button>
            <button type="button" data-act="down" data-path="${P([...path, i])}" aria-label="아래로" ${i === value.length - 1 ? "disabled" : ""}>↓</button>
            <button type="button" data-act="del" data-path="${P([...path, i])}" aria-label="삭제" class="danger">✕</button></span>`;
          return primitive
            ? `<div class="ed-prim">${editor(v, [...path, i], key, true)}${tools}</div>`
            : `<details class="ed-item" ${value.length <= 4 ? "open" : ""}><summary><span>${esc(itemTitle(v, i, key))}</span>${tools}</summary>
                <div class="ed-item-body">${editor(v, [...path, i], key, true)}</div></details>`;
        })
        .join("");
      return `<div class="ed-group"><div class="ed-group-head"><span>${label}</span><small>${value.length}개</small></div>
        <div class="ed-items">${items}</div>
        <button type="button" class="ed-btn" data-act="add" data-path="${P(path)}" data-key="${esc(key)}">+ 항목 추가</button></div>`;
    }
    if (typeof value === "object") {
      const inner = Object.keys(value)
        .filter((k) => !HIDE.has(k))
        .map((k) => editor(value[k], [...path, k], k))
        .join("");
      if (inArray) return inner;
      const removable = key === "assignment" ? `<button type="button" class="ed-btn danger" data-act="nullify" data-path="${P(path)}">과제 없애기</button>` : "";
      return `<fieldset class="ed-fieldset"><legend>${label}</legend>${inner}${removable}</fieldset>`;
    }
    const id = "ed-" + path.join("-");
    const lab = inArray ? "" : `<label class="ed-label" for="${esc(id)}">${label}</label>`;
    if (typeof value === "boolean")
      return `<div class="ed-row ed-check"><input type="checkbox" id="${esc(id)}" data-path="${P(path)}" data-type="bool" ${value ? "checked" : ""}/>${lab}</div>`;
    if (typeof value === "number")
      return `<div class="ed-row">${lab}<input type="number" id="${esc(id)}" data-path="${P(path)}" data-type="num" value="${value}"/></div>`;
    if (key === "photo" || key === "image")
      return `<div class="ed-row">${lab}<div class="ed-photo">${value ? `<img src="${esc(value)}" alt="">` : `<span class="muted">사진 없음</span>`}
        <input type="file" accept="image/*" data-photo="${P(path)}"/>
        ${value ? `<button type="button" class="ed-btn danger" data-act="clear" data-path="${P(path)}">사진 지우기</button>` : ""}</div></div>`;
    const typeAttr = key === "due" ? "datetime-local" : key === "date" || key === "startDate" ? "date" : key.startsWith("accent") ? "color" : "text";
    const input = LONG.has(key)
      ? `<textarea id="${esc(id)}" data-path="${P(path)}" rows="3">${esc(value)}</textarea>`
      : `<input type="${typeAttr}" id="${esc(id)}" data-path="${P(path)}" value="${esc(value)}"/>`;
    return `<div class="ed-row">${lab}${input}</div>`;
  }

  /* ===== 탭 구성 ===== */
  const EDIT_TABS = [
    { id: "site", label: "사이트 정보", keys: ["site", "theme", "sections", "quickInfo", "nav", "footer"] },
    { id: "about", label: "프로그램 소개", keys: ["about"] },
    { id: "curriculum", label: "커리큘럼·일정", keys: ["curriculum"] },
    { id: "tools", label: "실습 도구", keys: ["tools"] },
    { id: "enroll", label: "수강 안내", keys: ["enroll"] },
    { id: "participate", label: "참여·팝업", keys: ["participate", "popup", "welcome"] },
    { id: "portfolio", label: "우수 과제", keys: ["portfolio"] },
    { id: "faq", label: "FAQ", keys: ["faq"] },
    { id: "instructor", label: "교수자", keys: ["instructor"] },
  ];
  const MANAGE_TABS = [
    { id: "notices", label: "📢 공지 관리" },
    { id: "roster", label: "👥 수강생 명단" },
    { id: "applications", label: "📝 신청 내역" },
    { id: "attendance", label: "✅ 출석 현황" },
    { id: "submissions", label: "📎 과제 현황" },
    { id: "file", label: "💾 설정 파일" },
    { id: "password", label: "🔑 비밀번호" },
  ];
  let current = "notices";
  let overlay;

  /* ===== 로그인 ===== */
  const lockBtn = document.querySelector(".admin-lock");
  const isAdmin = () => ss.get("admin") === "1";
  // 로그인한 관리자가 🔓 를 누르면 페이지 편집 모드(editor.js)로 — 없으면 관리자 창
  const startEditing = () => (window.EDITOR ? window.EDITOR.start() : openPanel());
  lockBtn?.addEventListener("click", () => (isAdmin() ? startEditing() : openLogin()));

  function openLogin() {
    const lastFocus = document.activeElement;
    const wrap = document.createElement("div");
    wrap.className = "modal-backdrop show";
    wrap.innerHTML = `<form class="modal card admin-login" role="dialog" aria-modal="true" aria-labelledby="al-title" novalidate>
      <button class="modal-close" type="button" aria-label="닫기">×</button>
      <div class="login-icon" aria-hidden="true">🔒</div>
      <h3 id="al-title">관리자 로그인</h3>
      <div class="field"><label for="al-pw">비밀번호</label><input type="password" id="al-pw" autocomplete="current-password" /></div>
      <p class="field-error" role="alert"></p>
      <button class="btn" type="submit">들어가기</button>
    </form>`;
    document.body.appendChild(wrap);
    const input = wrap.querySelector("#al-pw");
    input.focus();
    const close = () => {
      wrap.remove();
      document.removeEventListener("keydown", onKey);
      lastFocus?.focus?.();
    };
    const onKey = (e) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    wrap.addEventListener("click", (e) => (e.target === wrap || e.target.closest(".modal-close")) && close());
    wrap.querySelector("form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const err = wrap.querySelector(".field-error");
      const lock = ls.get("adminLockUntil", 0);
      if (Date.now() < lock) return (err.textContent = `잠시 후 다시 시도해 주세요. (${Math.ceil((lock - Date.now()) / 1000)}초)`);
      const A = window.SITE_CONFIG.admin || {};
      const ok = A.passwordHash && (await sha256((A.salt || "") + input.value)) === A.passwordHash;
      if (!ok) {
        const fails = ls.get("adminFails", 0) + 1;
        ls.set("adminFails", fails);
        if (fails >= 5) {
          ls.set("adminLockUntil", Date.now() + 30000);
          ls.set("adminFails", 0);
          err.textContent = "5번 틀려서 30초 동안 잠겼습니다.";
        } else err.textContent = `비밀번호가 맞지 않습니다. (${fails}/5)`;
        input.select();
        return;
      }
      ls.set("adminFails", 0);
      ss.set("admin", "1");
      close();
      lockBtn.textContent = "🔓";
      startEditing();
    });
  }

  /* ===== 관리자 화면 ===== */
  function openPanel(tab) {
    if (tab) current = tab;
    if (overlay) return;
    if (!dirty) draft = normalize(clone(window.SITE_CONFIG)); // 페이지에서 바로 고친 내용도 반영
    document.body.classList.add("admin-open");
    overlay = document.createElement("div");
    overlay.className = "admin-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "관리자 화면");
    overlay.innerHTML = `<div class="admin-shell">
      <header class="admin-top">
        <h2>🔓 관리자 화면</h2>
        <span class="dirty-flag" hidden>● 저장 안 한 변경 있음</span>
        <div class="admin-actions">
          <button type="button" class="btn btn-sm" data-act="save">저장하고 적용</button>
          <button type="button" class="btn btn-ghost btn-sm" data-act="logout">로그아웃</button>
          <button type="button" class="admin-x" data-act="close" aria-label="관리자 화면 닫기">×</button>
        </div>
      </header>
      <nav class="admin-tabs" aria-label="관리 메뉴">
        <p class="tab-group">관리</p>${MANAGE_TABS.map((t) => `<button type="button" data-tab="${t.id}">${t.label}</button>`).join("")}
        <p class="tab-group">내용 편집</p>${EDIT_TABS.map((t) => `<button type="button" data-tab="${t.id}">✏️ ${t.label}</button>`).join("")}
      </nav>
      <main class="admin-body"></main>
    </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener("click", onClick);
    overlay.addEventListener("input", onInput);
    overlay.addEventListener("change", onChange);
    document.addEventListener("keydown", onEsc);
    setDirty(dirty);
    renderTab();
    overlay.querySelector(".admin-x").focus();
  }
  function closePanel(force) {
    if (!overlay) return;
    if (!force && dirty && !confirm("저장하지 않은 변경 사항이 있습니다. 닫으면 사라집니다. 닫을까요?")) return;
    if (dirty) {
      draft = normalize(clone(window.SITE_CONFIG));
      dirty = false;
    }
    overlay.remove();
    overlay = null;
    document.body.classList.remove("admin-open");
    document.removeEventListener("keydown", onEsc);
    lockBtn?.focus();
  }
  const onEsc = (e) => e.key === "Escape" && !document.querySelector(".modal-backdrop") && closePanel();
  function setDirty(v) {
    dirty = v;
    const f = overlay?.querySelector(".dirty-flag");
    if (f) f.hidden = !v;
  }
  const msg = (text, kind = "ok") => {
    const el = overlay?.querySelector(".admin-msg");
    if (!el) return;
    el.className = "admin-msg " + kind;
    el.textContent = text;
  };

  function renderTab() {
    overlay.querySelectorAll("[data-tab]").forEach((b) => b.setAttribute("aria-current", b.dataset.tab === current ? "page" : "false"));
    const body = overlay.querySelector(".admin-body");
    const scroll = body.scrollTop;
    const edit = EDIT_TABS.find((t) => t.id === current);
    let html;
    if (edit) {
      html = `<div class="admin-head"><h3>✏️ ${esc(edit.label)}</h3>
        <p class="muted">고친 뒤 위의 <strong>저장하고 적용</strong>을 누르면 사이트에 반영됩니다.</p></div>
        <p class="admin-msg" role="status"></p>
        ${edit.keys.filter((k) => draft[k] !== undefined).map((k) => editor(draft[k], [k], k)).join("")}`;
    } else html = VIEWS[current]();
    body.innerHTML = html;
    body.scrollTop = scroll;
  }

  /* ----- 관리 화면들 ----- */
  const sessionsAll = () => X.weeks.flatMap((w) => w.days.filter((d) => !d.holiday));
  const assignmentsAll = () => X.weeks.filter((w) => w.assignment).map((w) => w.assignment);
  const studentList = () => {
    const map = new Map();
    (draft.participate.portal.roster || []).forEach((r) => map.set(String(r.id), r.name));
    const reg = ls.get("students", {});
    Object.entries(reg).forEach(([id, name]) => !map.has(id) && map.set(id, name));
    [...ls.keys("att:"), ...ls.keys("subs:")].forEach((k) => {
      const id = k.split(":")[1];
      if (!map.has(id)) map.set(id, "");
    });
    return [...map.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.id.localeCompare(b.id));
  };
  const table = (head, rows, cls = "") =>
    `<div class="table-wrap"><table class="admin-table ${cls}"><thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
     <tbody>${rows.length ? rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${head.length}" class="empty">아직 기록이 없습니다.</td></tr>`}</tbody></table></div>`;
  const localNote = `<p class="admin-note">ⓘ 체험 모드에서는 <strong>이 브라우저에서</strong> 입력된 기록만 보입니다.</p>`;

  const VIEWS = {
    notices() {
      const list = draft.notices
        .map(
          (n, i) => `<li class="notice-row${n.pinned ? " pinned" : ""}">
            <div><strong>${n.pinned ? "📌 " : ""}${n.popup ? "🔔 " : ""}${esc(n.title)}</strong><small>${esc(n.date)}</small><p>${esc(n.body)}</p></div>
            <div class="row-tools"><button type="button" class="ed-btn" data-act="popup-toggle" data-i="${i}">${n.popup ? "팝업 끄기" : "팝업으로 띄우기"}</button><button type="button" class="ed-btn" data-act="pin" data-i="${i}">${n.pinned ? "고정 해제" : "중요 고정"}</button>
            <button type="button" class="ed-btn danger" data-act="del-notice" data-i="${i}">삭제</button></div></li>`
        )
        .join("");
      return `<div class="admin-head"><h3>📢 공지 관리</h3><p class="muted">올린 공지는 첫 화면 아래 '공지사항'에 표시됩니다.</p></div>
        <p class="admin-msg" role="status"></p>
        <form class="admin-card notice-form" novalidate>
          <div class="ed-row"><label class="ed-label" for="nt-title">제목</label><input id="nt-title" name="title" /></div>
          <div class="ed-row"><label class="ed-label" for="nt-body">내용</label><textarea id="nt-body" name="body" rows="3"></textarea></div>
          <div class="ed-row ed-inline"><label class="ed-check"><input type="checkbox" name="pinned" /> 중요 공지로 맨 위에 고정</label><label class="ed-check"><input type="checkbox" name="popup" /> 팝업으로 띄우기</label>
          <label class="ed-label" for="nt-date">게시일</label><input type="date" id="nt-date" name="date" value="${stamp().slice(0, 10)}" /></div>
          <button class="btn btn-sm" type="submit">공지 올리기</button>
        </form>
        <ul class="notice-admin-list">${list || `<li class="empty">공지가 없습니다.</li>`}</ul>`;
    },
    roster() {
      const roster = draft.participate.portal.roster;
      const apps = ls.get("applications", []);
      return `<div class="admin-head"><h3>👥 수강생 명단</h3>
        <p class="muted">명단이 있으면 명단에 있는 학생만 '수강생 공간'에 로그인할 수 있습니다. 비워 두면 누구나 로그인됩니다.</p></div>
        <p class="admin-msg" role="status"></p>
        <form class="admin-card roster-form" novalidate>
          <div class="ed-row"><label class="ed-label" for="rs-text">한 줄에 한 명씩 <code>학번,이름</code> (엑셀에서 두 열을 복사해 붙여 넣어도 됩니다)</label>
          <textarea id="rs-text" name="text" rows="4" placeholder="2024123456,홍길동&#10;2024123457,김철수"></textarea></div>
          <div class="btn-row"><button class="btn btn-sm" type="submit">명단에 추가</button>
          <label class="btn btn-ghost btn-sm file-btn">CSV 파일 불러오기<input type="file" accept=".csv,.txt" data-roster-file /></label>
          ${apps.length ? `<button type="button" class="btn btn-ghost btn-sm" data-act="roster-from-apps">신청자 ${apps.length}명 모두 추가</button>` : ""}</div>
        </form>
        <div class="table-tools"><strong>${roster.length}명</strong>
          <button type="button" class="ed-btn" data-act="csv-roster" ${roster.length ? "" : "disabled"}>⬇ 엑셀(CSV)로 내려받기</button>
          ${roster.length ? `<button type="button" class="ed-btn danger" data-act="roster-clear">전체 삭제</button>` : ""}</div>
        ${table(
          ["#", "학번", "이름", ""],
          roster.map((r, i) => [i + 1, esc(r.id), esc(r.name), `<button type="button" class="ed-btn danger" data-act="roster-del" data-i="${i}">삭제</button>`])
        )}`;
    },
    applications() {
      const apps = ls.get("applications", []);
      const fields = draft.participate.apply.fields;
      const fmt = (v) => (v === true ? "동의" : v === false ? "" : v);
      return `<div class="admin-head"><h3>📝 수강 신청 내역</h3></div>${localNote}
        <div class="table-tools"><strong>${apps.length}건</strong>
          <button type="button" class="ed-btn" data-act="csv-apps" ${apps.length ? "" : "disabled"}>⬇ 엑셀(CSV)로 내려받기</button></div>
        ${table(
          ["접수번호", "제출 일시", ...fields.map((f) => esc(f.label.replace(/\(.*\)/, "").slice(0, 12)))],
          apps.map((a) => [esc(a.receipt), esc(stamp(new Date(a.submittedAt))), ...fields.map((f) => esc(fmt(a[f.name])))]),
          "wide"
        )}`;
    },
    attendance() {
      const ses = sessionsAll();
      const todayKey = X.ymd(X.now());
      const rows = studentList().map((s) => {
        const att = ls.get(`att:${s.id}`, {});
        const past = ses.filter((x) => x.key <= todayKey);
        const n = past.filter((x) => att[x.key]).length;
        return { s, att, n, rate: past.length ? Math.round((n / past.length) * 100) : 0, pastLen: past.length };
      });
      const mark = (att, x) => (att[x.key] ? "O" : x.key < todayKey ? "X" : x.key === todayKey ? "-" : "");
      return `<div class="admin-head"><h3>✅ 출석 현황</h3><p class="muted">O 출석 · X 결석 · 빈칸 예정 (기준일 ${esc(X.fmtDate(X.now()))})</p></div>${localNote}
        <div class="table-tools"><strong>${rows.length}명 · 수업 ${ses.length}회</strong>
          <button type="button" class="ed-btn" data-act="csv-att" ${rows.length ? "" : "disabled"}>⬇ 엑셀(CSV)로 내려받기</button></div>
        ${table(
          ["학번", "이름", "출석", "출석률", ...ses.map((x) => `${x.date.getMonth() + 1}/${x.date.getDate()}`)],
          rows.map((r) => [esc(r.s.id), esc(r.s.name), `${r.n}/${r.pastLen}`, `${r.rate}%`, ...ses.map((x) => `<span class="mk mk-${mark(r.att, x) || "e"}">${mark(r.att, x)}</span>`)]),
          "wide sticky2"
        )}`;
    },
    submissions() {
      const asg = assignmentsAll();
      const now = X.now();
      const rows = studentList().map((s) => ({ s, subs: ls.get(`subs:${s.id}`, {}) }));
      const cell = (sub, a) =>
        sub ? `<span class="mk mk-O">제출</span><small>${esc(sub.name)}<br>${esc(stamp(new Date(sub.at)))}</small>` : a.dueDate <= now ? `<span class="mk mk-X">미제출</span>` : `<span class="muted">대기</span>`;
      return `<div class="admin-head"><h3>📎 과제 제출 현황</h3></div>${localNote}
        <p class="admin-note">파일 자체는 서버가 없어 저장되지 않고, 파일 이름·크기·제출 시각만 기록됩니다.</p>
        <div class="table-tools"><strong>${rows.length}명 · 과제 ${asg.length}개</strong>
          <button type="button" class="ed-btn" data-act="csv-subs" ${rows.length ? "" : "disabled"}>⬇ 엑셀(CSV)로 내려받기</button></div>
        ${table(
          ["학번", "이름", "제출 수", ...asg.map((a) => `${a.week}주차<br><small>${esc(a.title)}</small>`)],
          rows.map((r) => [esc(r.s.id), esc(r.s.name), `${asg.filter((a) => r.subs[a.week]).length}/${asg.length}`, ...asg.map((a) => cell(r.subs[a.week], a))]),
          "wide sticky2"
        )}`;
    },
    file() {
      return `<div class="admin-head"><h3>💾 설정 파일</h3></div>
        <p class="admin-msg" role="status"></p>
        <div class="admin-card">
          <h4>지금 상태</h4>
          <p>${window.SITE_CONFIG_OVERRIDDEN ? "이 브라우저에 <strong>관리자가 수정한 설정</strong>이 저장되어 사용 중입니다." : "서버의 <code>config.js</code> 원본을 그대로 사용 중입니다."}
          ${dirty ? "<br><strong>저장하지 않은 변경 사항</strong>도 있습니다." : ""}</p>
          <p class="muted">관리자 화면에서 고친 내용은 이 브라우저에만 저장됩니다. <strong>모든 방문자에게 적용</strong>하려면 아래에서 config.js 를 내려받아 사이트 폴더의 같은 파일과 바꾼 뒤 다시 배포하세요.</p>
        </div>
        <div class="admin-card">
          <h4>내보내기 · 불러오기</h4>
          <div class="btn-row">
            <button type="button" class="btn btn-sm" data-act="export-config">⬇ config.js 내려받기</button>
            <label class="btn btn-ghost btn-sm file-btn">⬆ 설정 파일 불러오기<input type="file" accept=".js,.json" data-config-file /></label>
          </div>
          <p class="muted small">내려받은 파일에는 지금 화면의 내용(저장 전 변경 포함)이 담깁니다. 불러온 뒤에는 '저장하고 적용'을 눌러야 반영됩니다.</p>
        </div>
        <div class="admin-card">
          <h4>원래대로 되돌리기</h4>
          <p class="muted">이 브라우저에 저장된 수정본을 지우고 서버의 config.js 원본으로 돌아갑니다.</p>
          <button type="button" class="btn btn-ghost btn-sm danger-btn" data-act="reset-config" ${window.SITE_CONFIG_OVERRIDDEN ? "" : "disabled"}>원본으로 되돌리기</button>
        </div>
        <div class="admin-card">
          <h4>새 학기 준비 — 기록 비우기</h4>
          <p class="muted">이 브라우저에 쌓인 투표·수강 신청·출석·과제 기록을 모두 지웁니다. 설정(내용·공지·명단)은 그대로 남습니다. 지우기 전에 필요한 기록은 CSV로 내려받아 두세요.</p>
          <button type="button" class="btn btn-ghost btn-sm danger-btn" data-act="clear-records">기록 모두 지우기</button>
        </div>`;
    },
    password() {
      return `<div class="admin-head"><h3>🔑 비밀번호 변경</h3></div>
        <p class="admin-msg" role="status"></p>
        <form class="admin-card pw-form" novalidate>
          <div class="ed-row"><label class="ed-label" for="pw-cur">현재 비밀번호</label><input type="password" id="pw-cur" name="cur" autocomplete="current-password" /></div>
          <div class="ed-row"><label class="ed-label" for="pw-new">새 비밀번호 (8자 이상)</label><input type="password" id="pw-new" name="next" autocomplete="new-password" /></div>
          <div class="ed-row"><label class="ed-label" for="pw-new2">새 비밀번호 확인</label><input type="password" id="pw-new2" name="next2" autocomplete="new-password" /></div>
          <button class="btn btn-sm" type="submit">변경</button>
          <p class="muted small">비밀번호는 원문이 아니라 해시값으로만 설정에 저장됩니다. 변경 후 '저장하고 적용' → '설정 파일'에서 config.js 를 내려받아 배포해야 다른 기기에도 적용됩니다.</p>
        </form>`;
    },
  };

  /* ===== 이벤트 ===== */
  function onInput(e) {
    const el = e.target;
    if (!el.dataset.path) return;
    const path = JSON.parse(el.dataset.path);
    const v = el.dataset.type === "bool" ? el.checked : el.dataset.type === "num" ? Number(el.value) : el.value;
    setAt(draft, path, v);
    setDirty(true);
  }
  async function onChange(e) {
    const el = e.target;
    if (el.dataset.type === "bool") return onInput(e);
    if (el.dataset.photo) return loadPhoto(el);
    if (el.hasAttribute("data-roster-file")) {
      const text = await el.files[0]?.text();
      if (text) addRoster(text);
      el.value = "";
    }
    if (el.hasAttribute("data-config-file")) {
      const f = el.files[0];
      el.value = "";
      if (!f) return;
      try {
        const cfg = parseConfig(await f.text());
        draft = normalize(cfg);
        setDirty(true);
        renderTab();
        msg(`'${f.name}'을(를) 불러왔습니다. '저장하고 적용'을 눌러야 사이트에 반영됩니다.`);
      } catch (err) {
        msg("설정 파일을 읽지 못했습니다. 이 사이트의 config.js 파일이 맞는지 확인해 주세요.", "err");
      }
    }
  }
  function parseConfig(text) {
    const start = text.indexOf("{", text.indexOf("SITE_CONFIG"));
    const end = text.lastIndexOf("}");
    let cfg;
    try {
      cfg = JSON.parse(text.slice(start, end + 1));
    } catch {
      // 손으로 고친 config.js(주석 포함)도 읽을 수 있도록 — 관리자가 직접 고른 파일만 실행합니다.
      const sandbox = {};
      new Function("window", text)(sandbox);
      cfg = sandbox.SITE_CONFIG;
    }
    if (!cfg || !cfg.site || !cfg.curriculum) throw new Error("invalid");
    return cfg;
  }
  function loadPhoto(input) {
    const file = input.files[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      const size = 400;
      const s = Math.min(img.width, img.height);
      const cv = document.createElement("canvas");
      cv.width = cv.height = size;
      cv.getContext("2d").drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
      setAt(draft, JSON.parse(input.dataset.photo), cv.toDataURL("image/jpeg", 0.85));
      URL.revokeObjectURL(img.src);
      setDirty(true);
      renderTab();
    };
    img.src = URL.createObjectURL(file);
  }
  function addRoster(text) {
    const roster = draft.participate.portal.roster;
    let added = 0, skipped = 0;
    text
      .replace(/^﻿/, "")
      .split(/\r?\n/)
      .map((l) => l.split(/[,\t]/).map((s) => s.trim().replace(/^"|"$/g, "")))
      .forEach(([id, name]) => {
        if (!id && !name) return;
        if (!/^\d{10}$/.test(id || "") || !name) return skipped++;
        const i = roster.findIndex((r) => r.id === id);
        if (i >= 0) roster[i].name = name;
        else (roster.push({ id, name }), added++);
      });
    roster.sort((a, b) => a.id.localeCompare(b.id));
    setDirty(true);
    renderTab();
    msg(`${added}명 추가${skipped ? `, ${skipped}줄은 형식이 맞지 않아 건너뜀(학번 10자리, 이름 필요)` : ""}. '저장하고 적용'을 눌러 주세요.`, skipped ? "warn" : "ok");
  }

  function onClick(e) {
    const tabBtn = e.target.closest("[data-tab]");
    if (tabBtn) {
      current = tabBtn.dataset.tab;
      overlay.querySelector(".admin-body").scrollTop = 0;
      return renderTab();
    }
    const b = e.target.closest("[data-act]");
    if (!b) return;
    const act = b.dataset.act;
    const path = b.dataset.path ? JSON.parse(b.dataset.path) : null;
    if (["up", "down", "del"].includes(act)) e.preventDefault(); // <summary> 안의 버튼이 접고 펴지 않도록
    switch (act) {
      case "save": return save();
      case "logout":
        if (dirty && !confirm("저장하지 않은 변경 사항이 사라집니다. 로그아웃할까요?")) return;
        ss.remove("admin");
        ss.remove("editing");
        window.EDITOR?.stop(true);
        lockBtn.textContent = "🔒";
        return closePanel(true);
      case "close": return closePanel();
      case "add": {
        const arr = getAt(draft, path);
        const key = b.dataset.key;
        arr.push(arr.length ? blankLike(arr[0]) : clone(TEMPLATES[key] ?? ""));
        break;
      }
      case "del": {
        const arr = getAt(draft, path.slice(0, -1));
        if (!confirm("이 항목을 삭제할까요?")) return;
        arr.splice(path[path.length - 1], 1);
        break;
      }
      case "up":
      case "down": {
        const arr = getAt(draft, path.slice(0, -1));
        const i = path[path.length - 1], j = act === "up" ? i - 1 : i + 1;
        if (j < 0 || j >= arr.length) return;
        [arr[i], arr[j]] = [arr[j], arr[i]];
        break;
      }
      case "create": setAt(draft, path, clone(TEMPLATES[b.dataset.key])); break;
      case "nullify": if (!confirm("이 주차의 과제를 없앨까요?")) return; setAt(draft, path, null); break;
      case "clear": setAt(draft, path, ""); break;
      case "pin": draft.notices[b.dataset.i].pinned = !draft.notices[b.dataset.i].pinned; break;
      case "popup-toggle": draft.notices[b.dataset.i].popup = !draft.notices[b.dataset.i].popup; break;
      case "del-notice": if (!confirm("이 공지를 삭제할까요?")) return; draft.notices.splice(b.dataset.i, 1); break;
      case "roster-del": draft.participate.portal.roster.splice(b.dataset.i, 1); break;
      case "roster-clear": if (!confirm("수강생 명단을 모두 지울까요?")) return; draft.participate.portal.roster = []; break;
      case "roster-from-apps":
        return addRoster(ls.get("applications", []).map((a) => `${a.studentId},${a.name}`).join("\n"));
      case "csv-roster":
        return downloadCSV("수강생명단", [["학번", "이름"], ...draft.participate.portal.roster.map((r) => [r.id, r.name])]);
      case "csv-apps": {
        const fields = draft.participate.apply.fields;
        return downloadCSV("수강신청내역", [
          ["접수번호", "제출일시", ...fields.map((f) => f.label)],
          ...ls.get("applications", []).map((a) => [a.receipt, stamp(new Date(a.submittedAt)), ...fields.map((f) => (a[f.name] === true ? "동의" : a[f.name]))]),
        ]);
      }
      case "csv-att": {
        const ses = sessionsAll();
        const todayKey = X.ymd(X.now());
        return downloadCSV("출석부", [
          ["학번", "이름", "출석", "출석률", ...ses.map((x) => `${x.week}주 ${x.date.getMonth() + 1}/${x.date.getDate()}`)],
          ...studentList().map((s) => {
            const att = ls.get(`att:${s.id}`, {});
            const past = ses.filter((x) => x.key <= todayKey);
            const n = past.filter((x) => att[x.key]).length;
            return [s.id, s.name, n, past.length ? Math.round((n / past.length) * 100) + "%" : "0%", ...ses.map((x) => (att[x.key] ? "O" : x.key < todayKey ? "X" : ""))];
          }),
        ]);
      }
      case "csv-subs": {
        const asg = assignmentsAll();
        return downloadCSV("과제제출현황", [
          ["학번", "이름", ...asg.flatMap((a) => [`${a.week}주차 ${a.title}`, "제출 일시"])],
          ...studentList().map((s) => {
            const subs = ls.get(`subs:${s.id}`, {});
            return [s.id, s.name, ...asg.flatMap((a) => (subs[a.week] ? [subs[a.week].name, stamp(new Date(subs[a.week].at))] : ["미제출", ""]))];
          }),
        ]);
      }
      case "export-config": return exportConfig();
      case "clear-records": {
        if (!confirm("투표·신청·출석·과제 기록을 모두 지울까요? 되돌릴 수 없습니다.")) return;
        const keys = ["poll:", "applications", "students", "att:", "subs:", "session", "visited", "popupHideDate"].flatMap((p) => ls.keys(p));
        keys.forEach((k) => ls.remove(k));
        renderTab();
        return msg(`기록 ${keys.length}건을 지웠습니다.`);
      }
      case "reset-config":
        if (!confirm("이 브라우저에 저장된 수정본을 지우고 원본 설정으로 돌아갈까요?")) return;
        ls.remove("configOverride");
        ss.set("reopen", "file");
        return location.reload();
      default: return;
    }
    setDirty(true);
    renderTab();
  }

  // 폼 제출 (공지 · 명단 · 비밀번호)
  document.addEventListener("submit", async (e) => {
    if (!overlay || !overlay.contains(e.target)) return;
    e.preventDefault();
    const f = e.target;
    const val = (n) => f.elements.namedItem(n)?.value.trim() ?? "";
    if (f.classList.contains("notice-form")) {
      if (!val("title") || !val("body")) return msg("제목과 내용을 모두 입력해 주세요.", "err");
      draft.notices.unshift({ date: val("date") || stamp().slice(0, 10), title: val("title"), body: val("body"), pinned: f.elements.namedItem("pinned").checked, popup: f.elements.namedItem("popup").checked });
      setDirty(true);
      renderTab();
      return msg("공지를 추가했습니다. '저장하고 적용'을 누르면 사이트에 게시됩니다.");
    }
    if (f.classList.contains("roster-form")) {
      if (!val("text")) return msg("추가할 학번과 이름을 입력해 주세요.", "err");
      return addRoster(f.elements.namedItem("text").value);
    }
    if (f.classList.contains("pw-form")) {
      const A = draft.admin || {};
      const cur = f.elements.namedItem("cur").value;
      const next = f.elements.namedItem("next").value;
      if ((await sha256((A.salt || "") + cur)) !== A.passwordHash) return msg("현재 비밀번호가 맞지 않습니다.", "err");
      if (next.length < 8) return msg("새 비밀번호는 8자 이상이어야 합니다.", "err");
      if (next !== f.elements.namedItem("next2").value) return msg("새 비밀번호 두 칸이 서로 다릅니다.", "err");
      const salt = [...crypto.getRandomValues(new Uint8Array(8))].map((b) => b.toString(16).padStart(2, "0")).join("");
      draft.admin = { salt, passwordHash: await sha256(salt + next) };
      setDirty(true);
      f.reset();
      return msg("새 비밀번호를 준비했습니다. '저장하고 적용'을 눌러야 바뀝니다.");
    }
  });

  function save() {
    if (!ls.set("configOverride", draft)) {
      return msg("저장 공간이 부족해 저장하지 못했습니다. (사진 크기를 줄이거나 설정 파일로 내려받아 주세요)", "err");
    }
    ss.set("reopen", current);
    dirty = false;
    location.reload();
  }
  function exportConfig(cfg = draft) {
    const out = clone(cfg);
    (out.curriculum?.weeks || []).forEach((w) => {
      if (w.assignment === null) delete w.assignment;
    });
    const text = `/* =========================================================
 * ${draft.site?.title || ""} 사이트 설정 파일 — 관리자 화면에서 내보냄 (${stamp()})
 * 이 파일로 사이트 폴더의 config.js 를 교체하고 다시 배포하면 모든 방문자에게 적용됩니다.
 * ========================================================= */
window.SITE_CONFIG = ${JSON.stringify(out, null, 2)};
`;
    download("config.js", text, "text/javascript;charset=utf-8");
    msg("config.js 를 내려받았습니다. 사이트 폴더의 config.js 와 바꿔 배포하세요.");
  }

  /* ===== editor.js(페이지 바로 편집)에서 쓰는 기능 ===== */
  window.ADMIN = {
    isAdmin,
    openPanel: (tab) => openPanel(tab),
    exportConfig: (cfg) => exportConfig(cfg),
    saveOverride: (cfg) => ls.set("configOverride", cfg),
  };

  /* ===== 새로고침 후 관리자 화면 다시 열기 ===== */
  if (isAdmin()) {
    lockBtn.textContent = "🔓";
    const reopen = ss.get("reopen");
    if (reopen) {
      ss.remove("reopen");
      openPanel(reopen);
      setTimeout(() => msg("저장했습니다. 사이트에 반영되었습니다. 다른 방문자에게도 적용하려면 '설정 파일'에서 config.js 를 내려받아 배포하세요."), 0);
    }
  }
})();
