import { useState, useMemo, useEffect, useCallback, useRef } from "react";

// ============================================================
// DATA
// ============================================================
const PROGRAM = [
  { id: "p0_1", time: "13:00", end: "14:00", title: "행사장 세팅", part: "준비", type: "setup" },
  { id: "p0_2", time: "14:00", end: "14:30", title: "시상식 리허설", part: "준비", type: "rehearsal" },
  { id: "p0_3", time: "14:00", end: "15:00", title: "참여자 접수 / 포토존 운영", part: "접수", type: "reception" },
  { id: "p1_1", time: "15:00", end: "15:02", title: "1부 개회 및 안내", part: "1부", type: "opening" },
  { id: "p1_2", time: "15:02", end: "15:04", title: "사회복지사 선서", part: "1부", type: "ceremony" },
  { id: "p1_3", time: "15:04", end: "15:07", title: "창립 40주년 기념 영상", part: "1부", type: "video" },
  { id: "p1_4", time: "15:07", end: "15:22", title: "특별강연 1", speaker: "김아래미 교수", part: "1부", type: "lecture" },
  { id: "p1_5", time: "15:22", end: "15:37", title: "특별강연 2", speaker: "윤석원 대표", part: "1부", type: "lecture" },
  { id: "p1_6", time: "15:37", end: "15:52", title: "특별강연 3", speaker: "황흥기 대표", part: "1부", type: "lecture" },
  { id: "p1_7", time: "15:52", end: "15:59", title: "비전발표", speaker: "강현덕 수석부회장", part: "1부", type: "summary" },
  { id: "p1_8", time: "15:59", end: "16:00", title: "1부 클로징 및 안내", part: "1부", type: "closing" },
  { id: "p2_1", time: "16:00", end: "16:10", title: "내빈접수 및 응대", part: "2부", type: "reception" },
  { id: "p2_2", time: "16:10", end: "16:11", title: "2부 개회 및 안내", part: "2부", type: "opening" },
  { id: "p2_3", time: "16:11", end: "16:14", title: "내빈 소개", part: "2부", type: "intro" },
  { id: "p2_4", time: "16:14", end: "16:19", title: "기념사", speaker: "곽경인 회장", part: "2부", type: "speech" },
  { id: "p2_5", time: "16:19", end: "16:39", title: "내빈 축사", speaker: "주요내빈", part: "2부", type: "speech" },
  { id: "p2_6", time: "16:39", end: "16:59", title: "시상 (특별상, 미래인재상 외)", part: "2부", type: "award" },
  { id: "p2_7", time: "16:59", end: "17:00", title: "폐회 및 사진촬영", part: "2부", type: "closing" },
];

const VIP_GUESTS = [
  { id: 1, name: "곽경인", org: "서울시사회복지사협회", role: "회장", table: 3, seat: 1, checked: false },
  { id: 2, name: "오세훈", org: "서울특별시", role: "서울시장", table: 3, seat: 2, checked: false },
  { id: 3, name: "내빈", org: "-", role: "회장단 후보자2", table: 3, seat: 3, checked: false },
  { id: 4, name: "내빈", org: "-", role: "회장단 후보자3", table: 3, seat: 4, checked: false },
  { id: 5, name: "내빈", org: "-", role: "회장단 후보자1", table: 3, seat: 5, checked: false },
  { id: 6, name: "남인순", org: "국회의원", role: "의원", table: 3, seat: 6, checked: false },
  { id: 7, name: "김연은", org: "연대회의", role: "상임대표", table: 3, seat: 7, checked: false },
  { id: 8, name: "조석영", org: "한국장애인복지관협회", role: "회장", table: 3, seat: 8, checked: false },
  { id: 9, name: "내빈", org: "-", role: "-", table: 3, seat: 9, checked: false },
  { id: 10, name: "내빈", org: "-", role: "-", table: 3, seat: 10, checked: false },
  { id: 11, name: "박익현", org: "서울시50플러스센터협의회", role: "회장", table: 4, seat: 9, checked: false },
  { id: 12, name: "백윤미", org: "서울시정신요양시설협회", role: "회장", table: 4, seat: 10, checked: false },
  { id: 13, name: "신영숙", org: "여성폭력피해지원시설협의회", role: "회장", table: 5, seat: 3, checked: false },
  { id: 14, name: "이소영", org: "서울시아동복지협회", role: "회장", table: 5, seat: 4, checked: false },
  { id: 15, name: "이은주", org: "서울시노인종합복지관협회", role: "회장", table: 5, seat: 5, checked: false },
  { id: 16, name: "임형균", org: "서울시장애인복지관협회", role: "회장", table: 5, seat: 6, checked: false },
  { id: 17, name: "정보영", org: "서울정신재활시설협회", role: "회장", table: 5, seat: 7, checked: false },
  { id: 18, name: "한철수", org: "서울시노인복지협회", role: "회장", table: 5, seat: 8, checked: false },
  { id: 19, name: "허곤", org: "서울시장애인복지시설협회", role: "회장", table: 5, seat: 9, checked: false },
  { id: 20, name: "정진모", org: "-", role: "전)제8대 회장", table: 5, seat: 10, checked: false },
  { id: 21, name: "임성규", org: "-", role: "전)제10대 회장", table: 2, seat: 1, checked: false },
  { id: 22, name: "장재구", org: "중앙사회복지관", role: "전)제11대 회장", table: 2, seat: 2, checked: false },
  { id: 23, name: "심정원", org: "성산종합사회복지관", role: "현)제15대 회장", table: 2, seat: 3, checked: false },
  { id: 24, name: "강현덕", org: "영등포구가족센터", role: "수석부회장", table: 2, seat: 4, checked: false },
  { id: 25, name: "김광제", org: "신목종합사회복지관", role: "권익옹호위원회 위원장", table: 2, seat: 5, checked: false },
  { id: 26, name: "김아래미", org: "서울여자대학교", role: "정책위원회 위원장", table: 2, seat: 6, checked: false },
  { id: 27, name: "변소현", org: "서부장애인종합복지관", role: "교육위원회 위원장", table: 2, seat: 7, checked: false },
  { id: 28, name: "성미선", org: "강동노인종합복지관", role: "기획위원회 위원장", table: 4, seat: 1, checked: false },
  { id: 29, name: "이천규", org: "-", role: "회원소통위원회 위원장", table: 4, seat: 2, checked: false },
  { id: 30, name: "임명연", org: "마포영유아통합지원센터", role: "복지국가시민위원회 위원장", table: 4, seat: 3, checked: false },
  { id: 31, name: "홍준호", org: "공생의 심장", role: "미래세대위원회 위원장", table: 4, seat: 4, checked: false },
  { id: 32, name: "김일용", org: "즐거운사회복지궁리소", role: "선거관리위원회 위원장", table: 4, seat: 5, checked: false },
  { id: 33, name: "서동명", org: "동덕여자대학교", role: "교수", table: 5, seat: 1, checked: false },
  { id: 34, name: "서정화", org: "열린여성센터", role: "소장", table: 5, seat: 2, checked: false },
  { id: 35, name: "김내빈", org: "초청내빈", role: "-", table: 2, seat: 8, checked: false },
  { id: 36, name: "이내빈", org: "초청내빈", role: "-", table: 2, seat: 9, checked: false },
  { id: 37, name: "박내빈", org: "초청내빈", role: "-", table: 2, seat: 10, checked: false },
  { id: 38, name: "최내빈", org: "초청내빈", role: "-", table: 4, seat: 6, checked: false },
  { id: 39, name: "정내빈", org: "초청내빈", role: "-", table: 4, seat: 7, checked: false },
  { id: 40, name: "강내빈", org: "초청내빈", role: "-", table: 4, seat: 8, checked: false },
];

const TABLE_CONFIG = {
  2: { seats: 10, label: "내빈석", color: "#8B5CF6" },
  3: { seats: 10, label: "주요 내빈석", color: "#C8A44E" },
  4: { seats: 10, label: "주요 내빈석", color: "#10B981" },
  5: { seats: 10, label: "내빈석", color: "#F59E0B" },
};

const VIP_TABLE_IDS = [2, 3, 4, 5];
const ALL_TABLE_IDS = Array.from({ length: 32 }, (_, i) => i + 1);

const ATTENDEE_TABLES = ALL_TABLE_IDS.filter(id => !VIP_TABLE_IDS.includes(id)).map(id => ({
  id,
  label: `테이블 ${id}`,
}));

const MAP_ROWS = [
  [1, 2, 3, 4, 5, 6],
  [7, 8, 9, 10, 11],
  [12, 13, 14, 15, 16, 17],
  [18, 19, 20, 21, 22],
  [23, 24, 25, 26, 27, 28],
  [29, 30, 31, 32],
];

const ZONES = ["A구역", "B구역", "C구역", "D구역", "E구역"];

const generateAttendees = () => {
  const lastNames = ["김","이","박","최","정","강","조","윤","장","임","한","오","서","신","권","황","안","송","류","홍"];
  const firstNames = ["민지","서연","지우","하은","수빈","지현","예진","유진","서영","민서","도윤","하준","시우","주원","지호","예준","건우","현우","도현","준서"];
  const orgs = ["종합사회복지관","노인복지관","장애인복지관","지역아동센터","건강가정지원센터","자활센터","정신건강복지센터","다문화가족지원센터","청소년상담복지센터","사회복지협의회"];
  const districts = ["강남","강동","강북","강서","관악","광진","구로","금천","노원","도봉","동대문","동작","마포","서대문","서초","성동","성북","송파","양천","영등포","용산","은평","종로","중구","중랑"];
  const arr = [];
  for (let i = 1; i <= 250; i++) {
    const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
    const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
    const dist = districts[Math.floor(Math.random() * districts.length)];
    const org = orgs[Math.floor(Math.random() * orgs.length)];
    const tableIdx = Math.floor((i - 1) / 10);
    const tableId = ATTENDEE_TABLES[tableIdx] ? ATTENDEE_TABLES[tableIdx].id : ATTENDEE_TABLES[ATTENDEE_TABLES.length - 1].id;
    const seatId = ((i - 1) % 10) + 1;
    arr.push({
      id: i,
      name: ln + fn,
      org: `${dist}구 ${org}`,
      zone: ZONES[Math.floor(Math.random() * ZONES.length)],
      table: tableId,
      seat: seatId,
      checked: false,
    });
  }
  return arr;
};

