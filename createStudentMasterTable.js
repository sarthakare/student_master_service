const fs = require("fs");
const path = require("path");
const pool = require("./db");

async function main() {
  const existsResult = await pool.query(
    `SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = current_schema()
        AND table_name = 'student_master'
    ) AS exists`
  );
  if (existsResult.rows[0].exists) {
    console.log("student_master already exists — skipping create.");
    await pool.end();
    return;
  }

  const sqlPath = path.join(__dirname, "sql", "student_master.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");
  await pool.query(sql);
  console.log("student_master created.");
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
