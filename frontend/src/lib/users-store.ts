import { ObjectId, type Filter } from "mongodb";
import { getDb } from "@/lib/db";

export type UserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: string;
  avatar: string | null;
};

function asUser(doc: Record<string, unknown> | null): UserRecord | null {
  if (!doc) return null;
  const id =
    doc.id != null ? String(doc.id) : doc._id != null ? String(doc._id) : "";
  if (!id) return null;
  return {
    id,
    email: String(doc.email ?? ""),
    passwordHash: String(doc.passwordHash ?? doc.password_hash ?? ""),
    name: String(doc.name ?? ""),
    role: doc.role != null ? String(doc.role) : "customer",
    avatar: doc.avatar == null ? null : String(doc.avatar),
  };
}

function idFilter(userId: number | string): Filter<Record<string, unknown>> {
  const asString = String(userId);
  const clauses: Filter<Record<string, unknown>>[] = [{ id: asString }, { _id: asString }];
  const numeric = typeof userId === "number" ? userId : Number(asString);
  if (!Number.isNaN(numeric)) {
    clauses.push({ id: numeric }, { _id: numeric });
  }
  if (ObjectId.isValid(asString) && asString.length === 24) {
    clauses.push({ _id: new ObjectId(asString) });
  }
  return { $or: clauses };
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const db = await getDb();
  const doc = await db.collection("users").findOne({ email });
  return asUser(doc as Record<string, unknown> | null);
}

export async function findUserById(userId: number | string): Promise<UserRecord | null> {
  const db = await getDb();
  const doc = await db.collection("users").findOne(idFilter(userId));
  return asUser(doc as Record<string, unknown> | null);
}
