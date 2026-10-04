/* 1) 저장 공간 이름을 수업마다 나눕니다 (site.id 기준) — 같은 주소에 여러 수업 사이트를 올려도 기록이 섞이지 않습니다.
 * 2) 관리자 화면에서 고친 설정이 이 브라우저에 저장되어 있으면 config.js 대신 그것을 사용합니다.
 *    (원래 설정은 SITE_CONFIG_ORIGINAL 에 보관 — 관리자 화면의 '원래대로 되돌리기'에서 사용) */
(function () {
  const C = window.SITE_CONFIG || {};
  window.SITE_CONFIG_ORIGINAL = JSON.parse(JSON.stringify(C));
  const id = String((C.site && C.site.id) || "course").replace(/[^\w-]/g, "") || "course";
  // 폴더 위치도 함께 반영 — 템플릿을 복사해 식별자를 안 바꿨더라도 폴더마다 기록이 따로 저장됩니다.
  const dir = decodeURIComponent(location.pathname).replace(/[^/\\]*$/, "");
  let h = 0;
  for (const ch of dir) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  window.SITE_NS = id + "-" + h.toString(36) + ":";
  try {
    const saved = localStorage.getItem(window.SITE_NS + "configOverride");
    if (saved) {
      window.SITE_CONFIG = JSON.parse(saved);
      window.SITE_CONFIG_OVERRIDDEN = true;
    }
  } catch (e) {}
})();
