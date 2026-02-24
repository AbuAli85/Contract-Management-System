'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Eye } from 'lucide-react';

interface Employee {
  id: number;
  employee_code: string;
  full_name: string;
  job_title: string;
  department_name: string;
  email: string;
}

interface Template {
  id: number;
  key: string;
  display_name: string;
  language: string;
  category: string;
  description: string;
}

interface GeneratedDocument {
  id: number;
  file_name: string;
  download_url: string;
  status: string;
  created_at: string;
}

export default function DocumentGenerationPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [additionalData, setAdditionalData] = useState<Record<string, any>>({});
  const [generatedDocs, setGeneratedDocs] = useState<GeneratedDocument[]>([]);
  const [_loading, _setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchEmployees();
    fetchTemplates();
    fetchGeneratedDocuments();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/hr/employees?limit=100');
      const data = await response.json();

      if (response.ok) {
        setEmployees(data.data || []);
      } else {
        // Fallback to mock data
        setEmployees([
          {
            id: 1,
            employee_code: 'EMP0001',
            full_name: 'Ahmed Al-Rashid',
            job_title: 'Software Developer',
            department_name: 'Information Technology',
            email: 'ahmed@company.com',
          },
          {
            id: 2,
            employee_code: 'EMP0002',
            full_name: 'Sarah Johnson',
            job_title: 'HR Manager',
            department_name: 'Human Resources',
            email: 'sarah@company.com',
          },
        ]);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      // In a real implementation, fetch from API
      setTemplates([
        {
          id: 1,
          key: 'employment_contract_en',
          display_name: 'Employment Contract (English)',
          language: 'en',
          category: 'CONTRACT',
          description: 'Standard employment contract template in English',
        },
        {
          id: 2,
          key: 'employment_contract_ar',
          display_name: 'Employment Contract (Arabic)',
          language: 'ar',
          category: 'CONTRACT',
          description: 'Standard employment contract template in Arabic',
        },
        {
          id: 3,
          key: 'offer_letter_en',
          display_name: 'Job Offer Letter (English)',
          language: 'en',
          category: 'LETTER',
          description: 'Job offer letter template in English',
        },
        {
          id: 4,
          key: 'offer_letter_ar',
          display_name: 'Job Offer Letter (Arabic)',
          language: 'ar',
          category: 'LETTER',
          description: 'Job offer letter template in Arabic',
        },
      ]);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchGeneratedDocuments = async () => {
    try {
      // In a real implementation, fetch from API
      setGeneratedDocs([
        {
          id: 1,
          file_name: 'employment_contract_en_EMP0001_1705123456.html',
          download_url: '#',
          status: 'generated',
          created_at: '2024-01-15T10:30:00Z',
        },
        {
          id: 2,
          file_name: 'offer_letter_en_EMP0002_1705123457.html',
          download_url: '#',
          status: 'sent',
          created_at: '2024-01-15T11:00:00Z',
        },
      ]);
    } catch (error) {
      console.error('Error fetching generated documents:', error);
    }
  };

  const handleGenerate = async () => {
    if (!selectedEmployee || !selectedTemplate) {
      alert('Please select both employee and template');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('/api/hr/documents/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employee_id: parseInt(selectedEmployee),
          template_key: selectedTemplate,
          additional_data: additionalData,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Document generated successfully!');
        fetchGeneratedDocuments();
        setAdditionalData({});
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error generating document:', error);
      alert('Error generating document');
    } finally {
      setGenerating(false);
    }
  };

  const selectedEmployeeData = employees.find(
    emp => emp.id.toString() === selectedEmployee
  );
  const selectedTemplateData = templates.find(
    tpl => tpl.key === selectedTemplate
  );

  return (
    <div className='container mx-auto p-6 space-y-6'>
      {/* Header */}
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>
            Document Generation
          </h1>
          <p className='text-gray-600 mt-2'>
            Generate contracts, letters, and other HR documents
          </p>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={generating || !selectedEmployee || !selectedTemplate}
        >
          {generating ? (
            <>
              <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
              Generating...
            </>
          ) : (
            <>
              <FileText className='w-4 h-4 mr-2' />
              Generate Document
            </>
          )}
        </Button>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Generation Form */}
        <Card>
          <CardHeader>
            <CardTitle>Generate New Document</CardTitle>
            <CardDescription>
              Select employee and template to generate a document
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <Label htmlFor='employee'>Select Employee</Label>
              <Select
                value={selectedEmployee}
                onValueChange={setSelectedEmployee}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Choose an employee' />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(employee => (
                    <SelectItem
                      key={employee.id}
                      value={employee.id.toString()}
                    >
                      {employee.full_name} ({employee.employee_code}) -{' '}
                      {employee.job_title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor='template'>Select Template</Label>
              <Select
                value={selectedTemplate}
                onValueChange={setSelectedTemplate}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Choose a template' />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.key}>
                      {template.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedEmployeeData && selectedTemplateData && (
              <div className='bg-gray-50 p-4 rounded-lg'>
                <h4 className='font-medium text-gray-900 mb-2'>Preview</h4>
                <div className='text-sm text-gray-600 space-y-1'>
                  <p>
                    <strong>Employee:</strong> {selectedEmployeeData.full_name}
                  </p>
                  <p>
                    <strong>Template:</strong>{' '}
                    {selectedTemplateData.display_name}
                  </p>
                  <p>
                    <strong>Language:</strong>{' '}
                    {selectedTemplateData.language.toUpperCase()}
                  </p>
                  <p>
                    <strong>Category:</strong> {selectedTemplateData.category}
                  </p>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor='additional-data'>Additional Data (JSON)</Label>
              <Textarea
                id='additional-data'
                placeholder='{"custom_field": "value", "special_terms": "..."}'
                value={JSON.stringify(additionalData, null, 2)}
                onChange={e => {
                  try {
                    setAdditionalData(JSON.parse(e.target.value));
                  } catch {
                    // Invalid JSON, ignore
                  }
                }}
                rows={4}
              />
              <p className='text-xs text-gray-500 mt-1'>
                Optional: Add custom data to be included in the document
                template
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Generated Documents */}
        <Card>
          <CardHeader>
            <CardTitle>Generated Documents</CardTitle>
            <CardDescription>Recently generated documents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {generatedDocs.map(doc => (
                <div
                  key={doc.id}
                  className='flex items-center justify-between p-3 border rounded-lg'
                >
                  <div className='flex items-center space-x-3'>
                    <FileText className='w-5 h-5 text-gray-400' />
                    <div>
                      <p className='font-medium text-sm'>{doc.file_name}</p>
                      <p className='text-xs text-gray-500'>
                        {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <Badge
                      variant={
                        doc.status === 'generated' ? 'default' : 'secondary'
                      }
                    >
                      {doc.status}
                    </Badge>
                    <Button variant='ghost' size='sm'>
                      <Download className='w-4 h-4' />
                    </Button>
                    <Button variant='ghost' size='sm'>
                      <Eye className='w-4 h-4' />
                    </Button>
                  </div>
                </div>
              ))}

              {generatedDocs.length === 0 && (
                <div className='text-center py-8 text-gray-500'>
                  <FileText className='w-12 h-12 mx-auto mb-4 text-gray-300' />
                  <p>No documents generated yet</p>
                  <p className='text-sm'>
                    Generate your first document using the form
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Template Information */}
      <Card>
        <CardHeader>
          <CardTitle>Available Templates</CardTitle>
          <CardDescription>
            Document templates available for generation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {templates.map(template => (
              <div key={template.id} className='border rounded-lg p-4'>
                <div className='flex items-center justify-between mb-2'>
                  <h4 className='font-medium'>{template.display_name}</h4>
                  <Badge variant='outline'>{template.category}</Badge>
                </div>
                <p className='text-sm text-gray-600 mb-2'>
                  {template.description}
                </p>
                <div className='flex items-center space-x-2 text-xs text-gray-500'>
                  <span>Language: {template.language.toUpperCase()}</span>
                  <span>•</span>
                  <span>Key: {template.key}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
