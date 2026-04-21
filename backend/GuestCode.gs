/* ═══════════════════════════════════════════════════════════
 *  내빈 의전 시스템 — Google Apps Script REST API 백엔드
 *  Original idea by SkyStar
 *  별도 스프레드시트 연결 버전
 * ═══════════════════════════════════════════════════════════ */

// ─── 환경 상수 ────────────────────────────────────────────
var DATA_SPREADSHEET_ID = '1QPNziN0O-SX6EN6C9Qt34iFhXPRdkXVoI9IUvvmiN3c';
var GUEST_SHEET = '01_내빈명단';
var SEAT_SHEET = '02_좌석세팅';
var OPTION_SHEET = '00_옵션';
var COUNCIL_SHEET = '03_주요내빈';
var PHOTO_FOLDER_ID = '17T6sxrrRWF3Bh16u5BxyvCBRpmf7LWsB';

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
      case 'getCouncilData':
        result = { success: true, data: getCouncilData() };
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
            councilData: getCouncilData()
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
        result = processEntry(body.guestId, body.rowIndex);
        break;
      case 'cancelEntry':
        result = cancelEntry(body.guestId, body.rowIndex);
        break;
      case 'processAbsent':
        result = processAbsent(body.guestId, body.rowIndex);
        break;
      case 'cancelAbsent':
        result = cancelAbsent(body.guestId, body.rowIndex);
        break;
      case 'processSeat':
        result = processSeat(body.guestId, body.seatNumber, body.rowIndex);
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

// 좌석번호용: "3-4"가 날짜(3월4일)로 저장될 때 복원
function safeStrSeat(v) {
  if (!v) return '';
  if (v instanceof Date) return (v.getMonth() + 1) + '-' + v.getDate();
  return String(v).trim();
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

// ─── 주요내빈 전체 데이터 (03_주요내빈 시트) ────────────────
// 컬럼: A=번호 B=이름 C=구분 D=소속 E=소속정당
function getCouncilData() {
  try {
    var ss = getDataSS(), sheet = ss.getSheetByName(COUNCIL_SHEET);
    if (!sheet) return [];
    var lr = sheet.getLastRow();
    if (lr <= 1) return [];
    var data = sheet.getRange(2, 1, lr - 1, 5).getValues();
    var namePhotoMap = getPhotoMapByName();
    var members = [];
    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      var name = safeStr(row[1]);
      if (!name) continue;
      members.push({
        번호: Number(row[0]) || (i + 1),
        이름: name,
        구분: safeStr(row[2]),
        소속: safeStr(row[3]),
        소속정당: safeStr(row[4]),
        photoFileId: namePhotoMap[name] || ''
      });
    }
    return members;
  } catch (e) {
    return [];
  }
}

// 하위호환용 ID 목록 (더이상 사용 안 함, 유지만)
function getCouncilList() {
  return getCouncilData().map(function(m) { return m.이름; });
}

