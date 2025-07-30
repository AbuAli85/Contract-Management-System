const { createClient } = require("@supabase/supabase-js")
require("dotenv").config()

async function checkStorageStatus() {
  console.log("🔍 Checking storage bucket status and permissions...")

  try {
    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("❌ Missing Supabase environment variables:")
      console.error("   - NEXT_PUBLIC_SUPABASE_URL")
      console.error("   - SUPABASE_SERVICE_ROLE_KEY")
      return
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      console.error("❌ Error listing buckets:", listError)
      return
    }

    const contractsBucket = buckets?.find((bucket) => bucket.name === "contracts")

    if (!contractsBucket) {
      console.log('❌ Storage bucket "contracts" does not exist!')
      return
    }

    console.log('✅ Storage bucket "contracts" exists!')
    console.log("📋 Bucket details:")
    console.log(`  - Name: ${contractsBucket.name}`)
    console.log(`  - ID: ${contractsBucket.id}`)
    console.log(`  - Public: ${contractsBucket.public}`)
    console.log(`  - File size limit: ${contractsBucket.file_size_limit}`)
    console.log(
      `  - Allowed MIME types: ${contractsBucket.allowed_mime_types?.join(", ") || "None"}`,
    )
    console.log(`  - Created: ${contractsBucket.created_at}`)
    console.log(`  - Updated: ${contractsBucket.updated_at}`)

    // Test upload permissions
    console.log("\n🧪 Testing upload permissions...")

    const testFileName = `test-${Date.now()}.pdf`
    const testContent = Buffer.from("Test PDF content", "utf-8")

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("contracts")
      .upload(testFileName, testContent, {
        contentType: "application/pdf",
        cacheControl: "3600",
      })

    if (uploadError) {
      console.error("❌ Upload test failed:", uploadError)
      console.log("💡 This suggests a permissions issue. Check:")
      console.log("   1. Storage policies in Supabase Dashboard")
      console.log("   2. Service role key permissions")
      console.log("   3. RLS (Row Level Security) settings")
    } else {
      console.log("✅ Upload test successful!")

      // Test public URL access
      const {
        data: { publicUrl },
      } = supabase.storage.from("contracts").getPublicUrl(testFileName)

      console.log("🔗 Public URL generated:", publicUrl)

      // Clean up test file
      const { error: deleteError } = await supabase.storage.from("contracts").remove([testFileName])

      if (deleteError) {
        console.log("⚠️ Could not delete test file:", deleteError)
      } else {
        console.log("✅ Test file cleaned up successfully")
      }
    }

    // Check bucket policies
    console.log("\n🔒 Checking bucket policies...")
    console.log("📋 Manual policy check required:")
    console.log("   1. Go to Supabase Dashboard > Storage > Policies")
    console.log('   2. Select the "contracts" bucket')
    console.log("   3. Ensure these policies exist:")
    console.log("      - INSERT policy for authenticated users")
    console.log("      - SELECT policy for public access")
    console.log("   4. If policies are missing, create them manually")
  } catch (error) {
    console.error("❌ Script error:", error)
  }
}

// Run the script
checkStorageStatus()
  .then(() => {
    console.log("\n🎉 Storage status check completed!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("💥 Script failed:", error)
    process.exit(1)
  })
