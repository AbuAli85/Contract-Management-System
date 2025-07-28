'use client'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'
import { UserPlus, CalendarCheck, ClipboardList, TrendingUp, Plus, Users, FileText, BarChart3, CheckCircle2 } from 'lucide-react'

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const kpis = [
  {
    label: 'Total Promoters',
    value: 24,
    icon: <Users className="h-6 w-6 text-blue-600" />, 
    color: 'bg-blue-50',
    accent: 'text-blue-600'
  },
  {
    label: 'Active Today',
    value: 0,
    icon: <CalendarCheck className="h-6 w-6 text-green-600" />, 
    color: 'bg-green-50',
    accent: 'text-green-600'
  },
  {
    label: 'Pending Tasks',
    value: 44,
    icon: <ClipboardList className="h-6 w-6 text-yellow-600" />, 
    color: 'bg-yellow-50',
    accent: 'text-yellow-600'
  },
  {
    label: 'Attendance Rate',
    value: '87%',
    icon: <TrendingUp className="h-6 w-6 text-purple-600" />, 
    color: 'bg-purple-50',
    accent: 'text-purple-600'
  }
]

const barData = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [
    {
      label: 'Attendance',
      data: [22, 19, 20, 24, 18, 21, 23],
      backgroundColor: '#6366f1',
      borderRadius: 8,
      barThickness: 24
    }
  ]
}

const barOptions = {
  responsive: true,
  plugins: {
    legend: { display: false }
  },
  scales: {
    y: { beginAtZero: true, ticks: { stepSize: 5 } }
  }
}

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              Admin Dashboard
            </h1>
            <p className="text-lg text-gray-600 mt-2">Welcome back! Here’s your team’s performance at a glance.</p>
          </div>
          <div className="flex items-center gap-4">
            <img src="/placeholder-user.jpg" alt="Admin" className="h-12 w-12 rounded-full shadow-lg border-2 border-blue-200" />
            <span className="font-semibold text-gray-700">Admin User</span>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {kpis.map((kpi, i) => (
            <div key={i} className={`rounded-xl shadow-lg p-6 flex flex-col items-center ${kpi.color}`}>
              <div className="mb-2">{kpi.icon}</div>
              <span className={`text-3xl font-bold ${kpi.accent}`}>{kpi.value}</span>
              <span className="text-gray-500 mt-2">{kpi.label}</span>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" /> Attendance Trend
            </h2>
            <Bar data={barData} options={barOptions} height={200} />
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" /> Performance Overview
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Task Completion</span>
                  <span>298/342</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-blue-600 h-3 rounded-full" style={{ width: '87%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Attendance Rate</span>
                  <span>87.3%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-green-500 h-3 rounded-full" style={{ width: '87%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4 mt-8">
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-700 transition flex items-center gap-2">
            <Plus className="h-5 w-5" /> Add Promoter
          </button>
          <button className="bg-green-600 text-white px-6 py-3 rounded-lg shadow hover:bg-green-700 transition flex items-center gap-2">
            <CalendarCheck className="h-5 w-5" /> Schedule Shift
          </button>
          <button className="bg-yellow-500 text-white px-6 py-3 rounded-lg shadow hover:bg-yellow-600 transition flex items-center gap-2">
            <ClipboardList className="h-5 w-5" /> Assign Task
          </button>
          <button className="bg-purple-600 text-white px-6 py-3 rounded-lg shadow hover:bg-purple-700 transition flex items-center gap-2">
            <FileText className="h-5 w-5" /> View Reports
          </button>
        </div>
      </div>
    </div>
  )
} 