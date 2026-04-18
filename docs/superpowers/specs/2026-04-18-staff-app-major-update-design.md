# Staff App 대규모 업데이트 설계 문서

**작성일**: 2026-04-18  
**행사일**: 2026-04-22 (수) 15:00 · 백범김구기념관  
**대상 파일**: `src/App.jsx`, `src/index.css`, `backend/GuestbookCode.gs`

---

## 변경 범위 요약

| # | 항목 | 유형 |
|---|------|------|
| 1 | 방명록 — 포스트잇 하트 배열 + 스프레드시트 연동 | 수정 |
| 2 | 헤더 타이머(시계·D-Day) 삭제 | 삭제 |
| 3 | 좌석도 탭 신규 추가 (외각 좌석 점 SVG) | 신규 |
| 4 | 참석자 확인 모달 — 가시성 개선 | 수정 |
| 5 | 참석자 섹션 간소화 (이름·참석여부·테이블만) | 수정 |
| 6 | 긴급 섹션 → 홈 최상단 강조 확인 + 배지 추가 | 수정 |
| 7 | GuestbookCode.gs 스프레드시트 ID 업데이트 | 수정 |

---

## 1. 방명록 (GuestbookTab)

### 1-1. 스프레드시트 연동

```
GUESTBOOK_SHEET_ID  = "1nhrBH-MYG_vvIH1OH0b1KamqG1ZPjfbNIJ_QjjAlFBE"  ← 기존 ID 교체
GUESTBOOK_API_URL   = "https://script.google.com/macros/s/AKfycbxKwyes_jvVi-NAC8UKyyzraGgvUxWinMtivEYEd804ZUZGD5rCi_q2GkrTWc3onSE/exec"
GUESTBOOK_CSV_URL   = https://docs.google.com/spreadsheets/d/{GUESTBOOK_SHEET_ID}/gviz/tq?tqx=out:csv
```

- `handleSubmit`: `TODO` 주석 제거 → 실제 POST 요청 (`action: 'submitMessage'`, `name`, `message`)
- **CSV 파싱 버그 수정**: 현재 `row[0]`=이름, `row[1]`=메시지로 읽음 → 실제 컬럼 구조는 `row[0]`=타임스탬프, `row[1]`=이름, `row[2]`=메시지 → 인덱스 수정
- 30초마다 자동 새로고침 (`useEffect` + `setInterval`)

### 1-2. 포스트잇 하트 배열

- 기존 `getHeartPositions()` 파라메트릭 하트 곡선 위치 계산 유지
- 각 아이템을 소형 **포스트잇 카드**로 교체:
  - 크기: `72px × 68px`
  - 배경: `HEART_COLORS` 팔레트 (반투명)
  - 내용: 이름(굵게) + 메시지 앞 15자 + `...`
  - 약간의 랜덤 기울기 (`-6deg ~ +6deg`, seed 기반 고정)
  - hover 시 `scale(1.3)` + z-index 상승
  - click → 기존 확대 모달(`expandedMsg`) 유지
- 포스트잇이 많아질수록 겹침이 심해지므로 최대 표시 개수를 80개로 제한 (80개 초과 시 "외 N개" 표시)

---

## 2. 헤더 타이머 삭제

- `App` 컴포넌트에서 제거:
  - `clock` state
  - `setClock` useEffect (1초 인터벌)
  - `clockStr`, `dDay` 변수
  - 헤더 JSX의 우측 시계/D-Day 블록
- 헤더에 날짜·장소 텍스트(`2026. 4. 22 (수) 15:00 · 백범김구기념관`)는 유지

---

## 3. 좌석도 탭 (신규: `SeatingMapTab`)

### 탭 추가

`TABS` 배열에 `{ id: "seatmap", label: "좌석도", icon: "🗺️" }` 추가

### 레이아웃

```
┌─────────────────────────────────┐
│    S T A G E （무대）            │
├─────────────────────────────────┤
│  Row 1: T1  T2  T3  T4  T5  T6 │
│  Row 2: T7  T8  T9 T10 T11 T12 T13 │
│  Row 3: T14 T15 T16 T17 T18 T19 │
│  Row 4: T20 T21 T22 T23 T24 T25 T26 │
│  Row 5: T27 T28 T29 T30        │
└─────────────────────────────────┘
```

`MAP_ROWS` 상수 활용 (이미 코드에 정의됨)

