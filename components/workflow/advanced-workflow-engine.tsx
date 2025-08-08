"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Workflow,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  Zap,
  Settings,
  Play,
  Pause,
  Stop,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Plus,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Activity,
  Target,
  Calendar,
  FileText,
  Shield,
  DollarSign,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface WorkflowStep {
  id: string
  name: string
  type: "approval" | "review" | "signature" | "notification" | "automation" | "condition"
  status: "pending" | "active" | "completed" | "failed" | "skipped"
  assignee?: string
  dueDate?: string
  priority: "low" | "medium" | "high" | "critical"
  estimatedTime: number
  actualTime?: number
  conditions?: Array<{
    field: string
    operator: "equals" | "greater_than" | "less_than" | "contains"
    value: any
  }>
  actions?: Array<{
    type: string
    description: string
    executed: boolean
  }>
}

interface WorkflowDefinition {
  id: string
  name: string
  description: string
  version: string
  status: "active" | "inactive" | "draft"
  steps: WorkflowStep[]
  triggers: Array<{
    event: string
    conditions: any[]
  }>
  rules: Array<{
    name: string
    condition: string
    action: string
    priority: number
  }>
  metrics: {
    averageCompletionTime: number
    successRate: number
    totalExecutions: number
    activeInstances: number
  }
}

interface WorkflowInstance {
  id: string
  workflowId: string
  contractId: string
  status: "running" | "completed" | "failed" | "paused"
  currentStep: number
  startedAt: string
  completedAt?: string
  progress: number
  steps: WorkflowStep[]
  variables: Record<string, any>
  logs: Array<{
    timestamp: string
    level: "info" | "warning" | "error"
    message: string
    stepId?: string
  }>
}

