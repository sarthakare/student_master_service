const { connect, getDb, close } = require("./db");

async function test() {
  await connect();
  const db = await getDb();
  const result = await db.command({ ping: 1 });
  console.log("MongoDB ping:", result);
  await close();
}

test().catch((error) => {
  console.error("Connection test failed:", error.message);
  process.exit(1);
});