// ─── 이름 기반 사진 맵 (이름 → fileId) ──────────────────
function getPhotoMapByName() {
  if (!PHOTO_FOLDER_ID) return {};
  try {
    var folder = DriveApp.getFolderById(PHOTO_FOLDER_ID);
    var files = folder.getFiles();
    var map = {};
    while (files.hasNext()) {
      var file = files.next();
      var raw = file.getName().replace(/\.[^.]+$/, ''); // 확장자 제거
      // "1_오세훈", "오세훈" 등 이름 추출
      var match = raw.match(/_(.+)$/);
      var key = match ? match[1].trim() : raw.trim();
      if (key) map[key] = file.getId();
    }
    return map;
  } catch (e) {
    return {};
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

// ─── 내빈 명단 읽기 (14열 구조) ──────────────────────────
// A:내빈ID B:우선순위 C:구분 D:성함 E:소속 F:연락처 G:이메일
// H:상태 I:지정좌석 J:실제좌석 K:입장시간 L:착석시간 M:비고 N:소개완료
function getGuestList() {
  try {
    var ss = getDataSS(), sheet = ss.getSheetByName(GUEST_SHEET);
    if (!sheet) throw new Error('"' + GUEST_SHEET + '" 시트 없음');
    var lr = sheet.getLastRow(), lc = sheet.getLastColumn();
    if (lr <= 1 || lc === 0) return [];
    var data = sheet.getRange(1, 1, lr, Math.min(lc, 14)).getValues();
    var guests = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row[0] && !row[3]) continue; // 내빈ID·성함 둘 다 없으면 제외
      guests.push({
        rowIndex: i + 1,
        내빈ID: safeStr(row[0]),
        우선순위: (row[1] === '' || row[1] === null || row[1] === undefined) ? 999 : Number(row[1]),
        구분: safeStr(row[2]),
        이름: safeStr(row[3]),      // D열: 성함
        소속: safeStr(row[4]),      // E열: 소속
        연락처: safeStr(row[5]),    // F열: 연락처
        이메일: safeStr(row[6]),    // G열: 이메일
        상태: safeStr(row[7]) || '대기',  // H열: 상태
        지정좌석: safeStrSeat(row[8]),    // I열: 지정좌석
        실제좌석: safeStrSeat(row[9]),    // J열: 실제좌석
        입장시간: fmtTime(row[10]),       // K열: 입장시간
        착석시간: fmtTime(row[11]),       // L열: 착석시간
        비고: safeStr(row[12]),           // M열: 비고
        소개완료: safeStr(row[13])        // N열: 소개완료
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
        좌석번호: safeStrSeat(row[0]),
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
function processEntry(guestId, rowIndex) {
  try {
    var ss = getDataSS(), sheet = ss.getSheetByName(GUEST_SHEET);
    if (!sheet) throw new Error('시트 없음');
    var now = getNow();
    if (rowIndex > 1) {
      var row = sheet.getRange(rowIndex, 1, 1, 14).getValues()[0];
      if (safeStr(row[7]) === '착석') return { success: false, message: '이미 착석 상태입니다.' };
      sheet.getRange(rowIndex, 8).setValue('입장');   // H열: 상태
      sheet.getRange(rowIndex, 11).setValue(now);     // K열: 입장시간
      return { success: true, message: safeStr(row[3]) + ' 님 입장 처리 완료' };
    }
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (safeStr(data[i][0]) === String(guestId)) {
        if (safeStr(data[i][7]) === '착석') return { success: false, message: '이미 착석 상태입니다.' };
        sheet.getRange(i + 1, 8).setValue('입장');
        sheet.getRange(i + 1, 11).setValue(now);
        return { success: true, message: data[i][3] + ' 님 입장 처리 완료' };
      }
    }
    return { success: false, message: '내빈을 찾을 수 없습니다.' };
  } catch (e) { return { success: false, message: '오류: ' + e.message }; }
}

// ─── 입장 취소 ────────────────────────────────────────────
function cancelEntry(guestId, rowIndex) {
  try {
    var ss = getDataSS(), sheet = ss.getSheetByName(GUEST_SHEET);
    if (!sheet) throw new Error('시트 없음');
    if (rowIndex > 1) {
      var row = sheet.getRange(rowIndex, 1, 1, 14).getValues()[0];
      if (safeStr(row[7]) !== '입장') return { success: false, message: '입장 상태가 아닙니다.' };
      sheet.getRange(rowIndex, 8).setValue('대기');   // H열: 상태
      sheet.getRange(rowIndex, 11).setValue('');      // K열: 입장시간
      return { success: true, message: safeStr(row[3]) + ' 님 입장 취소' };
    }
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (safeStr(data[i][0]) === String(guestId)) {
        if (safeStr(data[i][7]) !== '입장') return { success: false, message: '입장 상태가 아닙니다.' };
        sheet.getRange(i + 1, 8).setValue('대기');
        sheet.getRange(i + 1, 11).setValue('');
        return { success: true, message: data[i][3] + ' 님 입장 취소' };
      }
    }
    return { success: false, message: '내빈을 찾을 수 없습니다.' };
  } catch (e) { return { success: false, message: '오류: ' + e.message }; }
}

// ─── 불참 처리 ────────────────────────────────────────────
function processAbsent(guestId, rowIndex) {
  try {
    var ss = getDataSS(), sheet = ss.getSheetByName(GUEST_SHEET);
    if (!sheet) throw new Error('시트 없음');
    if (rowIndex > 1) {
      var row = sheet.getRange(rowIndex, 1, 1, 14).getValues()[0];
      if (safeStr(row[7]) === '착석') return { success: false, message: '착석 상태에서는 불참 처리 불가' };
      sheet.getRange(rowIndex, 8).setValue('불참');   // H열: 상태
      sheet.getRange(rowIndex, 11).setValue('');      // K열: 입장시간
      return { success: true, message: safeStr(row[3]) + ' 님 불참 처리 완료' };
    }
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (safeStr(data[i][0]) === String(guestId)) {
        if (safeStr(data[i][7]) === '착석') return { success: false, message: '착석 상태에서는 불참 처리 불가' };
        sheet.getRange(i + 1, 8).setValue('불참');
        sheet.getRange(i + 1, 11).setValue('');
        return { success: true, message: data[i][3] + ' 님 불참 처리 완료' };
      }
    }
    return { success: false, message: '내빈을 찾을 수 없습니다.' };
  } catch (e) { return { success: false, message: '오류: ' + e.message }; }
}

// ─── 불참 취소 ────────────────────────────────────────────
function cancelAbsent(guestId, rowIndex) {
  try {
    var ss = getDataSS(), sheet = ss.getSheetByName(GUEST_SHEET);
    if (!sheet) throw new Error('시트 없음');
    if (rowIndex > 1) {
      var row = sheet.getRange(rowIndex, 1, 1, 14).getValues()[0];
      if (safeStr(row[7]) !== '불참') return { success: false, message: '불참 상태가 아닙니다.' };
      sheet.getRange(rowIndex, 8).setValue('대기');   // H열: 상태
      return { success: true, message: safeStr(row[3]) + ' 님 불참 취소 → 대기' };
    }
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (safeStr(data[i][0]) === String(guestId)) {
        if (safeStr(data[i][7]) !== '불참') return { success: false, message: '불참 상태가 아닙니다.' };
        sheet.getRange(i + 1, 8).setValue('대기');
        return { success: true, message: data[i][3] + ' 님 불참 취소 → 대기' };
      }
    }
    return { success: false, message: '내빈을 찾을 수 없습니다.' };
  } catch (e) { return { success: false, message: '오류: ' + e.message }; }
}

// ─── 착석 처리 ────────────────────────────────────────────
function processSeat(guestId, seatNumber, rowIndex) {
  try {
    var ss = getDataSS(), gs = ss.getSheetByName(GUEST_SHEET), ss2 = ss.getSheetByName(SEAT_SHEET);
    if (!gs || !ss2) throw new Error('시트 없음');
    var now = getNow(), sd = ss2.getDataRange().getValues();
    var gr = -1, gi = null;
    if (rowIndex > 1) {
      var rv = gs.getRange(rowIndex, 1, 1, 14).getValues()[0];
      gr = rowIndex;
      gi = { id: safeStr(rv[0]), nm: safeStr(rv[3]), org: safeStr(rv[4]), prev: safeStrSeat(rv[9]) };
    } else {
      var gd = gs.getDataRange().getValues();
      for (var i = 1; i < gd.length; i++) {
        if (safeStr(gd[i][0]) === String(guestId)) {
          gr = i + 1;
          gi = { id: safeStr(gd[i][0]), nm: safeStr(gd[i][3]), org: safeStr(gd[i][4]), prev: safeStrSeat(gd[i][9]) };
          break;
        }
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
        ss2.getRange(r, 8).setValue('');   // 직함 없음
        ss2.getRange(r, 9).setValue(now);
        break;
      }
    }
    gs.getRange(gr, 8).setValue('착석');   // H열: 상태
    var seatCell = gs.getRange(gr, 10);    // J열: 실제좌석
    seatCell.setNumberFormat('@');
    seatCell.setValue(seatNumber);
    gs.getRange(gr, 12).setValue(now);     // L열: 착석시간
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
        gs.getRange(i + 1, 8).setValue('입장');    // H열: 상태
        gs.getRange(i + 1, 10).setValue('');       // J열: 실제좌석
        gs.getRange(i + 1, 12).setValue('');       // L열: 착석시간
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
    // A:내빈ID B:우선순위 C:구분 D:성함 E:소속 F:연락처 G:이메일 H:상태 I:지정좌석 J:실제좌석 K:입장시간 L:착석시간 M:비고 N:소개완료
    sheet.appendRow([newId, 999, info.구분 || '현장', info.이름, info.소속 || '', '', '', '입장', info.지정좌석 || '', '', now, '', '현장추가', '']);
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
      gs.getRange(2, 8, r, 1).setValue('대기');  // H열: 상태
      gs.getRange(2, 10, r, 1).setValue('');      // J열: 실제좌석
      gs.getRange(2, 11, r, 1).setValue('');      // K열: 입장시간
      gs.getRange(2, 12, r, 1).setValue('');      // L열: 착석시간
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
