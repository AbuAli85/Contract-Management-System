'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Code,
  Play,
  CheckCircle,
  AlertCircle,
  Building2,
  Database,
  GitMerge,
  Mail,
  Link,
} from 'lucide-react';
import { CompanyUpsertForm } from './company-upsert-form';
import { useCompanies } from '@/hooks/use-company';
import { CompanyResponse } from '@/lib/company-service';
import { toast } from 'sonner';

interface CompanyUpsertDemoProps {
  className?: string;
}

export function CompanyUpsertDemo({ className }: CompanyUpsertDemoProps) {
  const [selectedCompany, setSelectedCompany] = useState<
    CompanyResponse | undefined
  >();
  const [activeTab, setActiveTab] = useState('form');
  const { companies, refetch } = useCompanies({ limit: 10 });

  const handleCompanySuccess = (company: CompanyResponse) => {
    toast.success('Company operation completed successfully!');
    refetch();
    setSelectedCompany(company);
    setActiveTab('results');
  };

  const testData = {
    email_upsert: {
      name: 'Tech Solutions Inc',
      slug: 'tech-solutions',
      email: 'info@techsolutions.com',
      phone: '+1 (555) 123-4567',
      website: 'https://techsolutions.com',
      description: 'Advanced technology consulting and solutions',
      business_type: 'enterprise' as const,
    },
    slug_upsert: {
      name: 'Creative Studio',
      slug: 'creative-studio',
      email: '',
      phone: '+1 (555) 987-6543',
      website: 'https://creativestudio.com',
      description: 'Digital design and branding services',
      business_type: 'small_business' as const,
    },
  };

  const codeExamples = {
    basic: `// Basic upsert with email conflict resolution
import { upsertCompany } from '@/lib/company-service'

const company = await upsertCompany({
  name: "Tech Solutions Inc",
  slug: "tech-solutions", 
  email: "info@techsolutions.com",
  createdBy: userId
})`,

    api: `// Using the API endpoint
const response = await fetch('/api/enhanced/companies', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: "Tech Solutions Inc",
    slug: "tech-solutions",
    email: "info@techsolutions.com",
    upsert_strategy: "email" // or "slug"
  })
})`,

    hook: `// Using React hook
import { useCompanyUpsert } from '@/hooks/use-company'

const { upsertCompany, isLoading } = useCompanyUpsert()

const handleSubmit = async (data) => {
  const result = await upsertCompany({
    ...data,
    upsert_strategy: 'email'
  })
}`,
  };

  return (
    <div className={className}>
      <div className='mb-6'>
        <h2 className='text-2xl font-bold mb-2'>Company Upsert System Demo</h2>
        <p className='text-gray-600'>
          Demonstration of the enhanced company upsert functionality with
          automatic conflict resolution
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className='space-y-6'
      >
        <TabsList className='grid w-full grid-cols-4'>
          <TabsTrigger value='form'>Interactive Form</TabsTrigger>
          <TabsTrigger value='examples'>Code Examples</TabsTrigger>
          <TabsTrigger value='existing'>Existing Companies</TabsTrigger>
          <TabsTrigger value='results'>Results</TabsTrigger>
        </TabsList>

        <TabsContent value='form' className='space-y-6'>
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            {/* Feature Overview */}
            <Card className='lg:col-span-1'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <GitMerge className='h-5 w-5' />
                  Upsert Features
                </CardTitle>
                <CardDescription>
                  Advanced conflict resolution capabilities
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-3'>
                  <div className='flex items-start gap-3'>
                    <Mail className='h-4 w-4 mt-1 text-blue-500' />
                    <div>
                      <p className='font-medium text-sm'>Email-based Upsert</p>
                      <p className='text-xs text-gray-500'>
                        Uses case-insensitive email matching via generated
                        column
                      </p>
                    </div>
                  </div>

                  <div className='flex items-start gap-3'>
                    <Link className='h-4 w-4 mt-1 text-green-500' />
                    <div>
                      <p className='font-medium text-sm'>Slug-based Upsert</p>
                      <p className='text-xs text-gray-500'>
                        Falls back to URL-friendly slug matching
                      </p>
                    </div>
                  </div>

                  <div className='flex items-start gap-3'>
                    <CheckCircle className='h-4 w-4 mt-1 text-purple-500' />
                    <div>
                      <p className='font-medium text-sm'>Auto-generation</p>
                      <p className='text-xs text-gray-500'>
                        Automatic slug generation from company name
                      </p>
                    </div>
                  </div>

                  <div className='flex items-start gap-3'>
                    <Database className='h-4 w-4 mt-1 text-orange-500' />
                    <div>
                      <p className='font-medium text-sm'>RBAC Integration</p>
                      <p className='text-xs text-gray-500'>
                        Role-based permission checking
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className='space-y-2'>
                  <h4 className='font-medium text-sm'>Quick Test Data</h4>
                  <div className='space-y-2'>
                    <Button
                      size='sm'
                      variant='outline'
                      className='w-full justify-start'
                      onClick={() => {
                        // This would populate the form with test data
                        toast.info(
                          'Use the form below to test email-based upsert'
                        );
                      }}
                    >
                      <Mail className='h-3 w-3 mr-2' />
                      Email Upsert Test
                    </Button>

                    <Button
                      size='sm'
                      variant='outline'
                      className='w-full justify-start'
                      onClick={() => {
                        toast.info(
                          'Use the form below to test slug-based upsert'
                        );
                      }}
                    >
                      <Link className='h-3 w-3 mr-2' />
                      Slug Upsert Test
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upsert Form */}
            <div className='lg:col-span-2'>
              <CompanyUpsertForm
                onSuccess={handleCompanySuccess}
                existingCompany={selectedCompany}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value='examples' className='space-y-6'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Code className='h-5 w-5' />
                  Service Function
                </CardTitle>
                <CardDescription>Direct service layer usage</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className='bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm'>
                  <code>{codeExamples.basic}</code>
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Play className='h-5 w-5' />
                  API Endpoint
                </CardTitle>
                <CardDescription>RESTful API integration</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className='bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm'>
                  <code>{codeExamples.api}</code>
                </pre>
              </CardContent>
            </Card>

            <Card className='lg:col-span-2'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Building2 className='h-5 w-5' />
                  React Hook Usage
                </CardTitle>
                <CardDescription>
                  Client-side integration with React Query
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className='bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm'>
                  <code>{codeExamples.hook}</code>
                </pre>
              </CardContent>
            </Card>
          </div>

          {/* Database Schema Info */}
          <Card>
            <CardHeader>
              <CardTitle>Database Schema Features</CardTitle>
              <CardDescription>
                Enhanced PostgreSQL features for robust upsert operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <h4 className='font-medium mb-2'>Generated Column</h4>
                  <pre className='bg-gray-100 p-3 rounded text-sm'>
                    {`lower_email TEXT GENERATED ALWAYS AS 
(LOWER(email)) STORED`}
                  </pre>
                  <p className='text-sm text-gray-600 mt-2'>
                    Automatically maintains lowercase email for case-insensitive
                    matching
                  </p>
                </div>

                <div>
                  <h4 className='font-medium mb-2'>Unique Constraints</h4>
                  <pre className='bg-gray-100 p-3 rounded text-sm'>
                    {`UNIQUE (slug)
UNIQUE (lower_email) WHERE lower_email IS NOT NULL`}
                  </pre>
                  <p className='text-sm text-gray-600 mt-2'>
                    Ensures data integrity while allowing NULL emails
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='existing' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Existing Companies</CardTitle>
              <CardDescription>
                Companies currently in the system - click to edit with upsert
              </CardDescription>
            </CardHeader>
            <CardContent>
              {companies.length === 0 ? (
                <div className='text-center py-8'>
                  <Building2 className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                  <p className='text-gray-500'>No companies found</p>
                  <p className='text-sm text-gray-400'>
                    Create one using the form to see upsert in action
                  </p>
                </div>
              ) : (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                  {companies.map((company: CompanyResponse) => (
                    <Card
                      key={company.id}
                      className='cursor-pointer hover:shadow-md transition-shadow'
                    >
                      <CardContent className='p-4'>
                        <div className='flex items-start justify-between mb-2'>
                          <h4 className='font-medium truncate'>
                            {company.name}
                          </h4>
                          <Badge
                            variant={
                              company.is_active ? 'default' : 'secondary'
                            }
                          >
                            {company.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>

                        <p className='text-sm text-gray-500 mb-2'>
                          /{company.slug}
                        </p>

                        {company.email && (
                          <p className='text-sm text-blue-600 mb-2'>
                            {company.email}
                          </p>
                        )}

                        <p className='text-xs text-gray-400 mb-3 line-clamp-2'>
                          {company.description || 'No description'}
                        </p>

                        <Button
                          size='sm'
                          variant='outline'
                          className='w-full'
                          onClick={() => {
                            setSelectedCompany(company);
                            setActiveTab('form');
                          }}
                        >
                          Edit with Upsert
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='results' className='space-y-6'>
          {selectedCompany ? (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <CheckCircle className='h-5 w-5 text-green-500' />
                  Upsert Operation Result
                </CardTitle>
                <CardDescription>
                  Company was successfully created or updated
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div>
                    <h4 className='font-medium mb-3'>Company Details</h4>
                    <dl className='space-y-2 text-sm'>
                      <div>
                        <dt className='font-medium text-gray-500'>ID:</dt>
                        <dd className='font-mono text-xs'>
                          {selectedCompany.id}
                        </dd>
                      </div>
                      <div>
                        <dt className='font-medium text-gray-500'>Name:</dt>
                        <dd>{selectedCompany.name}</dd>
                      </div>
                      <div>
                        <dt className='font-medium text-gray-500'>Slug:</dt>
                        <dd className='font-mono'>/{selectedCompany.slug}</dd>
                      </div>
                      <div>
                        <dt className='font-medium text-gray-500'>Email:</dt>
                        <dd>{selectedCompany.email || 'Not provided'}</dd>
                      </div>
                      <div>
                        <dt className='font-medium text-gray-500'>
                          Lower Email:
                        </dt>
                        <dd className='font-mono text-xs'>
                          {selectedCompany.lower_email || 'N/A'}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h4 className='font-medium mb-3'>Timestamps</h4>
                    <dl className='space-y-2 text-sm'>
                      <div>
                        <dt className='font-medium text-gray-500'>Created:</dt>
                        <dd>
                          {new Date(
                            selectedCompany.created_at
                          ).toLocaleString()}
                        </dd>
                      </div>
                      <div>
                        <dt className='font-medium text-gray-500'>Updated:</dt>
                        <dd>
                          {new Date(
                            selectedCompany.updated_at
                          ).toLocaleString()}
                        </dd>
                      </div>
                      <div>
                        <dt className='font-medium text-gray-500'>Status:</dt>
                        <dd>
                          <Badge
                            variant={
                              selectedCompany.is_active
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {selectedCompany.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          {selectedCompany.is_verified && (
                            <Badge variant='outline' className='ml-2'>
                              Verified
                            </Badge>
                          )}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <Separator className='my-4' />

                <div className='flex gap-2'>
                  <Button
                    variant='outline'
                    onClick={() => {
                      setSelectedCompany(selectedCompany);
                      setActiveTab('form');
                    }}
                  >
                    Edit Again
                  </Button>
                  <Button
                    variant='outline'
                    onClick={() => setActiveTab('existing')}
                  >
                    View All Companies
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className='text-center py-8'>
                <AlertCircle className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                <p className='text-gray-500'>No recent upsert operation</p>
                <p className='text-sm text-gray-400'>
                  Create or update a company to see results here
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
