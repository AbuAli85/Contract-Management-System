import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

// Types
interface Promoter {
  id: string
  name_en: string
  name_ar: string
  email: string
  phone: string
  status: string
  performance_score: number
  attendance_rate: number
  total_tasks: number
  completed_tasks: number
  created_at: string
}

interface DashboardMetrics {
  totalPromoters: number
  activePromoters: number
  onLeave: number
  pendingApprovals: number
  todayAttendance: number
  attendanceRate: number
  completedTasks: number
  pendingTasks: number
  performanceScore: number
}

interface Task {
  id: string
  title: string
  description: string
  dueDate: string
  priority: "low" | "medium" | "high"
  status: "pending" | "in_progress" | "completed"
  points: number
  assignedTo: string
  createdAt: string
}

interface AttendanceData {
  date: string
  present: number
  absent: number
  late: number
}

// API functions
const api = {
  // Dashboard metrics
  getDashboardMetrics: async (period: string): Promise<DashboardMetrics> => {
    const response = await fetch(`/api/dashboard/metrics?period=${period}`)
    if (!response.ok) throw new Error("Failed to fetch dashboard metrics")
    return response.json()
  },

  // Promoters
  getPromoters: async (): Promise<Promoter[]> => {
    const response = await fetch("/api/promoters")
    if (!response.ok) throw new Error("Failed to fetch promoters")
    return response.json()
  },

  getPromoter: async (id: string): Promise<Promoter> => {
    const response = await fetch(`/api/promoters/${id}`)
    if (!response.ok) throw new Error("Failed to fetch promoter")
    return response.json()
  },

  createPromoter: async (data: FormData): Promise<Promoter> => {
    const response = await fetch("/api/promoters", {
      method: "POST",
      body: data,
    })
    if (!response.ok) throw new Error("Failed to create promoter")
    return response.json()
  },

  updatePromoter: async ({
    id,
    data,
  }: {
    id: string
    data: Partial<Promoter>
  }): Promise<Promoter> => {
    const response = await fetch(`/api/promoters/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error("Failed to update promoter")
    return response.json()
  },

  deletePromoter: async (id: string): Promise<void> => {
    const response = await fetch(`/api/promoters/${id}`, {
      method: "DELETE",
    })
    if (!response.ok) throw new Error("Failed to delete promoter")
  },

  // Tasks
  getTasks: async (promoterId?: string): Promise<Task[]> => {
    const url = promoterId ? `/api/promoters/${promoterId}/tasks` : "/api/tasks"
    const response = await fetch(url)
    if (!response.ok) throw new Error("Failed to fetch tasks")
    return response.json()
  },

  createTask: async (data: Partial<Task>): Promise<Task> => {
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error("Failed to create task")
    return response.json()
  },

  updateTask: async ({ id, data }: { id: string; data: Partial<Task> }): Promise<Task> => {
    const response = await fetch(`/api/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error("Failed to update task")
    return response.json()
  },

  deleteTask: async (id: string): Promise<void> => {
    const response = await fetch(`/api/tasks/${id}`, {
      method: "DELETE",
    })
    if (!response.ok) throw new Error("Failed to delete task")
  },

  // Attendance
  getAttendanceData: async (period: string): Promise<AttendanceData[]> => {
    const response = await fetch(`/api/dashboard/attendance?period=${period}`)
    if (!response.ok) throw new Error("Failed to fetch attendance data")
    return response.json()
  },

  // Onboarding
  submitOnboarding: async (data: FormData): Promise<any> => {
    const response = await fetch("/api/promoters/onboarding", {
      method: "POST",
      body: data,
    })
    if (!response.ok) throw new Error("Failed to submit onboarding")
    return response.json()
  },
}

// React Query hooks
export const useDashboardMetrics = (period: string = "today") => {
  return useQuery({
    queryKey: ["dashboard-metrics", period],
    queryFn: () => api.getDashboardMetrics(period),
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 10000, // Consider data fresh for 10 seconds
  })
}

export const usePromoters = () => {
  return useQuery({
    queryKey: ["promoters"],
    queryFn: api.getPromoters,
    staleTime: 60000, // Consider data fresh for 1 minute
  })
}

export const usePromoter = (id: string) => {
  return useQuery({
    queryKey: ["promoter", id],
    queryFn: () => api.getPromoter(id),
    enabled: !!id,
    staleTime: 60000,
  })
}

export const useTasks = (promoterId?: string) => {
  return useQuery({
    queryKey: ["tasks", promoterId],
    queryFn: () => api.getTasks(promoterId),
    staleTime: 30000,
  })
}

export const useAttendanceData = (period: string = "week") => {
  return useQuery({
    queryKey: ["attendance-data", period],
    queryFn: () => api.getAttendanceData(period),
    staleTime: 60000,
  })
}

// Mutations
export const useCreatePromoter = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.createPromoter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promoters"] })
      toast.success("Promoter created successfully!")
    },
    onError: (error) => {
      toast.error("Failed to create promoter")
      console.error("Create promoter error:", error)
    },
  })
}

