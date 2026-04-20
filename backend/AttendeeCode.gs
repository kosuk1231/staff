/* ═══════════════════════════════════════════════════════════
 *  참석자 관리 — Google Apps Script REST API 백엔드
 *  스프레드시트: 1GRS_Rcn6Eio8cragiB7WNKrZ6udabNwvS_joo-LhS4M
 *  컬럼: A=연번 B=성함 C=소속 D=생년월일 E=연락처
 *        F=이메일 G=편의제공조사 H=좌석배정 I=참석여부
 * ═══════════════════════════════════════════════════════════ */

var ATTENDEE_SS_ID = '1GRS_Rcn6Eio8cragiB7WNKrZ6udabNwvS_joo-LhS4M';
var ATTENDEE_SHEET = '시트1';

function getAttendeeSS() {
  return SpreadsheetApp.openById(ATTENDEE_SS_ID);
}

// "10-1" 같은 값이 날짜로 저장된 경우 "M-D" 문자열로 복원
function safeStrSeat(v) {
  if (!v) return '';
  if (v instanceof Date) return (v.getMonth() + 1) + '-' + v.getDate();
  return String(v).trim();
}

function getSheet() {
  var ss = getAttendeeSS();
  var sheet = ss.getSheetByName(ATTENDEE_SHEET);
  if (!sheet) sheet = ss.getSheets()[0]; // 시트 이름 다를 경우 첫 시트 사용
  if (!sheet) throw new Error('시트를 찾을 수 없습니다.');
  return sheet;
}

// ─── REST 라우터 ──────────────────────────────────────────
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : '';
  var result;
  try {
    switch (action) {
      case 'getList':
        result = { success: true, data: getAttendeeList() };
        break;
      case 'getStats':
        result = { success: true, data: getStats() };
        break;
      case 'testConnection':
        result = { success: true, data: testAttConnection() };
        break;
      default:
        result = { success: false, message: '알 수 없는 action: ' + action };
    }
  } catch (err) {
    result = { success: false, message: err.message || '서버 오류' };
  }
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var result;
  try {
    var body = JSON.parse(e.postData.contents);
    var action = body.action || '';
    switch (action) {
      case 'toggleAttendance':
        result = toggleAttendance(body.name, body.org, body.rowIndex, body.checked);
        break;
      case 'assignSeat':
        result = assignSeat(body.name, body.org, body.rowIndex, body.tableNo);
        break;
      default:
        result = { success: false, message: '알 수 없는 action: ' + action };
    }
  } catch (err) {
    result = { success: false, message: err.message || '서버 오류' };
  }
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── 참석자 목록 읽기 ─────────────────────────────────────
// A=연번(0) B=성함(1) C=소속(2) D=생년월일(3) E=연락처(4)
// F=이메일(5) G=편의제공조사(6) H=좌석배정(7) I=참석여부(8)
function getAttendeeList() {
  var sheet = getSheet();
  var lr = sheet.getLastRow();
  if (lr <= 1) return [];
  var lc = Math.max(sheet.getLastColumn(), 9);
  var data = sheet.getRange(2, 1, lr - 1, lc).getValues();

  // filter 후 map하면 빈 행 때문에 rowIndex가 틀어지므로 reduce로 처리
  return data.reduce(function(acc, row, i) {
    if (!row[1]) return acc; // 성함(B열) 없으면 제외
      var tableRaw = safeStrSeat(row[7]); // H열: 좌석배정
      var attended = row[8] === 'O' || row[8] === 'Y' || row[8] === '참석' || row[8] === '✓';
      acc.push({
        rowIndex: i + 2, // i는 원본 배열 기준 0-indexed, 헤더 1행 포함해서 +2
        seq: Number(row[0]) || (acc.length + 1),
        name: String(row[1] || '').trim(),
        org: String(row[2] || '').trim(),
        birthdate: String(row[3] || '').trim(),
        contact: String(row[4] || '').trim(),
        email: String(row[5] || '').trim(),
        accommodation: String(row[6] || '').trim(),
        tableNo: tableRaw,
        checked: attended
      });
    return acc;
  }, []);
}

// ─── 통계 ─────────────────────────────────────────────────
function getStats() {
  var list = getAttendeeList();
  var checked = list.filter(function(a) { return a.checked; }).length;
  return { total: list.length, checked: checked, unchecked: list.length - checked };
}

// ─── 참석 여부 토글 (I열에 저장) ─────────────────────────
function toggleAttendance(name, org, rowIndex, checked) {
  if (!name) return { success: false, message: '이름이 필요합니다.' };
  var sheet = getSheet();
  var value = checked ? 'O' : '';

  // rowIndex 직접 접근 (빠르고 정확)
  if (rowIndex > 1) {
    sheet.getRange(rowIndex, 9).setValue(value); // I열
    return { success: true, message: name + ' 님 참석 ' + (checked ? '확인' : '취소') };
  }

  // rowIndex 없으면 이름+소속으로 검색
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    var rowName = String(data[i][1] || '').trim(); // B열
    var rowOrg  = String(data[i][2] || '').trim(); // C열
    if (rowName === name && (!org || rowOrg === org)) {
      sheet.getRange(i + 1, 9).setValue(value); // I열
      return { success: true, message: name + ' 님 참석 ' + (checked ? '확인' : '취소') };
    }
  }
  return { success: false, message: '참석자를 찾을 수 없습니다: ' + name };
}

// ─── 좌석 배정 (H열에 저장) ──────────────────────────────
function assignSeat(name, org, rowIndex, tableNo) {
  if (!name) return { success: false, message: '이름이 필요합니다.' };
  var sheet = getSheet();
  var value = tableNo || '';

  if (rowIndex > 1) {
    sheet.getRange(rowIndex, 8).setNumberFormat('@').setValue(value); // H열
    return { success: true, message: name + ' 님 좌석 ' + value + ' 배정' };
  }

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    var rowName = String(data[i][1] || '').trim();
    var rowOrg  = String(data[i][2] || '').trim();
    if (rowName === name && (!org || rowOrg === org)) {
      sheet.getRange(i + 1, 8).setNumberFormat('@').setValue(value); // H열
      return { success: true, message: name + ' 님 좌석 ' + value + ' 배정' };
    }
  }
  return { success: false, message: '참석자를 찾을 수 없습니다: ' + name };
}

// ─── 연결 테스트 ──────────────────────────────────────────
function testAttConnection() {
  var ss = getAttendeeSS();
  var sheet = getSheet();
  return {
    spreadsheetName: ss.getName(),
    sheetName: sheet.getName(),
    totalRows: sheet.getLastRow(),
    attendeeCount: sheet.getLastRow() - 1
  };
}
