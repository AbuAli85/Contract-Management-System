'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Lock,
  Eye,
  EyeOff,
  Key,
  Fingerprint,
  Activity,
  AlertCircle,
  Settings,
  Download,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  FileText,
  Database,
  Network,
  Server,
  Globe,
  Zap,
  Target,
  BarChart3,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  UserCheck,
  FileCheck,
  DatabaseCheck,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SecurityEvent {
  id: string;
  type:
    | 'login'
    | 'logout'
    | 'access_denied'
    | 'suspicious_activity'
    | 'data_access'
    | 'file_download'
    | 'permission_change';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: string;
  user: string;
  ipAddress: string;
  location: string;
  userAgent: string;
  resolved: boolean;
  actionTaken?: string;
}

interface ComplianceReport {
  id: string;
  framework: 'GDPR' | 'SOX' | 'HIPAA' | 'ISO27001' | 'SOC2';
  status: 'compliant' | 'non_compliant' | 'partial' | 'pending';
  score: number;
  lastAudit: string;
  nextAudit: string;
  requirements: Array<{
    id: string;
    name: string;
    status: 'met' | 'not_met' | 'partial';
    description: string;
    evidence: string[];
  }>;
}

interface SecurityMetrics {
  totalEvents: number;
  criticalEvents: number;
  resolvedEvents: number;
  activeThreats: number;
  complianceScore: number;
  dataBreachRisk: number;
  systemVulnerabilities: number;
  userAccessScore: number;
}

interface ThreatIntelligence {
  id: string;
  type: 'malware' | 'phishing' | 'ddos' | 'insider_threat' | 'data_leak';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  source: string;
  timestamp: string;
  status: 'active' | 'resolved' | 'investigating';
  affectedSystems: string[];
  mitigationSteps: string[];
}

