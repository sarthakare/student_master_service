const pool = require("./db");

async function migratePrimaryKey() {
  await pool.query("BEGIN");

  try {
    await pool.query(`
      ALTER TABLE student_master
      ALTER COLUMN enrollment_no SET NOT NULL,
      ALTER COLUMN semester SET NOT NULL,
      ALTER COLUMN session SET NOT NULL
    `);

    await pool.query(`
      DO $$
      DECLARE existing_pk text;
      BEGIN
        SELECT conname
        INTO existing_pk
        FROM pg_constraint
        WHERE conrelid = 'student_master'::regclass
          AND contype = 'p'
        LIMIT 1;

        IF existing_pk IS NOT NULL THEN
          EXECUTE format('ALTER TABLE student_master DROP CONSTRAINT %I', existing_pk);
        END IF;
      END $$;
    `);

    await pool.query(`
      ALTER TABLE student_master
      ADD CONSTRAINT student_master_pkey
      PRIMARY KEY (enrollment_no, semester, session)
    `);

    await pool.query("COMMIT");
    console.log("Primary key migrated to (enrollment_no, semester, session).");
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  } finally {
    await pool.end();
  }
}

migratePrimaryKey().catch((error) => {
  console.error("Migration failed:", error.message);
  process.exit(1);
});
