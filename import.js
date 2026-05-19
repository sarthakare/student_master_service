const path = require("path");
const XLSX = require("xlsx");
const { connect, close } = require("./db");
const studentRepository = require("./repositories/studentRepository");

const XLSX_PATH = path.join(__dirname, "students.xlsx");

function normalizeHeader(header) {
  return String(header)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function readStudentsFromXlsx(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

  if (rawRows.length < 2) {
    return [];
  }

  const headers = rawRows[0].map(normalizeHeader);
  const rows = [];

  for (let i = 1; i < rawRows.length; i++) {
    const values = rawRows[i];
    const row = {};

    headers.forEach((header, index) => {
      if (!header) {
        return;
      }
      const value = values[index];
      row[header] = value != null ? String(value).trim() : "";
    });

    rows.push(row);
  }

  return rows;
}

async function importStudents() {
  const rows = readStudentsFromXlsx(XLSX_PATH);
  const result = await studentRepository.upsertMany(rows);

  console.log(
    `Import complete. Rows in file: ${rows.length}, upsert operations: ${result.processed}, ` +
      `matched: ${result.matchedCount}, modified: ${result.modifiedCount}, upserted: ${result.upsertedCount}`,
  );
}

connect()
  .then(() => importStudents())
  .catch((error) => {
    console.error("Import failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await close();
  });
