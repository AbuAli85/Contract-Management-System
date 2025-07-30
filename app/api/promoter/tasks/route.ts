import { NextRequest, NextResponse } from "next/server"

// Force dynamic rendering for this API route
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "all"

    // Mock data for promoter tasks
    const mockTasks = [
      {
        id: 1,
        title: "Product Launch Event",
        description:
          "Lead product demonstration at tech conference. Set up booth, demonstrate features, collect leads.",
        dueDate: "2024-06-25",
        priority: "high",
        status: "in_progress",
        progress: 75,
        category: "Event",
        estimatedHours: 8,
        actualHours: 6,
        client: "TechCorp Inc",
        location: "Convention Center",
        attachments: ["presentation.pdf", "product-specs.docx"],
        notes: "Remember to bring demo devices and marketing materials",
      },
      {
        id: 2,
        title: "Client Meeting - ABC Corp",
        description: "Present quarterly performance report and discuss upcoming campaigns",
        dueDate: "2024-06-22",
        priority: "medium",
        status: "pending",
        progress: 0,
        category: "Meeting",
        estimatedHours: 2,
        actualHours: 0,
        client: "ABC Corporation",
        location: "Client Office",
        attachments: ["quarterly-report.pdf"],
        notes: "Prepare presentation slides and bring printed reports",
      },
      {
        id: 3,
        title: "Social Media Campaign",
        description: "Create and manage Instagram campaign for new product line",
        dueDate: "2024-06-28",
        priority: "low",
        status: "completed",
        progress: 100,
        category: "Marketing",
        estimatedHours: 4,
        actualHours: 3.5,
        client: "BrandX",
        location: "Remote",
        attachments: ["campaign-brief.pdf", "content-calendar.xlsx"],
        notes: "Campaign performed above expectations with 15% engagement rate",
      },
      {
        id: 4,
        title: "Training Session",
        description: "Train new team members on product features and sales techniques",
        dueDate: "2024-06-30",
        priority: "medium",
        status: "pending",
        progress: 0,
        category: "Training",
        estimatedHours: 6,
        actualHours: 0,
        client: "Internal",
        location: "Office",
        attachments: ["training-materials.zip"],
        notes: "Prepare interactive demo and Q&A session",
      },
      {
        id: 5,
        title: "Trade Show Booth",
        description: "Manage booth at industry trade show, engage with potential clients",
        dueDate: "2024-07-05",
        priority: "high",
        status: "pending",
        progress: 25,
        category: "Event",
        estimatedHours: 12,
        actualHours: 3,
        client: "Industry Expo",
        location: "Exhibition Center",
        attachments: ["booth-layout.pdf", "product-catalog.pdf"],
        notes: "Booth setup completed, need to finalize presentation materials",
      },
      {
        id: 6,
        title: "Follow-up Calls",
        description: "Make follow-up calls to leads from last week's event",
        dueDate: "2024-06-20",
        priority: "medium",
        status: "completed",
        progress: 100,
        category: "Sales",
        estimatedHours: 3,
        actualHours: 2.5,
        client: "Various",
        location: "Remote",
        attachments: ["lead-list.xlsx", "call-script.docx"],
        notes: "Generated 5 qualified leads, 2 meetings scheduled",
      },
    ]

    // Filter tasks based on status if specified
    let filteredTasks = mockTasks
    if (status !== "all") {
      filteredTasks = mockTasks.filter((task) => task.status === status)
    }

    return NextResponse.json({
      tasks: filteredTasks,
      summary: {
        total: mockTasks.length,
        completed: mockTasks.filter((t) => t.status === "completed").length,
        inProgress: mockTasks.filter((t) => t.status === "in_progress").length,
        pending: mockTasks.filter((t) => t.status === "pending").length,
        overdue: mockTasks.filter(
          (t) => new Date(t.dueDate) < new Date() && t.status !== "completed",
        ).length,
      },
    })
  } catch (error) {
    console.error("Promoter tasks error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch promoter tasks",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
