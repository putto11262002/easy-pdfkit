import typescript from "rollup-plugin-typescript2";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import dts from "rollup-plugin-dts";
const config = [
  {
    input: "src/index.ts",
    output: [
      {
        file: "dist/bundle.umd.js",
        format: "umd",
        name: "easy-pdfkit",
        sourcemap: true,
        globals: {
          pdfkit: "pdfkit",
        },
      },
      {
        file: "dist/bundle.esm.js",
        format: "esm",
        sourcemap: true,
      },
    ],
    external: ["pdfkit"],
    watch: {
      include: "src/**",
    },
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        useTsconfigDeclarationDir: true,
      }),
    ],
  },
  {
    input: "dist/types/index.d.ts",
    output: {
      file: "dist/bundle.d.ts",
      format: "es",
    },
    plugins: [dts({})],
  },
];

export default config;
