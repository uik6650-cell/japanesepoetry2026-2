/* 수강생 참여 기능: 투표 · 수강 신청서 · 로그인/출석/과제 제출 · 안내 팝업 · 첫 방문 폭죽
 * 내용 수정은 config.js 의 participate / popup / welcome 에서 하세요.
 * 저장은 브라우저 localStorage 를 사용합니다(체험 모드). */
(function () {
  const C = window.SITE_CONFIG;
  const X = window.COURSE;
  const P = C.participate;
  if (!P || !X) return;
  const { esc } = X;
  const $ = (sel, root = document) => root.querySelector(sel);

  /* ===== 저장소 (localStorage, 실패해도 페이지는 동작) ===== */
  const NS = window.SITE_NS || "course:";
  const memory = {};
  const store = {
    get(k, d) {
      try {
        const v = localStorage.getItem(NS + k);
        return v == null ? (k in memory ? memory[k] : d) : JSON.parse(v);
      } catch {
        return k in memory ? memory[k] : d;
      }
    },
    set(k, v) {
      memory[k] = v;
      try {
        localStorage.setItem(NS + k, JSON.stringify(v));
      } catch {}
    },
    remove(k) {
      delete memory[k];
      try {
        localStorage.removeItem(NS + k);
      } catch {}
    },
  };
  const pad = (n) => String(n).padStart(2, "0");
  const hm = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const fmtSize = (b) => (b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))}KB` : `${(b / 1024 / 1024).toFixed(1)}MB`);

  /* ===== 페이지 편집 모드 도우미 (app.js 의 APP 사용) ===== */
  const APP = window.APP || {};
  const ed = () => !!APP.editing?.();
  const E = (...a) => (APP.E ? APP.E(...a) : "");
  const EI = (...a) => (APP.EI ? APP.EI(...a) : "");
  const ETools = (...a) => (APP.ETools ? APP.ETools(...a) : "");
  const EAdd = (...a) => (APP.EAdd ? APP.EAdd(...a) : "");

  /* ===== 섹션 뼈대 ===== */
  document.getElementById("participate").innerHTML = `
    <div class="pt-head"></div>
    <div class="card poll" id="poll"></div>
    <div class="apply-head"></div>
    <div class="card narrow apply-card"></div>
    <div class="portal-head"></div>
    <div class="portal"></div>`;
  const drawHeads = () => {
    $(".pt-head").innerHTML = `<div class="section-head"><h2${E("participate.heading", { ph: "제목" })}>${esc(P.heading)}</h2>
      <p${E("participate.lead", { ph: "안내 문구" })}>${esc(P.lead)}</p></div>
      <p class="demo-note">ⓘ <span${E("participate.demoNote", { ph: "안내" })}>${esc(P.demoNote)}</span></p>`;
    $(".apply-head").innerHTML = `<h3 class="sub-heading" id="apply"${E("participate.apply.heading", { ph: "제목" })}>${esc(P.apply.heading)}</h3>
      <p class="sub-lead"${E("participate.apply.lead", { ph: "안내 문구" })}>${esc(P.apply.lead)}</p>`;
    $(".portal-head").innerHTML = `<h3 class="sub-heading" id="portal"${E("participate.portal.heading", { ph: "제목" })}>${esc(P.portal.heading)}</h3>
      <p class="sub-lead"${E("participate.portal.lead", { ph: "안내 문구" })}>${esc(P.portal.lead)}</p>`;
  };
  drawHeads();

  /* =========================================================
   * 1. 실시간 투표 (막대그래프)
   * ========================================================= */
  const pollEl = $("#poll");
  const drawPoll = () => {
    const votes = store.get("poll:votes", {});
    const mine = store.get("poll:mine", null);
    const total = P.poll.options.reduce((s, o) => s + (votes[o.id] || 0), 0);
    const max = Math.max(1, ...P.poll.options.map((o) => votes[o.id] || 0));
    if (ed()) {
      // 편집 모드: 질문·선택지를 그 자리에서 고치기
      const opts = P.poll.options;
      pollEl.innerHTML = `
        <div class="poll-head">
          <div><h3${E("participate.poll.heading", { ph: "투표 질문" })}>${esc(P.poll.heading)}</h3>
          <p${E("participate.poll.lead", { ph: "안내 문구" })}>${esc(P.poll.lead)}</p></div>
          <p class="poll-total"><strong>${total}</strong>표 참여</p>
        </div>
        <ul class="poll-list" role="list">${opts
          .map(
            (o, i) => `<li class="poll-edit-row"><span class="poll-edit-label"${E(`participate.poll.options.${i}.label`, { ph: "선택지" })}>${esc(o.label)}</span>
              <span class="muted small">${votes[o.id] || 0}표</span>${ETools("participate.poll.options", i, opts.length)}</li>`
          )
          .join("")}</ul>
        <p class="center">${EAdd("participate.poll.options", "option", "선택지 추가")}</p>`;
      return;
    }
    pollEl.innerHTML = `
      <div class="poll-head">
        <div><h3>${esc(P.poll.heading)}</h3><p>${esc(P.poll.lead)}</p></div>
        <p class="poll-total"><strong>${total}</strong>표 참여<span class="live-dot" title="다른 탭에서 투표해도 바로 반영됩니다"></span></p>
      </div>
      <ul class="poll-list" role="list">${P.poll.options
        .map((o) => {
          const n = votes[o.id] || 0;
          const pct = total ? Math.round((n / total) * 100) : 0;
          const isMine = mine === o.id;
          return `<li>
            <button class="poll-option${isMine ? " mine" : ""}" data-id="${esc(o.id)}" aria-pressed="${isMine}"
              title="${esc(o.label)} — ${n}표 (${pct}%)">
              <span class="poll-label">${esc(o.label)}${isMine ? `<em>내 선택</em>` : ""}</span>
              <span class="poll-bar-wrap"><span class="poll-bar" style="width:${(n / max) * 100}%"></span></span>
              <span class="poll-value">${n}표 · ${pct}%</span>
            </button></li>`;
        })
        .join("")}</ul>
      <p class="poll-foot">${mine ? "다른 항목을 누르면 투표를 바꿀 수 있어요." : "항목을 눌러 투표하세요."}</p>`;
  };
  pollEl.addEventListener("click", (e) => {
    const b = e.target.closest(".poll-option");
    if (!b || ed()) return;
    const id = b.dataset.id;
    const votes = store.get("poll:votes", {});
    const mine = store.get("poll:mine", null);
    if (mine === id) return;
    if (mine) votes[mine] = Math.max(0, (votes[mine] || 0) - 1);
    votes[id] = (votes[id] || 0) + 1;
    store.set("poll:votes", votes);
    store.set("poll:mine", id);
    drawPoll();
    pollEl.querySelector(`[data-id="${CSS.escape(id)}"]`)?.focus();
  });
  // 같은 브라우저의 다른 탭에서 투표하면 즉시 반영
  window.addEventListener("storage", (e) => {
    if (e.key && e.key.startsWith(NS + "poll:")) drawPoll();
  });
  drawPoll();

  /* =========================================================
   * 2. 수강 신청서 (빠진 항목 안내)
   * ========================================================= */
  const A = P.apply;
  const applyCard = $(".apply-card");
  const fieldHTML = (f) => {
    const id = `ap-${f.name}`;
    const req = f.required ? `<span class="req" aria-hidden="true">*</span>` : "";
    const common = `id="${id}" name="${esc(f.name)}" ${f.required ? "required" : ""} aria-describedby="${id}-err"`;
    let input;
    if (f.type === "textarea")
      input = `<textarea ${common} rows="4" placeholder="${esc(f.placeholder || "")}"></textarea>`;
    else if (f.type === "select")
      input = `<select ${common}><option value="">선택하세요</option>${(f.options || [])
        .map((o) => `<option>${esc(o)}</option>`)
        .join("")}</select>`;
    else if (f.type === "radio")
      return `<fieldset class="field" data-field="${esc(f.name)}"><legend>${esc(f.label)}${req}</legend>
        <div class="radio-row">${(f.options || [])
          .map(
            (o, i) =>
              `<label class="chip"><input type="radio" name="${esc(f.name)}" value="${esc(o)}" ${
                i === 0 ? `id="${id}"` : ""
              } aria-describedby="${id}-err" /><span>${esc(o)}</span></label>`
          )
          .join("")}</div><p class="field-error" id="${id}-err"></p></fieldset>`;
    else if (f.type === "checkbox")
      return `<div class="field field-check" data-field="${esc(f.name)}">
        <label><input type="checkbox" ${common} /> <span>${esc(f.label)}${req}</span></label>
        <p class="field-error" id="${id}-err"></p></div>`;
    else input = `<input type="${f.type}" ${common} placeholder="${esc(f.placeholder || "")}" autocomplete="off" />`;
    return `<div class="field" data-field="${esc(f.name)}"><label for="${id}">${esc(f.label)}${req}</label>${input}
      <p class="field-error" id="${id}-err"></p></div>`;
  };
  const FIELD_TYPES = [
    ["text", "짧은 글"], ["textarea", "긴 글"], ["email", "이메일"], ["tel", "전화번호"],
    ["select", "목록에서 고르기"], ["radio", "하나 고르기(버튼)"], ["checkbox", "동의 체크"],
  ];
  const drawApplyEditor = () => {
    applyCard.innerHTML = `<p class="edit-hint">신청서 항목 — 이름을 눌러 고치고, 형식과 필수 여부를 고르세요.</p>
      <ol class="field-edit-list">${A.fields
        .map((f, i) => {
          const p = `participate.apply.fields.${i}`;
          return `<li class="field-edit">
            <div class="fe-top"><strong${E(p + ".label", { ph: "항목 이름" })}>${esc(f.label)}</strong>${ETools("participate.apply.fields", i, A.fields.length)}</div>
            <div class="fe-opts">
              <label class="ei"><span>형식</span><select data-edit-input="${p}.type">${FIELD_TYPES.map(
                ([v, l]) => `<option value="${v}" ${f.type === v ? "selected" : ""}>${l}</option>`
              ).join("")}</select></label>
              <label class="ei-check"><input type="checkbox" data-edit-input="${p}.required" data-type="bool" ${f.required ? "checked" : ""}/> 필수</label>
              ${["select", "radio"].includes(f.type) ? EI(p + ".options", (f.options || []).join(", "), "선택지 (쉼표로 구분)", "text", 'data-type="csv"') : ""}
              ${["text", "textarea", "email", "tel"].includes(f.type) ? EI(p + ".placeholder", f.placeholder, "입력 예시") : ""}
            </div></li>`;
        })
        .join("")}</ol>
      <p class="center">${EAdd("participate.apply.fields", "field", "항목 추가")}</p>
      <div class="fe-bottom">
        <div class="ef"><span>제출 버튼 문구</span><span class="btn btn-sm"${E("participate.apply.submitText", { ph: "제출" })}>${esc(A.submitText)}</span></div>
        <div class="ef"><span>제출 완료 제목</span><span${E("participate.apply.successTitle", { ph: "완료 제목" })}>${esc(A.successTitle)}</span></div>
        <div class="ef"><span>제출 완료 안내</span><span${E("participate.apply.successBody", { ph: "완료 안내" })}>${esc(A.successBody)}</span></div>
      </div>`;
  };
  const drawApplyForm = () => {
    if (ed()) return drawApplyEditor();
    applyCard.innerHTML = `<form class="apply-form" novalidate>
      <div class="error-summary" role="alert" hidden></div>
      <div class="form-grid">${A.fields.map(fieldHTML).join("")}</div>
      <button class="btn" type="submit">${esc(A.submitText)}</button>
    </form>`;
  };
  drawApplyForm();
  // 편집 모드를 켜고 끌 때 editor.js 가 다시 그리게 합니다.
  window.PARTICIPATE = {
    redraw() {
      drawHeads();
      drawPoll();
      drawApplyForm();
    },
  };

  const fieldValue = (form, f) => {
    if (f.type === "radio") return form.querySelector(`input[name="${f.name}"]:checked`)?.value || "";
    const el = form.elements.namedItem(f.name);
    if (f.type === "checkbox") return el.checked;
    return el.value.trim();
  };
  const validateField = (form, f) => {
    const v = fieldValue(form, f);
    if (f.required && (v === "" || v === false))
      return f.type === "checkbox" ? "동의가 필요합니다." : f.type === "select" || f.type === "radio" ? "항목을 선택해 주세요." : "필수 입력 항목입니다.";
    if (v && f.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "올바른 이메일 주소를 입력해 주세요.";
    if (v && f.pattern && !new RegExp(f.pattern).test(v)) return f.patternMessage || "형식을 확인해 주세요.";
    if (v && f.minLength && v.length < f.minLength) return `${f.minLength}자 이상 입력해 주세요. (현재 ${v.length}자)`;
    return "";
  };
  const showFieldError = (form, f, msg) => {
    const wrap = form.querySelector(`[data-field="${f.name}"]`);
    wrap.classList.toggle("invalid", !!msg);
    wrap.querySelector(".field-error").textContent = msg;
    wrap.querySelectorAll("input,select,textarea").forEach((el) => el.setAttribute("aria-invalid", msg ? "true" : "false"));
  };

  // 한 번 제출을 시도한 뒤에는 고칠 때마다 바로 다시 검사
  const revalidate = (e) => {
    const form = e.target.form;
    if (!form || !form.dataset.tried) return;
    const f = A.fields.find((x) => x.name === e.target.name);
    if (f) showFieldError(form, f, validateField(form, f));
  };
  applyCard.addEventListener("input", revalidate);
  applyCard.addEventListener("change", revalidate);
  applyCard.addEventListener("click", (e) => {
    const link = e.target.closest("[data-focus]");
    if (link) {
      e.preventDefault();
      document.getElementById(link.dataset.focus)?.focus();
    }
    if (e.target.closest(".again")) drawApplyForm();
  });

  applyCard.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    form.dataset.tried = "1";
    const errors = [];
    A.fields.forEach((f) => {
      const msg = validateField(form, f);
      showFieldError(form, f, msg);
      if (msg) errors.push(f);
    });
    const summary = form.querySelector(".error-summary");
    if (errors.length) {
      summary.hidden = false;
      summary.innerHTML = `<strong>빠진 항목이나 확인이 필요한 항목이 ${errors.length}개 있어요.</strong>
        <ul>${errors
          .map((f) => `<li><a href="#" data-focus="ap-${esc(f.name)}">${esc(f.label.replace(/\(.*\)/, "").trim())}</a></li>`)
          .join("")}</ul>`;
      document.getElementById(`ap-${errors[0].name}`)?.focus();
      summary.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    summary.hidden = true;
    const data = Object.fromEntries(A.fields.map((f) => [f.name, fieldValue(form, f)]));
    data.submittedAt = new Date().toISOString();
    data.receipt = String(C.site.id || "C").slice(0, 4).toUpperCase() + "-" + Date.now().toString(36).toUpperCase().slice(-6);

    const btn = form.querySelector("button[type=submit]");
    btn.disabled = true;
    btn.textContent = "제출 중…";
    try {
      if (A.endpoint) {
        const res = await fetch(A.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error(res.status);
      }
      const apps = store.get("applications", []).filter((a) => a.studentId !== data.studentId);
      apps.push(data);
      store.set("applications", apps);
      applyCard.innerHTML = `<div class="success">
        <div class="success-icon">🌸</div><h4>${esc(A.successTitle)}</h4>
        <p>${esc(data.name)} 님, 접수번호는 <strong>${esc(data.receipt)}</strong> 입니다.</p>
        <p class="muted">${esc(A.successBody)}</p>
        <button class="btn btn-ghost btn-sm again" type="button">새 신청서 작성</button></div>`;
      celebrate(90);
    } catch (err) {
      btn.disabled = false;
      btn.textContent = A.submitText;
      summary.hidden = false;
      summary.innerHTML = `<strong>제출하지 못했어요.</strong> 네트워크 상태를 확인하고 다시 시도해 주세요.`;
    }
  });

  /* =========================================================
   * 3. 수강생 공간: 로그인 · 출석 · 과제 제출
   * ========================================================= */
  const portal = $(".portal");
  const T = P.portal;
  const assignments = X.weeks.filter((w) => w.assignment).map((w) => w.assignment);
  const sessions = X.weeks.flatMap((w) => w.days.filter((d) => !d.holiday));
  let pendingWeek = null; // 커리큘럼의 "제출하기"에서 넘어온 과제

  const user = () => store.get("session", null);

  const drawLogin = (msg = "") => {
    portal.innerHTML = `<form class="card login-card" novalidate>
      <div class="login-icon" aria-hidden="true">🔐</div>
      <h4>수강생 로그인</h4>
      <div class="field"><label for="lg-id">학번</label><input id="lg-id" name="id" inputmode="numeric" placeholder="2024123456" autocomplete="username" /></div>
      <div class="field"><label for="lg-name">이름</label><input id="lg-name" name="name" placeholder="홍길동" autocomplete="name" /></div>
      <p class="field-error login-error" role="alert">${esc(msg)}</p>
      <button class="btn" type="submit">로그인</button>
      ${pendingWeek ? `<p class="muted small">로그인하면 ${pendingWeek}주차 과제 제출로 바로 이어집니다.</p>` : ""}
    </form>`;
  };

  const drawPortal = () => {
    const u = user();
    if (!u) return drawLogin();
    const prevWeek = portal.querySelector("#up-week")?.value; // 다시 그려도 고른 과제 유지
    const now = X.now();
    const todayKey = X.ymd(now);
    const att = store.get(`att:${u.id}`, {});
    const subs = store.get(`subs:${u.id}`, {});

    // 오늘 수업
    const todays = (X.byDate[todayKey]?.sessions || []).filter((s) => !s.holiday);
    const next = sessions.find((s) => s.date > now && s.key !== todayKey);
    let todayHTML;
    if (todays.length) {
      const s = todays[0];
      todayHTML = att[todayKey]
        ? `<p class="att-status done">✅ 출석 완료 · ${esc(hm(new Date(att[todayKey])))}</p>
           <p class="muted">${s.week}주차 · ${esc(s.topic)}</p>`
        : `<p class="muted">오늘은 ${s.week}주차 수업 날이에요.</p><p class="att-topic">${esc(s.topic)}</p>
           <button class="btn check-in" type="button">출석 체크</button>`;
    } else {
      todayHTML = `<p class="att-status">오늘은 수업이 없습니다.</p>${
        next ? `<p class="muted">다음 수업: ${esc(X.fmtDate(next.date))} · ${next.week}주차</p>` : `<p class="muted">학기의 모든 수업이 끝났습니다.</p>`
      }`;
    }

    // 출석 기록
    const past = sessions.filter((s) => s.key <= todayKey);
    const present = past.filter((s) => att[s.key]).length;
    const rate = past.length ? Math.round((present / past.length) * 100) : 0;
    const chips = X.weeks
      .flatMap((w) => w.days)
      .map((s) => {
        const st = s.holiday ? "holiday" : att[s.key] ? "present" : s.key < todayKey ? "absent" : s.key === todayKey ? "today" : "upcoming";
        const label = { holiday: "휴강", present: "출석", absent: "결석", today: "오늘", upcoming: "예정" }[st];
        return `<li class="att-chip ${st}" title="${esc(X.fmtDate(s.date))} · ${label}"><span>${s.date.getMonth() + 1}/${s.date.getDate()}</span><em>${label}</em></li>`;
      })
      .join("");

    // 과제 목록
    const rows = assignments
      .map((a) => {
        const sub = subs[a.week];
        const closed = a.dueDate <= now;
        const status = sub
          ? `<span class="st ok">제출 완료</span><small>${esc(sub.name)} · ${esc(fmtSize(sub.size))} · ${esc(
              X.fmtDue(new Date(sub.at)).slice(6)
            )}</small>`
          : closed
          ? `<span class="st closed">마감 · 미제출</span>`
          : `<span class="st todo">미제출</span><small>${esc(X.remain(a.dueDate).text)}</small>`;
        return `<li><div><strong>${a.week}주차 · ${esc(a.title)}</strong><small>마감 ${esc(X.fmtDue(a.dueDate))}</small></div><div class="status">${status}</div></li>`;
      })
      .join("");
    const open = assignments.filter((a) => a.dueDate > now);

    portal.innerHTML = `
      <div class="portal-bar card">
        <p>🌸 <strong>${esc(u.name)}</strong> 님 <span class="muted">(${esc(u.id)})</span></p>
        <button class="btn btn-ghost btn-sm logout" type="button">로그아웃</button>
      </div>
      <div class="portal-grid">
        <div class="card att-card">
          <h4>오늘의 출석 <small>${esc(X.fmtDate(now))}</small></h4>
          ${todayHTML}
          <div class="att-summary"><span>출석률</span><strong>${rate}%</strong><span class="muted">${present} / ${past.length}회</span></div>
          <div class="rate-bar"><span style="width:${rate}%"></span></div>
          <details class="att-detail"><summary>전체 출석 기록 보기</summary><ul class="att-chips">${chips}</ul></details>
        </div>
        <div class="card sub-card">
          <h4>과제 제출</h4>
          ${
            open.length
              ? `<form class="upload-form" novalidate>
                  <div class="field"><label for="up-week">과제 선택</label>
                    <select id="up-week" name="week"><option value="">제출할 과제를 고르세요</option>${open
                      .map((a) => `<option value="${a.week}">${a.week}주차 · ${esc(a.title)}</option>`)
                      .join("")}</select></div>
                  <label class="dropzone" for="up-file">
                    <input type="file" id="up-file" name="file" accept="${esc(T.accept.join(","))}" />
                    <span class="dz-icon" aria-hidden="true">📎</span>
                    <span class="dz-text">파일을 끌어다 놓거나 눌러서 선택하세요</span>
                    <span class="dz-hint">${esc(T.accept.join(", "))} · 최대 ${T.maxFileMB}MB</span>
                  </label>
                  <p class="field-error upload-error" role="alert"></p>
                  <button class="btn" type="submit">제출하기</button>
                </form>`
              : `<p class="muted">지금 제출할 수 있는 과제가 없습니다.</p>`
          }
          <ul class="sub-list">${rows}</ul>
        </div>
      </div>`;

    const keep = pendingWeek || Number(prevWeek);
    if (keep && open.some((a) => a.week === keep)) $("#up-week").value = String(keep);
    pendingWeek = null;
  };

  portal.addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.target;
    if (form.classList.contains("login-card")) {
      const id = form.elements.namedItem("id").value.trim();
      const name = form.elements.namedItem("name").value.trim();
      if (!id || !name) return drawLoginError(form, "학번과 이름을 모두 입력해 주세요.");
      if (!/^\d{10}$/.test(id)) return drawLoginError(form, "학번은 숫자 10자리입니다.");
      if (T.roster.length && !T.roster.some((r) => r.id === id && r.name === name))
        return drawLoginError(form, "수강생 명단에서 찾을 수 없어요. 학번과 이름을 확인해 주세요.");
      store.set("session", { id, name });
      store.set("students", { ...store.get("students", {}), [id]: name }); // 관리자 화면 출석부용
      drawPortal();
      return;
    }
    if (form.classList.contains("upload-form")) {
      const err = form.querySelector(".upload-error");
      const week = Number(form.elements.namedItem("week").value);
      const file = form.elements.namedItem("file").files[0];
      const a = assignments.find((x) => x.week === week);
      const ext = file ? "." + file.name.split(".").pop().toLowerCase() : "";
      if (!week && !file) return (err.textContent = "과제와 파일을 선택해 주세요.");
      if (!week) return (err.textContent = "제출할 과제를 선택해 주세요.");
      if (!file) return (err.textContent = "제출할 파일을 선택해 주세요.");
      if (!T.accept.includes(ext)) return (err.textContent = `${T.accept.join(", ")} 파일만 제출할 수 있어요.`);
      if (file.size > T.maxFileMB * 1024 * 1024) return (err.textContent = `파일이 너무 커요. 최대 ${T.maxFileMB}MB까지 제출할 수 있어요.`);
      if (a.dueDate <= X.now()) return (err.textContent = "마감이 지난 과제입니다.");
      const u = user();
      const subs = store.get(`subs:${u.id}`, {});
      subs[week] = { name: file.name, size: file.size, at: X.now().toISOString() };
      store.set(`subs:${u.id}`, subs);
      drawPortal();
      toast(`${week}주차 과제를 제출했어요 ✨`);
    }
  });
  const drawLoginError = (form, msg) => {
    form.querySelector(".login-error").textContent = msg;
  };

  portal.addEventListener("click", (e) => {
    if (e.target.closest(".logout")) {
      store.remove("session");
      drawPortal();
    }
    if (e.target.closest(".check-in")) {
      const u = user();
      const key = X.ymd(X.now());
      const att = store.get(`att:${u.id}`, {});
      att[key] = X.now().toISOString();
      store.set(`att:${u.id}`, att);
      drawPortal();
      toast("출석이 확인되었어요 ✅");
      celebrate(50);
    }
  });

  // 파일 선택 / 끌어다 놓기 표시
  portal.addEventListener("change", (e) => {
    if (e.target.id !== "up-file") return;
    const f = e.target.files[0];
    const dz = e.target.closest(".dropzone");
    dz.classList.toggle("has-file", !!f);
    dz.querySelector(".dz-text").textContent = f ? `${f.name} (${fmtSize(f.size)})` : "파일을 끌어다 놓거나 눌러서 선택하세요";
    portal.querySelector(".upload-error").textContent = "";
  });
  ["dragenter", "dragover"].forEach((t) =>
    portal.addEventListener(t, (e) => {
      const dz = e.target.closest?.(".dropzone");
      if (!dz) return;
      e.preventDefault();
      dz.classList.add("drag");
    })
  );
  ["dragleave", "drop"].forEach((t) =>
    portal.addEventListener(t, (e) => {
      const dz = e.target.closest?.(".dropzone");
      if (!dz) return;
      e.preventDefault();
      dz.classList.remove("drag");
      if (t === "drop" && e.dataTransfer.files.length) {
        const input = dz.querySelector("input");
        input.files = e.dataTransfer.files;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
    })
  );

  // 커리큘럼의 "제출하기" → 수강생 공간으로
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-submit-week]");
    if (!b || e.defaultPrevented) return;
    pendingWeek = Number(b.dataset.submitWeek);
    drawPortal();
  });

  drawPortal();

  /* =========================================================
   * 4. 토스트 메시지
   * ========================================================= */
  const toastEl = document.createElement("div");
  toastEl.className = "toast";
  toastEl.setAttribute("role", "status");
  document.body.appendChild(toastEl);
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 3200);
  }

  /* =========================================================
   * 5. 폭죽 효과
   * ========================================================= */
  const reduceMotion =
    (C.welcome?.respectReducedMotion ?? true) && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function celebrate(amount = 160) {
    if (reduceMotion) return sparkle(Math.round(amount / 3));
    const cv = document.createElement("canvas");
    cv.className = "confetti";
    document.body.appendChild(cv);
    const ctx = cv.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = (cv.width = innerWidth * dpr), H = (cv.height = innerHeight * dpr);
    const colors = ["#f7a8c4", "#ffd3e2", "#d9739a", "#ffffff", "#c9a7ff", "#ffc56b"];
    const parts = [];
    const burst = (x, y, n, dir) => {
      for (let i = 0; i < n; i++) {
        const ang = -Math.PI / 2 + dir * (0.25 + Math.random() * 0.55) + (Math.random() - 0.5) * 0.5;
        const sp = (9 + Math.random() * 9) * dpr;
        parts.push({
          x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
          w: (6 + Math.random() * 6) * dpr, h: (8 + Math.random() * 8) * dpr,
          r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3,
          c: colors[(Math.random() * colors.length) | 0], petal: Math.random() < 0.45, life: 0,
        });
      }
    };
    burst(W * 0.1, H, amount / 2, 1);
    burst(W * 0.9, H, amount / 2, -1);
    const t0 = performance.now();
    const tick = (t) => {
      ctx.clearRect(0, 0, W, H);
      const fade = Math.max(0, 1 - (t - t0 - 2600) / 1400);
      parts.forEach((p) => {
        p.vy += 0.32 * dpr;
        p.vx *= 0.985;
        p.vy *= 0.985;
        p.x += p.vx + Math.sin((t + p.r * 500) / 300) * dpr;
        p.y += p.vy;
        p.r += p.vr;
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.c;
        if (p.petal) {
          ctx.beginPath();
          ctx.ellipse(0, 0, p.w * 0.6, p.h * 0.45, 0, 0, Math.PI * 2);
          ctx.fill();
        } else ctx.fillRect(-p.w / 2, -p.h / 4, p.w, p.h / 2);
        ctx.restore();
      });
      if (fade > 0) requestAnimationFrame(tick);
      else cv.remove();
    };
    requestAnimationFrame(tick);
  }

  // '애니메이션 효과 끄기'를 켠 컴퓨터용 잔잔한 폭죽 — 날아다니지 않고 제자리에서 반짝였다 사라집니다.
  function sparkle(n = 40) {
    const box = document.createElement("div");
    box.className = "sparkles";
    box.setAttribute("aria-hidden", "true");
    const colors = ["#f7a8c4", "#ffd3e2", "#d9739a", "#ffffff", "#c9a7ff", "#ffc56b"];
    for (let i = 0; i < n; i++) {
      const s = document.createElement("i");
      const size = 6 + Math.random() * 10;
      s.style.cssText = `left:${Math.random() * 100}%;top:${Math.random() * 70}%;width:${size}px;height:${size * 0.8}px;
        background:${colors[(Math.random() * colors.length) | 0]};animation-delay:${Math.random() * 0.6}s;
        border-radius:${Math.random() < 0.5 ? "50%" : "2px"}`;
      box.appendChild(s);
    }
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 2600);
  }
  window.CELEBRATE = celebrate; // 공지 팝업(app.js)에서도 사용

  /* =========================================================
   * 6. 첫 방문 환영 (공지 팝업은 app.js 에서 공지사항과 함께 처리)
   * ========================================================= */
  const W = C.welcome || {};
  if (!store.get("visited", false)) {
    store.set("visited", true);
    if (W.confetti) setTimeout(() => celebrate(), 400);
    if (W.message) setTimeout(() => toast(W.message), 600);
  }
})();
