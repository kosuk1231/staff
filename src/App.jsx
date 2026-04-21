import { useState, useMemo, useEffect, useCallback, useRef } from "react";

// ============================================================
// DATA
// ============================================================
const PROGRAM = [
  // 준비
  { id: "p0_1", time: "13:00", end: "14:00", title: "행사장 세팅", part: "준비", type: "setup" },
  { id: "p0_2", time: "14:00", end: "14:30", title: "시상식 리허설", part: "준비", type: "rehearsal" },
  { id: "p0_3", time: "14:00", end: "15:00", title: "참여자 접수 / 포토존 운영", part: "접수", type: "reception" },
  // 1부 기념특강
  { id: "p1_1", time: "15:00", end: "15:05", title: "1부 개회", part: "1부", type: "opening" },
  { id: "p1_2", time: "15:05", end: "15:20", title: "특별강연1 사회복지40년, 전문성의 역사와 미래 비전", speaker: "김아래미 정책위원장/서울여자대학교 교수", part: "1부", type: "lecture" },
  { id: "p1_3", time: "15:20", end: "15:35", title: "특별강연2 디지털 전환 시대, 그럼에도 사람", speaker: "윤석원 대표/(주)에이아이웍스", part: "1부", type: "lecture" },
  { id: "p1_4", time: "15:35", end: "15:50", title: "특별강연3 AI 시대, 사회복지의 기준을 다시 세우다", speaker: "황흥기 대표/넥스트임팩트", part: "1부", type: "lecture" },
  { id: "p1_5", time: "15:50", end: "16:00", title: "1부 클로징 및 안내", part: "1부", type: "closing" },
  // 2부 기념식 및 시상식
  { id: "p2_1", time: "16:00", end: "16:10", title: "내빈접수", part: "2부", type: "reception" },
  { id: "p2_2", time: "16:10", end: "16:12", title: "2부 개회", part: "2부", type: "opening" },
  { id: "p2_3", time: "16:12", end: "16:17", title: "내빈 소개", part: "2부", type: "intro" },
  { id: "p2_4", time: "16:17", end: "16:19", title: "사회복지사 선서", part: "2부", type: "ceremony" },
  { id: "p2_5", time: "16:19", end: "16:22", title: "활동브리핑(동영상)", part: "2부", type: "video" },
  { id: "p2_6", time: "16:22", end: "16:27", title: "기념사", speaker: "곽경인 서울시사회복지사협회 회장", part: "2부", type: "speech" },
  { id: "p2_7", time: "16:27", end: "16:47", title: "내빈 축사", speaker: "오세훈 서울시장 외 주요내빈", part: "2부", type: "speech" },
  { id: "p2_8", time: "16:47", end: "17:07", title: "시상 (감사패·미래인재상·미래리더상·비전리더상)", part: "2부", type: "award" },
  { id: "p2_9", time: "17:07", end: "17:12", title: "비전발표 사회복지 4.0, 다음 10년의 방향", speaker: "강현덕 기획위원장/영등포구가족센터 센터장", part: "2부", type: "summary" },
  { id: "p2_10", time: "17:12", end: "17:15", title: "기념사진 촬영 및 폐회", part: "2부", type: "closing" },
];


// 내빈 테이블 설정 (실제 내빈명단 기준)
const TABLE_CONFIG = {
  2:  { seats: 10, label: "전현직 회장단", color: "#8B5CF6" },
  3:  { seats: 10, label: "주빈석",       color: "#C8A44E" },
  4:  { seats: 10, label: "연대회의",     color: "#10B981" },
  5:  { seats: 10, label: "연대회의",     color: "#06B6D4" },
  8:  { seats: 10, label: "감사·재단법인", color: "#F97316" },
  10: { seats: 10, label: "서울시청",     color: "#EC4899" },
  12: { seats: 10, label: "전현직",       color: "#A78BFA" },
};

const VIP_COLORS = ["#C8A44E","#8B5CF6","#10B981","#06B6D4","#F97316","#EC4899","#A78BFA","#F59E0B","#84CC16","#EF4444"];
function getVipColor(tableId) {
  if (TABLE_CONFIG[tableId]) return TABLE_CONFIG[tableId].color;
  return VIP_COLORS[(tableId - 1) % VIP_COLORS.length];
}

// 10개 좌석 외각 점 좌표 (SVG viewBox 130×130 기준, 중심 65,65, 반지름 52)
const SEAT_DOTS = [
  [65,    13   ],  // seat 1  — 12시
  [95.7,  23.4 ],  // seat 2  — 1~2시
  [114.4, 51.6 ],  // seat 3  — 3시
  [113,   81.9 ],  // seat 4  — 4~5시
  [95.7,  106.6],  // seat 5  — 5~6시
  [65,    117  ],  // seat 6  — 6시
  [34.3,  106.6],  // seat 7  — 7~8시
  [15.6,  81.9 ],  // seat 8  — 8~9시
  [15.6,  51.6 ],  // seat 9  — 9~10시
  [34.3,  23.4 ],  // seat 10 — 10~11시
];

// 순수 내빈 전용 테이블 (참석자 좌석 배정 제외 대상)
const VIP_TABLE_IDS = [3, 4, 10];
const ALL_TABLE_IDS = Array.from({ length: 30 }, (_, i) => i + 1);

const ATTENDEE_TABLES = ALL_TABLE_IDS.filter(id => !VIP_TABLE_IDS.includes(id)).map(id => ({
  id,
  label: `테이블 ${id}`,
}));

