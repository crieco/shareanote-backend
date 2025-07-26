const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.MONGO_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true
  }
});

let db;

async function connectToDB() {
  try {
    await client.connect();
    db = client.db('shareanote');
    await db.command({ ping: 1 });
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    throw err;
  }
}

function getDB() {
  if (!db) throw new Error('Database not connected');
  return db;
}

async function closeDB() {
  await client.close();
  console.log('🔌 MongoDB connection closed');
}

module.exports = { connectToDB, getDB, closeDB };