const AWARD_CATEGORIES = [
  { id: "a1", name: "미래인재상", icon: "\u{1F331}", recipients: [
    { name: "권선영", org: "방배노인종합복지관" },
    { name: "김상현", org: "충현복지관" },
    { name: "김하나", org: "번오마을종합사회복지관" },
    { name: "박수진", org: "시립꿈나무마을파란꿈터" },
    { name: "신주환", org: "서울종로지역자활센터" },
    { name: "이민규", org: "한국사회복지사협회" },
    { name: "이창영", org: "구립오금동지역아동센터" },
    { name: "조현정", org: "영보자애원" },
    { name: "조혜진", org: "시립도봉노인종합복지관" },
    { name: "한대희", org: "삼전종합사회복지관" },
  ]},
  { id: "a2", name: "미래리더상", icon: "\u{1F31F}", recipients: [
    { name: "강민정", org: "창동종합사회복지관" },
    { name: "권민지", org: "방화11종합사회복지관" },
    { name: "권소현", org: "마포장애인종합복지관" },
    { name: "김나라", org: "강남드림빌" },
    { name: "김민경", org: "정립회관" },
    { name: "김정민", org: "서울강서등촌지역자활센터" },
    { name: "송지수", org: "솔로몬지역아동센터" },
    { name: "양승현", org: "광진구9호점우리동네키움센터" },
    { name: "유민경", org: "금천노인종합복지관" },
    { name: "이상표", org: "시립고덕양로원" },
    { name: "이선영", org: "한울지역정신건강센터" },
    { name: "임명연", org: "마포아동복지관" },
    { name: "천진석", org: "여의도복지관" },
    { name: "한승훈", org: "마포노인데이케어센터" },
  ]},
  { id: "a3", name: "비전리더상", icon: "\u{1F4A1}", recipients: [
    { name: "김진범", org: "동대문시각특화장애인복지관" },
    { name: "김태경", org: "서대문시니어클럽" },
    { name: "박경호", org: "시립미래형장애인직업재활시설 굿윌스토어" },
    { name: "박선영", org: "SRC보듬터" },
    { name: "신성희", org: "위더스틴즈지역아동센터" },
    { name: "신영숙", org: "행복이주여성쉼터" },
    { name: "원윤아", org: "신림종합사회복지관" },
    { name: "이철우", org: "등촌7종합사회복지관" },
    { name: "최인경", org: "하누리주간보호센터" },
    { name: "한미영", org: "동대문구가족센터" },
  ]},
  { id: "a4", name: "특별상", icon: "\u{1F3C5}", recipients: [
    { name: "서울사회복지공동모금회", org: "" },
    { name: "세상을 바꾸는 사회복지사", org: "" },
    { name: "남인순", org: "국회의원" },
    { name: "최성숙", org: "신림종합사회복지관 관장" },
    { name: "배영미", org: "서울시립대 외래교수" },
    { name: "정승아", org: "서울시사회복지사협회 부장" },
  ]},
];

const INITIAL_SUPPLIES = [
  { id: 1, name: "명찰", qty: 90, assignee: "접수", done: false, category: "제작" },
  { id: 2, name: "접수명단", qty: 1, assignee: "접수", done: false, category: "제작" },
  { id: 3, name: "좌석배치표", qty: 5, assignee: "접수", done: false, category: "제작" },
  { id: 4, name: "테이블번호", qty: 30, assignee: "접수", done: false, category: "제작" },
  { id: 5, name: "내빈방명록", qty: 5, assignee: "접수", done: false, category: "제작" },
  { id: 6, name: "수상자 PPT", qty: 40, assignee: "시상식", done: false, category: "제작" },
  { id: 7, name: "사회비수령증(영수증)", qty: 1, assignee: "시상식", done: false, category: "제작" },
  { id: 8, name: "보조인력수령증", qty: 5, assignee: "시상식", done: false, category: "제작" },
  { id: 9, name: "사회자카드(1부,2부)", qty: 2, assignee: "시상식", done: false, category: "제작" },
  { id: 10, name: "현수막, 배너 (디자인)", qty: 5, assignee: "디자인", done: false, category: "제작" },
  { id: 11, name: "식전영상", qty: 1, assignee: "영상", done: false, category: "제작" },
  { id: 12, name: "현수막, 포토존 출력", qty: 5, assignee: "EM실천", done: false, category: "행사장" },
  { id: 13, name: "포토존 설치", qty: 1, assignee: "이벤트렌탈", done: false, category: "행사장" },
  { id: 14, name: "메인현수막 설치", qty: 1, assignee: "", done: false, category: "행사장" },
  { id: 15, name: "안내지 출력 (15x21cm)", qty: 300, assignee: "EM실천", done: false, category: "행사장" },
  { id: 16, name: "단상 폼보드 출력", qty: 2, assignee: "EM실천", done: false, category: "행사장" },
  { id: 17, name: "상품권 (10만원권)", qty: 36, assignee: "신세계백화점", done: false, category: "구입" },
  { id: 18, name: "꽃다발", qty: 40, assignee: "에뿌즈플라워", done: false, category: "구입" },
  { id: 19, name: "상패", qty: 6, assignee: "번동보호작업장", done: false, category: "구입" },
];

// ============================================================
// THEME
// ============================================================
const T = {
  bg: "#0a1616",
  bgCard: "#111f1f",
  bgCardHover: "#162828",
  bgInput: "#0d1a1a",
  accent: "#91c9c0",
  accentLight: "#b5ddd6",
  accentDark: "#5a9e93",
  accentBg: "rgba(145,201,192,0.08)",
  accentBorder: "rgba(145,201,192,0.2)",
  text: "#e8eded",
  textSec: "#8a9e9b",
  textMuted: "#506664",
  border: "rgba(145,201,192,0.12)",
  danger: "#E24B4A",
  dangerBg: "rgba(226,75,74,0.12)",
  success: "#3CB371",
  successBg: "rgba(60,179,113,0.12)",
  warn: "#e8a848",
  warnBg: "rgba(232,168,72,0.12)",
  info: "#60A5FA",
  infoBg: "rgba(96,165,250,0.12)",
  coral: "#d88a72",
  coralBorder: "rgba(216,138,114,0.3)",
  radius: "12px",
  radiusSm: "8px",
  font: "'Pretendard Variable', 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

// ============================================================
// STYLES HELPERS
// ============================================================
const cardStyle = {
  background: T.bgCard, borderRadius: T.radius, border: `1px solid ${T.border}`,
  padding: "16px", marginBottom: "10px",
};

const accentBtnStyle = {
  background: `linear-gradient(135deg, ${T.accent} 0%, ${T.accentDark} 100%)`,
  color: "#0a1616", border: "none", borderRadius: T.radiusSm,
  padding: "10px 18px", fontWeight: 700, fontSize: "14px", cursor: "pointer",
  fontFamily: T.font,
};

const ghostBtnStyle = {
  background: "transparent", color: T.accent, border: `1px solid ${T.accentBorder}`,
  borderRadius: T.radiusSm, padding: "8px 14px", fontSize: "13px",
  cursor: "pointer", fontWeight: 600, fontFamily: T.font,
};

const inputStyle = {
  background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: T.radiusSm,
  padding: "10px 14px", color: T.text, fontSize: "14px", width: "100%",
  outline: "none", fontFamily: T.font,
};

const badgeStyle = (bg, color) => ({
  display: "inline-flex", alignItems: "center", gap: "4px",
  padding: "3px 10px", borderRadius: "999px", fontSize: "12px",
  fontWeight: 600, background: bg, color: color,
});

const pillNav = (active) => ({
  padding: "7px 14px", borderRadius: "999px", border: "none",
  background: active ? T.accent : "transparent",
  color: active ? "#0a1616" : T.textSec,
  fontSize: "13px", fontWeight: active ? 700 : 500, cursor: "pointer",
  whiteSpace: "nowrap", fontFamily: T.font, transition: "all 0.2s",
});

// ============================================================
// MINI COMPONENTS
// ============================================================
function StatCard({ icon, label, value, sub, accent }) {
  return (
    <div style={{
      ...cardStyle, textAlign: "center",
      borderTop: `2px solid ${accent || T.accentBorder}`, padding: "14px 10px",
      marginBottom: 0,
    }}>
      <div style={{ fontSize: "20px", marginBottom: "4px" }}>{icon}</div>
      <div style={{ fontSize: "24px", fontWeight: 800, color: accent || T.accent, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: "13px", color: T.textSec, marginTop: "6px" }}>{label}</div>
      {sub && <div style={{ fontSize: "12px", color: T.textMuted, marginTop: "2px" }}>{sub}</div>}
    </div>
  );
}

function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div style={{
      position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)",
      background: T.accent, color: "#0a1616", padding: "10px 20px", borderRadius: "8px",
      fontSize: "13px", fontWeight: 700, zIndex: 9999, boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
      animation: "toastIn 0.3s ease",
    }}>{msg}</div>
  );
}

