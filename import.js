const fs = require("fs");
const csv = require("csv-parser");
const pool = require("./db");

function normalizeHeader(header) {
  return header
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

async function importStudents() {
  const rows = [];

  await new Promise((resolve, reject) => {
    fs.createReadStream("students.csv")
      .pipe(
        csv({
          skipLines: 1,
          mapHeaders: ({ header }) => normalizeHeader(header),
        }),
      )
      .on("data", (row) => rows.push(row))
      .on("end", resolve)
      .on("error", reject);
  });

  let affectedRows = 0;

  for (const row of rows) {
    const enrollmentNo = row.enrollment_no;
    if (!enrollmentNo) {
      continue;
    }

    const result = await pool.query(
      `
      INSERT INTO student_master
      (enrollment_no, name, faculty, programme, semester, session)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (enrollment_no, semester, session)
      DO UPDATE SET
        name = EXCLUDED.name,
        faculty = EXCLUDED.faculty,
        programme = EXCLUDED.programme,
        semester = EXCLUDED.semester,
        session = EXCLUDED.session
      `,
      [
        enrollmentNo,
        row.name,
        row.faculty,
        row.programme,
        row.semester,
        row.session,
      ],
    );
    affectedRows += result.rowCount;
  }

  console.log(`Import complete. Rows processed: ${rows.length}, rows affected: ${affectedRows}`);
}

importStudents()
  .catch((error) => {
    console.error("Import failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
