# Staff App 대규모 업데이트 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 방명록 포스트잇 하트 배열·스프레드시트 연동, 헤더 타이머 삭제, 좌석도 탭 신규 추가, 참석자 섹션 간소화, 긴급 배지 추가를 통해 행사 당일(2026-04-22) 운영 효율을 높인다.

**Architecture:** 모든 변경은 `src/App.jsx` 단일 파일과 `backend/GuestbookCode.gs`에 집중된다. 기존 컴포넌트 구조(함수형 컴포넌트 + inline style)를 그대로 따른다. 새로운 `SeatingMapTab` 컴포넌트를 같은 파일에 추가하고 TABS 배열에 등록한다.

**Tech Stack:** React 18 (Vite), Google Apps Script REST API, Google Sheets CSV, SVG (inline)

---

## 파일 변경 목록

| 파일 | 작업 |
|------|------|
| `backend/GuestbookCode.gs` | `GB_SPREADSHEET_ID` 교체 |
| `src/App.jsx` | 타이머 삭제, 방명록 수정, `SeatingMapTab` 신규, 참석자 간소화, FAB 개선, 긴급 배지 |
| `src/index.css` | 포스트잇 카드 CSS 애니메이션 추가 |

---

## Task 1: GuestbookCode.gs 스프레드시트 ID 교체

**Files:**
- Modify: `backend/GuestbookCode.gs:6`

- [ ] **Step 1: ID 교체**

`backend/GuestbookCode.gs` 6번째 줄을 찾아 다음과 같이 교체:

```javascript
// 변경 전
var GB_SPREADSHEET_ID = '1nxOqb00oTt5ZuQ2Qx_hLcrC3b57iQXCRved0fPWEcC4';

// 변경 후
var GB_SPREADSHEET_ID = '1nhrBH-MYG_vvIH1OH0b1KamqG1ZPjfbNIJ_QjjAlFBE';
```

- [ ] **Step 2: 커밋**

```bash
git add backend/GuestbookCode.gs
git commit -m "fix: update guestbook spreadsheet ID"
```

---

## Task 2: 헤더 타이머(시계·D-Day) 삭제

**Files:**
- Modify: `src/App.jsx` — App 컴포넌트 내 clock state, useEffect, 헤더 JSX

- [ ] **Step 1: App 컴포넌트에서 clock 관련 state·변수 제거**

`App()` 함수 내에서 다음 항목들을 삭제:

```jsx
// 삭제 대상 1 — state
const [clock, setClock] = useState(new Date());

// 삭제 대상 2 — useEffect
useEffect(() => {
  const interval = setInterval(() => setClock(new Date()), 1000);
  return () => clearInterval(interval);
}, []);

// 삭제 대상 3 — 변수
const eventDate = new Date("2026-04-22T15:00:00");
const dDay = Math.ceil((eventDate - clock) / 86400000);
const clockStr = clock.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
```

- [ ] **Step 2: 헤더 JSX에서 시계·D-Day 블록 제거**

헤더 안의 아래 블록을 삭제 (날짜·장소 텍스트는 유지):

```jsx
// 삭제 대상 — 헤더 우측 시계/D-Day div 전체
<div style={{ textAlign: "right", flexShrink: 0 }}>
  <div style={{ fontSize: "16px", fontWeight: 700, color: T.accent, fontVariantNumeric: "tabular-nums" }}>
    {clockStr}
  </div>
  <div style={{ fontSize: "11px", color: dDay > 0 ? T.warn : T.success, fontWeight: 600 }}>
    {dDay > 0 ? `D-${dDay}` : dDay === 0 ? "D-DAY" : "행사 종료"}
  </div>
</div>
```

- [ ] **Step 3: `DashboardTab`의 `clock` 참조도 정리**

`DashboardTab` 컴포넌트 내 `now` 변수를 `clock` props 없이 직접 생성하도록 수정:

```jsx
// DashboardTab 함수 첫 줄에 이미 있는 `const now = new Date();` 를 확인.
// props에서 clock을 받는 부분이 있으면 제거하고 내부에서 new Date() 사용.
// DashboardTab은 clock props를 받지 않으므로 내부의 `const now = new Date();` 그대로 유지.
```

- [ ] **Step 4: 개발 서버 실행 및 확인**

```bash
npm run dev
```

브라우저에서 확인:
- 헤더 우측에 시계·D-Day가 없어야 함
- 헤더 좌측 로고·제목·날짜 텍스트는 정상 표시

- [ ] **Step 5: 커밋**

