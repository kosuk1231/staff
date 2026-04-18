// ============================================================
// 방명록 시스템 — Google Apps Script 백엔드 (REST API)
// 스프레드시트 ID: 1nhrBH-MYG_vvIH1OH0b1KamqG1ZPjfbNIJ_QjjAlFBE
// ============================================================

var GB_SPREADSHEET_ID = '1nhrBH-MYG_vvIH1OH0b1KamqG1ZPjfbNIJ_QjjAlFBE';
var GB_SHEET_NAME = '방명록';

// ── GET: REST API 라우팅 ──────────────────────────────────
function doGet(e) {
  var action = (e && e.parameter) ? e.parameter.action : '';
  var result;

  try {
    switch (action) {
      case 'getMessages':
        result = { success: true, data: gbGetMessages() };
        break;
      case 'testConnection':
        result = { success: true, data: gbTestConnection() };
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
        result = gbSubmitMessage(body.name, body.message);
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
function gbSubmitMessage(name, message) {
  if (!name || !message) {
    return { success: false, message: '이름과 응원메시지를 모두 입력해주세요.' };
  }

  var sheet = gbGetOrCreateSheet();
  sheet.appendRow([
    new Date(),
    String(name).trim().slice(0, 50),
    String(message).trim().slice(0, 500)
  ]);

  return { success: true, message: '응원메시지가 등록되었습니다! 💗' };
}

// ── 메시지 목록 반환 (최신순) ─────────────────────────────
function gbGetMessages() {
  var sheet = gbGetOrCreateSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  var data = sheet.getRange(2, 1, lastRow - 1, 3).getValues();
  var result = [];

  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var ts = row[0];
    var name = String(row[1]).trim() || '익명';
    var message = String(row[2]).trim();

    if (!message) continue;

    result.push({
      id: 'gb_' + (i + 2),
      name: name,
      message: message,
      time: ts ? new Date(ts).getTime() : 0
    });
  }

  result.sort(function(a, b) { return b.time - a.time; });
  return result;
}

// ── 연결 테스트 ───────────────────────────────────────────
function gbTestConnection() {
  var ss = SpreadsheetApp.openById(GB_SPREADSHEET_ID);
  var sheet = ss.getSheetByName(GB_SHEET_NAME);
  return {
    spreadsheetName: ss.getName(),
    sheetExists: !!sheet,
    messageCount: sheet ? Math.max(0, sheet.getLastRow() - 1) : 0
  };
}

// ── 시트 생성/조회 ────────────────────────────────────────
function gbGetOrCreateSheet() {
  var ss = SpreadsheetApp.openById(GB_SPREADSHEET_ID);
  var sheet = ss.getSheetByName(GB_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(GB_SHEET_NAME);
    sheet.getRange(1, 1, 1, 3)
      .setValues([['타임스탬프', '이름', '응원메시지']])
      .setFontWeight('bold')
      .setBackground('#fce4ec');
    sheet.setColumnWidth(1, 160);
    sheet.setColumnWidth(2, 100);
    sheet.setColumnWidth(3, 400);
    sheet.setFrozenRows(1);
  }
  return sheet;
}
