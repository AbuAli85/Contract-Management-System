#!/usr/bin/env node

const { execSync } = require("child_process")
const fs = require("fs")
const path = require("path")

console.log("🚀 Starting clean deployment...")

// Function to run commands
function runCommand(command, description) {
  console.log(`\n📋 ${description}`)
  try {
    execSync(command, { stdio: "inherit" })
    console.log(`✅ ${description} completed successfully`)
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message)
    process.exit(1)
  }
}

// Function to remove directory if it exists
function removeDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    console.log(`🗑️  Removing ${dirPath}`)
    fs.rmSync(dirPath, { recursive: true, force: true })
  }
}

try {
  // Step 1: Clean up build artifacts
  console.log("\n🧹 Cleaning up build artifacts...")
  removeDirectory(".next")
  removeDirectory("node_modules/.cache")
  removeDirectory(".vercel")

  // Step 2: Clear npm/pnpm cache
  console.log("\n🗑️  Clearing package manager cache...")
  try {
    execSync("pnpm store prune", { stdio: "inherit" })
  } catch (error) {
    console.log("⚠️  Could not clear pnpm cache, continuing...")
  }

  // Step 3: Reinstall dependencies
  runCommand("pnpm install", "Reinstalling dependencies")

  // Step 4: Build the project
  runCommand("pnpm build", "Building the project")

  // Step 5: Deploy to Vercel
  runCommand("vercel --prod --force", "Deploying to production")

  console.log("\n🎉 Clean deployment completed successfully!")
  console.log("\n📝 Next steps:")
  console.log("1. Check your Vercel dashboard for deployment status")
  console.log("2. Clear your browser cache (Ctrl+Shift+R or Cmd+Shift+R)")
  console.log("3. Test the application on the deployed URL")
} catch (error) {
  console.error("\n❌ Deployment failed:", error.message)
  process.exit(1)
}
