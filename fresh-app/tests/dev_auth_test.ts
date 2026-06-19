import { assertEquals, assertExists } from "$std/assert/mod.ts";
import { handler } from "../routes/api/auth/dev.ts";
import type { FreshContext } from "$fresh/server.ts";

const fakeCtx = {} as FreshContext;

Deno.test("POST /api/auth/dev retorna token em dev", async () => {
  Deno.env.delete("DENO_ENV");
  Deno.env.set("JWT_SECRET", "test-secret");

  const req = new Request("http://localhost/api/auth/dev", { method: "POST" });
  const res = await handler.POST!(req, fakeCtx);

  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.success, true);
  assertExists(body.token);
  assertEquals(body.user.email, "dev@localhost");
});

Deno.test("POST /api/auth/dev retorna 403 em produção", async () => {
  Deno.env.set("DENO_ENV", "production");

  const req = new Request("http://localhost/api/auth/dev", { method: "POST" });
  const res = await handler.POST!(req, fakeCtx);

  assertEquals(res.status, 403);
  Deno.env.delete("DENO_ENV");
});
