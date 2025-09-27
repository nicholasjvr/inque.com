import { NextResponse } from "next/server";
import { adminAuth } from "@lib/firebaseAdmin";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    
    if (!sessionCookie) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }

    const decodedToken = await adminAuth().verifySessionCookie(sessionCookie);
    const user = await adminAuth().getUser(decodedToken.uid);
    
    return NextResponse.json({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    });
  } catch (error) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }
}
