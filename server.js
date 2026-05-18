const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();
const PORT = Number(process.env.PORT) || 5001;
app.use(cors());
app.use(express.json());


app.post("/students", async (req, res) => {
  const { enrollment_no, name, faculty, programme, semester, session } = req.body;
  const result = await pool.query(
    `
      INSERT INTO student_master (enrollment_no, name, faculty, programme, semester, session)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `,
    [enrollment_no, name, faculty, programme, semester, session],
  );
  res.json(result.rows[0]);
});

app.get("/students", async (req, res) => {
  const page = req.query.page || 1;
  const limit = req.query.limit || 50;
  const offset = (page - 1) * limit;

  const result = await pool.query(
    `
      SELECT *
      FROM student_master
      ORDER BY enrollment_no
      LIMIT $1 OFFSET $2
      `,
    [limit, offset],
  );

  res.json(result.rows);
});

app.get("/students/filter", async (req, res) => {
  const { semester, faculty } = req.query;

  const result = await pool.query(
    `
      SELECT *
      FROM student_master
      WHERE semester=$1 AND faculty=$2
      `,
    [semester, faculty],
  );

  res.json(result.rows);
});

app.get("/students/:enrollment", async (req, res) => {
  const result = await pool.query(
    `
      SELECT *
      FROM student_master
      WHERE enrollment_no=$1
      ORDER BY semester
      `,
    [req.params.enrollment],
  );

  res.json(result.rows);
});

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

server.on("error", (error) => {
  console.error(`Failed to start server on port ${PORT}:`, error.message);
  process.exit(1);
});