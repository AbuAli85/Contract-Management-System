// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'

export default function GenerateContractLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
} 