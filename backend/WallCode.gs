// ============================================================
// 방명록 시스템 — Google Apps Script 백엔드 (REST API)
// Original idea by SkyStar
// ============================================================

var WALL_SPREADSHEET_ID = '16aMF3MHX6fcFAvOPKsS6M4QAAAlU6ya9jGxKV1c01WE';
var WALL_FOLDER_ID      = '1ZSGgp2tK84KdmAEkcj8Gu-S51GMasCkT';   // ← Google Drive 폴더 ID 입력 필요
var WALL_SHEET_NAME     = 'messages';
var WALL_COLOR_SHEET    = '색상설정';
var WALL_EVENT_SHEET    = '이벤트설정';

// ── GET: REST API 라우팅 ──────────────────────────────────
function doGet(e) {
  var action = (e && e.parameter) ? e.parameter.action : '';
  var result;

  try {
    switch (action) {
      case 'getMessages':
        result = { success: true, data: wallGetMessages() };
        break;
      case 'getColorSettings':
        result = { success: true, data: wallGetColorSettings() };
        break;
      case 'getEventSettings':
        result = { success: true, data: wallGetEventSettings() };
        break;
      case 'getImageBase64':
        var fileId = e.parameter.fileId;
        result = { success: true, data: wallGetImageBase64(fileId) };
        break;
      case 'testConnection':
        result = { success: true, data: wallTestConnection() };
        break;
      default:
        result = { success: false, message: 'Unknown action: ' + action };
    }
  } catch (err) {
    result = { success: false, message: err.message };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── POST: REST API 라우팅 ─────────────────────────────────
function doPost(e) {
  var result;

  try {
    var body = JSON.parse(e.postData.contents);
    var action = body.action;

    switch (action) {
      case 'submitMessage':
        result = wallSubmitMessage(body);
        break;
      default:
        result = { success: false, message: 'Unknown action: ' + action };
    }
  } catch (err) {
    result = { success: false, message: err.message };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── 메시지 제출 ───────────────────────────────────────────
function wallSubmitMessage(data) {
  var nickname = wallCleanText(data.nickname) || '익명';
  var base64   = data.imageBase64;

  if (!base64 || base64.indexOf('data:image/png;base64,') !== 0)
    return { success: false, message: '이미지 데이터가 올바르지 않습니다.' };

  var rawBase64 = base64.split(',')[1];
  var decoded   = Utilities.base64Decode(rawBase64);
  var blob      = Utilities.newBlob(decoded, 'image/png', 'sign_' + Date.now() + '.png');

  var folder = DriveApp.getFolderById(WALL_FOLDER_ID);
  var file   = folder.createFile(blob);
  
  // 이미지를 전광판에서 바로 로드할 수 있도록 권한을 '링크가 있는 모든 사용자 보기'로 변경합니다.
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) {
    Logger.log('공유 권한 설정 실패: ' + e.message);
  }

  var sheet = wallGetOrCreateSheet();
  sheet.appendRow([
    new Date(),
    nickname,
    '',
    file.getId()
  ]);

  Logger.log('저장 성공: ' + file.getId());
  return { success: true, message: '등록되었습니다! 💗' };
}

// ── 메시지 목록 반환 (최신순) ─────────────────────────────
function wallGetMessages() {
  var sheet   = wallGetOrCreateSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  var data   = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
  var result = [];

  for (var i = 0; i < data.length; i++) {
    var row      = data[i];
    var ts       = row[0];
    var nickname = String(row[1]).trim() || '익명';
    var fileId   = String(row[3]).trim();

    if (!fileId) continue;

    result.push({
      id      : 'r' + (i + 2),
      nickname: nickname,
      fileId  : fileId,
      time    : ts ? new Date(ts).getTime() : 0
    });
  }

  result.sort(function(a, b) { return b.time - a.time; });
  return result;
}

// ── 색상 설정 조회 ────────────────────────────────────────
function wallGetColorSettings() {
  var sheet   = wallGetOrCreateColorSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return wallGetDefaultColors();

  var data   = sheet.getRange(2, 1, lastRow - 1, 3).getValues();
  var result = [];

  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var bg  = String(row[1]).trim();
    var txt = String(row[2]).trim();
    if (bg) result.push({ bg: bg, text: txt });
  }

  return result.length ? result : wallGetDefaultColors();
}

function wallGetDefaultColors() {
  return [
    { bg: '#fef08a', text: '#713f12' },
    { bg: '#93c5fd', text: '#1e3a5f' },
    { bg: '#c4b5fd', text: '#3b0764' },
    { bg: '#6ee7b7', text: '#064e3b' },
    { bg: '#fca5a5', text: '#7f1d1d' },
  ];
}

// ── 이벤트 설정 조회 ──────────────────────────────────────
function wallGetEventSettings() {
  var sheet = wallGetOrCreateEventSheet();
  var data  = sheet.getRange(2, 2, 3, 1).getValues();
  return {
    title : String(data[0][0]).trim() || '서울사회복지사협회 창립 40주년 기념행사',
    date  : String(data[1][0]).trim() || '2026.4.22(수)',
    place : String(data[2][0]).trim() || '백범김구기념관'
  };
}

// ── 이미지 프록시 ─────────────────────────────────────────
function wallGetImageBase64(fileId) {
  try {
    var file = DriveApp.getFileById(fileId);
    var blob = file.getBlob();
    return 'data:' + blob.getContentType() + ';base64,' + Utilities.base64Encode(blob.getBytes());
  } catch (e) {
    Logger.log('getImageBase64 오류 (fileId=' + fileId + '): ' + e.message);
    return null;
  }
}

// ── 연결 테스트 ───────────────────────────────────────────
function wallTestConnection() {
  var ss = SpreadsheetApp.openById(WALL_SPREADSHEET_ID);
  var sheets = ss.getSheets().map(function(s) { return s.getName(); });
  var msgSheet = ss.getSheetByName(WALL_SHEET_NAME);
  return {
    spreadsheetName: ss.getName(),
    sheets: sheets,
    messageSheetExists: !!msgSheet,
    messageRows: msgSheet ? msgSheet.getLastRow() : 0,
    folderConfigured: !!WALL_FOLDER_ID
  };
}

// ── messages 시트 생성/조회 ───────────────────────────────
function wallGetOrCreateSheet() {
  var ss    = SpreadsheetApp.openById(WALL_SPREADSHEET_ID);
  var sheet = ss.getSheetByName(WALL_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(WALL_SHEET_NAME);
    sheet.getRange(1, 1, 1, 4)
      .setValues([['타임스탬프', '닉네임', '이미지URL', '파일ID']])
      .setFontWeight('bold')
      .setBackground('#fce4ec');
    sheet.setColumnWidth(1, 160);
    sheet.setColumnWidth(2, 120);
    sheet.setColumnWidth(3, 400);
    sheet.setColumnWidth(4, 200);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// ── 색상설정 시트 생성/조회 ───────────────────────────────
function wallGetOrCreateColorSheet() {
  var ss    = SpreadsheetApp.openById(WALL_SPREADSHEET_ID);
  var sheet = ss.getSheetByName(WALL_COLOR_SHEET);
  if (sheet) return sheet;

  sheet = ss.insertSheet(WALL_COLOR_SHEET);
  sheet.getRange(1, 1, 1, 3)
    .setValues([['색상 이름', '배경색', '글자색']])
    .setFontWeight('bold')
    .setBackground('#e8f0fe')
    .setHorizontalAlignment('center');
  sheet.setFrozenRows(1);

  var colors = [
    ['노랑',   '#fef08a', '#713f12'],
    ['하늘',   '#93c5fd', '#1e3a5f'],
    ['연보라', '#c4b5fd', '#3b0764'],
    ['민트',   '#6ee7b7', '#064e3b'],
    ['연빨강', '#fca5a5', '#7f1d1d'],
  ];

  for (var i = 0; i < colors.length; i++) {
    var r = i + 2;
    var c = colors[i];
    sheet.getRange(r, 1).setValue(c[0]);
    sheet.getRange(r, 2).setValue(c[1]).setBackground(c[1]).setFontColor(c[2]).setFontWeight('bold').setHorizontalAlignment('center');
    sheet.getRange(r, 3).setValue(c[2]).setBackground(c[2]).setFontColor(c[1]).setFontWeight('bold').setHorizontalAlignment('center');
  }

  sheet.setColumnWidth(1, 100);
  sheet.setColumnWidth(2, 140);
  sheet.setColumnWidth(3, 140);
  sheet.getRange(1, 5).setValue('💡 배경색 코드를 직접 수정하면 포스트잇 색상이 바뀝니다').setFontWeight('bold');
  sheet.setColumnWidth(5, 340);
  return sheet;
}

// ── 이벤트설정 시트 생성/조회 ─────────────────────────────
function wallGetOrCreateEventSheet() {
  var ss    = SpreadsheetApp.openById(WALL_SPREADSHEET_ID);
  var sheet = ss.getSheetByName(WALL_EVENT_SHEET);
  if (sheet) return sheet;

  sheet = ss.insertSheet(WALL_EVENT_SHEET);
  sheet.getRange(1, 1, 1, 2)
    .setValues([['항목', '값']])
    .setFontWeight('bold')
    .setBackground('#e8eaf6')
    .setHorizontalAlignment('center');
  sheet.setFrozenRows(1);

  var rows = [
    ['프로그램명', '서울사회복지사협회 창립 40주년 기념행사'],
    ['날짜',       '2026.4.22(수)'],
    ['장소',       '백범김구기념관']
  ];
  sheet.getRange(2, 1, 3, 2).setValues(rows);
  sheet.setColumnWidth(1, 120);
  sheet.setColumnWidth(2, 300);
  sheet.getRange(1, 4).setValue('💡 값을 수정하면 방명록 이미지에 반영됩니다').setFontWeight('bold');
  sheet.setColumnWidth(4, 340);
  return sheet;
}

// ── 유틸 ──────────────────────────────────────────────────
function wallCleanText(str) {
  if (!str) return '';
  return String(str).replace(/<[^>]*>/g, '').trim().slice(0, 100);
}
