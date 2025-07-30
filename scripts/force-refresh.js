#!/usr/bin/env node

const fs = require("fs")
const path = require("path")

console.log("🔄 Force refreshing deployment...")

// Update package.json version to force cache invalidation
const packageJsonPath = path.join(__dirname, "..", "package.json")
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))

// Add a timestamp to the version to force cache invalidation
const timestamp = Date.now()
const newVersion = `${packageJson.version}-${timestamp}`

console.log(`📦 Updating version from ${packageJson.version} to ${newVersion}`)

packageJson.version = newVersion
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))

// Create a build timestamp file
const buildTimestamp = {
  timestamp: new Date().toISOString(),
  buildId: `build-${timestamp}`,
  version: newVersion,
}

const timestampPath = path.join(__dirname, "..", "public", "build-timestamp.json")
fs.writeFileSync(timestampPath, JSON.stringify(buildTimestamp, null, 2))

console.log("✅ Build timestamp updated")
console.log("📝 Next steps:")
console.log("1. Run: pnpm run deploy:clean")
console.log("2. Clear browser cache")
console.log("3. Check the deployment URL")

// Also update the app to show the build timestamp
const appLayoutPath = path.join(__dirname, "..", "app", "layout.tsx")
if (fs.existsSync(appLayoutPath)) {
  let layoutContent = fs.readFileSync(appLayoutPath, "utf8")

  // Add build timestamp to metadata if not already present
  if (!layoutContent.includes("build-timestamp.json")) {
    const timestampMeta = `
  // Build timestamp for cache busting
  const buildTimestamp = require('../public/build-timestamp.json');
  metadata.description = \`\${metadata.description} (Build: \${buildTimestamp.buildId})\`;
`

    // Find the metadata export and add the timestamp
    if (layoutContent.includes("export const metadata")) {
      layoutContent = layoutContent.replace(
        "export const metadata",
        `${timestampMeta}\nexport const metadata`,
      )
      fs.writeFileSync(appLayoutPath, layoutContent)
      console.log("✅ App layout updated with build timestamp")
    }
  }
}