function SearchBar({ value, onChange, placeholder }) {
  return (
    <div style={{ position: "relative", marginBottom: "10px" }}>
      <input
        style={{ ...inputStyle, paddingLeft: "32px" }}
        value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "검색..."}
      />
      <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "15px", opacity: 0.4 }}>
        &#x1F50D;
      </span>
    </div>
  );
}

function FilterPills({ options, value, onChange }) {
  return (
    <div style={{ display: "flex", gap: "4px", overflowX: "auto", paddingBottom: "8px", marginBottom: "8px" }}>
      {options.map((o) => (
        <button key={o.value} onClick={() => onChange(o.value)} style={pillNav(value === o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ProgressBar({ value, max, color }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "3px", overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color || T.gold, borderRadius: "3px", transition: "width 0.3s" }} />
    </div>
  );
}

// ============================================================
// TAB: DASHBOARD
// ============================================================
function DashboardTab({ vipGuests, attendees, notices, emergencies, program }) {
  const vipChecked = vipGuests.filter((g) => g.checked).length;
  const attChecked = attendees.filter((a) => a.checked).length;
  const total = vipGuests.length + attendees.length;
  const totalChecked = vipChecked + attChecked;

  const now = new Date();
  const eventDate = new Date("2026-04-22T15:00:00");
  const isEventDay = now.toDateString() === eventDate.toDateString();
  const currentProg = isEventDay ? program.find((p) => {
    const [h, m] = p.time.split(":").map(Number);
    const [eh, em] = p.end.split(":").map(Number);
    const start = new Date(now); start.setHours(h, m, 0);
    const end = new Date(now); end.setHours(eh, em, 0);
    return now >= start && now < end;
  }) : null;

  const recentNotice = notices.length > 0 ? notices[notices.length - 1] : null;
  const activeEmergencies = emergencies.filter((e) => e.status !== "done").length;

  return (
    <div>
      <div className="stat-grid">
        <StatCard icon={"\u{1F465}"} label="전체" value={total} sub={`참석 ${totalChecked}`} accent={T.accent} />
        <StatCard icon={"\u{2B50}"} label="내빈" value={`${vipChecked}/${vipGuests.length}`} accent={T.accent} />
        <StatCard icon={"\u{2705}"} label="참석자" value={`${attChecked}/${attendees.length}`} accent={T.success} />
        <StatCard icon={"\u{1F6A8}"} label="긴급" value={activeEmergencies} accent={activeEmergencies > 0 ? T.danger : T.textMuted} />
      </div>

      <ProgressBar value={totalChecked} max={total} color={T.accent} />
      <div style={{ fontSize: "13px", color: T.textSec, textAlign: "right", marginTop: "4px", marginBottom: "14px" }}>
        전체 참석률 {total > 0 ? Math.round((totalChecked / total) * 100) : 0}%
      </div>

      {/* Current / Next Program */}
      <div style={{ ...cardStyle, borderLeft: `3px solid ${T.accent}` }}>
        <div style={{ fontSize: "13px", color: T.accentDark, fontWeight: 600, marginBottom: "4px" }}>
          {currentProg ? "현재 진행 중" : "다음 프로그램"}
        </div>
        {(() => {
          const prog = currentProg || program[0];
          return (
            <>
              <div style={{ fontWeight: 700, color: T.text, fontSize: "16px" }}>{prog.title}</div>
              <div style={{ fontSize: "14px", color: T.textSec, marginTop: "4px" }}>
                {prog.time} ~ {prog.end} {prog.speaker && `| ${prog.speaker}`}
              </div>
            </>
          );
        })()}
      </div>

      {/* Program Timeline Mini */}
      <div style={cardStyle}>
        <div style={{ fontSize: "14px", fontWeight: 700, color: T.accent, marginBottom: "10px" }}>프로그램 타임라인</div>
        {program.map((p, i) => {
          const isCurrent = currentProg && currentProg.id === p.id;
          const isPast = false;
          return (
            <div key={p.id} style={{
              display: "flex", gap: "8px", alignItems: "flex-start", marginBottom: "6px",
              opacity: isPast ? 0.4 : 1,
            }}>
              <div style={{
                width: "8px", height: "8px", borderRadius: "50%", marginTop: "4px", flexShrink: 0,
                background: isCurrent ? T.accent : p.part === "2부" ? T.warn : T.textMuted,
                boxShadow: isCurrent ? `0 0 8px ${T.accent}` : "none",
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "14px", fontWeight: 600, color: isCurrent ? T.accent : T.text }}>
                  {p.time} {p.title}
                </div>
                {p.speaker && <div style={{ fontSize: "13px", color: T.textSec }}>{p.speaker}</div>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Notice */}
      {recentNotice && (
        <div style={{ ...cardStyle, borderLeft: `3px solid ${T.info}` }}>
          <div style={{ fontSize: "13px", color: T.info, fontWeight: 600, marginBottom: "4px" }}>
            최근 공지
          </div>
          <div style={{ fontSize: "14px", color: T.text, lineHeight: 1.5 }}>{recentNotice.text}</div>
          <div style={{ fontSize: "12px", color: T.textMuted, marginTop: "4px" }}>{recentNotice.time}</div>
        </div>
      )}

      {/* Zone Distribution */}
      <div style={cardStyle}>
        <div style={{ fontSize: "14px", fontWeight: 700, color: T.accent, marginBottom: "10px" }}>구역별 참석 현황</div>
        {ZONES.map((z) => {
          const zoneAtt = attendees.filter((a) => a.zone === z);
          const zoneChecked = zoneAtt.filter((a) => a.checked).length;
          return (
            <div key={z} style={{ marginBottom: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "3px" }}>
                <span style={{ color: T.textSec }}>{z}</span>
                <span style={{ color: T.text, fontWeight: 600 }}>{zoneChecked}/{zoneAtt.length}</span>
              </div>
              <ProgressBar value={zoneChecked} max={zoneAtt.length} color={T.accent} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// TAB: VIP GUESTS
// ============================================================
function VipTab({ guests, setGuests }) {
  const [search, setSearch] = useState("");
  const [filterTable, setFilterTable] = useState(0);
  const [selectedTable, setSelectedTable] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const toggle = (id) => {
    setGuests((prev) => prev.map((g) => g.id === id ? { ...g, checked: !g.checked } : g));
  };

  const updateSeat = (id, field, value) => {
    setGuests((prev) => prev.map((g) => g.id === id ? { ...g, [field]: Number(value) } : g));
  };

  const filtered = useMemo(() => {
    return guests.filter((g) => {
      if (search && !g.name.includes(search) && !g.org.includes(search) && !g.role.includes(search)) return false;
      if (filterTable > 0 && g.table !== filterTable) return false;
      return true;
    });
  }, [guests, search, filterTable]);

  const stats = useMemo(() => {
    const total = guests.length;
    const checked = guests.filter((g) => g.checked).length;
    const byTable = {};
    for (let t of [2, 3, 4, 5]) {
      const tg = guests.filter((g) => g.table === t);
      byTable[t] = { total: tg.length, checked: tg.filter((g) => g.checked).length };
    }
    return { total, checked, byTable };
  }, [guests]);

  return (
    <div>
      <div className="stat-grid">
        <StatCard icon={"\u{2B50}"} label="내빈" value={stats.total} accent={T.accent} />
        <StatCard icon={"\u{2705}"} label="참석" value={stats.checked} accent={T.success} />
        <StatCard icon={"\u{23F3}"} label="대기" value={stats.total - stats.checked} accent={T.textMuted} />
      </div>

      {/* Seat Map */}
      <div style={{ ...cardStyle, padding: "18px", overflow: "hidden" }}>
        <div style={{ fontSize: "14px", fontWeight: 700, color: T.accent, marginBottom: "12px", textAlign: "center" }}>
          좌석 배치도
        </div>
        <div style={{
          textAlign: "center", padding: "6px 0", marginBottom: "12px",
          background: "rgba(145,201,192,0.1)", borderRadius: "6px",
          fontSize: "12px", fontWeight: 700, color: T.accent, letterSpacing: "3px",
        }}>STAGE</div>

        <div style={{ display: "flex", justifyContent: "center", gap: "4px", flexWrap: "wrap", marginBottom: "8px" }}>
          {[2, 3, 4, 5].map((t) => {
            const cfg = TABLE_CONFIG[t];
            const tb = stats.byTable[t] || { total: 0, checked: 0 };
            const isVIP = t === 3 || t === 4;
            const isSelected = selectedTable === t;
            return (
              <button key={t} onClick={() => setSelectedTable(isSelected ? null : t)} style={{
                width: isVIP ? "72px" : "60px", height: isVIP ? "72px" : "60px",
                borderRadius: "50%", border: `2px solid ${isVIP ? T.accent : isSelected ? T.accent : T.border}`,
                background: isSelected ? "rgba(145,201,192,0.1)" : "rgba(255,255,255,0.03)",
                cursor: "pointer", display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", fontFamily: T.font,
                boxShadow: isVIP ? `0 0 12px rgba(145,201,192,0.15)` : "none",
                transition: "all 0.2s",
              }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: isVIP ? T.accent : T.textSec }}>
                  {cfg.label}
                </span>
                <span style={{ fontSize: "15px", fontWeight: 800, color: T.text }}>
                  {tb.checked}/{tb.total}
                </span>
              </button>
            );
          })}
        </div>

        {selectedTable && (
          <div style={{
            background: "rgba(255,255,255,0.03)", borderRadius: T.radiusSm,
            padding: "10px", marginTop: "8px",
          }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: T.accent, marginBottom: "8px" }}>
              {TABLE_CONFIG[selectedTable].label} 좌석 현황
            </div>
            {guests.filter((g) => g.table === selectedTable).map((g) => (
              <div key={g.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "4px 0", borderBottom: `1px solid ${T.border}`,
              }}>
                <span style={{ fontSize: "13px", color: T.text }}>
                  {g.seat}번 · {g.name} <span style={{ color: T.textSec }}>{g.role}</span>
                </span>
                <span style={badgeStyle(
                  g.checked ? T.successBg : "rgba(255,255,255,0.05)",
                  g.checked ? T.success : T.textMuted,
                )}>{g.checked ? "참석" : "대기"}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="내빈 검색 (이름, 소속, 직함)" />
      <FilterPills
        options={[{ value: 0, label: "전체" }, ...Object.entries(TABLE_CONFIG).map(([k, v]) => ({ value: Number(k), label: v.label }))]}
        value={filterTable} onChange={setFilterTable}
      />

      <div className="card-grid-2">
        {filtered.map((g) => (
          <div key={g.id} style={{
            ...cardStyle,
            borderLeft: `3px solid ${(g.table === 3 || g.table === 4) ? T.accent : T.border}`,
          }}>
            {/* Top row: check + name + edit button */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }} onClick={() => toggle(g.id)}>
              <div style={{
                width: "32px", height: "32px", borderRadius: "50%",
                background: g.checked ? T.successBg : "rgba(255,255,255,0.05)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "14px", flexShrink: 0, transition: "all 0.2s",
                border: g.checked ? `2px solid ${T.success}` : `2px solid ${T.border}`,
              }}>
                {g.checked ? "\u2713" : ""}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: T.text, fontSize: "15px" }}>{g.name}</div>
                <div style={{ fontSize: "13px", color: T.textSec, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {g.org} · {g.role}
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <span style={badgeStyle(
                  g.checked ? T.successBg : "rgba(255,255,255,0.05)",
                  g.checked ? T.success : T.textMuted,
                )}>{g.checked ? "참석" : "대기"}</span>
              </div>
            </div>
            {/* Seat info row */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px", paddingTop: "8px", borderTop: `1px solid ${T.border}` }}>
              <span style={{ fontSize: "13px", color: T.textSec, flexShrink: 0 }}>좌석</span>
              <select
                value={g.table}
                onChange={(e) => { e.stopPropagation(); updateSeat(g.id, "table", e.target.value); }}
                onClick={(e) => e.stopPropagation()}
                style={{ ...inputStyle, width: "auto", flex: 1, padding: "6px 8px", fontSize: "13px" }}
              >
                {Object.entries(TABLE_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <select
                value={g.seat}
                onChange={(e) => { e.stopPropagation(); updateSeat(g.id, "seat", e.target.value); }}
                onClick={(e) => e.stopPropagation()}
                style={{ ...inputStyle, width: "auto", flex: 1, padding: "6px 8px", fontSize: "13px" }}
              >
                {Array.from({ length: 10 }, (_, i) => i + 1).map((s) => (
                  <option key={s} value={s}>{s}번</option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// TAB: ATTENDEES (260)
// ============================================================
function AttendeesTab({ attendees, setAttendees }) {
  const [search, setSearch] = useState("");
  const [filterZone, setFilterZone] = useState("전체");
  const [filterTable, setFilterTable] = useState(0);
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewMode, setViewMode] = useState("table"); // "zone" | "table"
  const [selectedTable, setSelectedTable] = useState(null);

  const toggle = (id) => {
    setAttendees((prev) => prev.map((a) => a.id === id ? { ...a, checked: !a.checked } : a));
  };

  const updateSeat = (id, field, value) => {
    setAttendees((prev) => prev.map((a) => a.id === id ? { ...a, [field]: Number(value) } : a));
  };

  const toggleAllInGroup = (ids) => {
    setAttendees((prev) => {
      const groupItems = prev.filter((a) => ids.includes(a.id));
      const allChecked = groupItems.every((a) => a.checked);
      return prev.map((a) => ids.includes(a.id) ? { ...a, checked: !allChecked } : a);
    });
  };

  const filtered = useMemo(() => {
    return attendees.filter((a) => {
      if (search && !a.name.includes(search) && !a.org.includes(search)) return false;
      if (filterZone !== "전체" && a.zone !== filterZone) return false;
      if (filterTable > 0 && a.table !== filterTable) return false;
      if (filterStatus === "checked" && !a.checked) return false;
      if (filterStatus === "unchecked" && a.checked) return false;
      return true;
    });
  }, [attendees, search, filterZone, filterTable, filterStatus]);

  const stats = { total: attendees.length, checked: attendees.filter((a) => a.checked).length };

  // Group stats
  const zoneStats = useMemo(() => {
    return ZONES.map((z) => {
      const items = attendees.filter((a) => a.zone === z);
      return { name: z, total: items.length, checked: items.filter((a) => a.checked).length, ids: items.map((a) => a.id) };
    });
  }, [attendees]);

  const tableStats = useMemo(() => {
    return ATTENDEE_TABLES.map((t) => {
      const items = attendees.filter((a) => a.table === t.id);
      return { name: t.label, id: t.id, total: items.length, checked: items.filter((a) => a.checked).length, ids: items.map((a) => a.id) };
    }).filter((t) => t.total > 0);
  }, [attendees]);

  const groupStats = viewMode === "zone" ? zoneStats : tableStats;

  return (
    <div>
      <div className="stat-grid">
        <StatCard icon={"\u{1F465}"} label="전체" value={stats.total} accent={T.accent} />
        <StatCard icon={"\u{2705}"} label="참석" value={stats.checked} sub={`${Math.round((stats.checked / stats.total) * 100)}%`} accent={T.success} />
        <StatCard icon={"\u{23F3}"} label="미참석" value={stats.total - stats.checked} accent={T.textMuted} />
      </div>

      {/* Group Summary */}
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <div style={{ fontSize: "14px", fontWeight: 700, color: T.accent }}>
            {viewMode === "zone" ? "구역별" : "테이블별"} 참석 현황
          </div>
          <div style={{ display: "flex", gap: "4px" }}>
            <button style={pillNav(viewMode === "zone")} onClick={() => setViewMode("zone")}>구역</button>
            <button style={pillNav(viewMode === "table")} onClick={() => setViewMode("table")}>테이블</button>
          </div>
        </div>
        {groupStats.map((g) => {
          const pct = g.total > 0 ? Math.round((g.checked / g.total) * 100) : 0;
          const allChecked = g.checked === g.total && g.total > 0;
          return (
            <div key={g.name} style={{ marginBottom: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", marginBottom: "3px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ color: T.text, fontWeight: 600 }}>{g.name}</span>
                  <span style={{ color: T.textMuted, fontSize: "12px" }}>{g.checked}/{g.total}</span>
                </div>
                <button
                  style={{
                    ...ghostBtnStyle,
                    padding: "3px 10px",
                    fontSize: "12px",
                    color: allChecked ? T.warn : T.success,
                    borderColor: allChecked ? T.warn : T.success,
                  }}
                  onClick={() => toggleAllInGroup(g.ids)}
                >
                  {allChecked ? "전체 취소" : "전체 참석"}
                </button>
              </div>
              <ProgressBar value={g.checked} max={g.total} color={T.accent} />
            </div>
          );
        })}
      </div>

      {/* Seat Map for Attendees */}
      {viewMode === "table" && (
        <div style={{ ...cardStyle, padding: "18px", overflow: "hidden" }}>
          <div style={{ fontSize: "14px", fontWeight: 700, color: T.accent, marginBottom: "12px", textAlign: "center" }}>
            세부 좌석 배치도
          </div>
          <div style={{
            textAlign: "center", padding: "6px 0", marginBottom: "16px",
            background: "rgba(145,201,192,0.1)", borderRadius: "6px",
            fontSize: "12px", fontWeight: 700, color: T.accent, letterSpacing: "3px",
            border: `1px solid ${T.accentBorder}`
          }}>STAGE (무대)</div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "100%", overflowX: "auto", paddingBottom: "10px" }}>
            <div style={{ minWidth: "320px" }}>
              {MAP_ROWS.map((row, ri) => (
                <div key={ri} style={{ display: "flex", justifyContent: "center", gap: "10px", marginBottom: "8px" }}>
                  {row.map((t) => {
                    const isVipTable = VIP_TABLE_IDS.includes(t);
                    const tbGroup = isVipTable 
                      ? { total: 10, checked: 0 }
                      : (tableStats.find(ts => ts.id === t) || { total: 0, checked: 0 });
                    
                    const isSelected = selectedTable === t;
                    
                    return (
                      <button key={t} onClick={() => {
                        if (isVipTable) return;
                        setSelectedTable(isSelected ? null : t);
                      }} style={{
                        width: "44px", height: "44px",
                        borderRadius: "50%", 
                        border: `2px solid ${isVipTable ? TABLE_CONFIG[t].color : isSelected ? T.accent : T.border}`,
                        background: isVipTable ? `${TABLE_CONFIG[t].color}1A` : isSelected ? "rgba(145,201,192,0.1)" : "rgba(255,255,255,0.03)",
                        cursor: isVipTable ? "default" : "pointer", display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center", fontFamily: T.font,
                        transition: "all 0.2s",
                        opacity: isVipTable ? 0.9 : 1,
                      }}>
                        <span style={{ fontSize: "10px", fontWeight: 700, color: isVipTable ? TABLE_CONFIG[t].color : T.textSec }}>
                          {isVipTable ? "내빈" : `T${t}`}
                        </span>
                        {!isVipTable && (
                          <span style={{ fontSize: "11px", fontWeight: 800, color: T.text }}>
                            {tbGroup.checked}/{tbGroup.total}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {selectedTable && (
            <div style={{
              background: "rgba(255,255,255,0.03)", borderRadius: T.radiusSm,
              padding: "10px", marginTop: "8px",
            }}>
              <div style={{ fontSize: "14px", fontWeight: 700, color: T.accent, marginBottom: "8px" }}>
                테이블 {selectedTable} 좌석 현황
              </div>
              {attendees.filter((a) => a.table === selectedTable).map((a) => (
                <div key={a.id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "4px 0", borderBottom: `1px solid ${T.border}`,
                }}>
                  <span style={{ fontSize: "13px", color: T.text }}>
                    {a.seat}번 · {a.name} <span style={{ color: T.textSec }}>{a.org}</span>
                  </span>
                  <span style={badgeStyle(
                    a.checked ? T.successBg : "rgba(255,255,255,0.05)",
                    a.checked ? T.success : T.textMuted,
                  )}>{a.checked ? "참석" : "대기"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <SearchBar value={search} onChange={setSearch} placeholder="참석자 검색 (이름, 소속)" />

      <FilterPills
        options={[{ value: "전체", label: "전체" }, ...ZONES.map((z) => ({ value: z, label: z }))]}
        value={filterZone} onChange={(v) => { setFilterZone(v); setFilterTable(0); }}
      />
      <FilterPills
        options={[
          { value: 0, label: "전체 테이블" },
          ...ATTENDEE_TABLES.filter((t) => attendees.some((a) => a.table === t.id)).map((t) => ({ value: t.id, label: `T${t.id}` })),
        ]}
        value={filterTable} onChange={(v) => { setFilterTable(v); setFilterZone("전체"); }}
      />
      <FilterPills
        options={[{ value: "all", label: "전체" }, { value: "checked", label: "참석" }, { value: "unchecked", label: "미참석" }]}
        value={filterStatus} onChange={setFilterStatus}
      />

      <div style={{ fontSize: "13px", color: T.textSec, marginBottom: "8px" }}>
        {filtered.length}명 표시 중
      </div>

      <div className="card-grid-2">
        {filtered.slice(0, 50).map((a) => (
          <div key={a.id} style={{ ...cardStyle }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", paddingBottom: "8px" }} onClick={() => toggle(a.id)}>
              <div style={{
                width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0,
                background: a.checked ? T.successBg : "rgba(255,255,255,0.05)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "12px", border: a.checked ? `2px solid ${T.success}` : `2px solid ${T.border}`,
                color: a.checked ? T.success : T.textMuted, transition: "all 0.2s",
              }}>
                {a.checked ? "\u2713" : ""}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: T.text, fontSize: "15px" }}>{a.name}</div>
                <div style={{ fontSize: "13px", color: T.textSec, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {a.org}
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <span style={badgeStyle(T.accentBg, T.accentDark)}>{a.zone}</span>
              </div>
            </div>
            
            {/* Seat selection */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingTop: "8px", borderTop: `1px solid ${T.border}` }}>
              <span style={{ fontSize: "13px", color: T.textSec, flexShrink: 0 }}>내역</span>
              <select
                value={a.table}
                onChange={(e) => { e.stopPropagation(); updateSeat(a.id, "table", e.target.value); }}
                onClick={(e) => e.stopPropagation()}
                style={{ ...inputStyle, width: "auto", flex: 1, padding: "6px 8px", fontSize: "13px" }}
              >
                {ATTENDEE_TABLES.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
              <select
                value={a.seat}
                onChange={(e) => { e.stopPropagation(); updateSeat(a.id, "seat", e.target.value); }}
                onClick={(e) => e.stopPropagation()}
                style={{ ...inputStyle, width: "auto", flex: 1, padding: "6px 8px", fontSize: "13px" }}
              >
                {Array.from({ length: 10 }, (_, i) => i + 1).map((s) => (
                  <option key={s} value={s}>{s}번</option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
      {filtered.length > 50 && (
        <div style={{ textAlign: "center", padding: "12px", fontSize: "13px", color: T.textSec }}>
          + {filtered.length - 50}명 더 있음 (검색으로 찾아주세요)
        </div>
      )}
    </div>
  );
}

// ============================================================
// TAB: NOTICES
// ============================================================
function NoticesTab({ notices, setNotices }) {
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("normal");

  const add = () => {
    if (!text.trim()) return;
    const now = new Date();
    setNotices((prev) => [...prev, {
      id: Date.now(), text: text.trim(), priority,
      time: `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`,
      author: "운영팀",
    }]);
    setText("");
    setPriority("normal");
  };

  return (
    <div>
      <div style={cardStyle}>
        <div style={{ fontSize: "14px", fontWeight: 700, color: T.accent, marginBottom: "10px" }}>새 공지 등록</div>
        <textarea
          style={{ ...inputStyle, height: "60px", resize: "none", marginBottom: "8px" }}
          value={text} onChange={(e) => setText(e.target.value)}
          placeholder="공지 내용을 입력하세요..."
        />
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <FilterPills
            options={[
              { value: "normal", label: "일반" },
              { value: "important", label: "중요" },
              { value: "urgent", label: "긴급" },
            ]}
            value={priority} onChange={setPriority}
          />
          <button style={accentBtnStyle} onClick={add}>등록</button>
        </div>
      </div>

      {[...notices].reverse().map((n) => (
        <div key={n.id} style={{
          ...cardStyle,
          borderLeft: `3px solid ${n.priority === "urgent" ? T.danger : n.priority === "important" ? T.warn : T.info}`,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
            <span style={badgeStyle(
              n.priority === "urgent" ? T.dangerBg : n.priority === "important" ? T.warnBg : T.infoBg,
              n.priority === "urgent" ? T.danger : n.priority === "important" ? T.warn : T.info,
            )}>
              {n.priority === "urgent" ? "긴급" : n.priority === "important" ? "중요" : "일반"}
            </span>
            <span style={{ fontSize: "12px", color: T.textMuted }}>{n.time} · {n.author}</span>
          </div>
          <div style={{ fontSize: "14px", color: T.text, lineHeight: 1.5 }}>{n.text}</div>
        </div>
      ))}

      {notices.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 0", color: T.textMuted, fontSize: "14px" }}>
          등록된 공지가 없습니다
        </div>
      )}
    </div>
  );
}

// ============================================================
// TAB: EMERGENCY
// ============================================================
function EmergencyTab({ emergencies, setEmergencies, staffTeams }) {
  const [text, setText] = useState("");
  const [team, setTeam] = useState("");
  const [urgency, setUrgency] = useState("high");

  const send = () => {
    if (!text.trim()) return;
    const now = new Date();
    setEmergencies((prev) => [...prev, {
      id: Date.now(), text: text.trim(), team: team || "전체",
      urgency, status: "pending",
      time: `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`,
    }]);
    setText("");
  };

  const updateStatus = (id, status) => {
    setEmergencies((prev) => prev.map((e) => e.id === id ? { ...e, status } : e));
  };

  return (
    <div>
      <div style={{ ...cardStyle, borderTop: `2px solid ${T.danger}` }}>
        <div style={{ fontSize: "14px", fontWeight: 700, color: T.danger, marginBottom: "10px" }}>
          긴급 협조 요청
        </div>
        <input
          style={{ ...inputStyle, marginBottom: "8px" }}
          value={text} onChange={(e) => setText(e.target.value)}
          placeholder="협조 요청 내용..."
        />
        <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
          <select style={{ ...inputStyle, width: "auto", flex: "1" }}
            value={team} onChange={(e) => setTeam(e.target.value)}>
            <option value="">대상 팀 선택</option>
            <option value="전체">전체</option>
            {staffTeams.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <FilterPills
            options={[
              { value: "high", label: "긴급" },
              { value: "medium", label: "보통" },
            ]}
            value={urgency} onChange={setUrgency}
          />
          <button style={{ ...accentBtnStyle, background: `linear-gradient(135deg, ${T.danger} 0%, #991B1B 100%)`, color: "#fff" }} onClick={send}>
            SOS 발송
          </button>
        </div>
      </div>

      {[...emergencies].reverse().map((e) => (
        <div key={e.id} style={{
          ...cardStyle,
          borderLeft: `3px solid ${e.status === "done" ? T.success : e.urgency === "high" ? T.danger : T.warn}`,
          opacity: e.status === "done" ? 0.5 : 1,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
            <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
              <span style={badgeStyle(
                e.urgency === "high" ? T.dangerBg : T.warnBg,
                e.urgency === "high" ? T.danger : T.warn,
              )}>{e.urgency === "high" ? "긴급" : "보통"}</span>
              <span style={badgeStyle("rgba(255,255,255,0.06)", T.textSec)}>{e.team}</span>
            </div>
            <span style={{ fontSize: "12px", color: T.textMuted }}>{e.time}</span>
          </div>
          <div style={{ fontSize: "14px", color: T.text, marginBottom: "8px" }}>{e.text}</div>
          <div style={{ display: "flex", gap: "4px" }}>
            {e.status === "pending" && (
              <>
                <button style={ghostBtnStyle} onClick={() => updateStatus(e.id, "inProgress")}>처리 중</button>
                <button style={{ ...ghostBtnStyle, borderColor: T.success, color: T.success }} onClick={() => updateStatus(e.id, "done")}>완료</button>
              </>
            )}
            {e.status === "inProgress" && (
              <button style={{ ...ghostBtnStyle, borderColor: T.success, color: T.success }} onClick={() => updateStatus(e.id, "done")}>완료 처리</button>
            )}
            {e.status === "done" && (
              <span style={badgeStyle(T.successBg, T.success)}>처리 완료</span>
            )}
          </div>
        </div>
      ))}

      {emergencies.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 0", color: T.textMuted, fontSize: "14px" }}>
          긴급 요청이 없습니다
        </div>
      )}
    </div>
  );
}

// ============================================================
// TAB: PROGRAM TIMER
// ============================================================
function ProgramTab({ program }) {
  const [now, setNow] = useState(new Date());
  const [manualIdx, setManualIdx] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const eventDate = new Date("2026-04-22T15:00:00");
  const isEventDay = now.toDateString() === eventDate.toDateString();

  // Find current program index (auto mode)
  const autoIdx = (() => {
    if (!isEventDay) return -1;
    for (let i = 0; i < program.length; i++) {
      const [h, m] = program[i].time.split(":").map(Number);
      const [eh, em] = program[i].end.split(":").map(Number);
      const start = new Date(now); start.setHours(h, m, 0, 0);
      const end = new Date(now); end.setHours(eh, em, 0, 0);
      if (now >= start && now < end) return i;
    }
    // Check if before first program
    const [fh, fm] = program[0].time.split(":").map(Number);
    const firstStart = new Date(now); firstStart.setHours(fh, fm, 0, 0);
    if (now < firstStart) return -2; // before event
    return -3; // after event
  })();

  const currentIdx = manualIdx !== null ? manualIdx : (autoIdx >= 0 ? autoIdx : 0);
  const cp = program[currentIdx];

  // Calculate timer values
  const isManual = manualIdx !== null;
  const isBeforeEvent = !isEventDay || autoIdx === -2;
  const isAfterEvent = isEventDay && autoIdx === -3;

  let remaining, totalDuration, elapsed, pct, timerLabel;

  if (isManual) {
    // Manual mode: show full program duration
    const [sh, sm] = cp.time.split(":").map(Number);
    const [eh, em] = cp.end.split(":").map(Number);
    totalDuration = ((eh * 60 + em) - (sh * 60 + sm)) * 60;
    remaining = totalDuration;
    elapsed = 0;
    pct = 0;
    timerLabel = "프로그램 전체 시간";
  } else if (isBeforeEvent) {
    // Before event: D-Day countdown
    const diff = Math.max(0, Math.floor((eventDate - now) / 1000));
    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    const mins2 = Math.floor((diff % 3600) / 60);
    remaining = diff;
    totalDuration = diff;
    elapsed = 0;
    pct = 0;
    timerLabel = `D-${days}일 ${hours}시간 ${mins2}분`;
  } else if (isAfterEvent) {
    remaining = 0;
    totalDuration = 1;
    elapsed = 1;
    pct = 100;
    timerLabel = "행사 종료";
  } else {
    // Normal: during event
    const [eh, em] = cp.end.split(":").map(Number);
    const endTime = new Date(now); endTime.setHours(eh, em, 0, 0);
    remaining = Math.max(0, Math.floor((endTime - now) / 1000));
    const [sh, sm] = cp.time.split(":").map(Number);
    const startTime = new Date(now); startTime.setHours(sh, sm, 0, 0);
    totalDuration = Math.max(1, Math.floor((endTime - startTime) / 1000));
    elapsed = totalDuration - remaining;
    pct = Math.min(100, (elapsed / totalDuration) * 100);
    timerLabel = "남은 시간";
  }

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <div>
      {/* Current Program Hero */}
      <div style={{
        ...cardStyle, textAlign: "center", padding: "24px 16px",
        background: `linear-gradient(180deg, rgba(145,201,192,0.1) 0%, ${T.bgCard} 100%)`,
        borderTop: `2px solid ${isAfterEvent ? T.textMuted : T.accent}`,
      }}>
        {isBeforeEvent && !isManual ? (
          <>
            <div style={{ fontSize: "13px", color: T.accentDark, fontWeight: 600, marginBottom: "8px" }}>
              행사 시작까지
            </div>
            <div style={{ fontSize: "36px", fontWeight: 800, color: T.accent, letterSpacing: "1px" }}>
              {timerLabel}
            </div>
            <div style={{ fontSize: "14px", color: T.textSec, marginTop: "8px" }}>
              2026. 4. 22 (수) 15:00 · 백범김구기념관
            </div>
          </>
        ) : isAfterEvent && !isManual ? (
          <>
            <div style={{ fontSize: "36px", fontWeight: 800, color: T.textMuted }}>
              행사 종료
            </div>
            <div style={{ fontSize: "14px", color: T.textSec, marginTop: "8px" }}>
              모든 프로그램이 완료되었습니다
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: "13px", color: T.accentDark, fontWeight: 600, marginBottom: "4px" }}>
              {isManual && <span style={badgeStyle(T.warnBg, T.warn)}>수동 모드</span>}
              {" "}{cp.part} · {cp.type === "award" ? "포상" : cp.type === "lecture" ? "특강" : cp.type === "speech" ? "식사" : "진행"}
            </div>
            <div style={{ fontSize: "18px", fontWeight: 800, color: T.text, marginBottom: "6px" }}>
              {cp.title}
            </div>
            {cp.speaker && <div style={{ fontSize: "14px", color: T.textSec, marginBottom: "14px" }}>{cp.speaker}</div>}

            <div style={{ fontSize: "48px", fontWeight: 800, color: T.accent, letterSpacing: "2px", fontVariantNumeric: "tabular-nums" }}>
              {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
            </div>
            <div style={{ fontSize: "13px", color: T.textSec, marginBottom: "8px" }}>{timerLabel}</div>

            <div style={{ maxWidth: "280px", margin: "0 auto" }}>
              <ProgressBar value={elapsed} max={totalDuration} color={T.accent} />
            </div>
            <div style={{ fontSize: "12px", color: T.textMuted, marginTop: "4px" }}>
              {cp.time} ~ {cp.end}
            </div>
          </>
        )}
      </div>

      {/* Manual Override */}
      <div style={{ display: "flex", gap: "4px", overflowX: "auto", padding: "4px 0", marginBottom: "8px" }}>
        <button style={pillNav(manualIdx === null)} onClick={() => setManualIdx(null)}>자동</button>
        {program.map((p, i) => (
          <button key={p.id} style={pillNav(manualIdx === i)} onClick={() => setManualIdx(i)}>
            {p.time}
          </button>
        ))}
      </div>

      {/* All Programs */}
      {program.map((p, i) => {
        const isCurrent = i === currentIdx;
        return (
          <div key={p.id} style={{
            ...cardStyle, display: "flex", gap: "10px", alignItems: "center",
            borderLeft: `3px solid ${isCurrent ? T.accent : "transparent"}`,
            background: isCurrent ? "rgba(145,201,192,0.06)" : T.bgCard,
          }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "50%", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: isCurrent ? T.accentBg : "rgba(255,255,255,0.03)",
              border: `1px solid ${isCurrent ? T.accent : T.border}`,
              fontSize: "12px", fontWeight: 700, color: isCurrent ? T.accent : T.textMuted,
            }}>
              {p.part}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "14px", fontWeight: 700, color: isCurrent ? T.accent : T.text }}>
                {p.title}
              </div>
              <div style={{ fontSize: "13px", color: T.textSec }}>
                {p.time} ~ {p.end} {p.speaker && `· ${p.speaker}`}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// TAB: AWARDS
// ============================================================
function AwardsTab() {
  const [categories, setCategories] = useState(
    AWARD_CATEGORIES.map((c) => ({ ...c, recipients: c.recipients.map((r, i) => ({ ...r, called: false, id: `${c.id}-${i}` })) }))
  );
  const [activeCategory, setActiveCategory] = useState("a1");

  const toggleCalled = (catId, recipId) => {
    setCategories((prev) => prev.map((c) => c.id === catId ? {
      ...c, recipients: c.recipients.map((r) => r.id === recipId ? { ...r, called: !r.called } : r),
    } : c));
  };

  const cat = categories.find((c) => c.id === activeCategory);
  const totalRecipients = categories.reduce((s, c) => s + c.recipients.length, 0);
  const totalCalled = categories.reduce((s, c) => s + c.recipients.filter((r) => r.called).length, 0);

  return (
    <div>
      <div className="stat-grid">
        <StatCard icon={"\u{1F3C6}"} label="전체 수상자" value={totalRecipients} accent={T.accent} />
        <StatCard icon={"\u{2705}"} label="호명 완료" value={totalCalled} accent={T.success} />
        <StatCard icon={"\u{23F3}"} label="대기" value={totalRecipients - totalCalled} accent={T.textMuted} />
      </div>

      <ProgressBar value={totalCalled} max={totalRecipients} />
      <div style={{ fontSize: "12px", color: T.textSec, textAlign: "right", marginTop: "4px", marginBottom: "12px" }}>
        포상 진행률 {totalRecipients > 0 ? Math.round((totalCalled / totalRecipients) * 100) : 0}%
      </div>

      <FilterPills
        options={categories.map((c) => ({ value: c.id, label: `${c.icon} ${c.name} (${c.recipients.length})` }))}
        value={activeCategory} onChange={setActiveCategory}
      />

      {cat && (
        <div style={cardStyle}>
          <div style={{ fontSize: "16px", fontWeight: 700, color: T.accent, marginBottom: "4px" }}>
            {cat.icon} {cat.name}
          </div>
          <div style={{ fontSize: "13px", color: T.textSec, marginBottom: "12px" }}>
            {cat.recipients.filter(r => r.called).length}/{cat.recipients.length}명 호명 완료
          </div>
          {cat.recipients.map((r, i) => (
            <div key={r.id} style={{
              display: "flex", alignItems: "center", gap: "10px",
              padding: "10px 0", borderBottom: i < cat.recipients.length - 1 ? `1px solid ${T.border}` : "none",
              cursor: "pointer",
            }} onClick={() => toggleCalled(cat.id, r.id)}>
              <div style={{
                width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "14px", fontWeight: 800, color: T.bgCard,
                background: r.called ? T.success : T.accentBg,
                border: r.called ? `2px solid ${T.success}` : `2px solid ${T.accentBorder}`,
              }}>
                {r.called ? "\u2713" : i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "15px", fontWeight: 700, color: r.called ? T.textSec : T.text, textDecoration: r.called ? "line-through" : "none" }}>
                  {r.name}
                </div>
                {r.org && (
                  <div style={{ fontSize: "12px", color: T.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.org}
                  </div>
                )}
              </div>
              <span style={badgeStyle(
                r.called ? T.successBg : "rgba(255,255,255,0.05)",
                r.called ? T.success : T.textMuted,
              )}>
                {r.called ? "호명 완료" : "대기"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// TAB: SUPPLIES
// ============================================================
function SuppliesTab() {
  const [supplies, setSupplies] = useState(INITIAL_SUPPLIES);
  const [filterCat, setFilterCat] = useState("전체");
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newQty, setNewQty] = useState(1);
  const [newCat, setNewCat] = useState("기타");

  const cats = ["전체", ...new Set(supplies.map((s) => s.category))];

  const toggleDone = (id) => {
    setSupplies((prev) => prev.map((s) => s.id === id ? { ...s, done: !s.done } : s));
  };

  const setAssignee = (id, assignee) => {
    setSupplies((prev) => prev.map((s) => s.id === id ? { ...s, assignee } : s));
  };

  const addItem = () => {
    if (!newName.trim()) return;
    setSupplies((prev) => [...prev, { id: Date.now(), name: newName.trim(), qty: newQty, assignee: "", done: false, category: newCat }]);
    setNewName(""); setNewQty(1); setShowAdd(false);
  };

  const filtered = supplies.filter((s) => filterCat === "전체" || s.category === filterCat);
  const totalDone = supplies.filter((s) => s.done).length;

  return (
    <div>
      <div className="stat-grid">
        <StatCard icon={"\u{1F4E6}"} label="전체 항목" value={supplies.length} accent={T.accent} />
        <StatCard icon={"\u{2705}"} label="준비 완료" value={totalDone} accent={T.success} />
        <StatCard icon={"\u{23F3}"} label="미완료" value={supplies.length - totalDone} accent={T.warn} />
      </div>

      <ProgressBar value={totalDone} max={supplies.length} />
      <div style={{ fontSize: "12px", color: T.textSec, textAlign: "right", marginTop: "4px", marginBottom: "12px" }}>
        준비율 {supplies.length > 0 ? Math.round((totalDone / supplies.length) * 100) : 0}%
      </div>

      <div style={{ display: "flex", gap: "6px", marginBottom: "10px", alignItems: "center" }}>
        <div style={{ flex: 1, overflowX: "auto" }}>
          <FilterPills options={cats.map((c) => ({ value: c, label: c }))} value={filterCat} onChange={setFilterCat} />
        </div>
        <button style={accentBtnStyle} onClick={() => setShowAdd(!showAdd)}>+ 추가</button>
      </div>

      {showAdd && (
        <div style={{ ...cardStyle, borderTop: `2px solid ${T.accent}` }}>
          <input style={{ ...inputStyle, marginBottom: "6px" }} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="물품명" />
          <div style={{ display: "flex", gap: "6px" }}>
            <input style={{ ...inputStyle, width: "80px" }} type="number" value={newQty} onChange={(e) => setNewQty(Number(e.target.value))} min={1} />
            <select style={{ ...inputStyle, flex: 1 }} value={newCat} onChange={(e) => setNewCat(e.target.value)}>
              {["제작", "행사장", "구입", "설치", "포상", "등록", "다과", "장비", "기타"].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <button style={accentBtnStyle} onClick={addItem}>등록</button>
          </div>
        </div>
      )}

      {filtered.map((s) => (
        <div key={s.id} style={{
          ...cardStyle, display: "flex", alignItems: "center", gap: "10px",
          opacity: s.done ? 0.5 : 1,
        }}>
          <div style={{
            width: "28px", height: "28px", borderRadius: "6px", flexShrink: 0,
            background: s.done ? T.successBg : "rgba(255,255,255,0.05)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "12px", cursor: "pointer",
            border: s.done ? `2px solid ${T.success}` : `2px solid ${T.border}`,
            color: s.done ? T.success : T.textMuted,
          }} onClick={() => toggleDone(s.id)}>
            {s.done ? "\u2713" : ""}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: T.text, textDecoration: s.done ? "line-through" : "none" }}>
              {s.name} <span style={{ fontWeight: 400, color: T.textSec }}>x{s.qty}</span>
            </div>
            <div style={{ fontSize: "12px", color: T.textSec }}>
              <span style={badgeStyle("rgba(255,255,255,0.06)", T.textSec)}>{s.category}</span>
              {s.assignee && <span style={{ marginLeft: "4px" }}>{s.assignee}</span>}
            </div>
          </div>
          <input
            style={{ ...inputStyle, width: "80px", fontSize: "13px", textAlign: "center" }}
            value={s.assignee}
            onChange={(e) => setAssignee(s.id, e.target.value)}
            placeholder="담당자"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ))}
    </div>
  );
}

// ============================================================
// TAB: STAFF
// ============================================================
const STAFF_ROLES = [
  {
    role: "총괄",
    members: [
      { name: "이지선", p1: ["전체 총괄"], p2: ["보조 사회"], p3: ["내빈 응대 및 관리", "보조 사회"] }
    ]
  },
  {
    role: "내빈 응대",
    members: [
      { name: "정승아", p1: ["내빈 총괄", "접수대 세팅"], p2: ["내빈 응대 및 관리"], p3: ["내빈 총괄", "내빈 응대 및 관리", "내빈 방명록 작성"] }
    ]
  },
  {
    role: "영상",
    members: [
      { name: "고석우", p1: ["영상, 음향 세팅", "녹화카메라 세팅"], p2: ["강연 자료 화면송출"], p3: ["식순, 수상자 화면송출"] },
      { name: "최봄", p1: ["영상, 음향 세팅(보조)", "강연자 관리, 응대"], p2: ["강연자 응대", "강연자 관리(마이크, 강연준비 등)", "화면송출 보조"], p3: ["화면송출 보조"] }
    ]
  },
  {
    role: "시상",
    members: [
      { name: "이진선", p1: ["시상대 세팅 총괄", "시상 리허설(시상순서)"], p2: ["접수 및 내빈 응대"], p3: ["시상 총괄 : 시상 순서별 상장 패 준비", "시상 진행(시상대)"] },
      { name: "신단비", p1: ["시상대 세팅", "시상 리허설(시상순서)"], p2: ["접수"], p3: ["시상 보조", "시상 트레이"] }
    ]
  },
  {
    role: "접수",
    members: [
      { name: "정소희", p1: ["접수대 총괄", "접수대 세팅"], p2: ["접수 및 내빈 응대"], p3: ["기념품 세팅"] },
      { name: "최지혜", p1: ["접수대 세팅"], p2: ["접수"], p3: ["기념품 세팅"] },
      { name: "손채은", p1: ["접수대 세팅"], p2: ["접수"], p3: ["기념품 세팅"] }
    ]
  },
  {
    role: "행사장",
    members: [
      { name: "권하영", p1: ["테이블 세팅(물, 안내지)", "내빈 테이블 세팅(명찰)"], p2: ["접수"], p3: ["기념품 세팅"] },
      { name: "채유리", p1: ["테이블 세팅(물, 안내지)"], p2: ["접수"], p3: ["영상 촬영(축사 등)"] },
      { name: "나한송", p1: ["테이블 세팅(물, 안내지)"], p2: ["접수"], p3: ["기념품 세팅"] }
    ]
  },
  {
    role: "무대/시상",
    members: [
      { name: "이해창", p1: ["현수막 및 판넬 설치", "시상 리허설(수상자)"], p2: ["무대 관리(마이크 등)"], p3: ["수상자 관리(집결 등)", "수상자 무대 위 정렬", "무대 관리(단상, 마이크)"] },
      { name: "이재중", p1: ["현수막 및 판넬 설치"], p2: ["무대 관리(마이크 등)"], p3: ["무대 관리(단상, 마이크)", "시상 트레이"] }
    ]
  },
  {
    role: "포토존",
    members: [
      { name: "정지연", p1: ["포토존 세팅", "포토존 촬영"], p2: ["포토존 촬영"], p3: ["포토존 촬영/정리"] }
    ]
  },
  {
    role: "이벤트",
    members: [
      { name: "유예리", p1: ["이벤트 부스 총괄", "이벤트 부스 세팅"], p2: ["접수"], p3: ["이벤트 물품 정리"] },
      { name: "신규직원", p1: ["이벤트 부스 세팅"], p2: ["접수"], p3: ["이벤트 물품 정리"] }
    ]
  },
  {
    role: "담당",
    members: [
      { name: "양종철", p1: ["사업계획 및 예산집행", "준비회의, 업무분장", "전체 세팅 총괄"], p2: ["행사장 진행 담당(총괄)"], p3: ["행사장 진행 담당(총괄)"] }
    ]
  }
];

function StaffTab({ setStaffTeams }) {
  useEffect(() => {
    setStaffTeams(STAFF_ROLES.map(r => r.role));
  }, [setStaffTeams]);

  return (
    <div>
      <div className="stat-grid">
        <StatCard icon={"\u{1F46A}"} label="총 역할 그룹" value={STAFF_ROLES.length} accent={T.accent} />
        <StatCard icon={"\u{1F465}"} label="전체 스태프" value={STAFF_ROLES.reduce((acc, r) => acc + r.members.length, 0)} accent={T.accent} />
      </div>

      <div style={{ fontSize: "14px", fontWeight: 700, color: T.accent, marginBottom: "12px" }}>
        행사 업무 분장표
      </div>

      {STAFF_ROLES.map((group, gi) => (
        <div key={gi} style={{ ...cardStyle, borderLeft: `3px solid ${T.accent}`, padding: "16px 14px" }}>
          <div style={{ fontSize: "16px", fontWeight: 800, color: T.accent, marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
            {group.role} <span style={badgeStyle(T.accentBg, T.accentDark)}>{group.members.length}명</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {group.members.map((m, mi) => (
              <div key={mi} style={{ background: "rgba(255,255,255,0.02)", borderRadius: T.radiusSm, padding: "12px" }}>
                <div style={{ fontSize: "15px", fontWeight: 700, color: T.text, marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                  {"\u{1F464}"} {m.name}
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    <span style={{ ...badgeStyle("rgba(255,255,255,0.05)", T.textSec), minWidth: "55px", justifyContent: "center" }}>준비</span>
                    <div style={{ fontSize: "13px", color: T.text, lineHeight: 1.4, flex: 1 }}>
                      {m.p1.map((task, i) => <div key={i}>• {task}</div>)}
                    </div>
                  </div>
                  
                  <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    <span style={{ ...badgeStyle("rgba(255,255,255,0.05)", T.textSec), minWidth: "55px", justifyContent: "center" }}>1부</span>
                    <div style={{ fontSize: "13px", color: T.text, lineHeight: 1.4, flex: 1 }}>
                      {m.p2.map((task, i) => <div key={i}>• {task}</div>)}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    <span style={{ ...badgeStyle("rgba(255,255,255,0.05)", T.textSec), minWidth: "55px", justifyContent: "center" }}>2부</span>
                    <div style={{ fontSize: "13px", color: T.text, lineHeight: 1.4, flex: 1 }}>
                      {m.p3.map((task, i) => <div key={i}>• {task}</div>)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// GOOGLE SHEETS HELPER
// ============================================================
const SHEET_ID = "1xixpkKen7Ozky0carX6ZYhRSF6uRl5wpu10qrpM_o2s";
const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;

function parseCSV(text) {
  const lines = text.split("\n").filter(l => l.trim());
  if (lines.length < 2) return [];
  const results = [];
  for (let i = 1; i < lines.length; i++) {
    const row = [];
    let inQuote = false, field = "";
    for (let j = 0; j < lines[i].length; j++) {
      const ch = lines[i][j];
      if (ch === '"') { inQuote = !inQuote; continue; }
      if (ch === ',' && !inQuote) { row.push(field.trim()); field = ""; continue; }
      field += ch;
    }
    row.push(field.trim());
    if (row.length >= 3 && row[1]) {
      results.push({ name: row[1], org: row[2] || "" });
    }
  }
  return results;
}

// ============================================================
// MAIN APP
// ============================================================
const TABS = [
  { id: "dashboard", label: "홈", icon: "\u{1F3E0}" },
  { id: "vip", label: "내빈", icon: "\u{2B50}" },
  { id: "attendees", label: "참석자", icon: "\u{1F465}" },
  { id: "notices", label: "공지", icon: "\u{1F4E2}" },
  { id: "emergency", label: "긴급", icon: "\u{1F6A8}" },
  { id: "program", label: "타이머", icon: "\u{23F1}" },
  { id: "awards", label: "포상", icon: "\u{1F3C6}" },
  { id: "supplies", label: "물품", icon: "\u{1F4E6}" },
  { id: "staff", label: "스태프", icon: "\u{1F46A}" },
];

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [vipGuests, setVipGuests] = useState(VIP_GUESTS);
  const [attendees, setAttendees] = useState(() => generateAttendees());
  const [notices, setNotices] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [staffTeams, setStaffTeams] = useState(["등록팀", "안내팀", "무대팀", "포상팀", "다과팀"]);
  const [toast, setToast] = useState("");
  const [clock, setClock] = useState(new Date());
  const [sheetStatus, setSheetStatus] = useState("idle"); // idle, loading, loaded, error
  const [sheetCount, setSheetCount] = useState(0);
  const contentRef = useRef(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  }, []);

  // Real-time clock
  useEffect(() => {
    const interval = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Google Sheets fetch
  const fetchAttendees = useCallback(async () => {
    setSheetStatus("loading");
    try {
      const res = await fetch(SHEET_CSV_URL);
      if (!res.ok) throw new Error("Fetch failed");
      const text = await res.text();
      const parsed = parseCSV(text);
      if (parsed.length > 0) {
        const mapped = parsed.map((p, i) => ({
          id: i + 1,
          name: p.name,
          org: p.org,
          zone: ZONES[i % ZONES.length],
          table: ATTENDEE_TABLES[Math.min(Math.floor(i / 10), ATTENDEE_TABLES.length - 1)]?.id || ATTENDEE_TABLES[0].id,
          checked: false,
        }));
        setAttendees(mapped);
        setSheetCount(parsed.length);
        setSheetStatus("loaded");
        showToast(`참석자 ${parsed.length}명 불러오기 완료`);
      } else {
        setSheetStatus("error");
        showToast("스프레드시트 데이터가 비어 있습니다");
      }
    } catch (err) {
      setSheetStatus("error");
      showToast("스프레드시트 연결 실패 — 기본 데이터 사용");
    }
  }, [showToast]);

  // Auto-fetch on mount
  useEffect(() => { fetchAttendees(); }, []);

  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, [tab]);

  // D-Day
  const eventDate = new Date("2026-04-22T15:00:00");
  const dDay = Math.ceil((eventDate - clock) / 86400000);
  const clockStr = clock.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

  return (
    <div className="app-shell" style={{ fontFamily: T.font, background: T.bg, color: T.text }}>
      {/* Header */}
      <header className="app-header">
        <div className="app-header-inner">
          <div style={{
            width: "36px", height: "36px", borderRadius: "50%",
            background: `linear-gradient(135deg, ${T.accent} 0%, ${T.accentDark} 100%)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "14px", fontWeight: 800, color: "#0a1616", flexShrink: 0,
          }}>40</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "16px", fontWeight: 800, color: T.accent, letterSpacing: "-0.3px" }}>
              서울복지 4.0 Staff
            </div>
            <div style={{ fontSize: "12px", color: T.textSec }}>
              2026. 4. 22 (수) 15:00 · 백범김구기념관
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: "16px", fontWeight: 700, color: T.accent, fontVariantNumeric: "tabular-nums" }}>
              {clockStr}
            </div>
            <div style={{ fontSize: "11px", color: dDay > 0 ? T.warn : T.success, fontWeight: 600 }}>
              {dDay > 0 ? `D-${dDay}` : dDay === 0 ? "D-DAY" : "행사 종료"}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div ref={contentRef} className="app-content">
        {tab === "dashboard" && <DashboardTab vipGuests={vipGuests} attendees={attendees} notices={notices} emergencies={emergencies} program={PROGRAM} />}
        {tab === "vip" && <VipTab guests={vipGuests} setGuests={setVipGuests} />}
        {tab === "attendees" && (
          <div>
            {/* Sheet status bar */}
            <div style={{
              ...cardStyle, display: "flex", alignItems: "center", gap: "8px",
              borderLeft: `3px solid ${sheetStatus === "loaded" ? T.success : sheetStatus === "error" ? T.danger : T.accent}`,
              padding: "10px 14px", marginBottom: "10px",
            }}>
              <span style={{ fontSize: "14px" }}>
                {sheetStatus === "loading" ? "⏳" : sheetStatus === "loaded" ? "✅" : sheetStatus === "error" ? "⚠️" : "📋"}
              </span>
              <div style={{ flex: 1, fontSize: "13px", color: T.textSec }}>
                {sheetStatus === "loading" && "스프레드시트 불러오는 중..."}
                {sheetStatus === "loaded" && `Google Sheets 연동 완료 (${sheetCount}명)`}
                {sheetStatus === "error" && "스프레드시트 연결 실패 — 기본 데이터 사용 중"}
                {sheetStatus === "idle" && "스프레드시트 연결 대기 중"}
              </div>
              <button style={{ ...ghostBtnStyle, padding: "5px 12px", fontSize: "12px" }} onClick={fetchAttendees}>
                새로고침
              </button>
            </div>
            <AttendeesTab attendees={attendees} setAttendees={setAttendees} />
          </div>
        )}
        {tab === "notices" && <NoticesTab notices={notices} setNotices={setNotices} />}
        {tab === "emergency" && <EmergencyTab emergencies={emergencies} setEmergencies={setEmergencies} staffTeams={staffTeams} />}
        {tab === "program" && <ProgramTab program={PROGRAM} />}
        {tab === "awards" && <AwardsTab />}
        {tab === "supplies" && <SuppliesTab />}
        {tab === "staff" && <StaffTab staffTeams={staffTeams} setStaffTeams={setStaffTeams} />}
      </div>

      {/* Bottom Nav */}
      <nav className="app-bottom-nav">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              color: tab === t.id ? T.accent : T.textMuted,
              fontFamily: T.font,
            }}
          >
            <span className="nav-icon">{t.icon}</span>
            <span className="nav-label" style={{ fontWeight: tab === t.id ? 700 : 400 }}>{t.label}</span>
          </button>
        ))}
      </nav>

      <Toast msg={toast} />
    </div>
  );
}
