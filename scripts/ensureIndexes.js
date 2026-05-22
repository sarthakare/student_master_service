const {
  connect,
  getStudentProfilesCollection,
  getStudentSemestersCollection,
  close,
} = require("../db");

async function main() {
  await connect();
  const profilesCollection = await getStudentProfilesCollection();
  const semestersCollection = await getStudentSemestersCollection();

  await profilesCollection.createIndex(
    { enrollment_no: 1 },
    { unique: true, name: "unique_enrollment_no" },
  );

  await profilesCollection.createIndex(
    { faculty: 1 },
    { name: "faculty" },
  );

  await semestersCollection.createIndex(
    { enrollment_no: 1, semester: 1 },
    { unique: true, name: "unique_enrollment_semester" },
  );

  await semestersCollection.createIndex(
    { semester: 1 },
    { name: "semester" },
  );

  console.log("Indexes ensured on student_profiles and student_semesters collections.");
  await close();
}

main().catch(async (error) => {
  console.error("Failed to ensure indexes:", error.message);
  process.exitCode = 1;
  await close();
});