export function AdvancedWorkflowEngine() {
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([])
  const [instances, setInstances] = useState<WorkflowInstance[]>([])
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowDefinition | null>(null)
  const [selectedInstance, setSelectedInstance] = useState<WorkflowInstance | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadWorkflows()
  }, [])

  const loadWorkflows = async () => {
    setLoading(true)
    try {
      // Mock data - in production, fetch from API
      const mockWorkflows: WorkflowDefinition[] = [
        {
          id: "wf_001",
          name: "Standard Contract Approval",
          description: "Standard workflow for contract approval with legal and HR review",
          version: "1.2.0",
          status: "active",
          steps: [
            {
              id: "step_1",
              name: "Contract Creation",
              type: "automation",
              status: "completed",
              priority: "medium",
              estimatedTime: 30,
              actualTime: 25,
            },
            {
              id: "step_2",
              name: "Legal Review",
              type: "approval",
              status: "active",
              assignee: "legal@company.com",
              dueDate: "2024-02-15",
              priority: "high",
              estimatedTime: 120,
              conditions: [{ field: "contract_value", operator: "greater_than", value: 50000 }],
            },
            {
              id: "step_3",
              name: "HR Review",
              type: "approval",
              status: "pending",
              assignee: "hr@company.com",
              priority: "medium",
              estimatedTime: 90,
            },
            {
              id: "step_4",
              name: "Final Approval",
              type: "approval",
              status: "pending",
              assignee: "manager@company.com",
              priority: "critical",
              estimatedTime: 60,
            },
            {
              id: "step_5",
              name: "Contract Signature",
              type: "signature",
              status: "pending",
              priority: "high",
              estimatedTime: 30,
            },
          ],
          triggers: [
            {
              event: "contract_created",
              conditions: [{ field: "status", operator: "equals", value: "draft" }],
            },
          ],
          rules: [
            {
              name: "High Value Contract",
              condition: "contract_value > 100000",
              action: "require_executive_approval",
              priority: 1,
            },
            {
              name: "International Contract",
              condition: 'country != "US"',
              action: "require_legal_review",
              priority: 2,
            },
          ],
          metrics: {
            averageCompletionTime: 4.5,
            successRate: 94.2,
            totalExecutions: 156,
            activeInstances: 12,
          },
        },
        {
          id: "wf_002",
          name: "Express Contract Processing",
          description: "Fast-track workflow for low-value contracts",
          version: "1.0.0",
          status: "active",
          steps: [
            {
              id: "step_1",
              name: "Quick Review",
              type: "review",
              status: "pending",
              priority: "medium",
              estimatedTime: 45,
            },
            {
              id: "step_2",
              name: "Auto Approval",
              type: "automation",
              status: "pending",
              priority: "low",
              estimatedTime: 15,
            },
          ],
          triggers: [
            {
              event: "contract_created",
              conditions: [{ field: "contract_value", operator: "less_than", value: 10000 }],
            },
          ],
          rules: [],
          metrics: {
            averageCompletionTime: 1.2,
            successRate: 98.5,
            totalExecutions: 89,
            activeInstances: 5,
          },
        },
      ]

      setWorkflows(mockWorkflows)

      // Mock instances
      const mockInstances: WorkflowInstance[] = [
        {
          id: "inst_001",
          workflowId: "wf_001",
          contractId: "contract_123",
          status: "running",
          currentStep: 1,
          startedAt: "2024-02-10T10:00:00Z",
          progress: 40,
          steps: mockWorkflows[0].steps,
          variables: {
            contract_value: 75000,
            contract_type: "employment",
            urgency: "normal",
          },
          logs: [
            {
              timestamp: "2024-02-10T10:00:00Z",
              level: "info",
              message: "Workflow started",
              stepId: "step_1",
            },
            {
              timestamp: "2024-02-10T10:25:00Z",
              level: "info",
              message: "Step 1 completed",
              stepId: "step_1",
            },
            {
              timestamp: "2024-02-10T10:30:00Z",
              level: "info",
              message: "Step 2 started - Legal review assigned",
              stepId: "step_2",
            },
          ],
        },
      ]

      setInstances(mockInstances)
    } catch (error) {
      console.error("Error loading workflows:", error)
      toast({
        title: "Error",
        description: "Failed to load workflows",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStepIcon = (type: string) => {
    switch (type) {
      case "approval":
        return <CheckCircle className="h-4 w-4" />
      case "review":
        return <Eye className="h-4 w-4" />
      case "signature":
        return <FileText className="h-4 w-4" />
      case "automation":
        return <Zap className="h-4 w-4" />
      case "notification":
        return <Activity className="h-4 w-4" />
      case "condition":
        return <Target className="h-4 w-4" />
      default:
        return <Workflow className="h-4 w-4" />
    }
  }

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "active":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "failed":
        return "bg-red-100 text-red-800 border-red-200"
      case "skipped":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-500 text-white"
      case "high":
        return "bg-orange-500 text-white"
      case "medium":
        return "bg-yellow-500 text-white"
      case "low":
        return "bg-green-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const getInstanceStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "bg-blue-500 text-white"
      case "completed":
        return "bg-green-500 text-white"
      case "failed":
        return "bg-red-500 text-white"
      case "paused":
        return "bg-yellow-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <RefreshCw className="mx-auto mb-4 h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Loading workflow engine...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Workflow className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Advanced Workflow Engine</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Workflow
          </Button>
        </div>
      </div>

      {/* Workflow Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
            <Workflow className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workflows.filter((w) => w.status === "active").length}
            </div>
            <p className="text-xs text-muted-foreground">{workflows.length} total workflows</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running Instances</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {instances.filter((i) => i.status === "running").length}
            </div>
            <p className="text-xs text-muted-foreground">{instances.length} total instances</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.2%</div>
            <p className="text-xs text-muted-foreground">Average across all workflows</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Completion</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.8h</div>
            <p className="text-xs text-muted-foreground">Average processing time</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="workflows" className="space-y-4">
        <TabsList>
          <TabsTrigger value="workflows">Workflow Definitions</TabsTrigger>
          <TabsTrigger value="instances">Active Instances</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-4">
          <div className="space-y-4">
            {workflows.map((workflow) => (
              <Card
                key={workflow.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => setSelectedWorkflow(workflow)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Workflow className="h-5 w-5" />
                        {workflow.name}
                      </CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">{workflow.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={workflow.status === "active" ? "default" : "secondary"}>
                        {workflow.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">v{workflow.version}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div>
                      <div className="text-sm font-medium">Steps</div>
                      <div className="text-2xl font-bold">{workflow.steps.length}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Success Rate</div>
                      <div className="text-2xl font-bold">{workflow.metrics.successRate}%</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Avg Time</div>
                      <div className="text-2xl font-bold">
                        {workflow.metrics.averageCompletionTime}h
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Executions</div>
                      <div className="text-2xl font-bold">{workflow.metrics.totalExecutions}</div>
                    </div>
                  </div>

                  {/* Workflow Steps Preview */}
                  <div className="mt-4">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-sm font-medium">Steps:</span>
                      <div className="flex gap-1">
                        {workflow.steps.slice(0, 3).map((step, index) => (
                          <div key={step.id} className="flex items-center gap-1">
                            {getStepIcon(step.type)}
                            <span className="text-xs">{step.name}</span>
                            {index < workflow.steps.slice(0, 3).length - 1 && (
                              <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                        ))}
                        {workflow.steps.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{workflow.steps.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="instances" className="space-y-4">
          <div className="space-y-4">
            {instances.map((instance) => (
              <Card
                key={instance.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => setSelectedInstance(instance)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Instance {instance.id}
                      </CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Contract: {instance.contractId}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getInstanceStatusColor(instance.status)}>
                        {instance.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(instance.startedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium">Progress</span>
                        <span className="text-sm text-muted-foreground">{instance.progress}%</span>
                      </div>
                      <Progress value={instance.progress} className="h-2" />
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <div className="text-sm font-medium">Current Step</div>
                        <div className="text-lg font-bold">{instance.currentStep}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Started</div>
                        <div className="text-sm">
                          {new Date(instance.startedAt).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Variables</div>
                        <div className="text-sm">{Object.keys(instance.variables).length} set</div>
                      </div>
                    </div>

                    {/* Recent Logs */}
                    <div>
                      <div className="mb-2 text-sm font-medium">Recent Activity</div>
                      <div className="space-y-1">
                        {instance.logs.slice(-3).map((log, index) => (
                          <div key={index} className="flex items-center gap-2 text-xs">
                            <div
                              className={`h-2 w-2 rounded-full ${
                                log.level === "error"
                                  ? "bg-red-500"
                                  : log.level === "warning"
                                    ? "bg-yellow-500"
                                    : "bg-green-500"
                              }`}
                            />
                            <span className="text-muted-foreground">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                            <span>{log.message}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Workflow Engine</span>
                    <Badge className="border-green-200 bg-green-100 text-green-800">Healthy</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Database</span>
                    <Badge className="border-green-200 bg-green-100 text-green-800">
                      Connected
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Notifications</span>
                    <Badge className="border-green-200 bg-green-100 text-green-800">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">API Services</span>
                    <Badge className="border-green-200 bg-green-100 text-green-800">
                      Operational
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm">CPU Usage</span>
                      <span className="text-sm">45%</span>
                    </div>
                    <Progress value={45} className="h-2" />
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm">Memory Usage</span>
                      <span className="text-sm">62%</span>
                    </div>
                    <Progress value={62} className="h-2" />
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm">Active Connections</span>
                      <span className="text-sm">127</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Workflow Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workflows.map((workflow) => (
                    <div key={workflow.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{workflow.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {workflow.metrics.successRate}% success
                        </span>
                      </div>
                      <Progress value={workflow.metrics.successRate} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Execution Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Today</span>
                    <span className="text-sm font-medium">24 executions</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">This Week</span>
                    <span className="text-sm font-medium">156 executions</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">This Month</span>
                    <span className="text-sm font-medium">1,247 executions</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Average Daily</span>
                    <span className="text-sm font-medium">41.6 executions</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Workflow Detail Modal */}
      {selectedWorkflow && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{selectedWorkflow.name} - Workflow Details</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setSelectedWorkflow(null)}>
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="mb-2 font-medium">Workflow Steps</h4>
                  <div className="space-y-2">
                    {selectedWorkflow.steps.map((step, index) => (
                      <div key={step.id} className="flex items-center gap-2 rounded border p-2">
                        <div className="flex items-center gap-2">
                          {getStepIcon(step.type)}
                          <span className="text-sm font-medium">{step.name}</span>
                        </div>
                        <Badge className={getStepStatusColor(step.status)}>{step.status}</Badge>
                        <Badge className={getPriorityColor(step.priority)}>{step.priority}</Badge>
                        <span className="text-xs text-muted-foreground">{step.estimatedTime}m</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="mb-2 font-medium">Business Rules</h4>
                  <div className="space-y-2">
                    {selectedWorkflow.rules.map((rule, index) => (
                      <div key={index} className="rounded border p-2">
                        <div className="text-sm font-medium">{rule.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {rule.condition} → {rule.action}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