```bash
git add src/App.jsx
git commit -m "feat: remove header clock and D-Day timer"
```

---

## Task 3: 방명록 — 상수 교체·CSV 파싱 수정·POST 연동·자동 새로고침

**Files:**
- Modify: `src/App.jsx` — GuestbookTab 섹션 (~line 530~645)

- [ ] **Step 1: 상수 교체 및 API URL 추가**

`src/App.jsx` 상단의 방명록 상수 부분을 찾아 교체:

```jsx
// 변경 전
const GUESTBOOK_SHEET_ID = "1nxOqb00oTt5ZuQ2Qx_hLcrC3b57iQXCRved0fPWEcC4";
const GUESTBOOK_CSV_URL = `https://docs.google.com/spreadsheets/d/${GUESTBOOK_SHEET_ID}/gviz/tq?tqx=out:csv`;

// 변경 후
const GUESTBOOK_SHEET_ID = "1nhrBH-MYG_vvIH1OH0b1KamqG1ZPjfbNIJ_QjjAlFBE";
const GUESTBOOK_CSV_URL = `https://docs.google.com/spreadsheets/d/${GUESTBOOK_SHEET_ID}/gviz/tq?tqx=out:csv`;
const GUESTBOOK_API_URL = "https://script.google.com/macros/s/AKfycbxKwyes_jvVi-NAC8UKyyzraGgvUxWinMtivEYEd804ZUZGD5rCi_q2GkrTWc3onSE/exec";
```

- [ ] **Step 2: CSV 파싱 버그 수정**

`fetchMessages` 내 CSV 파싱 부분의 컬럼 인덱스를 수정:

```jsx
// 변경 전 (버그: row[0]=타임스탬프인데 이름으로 읽음)
if (row.length >= 2 && row[0]) {
  parsed.push({
    id: `gb_${i}`,
    name: row[0] || "익명",
    message: row[1] || "",
    colorIdx: i % HEART_COLORS.length,
  });
}

// 변경 후 (row[0]=타임스탬프, row[1]=이름, row[2]=메시지)
if (row.length >= 3 && row[1]) {
  parsed.push({
    id: `gb_${i}`,
    name: row[1] || "익명",
    message: row[2] || "",
    colorIdx: i % HEART_COLORS.length,
  });
}
```

- [ ] **Step 3: handleSubmit에 실제 POST 연동**

`handleSubmit` 함수를 다음으로 교체:

```jsx
const handleSubmit = async () => {
  if (!name.trim() || !message.trim()) {
    showToast("이름과 응원메시지를 모두 입력해주세요");
    return;
  }
  setSubmitting(true);
  try {
    const res = await fetch(GUESTBOOK_API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ action: "submitMessage", name: name.trim(), message: message.trim() }),
    });
    const json = await res.json();
    if (json.success) {
      const newMsg = {
        id: `local_${Date.now()}`,
        name: name.trim(),
        message: message.trim(),
        colorIdx: messages.length % HEART_COLORS.length,
      };
      setMessages(prev => [newMsg, ...prev]);
      setName("");
      setMessage("");
      showToast("응원메시지가 등록되었습니다! 💗");
    } else {
      showToast(json.message || "등록에 실패했습니다");
    }
  } catch {
    showToast("네트워크 오류 — 다시 시도해주세요");
  }
  setSubmitting(false);
};
```

- [ ] **Step 4: 30초 자동 새로고침 추가**

`GuestbookTab` 컴포넌트 내 기존 `useEffect` 아래에 자동 새로고침 추가:

```jsx
// 기존
useEffect(() => { fetchMessages(); }, [fetchMessages]);

// 아래에 추가
useEffect(() => {
  const interval = setInterval(() => fetchMessages(), 30000);
  return () => clearInterval(interval);
}, [fetchMessages]);
```

- [ ] **Step 5: 개발 서버에서 확인**

```bash
npm run dev
```

방명록 탭에서:
- 메시지 입력 후 "💌 등록" 클릭 → 토스트 메시지 확인
- 새로고침 버튼 클릭 → 메시지 목록 갱신 확인

- [ ] **Step 6: 커밋**

```bash
git add src/App.jsx
git commit -m "feat: connect guestbook to spreadsheet API and fix CSV parsing"
```

---

## Task 4: 방명록 — 포스트잇 하트 레이아웃

**Files:**
- Modify: `src/App.jsx` — GuestbookTab 하트 렌더링 부분 (~line 696~738)
- Modify: `src/index.css` — 포스트잇 CSS 추가

- [ ] **Step 1: index.css에 포스트잇 스타일 추가**

`src/index.css` 하단에 추가:

```css
/* ============================================================
   Guestbook Postit Cards
   ============================================================ */

