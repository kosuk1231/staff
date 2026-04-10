/* ═══════════════════════════════════════════════════════════
 *  내빈 의전 시스템 — Google Apps Script REST API 백엔드
 *  Original idea by SkyStar
 *  별도 스프레드시트 연결 버전
 * ═══════════════════════════════════════════════════════════ */

// ─── 환경 상수 ────────────────────────────────────────────
var DATA_SPREADSHEET_ID = '1hklkC3zUYFyD7CjF-_-yBNXVHnB5XRndPzN96g7vPEc';
var GUEST_SHEET = '01_내빈명단';
var SEAT_SHEET = '02_좌석세팅';
var OPTION_SHEET = '00_옵션';
var COUNCIL_SHEET = '03_주요내빈';
var PHOTO_FOLDER_ID = ''; // 사진 폴더 ID (필요시 입력)

// ─── 스프레드시트 접근 ────────────────────────────────────
function getDataSS() {
  return SpreadsheetApp.openById(DATA_SPREADSHEET_ID);
}

// ─── REST API 라우터 ──────────────────────────────────────
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : '';
  var result;

  try {
    switch (action) {
      case 'getGuestList':
        result = { success: true, data: getGuestList() };
        break;
      case 'getSeatMap':
        result = { success: true, data: getSeatMap() };
        break;
      case 'getPhotoMap':
        result = { success: true, data: getPhotoMap() };
        break;
      case 'getOptions':
        result = { success: true, data: getOptions() };
        break;
      case 'getCouncilList':
        result = { success: true, data: getCouncilList() };
        break;
      case 'testConnection':
        result = { success: true, data: testConnection() };
        break;
      case 'getAllData':
        result = {
          success: true,
          data: {
            guests: getGuestList(),
            seats: getSeatMap(),
            photoMap: getPhotoMap(),
            options: getOptions(),
            councilIds: getCouncilList()
          }
        };
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
      case 'processEntry':
        result = processEntry(body.guestId);
        break;
      case 'cancelEntry':
        result = cancelEntry(body.guestId);
        break;
      case 'processAbsent':
        result = processAbsent(body.guestId);
        break;
      case 'cancelAbsent':
        result = cancelAbsent(body.guestId);
        break;
      case 'processSeat':
        result = processSeat(body.guestId, body.seatNumber);
        break;
      case 'cancelSeat':
        result = cancelSeat(body.seatNumber);
        break;
      case 'addGuest':
        result = addGuest(body.info);
        break;
      case 'toggleIntroduced':
        result = toggleIntroduced(body.guestId);
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

// ─── 유틸리티 함수 ────────────────────────────────────────
function fmtTime(val) {
  if (!val) return '';
  if (val instanceof Date) return Utilities.formatDate(val, Session.getScriptTimeZone(), 'HH:mm');
  var s = String(val).trim(), m = s.match(/(\d{1,2}:\d{2})/);
  return m ? m[1] : s;
}

function getNow() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'HH:mm');
}

function safeStr(v) {
  return String(v === null || v === undefined ? '' : v).trim();
}

// ─── 옵션 읽기 ────────────────────────────────────────────
function getOptions() {
  try {
    var ss = getDataSS(), sheet = ss.getSheetByName(OPTION_SHEET);
    if (!sheet) return { 열갯수: 3, '1열당좌석수': 13 };
    var data = sheet.getDataRange().getValues();
    var opts = {};
    for (var i = 0; i < data.length; i++) {
      if (data[i][0]) opts[safeStr(data[i][0])] = data[i][1];
    }
    return opts;
  } catch (e) {
    return { 열갯수: 3, '1열당좌석수': 13 };
  }
}

// ─── 주요내빈 목록 (내빈ID 목록) ────────────────────────────
function getCouncilList() {
  try {
    var ss = getDataSS(), sheet = ss.getSheetByName(COUNCIL_SHEET);
    if (!sheet) return [];
    var lr = sheet.getLastRow();
    if (lr <= 1) return [];
    var data = sheet.getRange(2, 1, lr - 1, 1).getValues();
    var ids = [];
    for (var i = 0; i < data.length; i++) {
      var id = safeStr(data[i][0]);
      if (id) ids.push(id);
    }
    return ids;
  } catch (e) {
    return [];
  }
}

// ─── 사진 맵 (내빈ID → 드라이브 썸네일 URL) ──────────────
function getPhotoMap() {
  if (!PHOTO_FOLDER_ID) return {};
  try {
    var folder = DriveApp.getFolderById(PHOTO_FOLDER_ID);
    var files = folder.getFiles();
    var map = {};
    while (files.hasNext()) {
      var file = files.next();
      var name = file.getName();
      // 파일명: V11_김지연.png → 내빈ID = V11
      var match = name.match(/^([^_]+)_/);
      if (match) {
        var guestId = match[1];
        var fileId = file.getId();
        map[guestId] = fileId;
      }
    }
    return map;
  } catch (e) {
    return {};
  }
}

