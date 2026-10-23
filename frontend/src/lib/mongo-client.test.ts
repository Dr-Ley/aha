import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertLocalMongoInDevelopment,
  assertValidDatabaseName,
  createMongoClientCache,
  databaseNameFromUri,
  isLocalMongoHost,
  mongoClientOptions,
  mongoDatabaseName,
  mongoHosts,
  resolveDatabaseName,
} from "./mongo-client";

const localUri = "mongodb://127.0.0.1:27017/aha_dev";
const atlasUri = "mongodb+srv://app-user:secret@cluster0.example.mongodb.net/aha?retryWrites=true&w=majority";

describe("MongoDB database name", () => {
  it("reads the database from the URI path", () => {
    assert.equal(databaseNameFromUri(localUri), "aha_dev");
    assert.equal(
      databaseNameFromUri("mongodb://app-user:p%40ss@localhost:27017/aha_dev?authSource=admin"),
      "aha_dev"
    );
    assert.equal(databaseNameFromUri(atlasUri), "aha");
    assert.equal(databaseNameFromUri("mongodb://[::1]:27017/aha_dev"), "aha_dev");
  });

  it("returns null when the URI has no database name", () => {
    assert.equal(databaseNameFromUri("mongodb://127.0.0.1:27017"), null);
    assert.equal(databaseNameFromUri("mongodb+srv://cluster0.example.mongodb.net/?retryWrites=true"), null);
    assert.equal(databaseNameFromUri("not-a-uri"), null);
  });

  it("lets MONGODB_DB override the URI path", () => {
    assert.equal(resolveDatabaseName(localUri, "aha_staging"), "aha_staging");
    assert.equal(resolveDatabaseName("mongodb://127.0.0.1:27017", "aha_dev"), "aha_dev");
  });

  it("uses the URI database when MONGODB_DB is absent", () => {
    assert.equal(resolveDatabaseName(localUri, "  "), "aha_dev");
    assert.equal(mongoDatabaseName({ MONGODB_URI: localUri }), "aha_dev");
  });

  it("fails when neither source names a database", () => {
    assert.throws(
      () => resolveDatabaseName("mongodb://127.0.0.1:27017", ""),
      /MongoDB database name is missing/
    );
    assert.throws(
      () => mongoDatabaseName({ MONGODB_URI: "mongodb+srv://cluster.example.mongodb.net" }),
      /MongoDB database name is missing/
    );
  });

  it("rejects an invalid database name", () => {
    assert.throws(() => assertValidDatabaseName("aha.dev", "MONGODB_DB"), /MONGODB_DB/);
    assert.throws(() => resolveDatabaseName(localUri, "bad name"), /MONGODB_DB/);
    assert.throws(() => resolveDatabaseName("mongodb://127.0.0.1:27017/bad$name"), /MONGODB_URI/);
  });
});

describe("local MongoDB host enforcement", () => {
  it("recognizes loopback hosts", () => {
    assert.equal(isLocalMongoHost("localhost"), true);
    assert.equal(isLocalMongoHost("127.0.0.1"), true);
    assert.equal(isLocalMongoHost("::1"), true);
    assert.equal(isLocalMongoHost("cluster0.example.mongodb.net"), false);
    assert.deepEqual(mongoHosts(localUri), ["127.0.0.1"]);
    assert.deepEqual(mongoHosts("mongodb://[::1]:27017/aha_dev"), ["::1"]);
    assert.deepEqual(mongoHosts("mongodb://127.0.0.1:27017,localhost:27018/aha_dev"), [
      "127.0.0.1",
      "localhost",
    ]);
  });

  it("rejects a remote host in development", () => {
    assert.throws(
      () => assertLocalMongoInDevelopment(atlasUri, { NODE_ENV: "development" }),
      /non-local MongoDB host/
    );
  });

  it("allows a remote host when development opts in", () => {
    assert.doesNotThrow(() =>
      assertLocalMongoInDevelopment(atlasUri, {
        NODE_ENV: "development",
        MONGODB_ALLOW_REMOTE: "true",
      })
    );
  });

  it("allows loopback in development and remote hosts outside development", () => {
    assert.doesNotThrow(() =>
      assertLocalMongoInDevelopment(localUri, { NODE_ENV: "development" })
    );
    assert.doesNotThrow(() =>
      assertLocalMongoInDevelopment("mongodb://[::1]:27017/aha_dev", { NODE_ENV: "development" })
    );
    assert.doesNotThrow(() => assertLocalMongoInDevelopment(atlasUri, { NODE_ENV: "production" }));
    assert.doesNotThrow(() => assertLocalMongoInDevelopment(atlasUri, { NODE_ENV: "test" }));
  });

  it("rejects a mixed host list when any host is remote", () => {
    assert.throws(
      () =>
        assertLocalMongoInDevelopment("mongodb://127.0.0.1:27017,db.internal:27017/aha_dev", {
          NODE_ENV: "development",
        }),
      /non-local MongoDB host/
    );
  });
});

describe("MongoDB client reuse", () => {
  it("reuses one connection promise for the same URI", async () => {
    const cache = createMongoClientCache<{ id: number }>();
    let created = 0;
    const connect = async () => ({ id: ++created });
    const uri = "mongodb://127.0.0.1:27017/aha_dev";
    const [first, second] = await Promise.all([cache.connect(uri, connect), cache.connect(uri, connect)]);
    assert.equal(first, second);
    assert.equal(created, 1);
  });

  it("opens a new client after a failed connect and for a different URI", async () => {
    const cache = createMongoClientCache<{ id: number }>();
    let created = 0;
    const uri = "mongodb://127.0.0.1:27017/aha_dev";
    await assert.rejects(
      cache.connect(uri, async () => {
        created += 1;
        throw new Error("MongoDB connection failed");
      })
    );
    const client = await cache.connect(uri, async () => ({ id: ++created }));
    const other = await cache.connect("mongodb://127.0.0.1:27017/other_dev", async () => ({ id: ++created }));
    assert.equal(client.id, 2);
    assert.notEqual(other, client);
    assert.equal(created, 3);
  });

  it("keeps the serverless pool small", () => {
    assert.equal(mongoClientOptions.maxPoolSize, 10);
    assert.equal(mongoClientOptions.minPoolSize, 0);
    assert.ok((mongoClientOptions.serverSelectionTimeoutMS ?? 0) > 0);
    assert.ok((mongoClientOptions.connectTimeoutMS ?? 0) > 0);
  });
});
