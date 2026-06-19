import { define } from "@/utils.ts";
import { SignJWT } from "npm:jose";

export const handlers = define.handlers({
  async POST(_ctx) {
    if (Deno.env.get("DENO_ENV") === "production") {
      return new Response(JSON.stringify({ error: "Not available in production" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const secret = new TextEncoder().encode(
      Deno.env.get("JWT_SECRET") ?? "coringa_secret_key"
    );

    const token = await new SignJWT({ id: "dev-user", email: "dev@localhost" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("24h")
      .sign(secret);

    return new Response(
      JSON.stringify({
        success: true,
        token,
        user: { id: "dev-user", email: "dev@localhost" },
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  },
});