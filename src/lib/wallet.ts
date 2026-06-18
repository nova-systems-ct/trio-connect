/**
 * Digital wallet pass architecture for TRIO Connect student IDs.
 * Builds Apple PassKit and Google Wallet object structures.
 * Native signing requires a server-side Certificate Authority — marked Coming Soon.
 */

import type { TRIOStudent } from "./types";

// ── Shared types ──────────────────────────────────────────────────────────────

export interface WalletField {
  key: string;
  label: string;
  value: string;
}

export interface ApplePassJSON {
  formatVersion: 1;
  passTypeIdentifier: string;
  serialNumber: string;
  teamIdentifier: string;
  organizationName: string;
  description: string;
  logoText: string;
  foregroundColor: string;
  backgroundColor: string;
  labelColor: string;
  generic: {
    primaryFields: WalletField[];
    secondaryFields: WalletField[];
    auxiliaryFields: WalletField[];
    backFields: WalletField[];
  };
  barcode: { message: string; format: string; messageEncoding: string };
  expirationDate: string;
}

export interface GooglePassObject {
  id: string;
  classId: string;
  state: "ACTIVE" | "INACTIVE" | "EXPIRED";
  cardTitle: { defaultValue: { language: string; value: string } };
  subheader: { defaultValue: { language: string; value: string } };
  header: { defaultValue: { language: string; value: string } };
  textModulesData: { header: string; body: string; id: string }[];
  barcode: { type: string; value: string; alternateText: string };
  validTimeInterval: { start: { date: string }; end: { date: string } };
}

export interface WalletPassData {
  student: TRIOStudent;
  qrData: string;
  barcodeValue: string;
  apple: ApplePassJSON;
  google: GooglePassObject;
  expirationDate: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function expiryFromEnrollment(enrollmentDate: string): string {
  const d = new Date(enrollmentDate);
  d.setFullYear(d.getFullYear() + 4);
  return d.toISOString().split("T")[0] + "T23:59:59Z";
}

export function generateQRData(student: TRIOStudent): string {
  return `https://trio-connect-seven.vercel.app/verify/${student.student_number}`;
}

export function generateBarcodeValue(student: TRIOStudent): string {
  return student.student_number.replace(/[^0-9A-Z-]/gi, "").toUpperCase();
}

// ── Apple Wallet pass builder ─────────────────────────────────────────────────

export function buildAppleWalletPass(student: TRIOStudent): ApplePassJSON {
  return {
    formatVersion: 1,
    passTypeIdentifier: "pass.edu.ctstate.trio",
    serialNumber: student.student_number,
    teamIdentifier: "CTSTATE_TRIO",
    organizationName: "CT State Community College",
    description: "TRIO Student Support Services ID",
    logoText: "TRIO Connect",
    foregroundColor: "rgb(248, 250, 252)",
    backgroundColor: "rgb(17, 24, 39)",
    labelColor: "rgb(71, 85, 105)",
    generic: {
      primaryFields: [
        { key: "name", label: "Student Name", value: student.full_name },
      ],
      secondaryFields: [
        { key: "id",      label: "Student ID",  value: student.student_number },
        { key: "advisor", label: "Advisor",      value: student.advisor_name ?? "Unassigned" },
      ],
      auxiliaryFields: [
        { key: "program", label: "Program", value: student.program ?? "TRIO SSS" },
        { key: "campus",  label: "Campus",  value: student.work_location ?? "CT State" },
      ],
      backFields: [
        { key: "email",    label: "Email",        value: student.email ?? "" },
        { key: "phone",    label: "Phone",        value: student.phone ?? "" },
        { key: "major",    label: "Major",        value: student.major ?? "" },
        { key: "enrolled", label: "Enrolled",     value: student.enrollment_date ?? "" },
        { key: "status",   label: "Status",       value: student.enrollment_status ?? "active" },
        { key: "issuer",   label: "Issued By",    value: "TRIO Connect · CT State" },
        { key: "terms",    label: "Terms",        value: "This ID is for TRIO program access only." },
      ],
    },
    barcode: {
      message: generateBarcodeValue(student),
      format: "PKBarcodeFormatCode128",
      messageEncoding: "iso-8859-1",
    },
    expirationDate: expiryFromEnrollment(student.enrollment_date),
  };
}

// ── Google Wallet pass builder ────────────────────────────────────────────────

export function buildGoogleWalletPass(student: TRIOStudent): GooglePassObject {
  return {
    id: `ctstate-trio.${student.student_number}`,
    classId: "ctstate-trio.student_id_class",
    state: "ACTIVE",
    cardTitle:  { defaultValue: { language: "en-US", value: "TRIO Connect" } },
    subheader:  { defaultValue: { language: "en-US", value: "Student ID · CT State" } },
    header:     { defaultValue: { language: "en-US", value: student.full_name } },
    textModulesData: [
      { header: "Student ID", body: student.student_number,        id: "student_id" },
      { header: "Program",    body: student.program ?? "TRIO SSS", id: "program"    },
      { header: "Advisor",    body: student.advisor_name ?? "—",   id: "advisor"    },
      { header: "Campus",     body: student.work_location ?? "CT State", id: "campus" },
    ],
    barcode: {
      type: "CODE_128",
      value: generateBarcodeValue(student),
      alternateText: student.student_number,
    },
    validTimeInterval: {
      start: { date: student.enrollment_date + "T00:00:00Z" },
      end:   { date: expiryFromEnrollment(student.enrollment_date) },
    },
  };
}

// ── Combined pass data ────────────────────────────────────────────────────────

export function buildWalletPassData(student: TRIOStudent): WalletPassData {
  return {
    student,
    qrData:         generateQRData(student),
    barcodeValue:   generateBarcodeValue(student),
    apple:          buildAppleWalletPass(student),
    google:         buildGoogleWalletPass(student),
    expirationDate: expiryFromEnrollment(student.enrollment_date),
  };
}

// ── QR matrix generator (deterministic, unique per student) ───────────────────

function hash(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h) ^ str.charCodeAt(i);
  return Math.abs(h);
}

