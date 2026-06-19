import { defineConfig, type Plugin } from "vite";
import { fresh } from "@fresh/plugin-vite";
import tailwindcss from "@tailwindcss/vite";

const MONGO_EXTERNALS = ["mongodb", "bson", "@mongodb-js/saslprep", "sparse-bitfield"];

// Must run before @fresh/plugin-vite's deno resolver so that this.resolve()
// inside the deno plugin returns our external marker instead of loading source.
const mongoExternal: Plugin = {
  name: "mongo-external",
  enforce: "pre",
  resolveId(id: string) {
    if (MONGO_EXTERNALS.some((e) => id === e || id.startsWith(e + "/"))) {
      return { id, external: true };
    }
  },
};

export default defineConfig({
  plugins: [mongoExternal, fresh(), tailwindcss()],
});
