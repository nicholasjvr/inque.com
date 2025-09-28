import { cookies } from "next/headers";
import { adminAuth } from "./firebaseAdmin";

export async function requireUid() {
  const jar = cookies();
  const session = jar.get("session")?.value;
  if (!session) throw new Error("no session");
  const decoded = await adminAuth().verifySessionCookie(session, true);
  return decoded.uid;
}
