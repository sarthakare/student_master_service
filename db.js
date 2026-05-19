const { MongoClient } = require("mongodb");
require("dotenv").config();

const COLLECTION_NAME = "students";

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
  close,
  COLLECTION_NAME,
};