// ─── 내빈 명단 읽기 (11열 구조) ──────────────────────────
// A:내빈ID B:우선순위 C:소속 D:직함 E:이름 F:상태
// G:지정좌석 H:실제좌석 I:입장시간 J:착석시간 K:비고
function getGuestList() {
  try {
    var ss = getDataSS(), sheet = ss.getSheetByName(GUEST_SHEET);
    if (!sheet) throw new Error('"' + GUEST_SHEET + '" 시트 없음');
    var lr = sheet.getLastRow(), lc = sheet.getLastColumn();
    if (lr <= 1 || lc === 0) return [];
    var data = sheet.getRange(1, 1, lr, Math.min(lc, 11)).getValues();
    var guests = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row[0] && !row[4]) continue;
      guests.push({
        rowIndex: i + 1,
        내빈ID: safeStr(row[0]),
        우선순위: (row[1] === '' || row[1] === null || row[1] === undefined) ? 999 : Number(row[1]),
        소속: safeStr(row[2]),
        직함: safeStr(row[3]),
        이름: safeStr(row[4]),
        상태: safeStr(row[5]) || '대기',
        지정좌석: safeStr(row[6]),
        실제좌석: safeStr(row[7]),
        입장시간: fmtTime(row[8]),
        착석시간: fmtTime(row[9]),
        비고: safeStr(row[10])
      });
    }
    return guests;
  } catch (e) {
    throw new Error('내빈명단 로드 실패: ' + e.message);
  }
}

// ─── 좌석 세팅 읽기 ──────────────────────────────────────
function getSeatMap() {
  try {
    var ss = getDataSS(), sheet = ss.getSheetByName(SEAT_SHEET);
    if (!sheet) throw new Error('"' + SEAT_SHEET + '" 시트 없음');
    var lr = sheet.getLastRow(), lc = sheet.getLastColumn();
    if (lr <= 1 || lc === 0) return [];
    var data = sheet.getRange(1, 1, lr, Math.min(lc, 9)).getValues();
    var seats = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row[0]) continue;
      seats.push({
        rowIndex: i + 1,
        좌석번호: safeStr(row[0]),
        열구분: safeStr(row[1]),
        순번: Number(row[2] || 0),
        상태: safeStr(row[3]) || '공석',
        내빈ID: safeStr(row[4]),
        이름: safeStr(row[5]),
        소속: safeStr(row[6]),
        직함: safeStr(row[7]),
        최종변경시간: fmtTime(row[8])
      });
    }
    return seats;
  } catch (e) {
    throw new Error('좌석세팅 로드 실패: ' + e.message);
  }
}

// ─── 연결 테스트 ──────────────────────────────────────────
function testConnection() {
  var ss = getDataSS();
  var r = {
    spreadsheetName: ss.getName(),
    sheets: ss.getSheets().map(function (s) { return s.getName(); }),
    guestSheetExists: ss.getSheetByName(GUEST_SHEET) !== null,
    seatSheetExists: ss.getSheetByName(SEAT_SHEET) !== null,
    optionSheetExists: ss.getSheetByName(OPTION_SHEET) !== null,
    councilSheetExists: ss.getSheetByName(COUNCIL_SHEET) !== null
  };
  if (r.guestSheetExists) r.guestRows = ss.getSheetByName(GUEST_SHEET).getLastRow();
  if (r.seatSheetExists) r.seatRows = ss.getSheetByName(SEAT_SHEET).getLastRow();
  // photo folder check
  if (PHOTO_FOLDER_ID) {
    try {
      var folder = DriveApp.getFolderById(PHOTO_FOLDER_ID);
      r.photoFolderExists = true;
      var files = folder.getFiles(); var cnt = 0;
      while (files.hasNext()) { files.next(); cnt++; }
      r.photoCount = cnt;
    } catch (e) { r.photoFolderExists = false; r.photoCount = 0; }
  } else {
    r.photoFolderExists = false;
    r.photoCount = 0;
  }
  return r;
}

// ─── 입장 처리 ────────────────────────────────────────────
function processEntry(guestId) {
  try {
    var ss = getDataSS(), sheet = ss.getSheetByName(GUEST_SHEET);
    if (!sheet) throw new Error('시트 없음');
    var data = sheet.getDataRange().getValues(), now = getNow();
    for (var i = 1; i < data.length; i++) {
      if (safeStr(data[i][0]) === String(guestId)) {
        if (safeStr(data[i][5]) === '착석') return { success: false, message: '이미 착석 상태입니다.' };
        sheet.getRange(i + 1, 6).setValue('입장');
        sheet.getRange(i + 1, 9).setValue(now);
        return { success: true, message: data[i][4] + ' 님 입장 처리 완료' };
      }
    }
    return { success: false, message: '내빈을 찾을 수 없습니다.' };
  } catch (e) { return { success: false, message: '오류: ' + e.message }; }
}

