import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { signAdminJwt, verifyPassword } from "@/lib/auth";
import { User } from "@/models/User";

const BodySchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = BodySchema.parse(await req.json());
    await dbConnect();

    const user = await User.findOne({
      username: body.username,
      role: "admin",
      isActive: true,
    });

    const ok =
      !!user && (await verifyPassword(body.password, user.passwordHash));
    if (!ok) {
      return NextResponse.json(
        { error: "Invalid credentials." },
        { status: 401 }
      );
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = signAdminJwt({
      sub: user._id.toString(),
      username: user.username,
    });
    const res = NextResponse.json({ ok: true });
    res.cookies.set("thesis_admin", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch {
    // Generic error response to avoid credential hints
    return NextResponse.json(
      { error: "Invalid credentials." },
      { status: 401 }
    );
  }
}

