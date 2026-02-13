import { expoConfig } from "@repo/eslint-config/expo";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...expoConfig,
  {
    ignores: ["expo-env.d.ts", "dist/**", ".expo/**"],
  },
];
