/**
 * Simple script to auto-fix ESLint errors in Firebase Functions
 * Run: node fix-lint.js
 */

const { execSync } = require("child_process");

try {
  console.log("🔧 Running ESLint auto-fix on functions directory...");

  // Run eslint with --fix to automatically correct spacing issues
  execSync("npx eslint . --fix", { cwd: "./functions", stdio: "inherit" });

  console.log("✅ ESLint auto-fix complete!");

  console.log("⚠️ Reminder: Remove or use unused variables (onRequest, logger) in index.js manually.");
  console.log("   Example: delete them if not needed, or actually use them in your code.");
} catch (err) {
  console.error("❌ Error running ESLint auto-fix:", err.message);
}