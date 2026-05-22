const { MongoClient } = require("mongodb");
require("dotenv").config();

const COLLECTION_NAME = "students";
const STUDENT_PROFILES_COLLECTION = "student_profiles";
const STUDENT_SEMESTERS_COLLECTION = "student_semesters";

let client;
let db;

function getMongoUri() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set in environment");
  }
  return uri;
}

async function connect() {
  if (db) {
    return db;
  }

  client = new MongoClient(getMongoUri());
  await client.connect();
  db = client.db();
  return db;
}

async function getDb() {
  return connect();
}

async function getStudentsCollection() {
  const database = await getDb();
  return database.collection(COLLECTION_NAME);
}

async function getStudentProfilesCollection() {
  const database = await getDb();
  return database.collection(STUDENT_PROFILES_COLLECTION);
}

async function getStudentSemestersCollection() {
  const database = await getDb();
  return database.collection(STUDENT_SEMESTERS_COLLECTION);
}

async function close() {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

module.exports = {
  connect,
  getDb,
  getStudentsCollection,
  getStudentProfilesCollection,
  getStudentSemestersCollection,
  close,
  COLLECTION_NAME,
  STUDENT_PROFILES_COLLECTION,
  STUDENT_SEMESTERS_COLLECTION,
};
