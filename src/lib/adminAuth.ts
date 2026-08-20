import "server-only";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function requireAdmin(): Promise<{ userId: string; email: string; firstName: string; lastName: string } | null> {
  const session = await getSession();
  if (!session) return null;

  const db = await getDb();
  const user = await db.collection("users").findOne(
    { _id: new ObjectId(session.userId) },
    { projection: { role: 1 } }
  );

  if (!user || user.role !== "admin") return null;
  return session;
}
