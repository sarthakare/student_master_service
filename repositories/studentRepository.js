const { getStudentsCollection } = require("../db");

const CORE_FIELDS = [
  "enrollment_no",
  "name",
  "faculty",
  "programme",
  "semester",
  "session",
];

function formatStudent(doc) {
  if (!doc) {
    return null;
  }
  const { _id, ...rest } = doc;
  return rest;
}

function buildDocument(input) {
  const doc = {};
  const now = new Date();

  for (const field of CORE_FIELDS) {
    if (input[field] !== undefined && input[field] !== null && input[field] !== "") {
      doc[field] = String(input[field]).trim();
    }
  }

  for (const [key, value] of Object.entries(input)) {
    if (CORE_FIELDS.includes(key) || key === "_id") {
      continue;
    }
    if (value !== undefined && value !== null && value !== "") {
      doc[key] = value;
    }
  }

  return { doc, now };
}

async function upsertStudent(input) {
  const { doc, now } = buildDocument(input);

  if (!doc.enrollment_no || !doc.semester || !doc.session) {
    const error = new Error("enrollment_no, semester, and session are required");
    error.statusCode = 400;
    throw error;
  }

  const collection = await getStudentsCollection();
  const filter = {
    enrollment_no: doc.enrollment_no,
    semester: doc.semester,
    session: doc.session,
  };

  const result = await collection.findOneAndUpdate(
    filter,
    {
      $set: { ...doc, updated_at: now },
      $setOnInsert: { created_at: now },
    },
    { upsert: true, returnDocument: "after" },
  );

  return formatStudent(result);
}

async function upsertMany(rows) {
  const collection = await getStudentsCollection();
  const operations = [];

  for (const row of rows) {
    const { doc, now } = buildDocument(row);
    if (!doc.enrollment_no || !doc.semester || !doc.session) {
      continue;
    }

    operations.push({
      updateOne: {
        filter: {
          enrollment_no: doc.enrollment_no,
          semester: doc.semester,
          session: doc.session,
        },
        update: {
          $set: { ...doc, updated_at: now },
          $setOnInsert: { created_at: now },
        },
        upsert: true,
      },
    });
  }

  if (operations.length === 0) {
    return { processed: 0, matchedCount: 0, modifiedCount: 0, upsertedCount: 0 };
  }

  const result = await collection.bulkWrite(operations);
  return {
    processed: operations.length,
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
    upsertedCount: result.upsertedCount,
  };
}

async function findPaginated(page, limit) {
  const collection = await getStudentsCollection();
  const skip = (page - 1) * limit;

  const docs = await collection
    .find({})
    .sort({ enrollment_no: 1 })
    .skip(skip)
    .limit(limit)
    .toArray();

  return docs.map(formatStudent);
}

async function findByFilter(semester, faculty) {
  const collection = await getStudentsCollection();
  const docs = await collection.find({ semester, faculty }).toArray();
  return docs.map(formatStudent);
}

async function findByEnrollment(enrollmentNo) {
  const collection = await getStudentsCollection();
  const docs = await collection
    .find({ enrollment_no: enrollmentNo })
    .sort({ semester: 1 })
    .toArray();

  return docs.map(formatStudent);
}

module.exports = {
  CORE_FIELDS,
  buildDocument,
  upsertStudent,
  upsertMany,
  findPaginated,
  findByFilter,
  findByEnrollment,
};
