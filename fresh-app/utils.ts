import { createDefine, type MiddlewareFn } from "fresh";
import { verifyJwt, getTokenFromRequest } from "./core/auth.ts";

export interface State {
  user?: { id: string; email: string };
}

export const define = createDefine<State>();

const PUBLIC_ROUTES = ["/login", "/api/auth/google", "/api/auth/dev"];

export const router: MiddlewareFn<State> = async (ctx) => {
  const path = new URL(ctx.req.url).pathname;
  const isPublic = PUBLIC_ROUTES.some((r) => path === r || path.startsWith(r + "/"));

  if (!isPublic) {
    const token = getTokenFromRequest(ctx.req);
    const user = token ? await verifyJwt(token) : null;

    if (!user) {
      const isApi = path.startsWith("/api/");
      if (isApi) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(null, {
        status: 302,
        headers: { Location: "/login" },
      });
    }

    ctx.state.user = user;
  }

  return ctx.next();
};
