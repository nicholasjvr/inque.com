import { NextResponse } from "next/server";
import { adminAuth } from "@lib/firebaseAdmin";

export async function POST(req: Request) {
  try {
    const { idToken } = await req.json();
    if (!idToken) return NextResponse.json({ error: "missing idToken" }, { status: 400 });

    const expiresIn = 7 * 24 * 60 * 60 * 1000;
    const sessionCookie = await adminAuth().createSessionCookie(idToken, { expiresIn });

    const res = NextResponse.json({ ok: true });
    res.cookies.set("session", sessionCookie, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: expiresIn / 1000,
    });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "login failed" }, { status: 401 });
  }
}
