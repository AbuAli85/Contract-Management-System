'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  FileText,
  Download,
  Send,
  Eye,
  Plus,
  Calendar,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Employee {
  id: string;
  employee_id: string;
  employee: {
    name_en?: string;
    name_ar?: string;
    email?: string;
  };
}

const LETTER_TYPES = [
  { value: 'salary_certificate', label: 'Salary Certificate' },
  { value: 'official', label: 'Official Letter' },
  { value: 'leave', label: 'Leave Approval Letter' },
  { value: 'employment', label: 'Employment Certificate' },
  { value: 'experience', label: 'Experience Certificate' },
  { value: 'no_objection', label: 'No Objection Certificate' },
  { value: 'transfer', label: 'Transfer Letter' },
  { value: 'termination', label: 'Termination Letter' },
  { value: 'warning', label: 'Warning Letter' },
  { value: 'appreciation', label: 'Appreciation Letter' },
];

export function LetterGenerator() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [letterType, setLetterType] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [additionalData, setAdditionalData] = useState<any>({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);

  // Fetch employees
  const { data: employeesData } = useQuery({
    queryKey: ['employer-employees'],
    queryFn: async () => {
      const response = await fetch('/api/hr/employer-employees/alignment');
      if (!response.ok) throw new Error('Failed to fetch employees');
      return response.json();
    },
  });

  const employees = (employeesData?.employees || []) as Employee[];

  // Generate letter mutation
  const generateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/hr/letters/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate letter');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['hr-letters'] });
      setGenerateDialogOpen(false);
      toast({
        title: 'Success',
        description: 'Letter generated successfully',
      });
      // Reset form
      setSelectedEmployee('');
      setLetterType('');
      setSubject('');
      setContent('');
      setAdditionalData({});
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleLetterTypeChange = (type: string) => {
    setLetterType(type);
    // Auto-generate subject based on type
    if (selectedEmployee) {
      const employee = employees.find((e) => e.id === selectedEmployee);
      if (employee) {
        const employeeName = employee.employee?.name_en || employee.employee?.name_ar || 'Employee';
        const typeLabel = LETTER_TYPES.find((t) => t.value === type)?.label || 'Letter';
        setSubject(`${typeLabel} - ${employeeName}`);
      }
    }
  };

  const handleGenerate = () => {
    if (!selectedEmployee || !letterType) {
      toast({
        title: 'Error',
        description: 'Please select an employee and letter type',
        variant: 'destructive',
      });
      return;
    }

    generateMutation.mutate({
      letter_type: letterType,
      employer_employee_id: selectedEmployee,
      subject: subject || undefined,
      content: content || undefined,
      additional_data: additionalData,
    });
  };

  const selectedEmployeeData = employees.find((e) => e.id === selectedEmployee);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Letter Generator</h1>
          <p className="text-muted-foreground mt-1">
            Generate official letters, certificates, and documents for employees
          </p>
        </div>
      </div>

      {/* Letter Generation Form */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Letter</CardTitle>
          <CardDescription>
            Select employee and letter type to generate a letter
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Employee Selection */}
          <div className="space-y-2">
            <Label>Employee</Label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger>
                <SelectValue placeholder="Select an employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.employee?.name_en || employee.employee?.name_ar || 'Unknown'} ({employee.employee_id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Letter Type */}
          <div className="space-y-2">
            <Label>Letter Type</Label>
            <Select value={letterType} onValueChange={handleLetterTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select letter type" />
              </SelectTrigger>
              <SelectContent>
                {LETTER_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Additional Fields based on letter type */}
          {letterType === 'leave' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Leave Type</Label>
                <Input
                  value={additionalData.leave_type || ''}
                  onChange={(e) =>
                    setAdditionalData({ ...additionalData, leave_type: e.target.value })
                  }
                  placeholder="e.g., Annual Leave"
                />
              </div>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={additionalData.start_date || ''}
                  onChange={(e) =>
                    setAdditionalData({ ...additionalData, start_date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={additionalData.end_date || ''}
                  onChange={(e) =>
                    setAdditionalData({ ...additionalData, end_date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Total Days</Label>
                <Input
                  type="number"
                  value={additionalData.total_days || ''}
                  onChange={(e) =>
                    setAdditionalData({ ...additionalData, total_days: parseInt(e.target.value) })
                  }
                />
              </div>
            </div>
          )}

          {/* Subject */}
          <div className="space-y-2">
            <Label>Subject</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Letter subject (auto-generated if left empty)"
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label>Content</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Letter content (auto-generated if left empty)"
              rows={10}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to auto-generate content based on employee data
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={handleGenerate} disabled={generateMutation.isPending}>
              <FileText className="h-4 w-4 mr-2" />
              {generateMutation.isPending ? 'Generating...' : 'Generate Letter'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setPreviewOpen(true)}
              disabled={!selectedEmployee || !letterType}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Letter Preview</DialogTitle>
            <DialogDescription>
              Preview of the generated letter
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Subject:</Label>
              <p className="text-sm">{subject || 'Auto-generated subject'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Content:</Label>
              <div className="mt-2 p-4 border rounded-md bg-muted whitespace-pre-wrap text-sm">
                {content || 'Auto-generated content will appear here...'}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

