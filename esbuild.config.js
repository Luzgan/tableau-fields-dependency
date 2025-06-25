const esbuild = require("esbuild");

esbuild
  .build({
    entryPoints: ["src/index.tsx"],
    bundle: true,
    outdir: "dist",
    format: "esm",
    target: "es2015",
    minify: true,
    sourcemap: false,
    splitting: true,
    metafile: false,
    write: true,
    external: ["express"],
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    loader: {
      ".tsx": "tsx",
      ".ts": "ts",
      ".jsx": "jsx",
      ".js": "js",
    },
  })
  .catch(() => process.exit(1));
