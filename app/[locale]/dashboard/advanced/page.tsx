import { Suspense } from 'react';
import { AdvancedAnalyticsDashboard } from '@/components/dashboard/advanced-analytics-dashboard';
import { ContractIntelligence } from '@/components/ai/contract-intelligence';
import { AdvancedWorkflowEngine } from '@/components/workflow/advanced-workflow-engine';
import { RealTimeCollaborationHub } from '@/components/collaboration/real-time-collaboration-hub';
import { AdvancedSecurityCenter } from '@/components/security/advanced-security-center';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  Brain,
  Workflow,
  MessageSquare,
  Shield,
  Zap,
  TrendingUp,
  Target,
  Activity,
  Users,
  FileText,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

export default function AdvancedDashboardPage() {
  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
            Advanced Dashboard
          </h1>
          <p className='text-muted-foreground'>
            Professional-grade contract management with AI, analytics, and
            collaboration
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <div className='flex items-center gap-1 text-sm text-muted-foreground'>
            <Activity className='h-4 w-4' />
            <span>Real-time updates</span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Contracts
            </CardTitle>
            <FileText className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>1,247</div>
            <p className='text-xs text-muted-foreground'>
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Active Workflows
            </CardTitle>
            <Workflow className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>18</div>
            <p className='text-xs text-muted-foreground'>3 pending approvals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>AI Insights</CardTitle>
            <Brain className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>156</div>
            <p className='text-xs text-muted-foreground'>
              23 new recommendations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Security Score
            </CardTitle>
            <Shield className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>94%</div>
            <p className='text-xs text-muted-foreground'>+2% improvement</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Tabs defaultValue='analytics' className='space-y-4'>
        <TabsList className='grid w-full grid-cols-5'>
          <TabsTrigger value='analytics' className='flex items-center gap-2'>
            <BarChart3 className='h-4 w-4' />
            Analytics
          </TabsTrigger>
          <TabsTrigger value='ai' className='flex items-center gap-2'>
            <Brain className='h-4 w-4' />
            AI Intelligence
          </TabsTrigger>
          <TabsTrigger value='workflow' className='flex items-center gap-2'>
            <Workflow className='h-4 w-4' />
            Workflows
          </TabsTrigger>
          <TabsTrigger
            value='collaboration'
            className='flex items-center gap-2'
          >
            <MessageSquare className='h-4 w-4' />
            Collaboration
          </TabsTrigger>
          <TabsTrigger value='security' className='flex items-center gap-2'>
            <Shield className='h-4 w-4' />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value='analytics' className='space-y-4'>
          <Suspense
            fallback={
              <Card>
                <CardContent className='p-6'>
                  <div className='flex items-center justify-center'>
                    <div className='text-center'>
                      <BarChart3 className='mx-auto mb-4 h-8 w-8 animate-pulse' />
                      <p className='text-muted-foreground'>
                        Loading advanced analytics...
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            }
          >
            <AdvancedAnalyticsDashboard />
          </Suspense>
        </TabsContent>

        <TabsContent value='ai' className='space-y-4'>
          <Suspense
            fallback={
              <Card>
                <CardContent className='p-6'>
                  <div className='flex items-center justify-center'>
                    <div className='text-center'>
                      <Brain className='mx-auto mb-4 h-8 w-8 animate-pulse' />
                      <p className='text-muted-foreground'>
                        Loading AI intelligence...
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            }
          >
            <ContractIntelligence contractId='sample-contract-123' />
          </Suspense>
        </TabsContent>

        <TabsContent value='workflow' className='space-y-4'>
          <Suspense
            fallback={
              <Card>
                <CardContent className='p-6'>
                  <div className='flex items-center justify-center'>
                    <div className='text-center'>
                      <Workflow className='mx-auto mb-4 h-8 w-8 animate-pulse' />
                      <p className='text-muted-foreground'>
                        Loading workflow engine...
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            }
          >
            <AdvancedWorkflowEngine />
          </Suspense>
        </TabsContent>

        <TabsContent value='collaboration' className='space-y-4'>
          <Suspense
            fallback={
              <Card>
                <CardContent className='p-6'>
                  <div className='flex items-center justify-center'>
                    <div className='text-center'>
                      <MessageSquare className='mx-auto mb-4 h-8 w-8 animate-pulse' />
                      <p className='text-muted-foreground'>
                        Loading collaboration hub...
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            }
          >
            <RealTimeCollaborationHub contractId='sample-contract-123' />
          </Suspense>
        </TabsContent>

        <TabsContent value='security' className='space-y-4'>
          <Suspense
            fallback={
              <Card>
                <CardContent className='p-6'>
                  <div className='flex items-center justify-center'>
                    <div className='text-center'>
                      <Shield className='mx-auto mb-4 h-8 w-8 animate-pulse' />
                      <p className='text-muted-foreground'>
                        Loading security center...
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            }
          >
            <AdvancedSecurityCenter />
          </Suspense>
        </TabsContent>
      </Tabs>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Zap className='h-5 w-5 text-green-500' />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid gap-4 md:grid-cols-4'>
            <div className='flex items-center gap-2'>
              <CheckCircle className='h-4 w-4 text-green-500' />
              <span className='text-sm'>Analytics Engine</span>
            </div>
            <div className='flex items-center gap-2'>
              <CheckCircle className='h-4 w-4 text-green-500' />
              <span className='text-sm'>AI Services</span>
            </div>
            <div className='flex items-center gap-2'>
              <CheckCircle className='h-4 w-4 text-green-500' />
              <span className='text-sm'>Workflow Engine</span>
            </div>
            <div className='flex items-center gap-2'>
              <CheckCircle className='h-4 w-4 text-green-500' />
              <span className='text-sm'>Security Center</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
