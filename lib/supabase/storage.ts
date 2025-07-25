import { getSupabaseClient } from "../supabase"

interface UploadResult {
  success: boolean
  message: string
  data?: { path: string } | null
}

export async function uploadImage(file: File, bucket: string): Promise<UploadResult> {
  const supabaseClient = getSupabaseClient()
  const fileExt = file.name.split(".").pop()
  const fileName = `${Date.now()}.${fileExt}`
  const filePath = `${bucket}/${fileName}`

  const { data, error } = await supabaseClient.storage.from(bucket).upload(filePath, file, {
    cacheControl: "3600",
    upsert: false,
  })

  if (error) {
    console.error("Error uploading image:", error)
    return { success: false, message: `Image upload failed: ${error.message}` }
  }

  // Get public URL
  const { data: publicUrlData } = supabaseClient.storage.from(bucket).getPublicUrl(data.path)

  if (!publicUrlData) {
    return { success: false, message: "Failed to get public URL for the uploaded image." }
  }

  return {
    success: true,
    message: "Image uploaded successfully.",
    data: { path: publicUrlData.publicUrl },
  }
}
