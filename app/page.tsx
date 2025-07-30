import { redirect } from "next/navigation"

export default function Home() {
  // Redirect to the default locale (works with or without trailing slash)
  redirect("/en")
}
