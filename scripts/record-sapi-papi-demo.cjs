"use strict";
const fs = require("fs"),
  path = require("path"),
  { execFileSync } = require("child_process"),
  puppeteer = require("puppeteer");
const BASE_URL = process.env.DEMO_BASE_URL || "http://127.0.0.1:5174",
  FPS = 12,
  W = 1280,
  H = 720,
  REHEARSE = process.argv.includes("--rehearse"),
  PACE = REHEARSE ? 0.15 : 1;
const OUT_DIR =
  process.env.DEMO_OUTPUT_DIR ||
  path.resolve(
    __dirname,
    "../../../../obsidian-vault/Groups/ternak-monitor/Media",
  );
const FRAMES = path.join(OUT_DIR, "sapi-papi-crud-tutorial-frames"),
  OUT = path.join(OUT_DIR, "sapi-papi-crud-tutorial-1280x720.mp4");
const M = {
  birth: "DEMO-VIDEO kelahiran sehat",
  death: "DEMO-VIDEO pemeriksaan kematian",
  death2: "DEMO-VIDEO koreksi penyebab",
  breed: "DEMO-VIDEO IB Limosin B-17",
  feed: "DEMO-VIDEO Hay Premium",
  supplier: "DEMO-VIDEO Supplier Tutorial",
  report: "DEMO-VIDEO ronda kandang RAS",
  report2: "DEMO-VIDEO ronda kandang RAS diperbarui",
  loc: "DEMO-VIDEO Kandang Tutorial",
  loc2: "DEMO-VIDEO Kandang Tutorial Edit",
  invoice: "DEMO-VIDEO-SALE-001",
  buyer: "DEMO-VIDEO Pembeli Tutorial",
};
const sleep = (ms) =>
  new Promise((r) => setTimeout(r, Math.max(35, Math.round(ms * PACE))));
