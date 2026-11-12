/**
 * TNXUS CLUB — Backend Google Apps Script (Web App)
 * Brand kaos "TNXUS CLUB"
 *
 * Deploy: Deploy → New deployment → Web app
 *   Execute as: Me
 *   Who has access: Anyone
 *
 * Response SEMUA endpoint: {ok:true, data:...} atau {ok:false, error:"..."}
 * Format JSON via ContentService.
 *
 * CATATAN CORS: Google Apps Script TIDAK bisa menerima preflight OPTIONS.
 * Frontend (customer/admin) WAJIB kirim POST dengan header
 *   Content-Type: text/plain;charset=utf-8
 * dan body berupa string JSON (tetap di-parse server dengan JSON.parse).
 * Ini menghindari preflight sehingga cross-origin BERHASIL.
 * GET tidak bermasalah.
 */

// GANTI: isi dengan ID Google Sheets Anda (ambil dari URL spreadsheet di antara /d/ dan /edit)
var SHEET_ID = "GANTI_DENGAN_SPREADSHEET_ID_ANDA";

// Nama sheet (WAJIB persis sesuai kontrak)
var SHEET_PRODUK = "produk";
var SHEET_PESANAN = "pesanan";
var SHEET_VOUCHER = "voucher";

// Header kolom sesuai kontrak
var PRODUK_HEADERS = ["id", "kategori", "nama", "deskripsi", "foto_url", "harga", "ukuran", "stok", "aktif"];
var PESANAN_HEADERS = ["id_pesanan", "timestamp", "nama", "no_wa", "alamat", "items", "voucher", "total", "total_akhir", "status"];
var VOUCHER_HEADERS = ["kode", "tipe", "nilai", "aktif"];

/* ============================================================
 * UTILITAS
 * ============================================================ */

// Kirim response JSON seragam
function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function ok_(data) {
  return jsonOut_({ ok: true, data: data });
}

function err_(msg) {
  return jsonOut_({ ok: false, error: String(msg) });
}