@keyframes postitIn {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.5) rotate(var(--rot));
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1) rotate(var(--rot));
  }
}

.postit-card {
  position: absolute;
  width: 72px;
  height: 68px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6px 5px 5px;
  box-shadow: 2px 3px 8px rgba(0,0,0,0.35), 0 1px 2px rgba(0,0,0,0.2);
  animation: postitIn 0.4s ease both;
  transition: transform 0.2s, z-index 0s, box-shadow 0.2s;
  transform: translate(-50%, -50%) scale(1) rotate(var(--rot));
  font-family: 'Pretendard Variable', 'Pretendard', sans-serif;
  border: none;
  overflow: hidden;
}

.postit-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 4px;
  background: rgba(0,0,0,0.12);
}

.postit-card:hover {
  transform: translate(-50%, -50%) scale(1.35) rotate(var(--rot)) !important;
  box-shadow: 4px 6px 18px rgba(0,0,0,0.5);
  z-index: 20 !important;
}

.postit-name {
  font-size: 11px;
  font-weight: 800;
  line-height: 1.2;
  text-align: center;
  margin-bottom: 3px;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.postit-msg {
  font-size: 9px;
  line-height: 1.3;
  text-align: center;
  opacity: 0.85;
  width: 100%;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  word-break: break-all;
}
```

- [ ] **Step 2: 하트 배열 렌더링 교체**

`GuestbookTab` 내 메시지 하트 렌더링 부분을 교체한다. 기존 `button` 렌더링 코드를 아래로 교체:

```jsx
{messages.slice(0, 80).map((msg, i) => {
  const pos = positions[i] || { x: 50, y: 50 };
  const c = HEART_COLORS[msg.colorIdx || 0];
  // 결정론적 기울기: 인덱스 기반으로 -6도 ~ +6도 사이 고정값
  const rot = ((i * 137 + 42) % 13) - 6;
  return (
    <button
      key={msg.id}
      onClick={() => setExpandedMsg(msg)}
      className="postit-card"
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        background: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
        zIndex: i % 3 + 1,
        animationDelay: `${i * 0.025}s`,
        "--rot": `${rot}deg`,
      }}
      title={`${msg.name}: ${msg.message}`}
    >
      <div className="postit-name">{msg.name}</div>
      <div className="postit-msg">
        {msg.message.length > 20 ? msg.message.slice(0, 20) + "…" : msg.message}
      </div>
    </button>
  );
})}
```

메시지가 80개를 초과할 경우 표시할 안내 추가 (하트 display div 아래에):

```jsx
{messages.length > 80 && (
  <div style={{
    position: "absolute", bottom: "-28px", left: "50%", transform: "translateX(-50%)",
    fontSize: "12px", color: T.textMuted, whiteSpace: "nowrap",
  }}>
    💗 외 {messages.length - 80}개 더
  </div>
)}
```

- [ ] **Step 3: 하트 캔버스 영역 여백 확대**

하트 display div의 `paddingTop`을 `110%`로 늘려 포스트잇이 잘리지 않게:

```jsx
// 변경 전
<div style={{ position: "relative", width: "100%", paddingTop: "100%", maxWidth: "450px", margin: "0 auto" }}>

