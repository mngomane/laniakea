import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { beforeAll, afterAll, afterEach } from "vitest";

// Set test secrets before any module loads env
process.env.GITHUB_WEBHOOK_SECRET = "test-webhook-secret-min-32-characters-long";

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
});

afterEach(async () => {
  const collections = await mongoose.connection.db?.collections();
  if (collections) {
    for (const collection of collections) {
      await collection.drop().catch(() => undefined);
    }
  }
  // Recreate indexes after dropping collections
  for (const model of Object.values(mongoose.models)) {
    await model.createIndexes();
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});