const MAP_ROWS = [
  [1, 2, 3, 4, 5, 6],
  [7, 8, 9, 10, 11, 12, 13],
  [14, 15, 16, 17, 18, 19],
  [20, 21, 22, 23, 24, 25, 26],
  [27, 28, 29, 30],
];


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
  pink: "#E27794",
  pinkBg: "rgba(226,119,148,0.12)",
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
// TAB: DASHBOARD (with emergency banner at top)
// ============================================================
function DashboardTab({ vipGuests, attendees, notices, emergencies, program, setTab }) {
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
  const activeEmergencies = emergencies.filter((e) => e.status !== "done");

  // Recent check-in counter (last 5 min)
  const fiveMinAgo = Date.now() - 5 * 60 * 1000;
  const recentCheckins = attendees.filter(a => a.checkedAt && a.checkedAt > fiveMinAgo).length
    + vipGuests.filter(v => v.checkedAt && v.checkedAt > fiveMinAgo).length;

  return (
    <div>
      {/* ★ EMERGENCY BANNER AT TOP */}
      {activeEmergencies.length > 0 && (
        <div style={{
          ...cardStyle, marginBottom: "12px", padding: "14px 16px",
          background: "linear-gradient(135deg, rgba(226,75,74,0.15) 0%, rgba(226,75,74,0.05) 100%)",
          border: `1px solid rgba(226,75,74,0.4)`,
          borderLeft: `4px solid ${T.danger}`,
          animation: "emergencyPulse 2s ease-in-out infinite",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <span style={{ fontSize: "18px", animation: "emergencyDot 1s infinite" }}>🚨</span>
            <span style={{ fontSize: "15px", fontWeight: 800, color: T.danger }}>
              긴급 협조 요청 ({activeEmergencies.length}건)
            </span>
          </div>
          {activeEmergencies.slice(0, 2).map(e => (
            <div key={e.id} style={{ fontSize: "14px", color: T.text, marginBottom: "4px", lineHeight: 1.4 }}>
              <span style={badgeStyle(T.dangerBg, T.danger)}>{e.urgency === "high" ? "긴급" : "보통"}</span>
              <span style={{ marginLeft: "8px" }}>{e.text}</span>
              <span style={{ color: T.textMuted, fontSize: "12px", marginLeft: "6px" }}>{e.time}</span>
            </div>
          ))}
          {activeEmergencies.length > 2 && (
            <div style={{ fontSize: "12px", color: T.textMuted, marginTop: "4px" }}>+ {activeEmergencies.length - 2}건 더</div>
          )}
          <button
            onClick={() => setTab("emergency")}
            style={{ ...ghostBtnStyle, marginTop: "8px", padding: "6px 14px", fontSize: "12px", borderColor: T.danger, color: T.danger }}
          >
            자세히 보기 →
          </button>
        </div>
      )}

      <div className="stat-grid">
        <StatCard icon={"\u{1F465}"} label="전체" value={total} sub={`참석 ${totalChecked}`} accent={T.accent} />
        <StatCard icon={"\u{2B50}"} label="내빈" value={`${vipChecked}/${vipGuests.length}`} accent={T.accent} />
        <StatCard icon={"\u{2705}"} label="참석자" value={`${attChecked}/${attendees.length}`} accent={T.success} />
        <StatCard icon={"\u{1F6A8}"} label="긴급" value={activeEmergencies.length} accent={activeEmergencies.length > 0 ? T.danger : T.textMuted} />
      </div>

      <ProgressBar value={totalChecked} max={total} color={T.accent} />
      <div style={{ fontSize: "13px", color: T.textSec, textAlign: "right", marginTop: "4px", marginBottom: "14px" }}>
        전체 참석률 {total > 0 ? Math.round((totalChecked / total) * 100) : 0}%
      </div>

      {/* Check-in speed widget */}
      {recentCheckins > 0 && (
        <div style={{ ...cardStyle, borderLeft: `3px solid ${T.success}`, padding: "12px 16px", marginBottom: "10px" }}>
          <div style={{ fontSize: "13px", color: T.success, fontWeight: 600 }}>최근 5분간 체크인</div>
          <div style={{ fontSize: "22px", fontWeight: 800, color: T.success }}>{recentCheckins}명</div>
        </div>
      )}

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
      <div style={{ ...cardStyle, padding: "20px" }}>
        <div style={{ fontSize: "15px", fontWeight: 700, color: T.accent, marginBottom: "20px", display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "18px" }}>⏱</span> 프로그램 타임라인
        </div>
        <div style={{ position: "relative", paddingLeft: "16px" }}>
          {/* Vertical Line */}
          <div style={{
            position: "absolute", top: "8px", bottom: "16px", left: "3px", width: "2px",
            background: `linear-gradient(to bottom, rgba(145,201,192,0.5) 0%, rgba(255,255,255,0.05) 100%)`
          }} />

          {program.map((p, i) => {
            const isCurrent = currentProg && currentProg.id === p.id;
            const [eh, em] = p.end.split(":").map(Number);
            const endTime = new Date(now); endTime.setHours(eh, em, 0);
            const isPast = now > endTime;
            
            return (
              <div key={p.id} style={{
                position: "relative", marginBottom: i === program.length - 1 ? 0 : "22px",
                opacity: isPast ? 0.35 : 1, transition: "all 0.3s"
              }}>
                {/* Dot */}
                <div style={{
                  position: "absolute", left: "-16.5px", top: isCurrent ? "8px" : "3px",
                  width: isCurrent ? "11px" : "9px", height: isCurrent ? "11px" : "9px", borderRadius: "50%",
                  background: isCurrent ? T.accent : p.part === "2부" ? "#8B5CF6" : T.textMuted,
                  boxShadow: isCurrent ? `0 0 12px ${T.accent}` : "none",
                  border: `2px solid ${isCurrent ? "rgba(145,201,192,0.2)" : T.bg}`, zIndex: 2
                }} />
                
                {/* Content Box */}
                <div style={{ display: "flex", gap: "14px", background: isCurrent ? "rgba(145,201,192,0.08)" : "transparent", padding: isCurrent ? "10px 14px" : "0 4px", borderRadius: T.radiusSm, border: isCurrent ? `1px solid rgba(145,201,192,0.2)` : "1px solid transparent", marginLeft: isCurrent ? "-10px" : "0", transition: "all 0.2s" }}>
                  <div style={{ width: "38px", flexShrink: 0, fontSize: "14px", color: isCurrent ? T.accent : T.textSec, fontWeight: 800, paddingTop: isCurrent ? "0px" : "1px" }}>{p.time}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "15px", fontWeight: isCurrent ? 800 : 500, color: isCurrent ? T.accent : T.text, display: "flex", alignItems: "center", gap: "8px", lineHeight: 1.3 }}>
                      <span>{p.title}</span>
                      {isCurrent && <span style={{ fontSize: "10px", padding: "2px 6px", background: T.accent, color: T.bg, borderRadius: "12px", fontWeight: 800, letterSpacing: "-0.3px" }}>LIVE</span>}
                    </div>
                    {p.speaker && <div style={{ fontSize: "13px", color: T.textMuted, marginTop: "4px" }}>{p.speaker}</div>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
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

    </div>
  );
}

// ============================================================
// TAB: VIP GUESTS
// ============================================================
function VipTab() {
  return (
    <div style={{ height: "calc(100vh - 125px)", margin: "-12px" }}>
      <iframe 
        src="/guest.html" 
        style={{ width: "100%", height: "100%", border: "none", display: "block" }} 
        title="내빈 의전 시스템"
      />
    </div>
  );
}

// ============================================================
// TAB: GUESTBOOK (iframe → wall.html)
// ============================================================
function GuestbookTab() {
  return (
    <div style={{ height: "calc(100vh - 120px)", minHeight: "500px" }}>
      <iframe
        src="/wall.html"
        style={{ width: "100%", height: "100%", border: "none", borderRadius: "12px" }}
        title="전자방명록"
        allow="camera"
      />
    </div>
  );
}

// ============================================================
// ADD ATTENDEE MODAL
// ============================================================
function AddAttendeeModal({ isOpen, onClose, onAdd }) {
  const [name, setName] = useState("");
  const [org, setOrg] = useState("");
  const [contact, setContact] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), org: org.trim(), contact: contact.trim() });
    setName(""); setOrg(""); setContact("");
    onClose();
  };

  const handleKey = (e) => { if (e.key === "Enter") handleSubmit(); };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 9100, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}>
      <div style={{ background: T.bgCard, borderRadius: "16px", padding: "28px 24px", maxWidth: "340px", width: "90%", border: `1px solid rgba(226,75,74,0.25)` }}
        onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: "17px", fontWeight: 700, color: T.danger, marginBottom: "20px" }}>+ 참석자 현장 추가</div>
        <div style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "12px", color: T.textSec, marginBottom: "4px" }}>이름 *</div>
          <input autoFocus value={name} onChange={e => setName(e.target.value)} onKeyDown={handleKey}
            placeholder="성명" style={{ ...inputStyle, boxSizing: "border-box" }} />
        </div>
        <div style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "12px", color: T.textSec, marginBottom: "4px" }}>소속</div>
          <input value={org} onChange={e => setOrg(e.target.value)} onKeyDown={handleKey}
            placeholder="기관/단체" style={{ ...inputStyle, boxSizing: "border-box" }} />
        </div>
        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "12px", color: T.textSec, marginBottom: "4px" }}>연락처</div>
          <input value={contact} onChange={e => setContact(e.target.value)} onKeyDown={handleKey}
            placeholder="010-0000-0000" style={{ ...inputStyle, boxSizing: "border-box" }} />
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button style={{ ...ghostBtnStyle, flex: 1 }} onClick={onClose}>취소</button>
          <button
            style={{ ...accentBtnStyle, flex: 1, background: T.danger, opacity: name.trim() ? 1 : 0.4 }}
            disabled={!name.trim()} onClick={handleSubmit}>
            추가
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// TAB: ATTENDEES — Simplified (name + checked status only)
// ============================================================
function AttendeesTab({ attendees, setAttendees, vipGuests, showToast }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [detail, setDetail] = useState(null);
  const [pickTable, setPickTable] = useState(null);
  const [pickSeat, setPickSeat] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => { setPickTable(null); setPickSeat(null); }, [detail]);

  const toggle = async (a) => {
    const newChecked = !a.checked;
    setAttendees(prev => prev.map(x => x.id === a.id
      ? { ...x, checked: newChecked, checkedAt: newChecked ? Date.now() : null }
      : x));
    if (ATTENDEE_API_URL) {
      try {
        await fetch(ATTENDEE_API_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "toggleAttendance", name: a.name, org: a.org, rowIndex: a.rowIndex, checked: newChecked }),
        });
      } catch (e) { /* silent */ }
    }
    showToast(newChecked ? `${a.name} 님 참석 확인` : `${a.name} 님 참석 취소`);
  };

  const handleAdd = async ({ name, org, contact }) => {
    const tmpId = Date.now();
    const newAttendee = {
      id: tmpId, name, org, contact, birthdate: "", email: "",
      rowIndex: null, tableNo: "", table: 0, seat: 0, checked: false, checkedAt: null,
    };
    setAttendees(prev => [...prev, newAttendee]);
    showToast(`${name} 님 현장 추가 완료`);
    if (ATTENDEE_API_URL) {
      try {
        const res = await fetch(ATTENDEE_API_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "addAttendee", name, org, contact }),
        });
        const json = await res.json();
        if (json.success && json.rowIndex) {
          setAttendees(prev => prev.map(a => a.id === tmpId ? { ...a, rowIndex: json.rowIndex } : a));
        }
      } catch (e) { /* silent */ }
    }
  };

  const assignSeat = async (a) => {
    if (!pickTable || !pickSeat) return;
    const tableNo = `${pickTable}-${pickSeat}`;
    setAttendees(prev => prev.map(x => x.id === a.id ? { ...x, tableNo, table: pickTable, seat: pickSeat } : x));
    setDetail(null);
    if (ATTENDEE_API_URL) {
      try {
        await fetch(ATTENDEE_API_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "assignSeat", name: a.name, org: a.org, rowIndex: a.rowIndex, tableNo }),
        });
      } catch (e) { /* silent */ }
    }
    showToast(`${a.name} 님 좌석 ${tableNo} 배정 완료`);
  };

  // 이미 배정된 좌석 Set — 참석자 + 내빈 모두 포함 (예: "10-1")
  const occupiedSeats = useMemo(() => new Set([
    ...attendees.filter(a => a.tableNo).map(a => a.tableNo),
    ...(vipGuests || []).filter(v => v.table > 0 && v.seat > 0).map(v => `${v.table}-${v.seat}`),
  ]), [attendees, vipGuests]);

  // 테이블별 잔여 좌석 정보 (테이블 6~30)
  const tableOptions = useMemo(() => ATTENDEE_TABLES.map(t => {
    const freeSeats = [];
    for (let s = 1; s <= 10; s++) {
      if (!occupiedSeats.has(`${t.id}-${s}`)) freeSeats.push(s);
    }
    return { id: t.id, freeSeats, freeCount: freeSeats.length };
  }).filter(t => t.freeCount > 0), [occupiedSeats]);

  // 선택된 테이블의 잔여 좌석
  const seatsForPickedTable = useMemo(
    () => tableOptions.find(t => t.id === pickTable)?.freeSeats ?? [],
    [pickTable, tableOptions]
  );

  const filtered = useMemo(() => attendees.filter(a => {
    if (search && !a.name.includes(search) && !(a.org || "").includes(search)) return false;
    if (filterStatus === "checked" && !a.checked) return false;
    if (filterStatus === "unchecked" && a.checked) return false;
    return true;
  }), [attendees, search, filterStatus]);

  const stats = { total: attendees.length, checked: attendees.filter(a => a.checked).length };
  const pct = stats.total ? Math.round((stats.checked / stats.total) * 100) : 0;

  return (
    <div>
      <div className="stat-grid">
        <StatCard icon="👥" label="전체" value={stats.total} accent={T.accent} />
        <StatCard icon="✅" label="참석" value={stats.checked} sub={`${pct}%`} accent={T.success} />
        <StatCard icon="⏳" label="미참석" value={stats.total - stats.checked} accent={T.textMuted} />
      </div>
      <ProgressBar value={stats.checked} max={stats.total} color={T.accent} />
      <div style={{ fontSize: "12px", color: T.textSec, textAlign: "right", marginTop: "4px", marginBottom: "12px" }}>
        참석률 {pct}%
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="이름 또는 소속 검색" />
      <FilterPills
        options={[{ value: "all", label: "전체" }, { value: "checked", label: "참석" }, { value: "unchecked", label: "미참석" }]}
        value={filterStatus} onChange={setFilterStatus}
      />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
        <div style={{ fontSize: "13px", color: T.textSec }}>{filtered.length}명 표시 중</div>
        <button style={{ ...accentBtnStyle, background: T.danger, padding: "7px 14px", fontSize: "13px" }}
          onClick={() => setShowAddModal(true)}>
          + 현장 추가
        </button>
      </div>

      <AddAttendeeModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onAdd={handleAdd} />

      {filtered.map(a => (
        <div key={a.id} style={{ ...cardStyle, display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px" }}>
          {/* 체크 버튼: tableNo 없으면 모달 오픈, 있으면 바로 토글 */}
          <div
            onClick={() => a.tableNo ? toggle(a) : setDetail(a)}
            style={{
              width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0, cursor: "pointer",
              background: a.checked ? T.successBg : "rgba(255,255,255,0.05)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "14px", border: a.checked ? `2px solid ${T.success}` : `2px solid ${T.border}`,
              color: a.checked ? T.success : T.textMuted, transition: "all 0.2s",
            }}>
            {a.checked ? "✓" : ""}
          </div>
          {/* 정보 */}
          <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => setDetail(a)}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ fontWeight: 700, color: T.text, fontSize: "15px" }}>{a.name}</span>
              {a.org && <span style={{ fontSize: "12px", color: T.textSec }}>{a.org}</span>}
              {a.tableNo
                ? <span style={{ ...badgeStyle("rgba(145,201,192,0.12)", T.accent), fontSize: "11px", padding: "2px 8px" }}>💺 {a.tableNo}</span>
                : <span style={{ ...badgeStyle("rgba(232,168,72,0.12)", T.warn), fontSize: "11px", padding: "2px 8px" }}>미배정</span>
              }
            </div>
          </div>
          {/* 상태 뱃지 */}
          <span style={badgeStyle(a.checked ? T.successBg : "rgba(255,255,255,0.05)", a.checked ? T.success : T.textMuted)}>
            {a.checked ? "참석" : "대기"}
          </span>
        </div>
      ))}
      {filtered.length > 100 && (
        <div style={{ textAlign: "center", padding: "12px", fontSize: "13px", color: T.textSec }}>
          + {filtered.length - 100}명 더 있음 (검색으로 찾아주세요)
        </div>
      )}

      {/* 상세 모달 */}
      {detail && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setDetail(null)}>
          <div style={{ background: T.bgCard, borderRadius: "16px", padding: "28px 24px", maxWidth: "340px", width: "90%", border: `1px solid ${T.border}` }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: "20px", fontWeight: 800, color: T.text, marginBottom: "4px" }}>{detail.name}</div>
            {detail.org && <div style={{ fontSize: "13px", color: T.textSec, marginBottom: "14px" }}>{detail.org}</div>}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
              <span style={{ fontSize: "12px", color: T.textMuted }}>테이블</span>
              <span style={{ ...badgeStyle(detail.tableNo ? "rgba(145,201,192,0.12)" : "rgba(232,168,72,0.12)", detail.tableNo ? T.accent : T.warn), fontSize: "13px", fontWeight: 700 }}>
                {detail.tableNo || "미배정"}
              </span>
            </div>
            {/* 좌석 배정: 미배정인 경우 항상 표시 */}
            {!detail.tableNo && (
              <div style={{ marginTop: "14px", padding: "12px", background: "rgba(255,255,255,0.03)", borderRadius: "10px", border: `1px solid ${T.border}` }}>
                {/* 1단계: 테이블 선택 */}
                <div style={{ fontSize: "11px", color: T.textMuted, marginBottom: "6px", fontWeight: 600 }}>
                  {pickTable ? `테이블 ${pickTable} 선택됨 — 좌석을 고르세요` : "테이블 선택"}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: pickTable ? "10px" : "0" }}>
                  {tableOptions.map(t => (
                    <button key={t.id}
                      onClick={() => { setPickTable(t.id); setPickSeat(null); }}
                      style={{
                        padding: "5px 9px", borderRadius: "7px", fontSize: "13px", fontWeight: 700,
                        background: pickTable === t.id ? T.accentBg : "rgba(255,255,255,0.05)",
                        border: `1px solid ${pickTable === t.id ? T.accent : T.border}`,
                        color: pickTable === t.id ? T.accent : T.textSec,
                        cursor: "pointer", fontFamily: "inherit",
                      }}>
                      {t.id}<span style={{ fontSize: "10px", opacity: 0.65, marginLeft: "3px" }}>({t.freeCount})</span>
                    </button>
                  ))}
                </div>
                {/* 2단계: 좌석 선택 */}
                {pickTable && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "10px" }}>
                    {seatsForPickedTable.map(s => (
                      <button key={s}
                        onClick={() => setPickSeat(s)}
                        style={{
                          width: "38px", height: "38px", borderRadius: "8px", fontSize: "14px", fontWeight: 700,
                          background: pickSeat === s ? T.accentBg : "rgba(255,255,255,0.05)",
                          border: `1px solid ${pickSeat === s ? T.accent : T.border}`,
                          color: pickSeat === s ? T.accent : T.text,
                          cursor: "pointer", fontFamily: "inherit",
                        }}>
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                <button
                  style={{ ...accentBtnStyle, width: "100%", opacity: (pickTable && pickSeat) ? 1 : 0.4 }}
                  disabled={!pickTable || !pickSeat}
                  onClick={() => assignSeat(detail)}>
                  {pickTable && pickSeat ? `${pickTable}-${pickSeat} 배정` : "좌석 배정"}
                </button>
              </div>
            )}
            <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
              <button style={{ ...ghostBtnStyle, flex: 1 }} onClick={() => setDetail(null)}>닫기</button>
              <button
                style={{ ...accentBtnStyle, flex: 1, background: detail.checked ? T.danger : T.success }}
                onClick={() => { toggle(detail); setDetail(null); }}>
                {detail.checked ? "참석 취소" : "참석 확인"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// TAB: SEATING — Large table-focused view
// ============================================================
function SeatingTab({ attendees, vipGuests, showToast }) {
  const [selectedTable, setSelectedTable] = useState(null);

  const vipTableIds = useMemo(
    () => [...new Set(vipGuests.filter(v => v.table > 0).map(v => v.table))],
    [vipGuests]
  );

  // Compute per-table stats (내빈 + 참석자 통합)
  const tableData = useMemo(() => {
    const result = [];
    ALL_TABLE_IDS.forEach(id => {
      const isVip = vipTableIds.includes(id);
      const members = [
        ...vipGuests.filter(v => v.table === id),
        ...attendees.filter(a => a.table === id),
      ];
      const checked = members.filter(m => m.checked).length;
      const total = members.length;
      const isFull = total > 0 && checked === total;
      result.push({ id, isVip, members, checked, total, isFull, config: TABLE_CONFIG[id] });
    });
    return result;
  }, [attendees, vipGuests, vipTableIds]);

  const selectedData = selectedTable ? tableData.find(t => t.id === selectedTable) : null;

  return (
    <div>
      {/* Summary stats */}
      <div className="stat-grid">
        <StatCard icon="🪑" label="전체 테이블" value={ALL_TABLE_IDS.length} accent={T.accent} />
        <StatCard icon="⭐" label="내빈 테이블" value={vipTableIds.length} accent="#C8A44E" />
        <StatCard
          icon="✅"
          label="배석 완료"
          value={tableData.filter(t => t.isFull).length}
          accent={T.success}
        />
      </div>

      {/* Table Grid — LARGE cards */}
      <div className="seating-grid">
        {tableData.map(t => {
          const CAPACITY = 10;
          const vipColor = t.isVip ? getVipColor(t.id) : T.accent;
          const baseColor = t.isVip ? vipColor : T.accent;
          const isSelected = selectedTable === t.id;
          const assignPct = Math.min(100, Math.round((t.total / CAPACITY) * 100));
          const checkPct = Math.min(100, Math.round((t.checked / CAPACITY) * 100));
          const hasAssigned = t.total > 0;
          const borderColor = t.isVip ? vipColor : (t.isFull ? T.success : (hasAssigned ? T.accent : T.border));

          return (
            <button
              key={t.id}
              onClick={() => setSelectedTable(isSelected ? null : t.id)}
              style={{
                background: isSelected
                  ? "rgba(145,201,192,0.12)"
                  : t.isFull
                    ? "rgba(60,179,113,0.08)"
                    : hasAssigned
                      ? "rgba(145,201,192,0.04)"
                      : T.bgCard,
                border: `2px solid ${isSelected ? T.accent : borderColor}`,
                borderRadius: "16px",
                padding: "16px 14px",
                cursor: "pointer",
                textAlign: "center",
                fontFamily: T.font,
                transition: "all 0.2s",
                animation: t.isFull ? "seatFillGlow 3s ease-in-out infinite" : "none",
              }}
            >
              {/* Table Number */}
              <div style={{
                fontSize: "32px", fontWeight: 900,
                color: t.isVip ? vipColor : (t.isFull ? T.success : (hasAssigned ? T.accent : T.text)),
                lineHeight: 1, marginBottom: "6px",
              }}>
                {t.id}
              </div>

              {/* Label */}
              <div style={{ fontSize: "10px", fontWeight: 600, color: t.isVip ? vipColor : T.textSec, marginBottom: "8px" }}>
                {t.isVip ? (t.config?.label || "내빈석") : `테이블 ${t.id}`}
              </div>

              {/* Counts: 착석 / 배정 */}
              <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "8px", fontSize: "11px" }}>
                <span style={{ color: T.success, fontWeight: 700 }}>
                  착석 {t.checked}
                </span>
                <span style={{ color: T.textMuted }}>/</span>
                <span style={{ color: hasAssigned ? T.accent : T.textMuted, fontWeight: 700 }}>
                  배정 {t.total}
                </span>
              </div>

              {/* 2단 진행 바: 뒤=배정, 앞=착석 */}
              <div style={{ position: "relative", height: "6px", borderRadius: "3px", background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                {/* 배정 바 (dim) */}
                <div style={{
                  position: "absolute", inset: 0, width: `${assignPct}%`,
                  background: t.isVip ? `${vipColor}50` : "rgba(145,201,192,0.35)",
                  borderRadius: "3px", transition: "width 0.4s",
                }} />
                {/* 착석 바 (bright) */}
                <div style={{
                  position: "absolute", inset: 0, width: `${checkPct}%`,
                  background: t.isFull ? T.success : baseColor,
                  borderRadius: "3px", transition: "width 0.4s",
                }} />
              </div>

              {/* 배정/용량 표시 */}
              <div style={{ marginTop: "5px", fontSize: "10px", color: T.textMuted, textAlign: "right" }}>
                {t.total}/{CAPACITY}석
              </div>

              {t.isFull && (
                <div style={{ marginTop: "4px", fontSize: "10px", fontWeight: 700, color: T.success, letterSpacing: "1px" }}>
                  ✓ 완료
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Table Detail */}
      {selectedData && (
        <div style={{
          ...cardStyle, marginTop: "16px", padding: "18px",
          borderTop: `3px solid ${selectedData.isVip ? getVipColor(selectedData.id) : T.accent}`,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "18px", fontWeight: 800, color: selectedData.isVip ? getVipColor(selectedData.id) : T.accent }}>
              테이블 {selectedData.id} {selectedData.isVip && `(${selectedData.config?.label || "내빈석"})`}
            </span>
            <span style={badgeStyle(
              selectedData.isFull ? T.successBg : T.accentBg,
              selectedData.isFull ? T.success : T.accent,
            )}>
              {selectedData.checked}/{selectedData.total}
            </span>
          </div>

          {selectedData.members.slice().sort((a, b) => (a.seat || 0) - (b.seat || 0)).map((m, idx) => (
            <div key={m.id || idx} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "8px 4px", borderBottom: idx < selectedData.members.length - 1 ? `1px solid ${T.border}` : "none",
            }}>
              <div>
                <span style={{ fontSize: "14px", fontWeight: 700, color: m.checked ? T.textSec : T.text }}>
                  {m.name}
                </span>
                <span style={{ fontSize: "12px", color: T.textMuted, marginLeft: "8px" }}>
                  {m.org}
                </span>
              </div>
              <span style={badgeStyle(
                m.checked ? T.successBg : "rgba(255,255,255,0.05)",
                m.checked ? T.success : T.textMuted,
              )}>
                {m.checked ? "착석" : "대기"}
              </span>
            </div>
          ))}

          {selectedData.members.length === 0 && (
            <div style={{ textAlign: "center", padding: "16px", color: T.textMuted, fontSize: "13px" }}>
              배정된 인원이 없습니다.
            </div>
          )}
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
// TAB: SEATING MAP — Visual floor plan with seat dots
// ============================================================
function SeatingMapTab({ attendees, vipGuests }) {
  const [selectedTable, setSelectedTable] = useState(null);

  const vipTableIds = useMemo(
    () => [...new Set(vipGuests.filter(v => v.table > 0).map(v => v.table))],
    [vipGuests]
  );

  // 테이블별 좌석 상태 맵: { tableId: { seatNum: 'checked' | 'assigned' } }
  const seatStateMap = useMemo(() => {
    const map = {};
    ALL_TABLE_IDS.forEach(id => { map[id] = {}; });
    attendees.forEach(a => {
      if (a.table && a.seat) {
        map[a.table] = map[a.table] || {};
        if (a.checked) map[a.table][a.seat] = "checked";
        else if (!map[a.table][a.seat]) map[a.table][a.seat] = "assigned";
      }
    });
    vipGuests.forEach(v => {
      if (v.table && v.seat) {
        map[v.table] = map[v.table] || {};
        if (v.checked) map[v.table][v.seat] = "checked";
        else if (!map[v.table][v.seat]) map[v.table][v.seat] = "assigned";
      }
    });
    return map;
  }, [attendees, vipGuests]);

  // 테이블별 전체/착석 수 (내빈 + 참석자 통합)
  const tableStats = useMemo(() => {
    const stats = {};
    ALL_TABLE_IDS.forEach(id => {
      const isVip = vipTableIds.includes(id);
      const members = [
        ...vipGuests.filter(v => v.table === id),
        ...attendees.filter(a => a.table === id),
      ];
      const checked = members.filter(m => m.checked).length;
      stats[id] = { total: members.length, checked, members, isVip };
    });
    return stats;
  }, [attendees, vipGuests, vipTableIds]);

  const renderTableSVG = (tableId, svgSize) => {
    const isVip = vipTableIds.includes(tableId);
    const cfg = TABLE_CONFIG[tableId];
    const color = isVip ? getVipColor(tableId) : T.accent;
    const stat = tableStats[tableId] || { total: 0, checked: 0 };
    const isFull = stat.total > 0 && stat.checked === stat.total;
    const finalColor = isFull ? T.success : color;
    const seatStates = seatStateMap[tableId] || {};

    const label = isVip ? (cfg?.label || "내빈") : `T${tableId}`;
    const isSelected = selectedTable === tableId;

    return (
      <div
        key={tableId}
        onClick={() => setSelectedTable(isSelected ? null : tableId)}
        style={{
          cursor: "pointer",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
          filter: isFull ? `drop-shadow(0 0 8px ${T.success}80)` : "none",
          transition: "transform 0.15s, filter 0.3s",
          transform: isSelected ? "scale(1.1)" : "scale(1)",
        }}
        title={`테이블 ${tableId} — ${stat.checked}/${stat.total}`}
      >
        <svg width={svgSize} height={svgSize} viewBox="0 0 130 130">
          {/* 중앙 테이블 원 */}
          <circle
            cx="65" cy="65" r="36"
            fill={isFull ? `${T.success}18` : (isSelected ? `${color}18` : "#111f1f")}
            stroke={isSelected ? color : (isFull ? T.success : `${color}80`)}
            strokeWidth={isSelected ? "3" : "2"}
          />
          {/* 라벨 */}
          <text x="65" y={stat.total > 0 ? "60" : "65"} textAnchor="middle"
            fill={isFull ? T.success : color}
            fontSize={isVip ? "8" : "10"} fontWeight="700" fontFamily="sans-serif">
            {label}
          </text>
          {/* 수치 */}
          {stat.total > 0 && (
            <text x="65" y="75" textAnchor="middle"
              fill={isFull ? T.success : "#e8eded"}
              fontSize="11" fontWeight="900" fontFamily="sans-serif">
              {isFull ? `✓${stat.checked}` : `${stat.checked}/${stat.total}`}
            </text>
          )}
          {/* 외각 좌석 점 10개 */}
          {SEAT_DOTS.map(([cx, cy], dotIdx) => {
            const seatNum = dotIdx + 1;
            const state = seatStates[seatNum]; // 'checked' | 'assigned' | undefined
            return (
              <circle
                key={dotIdx}
                cx={cx} cy={cy}
                r={state === "checked" ? "7.5" : state === "assigned" ? "6" : "5.5"}
                fill={state === "checked" ? finalColor : state === "assigned" ? `${finalColor}38` : `${finalColor}12`}
                stroke={state === "checked" ? finalColor : state === "assigned" ? `${finalColor}70` : `${finalColor}30`}
                strokeWidth="1.5"
              />
            );
          })}
        </svg>
        <div style={{ fontSize: "9px", color: isFull ? T.success : (isVip ? color : T.textMuted), fontWeight: isFull ? 700 : 400 }}>
          {isFull ? "✓ 만석" : `T${tableId}`}
        </div>
      </div>
    );
  };

  const totalChecked = ALL_TABLE_IDS.reduce((s, id) => s + (tableStats[id]?.checked || 0), 0);
  const totalSeats = ALL_TABLE_IDS.reduce((s, id) => s + (tableStats[id]?.total || 0), 0);
  const fullTables = ALL_TABLE_IDS.filter(id => {
    const s = tableStats[id];
    return s && s.total > 0 && s.checked === s.total;
  }).length;

  const selectedStat = selectedTable ? tableStats[selectedTable] : null;

  return (
    <div>
      {/* 요약 통계 */}
      <div className="stat-grid" style={{ marginBottom: "12px" }}>
        <StatCard icon="🗺️" label="전체 테이블" value={ALL_TABLE_IDS.length} accent={T.accent} />
        <StatCard icon="✅" label="만석 테이블" value={fullTables} accent={T.success} />
        <StatCard icon="🪑" label="착석 인원" value={`${totalChecked}/${totalSeats}`} accent={T.accent} />
      </div>

      {/* 무대 */}
      <div style={{
        background: "linear-gradient(135deg, #162828, #1e3a3a)",
        border: `1px solid ${T.accentBorder}`,
        borderRadius: "10px",
        textAlign: "center",
        padding: "10px",
        fontSize: "13px", fontWeight: 700, color: T.accent, letterSpacing: "3px",
        marginBottom: "20px",
      }}>
        S T A G E &nbsp;（무대）
      </div>

      {/* 테이블 배치도 */}
      <div style={{ overflowX: "auto", paddingBottom: "8px" }}>
        {MAP_ROWS.map((row, rowIdx) => (
          <div key={rowIdx} style={{
            display: "flex", justifyContent: "center",
            gap: "6px", marginBottom: "8px", flexWrap: "wrap",
          }}>
            {row.map(tableId => renderTableSVG(tableId, 88))}
          </div>
        ))}
      </div>

      {/* 선택된 테이블 상세 */}
      {selectedTable && selectedStat && (
        <div style={{
          ...cardStyle, marginTop: "16px", padding: "16px",
          borderTop: `3px solid ${vipTableIds.includes(selectedTable) ? getVipColor(selectedTable) : T.accent}`,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span style={{ fontSize: "16px", fontWeight: 800, color: T.accent }}>
              테이블 {selectedTable}
              {vipTableIds.includes(selectedTable) && ` (${TABLE_CONFIG[selectedTable]?.label || "내빈석"})`}
            </span>
            <span style={badgeStyle(
              selectedStat.checked === selectedStat.total && selectedStat.total > 0 ? T.successBg : T.accentBg,
              selectedStat.checked === selectedStat.total && selectedStat.total > 0 ? T.success : T.accent,
            )}>
              {selectedStat.checked}/{selectedStat.total}
            </span>
          </div>
          {selectedStat.members.length === 0 ? (
            <div style={{ textAlign: "center", color: T.textMuted, fontSize: "13px", padding: "12px" }}>
              배정된 인원이 없습니다
            </div>
          ) : (
            selectedStat.members.slice().sort((a, b) => (a.seat || 0) - (b.seat || 0)).map((m, idx) => (
              <div key={m.id || idx} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "8px 0", borderBottom: idx < selectedStat.members.length - 1 ? `1px solid ${T.border}` : "none",
              }}>
                <div>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: m.checked ? T.textSec : T.text }}>
                    {m.name}
                  </span>
                  <span style={{ fontSize: "11px", color: T.textMuted, marginLeft: "6px" }}>
                    좌석 {m.seat}
                  </span>
                </div>
                <span style={badgeStyle(
                  m.checked ? T.successBg : "rgba(255,255,255,0.05)",
                  m.checked ? T.success : T.textMuted,
                )}>
                  {m.checked ? "착석" : "대기"}
                </span>
              </div>
            ))
          )}
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
// CHECK-IN MODAL (Floating, section-independent)
// ============================================================
function CheckInModal({ isOpen, onClose, attendees, setAttendees, vipGuests, setVipGuests, showToast }) {
  const [search, setSearch] = useState("");
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [pickTable, setPickTable] = useState(null);
  const [pickSeat, setPickSeat] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) setTimeout(() => inputRef.current?.focus(), 200);
    if (!isOpen) { setSearch(""); setConfirmTarget(null); }
  }, [isOpen]);

  useEffect(() => { setPickTable(null); setPickSeat(null); }, [confirmTarget]);

  if (!isOpen) return null;

  const allPeople = [
    ...vipGuests.map(v => ({ ...v, type: "vip" })),
    ...attendees.map(a => ({ ...a, type: "attendee" })),
  ];

  // 이름 + 소속 기관 검색
  const results = search.length >= 1
    ? allPeople.filter(p => p.name.includes(search) || (p.org || "").includes(search))
    : [];

  // 잔여 좌석 계산 — 참석자 + 내빈 모두 제외
  const occupiedSeats = new Set([
    ...attendees.filter(a => a.tableNo).map(a => a.tableNo),
    ...(vipGuests || []).filter(v => v.table > 0 && v.seat > 0).map(v => `${v.table}-${v.seat}`),
  ]);
  const tableOptions = ATTENDEE_TABLES.map(t => {
    const freeSeats = [];
    for (let s = 1; s <= 10; s++) {
      if (!occupiedSeats.has(`${t.id}-${s}`)) freeSeats.push(s);
    }
    return { id: t.id, freeSeats, freeCount: freeSeats.length };
  }).filter(t => t.freeCount > 0);
  const seatsForPickedTable = tableOptions.find(t => t.id === pickTable)?.freeSeats ?? [];

  const needsSeat = confirmTarget?.type === "attendee" && !confirmTarget.tableNo;
  const canConfirm = !needsSeat || (pickTable && pickSeat);

  const handleConfirm = async (person) => {
    const tableNo = (pickTable && pickSeat) ? `${pickTable}-${pickSeat}` : null;
    if (person.type === "vip") {
      setVipGuests(prev => prev.map(v => v.id === person.id
        ? { ...v, checked: true, checkedAt: Date.now() } : v));
    } else {
      setAttendees(prev => prev.map(a => a.id === person.id
        ? { ...a, checked: true, checkedAt: Date.now(), ...(tableNo ? { tableNo, table: pickTable, seat: pickSeat } : {}) }
        : a));
      if (ATTENDEE_API_URL) {
        try {
          await fetch(ATTENDEE_API_URL, {
            method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({ action: "toggleAttendance", name: person.name, org: person.org, rowIndex: person.rowIndex, checked: true }),
          });
          if (tableNo) {
            await fetch(ATTENDEE_API_URL, {
              method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
              body: JSON.stringify({ action: "assignSeat", name: person.name, org: person.org, rowIndex: person.rowIndex, tableNo }),
            });
          }
        } catch (_) {}
      }
    }
    showToast(`${person.name} 님 참석 확인 완료${tableNo ? ` · 좌석 ${tableNo}` : ""}`);
    setConfirmTarget(null);
    setSearch("");
  };

  return (
    <div className="checkin-overlay" onClick={onClose}>
      <div className="checkin-modal" onClick={e => e.stopPropagation()} style={{
        background: T.bg, borderRadius: "20px", padding: "24px",
        border: `1px solid ${T.accentBorder}`, maxHeight: "88vh", overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: T.accent }}>접수 확인</div>
            <div style={{ fontSize: "13px", color: T.textSec }}>성함 또는 소속 기관을 입력하세요</div>
          </div>
          <button onClick={onClose} style={{
            width: "36px", height: "36px", borderRadius: "50%",
            background: "rgba(255,255,255,0.06)", border: `1px solid ${T.border}`,
            color: T.textSec, fontSize: "18px", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", fontFamily: T.font,
          }}>✕</button>
        </div>

        {/* Search Input */}
        <div style={{ position: "relative", marginBottom: "16px" }}>
          <input
            ref={inputRef}
            style={{ ...inputStyle, fontSize: "18px", padding: "14px 16px", paddingLeft: "40px", fontWeight: 600 }}
            value={search}
            onChange={e => { setSearch(e.target.value); setConfirmTarget(null); }}
            placeholder="성함 또는 기관명..."
          />
          <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "18px", opacity: 0.4 }}>🔍</span>
        </div>

        {/* Confirm Dialog */}
        {confirmTarget && (
          <div style={{
            background: "rgba(145,201,192,0.08)", borderRadius: "16px",
            padding: "20px", border: `2px solid ${T.accent}`, marginBottom: "16px",
          }}>
            <div style={{ fontSize: "11px", color: T.accentDark, fontWeight: 600, marginBottom: "10px", textAlign: "center", letterSpacing: "1px" }}>
              참석자 정보 확인
            </div>
            <div style={{ fontSize: "26px", fontWeight: 900, color: T.text, marginBottom: "2px", textAlign: "center" }}>
              {confirmTarget.name}
            </div>
            {confirmTarget.org && (
              <div style={{ fontSize: "13px", color: T.textSec, marginBottom: "10px", textAlign: "center" }}>
                {confirmTarget.org}
              </div>
            )}
            {/* 테이블 상태 */}
            <div style={{ textAlign: "center", marginBottom: "14px" }}>
              {confirmTarget.tableNo
                ? <span style={{ ...badgeStyle("rgba(145,201,192,0.12)", T.accent), fontSize: "13px" }}>💺 {confirmTarget.tableNo}</span>
                : confirmTarget.type === "attendee"
                  ? <span style={{ ...badgeStyle("rgba(232,168,72,0.12)", T.warn), fontSize: "12px" }}>좌석 미배정 — 아래서 선택하세요</span>
                  : null}
              {confirmTarget.type === "vip" && (
                <span style={{ ...badgeStyle("#C8A44E20", "#C8A44E"), fontSize: "13px" }}>
                  ⭐ 내빈 (테이블 {confirmTarget.table})
                </span>
              )}
            </div>

            {/* 좌석 배정 (미배정 attendee) */}
            {needsSeat && (
              <div style={{ marginBottom: "14px", padding: "12px", background: "rgba(255,255,255,0.03)", borderRadius: "10px", border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: "11px", color: T.textMuted, marginBottom: "6px", fontWeight: 600 }}>
                  {pickTable ? `테이블 ${pickTable} 선택됨 — 좌석을 고르세요` : "① 테이블 선택"}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: pickTable ? "10px" : "0" }}>
                  {tableOptions.map(t => (
                    <button key={t.id} onClick={() => { setPickTable(t.id); setPickSeat(null); }}
                      style={{
                        padding: "5px 9px", borderRadius: "7px", fontSize: "13px", fontWeight: 700,
                        background: pickTable === t.id ? T.accentBg : "rgba(255,255,255,0.05)",
                        border: `1px solid ${pickTable === t.id ? T.accent : T.border}`,
                        color: pickTable === t.id ? T.accent : T.textSec,
                        cursor: "pointer", fontFamily: "inherit",
                      }}>
                      {t.id}<span style={{ fontSize: "10px", opacity: 0.65, marginLeft: "3px" }}>({t.freeCount})</span>
                    </button>
                  ))}
                </div>
                {pickTable && (
                  <>
                    <div style={{ fontSize: "11px", color: T.textMuted, marginBottom: "6px", fontWeight: 600 }}>② 좌석 선택</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                      {seatsForPickedTable.map(s => (
                        <button key={s} onClick={() => setPickSeat(s)}
                          style={{
                            width: "38px", height: "38px", borderRadius: "8px", fontSize: "14px", fontWeight: 700,
                            background: pickSeat === s ? T.accentBg : "rgba(255,255,255,0.05)",
                            border: `1px solid ${pickSeat === s ? T.accent : T.border}`,
                            color: pickSeat === s ? T.accent : T.text,
                            cursor: "pointer", fontFamily: "inherit",
                          }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {confirmTarget.checked ? (
              <div style={{ textAlign: "center" }}>
                <span style={badgeStyle(T.successBg, T.success)}>✅ 이미 참석 확인됨</span>
              </div>
            ) : (
              <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                <button onClick={() => setConfirmTarget(null)} style={{ ...ghostBtnStyle, padding: "10px 20px" }}>취소</button>
                <button
                  onClick={() => handleConfirm(confirmTarget)}
                  disabled={!canConfirm}
                  style={{ ...accentBtnStyle, padding: "10px 20px", fontSize: "14px", opacity: canConfirm ? 1 : 0.4 }}>
                  {needsSeat
                    ? (pickTable && pickSeat ? `${pickTable}-${pickSeat} 배정 + 참석 확인` : "좌석 선택 후 확인")
                    : "✓ 참석 확인"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Search Results */}
        {search.length >= 1 && !confirmTarget && (
          <div>
            <div style={{ fontSize: "13px", color: T.textSec, marginBottom: "8px" }}>
              검색 결과: {results.length}명
            </div>
            {results.length === 0 && (
              <div style={{ textAlign: "center", padding: "30px", color: T.textMuted }}>일치하는 참석자가 없습니다</div>
            )}
            {results.slice(0, 10).map(p => (
              <div key={`${p.type}_${p.id}`} onClick={() => setConfirmTarget(p)}
                style={{
                  ...cardStyle, cursor: "pointer", padding: "14px",
                  display: "flex", alignItems: "center", gap: "12px",
                  background: p.checked ? "rgba(60,179,113,0.06)" : T.bgCard,
                  borderLeft: `3px solid ${p.type === "vip" ? "#C8A44E" : (p.checked ? T.success : T.border)}`,
                }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "17px", fontWeight: 800, color: T.text }}>
                    {p.name}
                    {p.type === "vip" && <span style={{ fontSize: "12px", color: "#C8A44E", marginLeft: "8px" }}>⭐</span>}
                  </div>
                  <div style={{ fontSize: "12px", color: T.textSec, marginTop: "2px" }}>{p.org}</div>
                </div>
                {p.type === "attendee" && !p.tableNo && (
                  <span style={{ ...badgeStyle("rgba(232,168,72,0.1)", T.warn), fontSize: "10px" }}>미배정</span>
                )}
                <span style={badgeStyle(p.checked ? T.successBg : "rgba(255,255,255,0.05)", p.checked ? T.success : T.textMuted)}>
                  {p.checked ? "참석" : "대기"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// GOOGLE SHEETS HELPER
// ============================================================
const ATTENDEE_API_URL = "https://script.google.com/macros/s/AKfycbxEb1DHX5PVOl2d-vm_Mz4X1PKptfhwTZQi5qWKP5J4ZnsTt8JaJlM30w2VPhG9Cqtm/exec";
const GUEST_API_URL = "https://script.google.com/macros/s/AKfycbwZpNXgMKALCOKN1fJIu-Mp75TBaY2i_S6632hCPSQbGU9YCkVEYy52K-uOy22I0WhAzg/exec";

// ============================================================
// MAIN APP
// ============================================================
const TABS = [
  { id: "dashboard", label: "홈", icon: "\u{1F3E0}" },
  { id: "vip", label: "내빈", icon: "\u{2B50}" },
  { id: "guestbook", label: "방명록", icon: "📝" },
  { id: "attendees", label: "참석자", icon: "\u{1F465}" },
  { id: "seating", label: "테이블", icon: "🪑" },
  { id: "seatmap", label: "좌석도", icon: "🗺️" },
  { id: "notices", label: "공지", icon: "\u{1F4E2}" },
  { id: "emergency", label: "긴급", icon: "\u{1F6A8}" },
  { id: "awards", label: "포상", icon: "\u{1F3C6}" },
  { id: "supplies", label: "물품", icon: "\u{1F4E6}" },
  { id: "staff", label: "스태프", icon: "\u{1F46A}" },
];

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [vipGuests, setVipGuests] = useState([]);
  const [attendees, setAttendees] = useState([]);
  const [notices, setNotices] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [staffTeams, setStaffTeams] = useState(["등록팀", "안내팀", "무대팀", "포상팀", "다과팀"]);
  const [toast, setToast] = useState("");
  const [sheetStatus, setSheetStatus] = useState("idle"); // idle, loading, loaded, error
  const [sheetCount, setSheetCount] = useState(0);
  const [checkinOpen, setCheckinOpen] = useState(false);
  const contentRef = useRef(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  }, []);

  // Google Sheets fetch — AttendeeCode.gs API 사용 (rowIndex 포함)
  const fetchAttendees = useCallback(async () => {
    setSheetStatus("loading");
    try {
      const res = await fetch(ATTENDEE_API_URL + "?action=getList");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "API 오류");
      const parsed = json.data || [];
      if (parsed.length > 0) {
        setAttendees(prev => parsed.map((p, i) => {
          const existing = prev.find(x => x.name === p.name && x.org === p.org);
          const parts = (p.tableNo || "").split("-");
          const table = parseInt(parts[0]) || 0;
          const seat = parseInt(parts[1]) || 0;
          const exTableNo = existing && /** @type {any} */(existing).tableNo;
          const finalTableNo = p.tableNo || exTableNo || "";
          const finalTable = p.tableNo ? table : (existing?.table || 0);
          const finalSeat = p.tableNo ? seat : (existing?.seat || 0);
          return {
            id: i + 1,
            name: p.name,
            org: p.org,
            birthdate: p.birthdate || "",
            contact: p.contact || "",
            rowIndex: p.rowIndex ?? null,
            tableNo: finalTableNo,
            table: finalTable,
            seat: finalSeat,
            checked: (existing?.checkedAt ? existing.checked : null) ?? p.checked,
            checkedAt: existing?.checkedAt ?? (p.checked ? Date.now() : null),
          };
        }));
        setSheetCount(parsed.length);
        setSheetStatus("loaded");
        showToast(`참석자 ${parsed.length}명 불러오기 완료`);
      } else {
        setSheetStatus("error");
        showToast("스프레드시트 데이터가 비어 있습니다");
      }
    } catch (err) {
      setSheetStatus("error");
      showToast(`참석자 로드 실패: ${err.message}`);
    }
  }, [showToast]);

  // VIP 좌석 현황을 GuestCode.gs getGuestList에서 주기적으로 동기화
  const fetchVipSeating = useCallback(async () => {
    if (!GUEST_API_URL) return;
    try {
      const res = await fetch(GUEST_API_URL + "?action=getGuestList");
      const r = await res.json();
      if (!r.success) return;
      const guests = (r.data || []).filter(g => g.지정좌석);
      setVipGuests(guests.map((g, idx) => {
        const parts = (g.지정좌석 || "").split("-");
        const table = parseInt(parts[0]) || 0;
        const seat = parseInt(parts[1]) || 0;
        return {
          id: g.내빈ID || (idx + 1),
          name: g.이름 || "",
          org: g.소속 || "",
          role: g.구분 || "",
          table,
          seat,
          checked: g.상태 === "착석" || g.상태 === "입장",
          checkedAt: null,
        };
      }));
    } catch (_) { /* 조용히 실패 */ }
  }, []);

  // Auto-fetch on mount
  useEffect(() => { fetchAttendees(); }, []);

  // VIP 좌석 주기적 동기화 (8초)
  useEffect(() => {
    fetchVipSeating();
    const t = setInterval(fetchVipSeating, 8000);
    return () => clearInterval(t);
  }, [fetchVipSeating]);

  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, [tab]);

  const activeEmergencyCount = emergencies.filter(e => e.status !== "done").length;

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
        </div>
      </header>

      {/* Content */}
      <div ref={contentRef} className="app-content">
        {tab === "dashboard" && <DashboardTab vipGuests={vipGuests} attendees={attendees} notices={notices} emergencies={emergencies} program={PROGRAM} setTab={setTab} />}
        {tab === "vip" && <VipTab guests={vipGuests} setGuests={setVipGuests} />}
        {tab === "guestbook" && <GuestbookTab />}
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
            <AttendeesTab attendees={attendees} setAttendees={setAttendees} vipGuests={vipGuests} showToast={showToast} />
          </div>
        )}
        {tab === "seating" && <SeatingTab attendees={attendees} vipGuests={vipGuests} showToast={showToast} />}
        {tab === "seatmap" && <SeatingMapTab attendees={attendees} vipGuests={vipGuests} />}
        {tab === "notices" && <NoticesTab notices={notices} setNotices={setNotices} />}
        {tab === "emergency" && <EmergencyTab emergencies={emergencies} setEmergencies={setEmergencies} staffTeams={staffTeams} />}
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
              position: "relative",
              color: tab === t.id ? T.accent : T.textMuted,
              fontFamily: T.font,
            }}
          >
            <span className="nav-icon">{t.icon}</span>
            <span className="nav-label" style={{ fontWeight: tab === t.id ? 700 : 400 }}>{t.label}</span>
            {t.id === "emergency" && activeEmergencyCount > 0 && (
              <span style={{
                position: "absolute", top: "2px", right: "2px",
                background: T.danger, color: "#fff",
                fontSize: "9px", fontWeight: 800,
                width: "16px", height: "16px", borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: T.font,
              }}>
                {activeEmergencyCount > 9 ? "9+" : activeEmergencyCount}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Floating Check-in Button (always visible) */}
      <button
        onClick={() => setCheckinOpen(true)}
        style={{
          position: "fixed", right: "16px", bottom: "76px",
          width: "auto", height: "auto",
          borderRadius: "28px",
          background: `linear-gradient(135deg, ${T.accent} 0%, ${T.accentDark} 100%)`,
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", gap: "8px",
          padding: "14px 20px",
          fontSize: "14px", fontWeight: 800, color: "#0a1616",
          fontFamily: T.font,
          zIndex: 90,
          animation: "fabPulse 3s ease-in-out infinite",
          boxShadow: `0 4px 20px rgba(145,201,192,0.5)`,
          letterSpacing: "-0.3px",
        }}
        title="접수 확인"
      >
        <span style={{ fontSize: "18px" }}>📋</span>
        접수확인
      </button>

      {/* Check-in Modal */}
      <CheckInModal
        isOpen={checkinOpen}
        onClose={() => setCheckinOpen(false)}
        attendees={attendees}
        setAttendees={setAttendees}
        vipGuests={vipGuests}
        setVipGuests={setVipGuests}
        showToast={showToast}
      />

      <Toast msg={toast} />
    </div>
  );
}
