import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Make rules more lenient
      "no-unused-vars": "warn",      // Downgrade from error to warning
      "no-console": "off",           // Allow console statements
      "@typescript-eslint/no-explicit-any": "off", // Allow 'any' type
      "@typescript-eslint/no-unused-vars": "warn", // Downgrade from error to warning
      "react/prop-types": "off",     // Disable prop types checking
      "react/display-name": "off",   // Disable display name requirement
      "no-empty": "warn",            // Downgrade empty blocks from error to warning
      "prefer-const": "warn",        // Downgrade from error to warning
      "no-irregular-whitespace": "warn", // Downgrade from error to warning
    },
  }
];

export default eslintConfig;
