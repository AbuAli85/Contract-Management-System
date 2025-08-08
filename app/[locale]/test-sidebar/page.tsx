"use client"

export default function TestSidebarPage({ params }: { params: { locale: string } }) {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Sidebar Test Page</h1>
      <p className="text-muted-foreground">
        This is a test page to check if the sidebar and navigation are working properly.
      </p>
      <div className="mt-4 p-4 bg-muted rounded">
        <h2 className="font-semibold mb-2">Test Content</h2>
        <p>If you can see this content with a sidebar, then the layout is working correctly.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          The sidebar should be visible on the left side of the screen. You can toggle it using the menu button in the sidebar header.
        </p>
      </div>
    </div>
  )
} 