export function generateQRMatrix(studentNumber: string): boolean[][] {
  const S = 21;
  const m: boolean[][] = Array.from({ length: S }, () => Array(S).fill(false));

  function finder(r: number, c: number) {
    for (let dr = 0; dr < 7; dr++) for (let dc = 0; dc < 7; dc++) {
      const border = dr === 0 || dr === 6 || dc === 0 || dc === 6;
      const inner  = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
      m[r + dr][c + dc] = border || inner;
    }
    // Separator row/col — both axes must be in-bounds
    for (let i = 0; i < 8; i++) {
      if (r + 7 < S && c + i < S) m[r + 7][c + i] = false;
      if (c + 7 < S && r + i < S) m[r + i][c + 7] = false;
    }
  }

  finder(0, 0);
  finder(0, 14);
  finder(14, 0);

  // Timing patterns
  for (let i = 8; i < 13; i++) { m[6][i] = i % 2 === 0; m[i][6] = i % 2 === 0; }

  // Data cells — deterministic fill from student number hash
  const seed = hash(studentNumber);
  const reserved: Set<string> = new Set();
  for (let r = 0; r < S; r++) for (let c = 0; c < S; c++) {
    const inTL = r < 9 && c < 9;
    const inTR = r < 9 && c >= 12;
    const inBL = r >= 12 && c < 9;
    const isTiming = r === 6 || c === 6;
    if (inTL || inTR || inBL || isTiming) reserved.add(`${r},${c}`);
  }

  const dataCells: [number, number][] = [];
  for (let r = 0; r < S; r++) for (let c = 0; c < S; c++) {
    if (!reserved.has(`${r},${c}`)) dataCells.push([r, c]);
  }

  dataCells.forEach(([r, c], i) => {
    const v = (seed + i * 7919 + r * 1009 + c * 997) & 0xFFFFFF;
    m[r][c] = (v % 3) !== 0;
  });

  return m;
}

// ── Barcode bar widths generator (unique per student number) ──────────────────

export function generateBarcodeWidths(studentNumber: string): number[] {
  const h = hash(studentNumber);
  const bars: number[] = [3]; // start guard
  const chars = studentNumber.replace(/[^0-9A-Z]/g, "");
  for (let i = 0; i < Math.max(chars.length, 8); i++) {
    const c = i < chars.length ? chars.charCodeAt(i) : (h + i) % 36;
    bars.push(1 + (((c * 7) + h + i * 13) % 3));
    bars.push(1 + (((c * 11) + h + i * 7) % 2));
    bars.push(1 + (((c * 5)  + h + i * 17) % 3));
    bars.push(1 + (((c * 3)  + h + i * 11) % 2));
  }
  bars.push(2, 1, 2); // stop guard
  return bars;
}
