/* 페이지 바로 편집 — 관리자 창을 열지 않고 본문에서 직접 고칩니다.
 * 🔒 → 비밀번호 → 편집 모드: 커리큘럼(주차·달력), 우수 과제, 수강생 참여, FAQ 의 점선 부분을 눌러 바로 고치고
 * 아래 막대의 '저장하고 적용'으로 저장합니다. (모든 방문자에게 적용하려면 config.js 내려받기 → 파일 교체 → 배포) */
(function () {
  const APP = window.APP;
  const ADMIN = window.ADMIN;
  if (!APP || !ADMIN) return;
  const C = window.SITE_CONFIG;
  const NS = window.SITE_NS || "course:";
  const ss = {
    get: (k) => { try { return sessionStorage.getItem(NS + k); } catch { return null; } },
    set: (k, v) => { try { sessionStorage.setItem(NS + k, v); } catch {} },
    remove: (k) => { try { sessionStorage.removeItem(NS + k); } catch {} },
  };
  const editing = () => document.body.classList.contains("editing");
  let dirty = false;

  /* ===== 설정 값 읽고 쓰기 ("faq.items.0.q" 같은 경로) ===== */
  const getAt = (path) => path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), C);
  const setAt = (path, v) => {
    const ks = path.split(".");
    const last = ks.pop();
    let o = C;
    ks.forEach((k, n) => {
      if (o[k] == null) o[k] = /^\d+$/.test(ks[n + 1] ?? last) ? [] : {};
      o = o[k];
    });
    o[last] = v;
  };
  const sectionOf = (path) => path.split(".")[0]; // curriculum · portfolio · faq · participate

  // 새 항목의 기본 모양
  const TPL = {
    week: () => ({ title: "새 주차", desc: "", sessions: [], videos: [] }),
    video: () => ({ title: "영상 제목", url: "" }),
    faq: () => ({ q: "새 질문", a: "" }),
    portfolio: () => ({ title: "작품 제목", student: "", assignment: "", desc: "", image: "", link: "" }),
    option: () => ({ id: "opt" + Date.now().toString(36), label: "새 선택지" }),
    field: () => ({ name: "f" + Date.now().toString(36), label: "새 항목", type: "text", required: false, placeholder: "" }),
    notice: () => {
      const d = new Date();
      const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      return { date, title: "새 공지", body: "", pinned: false, popup: false };
    },
  };

  /* ===== 아래쪽 편집 막대 ===== */
  const bar = document.createElement("div");
  bar.className = "edit-bar";
  bar.hidden = true;
  bar.setAttribute("role", "toolbar");
  bar.setAttribute("aria-label", "페이지 편집");
  bar.innerHTML = `
    <div class="eb-info"><strong>✏️ 페이지 편집 중</strong><span class="eb-state" aria-live="polite"></span></div>
    <div class="eb-actions">
      <button type="button" class="btn btn-sm" data-eb="save">저장하고 적용</button>
      <button type="button" class="btn btn-ghost btn-sm" data-eb="export">config.js 내려받기</button>
      <button type="button" class="btn btn-ghost btn-sm" data-eb="panel">관리자 창</button>
      <button type="button" class="btn btn-ghost btn-sm" data-eb="done">편집 끝내기</button>
    </div>`;
  document.body.appendChild(bar);
  const state = bar.querySelector(".eb-state");
  const setDirty = (v) => {
    dirty = v;
    bar.classList.toggle("dirty", v);
    state.textContent = v ? "● 저장하지 않은 변경이 있어요" : "점선 부분을 눌러 바로 고치세요";
  };
  const flash = (text) => {
    state.textContent = text;
    setTimeout(() => setDirty(dirty), 3500);
  };

  function start() {
    if (!ADMIN.isAdmin()) return;
    if (editing()) return bar.querySelector('[data-eb="save"]').focus();
    document.body.classList.add("editing");
    bar.hidden = false;
    ss.set("editing", "1");
    const lock = document.querySelector(".admin-lock");
    if (lock) lock.textContent = "🔓";
    setDirty(false);
    APP.rerenderAll();
  }
  function stop(force) {
    if (!editing()) return;
    if (dirty && !force) {
      if (confirm("저장하지 않은 변경이 있습니다. 저장할까요?\n(취소를 누르면 변경 내용을 버립니다)")) return save(false);
      dirty = false;
      ss.remove("editing");
      return location.reload();
    }
    if (dirty && force) {
      dirty = false;
      ss.remove("editing");
      return location.reload();
    }
    document.body.classList.remove("editing");
    bar.hidden = true;
    ss.remove("editing");
    APP.rerenderAll();
  }
  function save(stayEditing = true) {
    if (!ADMIN.saveOverride(C)) {
      alert("저장 공간이 부족해 저장하지 못했습니다. 이미지 크기를 줄이거나 config.js 를 내려받아 주세요.");
      return;
    }
    dirty = false;
    stayEditing ? ss.set("editing", "1") : ss.remove("editing");
    ss.set("saved", "1");
    location.reload();
  }

  bar.addEventListener("click", (e) => {
    const b = e.target.closest("[data-eb]");
    if (!b) return;
    const act = b.dataset.eb;
    if (act === "save") save();
    if (act === "export") {
      ADMIN.exportConfig(C);
      flash("config.js 를 내려받았습니다 — 사이트 폴더의 config.js 와 바꿔 주세요.");
    }
    if (act === "panel") {
      if (dirty && confirm("페이지에서 고친 내용을 먼저 저장할까요?\n(확인: 저장 후 다시 열림 / 취소: 저장하지 않고 관리자 창 열기)")) {
        ss.set("reopen", "notices");
        return save();
      }
      ADMIN.openPanel();
    }
    if (act === "done") stop();
  });

  /* ===== 글자 바로 고치기 (contenteditable) ===== */
  const readText = (el) => {
    let t = el.innerText.replace(/ /g, " ");
    if (!el.hasAttribute("data-multi")) t = t.replace(/\s*\n\s*/g, " ");
    return t.replace(/\n+$/, "").trim();
  };
  document.addEventListener("input", (e) => {
    const el = e.target.closest?.("[data-edit]");
    if (!el || !editing()) return;
    const path = el.dataset.edit;
    const v = readText(el);
    setAt(path, v);
    setDirty(true);
    // 주차 제목·설명은 접힌 제목 줄에도 바로 반영
    const m = path.match(/^curriculum\.weeks\.(\d+)\.(title|desc)$/);
    if (m) {
      const sum = document.querySelector(`#week-${Number(m[1]) + 1} .week-title ${m[2] === "title" ? "strong" : "small"}`);
      if (sum) sum.textContent = v;
    }
  });
  document.addEventListener("keydown", (e) => {
    const el = e.target.closest?.("[data-edit]");
    if (!el || !editing()) return;
    if (e.key === "Escape") el.blur();
    if (e.key === "Enter" && !el.hasAttribute("data-multi")) {
      e.preventDefault();
      el.blur();
    }
  });
  // 붙여 넣을 때는 서식 없이 글자만
  document.addEventListener("paste", (e) => {
    const el = e.target.closest?.("[data-edit]");
    if (!el || !editing()) return;
    e.preventDefault();
    let text = (e.clipboardData || window.clipboardData).getData("text/plain");
    if (!el.hasAttribute("data-multi")) text = text.replace(/\s*\n\s*/g, " ");
    document.execCommand("insertText", false, text);
  });

  /* ===== 입력칸(날짜·링크·형식 등) ===== */
  const readImage = (file, maxW = 800) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
        const cv = document.createElement("canvas");
        cv.width = Math.round(img.width * scale);
        cv.height = Math.round(img.height * scale);
        cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
        URL.revokeObjectURL(img.src);
        resolve(cv.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });

  document.addEventListener("change", async (e) => {
    if (!editing()) return;
    const t = e.target;
    if (t.matches("[data-edit-days]")) {
      const days = [...t.closest(".day-checks").querySelectorAll("input:checked")].map((x) => Number(x.value));
      if (!days.length) {
        t.checked = true;
        return alert("수업 요일을 하루 이상 골라 주세요.");
      }
      setAt("curriculum.classDays", days.sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)));
      setDirty(true);
      return APP.rerender("curriculum");
    }
    if (t.matches("[data-edit-image]")) {
      const f = t.files[0];
      if (!f) return;
      try {
        setAt(t.dataset.editImage, await readImage(f));
        setDirty(true);
        APP.rerender(sectionOf(t.dataset.editImage));
      } catch {
        alert("이미지를 읽지 못했습니다.");
      }
      return;
    }
    if (!t.matches("[data-edit-input]")) return;
    const path = t.dataset.editInput;
    let v = t.value;
    if (t.dataset.type === "bool") v = t.checked;
    else if (t.dataset.type === "csv") v = v.split(",").map((s) => s.trim()).filter(Boolean);
    else if (t.dataset.type === "num") v = Number(v) || 0;
    setAt(path, v);
    // 신청서 항목 형식을 '고르기'로 바꾸면 기본 선택지 넣기
    if (/\.type$/.test(path) && ["select", "radio"].includes(v)) {
      const base = path.replace(/\.type$/, "");
      if (!(getAt(base + ".options") || []).length) setAt(base + ".options", ["선택 1", "선택 2"]);
    }
    setDirty(true);
    APP.rerender(sectionOf(path));
  });

  /* ===== 추가 · 삭제 · 순서 바꾸기 ===== */
  const focusPath = (prefix) =>
    setTimeout(() => {
      const all = [...document.querySelectorAll("[data-edit]")];
      // 새 항목은 제목·질문·이름 칸부터
      const el =
        all.find((x) => [".title", ".q", ".label"].some((s) => x.dataset.edit === prefix + s)) ||
        all.find((x) => x.dataset.edit.startsWith(prefix));
      if (!el) return;
      el.scrollIntoView({ block: "center", behavior: "smooth" });
      el.focus();
      document.getSelection()?.selectAllChildren(el);
    }, 50);

  document.addEventListener("click", (e) => {
    if (!editing()) return;
    const b = e.target.closest("[data-act]");
    if (!b || b.closest(".admin-overlay")) return; // 관리자 창 안의 버튼은 admin.js 가 처리
    const act = b.dataset.act;
    const path = b.dataset.path || "";
    const i = Number(b.dataset.i);
    let section = sectionOf(path || "curriculum");
    let focus = null, openWeek = null;
    switch (act) {
      case "add": {
        if (!getAt(path)) setAt(path, []);
        const arr = getAt(path);
        arr.push(TPL[b.dataset.tpl]());
        focus = `${path}.${arr.length - 1}`;
        if (path === "curriculum.weeks") openWeek = arr.length;
        break;
      }
      case "add-after": {
        getAt(path).splice(i + 1, 0, TPL[b.dataset.tpl]());
        focus = `${path}.${i + 1}`;
        if (path === "curriculum.weeks") openWeek = i + 2;
        break;
      }
      case "del": {
        if (!confirm("이 항목을 삭제할까요?")) return;
        getAt(path).splice(i, 1);
        break;
      }
      case "up":
      case "down": {
        const arr = getAt(path);
        const j = act === "up" ? i - 1 : i + 1;
        if (j < 0 || j >= arr.length) return;
        [arr[i], arr[j]] = [arr[j], arr[i]];
        if (path === "curriculum.weeks") openWeek = j + 1;
        break;
      }
      case "add-assignment":
        setAt(`curriculum.weeks.${i}.assignment`, { title: "새 과제", desc: "", due: APP.weekSunday(i) });
        section = "curriculum";
        focus = `curriculum.weeks.${i}.assignment.title`;
        openWeek = i + 1;
        break;
      case "del-key": {
        if (!confirm("이 과제를 없앨까요?")) return;
        const ks = path.split(".");
        const last = ks.pop();
        delete getAt(ks.join("."))[last];
        break;
      }
      case "holiday-on":
        (C.curriculum.holidays ||= []).push({ date: b.dataset.date, name: "휴강" });
        section = "curriculum";
        break;
      case "holiday-off":
        C.curriculum.holidays = (C.curriculum.holidays || []).filter((h) => h.date !== b.dataset.date);
        section = "curriculum";
        break;
      case "clear":
        setAt(path, "");
        break;
      default:
        return;
    }
    e.preventDefault();
    setDirty(true);
    APP.rerender(section);
    if (openWeek) {
      const w = document.getElementById("week-" + openWeek);
      if (w) w.open = true;
    }
    if (focus) focusPath(focus);
  });

  // 저장하지 않고 나가려 하면 경고
  window.addEventListener("beforeunload", (e) => {
    if (dirty) {
      e.preventDefault();
      e.returnValue = "";
    }
  });

  window.EDITOR = { start, stop, isDirty: () => dirty };

  // 저장 후 새로고침되면 편집 모드를 이어서 켭니다.
  if (ADMIN.isAdmin() && ss.get("editing") === "1") {
    start();
    if (ss.get("saved")) {
      ss.remove("saved");
      flash("✓ 저장했습니다. 모든 방문자에게 적용하려면 config.js 를 내려받아 교체하세요.");
    }
  }
})();
