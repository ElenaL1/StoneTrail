import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Existing pages load data and reset UI in effects. Rewriting them is a separate pass.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    files: ["components/ui/**"],
    rules: {
      "@typescript-eslint/no-empty-object-type": "off",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
])

export default eslintConfig
