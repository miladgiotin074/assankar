import { MongoClient, type Collection, type Document } from "mongodb";

const uri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017";
const dbName = process.env.MONGODB_DB ?? "assankar";

const globalMongo = globalThis as typeof globalThis & {
  mongoClientPromise?: Promise<MongoClient>;
};

function clientPromise() {
  if (!globalMongo.mongoClientPromise) {
    const client = new MongoClient(uri, {
      maxPoolSize: 10,
      minPoolSize: 0,
      maxIdleTimeMS: 60_000,
      connectTimeoutMS: 5_000,
      serverSelectionTimeoutMS: 5_000,
      socketTimeoutMS: 12_000,
      // Prefer IPv4 so localhost/DNS dual-stack does not stall on mobile-facing hosts.
      family: 4,
    });
    globalMongo.mongoClientPromise = client.connect().catch((error: unknown) => {
      globalMongo.mongoClientPromise = undefined;
      throw error;
    });
  }
  return globalMongo.mongoClientPromise;
}

export async function collection<T extends Document>(name: string): Promise<Collection<T>> {
  const mongo = await clientPromise();
  return mongo.db(dbName).collection<T>(name);
}
