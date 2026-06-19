import { define } from "@/utils.ts";

export const handlers = define.handlers({
  GET() {
    return new Response(null, { status: 302, headers: { Location: "/dashboard" } });
  },
});
