'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Download,
  Eye,
  Upload,
  Clock
} from 'lucide-react';
import { format, differenceInDays, isAfter, isBefore, addDays } from 'date-fns';

interface DocumentHealthProps {
  documents: {
    idCard: {
      number?: string;
      expiryDate?: string;
      url?: string;
      status: 'valid' | 'expiring' | 'expired' | 'missing';
    };
    passport: {
      number?: string;
      expiryDate?: string;
      url?: string;
      status: 'valid' | 'expiring' | 'expired' | 'missing';
    };
  };
  onUpload: (type: 'id_card' | 'passport') => void;
  onView: (type: 'id_card' | 'passport') => void;
  onDownload: (type: 'id_card' | 'passport') => void;
  isAdmin: boolean;
}

export function PromoterDocumentHealth({ 
  documents, 
  onUpload, 
  onView, 
  onDownload, 
  isAdmin 
}: DocumentHealthProps) {
  const getDocumentStatus = (expiryDate?: string) => {
    if (!expiryDate) return { status: 'missing', daysRemaining: 0, color: 'red' };
    
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysRemaining = differenceInDays(expiry, today);
    
    if (daysRemaining < 0) {
      return { status: 'expired', daysRemaining: Math.abs(daysRemaining), color: 'red' };
    } else if (daysRemaining <= 30) {
      return { status: 'expiring', daysRemaining, color: 'yellow' };
    } else {
      return { status: 'valid', daysRemaining, color: 'green' };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'expiring':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'expired':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'missing':
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'valid':
        return <Badge variant="default" className="bg-green-100 text-green-800">Valid</Badge>;
      case 'expiring':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Expiring Soon</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      case 'missing':
        return <Badge variant="outline" className="border-gray-300 text-gray-600">Missing</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const calculateOverallHealth = () => {
    const idStatus = getDocumentStatus(documents.idCard.expiryDate);
    const passportStatus = getDocumentStatus(documents.passport.expiryDate);
    
    if (idStatus.status === 'valid' && passportStatus.status === 'valid') {
      return { score: 100, status: 'excellent', color: 'green' };
    } else if (idStatus.status === 'expiring' || passportStatus.status === 'expiring') {
      return { score: 60, status: 'warning', color: 'yellow' };
    } else if (idStatus.status === 'expired' || passportStatus.status === 'expired') {
      return { score: 20, status: 'critical', color: 'red' };
    } else {
      return { score: 0, status: 'incomplete', color: 'gray' };
    }
  };

  const overallHealth = calculateOverallHealth();

  const DocumentCard = ({ 
    type, 
    document, 
    title 
  }: { 
    type: 'id_card' | 'passport'; 
    document: any; 
    title: string; 
  }) => {
    const status = getDocumentStatus(document.expiryDate);
    
    return (
      <Card className="relative">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {title}
            </CardTitle>
            {getStatusIcon(status.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status</span>
            {getStatusBadge(status.status)}
          </div>
          
          {document.number && (
            <div>
              <span className="text-sm text-gray-500">Number</span>
              <p className="font-mono text-sm">{document.number}</p>
            </div>
          )}
          
          {document.expiryDate && (
            <div>
              <span className="text-sm text-gray-500">Expiry Date</span>
              <p className="text-sm">
                {format(new Date(document.expiryDate), 'MMM dd, yyyy')}
              </p>
              {status.status !== 'missing' && (
                <p className={`text-xs ${
                  status.color === 'red' ? 'text-red-600' :
                  status.color === 'yellow' ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {status.status === 'expired' 
                    ? `Expired ${status.daysRemaining} days ago`
                    : status.status === 'expiring'
                    ? `${status.daysRemaining} days remaining`
                    : `${status.daysRemaining} days remaining`
                  }
                </p>
              )}
            </div>
          )}
          
          {status.status !== 'missing' && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Health</span>
                <span>{status.status === 'valid' ? '100%' : status.status === 'expiring' ? '60%' : '0%'}</span>
              </div>
              <Progress 
                value={status.status === 'valid' ? 100 : status.status === 'expiring' ? 60 : 0} 
                className="h-2"
              />
            </div>
          )}
          
          <div className="flex gap-2 pt-2">
            {document.url && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onView(type)}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDownload(type)}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </>
            )}
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpload(type)}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-1" />
                Upload
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Overall Document Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Health Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`text-3xl font-bold ${
                overallHealth.color === 'green' ? 'text-green-600' :
                overallHealth.color === 'yellow' ? 'text-yellow-600' :
                overallHealth.color === 'red' ? 'text-red-600' :
                'text-gray-600'
              }`}>
                {overallHealth.score}%
              </div>
              <Badge 
                variant={overallHealth.color === 'green' ? 'default' : 
                        overallHealth.color === 'yellow' ? 'secondary' : 
                        overallHealth.color === 'red' ? 'destructive' : 'outline'}
                className="capitalize"
              >
                {overallHealth.status}
              </Badge>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Document Status</div>
              <div className="text-sm font-medium">
                {overallHealth.score === 100 ? 'All documents valid' :
                 overallHealth.score === 60 ? 'Some documents expiring' :
                 overallHealth.score === 20 ? 'Some documents expired' :
                 'Documents missing'}
              </div>
            </div>
          </div>
          <Progress value={overallHealth.score} className="h-3" />
        </CardContent>
      </Card>

      {/* Individual Documents */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DocumentCard
          type="id_card"
          document={documents.idCard}
          title="ID Card"
        />
        <DocumentCard
          type="passport"
          document={documents.passport}
          title="Passport"
        />
      </div>

      {/* Action Required Alert */}
      {(overallHealth.score < 100) && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">Action Required</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  {overallHealth.score === 0 ? 'Please upload missing documents to complete the profile.' :
                   overallHealth.score === 20 ? 'Some documents have expired and need to be renewed.' :
                   'Some documents are expiring soon and should be renewed.'}
                </p>
                {isAdmin && (
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      onClick={() => onUpload('id_card')}
                      variant="outline"
                      className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                    >
                      Upload ID Card
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onUpload('passport')}
                      variant="outline"
                      className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                    >
                      Upload Passport
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
