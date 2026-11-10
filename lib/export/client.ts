"use client";
import type { Report } from "./types";

async function logoDataUrl(): Promise<string | null> {
  try {
    const res = await fetch("/brand/logo-96.png");
    const blob = await res.blob();
    return await new Promise((ok) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.readAsDataURL(blob); });
  } catch { return null; }
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function exportPdf(report: Report) {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const wide = report.columns.length > 7;
  const doc = new jsPDF({ orientation: wide ? "landscape" : "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const logo = await logoDataUrl();

  // Kop
  doc.setFillColor(10, 27, 71);
  doc.rect(0, 0, W, 28, "F");
  doc.setFillColor(224, 165, 38);
  doc.rect(0, 28, W, 1.2, "F");
  if (logo) doc.addImage(logo, "PNG", 12, 4, 20, 20);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold"); doc.setFontSize(15);
  doc.text("UNESA FC ACADEMY", logo ? 36 : 12, 13);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9);
  doc.text("Laporan resmi akademi · Lapangan UNESA, Surabaya", logo ? 36 : 12, 19);

  doc.setTextColor(15, 26, 46);
  doc.setFont("helvetica", "bold"); doc.setFontSize(13);
  doc.text(report.title, 12, 39);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(86, 99, 122);
  doc.text(report.subtitle, 12, 45);

  let y = 51;
  if (report.summary?.length) {
    const cw = (W - 24) / report.summary.length;
    report.summary.forEach((s, i) => {
      const x = 12 + i * cw;
      doc.setFillColor(238, 242, 248); doc.roundedRect(x, y, cw - 3, 14, 1.5, 1.5, "F");
      doc.setFontSize(7.5); doc.setTextColor(86, 99, 122); doc.text(s.label, x + 3, y + 5);
      doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(15, 26, 46); doc.text(s.value, x + 3, y + 11.2);
      doc.setFont("helvetica", "normal");
    });
    y += 19;
  }

  autoTable(doc, {
    startY: y,
    head: [report.columns.map((c) => c.label)],
    body: report.rows.map((r) => report.columns.map((c) => (r[c.key] ?? "—") as string | number)),
    styles: { fontSize: 8.5, cellPadding: 2, textColor: [15, 26, 46], lineColor: [224, 230, 239], lineWidth: 0.1 },
    headStyles: { fillColor: [11, 42, 111], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [246, 248, 252] },
    columnStyles: Object.fromEntries(report.columns.map((c, i) => [i, { halign: c.align ?? "left" }])),
    margin: { left: 12, right: 12 },
    didDrawPage: () => {
      const H = doc.internal.pageSize.getHeight();
      doc.setFontSize(7.5); doc.setTextColor(138, 148, 166);
      doc.text(`Dibuat ${report.generatedAt} oleh ${report.generatedBy}`, 12, H - 8);
      doc.text(`Halaman ${doc.getNumberOfPages()}`, W - 12, H - 8, { align: "right" });
    },
  });
  download(doc.output("blob"), `${report.filename}.pdf`);
}

export async function exportExcel(report: Report) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "UNESA FC Academy";
  wb.created = new Date();
  const ws = wb.addWorksheet(report.title.slice(0, 31), { views: [{ state: "frozen", ySplit: 5 }] });
  const n = report.columns.length;

  ws.mergeCells(1, 1, 1, n);
  ws.getCell(1, 1).value = "UNESA FC ACADEMY";
  ws.getCell(1, 1).font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
  ws.getCell(1, 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0A1B47" } };
  ws.getRow(1).height = 24;
  ws.mergeCells(2, 1, 2, n);
  ws.getCell(2, 1).value = report.title;
  ws.getCell(2, 1).font = { bold: true, size: 12 };
  ws.mergeCells(3, 1, 3, n);
  ws.getCell(3, 1).value = `${report.subtitle} · dibuat ${report.generatedAt}`;
  ws.getCell(3, 1).font = { size: 10, color: { argb: "FF56637A" } };

  const header = ws.getRow(5);
  report.columns.forEach((c, i) => {
    const cell = header.getCell(i + 1);
    cell.value = c.label;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0B2A6F" } };
    cell.alignment = { horizontal: c.align ?? "left", vertical: "middle" };
  });
  header.height = 20;

  report.rows.forEach((r, ri) => {
    const row = ws.getRow(6 + ri);
    report.columns.forEach((c, i) => {
      const cell = row.getCell(i + 1);
      const v = r[c.key];
      cell.value = v === null || v === undefined ? "" : v;
      cell.alignment = { horizontal: c.align ?? "left" };
      cell.border = { bottom: { style: "thin", color: { argb: "FFE0E6EF" } } };
      if (ri % 2) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF6F8FC" } };
    });
  });
  report.columns.forEach((c, i) => {
    const longest = Math.max(c.label.length, ...report.rows.map((r) => String(r[c.key] ?? "").length));
    ws.getColumn(i + 1).width = c.width ?? Math.min(40, Math.max(8, longest + 2));
  });
  ws.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5 + report.rows.length, column: n } };

  if (report.summary?.length) {
    const sum = wb.addWorksheet("Ringkasan");
    sum.addRow(["Keterangan", "Nilai"]).font = { bold: true };
    report.summary.forEach((s) => sum.addRow([s.label, s.value]));
    sum.getColumn(1).width = 32; sum.getColumn(2).width = 18;
  }
  const buf = await wb.xlsx.writeBuffer();
  download(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${report.filename}.xlsx`);
}
