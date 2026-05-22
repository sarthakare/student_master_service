const express = require("express");
const cors = require("cors");
const { connect, close } = require("./db");
const studentRepository = require("./repositories/studentRepository");

const app = express();
const PORT = Number(process.env.PORT) || 5001;

app.use(cors());
app.use(express.json());

app.post("/students", async (req, res) => {
  try {
    const student = await studentRepository.upsertStudent(req.body);
    res.json(student);
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({ error: error.message });
    }
    if (error.code === 11000) {
      return res.status(409).json({ error: "Duplicate student record" });
    }
    console.error(error);
    res.status(500).json({ error: "Failed to save student" });
  }
});

app.get("/students", async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Number(req.query.limit) || 50);
    const semester = req.query.semester ? String(req.query.semester) : undefined;
    const faculty = req.query.faculty ? String(req.query.faculty) : undefined;
    const students = await studentRepository.findPaginated(page, limit, { semester, faculty });
    res.json(students);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

app.get("/students/enrollment/:enrollment", async (req, res) => {
  try {
    const student = await studentRepository.findByEnrollment(req.params.enrollment);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }
    res.json(student);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch student" });
  }
});

async function start() {
  await connect();

  const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });

  server.on("error", (error) => {
    console.error(`Failed to start server on port ${PORT}:`, error.message);
    process.exit(1);
  });

  const shutdown = async () => {
    await close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

start().catch((error) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});
