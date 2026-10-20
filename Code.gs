/**
 * GOOGLE APPS SCRIPT - UCAPAN & RSVP (YANNI & IMAM)
 * Spreadsheet ID: 1b8wueKuOUzFJijlPkjUQmWfKh4Ey8a8ZP6PIIeYbfSA
 * Sheet Name: Sheet1
 * 
 * Urutan Kolom:
 * 1. timestamp
 * 2. nama tamu
 * 3. ucapan
 * 4. konfirmasi kehadiran
 * 5. jumlah tamu
 */

const SPREADSHEET_ID = "1b8wueKuOUzFJijlPkjUQmWfKh4Ey8a8ZP6PIIeYbfSA";
const SHEET_NAME = "Sheet1";

function getTargetSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  // Buat header jika sheet masih kosong
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "timestamp",
      "nama tamu",
      "ucapan",
      "konfirmasi kehadiran",
      "jumlah tamu"
    ]);
    sheet.getRange(1, 1, 1, 5).setFontWeight("bold").setBackground("#541E24").setFontColor("#FFFFFF");
  }
  return sheet;
}

// Handler GET: Mengambil daftar ucapan untuk ditampilkan di web
function doGet(e) {
  try {
    const sheet = getTargetSheet();
    const data = sheet.getDataRange().getValues();

    if (data.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        total: 0,
        data: []
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Baris pertama adalah header
    const rows = data.slice(1);
    const ucapanList = [];

    // Tampilkan dari yang paling baru (paling bawah di spreadsheet)
    for (let i = rows.length - 1; i >= 0; i--) {
      const row = rows[i];
      // Pastikan ada nama atau ucapan
      if (row[1] || row[2]) {
        let ts = row[0];
        if (ts instanceof Date) {
          ts = Utilities.formatDate(ts, "Asia/Jakarta", "dd MMM yyyy, HH:mm");
        } else if (ts) {
          ts = String(ts);
        } else {
          ts = "-";
        }

        ucapanList.push({
          timestamp: ts,
          nama: String(row[1] || "Tamu Undangan"),
          ucapan: String(row[2] || ""),
          kehadiran: String(row[3] || "Hadir"),
          jumlahTamu: String(row[4] || "0")
        });
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      total: ucapanList.length,
      data: ucapanList
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Handler POST: Menerima kiriman form ucapan & RSVP dari web
function doPost(e) {
  try {
    let payload = {};

    if (e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (err) {
        payload = e.parameter || {};
      }
    } else if (e.parameter) {
      payload = e.parameter;
    }

    const nama = (payload.nama || payload.author || payload["nama tamu"] || "Tamu Undangan").toString().trim();
    const ucapan = (payload.ucapan || payload.comment || "").toString().trim();
    let kehadiran = (payload.kehadiran || payload.attendance || "Hadir").toString().trim();
    
    // Normalisasi kehadiran
    if (kehadiran === "present") kehadiran = "Hadir";
    if (kehadiran === "notpresent") kehadiran = "Tidak Hadir";

    let jumlahTamu = "0";
    if (kehadiran === "Hadir") {
      jumlahTamu = (payload.jumlahTamu || payload.guest || "1").toString().trim();
      if (!jumlahTamu || jumlahTamu === "0") jumlahTamu = "1";
    }

    const timestamp = new Date();
    const sheet = getTargetSheet();

    // Tambah baris baru sesuai urutan kolom yang diminta
    sheet.appendRow([
      timestamp,
      nama,
      ucapan,
      kehadiran,
      jumlahTamu
    ]);

    const formattedTs = Utilities.formatDate(timestamp, "Asia/Jakarta", "dd MMM yyyy, HH:mm");

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Ucapan & konfirmasi kehadiran berhasil terkirim!",
      data: {
        timestamp: formattedTs,
        nama: nama,
        ucapan: ucapan,
        kehadiran: kehadiran,
        jumlahTamu: jumlahTamu
      }
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