async function overlay(p) {
  await p.evaluate(() => {
    ["demo-cursor", "demo-subtitle"].forEach((id) =>
      document.getElementById(id)?.remove(),
    );
    let c = document.createElement("div");
    c.id = "demo-cursor";
    c.innerHTML =
      '<svg width="26" height="26" viewBox="0 0 24 24"><path d="M5 3 19 12l-7 1-3 7L5 3Z" fill="white" stroke="#123d30" stroke-width="1.7"/></svg>';
    c.style.cssText =
      "position:fixed;z-index:2147483647;pointer-events:none;left:18px;top:18px;filter:drop-shadow(1px 2px 2px #0006);transition:left .09s linear,top .09s linear";
    let s = document.createElement("div");
    s.id = "demo-subtitle";
    s.setAttribute("aria-live", "polite");
    s.style.cssText =
      "position:fixed;z-index:2147483646;left:50%;bottom:24px;transform:translateX(-50%);max-width:78%;padding:10px 18px;border-radius:999px;background:#0a1f18d6;color:white;font:600 15px system-ui;box-shadow:0 8px 22px #0005;opacity:0;transition:opacity .28s;pointer-events:none;text-align:center";
    document.body.append(c, s);
  });
}
async function sub(p, t, ms = 900) {
  await p.evaluate((t) => {
    let e = document.querySelector("#demo-subtitle");
    if (e) {
      e.textContent = t;
      e.style.opacity = t ? "1" : "0";
    }
  }, t);
  await sleep(ms);
}
async function exact(p, sel, text) {
  try {
    await p.waitForFunction(
      (s, t) =>
        [...document.querySelectorAll(s)].some(
          (e) => e.textContent.trim() === t,
        ),
      { timeout: 12000 },
      sel,
      text,
    );
  } catch {
    let seen = await p.$$eval(sel, (es) =>
      es.map((e) => e.textContent.trim()).filter(Boolean),
    );
    throw Error(
      `selector/action: ${sel} exact ${JSON.stringify(text)}; visible candidates=${JSON.stringify(seen)}`,
    );
  }
  for (const e of await p.$$(sel))
    if (await e.evaluate((x, t) => x.textContent.trim() === t, text)) return e;
  throw Error(`selector/action: ${sel} exact ${text}`);
}
async function fld(p, label) {
  await p.waitForFunction(
    (t) =>
      [...document.querySelectorAll("label")].some(
        (x) => x.textContent.trim() === t,
      ),
    { timeout: 12000 },
    label,
  );
  let h = await p.evaluateHandle((t) => {
      let l = [...document.querySelectorAll("label")].find(
        (x) => x.textContent.trim() === t,
      );
      return (
        (l.htmlFor && document.getElementById(l.htmlFor)) ||
        l.parentElement?.querySelector("input,select,textarea")
      );
    }, label),
    e = h.asElement();
  if (!e) throw Error(`selector/action: labelled control ${label}`);
  return e;
}
async function move(p, x, label) {
  let e =
    typeof x === "string"
      ? await p.waitForSelector(x, { visible: true, timeout: 12000 })
      : x;
  if (!e) throw Error(`selector/action: ${label}`);
  await e.evaluate((x) =>
    x.scrollIntoView({ block: "center", behavior: "smooth" }),
  );
  await sleep(300);
  let b = await e.boundingBox();
  if (!b) throw Error(`selector/action: invisible ${label}`);
  await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 14 });
  await sleep(280);
  return e;
}
async function click(p, x, label, ms = 750) {
  let e = await move(p, x, label);
  await e.click();
  await sleep(ms);
}
async function button(p, t, ms) {
  console.log(`ACTION: button ${t}`);
  await p.waitForFunction(
    (t) =>
      [...document.querySelectorAll("button")].some(
        (b) =>
          b.textContent.trim() === t ||
          [...b.querySelectorAll("*")].some(
            (x) => x.children.length === 0 && x.textContent.trim() === t,
          ),
      ),
    { timeout: 12000 },
    t,
  );
  for (const b of await p.$$("button"))
    if (
      await b.evaluate(
        (b, t) =>
          b.textContent.trim() === t ||
          [...b.querySelectorAll("*")].some(
            (x) => x.children.length === 0 && x.textContent.trim() === t,
          ),
        t,
      )
    )
      return click(p, b, `button ${t}`, ms);
  throw Error(`selector/action: button ${t}`);
}
async function aria(p, t, ms) {
  return click(p, `[aria-label="${t}"]`, `aria-label ${t}`, ms);
}
async function type(p, x, v, label) {
  let e = await move(p, x, label);
  await e.click();
  await p.keyboard.down("Control");
  await p.keyboard.press("A");
  await p.keyboard.up("Control");
  await p.keyboard.press("Backspace");
  await p.keyboard.type(v, { delay: REHEARSE ? 5 : 46 });
  await sleep(400);
}
async function choose(p, label, v) {
  let e = await fld(p, label);
  await move(p, e, label);
  if (!(await e.select(v)).includes(v))
    throw Error(`selector/action: select ${v} for ${label}`);
  await sleep(350);
}
async function verify(p, key, desc, pred) {
  try {
    await p.waitForFunction(
      (k, s) =>
        Function(
          "v",
          `return (${s})(v)`,
        )(JSON.parse(localStorage.getItem(k) || "null")),
      { timeout: 12000 },
      key,
      pred,
    );
  } catch {
    throw Error(`state verification: ${desc} in ${key}`);
  }
  console.log(`VERIFY OK: ${desc}`);
  await sleep(400);
}
async function dialogs(p, replies, action) {
  let n = 0,
    handler = async (d) => {
      let r = replies[n++];
      if (!r || (r.msg && !d.message().includes(r.msg))) {
        await d.dismiss();
        throw Error(`dialog/action: unexpected ${d.message()}`);
      }
      await sleep(250);
      await d.accept(r.text);
    };
  p.on("dialog", handler);
  try {
    await action();
    await sleep(500);
  } finally {
    p.off("dialog", handler);
  }
  if (n !== replies.length)
    throw Error(`dialog/action: handled ${n}/${replies.length}`);
}
async function nav(p, t) {
  await button(p, t, 700);
  await overlay(p);
}
async function settings(p) {
  await sub(p, "Master lokasi memakai kontrol aman yang dapat diakses");
  await p.mouse.move(110, 640, { steps: 14 });
  let ok = await p.evaluate(() => {
    for (let node of document.querySelectorAll("*")) {
      let k = Object.keys(node).find((x) => x.startsWith("__reactFiber$")),
        f = k && node[k];
      while (f) {
        if (f.type?.name === "App" && f.memoizedState?.queue?.dispatch) {
          f.memoizedState.queue.dispatch("settings");
          return true;
        }
        f = f.return;
      }
    }
    return false;
  });
  if (!ok) throw Error("selector/action: App settings view");
  await p.waitForFunction(() =>
    document.body.innerText.includes(
      "Pengaturan Perusahaan & Master Lokasi Kandang",
    ),
  );
  await overlay(p);
}
async function journey(p) {
  await overlay(p);
  await sub(
    p,
    "Sapi Papi Farm — tutorial CRUD aman dengan data demo lokal",
    1400,
  );
  await button(p, "Isi akun development", 350);
  await type(p, "#login-email", "owner@ternak.local", "email");
  await type(p, "#login-password", "TernakDemo2026!", "password");
  await button(p, "Masuk ke Dashboard", 2200);
  await overlay(p);
  await sub(p, "Kelahiran membuat anakan; pembatalan mengarsipkannya");
  await aria(p, "Tambah aksi kandang", 350);
  await button(p, "+ LAPOR KELAHIRAN", 650);
  await overlay(p);
  await button(p, "+ Lapor Kelahiran", 450);
  await choose(p, "Pilih Induk Betina *", "ls-003");
  await type(p, await fld(p, "Bobot Lahir (kg) *"), "31", "bobot lahir");
  await type(
    p,
    await fld(p, "Kondisi Lahir & Catatan"),
    M.birth,
    "catatan lahir",
  );
  await button(p, "Daftarkan Anakan Baru", 800);
  await verify(
    p,
    "ternak_births",
    "birth created",
    `v=>v.some(x=>x.condition===${JSON.stringify(M.birth)}&&!x.voidedAt)`,
  );
  let tag = await p.evaluate(
    (m) =>
      JSON.parse(localStorage.ternak_births).find((x) => x.condition === m)
        .offspringTag,
    M.birth,
  );
  await p.waitForFunction((t) => document.body.innerText.includes(t), {}, tag);
  await dialogs(
    p,
    [
      {
        msg: `Alasan membatalkan kelahiran ${tag}`,
        text: "DEMO-VIDEO data ganda",
      },
      { msg: "Batalkan catatan kelahiran" },
    ],
    () => button(p, "Batalkan & Arsipkan Anak", 200),
  );
  await verify(
    p,
    "ternak_births",
    "birth voided",
    `v=>v.some(x=>x.condition===${JSON.stringify(M.birth)}&&x.voidedAt)`,
  );
  await verify(
    p,
    "ternak_livestock",
    "offspring archived",
    `v=>v.some(x=>x.tagId===${JSON.stringify(tag)}&&x.status==='Keluar'&&x.deletedAt)`,
  );
  await sub(
    p,
    "Kematian dapat dibuat, dikoreksi, dan dibatalkan dengan pemulihan status",
  );
  await button(p, "+ Lapor Kematian", 450);
  await choose(p, "Pilih Ternak yang Mati *", "ls-001");
  await type(
    p,
    await fld(p, "Dugaan Penyebab Kematian *"),
    M.death,
    "penyebab",
  );
  await button(p, "Simpan Laporan Kematian", 800);
  await verify(
    p,
    "ternak_deaths",
    "death created",
    `v=>v.some(x=>x.tagId==='SP-0023'&&x.suspectedCause===${JSON.stringify(M.death)}&&!x.voidedAt)`,
  );
  await verify(
    p,
    "ternak_livestock",
    "livestock marked dead",
    "v=>v.some(x=>x.id==='ls-001'&&x.status==='Mati')",
  );
  await dialogs(
    p,
    [{ msg: "Koreksi dugaan penyebab untuk SP-0023", text: M.death2 }],
    () => aria(p, "Edit kematian SP-0023", 200),
  );
  await verify(
    p,
    "ternak_deaths",
    "death edited",
    `v=>v.some(x=>x.suspectedCause===${JSON.stringify(M.death2)})`,
  );
  await dialogs(
    p,
    [
      {
        msg: "Alasan membatalkan laporan kematian SP-0023",
        text: "DEMO-VIDEO simulasi",
      },
      { msg: "Batalkan laporan dan pulihkan" },
    ],
    () => aria(p, "Batalkan kematian SP-0023", 200),
  );
  await verify(
    p,
    "ternak_deaths",
    "death voided",
    "v=>v.some(x=>x.tagId==='SP-0023'&&x.voidedAt)",
  );
  await verify(
    p,
    "ternak_livestock",
    "livestock restored",
    "v=>v.some(x=>x.id==='ls-001'&&x.status==='Aktif'&&x.healthStatus==='Sehat')",
  );
  await sub(p, "Reproduksi menautkan induk, IB, dan estimasi lahir");
  await nav(p, "Reproduksi");
  await button(p, "+ Catat Perkawinan / IB", 450);
  await choose(p, "Pilih Induk Betina *", "ls-005");
  await type(
    p,
    await fld(p, "Kode / Nama Pejantan (Semen IB)"),
    M.breed,
    "pejantan",
  );
  await type(
    p,
    await fld(p, "Catatan"),
    "DEMO-VIDEO jadwal USG 30 hari",
    "catatan",
  );
  await button(p, "Simpan Perkawinan", 750);
  await verify(
    p,
    "ternak_breeding",
    "breeding created",
    `v=>v.some(x=>x.fatherTag===${JSON.stringify(M.breed)}&&x.motherTag==='SP-0026')`,
  );
  await p.waitForFunction(
    (m) => document.body.innerText.includes(m),
    {},
    M.breed,
  );
  await sub(p, "Pakan: tambah, edit hasil opname, lalu arsipkan");
  await nav(p, "Pakan");
  await button(p, "+ Tambah Stok Pakan", 450);
  await type(p, await fld(p, "Jenis Pakan *"), M.feed, "jenis pakan");
  await type(p, await fld(p, "Jumlah Masuk *"), "900", "masuk");
  await type(p, await fld(p, "Jumlah Keluar *"), "125", "keluar");
  await type(p, await fld(p, "Batas Minimum Alert *"), "300", "minimum");
  await button(p, "Simpan Pakan", 750);
  await verify(
    p,
    "ternak_feed",
    "feed created at 775",
    `v=>v.some(x=>x.feedType===${JSON.stringify(M.feed)}&&x.stockQty===775&&!x.archivedAt)`,
  );
  await aria(p, `Edit stok ${M.feed}`, 450);
  await type(p, await fld(p, "Jumlah Keluar *"), "150", "keluar edit");
  await type(p, await fld(p, "Pemasok / Suplier"), M.supplier, "supplier");
  await button(p, "Simpan Perubahan", 700);
  await verify(
    p,
    "ternak_feed",
    "feed edited at 750",
    `v=>v.some(x=>x.feedType===${JSON.stringify(M.feed)}&&x.stockQty===750&&x.supplier===${JSON.stringify(M.supplier)})`,
  );
  await dialogs(p, [{ msg: `Arsipkan stok ${M.feed}?` }], () =>
    aria(p, `Arsipkan stok ${M.feed}`, 200),
  );
  await verify(
    p,
    "ternak_feed",
    "feed archived",
    `v=>v.some(x=>x.feedType===${JSON.stringify(M.feed)}&&x.archivedAt)`,
  );
  await sub(p, "Laporan harian: buat draft, edit rekonsiliasi, lalu arsipkan");
  await nav(p, "Laporan");
  await button(p, "+ Buat Laporan Harian", 450);
  await choose(p, "Lokasi Peternakan *", "loc-ras");
  await type(
    p,
    await fld(p, "Uraian Aktivitas Kandang"),
    M.report,
    "aktivitas",
  );
  await type(
    p,
    await fld(p, "Catatan Petugas"),
    "DEMO-VIDEO draft tutorial",
    "catatan",
  );
  await button(p, "Simpan Draft", 750);
  await verify(
    p,
    "ternak_daily_reports",
    "report created",
    `v=>v.some(x=>x.activitiesText===${JSON.stringify(M.report)}&&x.reportStatus==='Draft')`,
  );
  await aria(p, "Edit laporan RAS", 450);
  await type(
    p,
    await fld(p, "Uraian Aktivitas Kandang"),
    M.report2,
    "aktivitas edit",
  );
  await type(p, await fld(p, "+ Kelahiran"), "2", "kelahiran");
  await button(p, "Simpan Perubahan", 700);
  await verify(
    p,
    "ternak_daily_reports",
    "report edited and recalculated",
    `v=>v.some(x=>x.activitiesText===${JSON.stringify(M.report2)}&&x.popBirth===2&&x.popFinal===79)`,
  );
  await dialogs(p, [{ msg: "Arsipkan laporan ini?" }], () =>
    aria(p, "Arsipkan laporan RAS", 200),
  );
  await verify(
    p,
    "ternak_daily_reports",
    "report archived",
    `v=>v.some(x=>x.activitiesText===${JSON.stringify(M.report2)}&&x.archivedAt)`,
  );
  await settings(p);
  await type(
    p,
    'input[placeholder="Nama Lokasi (e.g. Kandang 4 Siak)"]',
    M.loc,
    "nama lokasi",
  );
  await type(
    p,
    'input[placeholder="Nama PIC Kandang"]',
    "DEMO-VIDEO PIC",
    "PIC",
  );
  await button(p, "+ Tambah Lokasi Baru", 700);
  await verify(
    p,
    "ternak_locations",
    "location created",
    `v=>v.some(x=>x.name===${JSON.stringify(M.loc)}&&x.status==='Aktif')`,
  );
  await dialogs(
    p,
    [
      { msg: "Nama lokasi:", text: M.loc2 },
      { msg: "Alamat lokasi:", text: "DEMO-VIDEO Jalan Tutorial 5" },
      { msg: "Nama PIC:", text: "DEMO-VIDEO PIC Edit" },
      { msg: "Telepon PIC:", text: "081200000005" },
    ],
    () => aria(p, `Edit lokasi ${M.loc}`, 200),
  );
  await verify(
    p,
    "ternak_locations",
    "location edited",
    `v=>v.some(x=>x.name===${JSON.stringify(M.loc2)}&&x.picName==='DEMO-VIDEO PIC Edit')`,
  );
  await p.waitForFunction(() =>
    document
      .querySelector("[role=status]")
      ?.textContent.includes("Lokasi berhasil diperbarui."),
  );
  await dialogs(p, [{ msg: "Nonaktifkan lokasi ini?" }], () =>
    aria(p, `Nonaktifkan lokasi ${M.loc2}`, 200),
  );
  await verify(
    p,
    "ternak_locations",
    "location deactivated",
    `v=>v.some(x=>x.name===${JSON.stringify(M.loc2)}&&x.status==='Nonaktif')`,
  );
  await sub(
    p,
    "Penjualan membuat invoice dan kas; pembatalan memulihkan keduanya",
  );
  await nav(p, "Keuangan & Penjualan");
  await button(p, "+ Buat Transaksi Penjualan", 450);
  await type(p, await fld(p, "Nomor Invoice *"), M.invoice, "invoice");
  await type(p, await fld(p, "Nama Pembeli *"), M.buyer, "pembeli");
  await choose(p, "Pilih Ternak yang Dijual *", "ls-004");
  await type(
    p,
    await fld(p, "Total Harga Penjualan (Rp) *"),
    "27500000",
    "harga",
  );
  await button(p, "Simpan Transaksi & Auto Buku Kas", 800);
  await verify(
    p,
    "ternak_sales",
    "sale created",
    `v=>v.some(x=>x.invoiceNo===${JSON.stringify(M.invoice)}&&x.transactionStatus==='Selesai')`,
  );
  await verify(
    p,
    "ternak_livestock",
    "livestock sold",
    "v=>v.some(x=>x.id==='ls-004'&&x.status==='Dijual')",
  );
  await verify(
    p,
    "ternak_finance",
    "income created",
    `v=>v.some(x=>x.invoiceNo===${JSON.stringify(M.invoice)}&&x.amount===27500000)`,
  );
  await dialogs(
    p,
    [
      {
        msg: `Alasan pembatalan penjualan ${M.invoice}`,
        text: "DEMO-VIDEO batal tutorial",
      },
      { msg: "Batalkan penjualan, pulihkan ternak" },
    ],
    () => aria(p, `Batalkan penjualan ${M.invoice}`, 200),
  );
  await verify(
    p,
    "ternak_sales",
    "sale voided",
    `v=>v.some(x=>x.invoiceNo===${JSON.stringify(M.invoice)}&&x.transactionStatus==='Batal'&&x.voidedAt)`,
  );
  await verify(
    p,
    "ternak_livestock",
    "sold livestock restored",
    "v=>v.some(x=>x.id==='ls-004'&&x.status==='Aktif')",
  );
  await verify(
    p,
    "ternak_finance",
    "income reversed",
    `v=>!v.some(x=>x.invoiceNo===${JSON.stringify(M.invoice)})`,
  );
  await sub(
    p,
    "Semua mutasi demo telah diverifikasi — tanpa data eksternal",
    1500,
  );
  await sub(p, "", 400);
  console.log("FULL CRUD JOURNEY PASSED");
}
async function capture(p, on) {
  let i = 0;
  while (on()) {
    await p.screenshot({
      path: path.join(FRAMES, `frame-${String(i++).padStart(6, "0")}.jpg`),
      type: "jpeg",
      quality: 86,
    });
    await new Promise((r) => setTimeout(r, Math.round(1000 / FPS)));
  }
  return i;
}
(async () => {
  let browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.CHROME_BIN || "/usr/bin/google-chrome",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    }),
    p = await browser.newPage();
  await p.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  await p.evaluateOnNewDocument(() => {
    localStorage.clear();
    let s = 0x5a17c9;
    Math.random = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  });
  let recording = false,
    task;
  try {
    await p.goto(BASE_URL, { waitUntil: "networkidle2", timeout: 30000 });
    if (!REHEARSE) {
      fs.rmSync(FRAMES, { recursive: true, force: true });
      fs.mkdirSync(FRAMES, { recursive: true });
      recording = true;
      task = capture(p, () => recording);
    }
    await journey(p);
    if (REHEARSE) {
      console.log(
        `REHEARSAL PASSED: full journey executed; encoding skipped; target ${OUT}`,
      );
      return;
    }
    recording = false;
    let n = await task;
    if (n < FPS * 30) throw Error(`capture/action: too short (${n} frames)`);
    fs.mkdirSync(OUT_DIR, { recursive: true });
    execFileSync(
      "ffmpeg",
      [
        "-y",
        "-framerate",
        String(FPS),
        "-i",
        path.join(FRAMES, "frame-%06d.jpg"),
        "-vf",
        `scale=${W}:${H}`,
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        OUT,
      ],
      { stdio: "inherit" },
    );
    let d = execFileSync(
      "ffprobe",
      [
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        OUT,
      ],
      { encoding: "utf8" },
    ).trim();
    console.log(`DEMO VIDEO SAVED: ${OUT}`);
    console.log(`DEMO VIDEO DURATION: ${Number(d).toFixed(3)} seconds`);
  } finally {
    recording = false;
    if (task) await task.catch(() => 0);
    await browser.close();
  }
})().catch((e) => {
  console.error(`DEMO FAILED: ${e.stack || e.message}`);
  process.exit(1);
});
