import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // The shop's links go through ShopLink, so the dashboard's theme preview
  // keeps its theme on every page (lib/theme-preview).
  {
    rules: {
      "no-restricted-imports": ["error", { paths: [{ name: "next/link", message: "Use @/app/components/ShopLink." }] }],
    },
  },
  { files: ["app/components/ShopLink.tsx"], rules: { "no-restricted-imports": "off" } },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