export function AdvancedSecurityCenter() {
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [complianceReports, setComplianceReports] = useState<
    ComplianceReport[]
  >([]);
  const [threats, setThreats] = useState<ThreatIntelligence[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<
    '24h' | '7d' | '30d' | '90d'
  >('24h');
  const { toast } = useToast();

  // Helper functions for event classification
  const determineEventType = (action: string): string => {
    if (
      action?.toLowerCase().includes('login') ||
      action?.toLowerCase().includes('auth')
    ) {
      return 'authentication';
    }
    if (
      action?.toLowerCase().includes('permission') ||
      action?.toLowerCase().includes('role')
    ) {
      return 'permission_change';
    }
    if (
      action?.toLowerCase().includes('access') ||
      action?.toLowerCase().includes('view')
    ) {
      return 'data_access';
    }
    if (
      action?.toLowerCase().includes('webhook') ||
      action?.toLowerCase().includes('api')
    ) {
      return 'api_activity';
    }
    return 'system_activity';
  };

  const determineSeverity = (
    action: string,
    success: boolean
  ): 'low' | 'medium' | 'high' => {
    if (!success) {
      if (
        action?.toLowerCase().includes('login') ||
        action?.toLowerCase().includes('auth')
      ) {
        return 'high';
      }
      return 'medium';
    }
    if (
      action?.toLowerCase().includes('permission') ||
      action?.toLowerCase().includes('role')
    ) {
      return 'medium';
    }
    return 'low';
  };

  useEffect(() => {
    loadSecurityData();
  }, [selectedTimeframe]);

  const loadSecurityData = async () => {
    setLoading(true);
    try {
      // Fetch real security events from webhook logs and auth logs
      const response = await fetch(
        `/api/audit-logs?timeframe=${selectedTimeframe}`
      );

      if (response.ok) {
        const auditData = await response.json();

        // Transform audit logs to security events
        const realEvents: SecurityEvent[] =
          auditData.logs?.map((log: any) => ({
            id:
              log.id ||
              `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: determineEventType(log.action),
            severity: determineSeverity(log.action, log.success),
            description:
              log.description ||
              `${log.action} ${log.success ? 'completed' : 'failed'}`,
            timestamp: log.timestamp || log.created_at,
            user: log.user_email || log.details?.user || 'System',
            ipAddress: log.ip || log.details?.ip || 'Unknown',
            location: log.details?.location || 'Unknown',
            userAgent: log.details?.userAgent || log.user_agent || 'Unknown',
            resolved: log.success !== false,
            actionTaken: log.success ? 'Automatically resolved' : undefined,
          })) || [];

        setSecurityEvents(realEvents);
      } else {
        // Fallback to basic security events from webhook logs
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();

        const { data: webhookLogs } = await supabase
          .from('webhook_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        const webhookEvents: SecurityEvent[] = (webhookLogs || []).map(
          (log: any) => ({
            id: log.id,
            type: log.error ? 'webhook_failure' : 'webhook_success',
            severity: log.error ? 'medium' : 'low',
            description: log.error
              ? `Webhook failed: ${log.error}`
              : `Webhook ${log.type} executed successfully`,
            timestamp: log.created_at,
            user: 'System',
            ipAddress: 'Internal',
            location: 'Server',
            userAgent: 'Webhook System',
            resolved: !log.error,
            actionTaken: log.error
              ? `Retry attempted ${log.attempts} times`
              : 'Completed successfully',
          })
        );

        setSecurityEvents(webhookEvents);
      }

      // Mock compliance reports
      const mockReports: ComplianceReport[] = [
        {
          id: 'comp_001',
          framework: 'GDPR',
          status: 'compliant',
          score: 95,
          lastAudit: '2024-01-15',
          nextAudit: '2024-07-15',
          requirements: [
            {
              id: 'req_001',
              name: 'Data Protection Impact Assessment',
              status: 'met',
              description: 'DPIA completed for all data processing activities',
              evidence: ['DPIA Report 2024', 'Risk Assessment'],
            },
            {
              id: 'req_002',
              name: 'Data Subject Rights',
              status: 'met',
              description: 'Processes in place for data subject requests',
              evidence: ['Request Form', 'Response Procedures'],
            },
          ],
        },
        {
          id: 'comp_002',
          framework: 'SOC2',
          status: 'partial',
          score: 78,
          lastAudit: '2024-01-01',
          nextAudit: '2024-04-01',
          requirements: [
            {
              id: 'req_003',
              name: 'Access Controls',
              status: 'met',
              description: 'Multi-factor authentication implemented',
              evidence: ['MFA Configuration', 'Access Logs'],
            },
            {
              id: 'req_004',
              name: 'Data Encryption',
              status: 'partial',
              description: 'Encryption at rest needs improvement',
              evidence: ['Current Encryption Status'],
            },
          ],
        },
      ];

      setComplianceReports(mockReports);

      // Mock threat intelligence
      const mockThreats: ThreatIntelligence[] = [
        {
          id: 'threat_001',
          type: 'phishing',
          severity: 'medium',
          description: 'Phishing campaign targeting company employees',
          source: 'Security Feed',
          timestamp: new Date().toISOString(),
          status: 'investigating',
          affectedSystems: ['Email System', 'User Accounts'],
          mitigationSteps: [
            'Enhanced email filtering',
            'User awareness training',
            'Multi-factor authentication enforcement',
          ],
        },
        {
          id: 'threat_002',
          type: 'data_leak',
          severity: 'high',
          description: 'Potential data exposure in contract files',
          source: 'Internal Monitoring',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
          status: 'resolved',
          affectedSystems: ['Contract Database'],
          mitigationSteps: [
            'Access logs reviewed',
            'Permissions tightened',
            'Data encrypted',
          ],
        },
      ];

      setThreats(mockThreats);

      // Calculate real metrics from security events
      const currentEvents = securityEvents;
      const realMetrics: SecurityMetrics = {
        totalEvents: currentEvents.length,
        criticalEvents: currentEvents.filter(e => e.severity === 'high').length,
        resolvedEvents: currentEvents.filter(e => e.resolved).length,
        activeThreats: currentEvents.filter(
          e => !e.resolved && e.severity === 'high'
        ).length,
        complianceScore:
          currentEvents.length > 0
            ? Math.round(
                (currentEvents.filter(e => e.resolved).length /
                  currentEvents.length) *
                  100
              )
            : 100,
        dataBreachRisk: Math.min(
          currentEvents.filter(e => e.type === 'data_access' && !e.resolved)
            .length * 10,
          100
        ),
        systemVulnerabilities: currentEvents.filter(
          e => e.type === 'system_activity' && !e.resolved
        ).length,
        userAccessScore:
          currentEvents.length > 0
            ? Math.round(
                100 -
                  (currentEvents.filter(
                    e => e.type === 'authentication' && !e.resolved
                  ).length /
                    currentEvents.length) *
                    50
              )
            : 100,
      };

      setMetrics(realMetrics);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load security data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'bg-green-500 text-white';
      case 'non_compliant':
        return 'bg-red-500 text-white';
      case 'partial':
        return 'bg-yellow-500 text-white';
      case 'pending':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getThreatTypeIcon = (type: string) => {
    switch (type) {
      case 'malware':
        return <AlertTriangle className='h-4 w-4' />;
      case 'phishing':
        return <Globe className='h-4 w-4' />;
      case 'ddos':
        return <Network className='h-4 w-4' />;
      case 'insider_threat':
        return <Users className='h-4 w-4' />;
      case 'data_leak':
        return <Database className='h-4 w-4' />;
      default:
        return <AlertCircle className='h-4 w-4' />;
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='text-center'>
          <Shield className='mx-auto mb-4 h-8 w-8 animate-pulse' />
          <p className='text-muted-foreground'>Loading security center...</p>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Shield className='h-6 w-6 text-blue-600' />
          <h2 className='text-2xl font-bold'>Advanced Security Center</h2>
        </div>
        <div className='flex items-center gap-2'>
          <Button variant='outline' size='sm'>
            <Settings className='mr-2 h-4 w-4' />
            Settings
          </Button>
          <Button size='sm'>
            <RefreshCw className='mr-2 h-4 w-4' />
            Refresh
          </Button>
        </div>
      </div>

      {/* Security Metrics */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Security Score
            </CardTitle>
            <ShieldCheck className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {metrics.complianceScore}/100
            </div>
            <Progress value={metrics.complianceScore} className='mt-2' />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Active Threats
            </CardTitle>
            <AlertTriangle className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{metrics.activeThreats}</div>
            <p className='text-xs text-muted-foreground'>
              {metrics.criticalEvents} critical events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Data Breach Risk
            </CardTitle>
            <Database className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{metrics.dataBreachRisk}%</div>
            <p className='text-xs text-muted-foreground'>
              {metrics.systemVulnerabilities} vulnerabilities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Access Control
            </CardTitle>
            <UserCheck className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {metrics.userAccessScore}/100
            </div>
            <Progress value={metrics.userAccessScore} className='mt-2' />
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue='overview' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          <TabsTrigger value='events'>Security Events</TabsTrigger>
          <TabsTrigger value='compliance'>Compliance</TabsTrigger>
          <TabsTrigger value='threats'>Threat Intelligence</TabsTrigger>
          <TabsTrigger value='monitoring'>Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-2'>
            {/* Security Events Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Security Events Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width='100%' height={300}>
                  <LineChart
                    data={[
                      { day: 'Mon', events: 12, threats: 2 },
                      { day: 'Tue', events: 8, threats: 1 },
                      { day: 'Wed', events: 15, threats: 3 },
                      { day: 'Thu', events: 10, threats: 1 },
                      { day: 'Fri', events: 18, threats: 4 },
                      { day: 'Sat', events: 5, threats: 0 },
                      { day: 'Sun', events: 3, threats: 0 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='day' />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type='monotone'
                      dataKey='events'
                      stroke='#8884d8'
                      strokeWidth={2}
                    />
                    <Line
                      type='monotone'
                      dataKey='threats'
                      stroke='#ff7300'
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Compliance Status */}
            <Card>
              <CardHeader>
                <CardTitle>Compliance Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {complianceReports.map(report => (
                    <div
                      key={report.id}
                      className='flex items-center justify-between rounded border p-3'
                    >
                      <div className='flex items-center gap-3'>
                        <div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-100'>
                          <FileCheck className='h-5 w-5 text-blue-600' />
                        </div>
                        <div>
                          <div className='font-medium'>{report.framework}</div>
                          <div className='text-sm text-muted-foreground'>
                            Score: {report.score}%
                          </div>
                        </div>
                      </div>
                      <Badge className={getStatusColor(report.status)}>
                        {report.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value='events' className='space-y-4'>
          <div className='space-y-4'>
            {securityEvents.map(event => (
              <Card key={event.id}>
                <CardContent className='p-4'>
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <div className='mb-2 flex items-center gap-2'>
                        <h4 className='font-semibold'>{event.description}</h4>
                        <Badge className={getSeverityColor(event.severity)}>
                          {event.severity}
                        </Badge>
                        {event.resolved && (
                          <Badge className='border-green-200 bg-green-100 text-green-800'>
                            Resolved
                          </Badge>
                        )}
                      </div>
                      <div className='grid gap-2 text-sm text-muted-foreground md:grid-cols-3'>
                        <div>User: {event.user}</div>
                        <div>IP: {event.ipAddress}</div>
                        <div>Location: {event.location}</div>
                      </div>
                      <div className='mt-2 text-xs text-muted-foreground'>
                        {new Date(event.timestamp).toLocaleString()}
                      </div>
                      {event.actionTaken && (
                        <div className='mt-2 rounded bg-blue-50 p-2 text-sm'>
                          Action: {event.actionTaken}
                        </div>
                      )}
                    </div>
                    <div className='flex gap-2'>
                      <Button variant='outline' size='sm'>
                        <Eye className='h-4 w-4' />
                      </Button>
                      {!event.resolved && (
                        <Button variant='outline' size='sm'>
                          <CheckCircle className='h-4 w-4' />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value='compliance' className='space-y-4'>
          <div className='space-y-4'>
            {complianceReports.map(report => (
              <Card key={report.id}>
                <CardHeader>
                  <div className='flex items-center justify-between'>
                    <CardTitle>{report.framework} Compliance</CardTitle>
                    <Badge className={getStatusColor(report.status)}>
                      {report.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <span>Compliance Score</span>
                      <div className='flex items-center gap-2'>
                        <Progress value={report.score} className='w-20' />
                        <span className='font-medium'>{report.score}%</span>
                      </div>
                    </div>

                    <div className='grid gap-4 md:grid-cols-2'>
                      <div>
                        <div className='mb-2 text-sm font-medium'>
                          Requirements
                        </div>
                        <div className='space-y-2'>
                          {report.requirements.map(req => (
                            <div
                              key={req.id}
                              className='flex items-center gap-2'
                            >
                              <CheckCircle
                                className={`h-4 w-4 ${
                                  req.status === 'met'
                                    ? 'text-green-500'
                                    : req.status === 'partial'
                                      ? 'text-yellow-500'
                                      : 'text-red-500'
                                }`}
                              />
                              <span className='text-sm'>{req.name}</span>
                              <Badge variant='outline' className='text-xs'>
                                {req.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className='mb-2 text-sm font-medium'>
                          Audit Schedule
                        </div>
                        <div className='space-y-2 text-sm'>
                          <div className='flex justify-between'>
                            <span>Last Audit:</span>
                            <span>{report.lastAudit}</span>
                          </div>
                          <div className='flex justify-between'>
                            <span>Next Audit:</span>
                            <span>{report.nextAudit}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value='threats' className='space-y-4'>
          <div className='space-y-4'>
            {threats.map(threat => (
              <Card key={threat.id}>
                <CardContent className='p-4'>
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <div className='mb-2 flex items-center gap-2'>
                        {getThreatTypeIcon(threat.type)}
                        <h4 className='font-semibold'>{threat.description}</h4>
                        <Badge className={getSeverityColor(threat.severity)}>
                          {threat.severity}
                        </Badge>
                        <Badge variant='outline'>{threat.status}</Badge>
                      </div>

                      <div className='grid gap-2 text-sm text-muted-foreground md:grid-cols-2'>
                        <div>Source: {threat.source}</div>
                        <div>Type: {threat.type.replace('_', ' ')}</div>
                      </div>

                      <div className='mt-3'>
                        <div className='mb-1 text-sm font-medium'>
                          Affected Systems:
                        </div>
                        <div className='flex gap-1'>
                          {threat.affectedSystems.map((system, index) => (
                            <Badge
                              key={index}
                              variant='outline'
                              className='text-xs'
                            >
                              {system}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className='mt-3'>
                        <div className='mb-1 text-sm font-medium'>
                          Mitigation Steps:
                        </div>
                        <ul className='space-y-1 text-sm'>
                          {threat.mitigationSteps.map((step, index) => (
                            <li key={index} className='flex items-center gap-2'>
                              <CheckCircle className='h-3 w-3 text-green-500' />
                              {step}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className='mt-2 text-xs text-muted-foreground'>
                        Detected: {new Date(threat.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value='monitoring' className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-2'>
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm'>Firewall</span>
                    <Badge className='border-green-200 bg-green-100 text-green-800'>
                      Active
                    </Badge>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm'>Intrusion Detection</span>
                    <Badge className='border-green-200 bg-green-100 text-green-800'>
                      Monitoring
                    </Badge>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm'>Data Encryption</span>
                    <Badge className='border-green-200 bg-green-100 text-green-800'>
                      Enabled
                    </Badge>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm'>Backup System</span>
                    <Badge className='border-green-200 bg-green-100 text-green-800'>
                      Operational
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Access Monitoring</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div>
                    <div className='mb-2 flex items-center justify-between'>
                      <span className='text-sm'>Failed Logins</span>
                      <span className='text-sm'>12 (24h)</span>
                    </div>
                    <Progress value={12} className='h-2' />
                  </div>
                  <div>
                    <div className='mb-2 flex items-center justify-between'>
                      <span className='text-sm'>Suspicious Activity</span>
                      <span className='text-sm'>3 (24h)</span>
                    </div>
                    <Progress value={3} className='h-2' />
                  </div>
                  <div>
                    <div className='mb-2 flex items-center justify-between'>
                      <span className='text-sm'>Data Access</span>
                      <span className='text-sm'>156 (24h)</span>
                    </div>
                    <Progress value={85} className='h-2' />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
