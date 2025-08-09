"use client"
import { CalendarCheck, BarChart3, CheckCircle2, Users, ClipboardList, TrendingUp } from 'lucide-react'

// Simple chart placeholder component
const Bar = ({ data, options }: { data: any; options?: any }) => (
  <div className="h-64 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg flex items-center justify-center border border-blue-200">
    <div className="text-center">
      <BarChart3 className="h-12 w-12 mx-auto text-blue-500 mb-2" />
      <p className="text-blue-600 font-medium">Chart Visualization</p>
      <p className="text-blue-500 text-sm">Chart.js integration coming soon</p>
    </div>
  </div>
)

const kpis = [
  {
    label: "Total Promoters",
    value: 24,
    icon: <Users className="h-6 w-6 text-blue-600" />,
    color: "bg-blue-50",
    accent: "text-blue-600",
  },
  {
    label: "Active Today",
    value: 0,
    icon: <CalendarCheck className="h-6 w-6 text-green-600" />,
    color: "bg-green-50",
    accent: "text-green-600",
  },
  {
    label: "Pending Tasks",
    value: 44,
    icon: <ClipboardList className="h-6 w-6 text-yellow-600" />,
    color: "bg-yellow-50",
    accent: "text-yellow-600",
  },
  {
    label: "Attendance Rate",
    value: "87%",
    icon: <TrendingUp className="h-6 w-6 text-purple-600" />,
    color: "bg-purple-50",
    accent: "text-purple-600",
  },
]

const barData = {
  labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  datasets: [
    {
      label: "Attendance",
      data: [22, 19, 20, 24, 18, 21, 23],
      backgroundColor: "#6366f1",
      borderRadius: 8,
      barThickness: 24,
    },
  ],
}

const barOptions = {
  responsive: true,
  plugins: {
    legend: { display: false },
  },
  scales: {
    y: { beginAtZero: true, ticks: { stepSize: 5 } },
  },
}

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div>
            <h1 className="flex items-center gap-2 text-4xl font-bold text-gray-900">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              Admin Dashboard
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Welcome back! Here’s your team’s performance at a glance.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <img
              src="/placeholder-user.jpg"
              alt="Admin"
              className="h-12 w-12 rounded-full border-2 border-blue-200 shadow-lg"
            />
            <span className="font-semibold text-gray-700">Admin User</span>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
          {kpis.map((kpi, i) => (
            <div
              key={i}
              className={`flex flex-col items-center rounded-xl p-6 shadow-lg ${kpi.color}`}
            >
              <div className="mb-2">{kpi.icon}</div>
              <span className={`text-3xl font-bold ${kpi.accent}`}>{kpi.value}</span>
              <span className="mt-2 text-gray-500">{kpi.label}</span>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-xl bg-white p-6 shadow-lg">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <TrendingUp className="h-5 w-5 text-blue-600" /> Attendance Trend
            </h2>
            <Bar data={barData} options={barOptions} height={200} />
          </div>
          <div className="rounded-xl bg-white p-6 shadow-lg">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <CheckCircle2 className="h-5 w-5 text-green-600" /> Performance Overview
            </h2>
            <div className="space-y-4">
              <div>
                <div className="mb-1 flex justify-between text-sm text-gray-600">
                  <span>Task Completion</span>
                  <span>298/342</span>
                </div>
                <div className="h-3 w-full rounded-full bg-gray-200">
                  <div className="h-3 rounded-full bg-blue-600" style={{ width: "87%" }} />
                </div>
              </div>
              <div>
                <div className="mb-1 flex justify-between text-sm text-gray-600">
                  <span>Attendance Rate</span>
                  <span>87.3%</span>
                </div>
                <div className="h-3 w-full rounded-full bg-gray-200">
                  <div className="h-3 rounded-full bg-green-500" style={{ width: "87%" }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 flex flex-wrap gap-4">
          <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white shadow transition hover:bg-blue-700">
            <Plus className="h-5 w-5" /> Add Promoter
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 text-white shadow transition hover:bg-green-700">
            <CalendarCheck className="h-5 w-5" /> Schedule Shift
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-yellow-500 px-6 py-3 text-white shadow transition hover:bg-yellow-600">
            <ClipboardList className="h-5 w-5" /> Assign Task
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-purple-600 px-6 py-3 text-white shadow transition hover:bg-purple-700">
            <FileText className="h-5 w-5" /> View Reports
          </button>
        </div>
      </div>
    </div>
  )
}