// 변경 후
<div style={{ position: "relative", width: "100%", paddingTop: "110%", maxWidth: "450px", margin: "0 auto" }}>
```

- [ ] **Step 4: 개발 서버에서 확인**

```bash
npm run dev
```

방명록 탭에서:
- 메시지 카드들이 포스트잇 모양으로 표시되는지 확인
- 하트 형태로 배열되는지 확인
- 각 카드에 약간의 기울기가 있는지 확인
- hover 시 확대되는지 확인
- 클릭 시 확대 모달 표시 확인

- [ ] **Step 5: 커밋**

```bash
git add src/App.jsx src/index.css
git commit -m "feat: redesign guestbook with postit heart layout"
```

---

## Task 5: 좌석도 탭 신규 추가 (SeatingMapTab)

**Files:**
- Modify: `src/App.jsx` — SeatingMapTab 컴포넌트 추가, TABS 배열 수정, 라우팅 추가

- [ ] **Step 1: 좌석 도트 좌표 상수 추가**

`src/App.jsx`의 상수 영역(TABLE_CONFIG 근처)에 추가:

```jsx
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
```

- [ ] **Step 2: SeatingMapTab 컴포넌트 작성**

`SuppliesTab` 함수 앞에 `SeatingMapTab` 컴포넌트를 추가:

```jsx
// ============================================================
// TAB: SEATING MAP — Visual floor plan with seat dots
// ============================================================
function SeatingMapTab({ attendees, vipGuests }) {
  const [selectedTable, setSelectedTable] = useState(null);

  // 테이블별 착석 맵 생성: { tableId: Set<seatNumber> }
  const checkedSeatMap = useMemo(() => {
    const map = {};
    ALL_TABLE_IDS.forEach(id => { map[id] = new Set(); });
    attendees.forEach(a => { if (a.checked) map[a.table]?.add(a.seat); });
    vipGuests.forEach(v => { if (v.checked) map[v.table]?.add(v.seat); });
    return map;
  }, [attendees, vipGuests]);

  // 테이블별 전체/착석 수
  const tableStats = useMemo(() => {
    const stats = {};
    ALL_TABLE_IDS.forEach(id => {
      const isVip = VIP_TABLE_IDS.includes(id);
      const members = isVip ? vipGuests.filter(v => v.table === id) : attendees.filter(a => a.table === id);
      const checked = members.filter(m => m.checked).length;
      stats[id] = { total: members.length, checked, members, isVip };
    });
    return stats;
  }, [attendees, vipGuests]);

  const renderTableSVG = (tableId, svgSize) => {
    const isVip = VIP_TABLE_IDS.includes(tableId);
    const cfg = TABLE_CONFIG[tableId];
    const color = isVip ? (cfg?.color || T.accent) : T.accent;
    const stat = tableStats[tableId] || { total: 0, checked: 0 };
    const isFull = stat.total > 0 && stat.checked === stat.total;
    const finalColor = isFull ? T.success : color;
    const checkedSeats = checkedSeatMap[tableId] || new Set();

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
            const isOccupied = checkedSeats.has(seatNum);
            return (
              <circle
                key={dotIdx}
                cx={cx} cy={cy}
                r={isOccupied ? "7" : "6"}
                fill={isOccupied ? finalColor : `${finalColor}18`}
                stroke={isOccupied ? finalColor : `${finalColor}50`}
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
          borderTop: `3px solid ${VIP_TABLE_IDS.includes(selectedTable) ? (TABLE_CONFIG[selectedTable]?.color || T.accent) : T.accent}`,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span style={{ fontSize: "16px", fontWeight: 800, color: T.accent }}>
              테이블 {selectedTable}
              {VIP_TABLE_IDS.includes(selectedTable) && ` (${TABLE_CONFIG[selectedTable]?.label})`}
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
            selectedStat.members.map((m, idx) => (
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
```

- [ ] **Step 3: TABS 배열에 좌석도 탭 추가**

`TABS` 배열에서 `seating` 탭 다음에 추가:

```jsx
const TABS = [
  { id: "dashboard", label: "홈", icon: "\u{1F3E0}" },
  { id: "vip", label: "내빈", icon: "\u{2B50}" },
  { id: "guestbook", label: "방명록", icon: "📝" },
  { id: "attendees", label: "참석자", icon: "\u{1F465}" },
  { id: "seating", label: "테이블", icon: "🪑" },
  { id: "seatmap", label: "좌석도", icon: "🗺️" },   // ← 추가
  { id: "notices", label: "공지", icon: "\u{1F4E2}" },
  { id: "emergency", label: "긴급", icon: "\u{1F6A8}" },
  { id: "awards", label: "포상", icon: "\u{1F3C6}" },
  { id: "supplies", label: "물품", icon: "\u{1F4E6}" },
  { id: "staff", label: "스태프", icon: "\u{1F46A}" },
];
```

- [ ] **Step 4: App 컴포넌트 content 영역에 라우팅 추가**

`{tab === "seating" && ...}` 바로 아래에 추가:

```jsx
{tab === "seatmap" && <SeatingMapTab attendees={attendees} vipGuests={vipGuests} />}
```

- [ ] **Step 5: 개발 서버에서 확인**

```bash
npm run dev
```

"좌석도" 탭에서:
- 무대 표시 상단에 있는지 확인
- MAP_ROWS에 따라 테이블들이 행별로 배치되는지 확인
- 각 테이블 원 외각에 10개 점이 표시되는지 확인
- 테이블 클릭 시 착석자 목록 패널이 나타나는지 확인

- [ ] **Step 6: 커밋**

```bash
git add src/App.jsx
git commit -m "feat: add SeatingMapTab with SVG seat dots"
```

---

## Task 6: 참석자 섹션 간소화 + FAB 개선 + 긴급 배지

**Files:**
- Modify: `src/App.jsx` — AttendeesTab, FAB 버튼, 하단 내비게이션

- [ ] **Step 1: AttendeesTab에서 소속(org) 제거**

`AttendeesTab` 내 각 참석자 카드에서 소속 텍스트 div 제거:

```jsx
// 제거 대상 (참석자 카드 내 소속 div)
<div style={{ fontSize: "13px", color: T.textSec, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
  {a.org}
</div>
```

소속 제거 후 이름·테이블 배지만 남기되, 검색 로직은 유지 (`a.org.includes(search)` 검색 필터는 그대로):

```jsx
// 변경 후 카드 info 영역
<div style={{ flex: 1, minWidth: 0 }}>
  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
    <span style={{ fontWeight: 700, color: T.text, fontSize: "15px" }}>{a.name}</span>
    <span style={{
      ...badgeStyle("rgba(255,255,255,0.06)", T.textMuted),
      fontSize: "11px", padding: "2px 8px",
    }}>T{a.table}</span>
  </div>
</div>
```

- [ ] **Step 2: FAB 버튼 확대 및 레이블 추가**

우하단 FAB 버튼을 다음으로 교체:

```jsx
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
```

- [ ] **Step 3: 긴급 탭에 미처리 건수 배지 추가**

`App` 컴포넌트에서 `activeEmergencies`를 하단 내비에 전달:

```jsx
// App 컴포넌트 내 activeEmergencies 계산 추가 (return 문 위에)
const activeEmergencyCount = emergencies.filter(e => e.status !== "done").length;
```

하단 내비게이션 버튼 렌더링 부분을 수정:

```jsx
<nav className="app-bottom-nav">
  {TABS.map((t) => (
    <button
      key={t.id}
      onClick={() => setTab(t.id)}
      style={{
        color: tab === t.id ? T.accent : T.textMuted,
        fontFamily: T.font,
        position: "relative",
      }}
    >
      <span className="nav-icon">{t.icon}</span>
      {/* 긴급 탭 배지 */}
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
      <span className="nav-label" style={{ fontWeight: tab === t.id ? 700 : 400 }}>{t.label}</span>
    </button>
  ))}
</nav>
```

- [ ] **Step 4: 개발 서버에서 확인**

```bash
npm run dev
```

확인 항목:
- 참석자 탭에서 소속이 표시되지 않는지 확인
- FAB 버튼이 "📋 접수확인" 텍스트 포함 알약 형태인지 확인
- 긴급 탭에서 메시지 등록 후 탭 아이콘 위에 배지가 나타나는지 확인

- [ ] **Step 5: 커밋**

```bash
git add src/App.jsx
git commit -m "feat: simplify attendees tab, improve FAB, add emergency badge"
```

---

## Task 7: 빌드 검증 및 최종 확인

**Files:**
- Read only (빌드 결과 확인)

- [ ] **Step 1: 프로덕션 빌드**

```bash
npm run build
```

Expected: 오류 없이 `dist/` 생성

에러가 발생하면:
- `clock` 관련 미사용 변수 참조 → Task 2 재확인
- `GUESTBOOK_API_URL` 미정의 → Task 3 재확인

- [ ] **Step 2: 전체 기능 체크리스트**

개발 서버(`npm run dev`)에서 순서대로 확인:

| 항목 | 확인 방법 |
|------|-----------|
| 헤더에 시계 없음 | 헤더 우측 영역 확인 |
| 방명록 포스트잇 표시 | 방명록 탭 → 하트 영역 |
| 방명록 메시지 등록 | 이름+메시지 입력 → 등록 버튼 |
| 방명록 자동 새로고침 | 30초 대기 후 목록 갱신 확인 |
| 좌석도 탭 노출 | 하단 탭 "🗺️ 좌석도" 탭 확인 |
| 좌석도 외각 점 표시 | 각 테이블 원 바깥 10개 점 |
| 착석 시 점 채워짐 | 참석자 탭에서 체크 → 좌석도 탭 확인 |
| 참석자 소속 미표시 | 참석자 탭 카드에 org 없음 |
| FAB 접수확인 버튼 | 우하단 알약 버튼 |
| 긴급 배지 | 긴급 메시지 등록 후 탭 배지 확인 |

- [ ] **Step 3: 최종 커밋**

```bash
git add -A
git commit -m "chore: final build verification for 2026-04-22 event"
```
