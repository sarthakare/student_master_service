const { connect, getStudentsCollection, close } = require("../db");

async function main() {
  await connect();
  const collection = await getStudentsCollection();

  await collection.createIndex(
    { enrollment_no: 1, semester: 1, session: 1 },
    { unique: true, name: "unique_enrollment_semester_session" },
  );

  await collection.createIndex(
    { faculty: 1, semester: 1 },
    { name: "faculty_semester" },
  );

  console.log("Indexes ensured on students collection.");
  await close();
}

main().catch(async (error) => {
  console.error("Failed to ensure indexes:", error.message);
  process.exitCode = 1;
  await close();
});
