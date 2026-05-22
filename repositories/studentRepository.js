const {
  getStudentProfilesCollection,
  getStudentSemestersCollection,
} = require("../db");

const PROFILE_FIELDS = ["enrollment_no", "name", "faculty", "programme", "session"];
const SEMESTER_FIELDS = ["enrollment_no", "semester"];
const CORE_FIELDS = [...PROFILE_FIELDS, "semester"];

function formatDocument(doc) {
  if (!doc) {
    return null;
  }
  const { _id, ...rest } = doc;
  return rest;
}

function cleanString(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  return String(value).trim();
}

function buildProfileDocument(input) {
  const doc = {};

  for (const field of PROFILE_FIELDS) {
    const value = cleanString(input[field]);
    if (value) {
      doc[field] = value;
    }
  }

  for (const [key, value] of Object.entries(input)) {
    if (key === "_id" || CORE_FIELDS.includes(key)) {
      continue;
    }
    if (value !== undefined && value !== null && value !== "") {
      doc[key] = value;
    }
  }

  return doc;
}

function buildSemesterDocument(input) {
  const doc = {};

  for (const field of SEMESTER_FIELDS) {
    const value = cleanString(input[field]);
    if (value) {
      doc[field] = value;
    }
  }

  return doc;
}

function flattenProfileWithSemester(profile, semesterDoc) {
  return {
    ...formatDocument(profile),
    semester: semesterDoc.semester,
  };
}

function toEnrollmentResponse(profile, semesterDocs) {
  const base = formatDocument(profile);
  return {
    ...base,
    semesters: semesterDocs
      .map((doc) => formatDocument(doc).semester)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
  };
}

async function upsertStudent(input) {
  const now = new Date();
  const profileDoc = buildProfileDocument(input);
  const semesterDoc = buildSemesterDocument(input);

  if (!profileDoc.enrollment_no || !profileDoc.session || !semesterDoc.semester) {
    const error = new Error("enrollment_no, semester, and session are required");
    error.statusCode = 400;
    throw error;
  }

  const profilesCollection = await getStudentProfilesCollection();
  const semestersCollection = await getStudentSemestersCollection();

  const profile = await profilesCollection.findOneAndUpdate(
    { enrollment_no: profileDoc.enrollment_no },
    {
      $set: { ...profileDoc, updated_at: now },
      $setOnInsert: { created_at: now },
    },
    { upsert: true, returnDocument: "after" },
  );

  await semestersCollection.findOneAndUpdate(
    { enrollment_no: semesterDoc.enrollment_no, semester: semesterDoc.semester },
    {
      $set: { ...semesterDoc, updated_at: now },
      $setOnInsert: { created_at: now },
    },
    { upsert: true },
  );

  return flattenProfileWithSemester(profile, semesterDoc);
}

async function upsertMany(rows) {
  const profilesCollection = await getStudentProfilesCollection();
  const semestersCollection = await getStudentSemestersCollection();
  const profileOperations = [];
  const semesterOperations = [];

  for (const row of rows) {
    const now = new Date();
    const profileDoc = buildProfileDocument(row);
    const semesterDoc = buildSemesterDocument(row);

    if (!profileDoc.enrollment_no || !profileDoc.session || !semesterDoc.semester) {
      continue;
    }

    profileOperations.push({
      updateOne: {
        filter: { enrollment_no: profileDoc.enrollment_no },
        update: {
          $set: { ...profileDoc, updated_at: now },
          $setOnInsert: { created_at: now },
        },
        upsert: true,
      },
    });

    semesterOperations.push({
      updateOne: {
        filter: {
          enrollment_no: semesterDoc.enrollment_no,
          semester: semesterDoc.semester,
        },
        update: {
          $set: { ...semesterDoc, updated_at: now },
          $setOnInsert: { created_at: now },
        },
        upsert: true,
      },
    });
  }

  if (profileOperations.length === 0) {
    return { processed: 0, matchedCount: 0, modifiedCount: 0, upsertedCount: 0 };
  }

  const [profileResult, semesterResult] = await Promise.all([
    profilesCollection.bulkWrite(profileOperations),
    semestersCollection.bulkWrite(semesterOperations),
  ]);

  return {
    processed: profileOperations.length,
    matchedCount: profileResult.matchedCount + semesterResult.matchedCount,
    modifiedCount: profileResult.modifiedCount + semesterResult.modifiedCount,
    upsertedCount: profileResult.upsertedCount + semesterResult.upsertedCount,
  };
}

async function findPaginated(page, limit, filters = {}) {
  const profilesCollection = await getStudentProfilesCollection();
  const semestersCollection = await getStudentSemestersCollection();
  const skip = (page - 1) * limit;
  const profileFilter = {};

  if (filters.faculty) {
    profileFilter.faculty = filters.faculty;
  }

  if (filters.semester) {
    const enrollmentNos = await semestersCollection.distinct("enrollment_no", {
      semester: filters.semester,
    });
    if (enrollmentNos.length === 0) {
      return [];
    }
    profileFilter.enrollment_no = { $in: enrollmentNos };
  }

  const profiles = await profilesCollection
    .find(profileFilter)
    .sort({ enrollment_no: 1 })
    .skip(skip)
    .limit(limit)
    .toArray();

  return profiles.map(formatDocument);
}

async function findByFilter(semester, faculty) {
  const profilesCollection = await getStudentProfilesCollection();
  const semestersCollection = await getStudentSemestersCollection();

  const profileFilter = {};
  if (faculty) {
    profileFilter.faculty = faculty;
  }

  if (semester) {
    const enrollmentNos = await semestersCollection.distinct("enrollment_no", {
      semester,
    });
    if (enrollmentNos.length === 0) {
      return [];
    }
    profileFilter.enrollment_no = { $in: enrollmentNos };
  }

  const profiles = await profilesCollection.find(profileFilter).sort({ enrollment_no: 1 }).toArray();
  return profiles.map(formatDocument);
}

async function findByEnrollment(enrollmentNo) {
  const profilesCollection = await getStudentProfilesCollection();
  const semestersCollection = await getStudentSemestersCollection();
  const profile = await profilesCollection.findOne({ enrollment_no: enrollmentNo });

  if (!profile) {
    return null;
  }

  const semesters = await semestersCollection
    .find({ enrollment_no: enrollmentNo })
    .sort({ semester: 1 })
    .toArray();

  return toEnrollmentResponse(profile, semesters);
}

module.exports = {
  CORE_FIELDS,
  PROFILE_FIELDS,
  SEMESTER_FIELDS,
  buildProfileDocument,
  buildSemesterDocument,
  upsertStudent,
  upsertMany,
  findPaginated,
  findByFilter,
  findByEnrollment,
};
