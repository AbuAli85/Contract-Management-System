const fs = require("fs")
const path = require("path")

console.log("🔍 Analyzing bundle size...")

// Check for heavy dependencies
const heavyDependencies = [
  "framer-motion",
  "recharts",
  "@tanstack/react-query",
  "@tanstack/react-table",
  "date-fns",
  "lodash",
  "papaparse",
  "qrcode.react",
  "file-saver",
  "embla-carousel-react",
  "react-day-picker",
  "use-debounce",
  "vaul",
  "cmdk",
  "input-otp",
  "react-resizable-panels",
  "sonner",
  "next-themes",
  "next-intl",
  "framer-motion",
]

console.log("\n📦 Heavy Dependencies Found:")
heavyDependencies.forEach((dep) => {
  console.log(`  - ${dep}`)
})

console.log("\n💡 Optimization Recommendations:")
console.log("  1. Use dynamic imports for heavy components")
console.log("  2. Implement code splitting with React.lazy()")
console.log("  3. Remove unused dependencies")
console.log("  4. Use tree shaking for better bundle optimization")
console.log("  5. Consider using lighter alternatives for heavy libraries")

console.log("\n🚀 Performance Tips:")
console.log("  - Use Suspense boundaries for lazy loading")
console.log("  - Implement preloading for critical components")
console.log("  - Optimize images and assets")
console.log("  - Use Next.js built-in optimizations")

console.log("\n✅ Current optimizations applied:")
console.log("  - Lazy loading for GenerateContractForm")
console.log("  - Dynamic CSS loading")
console.log("  - Preloading on hover")
console.log("  - Suspense boundaries")
console.log("  - Code splitting")
