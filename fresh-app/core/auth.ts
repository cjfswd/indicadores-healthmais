import { jwtVerify } from "npm:jose";

export interface JwtPayload {
  id: string;
  email: string;
}

export async function verifyJwt(token: string): Promise<JwtPayload | null> {
  try {
    const secret = new TextEncoder().encode(
      Deno.env.get("JWT_SECRET") ?? "coringa_secret_key"
    );
    const { payload } = await jwtVerify(token, secret);
    return { id: payload.id as string, email: payload.email as string };
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);

  const cookie = req.headers.get("cookie");
  if (cookie) {
    const match = cookie.match(/(?:^|;\s*)auth_token=([^;]+)/);
    if (match) return decodeURIComponent(match[1]);
  }

  return null;
}
