import { MongoClient, type Collection, type Document } from "mongodb";

const uri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017";
const dbName = process.env.MONGODB_DB ?? "assankar";

const globalMongo = globalThis as typeof globalThis & { mongoClient?: MongoClient };

function client() {
  if (!globalMongo.mongoClient) {
    globalMongo.mongoClient = new MongoClient(uri);
  }
  return globalMongo.mongoClient;
}

export async function collection<T extends Document>(name: string): Promise<Collection<T>> {
  const mongo = await client().connect();
  return mongo.db(dbName).collection<T>(name);
}
