import { assertEquals, assertExists, assertStrictEquals } from "$std/assert/mod.ts";
import { SignJWT } from "npm:jose";
import { getTokenFromRequest, verifyJwt } from "../core/auth.ts";

const SECRET = "test-secret-key";

async function makeToken(payload: Record<string, unknown>, secret = SECRET): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(secret));
}

// ── verifyJwt ─────────────────────────────────────────────────────────────────

Deno.test("verifyJwt retorna payload válido para token correto", async () => {
  Deno.env.set("JWT_SECRET", SECRET);
  const token = await makeToken({ id: "user1", email: "user@test.com" });
  const result = await verifyJwt(token);
  assertExists(result);
  assertEquals(result.id, "user1");
  assertEquals(result.email, "user@test.com");
});

Deno.test("verifyJwt retorna null para token com secret errado", async () => {
  Deno.env.set("JWT_SECRET", SECRET);
  const token = await makeToken({ id: "u1", email: "x@x.com" }, "outro-secret");
  const result = await verifyJwt(token);
  assertStrictEquals(result, null);
});

Deno.test("verifyJwt retorna null para token inválido", async () => {
  Deno.env.set("JWT_SECRET", SECRET);
  const result = await verifyJwt("not.a.valid.token");
  assertStrictEquals(result, null);
});

Deno.test("verifyJwt retorna null para token expirado", async () => {
  Deno.env.set("JWT_SECRET", SECRET);
  const token = await new SignJWT({ id: "u1", email: "x@x.com" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("-1s") // já expirado
    .sign(new TextEncoder().encode(SECRET));
  const result = await verifyJwt(token);
  assertStrictEquals(result, null);
});

// ── getTokenFromRequest ───────────────────────────────────────────────────────

Deno.test("getTokenFromRequest extrai token do header Authorization", () => {
  const req = new Request("http://localhost/", {
    headers: { Authorization: "Bearer mytoken123" },
  });
  assertEquals(getTokenFromRequest(req), "mytoken123");
});

Deno.test("getTokenFromRequest retorna null sem header Authorization", () => {
  const req = new Request("http://localhost/");
  assertStrictEquals(getTokenFromRequest(req), null);
});

Deno.test("getTokenFromRequest retorna null para header sem Bearer", () => {
  const req = new Request("http://localhost/", {
    headers: { Authorization: "Basic dXNlcjpwYXNz" },
  });
  assertStrictEquals(getTokenFromRequest(req), null);
});