### 테이블 원 SVG 구조

SVG viewBox `0 0 130 130`:
- **중앙 원** (`cx=65, cy=65, r=36`): 테이블 본체
  - 테이블 번호 또는 VIP 라벨
  - `checked/total` 수치
- **외각 좌석 점** 10개 (`r=6~7`): 반지름 52px 위치, 36° 간격
  - 착석 전: 반투명 + 테두리만
  - 착석 후: 색 채워짐 (크기 r=7로 약간 커짐)
- VIP 테이블(2,3,4,5): 기존 `TABLE_CONFIG` 컬러 사용
- 일반 테이블: `#91c9c0` (기본 accent)
- 만석(10/10): 초록 `#3CB371` + `drop-shadow` 글로우
- 클릭 시 해당 테이블 착석자 목록 슬라이드 패널

### 좌석 점 좌표 (고정값, SVG 130×130 기준)

```
[0]  (65,   13  )  ← 12시
[1]  (95.7, 23.4)  ← 1~2시
[2]  (114.4,51.6)  ← 3시
[3]  (113,  81.9)  ← 4~5시
[4]  (95.7, 106.6) ← 5~6시
[5]  (65,   117 )  ← 6시
[6]  (34.3, 106.6) ← 7~8시
[7]  (15.6, 81.9)  ← 8~9시
[8]  (15.6, 51.6)  ← 9~10시
[9]  (34.3, 23.4)  ← 10~11시
```

### 좌석 채우기 로직

- `attendees.filter(a => a.table === tableId)` 로 해당 테이블 전원 조회
- 각 attendee의 `seat` 값(1~10) → 좌표 배열 인덱스 `seat - 1` 에 매핑
  - seat 1 → 도트 [0] (12시), seat 2 → 도트 [1] (1~2시), ...
- `a.checked === true` 이면 해당 도트 채워짐, 아니면 반투명
- VIP는 `vipGuests` 동일 방식 (`v.seat - 1` 인덱스)

---

## 4. 참석자 확인 모달 (CheckInModal)

이미 구현됨. 다음만 수정:

- 우하단 FAB 버튼에 레이블 `접수확인` 텍스트 추가 (현재 아이콘만)
- 버튼 크기를 `64×64px`로 확대 (현재 56px)
- 헤더 영역에 단축 버튼 추가: `[접수확인]` 버튼을 헤더 우측에 배치 (모달과 동일 기능)

---

## 5. 참석자 섹션 간소화 (AttendeesTab)

현재: 체크 원 + 이름 + 테이블 배지 + 소속 + 상태 배지  
변경: 체크 원 + 이름 + 테이블 배지 + 상태 배지 (**소속 제거**)

- 소속(org)은 목록에서 제거 → 검색은 여전히 소속 포함으로 동작
- 체크 원 클릭 시 참석 토글 유지

---

## 6. 긴급 섹션 → 홈 최상단 강조

이미 구현됨. 추가 개선:

- 하단 내비게이션 "긴급" 탭 아이콘 옆에 미처리 건수 **배지** 표시
  ```jsx
  {activeEmergencies.length > 0 && (
    <span style={badgeStyle(T.danger, "#fff")}>{activeEmergencies.length}</span>
  )}
  ```
- 긴급 배너를 홈 최상단에서 헤더 바로 아래에 fixed 위치로 올리는 방안은 스크롤 UX 충돌 우려 → 현행 유지 (탭 상단 첫 번째 카드)

---

## 7. GuestbookCode.gs 업데이트

```javascript
var GB_SPREADSHEET_ID = '1nhrBH-MYG_vvIH1OH0b1KamqG1ZPjfbNIJ_QjjAlFBE';
```

기존 `1nxOqb00oTt5ZuQ2Qx_hLcrC3b57iQXCRved0fPWEcC4` → 새 ID로 교체

---

## 구현 순서

1. `GuestbookCode.gs` — 스프레드시트 ID 교체 (1분)
2. 헤더 타이머 삭제 (5분)
3. 방명록 — 상수 교체 + CSV 파싱 수정 + POST 연동 + 포스트잇 레이아웃 (30분)
4. 좌석도 탭 신규 (`SeatingMapTab`) (30분)
5. 참석자 섹션 간소화 (5분)
6. 참석자 확인 모달 — FAB 개선 (5분)
7. 긴급 탭 배지 추가 (5분)

**총 예상 작업량**: ~80분