export const useUpdatePromoter = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.updatePromoter,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["promoters"] })
      queryClient.invalidateQueries({ queryKey: ["promoter", data.id] })
      toast.success("Promoter updated successfully!")
    },
    onError: (error) => {
      toast.error("Failed to update promoter")
      console.error("Update promoter error:", error)
    },
  })
}

export const useDeletePromoter = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.deletePromoter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promoters"] })
      toast.success("Promoter deleted successfully!")
    },
    onError: (error) => {
      toast.error("Failed to delete promoter")
      console.error("Delete promoter error:", error)
    },
  })
}

export const useCreateTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      toast.success("Task created successfully!")
    },
    onError: (error) => {
      toast.error("Failed to create task")
      console.error("Create task error:", error)
    },
  })
}

export const useUpdateTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.updateTask,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      queryClient.invalidateQueries({ queryKey: ["task", data.id] })
      toast.success("Task updated successfully!")
    },
    onError: (error) => {
      toast.error("Failed to update task")
      console.error("Update task error:", error)
    },
  })
}

export const useDeleteTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      toast.success("Task deleted successfully!")
    },
    onError: (error) => {
      toast.error("Failed to delete task")
      console.error("Delete task error:", error)
    },
  })
}

export const useSubmitOnboarding = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.submitOnboarding,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promoters"] })
      toast.success("Onboarding submitted successfully!")
    },
    onError: (error) => {
      toast.error("Failed to submit onboarding")
      console.error("Onboarding error:", error)
    },
  })
}

// Utility hooks
export const usePromoterStats = (promoterId: string) => {
  const { data: promoter } = usePromoter(promoterId)
  const { data: tasks } = useTasks(promoterId)

  const stats = {
    totalTasks: tasks?.length || 0,
    completedTasks: tasks?.filter((t) => t.status === "completed").length || 0,
    pendingTasks: tasks?.filter((t) => t.status !== "completed").length || 0,
    performanceScore: promoter?.performance_score || 0,
    attendanceRate: promoter?.attendance_rate || 0,
  }

  return {
    stats,
    isLoading: !promoter || !tasks,
  }
}

export const usePromoterPerformance = (promoterId: string, period: string = "month") => {
  const { data: tasks } = useTasks(promoterId)
  const { data: attendanceData } = useAttendanceData(period)

  const performance = {
    taskCompletionRate: tasks
      ? (tasks.filter((t) => t.status === "completed").length / tasks.length) * 100
      : 0,
    averageAttendance: attendanceData
      ? attendanceData.reduce((acc, day) => acc + day.present, 0) / attendanceData.length
      : 0,
    totalPoints: tasks
      ? tasks.filter((t) => t.status === "completed").reduce((acc, t) => acc + t.points, 0)
      : 0,
  }

  return {
    performance,
    isLoading: !tasks || !attendanceData,
  }
}