// ─── 입장 취소 ────────────────────────────────────────────
function cancelEntry(guestId) {
  try {
    var ss = getDataSS(), sheet = ss.getSheetByName(GUEST_SHEET);
    if (!sheet) throw new Error('시트 없음');
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (safeStr(data[i][0]) === String(guestId)) {
        if (safeStr(data[i][5]) !== '입장') return { success: false, message: '입장 상태가 아닙니다.' };
        sheet.getRange(i + 1, 6).setValue('대기');
        sheet.getRange(i + 1, 9).setValue('');
        return { success: true, message: data[i][4] + ' 님 입장 취소' };
      }
    }
    return { success: false, message: '내빈을 찾을 수 없습니다.' };
  } catch (e) { return { success: false, message: '오류: ' + e.message }; }
}

// ─── 불참 처리 ────────────────────────────────────────────
function processAbsent(guestId) {
  try {
    var ss = getDataSS(), sheet = ss.getSheetByName(GUEST_SHEET);
    if (!sheet) throw new Error('시트 없음');
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (safeStr(data[i][0]) === String(guestId)) {
        if (safeStr(data[i][5]) === '착석') return { success: false, message: '착석 상태에서는 불참 처리 불가' };
        sheet.getRange(i + 1, 6).setValue('불참');
        sheet.getRange(i + 1, 9).setValue('');
        return { success: true, message: data[i][4] + ' 님 불참 처리 완료' };
      }
    }
    return { success: false, message: '내빈을 찾을 수 없습니다.' };
  } catch (e) { return { success: false, message: '오류: ' + e.message }; }
}

// ─── 불참 취소 ────────────────────────────────────────────
function cancelAbsent(guestId) {
  try {
    var ss = getDataSS(), sheet = ss.getSheetByName(GUEST_SHEET);
    if (!sheet) throw new Error('시트 없음');
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (safeStr(data[i][0]) === String(guestId)) {
        if (safeStr(data[i][5]) !== '불참') return { success: false, message: '불참 상태가 아닙니다.' };
        sheet.getRange(i + 1, 6).setValue('대기');
        return { success: true, message: data[i][4] + ' 님 불참 취소 → 대기' };
      }
    }
    return { success: false, message: '내빈을 찾을 수 없습니다.' };
  } catch (e) { return { success: false, message: '오류: ' + e.message }; }
}

// ─── 착석 처리 ────────────────────────────────────────────
function processSeat(guestId, seatNumber) {
  try {
    var ss = getDataSS(), gs = ss.getSheetByName(GUEST_SHEET), ss2 = ss.getSheetByName(SEAT_SHEET);
    if (!gs || !ss2) throw new Error('시트 없음');
    var now = getNow(), gd = gs.getDataRange().getValues(), sd = ss2.getDataRange().getValues();
    var gr = -1, gi = null;
    for (var i = 1; i < gd.length; i++) {
      if (safeStr(gd[i][0]) === String(guestId)) {
        gr = i + 1;
        gi = { id: safeStr(gd[i][0]), nm: safeStr(gd[i][4]), org: safeStr(gd[i][2]), title: safeStr(gd[i][3]), prev: safeStr(gd[i][7]) };
        break;
      }
    }
    if (gr === -1) return { success: false, message: '내빈 없음' };
    // 이전 좌석 비우기
    if (gi.prev) {
      for (var i = 1; i < sd.length; i++) {
        if (safeStr(sd[i][0]) === gi.prev) {
          var r = i + 1;
          ss2.getRange(r, 4).setValue('공석');
          ss2.getRange(r, 5).setValue('');
          ss2.getRange(r, 6).setValue('');
          ss2.getRange(r, 7).setValue('');
          ss2.getRange(r, 8).setValue('');
          ss2.getRange(r, 9).setValue(now);
          break;
        }
      }
    }
    // 새 좌석 착석
    for (var i = 1; i < sd.length; i++) {
      if (safeStr(sd[i][0]) === seatNumber) {
        var r = i + 1;
        if (safeStr(sd[i][3]) === '착석' && safeStr(sd[i][4]) !== String(guestId))
          return { success: false, message: seatNumber + ' 이미 다른 내빈 착석' };
        ss2.getRange(r, 4).setValue('착석');
        ss2.getRange(r, 5).setValue(gi.id);
        ss2.getRange(r, 6).setValue(gi.nm);
        ss2.getRange(r, 7).setValue(gi.org);
        ss2.getRange(r, 8).setValue(gi.title);
        ss2.getRange(r, 9).setValue(now);
        break;
      }
    }
    gs.getRange(gr, 6).setValue('착석');
    gs.getRange(gr, 8).setValue(seatNumber);
    gs.getRange(gr, 10).setValue(now);
    return { success: true, message: gi.nm + ' → ' + seatNumber + ' 착석 완료' };
  } catch (e) { return { success: false, message: '오류: ' + e.message }; }
}

