const { createClient } = require("@supabase/supabase-js")
require("dotenv").config()

async function makeBucketPublic() {
  console.log("🔓 Making storage bucket public for PDF downloads...")

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

    // Check current bucket status
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

    console.log("📋 Current bucket status:")
    console.log(`  - Name: ${contractsBucket.name}`)
    console.log(`  - Public: ${contractsBucket.public}`)
    console.log(`  - File size limit: ${contractsBucket.file_size_limit}`)
    console.log(
      `  - Allowed MIME types: ${contractsBucket.allowed_mime_types?.join(", ") || "None"}`,
    )

    if (contractsBucket.public) {
      console.log("✅ Bucket is already public!")
      return
    }

    console.log("🔧 Making bucket public...")

    // Update bucket to be public
    const { data: updatedBucket, error: updateError } = await supabase.storage.updateBucket(
      "contracts",
      {
        public: true,
        allowedMimeTypes: ["application/pdf"],
        fileSizeLimit: 52428800, // 50MB
      },
    )

    if (updateError) {
      console.error("❌ Error updating bucket:", updateError)
      return
    }

    console.log("✅ Successfully made bucket public!")
    console.log("📋 Updated bucket details:")
    console.log(`  - Name: ${updatedBucket.name}`)
    console.log(`  - Public: ${updatedBucket.public}`)
    console.log(`  - File size limit: ${updatedBucket.file_size_limit}`)
    console.log(`  - Allowed MIME types: ${updatedBucket.allowed_mime_types?.join(", ") || "None"}`)

    // Test the fix
    console.log("\n🧪 Testing public access...")
    const testFileName = `test-public-${Date.now()}.pdf`
    const testContent = Buffer.from("Test Public PDF Content", "utf-8")

    // Upload test file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("contracts")
      .upload(testFileName, testContent, {
        contentType: "application/pdf",
        cacheControl: "3600",
      })

    if (uploadError) {
      console.error("❌ Upload test failed:", uploadError)
      return
    }

    console.log("✅ Upload successful!")

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("contracts").getPublicUrl(testFileName)

    console.log("🔗 Public URL:", publicUrl)

    // Test URL access
    try {
      const response = await fetch(publicUrl)
      if (response.ok) {
        console.log("✅ Public URL is accessible!")
        console.log("🎉 PDF downloads should work now!")
      } else {
        console.log("⚠️ URL returned status:", response.status)
      }
    } catch (error) {
      console.log("⚠️ URL access test failed:", error.message)
    }

    // Clean up test file
    const { error: deleteError } = await supabase.storage.from("contracts").remove([testFileName])

    if (deleteError) {
      console.log("⚠️ Could not delete test file:", deleteError)
    } else {
      console.log("✅ Test file cleaned up")
    }
  } catch (error) {
    console.error("❌ Script error:", error)
  }
}

// Run the script
makeBucketPublic()
  .then(() => {
    console.log("\n🎉 Bucket public setup completed!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("💥 Script failed:", error)
    process.exit(1)
  })
