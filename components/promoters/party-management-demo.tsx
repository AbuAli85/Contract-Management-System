'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Users, 
  Settings, 
  CheckCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export function PartyManagementDemo() {
  return (
    <Card className="max-w-4xl mx-auto bg-gradient-to-br from-blue-50 via-white to-purple-50 border-2 border-blue-200">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-2xl text-blue-700">
          <Sparkles className="h-6 w-6" />
          Enhanced Party Management System
          <Sparkles className="h-6 w-6" />
        </CardTitle>
        <CardDescription className="text-lg">
          Manage promoter-party assignments directly from the promoter cards
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Feature Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-white rounded-lg border border-blue-100">
            <Building2 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <h3 className="font-semibold text-blue-800">Party Assignment</h3>
            <p className="text-sm text-gray-600 mt-1">
              Easily assign promoters to companies and organizations
            </p>
          </div>
          
          <div className="text-center p-4 bg-white rounded-lg border border-green-100">
            <Settings className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-semibold text-green-800">Inline Editing</h3>
            <p className="text-sm text-gray-600 mt-1">
              Edit party assignments directly from promoter cards
            </p>
          </div>
          
          <div className="text-center p-4 bg-white rounded-lg border border-purple-100">
            <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <h3 className="font-semibold text-purple-800">Quick Actions</h3>
            <p className="text-sm text-gray-600 mt-1">
              Create new parties or reassign existing ones instantly
            </p>
          </div>
        </div>

        {/* Implementation Steps */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            What's Been Implemented
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-800">Party Assignment Dialog</p>
                <p className="text-sm text-green-700">
                  Comprehensive dialog for managing party assignments with search and filtering
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-800">Enhanced Promoter Cards</p>
                <p className="text-sm text-green-700">
                  Promoter cards now include "Manage Party Assignment" option in the actions menu
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-800">Real-time Updates</p>
                <p className="text-sm text-green-700">
                  Changes are immediately reflected in the UI with automatic data refresh
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-800">Create New Parties</p>
                <p className="text-sm text-green-700">
                  Built-in form to create new parties without leaving the assignment dialog
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
            <ArrowRight className="h-4 w-4" />
            How to Use
          </h4>
          <ol className="space-y-2 text-sm text-blue-700">
            <li className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5 text-xs">1</Badge>
              Navigate to the Promoters page and switch to <strong>Cards View</strong>
            </li>
            <li className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5 text-xs">2</Badge>
              Click the <strong>three-dot menu</strong> on any promoter card
            </li>
            <li className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5 text-xs">3</Badge>
              Select <strong>"Manage Party Assignment"</strong> from the dropdown
            </li>
            <li className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5 text-xs">4</Badge>
              Choose from existing parties or create a new one in the dialog
            </li>
            <li className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5 text-xs">5</Badge>
              Save the assignment and see immediate updates in the promoter card
            </li>
          </ol>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-800">Dialog Features:</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• Search and filter parties by name or CRN</li>
              <li>• View current assignment status</li>
              <li>• Unassign promoters from parties</li>
              <li>• Create new parties inline</li>
              <li>• Real-time validation and error handling</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-800">Card Enhancements:</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• Enhanced assignment section with edit button</li>
              <li>• Visual assignment status indicators</li>
              <li>• Quick access to party management</li>
              <li>• Improved overall card design</li>
              <li>• Consistent action menu structure</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
