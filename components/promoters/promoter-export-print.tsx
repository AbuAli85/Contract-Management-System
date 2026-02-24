'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Download,
  FileText,
  Printer,
  Mail,
  Share2,
  CheckCircle,
  FileDown,
  Image as ImageIcon,
  Table,
  BarChart3,
} from 'lucide-react';

interface ExportSection {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  isSelected: boolean;
}

interface PromoterExportPrintProps {
  promoterId: string;
  promoterData: {
    name_en: string;
    name_ar?: string;
    email?: string;
    phone?: string;
    profile_picture_url?: string;
    id_card_number?: string;
    passport_number?: string;
    status: string;
    created_at: string;
  };
  performanceMetrics?: any;
  contracts?: any[];
  documents?: any[];
}

export function PromoterExportPrint({
  promoterId,
  promoterData,
  performanceMetrics,
  contracts,
  documents,
}: PromoterExportPrintProps) {
  const [exportFormat, setExportFormat] = useState<
    'pdf' | 'excel' | 'csv' | 'json'
  >('pdf');
  const [exportType, setExportType] = useState<'full' | 'summary' | 'custom'>(
    'full'
  );
  const [isExporting, setIsExporting] = useState(false);
  const [sections, setSections] = useState<ExportSection[]>([
    {
      id: 'personal',
      label: 'Personal Information',
      description: 'Name, contact details, basic info',
      icon: <FileText className='h-4 w-4' />,
      isSelected: true,
    },
    {
      id: 'performance',
      label: 'Performance Metrics',
      description: 'KPIs, ratings, scores',
      icon: <BarChart3 className='h-4 w-4' />,
      isSelected: true,
    },
    {
      id: 'contracts',
      label: 'Contracts',
      description: 'Active and historical contracts',
      icon: <FileText className='h-4 w-4' />,
      isSelected: true,
    },
    {
      id: 'documents',
      label: 'Documents',
      description: 'IDs, certificates, attachments',
      icon: <FileDown className='h-4 w-4' />,
      isSelected: true,
    },
    {
      id: 'notes',
      label: 'Notes & Comments',
      description: 'Internal notes and communications',
      icon: <FileText className='h-4 w-4' />,
      isSelected: false,
    },
    {
      id: 'analytics',
      label: 'Analytics Dashboard',
      description: 'Charts and visualizations',
      icon: <BarChart3 className='h-4 w-4' />,
      isSelected: false,
    },
    {
      id: 'compliance',
      label: 'Compliance Status',
      description: 'Document compliance and alerts',
      icon: <CheckCircle className='h-4 w-4' />,
      isSelected: false,
    },
    {
      id: 'kpis',
      label: 'KPI Tracking',
      description: 'Goals and milestones',
      icon: <Table className='h-4 w-4' />,
      isSelected: false,
    },
  ]);

  const toggleSection = (sectionId: string) => {
    setSections(
      sections.map(s =>
        s.id === sectionId ? { ...s, isSelected: !s.isSelected } : s
      )
    );
  };

  const selectAll = () => {
    setSections(sections.map(s => ({ ...s, isSelected: true })));
  };

  const selectNone = () => {
    setSections(sections.map(s => ({ ...s, isSelected: false })));
  };

  const handleExport = async (
    action: 'download' | 'print' | 'email' | 'share'
  ) => {
    setIsExporting(true);

    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));

      const selectedSections = sections
        .filter(s => s.isSelected)
        .map(s => s.id);

      console.log('Exporting promoter profile:', {
        promoterId,
        format: exportFormat,
        type: exportType,
        sections: selectedSections,
        action,
      });

      // Generate export data
      const exportData = {
        promoter: promoterData,
        sections: selectedSections,
        performance: performanceMetrics,
        contracts,
        documents,
        generatedAt: new Date().toISOString(),
        format: exportFormat,
      };

      switch (action) {
        case 'download':
          // In production, this would generate the actual file
          downloadFile(exportData);
          break;
        case 'print':
          // Open print dialog
          window.print();
          break;
        case 'email':
          // Open email client
          sendViaEmail(exportData);
          break;
        case 'share':
          // Share via Web Share API
          shareProfile(exportData);
          break;
      }

      alert(`Profile ${action}ed successfully!`);
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const downloadFile = (data: any) => {
    let content: string;
    let mimeType: string;
    let extension: string;

    switch (exportFormat) {
      case 'pdf':
        // In production, use a PDF library like jsPDF or PDFMake
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/pdf';
        extension = 'pdf';
        console.log('PDF generation would happen here');
        break;
      case 'excel':
        // In production, use a library like xlsx
        content = JSON.stringify(data, null, 2);
        mimeType =
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        extension = 'xlsx';
        break;
      case 'csv':
        content = convertToCSV(data);
        mimeType = 'text/csv';
        extension = 'csv';
        break;
      case 'json':
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
        extension = 'json';
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `promoter_${(promoterData.name_en ?? '').replace(/\s+/g, '_')}_${new Date().getTime()}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const convertToCSV = (data: any) => {
    // Simple CSV conversion - in production, use a proper CSV library
    const rows = [
      ['Field', 'Value'],
      ['Name (EN)', data.promoter.name_en],
      ['Name (AR)', data.promoter.name_ar || ''],
      ['Email', data.promoter.email || ''],
      ['Phone', data.promoter.phone || ''],
      ['Status', data.promoter.status],
      ['ID Card', data.promoter.id_card_number || ''],
      ['Passport', data.promoter.passport_number || ''],
      ['Created', data.promoter.created_at],
    ];
    return rows.map(row => row.join(',')).join('\n');
  };

  const sendViaEmail = (data: any) => {
    const subject = encodeURIComponent(
      `Promoter Profile - ${promoterData.name_en}`
    );
    const body = encodeURIComponent(
      `Please find attached the promoter profile for ${promoterData.name_en}.`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const shareProfile = async (data: any) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Promoter Profile - ${promoterData.name_en}`,
          text: `View the profile of ${promoterData.name_en}`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Download className='h-5 w-5' />
            Export & Print Profile
          </CardTitle>
          <CardDescription>
            Generate professional reports and export data
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* Export Type */}
          <div>
            <Label className='text-sm font-semibold mb-3 block'>
              Export Type
            </Label>
            <RadioGroup
              value={exportType}
              onValueChange={(value: string) => setExportType(value as any)}
            >
              <div className='flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer'>
                <RadioGroupItem value='full' id='full' />
                <Label htmlFor='full' className='flex-1 cursor-pointer'>
                  <div className='font-medium'>Full Profile</div>
                  <div className='text-xs text-gray-500'>
                    Complete profile with all available information
                  </div>
                </Label>
              </div>
              <div className='flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer'>
                <RadioGroupItem value='summary' id='summary' />
                <Label htmlFor='summary' className='flex-1 cursor-pointer'>
                  <div className='font-medium'>Summary Report</div>
                  <div className='text-xs text-gray-500'>
                    Key information and performance highlights
                  </div>
                </Label>
              </div>
              <div className='flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer'>
                <RadioGroupItem value='custom' id='custom' />
                <Label htmlFor='custom' className='flex-1 cursor-pointer'>
                  <div className='font-medium'>Custom Selection</div>
                  <div className='text-xs text-gray-500'>
                    Choose specific sections to include
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Custom Sections Selection */}
          {exportType === 'custom' && (
            <div>
              <div className='flex items-center justify-between mb-3'>
                <Label className='text-sm font-semibold'>Select Sections</Label>
                <div className='flex gap-2'>
                  <Button variant='outline' size='sm' onClick={selectAll}>
                    Select All
                  </Button>
                  <Button variant='outline' size='sm' onClick={selectNone}>
                    Clear All
                  </Button>
                </div>
              </div>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                {sections.map(section => (
                  <div
                    key={section.id}
                    className={`flex items-start space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      section.isSelected
                        ? 'bg-blue-50 border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => toggleSection(section.id)}
                  >
                    <Checkbox
                      checked={section.isSelected}
                      onCheckedChange={() => toggleSection(section.id)}
                      className='mt-1'
                    />
                    <div className='flex-1'>
                      <div className='flex items-center gap-2 mb-1'>
                        {section.icon}
                        <Label className='font-medium text-sm cursor-pointer'>
                          {section.label}
                        </Label>
                      </div>
                      <p className='text-xs text-gray-500'>
                        {section.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Export Format */}
          <div>
            <Label className='text-sm font-semibold mb-3 block'>
              Export Format
            </Label>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
              {(['pdf', 'excel', 'csv', 'json'] as const).map(format => (
                <div
                  key={format}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    exportFormat === format
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setExportFormat(format)}
                >
                  <div className='flex items-center justify-center mb-2'>
                    {format === 'pdf' && (
                      <FileText className='h-8 w-8 text-red-500' />
                    )}
                    {format === 'excel' && (
                      <Table className='h-8 w-8 text-green-500' />
                    )}
                    {format === 'csv' && (
                      <FileDown className='h-8 w-8 text-blue-500' />
                    )}
                    {format === 'json' && (
                      <FileText className='h-8 w-8 text-purple-500' />
                    )}
                  </div>
                  <div className='text-center'>
                    <div className='font-medium text-sm uppercase'>
                      {format}
                    </div>
                    <div className='text-xs text-gray-500 mt-1'>
                      {format === 'pdf' && 'Professional document'}
                      {format === 'excel' && 'Spreadsheet format'}
                      {format === 'csv' && 'Data export'}
                      {format === 'json' && 'Raw data'}
                    </div>
                  </div>
                  {exportFormat === format && (
                    <div className='flex justify-center mt-2'>
                      <Badge className='bg-blue-500'>Selected</Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className='grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t'>
            <Button
              onClick={() => handleExport('download')}
              disabled={isExporting}
              className='w-full'
            >
              <Download className='h-4 w-4 mr-2' />
              {isExporting ? 'Generating...' : 'Download'}
            </Button>
            <Button
              onClick={() => handleExport('print')}
              disabled={isExporting}
              variant='outline'
              className='w-full'
            >
              <Printer className='h-4 w-4 mr-2' />
              Print
            </Button>
            <Button
              onClick={() => handleExport('email')}
              disabled={isExporting}
              variant='outline'
              className='w-full'
            >
              <Mail className='h-4 w-4 mr-2' />
              Email
            </Button>
            <Button
              onClick={() => handleExport('share')}
              disabled={isExporting}
              variant='outline'
              className='w-full'
            >
              <Share2 className='h-4 w-4 mr-2' />
              Share
            </Button>
          </div>

          {/* Preview Info */}
          <div className='p-4 bg-blue-50 border border-blue-200 rounded-lg'>
            <div className='flex items-start gap-3'>
              <FileText className='h-5 w-5 text-blue-600 mt-0.5' />
              <div>
                <h4 className='font-semibold text-sm text-blue-900 mb-1'>
                  Preview Information
                </h4>
                <ul className='text-sm text-blue-700 space-y-1'>
                  <li>
                    • Type:{' '}
                    {exportType.charAt(0).toUpperCase() + exportType.slice(1)}{' '}
                    Profile
                  </li>
                  <li>• Format: {exportFormat.toUpperCase()}</li>
                  <li>
                    • Sections:{' '}
                    {exportType === 'custom'
                      ? sections.filter(s => s.isSelected).length
                      : 'All'}
                  </li>
                  <li>• Generated for: {promoterData.name_en}</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-content,
          .print-content * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
