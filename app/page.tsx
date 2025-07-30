import { redirect } from 'next/navigation'

export default function Home() {
  // Redirect to the default locale with trailing slash
  redirect('/en/')
}