// Ambil sheet; buat otomatis + tulis header jika belum ada
function getSheet_(nama, headers) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(nama);
  if (!sheet) {
    sheet = ss.insertSheet(nama);
    sheet.appendRow(headers);
    // Format header agar jelas
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#1a1a1a").setFontColor("#f5f5f5");
    sheet.setFrozenRows(1);
  } else {
    // Pastikan header terisi (jika sheet kosong)
    var firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
    var empty = firstRow.every(function (c) { return c === "" || c === null || c === undefined; });
    if (empty) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#1a1a1a").setFontColor("#f5f5f5");
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

// Parse nilai boolean dari sel
function toBool_(v) {
  if (typeof v === "boolean") return v;
  return String(v).trim().toLowerCase() === "true";
}

// Parse field array/JSON dari sel
function parseJson_(v) {
  if (v === "" || v === null || v === undefined) return [];
  if (typeof v === "object") return v;
  try {
    return JSON.parse(String(v));
  } catch (e) {
    return [];
  }
}

function toNum_(v) {
  var n = Number(v);
  return isNaN(n) ? 0 : n;
}

// Baca semua baris data (skip header) dari sheet
function readRows_(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var lastCol = sheet.getLastColumn();
  return sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
}

/* ============================================================
 * KONVERSI BARIS → OBJEK (sesuai skema kontrak)
 * ============================================================ */

function rowToProduk_(r) {
  return {
    id: String(r[0] || ""),
    kategori: String(r[1] || ""),
    nama: String(r[2] || ""),
    deskripsi: String(r[3] || ""),
    foto_url: String(r[4] || ""),
    harga: toNum_(r[5]),
    ukuran: parseJson_(r[6]),
    stok: toNum_(r[7]),
    aktif: toBool_(r[8])
  };
}

function rowToPesanan_(r) {
  return {
    id_pesanan: String(r[0] || ""),
    timestamp: r[1] instanceof Date ? r[1].toISOString() : String(r[1] || ""),
    nama: String(r[2] || ""),
    no_wa: String(r[3] || ""),
    alamat: String(r[4] || ""),
    items: parseJson_(r[5]),
    voucher: String(r[6] || ""),
    total: toNum_(r[7]),
    total_akhir: toNum_(r[8]),
    status: String(r[9] || "baru")
  };
}

function rowToVoucher_(r) {
  return {
    kode: String(r[0] || ""),
    tipe: String(r[1] || ""),
    nilai: toNum_(r[2]),
    aktif: toBool_(r[3])
  };
}

/* ============================================================
 * doGet — action via query param
 * ============================================================ */

function doGet(e) {
  try {
    var action = e && e.parameter && e.parameter.action ? String(e.parameter.action) : "";

    if (action === "getProduk") {
      var sheet = getSheet_(SHEET_PRODUK, PRODUK_HEADERS);
      var rows = readRows_(sheet);
      var aktifOnly = rows
        .map(rowToProduk_)
        .filter(function (p) { return p.aktif === true; });
      return ok_(aktifOnly);
    }

    if (action === "getVoucher") {
      var kode = e && e.parameter && e.parameter.kode ? String(e.parameter.kode).trim().toUpperCase() : "";
      if (!kode) return err_("Parameter kode wajib diisi");
      var vsheet = getSheet_(SHEET_VOUCHER, VOUCHER_HEADERS);
      var vrows = readRows_(vsheet);
      for (var i = 0; i < vrows.length; i++) {
        var v = rowToVoucher_(vrows[i]);
        if (v.kode.toUpperCase() === kode) {
          return ok_(v); // {kode, tipe, nilai, aktif} — frontend cek field aktif
        }
      }
      return err_("Voucher tidak ditemukan");
    }

    if (action === "getSemuaProduk") {
      var psheet = getSheet_(SHEET_PRODUK, PRODUK_HEADERS);
      var prows = readRows_(psheet).map(rowToProduk_);
      return ok_(prows);
    }

    if (action === "getRiwayat") {
      var osheet = getSheet_(SHEET_PESANAN, PESANAN_HEADERS);
      var orows = readRows_(osheet).map(rowToPesanan_);
      orows.reverse(); // urut terbaru dulu
      return ok_(orows);
    }

    if (action === "getVoucherAll") {
      var allV = getSheet_(SHEET_VOUCHER, VOUCHER_HEADERS);
      var allVrows = readRows_(allV).map(rowToVoucher_);
      return ok_(allVrows);
    }

    return err_("Action GET tidak dikenal: " + action);
  } catch (err) {
    return err_("Server error: " + err.message);
  }
}

/* ============================================================
 * doPost — action via field "action" di JSON body
 * ============================================================ */

function doPost(e) {
  try {
    var body = null;

    // Prioritas: JSON di postData.contents
    if (e && e.postData && e.postData.contents) {
      try {
        body = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        body = null;
      }
    }
    // Fallback: form-encoded / query param
    if (!body && e && e.parameter) {
      body = {};
      for (var k in e.parameter) {
        if (Object.prototype.hasOwnProperty.call(e.parameter, k)) body[k] = e.parameter[k];
      }
    }
    if (!body) return err_("Body POST tidak valid (harus JSON)");

    var action = String(body.action || "");

    /* ---------- tambahPesanan ---------- */
    if (action === "tambahPesanan") {
      var nama = String(body.nama || "").trim();
      var items = body.items;
      if (!nama) return err_("Field 'nama' wajib diisi");
      if (!items || !Array.isArray(items) || items.length === 0) return err_("Field 'items' wajib diisi (array tidak kosong)");

      var osheetP = getSheet_(SHEET_PESANAN, PESANAN_HEADERS);
      var idPesanan = generateIdPesanan_(osheetP);
      var now = new Date();

      var row = [
        idPesanan,
        now, // timestamp (Google Sheets simpan sebagai tanggal)
        nama,
        String(body.no_wa || ""),
        String(body.alamat || ""),
        JSON.stringify(items), // array disimpan sebagai string JSON
        String(body.voucher || ""),
        toNum_(body.total),
        toNum_(body.total_akhir),
        "baru" // status default
      ];
      osheetP.appendRow(row);
      return ok_({ id_pesanan: idPesanan });
    }

    /* ---------- tambahProduk ---------- */
    if (action === "tambahProduk") {
      var harga = body.harga;
      var stok = body.stok;
      if (harga === undefined || harga === null || isNaN(Number(harga))) return err_("Field 'harga' harus angka");
      if (stok === undefined || stok === null || isNaN(Number(stok))) return err_("Field 'stok' harus angka");

      var psheetP = getSheet_(SHEET_PRODUK, PRODUK_HEADERS);
      var pid = body.id ? String(body.id) : generateIdProduk_(psheetP);
      var aktifVal = body.aktif === undefined ? true : !!body.aktif;
      var ukuranVal = Array.isArray(body.ukuran) ? body.ukuran : (body.ukuran ? parseJson_(body.ukuran) : []);

      var prow = [
        pid,
        String(body.kategori || "baju"),
        String(body.nama || ""),
        String(body.deskripsi || ""),
        String(body.foto_url || ""),
        toNum_(harga),
        JSON.stringify(ukuranVal), // array disimpan sebagai string JSON
        toNum_(stok),
        aktifVal ? "TRUE" : "FALSE"
      ];
      psheetP.appendRow(prow);
      return ok_({ id: pid });
    }

    /* ---------- updateProduk ---------- */
    if (action === "updateProduk") {
      var uid = String(body.id || "");
      if (!uid) return err_("Field 'id' wajib diisi");
      var usheet = getSheet_(SHEET_PRODUK, PRODUK_HEADERS);
      var urows = readRows_(usheet);
      var foundIdx = -1;
      for (var ui = 0; ui < urows.length; ui++) {
        if (String(urows[ui][0] || "") === uid) { foundIdx = ui; break; }
      }
      if (foundIdx === -1) return err_("Produk dengan id " + uid + " tidak ditemukan");

      // Map field → indeks kolom (1-based di sheet, baris data mulai baris 2)
      var colMap = {
        kategori: 2, nama: 3, deskripsi: 4, foto_url: 5,
        harga: 6, ukuran: 7, stok: 8, aktif: 9
      };
      var rowNum = foundIdx + 2;
      for (var field in colMap) {
        if (!Object.prototype.hasOwnProperty.call(colMap, field)) continue;
        if (body[field] === undefined) continue; // hanya update field yang dikirim
        var val = body[field];
        if (field === "harga" || field === "stok") {
          if (isNaN(Number(val))) return err_("Field '" + field + "' harus angka");
          val = toNum_(val);
        } else if (field === "ukuran") {
          val = Array.isArray(val) ? JSON.stringify(val) : String(val);
        } else if (field === "aktif") {
          val = val ? "TRUE" : "FALSE";
        } else {
          val = String(val);
        }
        usheet.getRange(rowNum, colMap[field]).setValue(val);
      }
      return ok_({ id: uid });
    }

    /* ---------- hapusProduk ---------- */
    if (action === "hapusProduk") {
      var hid = String(body.id || "");
      if (!hid) return err_("Field 'id' wajib diisi");
      var hsheet = getSheet_(SHEET_PRODUK, PRODUK_HEADERS);
      var hrows = readRows_(hsheet);
      var hIdx = -1;
      for (var hi = 0; hi < hrows.length; hi++) {
        if (String(hrows[hi][0] || "") === hid) { hIdx = hi; break; }
      }
      if (hIdx === -1) return err_("Produk dengan id " + hid + " tidak ditemukan");
      hsheet.deleteRow(hIdx + 2);
      return ok_({ id: hid });
    }

    /* ---------- tambahVoucher ---------- */
    if (action === "tambahVoucher") {
      var vkode = String(body.kode || "").trim().toUpperCase();
      var vtipe = String(body.tipe || "persen").toLowerCase();
      var vnilai = body.nilai;
      if (!vkode) return err_("Field 'kode' wajib diisi");
      if (vtipe !== "persen" && vtipe !== "nominal") return err_("Field 'tipe' harus 'persen' atau 'nominal'");
      if (vnilai === undefined || vnilai === null || isNaN(Number(vnilai))) return err_("Field 'nilai' harus angka");

      var vsh = getSheet_(SHEET_VOUCHER, VOUCHER_HEADERS);
      var existing = readRows_(vsh).map(rowToVoucher_);
      for (var ei = 0; ei < existing.length; ei++) {
        if (existing[ei].kode.toUpperCase() === vkode) return err_("Voucher dengan kode " + vkode + " sudah ada");
      }
      vsh.appendRow([vkode, vtipe, toNum_(vnilai), "TRUE"]);
      return ok_({ kode: vkode });
    }

    /* ---------- hapusVoucher ---------- */
    if (action === "hapusVoucher") {
      var delKode = String(body.kode || "").trim().toUpperCase();
      if (!delKode) return err_("Field 'kode' wajib diisi");
      var dsh = getSheet_(SHEET_VOUCHER, VOUCHER_HEADERS);
      var drows = readRows_(dsh);
      var dIdx = -1;
      for (var di = 0; di < drows.length; di++) {
        if (String(drows[di][0] || "").toUpperCase() === delKode) { dIdx = di; break; }
      }
      if (dIdx === -1) return err_("Voucher dengan kode " + delKode + " tidak ditemukan");
      dsh.deleteRow(dIdx + 2);
      return ok_({ kode: delKode });
    }

    return err_("Action POST tidak dikenal: " + action);
  } catch (err) {
    return err_("Server error: " + err.message);
  }
}

/* ============================================================
 * GENERATOR ID
 * ============================================================ */

// Format INV-YYYYMMDD-XXX (increment per hari)
function generateIdPesanan_(sheet) {
  var now = new Date();
  var y = now.getFullYear();
  var m = String(now.getMonth() + 1).padStart(2, "0");
  var d = String(now.getDate()).padStart(2, "0");
  var prefix = "INV-" + y + m + d + "-";

  var rows = readRows_(sheet);
  var maxSeq = 0;
  for (var i = 0; i < rows.length; i++) {
    var idStr = String(rows[i][0] || "");
    if (idStr.indexOf(prefix) === 0) {
      var seq = parseInt(idStr.substring(prefix.length), 10);
      if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
    }
  }
  var next = String(maxSeq + 1).padStart(3, "0");
  return prefix + next;
}

// Format P001, P002, ... (increment global)
function generateIdProduk_(sheet) {
  var rows = readRows_(sheet);
  var maxN = 0;
  for (var i = 0; i < rows.length; i++) {
    var idStr = String(rows[i][0] || "");
    var match = /^P(\d+)$/i.exec(idStr);
    if (match) {
      var n = parseInt(match[1], 10);
      if (n > maxN) maxN = n;
    }
  }
  return "P" + String(maxN + 1).padStart(3, "0");
}

/* ============================================================
 * SETUP MANUAL — jalankan sekali dari editor Apps Script
 * Membuat sheet + header + data contoh (3 baju, 2 aksesori, 1 voucher)
 * ============================================================ */

function setupSheet() {
  var ss = SpreadsheetApp.openById(SHEET_ID);

  // Pastikan 3 sheet ada + header
  var pSheet = getSheet_(SHEET_PRODUK, PRODUK_HEADERS);
  var oSheet = getSheet_(SHEET_PESANAN, PESANAN_HEADERS);
  var vSheet = getSheet_(SHEET_VOUCHER, VOUCHER_HEADERS);

  // Hanya isi data contoh jika sheet produk kosong (belum ada data)
  if (readRows_(pSheet).length === 0) {
    var sampleProduk = [
      ["P001", "baju", "TNXUS Oversize Tee — Black", "Kaos oversize premium 24s, logo bordir dada, relaxed fit.", "", 159000, JSON.stringify(["S", "M", "L", "XL", "XXL"]), 20, "TRUE"],
      ["P002", "baju", "TNXUS Club Tee — Maroon", "Kaos combed 30s, print dada besar, nyaman dipakai harian.", "", 139000, JSON.stringify(["S", "M", "L", "XL"]), 15, "TRUE"],
      ["P003", "baju", "TNXUS Racing Jersey — Red", "Jersey racing motif, dry-fit, untuk tampil beda di jalanan.", "", 189000, JSON.stringify(["M", "L", "XL", "XXL"]), 10, "TRUE"],
      ["P004", "aksesori", "TNXUS Cap — Snapback", "Topi snapback bordir logo TNXUS, adjustable.", "", 89000, JSON.stringify([]), 25, "TRUE"],
      ["P005", "aksesori", "TNXUS Tote Bag — Canvas", "Tote bag canvas tebal, sablon logo, muat banyak barang.", "", 79000, JSON.stringify([]), 30, "TRUE"]
    ];
    for (var i = 0; i < sampleProduk.length; i++) pSheet.appendRow(sampleProduk[i]);
  }

  // Voucher contoh jika kosong
  if (readRows_(vSheet).length === 0) {
    vSheet.appendRow(["TNXUS10", "persen", 10, "TRUE"]);
  }

  // Set lebar kolom agar rapi
  var widths = [100, 100, 220, 300, 200, 100, 180, 80, 80];
  for (var w = 0; w < widths.length; w++) pSheet.setColumnWidth(w + 1, widths[w]);
  oSheet.setColumnWidth(1, 180);
  oSheet.setColumnWidth(2, 180);
  oSheet.setColumnWidth(6, 300);

  Logger.log("Setup selesai. Sheet produk, pesanan, voucher siap dipakai.");
  return "Setup selesai — 3 sheet terinisialisasi + data contoh (3 baju, 2 aksesori, voucher TNXUS10).";
}
