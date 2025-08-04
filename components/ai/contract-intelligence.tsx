"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Brain,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Lightbulb,
  Shield,
  Target,
  FileText,
  Sparkles,
  Zap,
  Eye,
  Download,
  Copy,
  Send,
  Loader2,
  Search,
  UserPlus,
  Menu,
  Plus,
  X,
  ChevronDown,
  Settings,
  Edit,
  Trash2,
  Save,
  Upload,
  Share,
  Filter,
  CheckCircle,
  AlertTriangle,
  Info,
  Users,
  Calendar,
  Clock,
  Globe,
  Star,
  Award,
  TrendingUp,
  EyeOff,
  Bell,
  Mail,
  Phone,
  MapPin,
  Building,
} from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface ContractAnalysis {
  id: string
  contractId: string
  riskScore: number
  complianceScore: number
  efficiencyScore: number
  recommendations: Array<{
    type: "risk" | "compliance" | "efficiency" | "opportunity"
    priority: "low" | "medium" | "high" | "critical"
    title: string
    description: string
    impact: number
    suggestedAction: string
  }>
  aiInsights: Array<{
    category: string
    insight: string
    confidence: number
    actionable: boolean
  }>
  marketComparison: {
    averageValue: number
    marketPosition: "below" | "average" | "above"
    competitiveAdvantage: string[]
    improvementAreas: string[]
  }
  predictedOutcome: {
    successProbability: number
    estimatedValue: number
    timeline: string
    keyFactors: string[]
  }
}

interface ContractIntelligenceProps {
  contractId?: string
  contractData?: any
}