// ─── 착석 취소 ────────────────────────────────────────────
function cancelSeat(seatNumber) {
  try {
    var ss = getDataSS(), gs = ss.getSheetByName(GUEST_SHEET), ss2 = ss.getSheetByName(SEAT_SHEET);
    if (!gs || !ss2) throw new Error('시트 없음');
    var now = getNow(), sd = ss2.getDataRange().getValues();
    var gid = '', gnm = '';
    for (var i = 1; i < sd.length; i++) {
      if (safeStr(sd[i][0]) === seatNumber) {
        if (safeStr(sd[i][3]) !== '착석') return { success: false, message: '비어있는 좌석' };
        gid = safeStr(sd[i][4]); gnm = safeStr(sd[i][5]);
        var r = i + 1;
        ss2.getRange(r, 4).setValue('공석');
        ss2.getRange(r, 5).setValue('');
        ss2.getRange(r, 6).setValue('');
        ss2.getRange(r, 7).setValue('');
        ss2.getRange(r, 8).setValue('');
        ss2.getRange(r, 9).setValue(now);
        break;
      }
    }
    if (!gid) return { success: false, message: '좌석 정보 없음' };
    var gd = gs.getDataRange().getValues();
    for (var i = 1; i < gd.length; i++) {
      if (safeStr(gd[i][0]) === gid) {
        gs.getRange(i + 1, 6).setValue('입장');
        gs.getRange(i + 1, 8).setValue('');
        gs.getRange(i + 1, 10).setValue('');
        break;
      }
    }
    return { success: true, message: gnm + ' 착석 취소 → ' + seatNumber + ' 공석' };
  } catch (e) { return { success: false, message: '오류: ' + e.message }; }
}

// ─── 현장 추가 ────────────────────────────────────────────
function addGuest(info) {
  try {
    var ss = getDataSS(), sheet = ss.getSheetByName(GUEST_SHEET);
    if (!sheet) throw new Error('시트 없음');
    var now = getNow(), lastRow = sheet.getLastRow();
    var newId = '현장' + String(lastRow).padStart(3, '0');
    sheet.appendRow([newId, 999, info.소속 || '', info.직함 || '', info.이름, '입장', info.지정좌석 || '', '', now, '', '현장추가']);
    return { success: true, message: info.이름 + ' 님 현장 추가 완료 (자동 입장)', id: newId };
  } catch (e) { return { success: false, message: '추가 오류: ' + e.message }; }
}

// ─── 소개 완료 토글 (비고 컬럼 활용 또는 별도 처리) ──────
// 소개완료는 프론트엔드 로컬 상태로 관리 (스프레드시트에 컬럼 없음)
function toggleIntroduced(guestId) {
  // 소개완료 기능은 프론트엔드에서 로컬 상태로 관리
  return { success: true, value: 'toggled' };
}

// ─── 데이터 초기화 ────────────────────────────────────────
function resetAllData() {
  var ss = getDataSS();
  var gs = ss.getSheetByName(GUEST_SHEET);
  if (gs) {
    var lr = gs.getLastRow();
    if (lr > 1) {
      var r = lr - 1;
      gs.getRange(2, 6, r, 1).setValue('대기');  // 상태
      gs.getRange(2, 8, r, 1).setValue('');       // 실제좌석
      gs.getRange(2, 9, r, 1).setValue('');       // 입장시간
      gs.getRange(2, 10, r, 1).setValue('');      // 착석시간
    }
  }
  var ss2 = ss.getSheetByName(SEAT_SHEET);
  if (ss2) {
    var lr = ss2.getLastRow();
    if (lr > 1) {
      var r = lr - 1;
      ss2.getRange(2, 4, r, 1).setValue('공석');
      ss2.getRange(2, 5, r, 1).setValue('');
      ss2.getRange(2, 6, r, 1).setValue('');
      ss2.getRange(2, 7, r, 1).setValue('');
      ss2.getRange(2, 8, r, 1).setValue('');
      ss2.getRange(2, 9, r, 1).setValue('');
    }
  }
  return { success: true, message: '모든 데이터가 초기화되었습니다.' };
}
