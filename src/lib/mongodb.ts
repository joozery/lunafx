import { MongoClient, MongoClientOptions } from "mongodb";

const uri = process.env.MONGODB_URI || "";

const options: MongoClientOptions = {
  maxPoolSize: 10,
  maxIdleTimeMS: 60000,
  serverSelectionTimeoutMS: 5000,
};

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient>;

if (!uri) {
  throw new Error("Please add your Mongo URI to .env.local (MONGODB_URI)");
}

if (!global._mongoClientPromise) {
  const client = new MongoClient(uri, options);
  global._mongoClientPromise = client.connect();
}
clientPromise = global._mongoClientPromise;

export default clientPromise;

export async function getDb() {
  const client = await clientPromise;
  return client.db("lunaforex");
}