export function ContractIntelligence({ contractId, contractData }: ContractIntelligenceProps) {
  const [analysis, setAnalysis] = useState<ContractAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [userQuery, setUserQuery] = useState("")
  const [aiResponse, setAiResponse] = useState("")
  const [processingQuery, setProcessingQuery] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (contractId) {
      analyzeContract(contractId)
    }
  }, [contractId])

  const analyzeContract = async (id: string) => {
    setLoading(true)
    try {
      // Simulate AI analysis - in production, this would call an AI service
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const mockAnalysis: ContractAnalysis = {
        id: "analysis_" + id,
        contractId: id,
        riskScore: 75,
        complianceScore: 88,
        efficiencyScore: 82,
        recommendations: [
          {
            type: "risk",
            priority: "high",
            title: "Payment Terms Risk",
            description:
              "Payment terms are longer than industry average, increasing cash flow risk",
            impact: 15,
            suggestedAction: "Negotiate shorter payment terms or add late payment penalties",
          },
          {
            type: "compliance",
            priority: "medium",
            title: "Regulatory Compliance",
            description: "Contract includes all required regulatory clauses",
            impact: 8,
            suggestedAction: "Monitor for regulatory changes and update accordingly",
          },
          {
            type: "efficiency",
            priority: "low",
            title: "Process Optimization",
            description: "Contract processing time can be reduced by 20%",
            impact: 12,
            suggestedAction: "Implement automated approval workflows",
          },
        ],
        aiInsights: [
          {
            category: "Market Analysis",
            insight: "Contract value is 15% above market average for similar services",
            confidence: 0.92,
            actionable: true,
          },
          {
            category: "Risk Assessment",
            insight: "Low risk profile with strong counterparty credit rating",
            confidence: 0.87,
            actionable: false,
          },
          {
            category: "Opportunity",
            insight: "Potential for 25% value increase through performance incentives",
            confidence: 0.78,
            actionable: true,
          },
        ],
        marketComparison: {
          averageValue: 45000,
          marketPosition: "above",
          competitiveAdvantage: [
            "Favorable payment terms",
            "Strong performance metrics",
            "Clear dispute resolution",
          ],
          improvementAreas: [
            "Add performance bonuses",
            "Include innovation clauses",
            "Enhance termination protection",
          ],
        },
        predictedOutcome: {
          successProbability: 0.85,
          estimatedValue: 52000,
          timeline: "12 months",
          keyFactors: [
            "Strong counterparty relationship",
            "Clear performance metrics",
            "Favorable market conditions",
          ],
        },
      }

      setAnalysis(mockAnalysis)
    } catch (error) {
      console.error("Error analyzing contract:", error)
      toast({
        title: "Analysis Error",
        description: "Failed to analyze contract",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAiQuery = async () => {
    if (!userQuery.trim()) return

    setProcessingQuery(true)
    try {
      // Simulate AI response - in production, this would call an AI service
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const responses = [
        "Based on the contract analysis, I recommend focusing on the payment terms optimization to reduce cash flow risk by 15%.",
        "The contract shows strong compliance with current regulations, but consider adding future-proofing clauses for regulatory changes.",
        "Market analysis indicates this contract is 15% above average value, suggesting strong negotiation position.",
        "Performance incentives could increase contract value by 25% while maintaining risk profile.",
      ]

      setAiResponse(responses[Math.floor(Math.random() * responses.length)])
    } catch (error) {
      toast({
        title: "Query Error",
        description: "Failed to process AI query",
        variant: "destructive",
      })
    } finally {
      setProcessingQuery(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Analyzing contract with AI...</p>
        </div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Brain className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">AI Contract Intelligence</h3>
          <p className="mb-4 text-muted-foreground">
            Select a contract to analyze with AI-powered insights
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold">AI Contract Intelligence</h2>
        </div>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export Analysis
        </Button>
      </div>

      {/* AI Chat Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Assistant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Textarea
                placeholder="Ask AI about this contract..."
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleAiQuery} disabled={processingQuery || !userQuery.trim()}>
                {processingQuery ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            {aiResponse && (
              <div className="rounded-lg border bg-blue-50 p-4">
                <div className="flex items-start gap-2">
                  <Brain className="mt-1 h-4 w-4 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm">{aiResponse}</p>
                    <Button variant="ghost" size="sm" className="mt-2">
                      <Copy className="mr-1 h-3 w-3" />
                      Copy
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Analysis Dashboard */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="market">Market Analysis</TabsTrigger>
          <TabsTrigger value="prediction">Predictions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={"text-2xl font-bold " + getScoreColor(analysis.riskScore)}>
                  {analysis.riskScore}/100
                </div>
                <p className="text-xs text-muted-foreground">
                  {analysis.riskScore >= 80
                    ? "Low Risk"
                    : analysis.riskScore >= 60
                      ? "Medium Risk"
                      : "High Risk"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={"text-2xl font-bold " + getScoreColor(analysis.complianceScore)}>
                  {analysis.complianceScore}/100
                </div>
                <p className="text-xs text-muted-foreground">Regulatory compliance level</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Efficiency Score</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={"text-2xl font-bold " + getScoreColor(analysis.efficiencyScore)}>
                  {analysis.efficiencyScore}/100
                </div>
                <p className="text-xs text-muted-foreground">Process optimization potential</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <div className="space-y-4">
            {analysis.recommendations.map((rec, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <h4 className="font-semibold">{rec.title}</h4>
                        <Badge className={getPriorityColor(rec.priority)}>{rec.priority}</Badge>
                      </div>
                      <p className="mb-3 text-sm text-muted-foreground">{rec.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Impact: {rec.impact}%</span>
                        <Button variant="outline" size="sm">
                          <Lightbulb className="mr-1 h-3 w-3" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 rounded-lg bg-blue-50 p-3">
                    <p className="text-sm font-medium text-blue-800">
                      Suggested Action: {rec.suggestedAction}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {analysis.aiInsights.map((insight, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    {insight.category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-3 text-sm">{insight.insight}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        Confidence: {Math.round(insight.confidence * 100)}%
                      </span>
                      {insight.actionable && (
                        <Badge variant="outline" className="text-xs">
                          Actionable
                        </Badge>
                      )}
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="market" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Market Position</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Market Position:</span>
                    <Badge
                      variant={
                        analysis.marketComparison.marketPosition === "above"
                          ? "default"
                          : analysis.marketComparison.marketPosition === "average"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {analysis.marketComparison.marketPosition.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Average Value:</span>
                    <span className="font-medium">
                      ${analysis.marketComparison.averageValue.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Competitive Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="mb-2 text-sm font-medium">Advantages</h4>
                    <ul className="space-y-1">
                      {analysis.marketComparison.competitiveAdvantage.map((adv, index) => (
                        <li key={index} className="flex items-center gap-1 text-sm text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          {adv}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="mb-2 text-sm font-medium">Improvement Areas</h4>
                    <ul className="space-y-1">
                      {analysis.marketComparison.improvementAreas.map((area, index) => (
                        <li key={index} className="flex items-center gap-1 text-sm text-orange-600">
                          <AlertTriangle className="h-3 w-3" />
                          {area}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="prediction" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Success Prediction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {Math.round(analysis.predictedOutcome.successProbability * 100)}%
                    </div>
                    <p className="text-sm text-muted-foreground">Success Probability</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Estimated Value:</span>
                      <span className="font-medium">
                        ${analysis.predictedOutcome.estimatedValue.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Timeline:</span>
                      <span className="font-medium">{analysis.predictedOutcome.timeline}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Success Factors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysis.predictedOutcome.keyFactors.map((factor, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      {factor}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ContractIntelligence
