import { define } from "@/utils.ts";
import { SignJWT } from "npm:jose";
import { getDb, createObjectId } from "../../../core/db.ts";

interface GoogleUserInfo {
  email: string;
  name: string;
  picture: string;
}

interface AuthRequest {
  access_token: string;
}

export const handlers = define.handlers({
  async POST(ctx) {
    let body: AuthRequest;
    try {
      body = await ctx.req.json();
    } catch {
      return Response.json({ success: false, message: "Invalid JSON" }, { status: 400 });
    }

    const { access_token } = body;
    if (!access_token) {
      return Response.json({ success: false, message: "access_token required" }, { status: 400 });
    }

    // Verificar token com Google
    let googleUser: GoogleUserInfo;
    try {
      const res = await fetch(
        `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`
      );
      if (!res.ok) throw new Error("Invalid Google token");
      googleUser = await res.json();
    } catch {
      return Response.json({ success: false, message: "Invalid Google token" }, { status: 401 });
    }

    const db = await getDb();
    const users = db.collection("users");

    // Criar ou recuperar usuário
    let user = await users.findOne({ email: googleUser.email, deletedAt: null });
    if (!user) {
      const _id = await createObjectId();
      await users.insertOne({
        _id,
        name: googleUser.name,
        email: googleUser.email,
        avatar: googleUser.picture,
        createdAt: new Date(),
        deletedAt: null,
      });
      user = await users.findOne({ _id });
    }

    if (!user) {
      return Response.json({ success: false, message: "Failed to create user" }, { status: 500 });
    }

    // Emitir JWT HS256
    const secret = new TextEncoder().encode(
      Deno.env.get("JWT_SECRET") ?? "coringa_secret_key"
    );

    const token = await new SignJWT({ id: user._id.toString(), email: user.email })
      .setProtectedHeader({ alg: "HS256" })
      .sign(secret);

    return Response.json({
      success: true,
      token,
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  },
});