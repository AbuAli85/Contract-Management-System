import { redirect } from "next/navigation"
import { getPromoterById } from "@/app/actions/promoters"

export default async function PromoterProfileRedirect({ 
  params 
}: { 
  params: Promise<{ id: string; locale: string }> 
}) {
  try {
    const { id, locale } = await params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      redirect(`/${locale}/manage-promoters`)
    }

    // Check if promoter exists
    const promoter = await getPromoterById(id)
    if (!promoter) {
      redirect(`/${locale}/manage-promoters`)
    }

    // Redirect to the correct route
    redirect(`/${locale}/manage-promoters/${id}`)
  } catch (error) {
    // If any error occurs, redirect to the manage promoters page
    const { locale } = await params
    redirect(`/${locale}/manage-promoters`)
  }
} 