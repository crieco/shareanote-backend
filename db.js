const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = process.env.MONGODB_URI || 'your-mongodb-uri-here';
const client = new MongoClient(uri, {
  serverApi: ServerApiVersion.v1,
});

let db;

async function connectToMongo() {
  await client.connect();
  db = client.db('shareanote');
  console.log('✅ Connected to MongoDB');
}

function getDb() {
  return db;
}

module.exports = { connectToMongo, getDb };