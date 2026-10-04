/* =========================================================
 * 사이트 설정 파일 — 홈페이지의 모든 문구와 내용은 여기서 고칩니다.
 * index.html / app.js / style.css 는 건드리지 않아도 됩니다.
 *  - 문자열은 따옴표(" ") 안에서만 수정하세요.
 *  - 항목을 늘리거나 줄일 때는 { ... } 묶음 단위로 복사·삭제하고,
 *    묶음 사이의 쉼표(,)를 잊지 마세요.
 * ========================================================= */
window.SITE_CONFIG = {
  /* ---------- 첫 화면(히어로) · 사이트 기본 ---------- */
  site: {
    id: "kupoetry", // 사이트 식별자(영문·숫자). 수업마다 다르게 — 기록 저장 공간이 이 이름으로 나뉩니다.
    emblem: "詩歌", // 제목 앞 상징 문양 (1~2글자 권장, 탭 아이콘은 첫 글자로 자동 생성)
    petals: true, // 떨어지는 꽃잎 효과
    badgeIcon: "🌸", // 배지 앞 아이콘 (없애려면 "")
    badge: "2026학년도 2학기 집중 프로그램",
    title: "근현대명시가선독",
    titleAlt: "近現代名詩歌選読", // 보조 제목(원어·영문 제목). 없으면 "" 로 두세요.
    subtitle: "AI 기반 시어 번역과 감상 능력 배양",
    university: "고려대학교",
    department: "일어일문학과",
    description:
      "메이지부터 쇼와까지, 일본 근현대 시와 단카를 원문으로 천천히 읽습니다. AI 번역 도구가 내놓은 결과를 원문과 나란히 놓고 비교하며, 기계가 놓치는 시어의 결과 울림을 스스로 찾아내는 감상·번역 능력을 기릅니다.",
    buttons: [
      { text: "수강 신청", target: "#apply", primary: true },
      { text: "커리큘럼 보기", target: "#curriculum" },
    ],
  },

  /* ---------- 색상 (비워 두면 기본 숲속 정원 색) ---------- */
  theme: {
    accent: "#2f5d3a", // 강조색 (숲 초록 — 버튼·메뉴·링크)
    accentSoft: "#1f3d27", // 제목 강조색 (짙은 초록)
    accentDeep: "#244a2e", // 진한 강조색 (버튼, 상징 문양)
  },

  /* ---------- 섹션 보이기 (false 로 두면 화면과 메뉴에서 빠집니다) ---------- */
  sections: {
    notice: true,
    about: true,
    curriculum: true,
    portfolio: true,
    tools: true,
    enroll: true,
    participate: true,
    faq: true,
  },

  /* ---------- 첫 화면 아래 한눈에 보기 ---------- */
  quickInfo: [
    { icon: "📅", label: "일정", value: "2026. 9. 1 개강 – 12. 9 (15주)" },
    { icon: "⏰", label: "시간", value: "매주 월·수 10:30 – 11:45" },
    { icon: "💻", label: "수업 방식", value: "대면 강의 + AI 실습" },
    { icon: "🎓", label: "수강 대상", value: "일본어 중급 이상 학부생" },
  ],

  /* ---------- 상단 메뉴 (target 은 아래 섹션 id 와 같아야 합니다) ---------- */
  nav: [
    { label: "프로그램 소개", target: "about" },
    { label: "커리큘럼", target: "curriculum" },
    { label: "우수 과제", target: "portfolio" },
    { label: "수강 안내", target: "enroll" },
    { label: "참여", target: "participate" },
    { label: "FAQ", target: "faq" },
    { label: "교수자", target: "instructor" },
  ],

  /* ---------- 프로그램 소개: 숫자 통계 + 강점 슬라이드 ---------- */
  about: {
    heading: "프로그램 소개",
    lead: "시를 정확히 읽는 힘과 AI를 비판적으로 다루는 힘을 함께 키우는 한 학기입니다.",
    // value 는 숫자만, suffix 는 숫자 뒤에 붙는 단위입니다. (저술·경력은 실제 값으로 수정하세요)
    stats: [
      { value: 15, suffix: "주", label: "체계적인 과정" },
      { value: 4, suffix: "종", label: "실습 AI 도구" },
      { value: 10, suffix: "권", label: "교수자 저술" },
      { value: 20, suffix: "년", label: "강의 경력" },
    ],
    strengthsHeading: "이 강의의 강점",
    strengths: [
      {
        icon: "🌸",
        title: "원문 정독",
        body: "작품을 한 행씩 소리 내어 읽고 문어·구어 표현과 역사적 가나 표기를 함께 익힙니다.",
      },
      {
        icon: "🤖",
        title: "AI 번역 비교 실습",
        body: "여러 AI 번역 결과를 원문과 대조하며 오역과 의미 손실이 생기는 지점을 직접 찾아냅니다.",
      },
      {
        icon: "🌙",
        title: "시대와 형식의 이해",
        body: "신체시에서 구어자유시, 근대 단카와 하이쿠까지 형식의 변화를 시대 흐름 속에서 이해합니다.",
      },
      {
        icon: "✒️",
        title: "나만의 번역",
        body: "AI 초벌 번역을 출발점 삼아, 리듬과 이미지를 살린 나만의 한국어 번역을 완성합니다.",
      },
      {
        icon: "💬",
        title: "소규모 토론",
        body: "같은 시를 다르게 읽은 동료들과 감상을 나누며 해석의 폭을 넓힙니다.",
      },
      {
        icon: "📚",
        title: "결과물 포트폴리오",
        body: "학기 동안 쓴 감상문과 번역을 모아 한 권의 개인 시선집으로 정리합니다.",
      },
    ],
  },

  /* ---------- 커리큘럼 · 수업 일정 ----------
   * 날짜는 startDate(1주차 월요일)부터 자동 계산됩니다.
   * classDays: 0=일 1=월 2=화 3=수 4=목 5=금 6=토
   * 각 주차의 sessions 는 classDays 순서대로(월, 수) 적습니다.
   * assignment 가 없는 주는 그 줄을 지우거나 null 로 두세요.
   * 영상 링크는 유튜브 검색 결과로 연결해 두었습니다. 실제 영상 주소로 바꾸면 됩니다.
   */
  curriculum: {
    heading: "커리큘럼",
    lead: "주차를 누르면 날짜·장소·학습 내용·참고 영상·과제가 펼쳐집니다. (예시 일정 — 실제 강의계획서에 맞게 수정하세요)",
    startDate: "2026-09-01", // 개강일 — 이 날짜 이전의 수업 요일은 자동으로 빠집니다
    classDays: [1, 3],
    time: "10:30 – 11:45",
    location: "문과대학 서관 ○○○호",
    submitUrl: "", // 비워 두면 사이트 안 "수강생 공간"에서 제출합니다. 외부 LMS로 보내려면 주소를 넣으세요. (과제마다 submitUrl 로 따로 지정 가능)
    // 휴강일 (공휴일 등) — 실제 학사일정을 꼭 확인하세요.
    holidays: [
      { date: "2026-09-28", name: "추석 대체공휴일" },
      { date: "2026-10-05", name: "개천절 대체공휴일" },
    ],
    // 마감 표시를 미리 확인하고 싶을 때 "2026-09-16T12:00" 처럼 가상의 '오늘'을 넣으세요. 평소에는 "" 로 두세요.
    previewToday: "",
    calendarHeading: "수업 달력",
    calendarLead: "월·수 수업일이 자동으로 표시됩니다. 날짜를 누르면 그날의 수업 내용을 볼 수 있어요.",
    weeks: [
      {
        title: "오리엔테이션",
        desc: "근현대 일본 시가의 흐름과 AI 도구 소개",
        // 8/31(월)은 개강 전이라 수업이 없으므로 첫 칸은 비워 둡니다.
        sessions: ["", "강의 소개 · 근현대 시가 개관 · AI 번역 도구 가입"],
        videos: [{ title: "일본 근대시의 역사 개관", url: "https://www.youtube.com/results?search_query=日本近代詩+歴史" }],
      },
      {
        title: "신체시의 출발",
        desc: "『신체시초』와 새로운 시 형식의 모색",
        sessions: ["『신체시초』(1882) 읽기", "번역시와 신체시 — AI 번역 첫 비교"],
        videos: [{ title: "新体詩抄 해설", url: "https://www.youtube.com/results?search_query=新体詩抄" }],
      },
      {
        title: "시마자키 도손",
        desc: "『와카나슈』 — 낭만주의 서정시",
        sessions: ["「初恋」 정독", "「小諸なる古城のほとり」 낭독과 감상"],
        videos: [{ title: "島崎藤村「初恋」 낭독", url: "https://www.youtube.com/results?search_query=島崎藤村+初恋+朗読" }],
        assignment: {
          title: "감상문 ① — 도손의 서정시",
          desc: "「初恋」 또는 「小諸なる古城のほとり」 중 한 편을 골라 A4 1쪽 분량의 감상문을 씁니다. AI 번역 한 가지와 자신의 해석을 비교한 단락을 반드시 포함하세요.",
          due: "2026-09-20T23:59",
        },
      },
      {
        title: "요사노 아키코",
        desc: "『흐트러진 머리칼』 — 근대 단카의 정열",
        sessions: ["단카의 형식과 근대 단카 혁신", "『みだれ髪』 선독 — 열 수 읽기"],
        videos: [{ title: "与謝野晶子 『みだれ髪』 해설", url: "https://www.youtube.com/results?search_query=与謝野晶子+みだれ髪" }],
      },
      {
        title: "이시카와 다쿠보쿠",
        desc: "『한 줌의 모래』 — 생활의 단카",
        sessions: ["3행 표기의 의미", "『一握の砂』 선독 — 생활과 고향"],
        videos: [{ title: "石川啄木 『一握の砂』 낭독", url: "https://www.youtube.com/results?search_query=石川啄木+一握の砂+朗読" }],
      },
      {
        title: "기타하라 하쿠슈",
        desc: "『사종문』 — 상징과 이국 정취",
        sessions: ["상징주의와 남만 취미", "AI 번역 비교 실습 — 이국어 어휘의 처리"],
        videos: [{ title: "北原白秋 『邪宗門』 해설", url: "https://www.youtube.com/results?search_query=北原白秋+邪宗門" }],
        assignment: {
          title: "번역 비교 리포트",
          desc: "하쿠슈의 시 한 편을 AI 도구 두 가지로 번역하고, 결과의 차이와 오역 지점을 표로 정리한 뒤 자신의 수정 번역을 제시합니다.",
          due: "2026-10-11T23:59",
        },
      },
      {
        title: "마사오카 시키와 하이쿠",
        desc: "사생(写生)과 근대 하이쿠",
        sessions: ["사생론과 하이쿠 혁신", "17음의 번역 — AI는 계절어를 어떻게 옮기는가"],
        videos: [{ title: "正岡子規 俳句 해설", url: "https://www.youtube.com/results?search_query=正岡子規+俳句+解説" }],
      },
      {
        title: "중간 점검",
        desc: "감상문 발표 및 피드백",
        sessions: ["중간 발표 ①", "중간 발표 ② · 피드백"],
        videos: [],
        assignment: {
          title: "중간 발표 자료 제출",
          desc: "1–7주차 작품 중 한 편을 골라 10분 발표를 준비합니다. 발표 슬라이드를 수업 전날까지 제출하세요.",
          due: "2026-10-18T23:59",
        },
      },
      {
        title: "하기와라 사쿠타로",
        desc: "『달에게 짖다』 — 구어자유시의 확립",
        sessions: ["구어자유시의 리듬", "「竹」 「地面の底の病気の顔」 정독"],
        videos: [{ title: "萩原朔太郎 『月に吠える』 낭독", url: "https://www.youtube.com/results?search_query=萩原朔太郎+月に吠える+朗読" }],
      },
      {
        title: "다카무라 고타로",
        desc: "『지에코쇼』 — 사랑과 상실",
        sessions: ["「あどけない話」 정독", "「レモン哀歌」 낭독과 번역 토론"],
        videos: [{ title: "高村光太郎 「レモン哀歌」 낭독", url: "https://www.youtube.com/results?search_query=高村光太郎+レモン哀歌+朗読" }],
      },
      {
        title: "나카하라 주야",
        desc: "『염소의 노래』 — 노래하는 시",
        sessions: ["「汚れつちまつた悲しみに」 정독", "「サーカス」 — 의성어의 번역"],
        videos: [{ title: "中原中也 「汚れつちまつた悲しみに」 낭독", url: "https://www.youtube.com/results?search_query=中原中也+汚れつちまつた悲しみに+朗読" }],
        assignment: {
          title: "감상문 ② — 다이쇼·쇼와의 시",
          desc: "9–11주차 작품 중 한 편을 골라 A4 1.5쪽 분량의 감상문을 씁니다. 원문의 리듬이 번역에서 어떻게 달라지는지 구체적인 행을 들어 설명하세요.",
          due: "2026-11-15T23:59",
        },
      },
      {
        title: "다치하라 미치조",
        desc: "『원추리에 부쳐』 — 소네트와 『시키』파의 서정",
        sessions: ["소네트 형식과 『四季』파", "「のちのおもひに」 정독과 번역"],
        videos: [{ title: "立原道造 「のちのおもひに」 낭독", url: "https://www.youtube.com/results?search_query=立原道造+のちのおもひに+朗読" }],
      },
      {
        title: "전후의 시",
        desc: "『아레치』 동인과 전후 시의 출발",
        sessions: ["전후 시의 출발 개관", "아유카와 노부오와 『荒地』"],
        videos: [{ title: "荒地派 해설", url: "https://www.youtube.com/results?search_query=荒地派+詩" }],
      },
      {
        title: "번역 워크숍",
        desc: "선택 작품 한국어 번역 발표",
        sessions: ["번역 워크숍 — 조별 발표", "번역 워크숍 — 상호 피드백"],
        videos: [],
        assignment: {
          title: "최종 번역 원고",
          desc: "학기 중 읽은 작품 세 편의 한국어 번역과 번역 노트(AI 결과와 비교·수정 과정)를 제출합니다.",
          due: "2026-12-06T23:59",
        },
      },
      {
        title: "기말 정리",
        desc: "개인 시선집 제출 및 학기 정리",
        sessions: ["개인 시선집 발표", "학기 정리 · 강의 평가"],
        videos: [],
        assignment: {
          title: "개인 시선집",
          desc: "학기 동안 쓴 감상문과 번역을 한 권의 시선집으로 엮어 PDF로 제출합니다. 표지와 서문(1쪽)을 포함하세요.",
          due: "2026-12-13T23:59",
        },
      },
    ],
  },

  /* ---------- 우수 과제 포트폴리오 (편집 모드에서 본문에서 바로 추가·수정) ---------- */
  portfolio: {
    heading: "우수 과제 포트폴리오",
    lead: "수강생들이 직접 옮기고 읽어 낸 작품을 소개합니다. (아래는 예시 — 실제 작품으로 바꿔 주세요)",
    items: [
      {
        title: "「初恋」 — 세 가지 번역의 비교",
        student: "예시 · 수강생 A",
        assignment: "감상문 ①",
        desc: "AI 번역 두 가지와 자신의 번역을 나란히 놓고, '林檎' 이미지가 옮겨지며 달라지는 결을 짚어 본 감상문입니다.",
        image: "",
        link: "",
      },
      {
        title: "하쿠슈 「邪宗門秘曲」 번역 노트",
        student: "예시 · 수강생 B",
        assignment: "번역 비교 리포트",
        desc: "이국 어휘를 음차할지 의역할지, AI 결과와 비교하며 고민한 과정을 표로 정리했습니다.",
        image: "",
        link: "",
      },
    ],
  },

  /* ---------- 실습 AI 도구 ---------- */
  tools: {
    heading: "실습에 쓰는 AI 도구",
    lead: "모든 도구는 무료 요금제로도 수업을 따라올 수 있습니다.",
    items: [
      { name: "Claude", icon: "✳️", use: "시어의 뉘앙스 설명, 번역 대안 제시, 감상문 초안 피드백" },
      { name: "ChatGPT", icon: "💡", use: "번역 결과 비교, 시대 배경과 시인에 관한 질의응답" },
      { name: "DeepL", icon: "🔤", use: "기계 번역 기준선 만들기 — 직역의 한계를 확인" },
      { name: "Papago", icon: "🦜", use: "한국어 번역 결과 비교, 어휘 선택 차이 관찰" },
    ],
  },

  /* ---------- 수강 안내 + 준비물 ---------- */
  enroll: {
    heading: "수강 안내",
    lead: "수강 전 확인해 주세요. (예시 정보 — 실제 학기 정보로 수정하세요)",
    items: [
      { label: "개설 학과", value: "고려대학교 문과대학 일어일문학과" },
      { label: "이수 구분", value: "전공선택 · 3학점" },
      { label: "권장 수준", value: "일본어 중급 이상 (JLPT N2 정도 권장)" },
      { label: "평가 방법", value: "출석 20% · 감상문 30% · 발표 20% · 기말 과제 30%" },
      { label: "교재", value: "자체 제작 강의 자료 배부" },
      { label: "신청 방법", value: "고려대학교 수강신청 시스템에서 신청" },
    ],
    prepHeading: "수강 준비물",
    prep: [
      { icon: "💻", title: "노트북 또는 태블릿", desc: "실습 시간에 AI 도구를 직접 사용합니다." },
      { icon: "🔑", title: "AI 도구 계정", desc: "위 도구 중 2개 이상, 첫 수업 전에 가입해 두세요." },
      { icon: "📖", title: "일본어 사전", desc: "종이 사전이나 사전 앱 모두 좋습니다. (고어 사전 있으면 더 좋음)" },
      { icon: "📝", title: "감상 노트", desc: "매주 떠오른 감상과 번역 메모를 기록합니다." },
    ],
  },

  /* ---------- 수강생 참여: 투표 · 수강 신청서 · 수강생 공간 ----------
   * 지금은 서버 없이 "이 브라우저에만" 저장되는 체험 모드입니다.
   * 여러 사람의 응답을 실제로 모으려면 외부 저장소 연결이 필요합니다. (apply.endpoint 참고)
   */
  participate: {
    heading: "수강생 참여",
    lead: "투표하고, 신청하고, 출석하고, 과제를 내는 곳입니다.",
    demoNote: "체험 모드 — 입력한 내용은 지금 사용 중인 브라우저에만 저장됩니다.",

    poll: {
      heading: "가장 먼저 배우고 싶은 주제는?",
      lead: "한 사람당 한 표, 언제든 다시 고를 수 있어요.",
      options: [
        { id: "tanka", label: "근대 단카 — 요사노 아키코 · 이시카와 다쿠보쿠" },
        { id: "symbol", label: "상징시 — 기타하라 하쿠슈" },
        { id: "free", label: "구어자유시 — 하기와라 사쿠타로" },
        { id: "tachihara", label: "다치하라 미치조의 소네트" },
        { id: "haiku", label: "근대 하이쿠 — 마사오카 시키" },
        { id: "ai", label: "AI 번역 비교 실습" },
      ],
    },

    apply: {
      heading: "수강 신청서",
      lead: "* 표시는 필수 항목입니다.",
      // 실제로 신청서를 받으려면 Formspree·Google Apps Script 등의 접수 주소를 넣으세요. 비워 두면 이 브라우저에만 저장됩니다.
      endpoint: "",
      fields: [
        { name: "name", label: "이름", type: "text", required: true, placeholder: "홍길동" },
        { name: "studentId", label: "학번", type: "text", required: true, placeholder: "2024123456",
          pattern: "^\\d{10}$", patternMessage: "학번은 숫자 10자리로 입력해 주세요." },
        { name: "major", label: "소속 학과", type: "text", required: true, placeholder: "일어일문학과" },
        { name: "year", label: "학년", type: "select", required: true, options: ["1학년", "2학년", "3학년", "4학년", "기타"] },
        { name: "email", label: "이메일", type: "email", required: true, placeholder: "you@korea.ac.kr" },
        { name: "phone", label: "연락처", type: "tel", required: false, placeholder: "010-0000-0000",
          pattern: "^01[0-9]-?\\d{3,4}-?\\d{4}$", patternMessage: "010-0000-0000 형식으로 입력해 주세요." },
        { name: "level", label: "일본어 수준", type: "radio", required: true,
          options: ["초급", "중급 (N3)", "중상급 (N2)", "고급 (N1)"] },
        { name: "motive", label: "수강 동기", type: "textarea", required: true, minLength: 20,
          placeholder: "이 수업에서 기대하는 점을 20자 이상 적어 주세요." },
        { name: "agree", label: "개인정보 수집·이용에 동의합니다. (수강 관리 목적, 학기 종료 후 파기)", type: "checkbox", required: true },
      ],
      submitText: "신청서 제출",
      successTitle: "신청이 접수되었습니다 🌸",
      successBody: "확인 메일은 순차적으로 보내 드립니다.",
    },

    portal: {
      heading: "수강생 공간",
      lead: "학번과 이름으로 로그인해 출석을 체크하고 과제를 제출하세요.",
      // 수강생 명단 — 비워 두면 누구나 로그인할 수 있습니다. 예: [{ id: "2024123456", name: "홍길동" }]
      roster: [],
      maxFileMB: 10,
      accept: [".pdf", ".docx", ".hwp", ".hwpx"],
    },
  },

  /* ---------- 공지 팝업 (기본: 가장 최신 공지가 폭죽과 함께 팝업으로 뜹니다 · 편집 모드에서도 설정 가능) ---------- */
  popup: {
    enabled: true, // 공지 팝업 사용
    show: "latest", // "latest" = 가장 최신 공지 1개 자동 / "selected" = popup: true 로 고른 공지들
    confetti: true, // 팝업이 뜰 때 폭죽
    delaySeconds: 1.5, // 접속 후 몇 초 뒤에 뜰지
    badge: "공지사항", // 팝업 위쪽 배지 문구
    hideTodayText: "오늘 하루 보지 않기",
  },

  /* ---------- 첫 방문 환영 효과 ---------- */
  welcome: {
    confetti: true,
    message: "처음 오셨군요, 환영합니다! 🌸",
    // 컴퓨터에서 "애니메이션 효과 끄기"를 켠 사람에게는 폭죽을 보여주지 않습니다. false 로 바꾸면 항상 보여줍니다.
    respectReducedMotion: false,
  },

  /* ---------- FAQ ---------- */
  faq: {
    heading: "자주 묻는 질문",
    items: [
      {
        q: "일본어 고전 문법을 몰라도 들을 수 있나요?",
        a: "네. 작품에 나오는 문어 표현은 수업 중에 그때그때 설명합니다. 다만 현대 일본어 독해가 가능한 수준이면 훨씬 수월합니다.",
      },
      {
        q: "AI 도구를 써 본 적이 없어도 괜찮나요?",
        a: "괜찮습니다. 첫 주에 가입부터 기본 사용법까지 함께 실습합니다.",
      },
      {
        q: "유료 AI 요금제가 필요한가요?",
        a: "아니요. 모든 실습은 무료 요금제로 진행할 수 있도록 구성했습니다.",
      },
      {
        q: "과제에 AI를 써도 되나요?",
        a: "AI 결과를 그대로 제출하는 것은 허용하지 않습니다. 대신 AI 번역을 어떻게 비교·수정했는지 과정을 기록해 함께 제출합니다.",
      },
      {
        q: "타 학과 학생도 수강할 수 있나요?",
        a: "수강신청 규정에 따라 가능합니다. 일본어 능력만 갖추었다면 전공과 관계없이 환영합니다.",
      },
    ],
  },

  /* ---------- 교수자 (페이지 맨 아래 푸터에 표시) ---------- */
  instructor: {
    heading: "교수자 소개",
    name: "교수자 이름",
    title: "고려대학교 글로벌일본연구원",
    photo: "", // 사진 파일 경로 (예: "images/professor.jpg"). 비워 두면 이니셜 아이콘이 표시됩니다.
    bio: "교수자 소개 문구를 여기에 입력하세요. 전공 분야, 연구 관심사, 주요 저술, 수업에 대한 한마디 등을 적으면 좋습니다.",
    contacts: [
      { icon: "✉️", label: "이메일", value: "professor@korea.ac.kr", href: "mailto:professor@korea.ac.kr" },
      { icon: "🏛️", label: "소속", value: "고려대학교 글로벌일본연구원" },
      { icon: "🕰️", label: "면담", value: "수업 후 또는 이메일 예약" },
    ],
  },

  /* ---------- 공지사항 (관리자 화면에서 올리고 지울 수 있습니다) ---------- */
  notices: [
    {
      date: "2026-08-25",
      title: "첫 수업 전에 AI 도구 계정을 만들어 오세요",
      body: "9월 2일(수) 첫 수업에서 바로 실습합니다. '실습에 쓰는 AI 도구' 중 두 가지 이상 미리 가입해 주세요.",
      pinned: true, // 중요 공지(맨 위 고정)
      popup: true, // 팝업으로 띄우기 (popup.show 가 "selected" 일 때만 사용)
      // buttonText: "자세히 보기", buttonTarget: "#tools", // 팝업 버튼 (선택)
    },
  ],

  /* ---------- 관리자 ----------
   * 비밀번호는 원문 대신 '해시값'만 저장합니다. 비밀번호 변경은 관리자 화면 > 비밀번호에서 하세요.
   * (초기 비밀번호는 README.md 를 확인하세요)
   */
  admin: {
    salt: "a9da564890294998",
    passwordHash: "bcf1dec95d67230b870312435554a6de2aeadc7f77d3467fba8f794c29fbafa7",
  },

  /* ---------- 맨 아래 저작권 문구 ---------- */
  footer: {
    text: "© 2026 고려대학교 일어일문학과 · 근현대명시가선독",
  },
};
