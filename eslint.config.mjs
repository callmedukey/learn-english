import { dirname } from "path";
import { fileURLToPath } from "url";

import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.config({
    extends: ["next/core-web-vitals", "next/typescript"],
    plugins: ["import", "unused-imports"],
    rules: {
      "import/order": [
        "error",
        {
          groups: [
            "builtin", // Built-in types are first
            "external", // External libraries
            "internal", // Internal modules
            ["parent", "sibling"], // Parent and sibling types can be mingled together
            "index", // Then the index file
            "object", // Object imports
          ],
          "newlines-between": "always",
          pathGroups: [
            {
              pattern: "@app/**",
              group: "external",
              position: "after",
            },
            {
              pattern: "@db/seed/**",
              group: "external",
              position: "after",
            },
          ],
          pathGroupsExcludedImportTypes: ["builtin"],
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],
    },
    ignorePatterns: ["components/ui/**", "components/magicui/**"],
    overrides: [
      {
        files: ["*.ts", "*.tsx", "db/seed/*.ts", "db/seed/**/*.ts"],
        rules: {
          "no-undef": "off",
          "@typescript-eslint/no-unused-vars": "error",
          "unused-imports/no-unused-imports": "error",
          "unused-imports/no-unused-vars": "error",
          "@typescript-eslint/no-explicit-any": "warn",
        },
      },
    ],
    settings: {
      tailwindcss: {
        config: "./tailwind.config.ts",
      },
    },
  }),
];

export default eslintConfig;
