'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MousePointer, 
  Users, 
  Edit, 
  Eye,
  Sparkles,
  CheckCircle,
  ArrowRight,
  Zap,
} from 'lucide-react';

export function ClickablePromoterCardsDemo() {
  return (
    <Card className="max-w-4xl mx-auto bg-gradient-to-br from-green-50 via-white to-blue-50 border-2 border-green-200">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-2xl text-green-700">
          <Sparkles className="h-6 w-6" />
          Clickable Promoter Cards Enhancement
          <Sparkles className="h-6 w-6" />
        </CardTitle>
        <CardDescription className="text-lg">
          Promoter cards in the "Assigned Promoters" section are now fully interactive and clickable for easy editing
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Feature Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-white rounded-lg border border-green-100">
            <MousePointer className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-semibold text-green-800">Click to Edit</h3>
            <p className="text-sm text-gray-600 mt-1">
              Click any promoter card to immediately open the edit page
            </p>
          </div>
          
          <div className="text-center p-4 bg-white rounded-lg border border-blue-100">
            <Edit className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <h3 className="font-semibold text-blue-800">Quick Actions</h3>
            <p className="text-sm text-gray-600 mt-1">
              Hover to see action menu with edit and view options
            </p>
          </div>
          
          <div className="text-center p-4 bg-white rounded-lg border border-purple-100">
            <Zap className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <h3 className="font-semibold text-purple-800">Enhanced UX</h3>
            <p className="text-sm text-gray-600 mt-1">
              Improved visual feedback and interactive states
            </p>
          </div>
        </div>

        {/* What's New */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            What's New in Promoter Cards
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-800">Interactive Card Click</p>
                <p className="text-sm text-green-700">
                  Cards now respond to clicks with visual feedback and navigation to edit page
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-800">Hover Effects & Visual Feedback</p>
                <p className="text-sm text-green-700">
                  Cards lift up on hover with enhanced shadows and border colors
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-800">Quick Action Menu</p>
                <p className="text-sm text-green-700">
                  Hover to reveal action dropdown with Edit, View, and Preview options
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-800">Document Status Indicators</p>
                <p className="text-sm text-green-700">
                  Enhanced display showing ID card and passport validity status with color coding
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-800">Quick Preview Dialog</p>
                <p className="text-sm text-green-700">
                  Option to view promoter details in a popup without leaving the page
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
            <ArrowRight className="h-4 w-4" />
            How to Use the Enhanced Cards
          </h4>
          <ol className="space-y-2 text-sm text-blue-700">
            <li className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5 text-xs">1</Badge>
              Navigate to <strong>Manage Parties</strong> page
            </li>
            <li className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5 text-xs">2</Badge>
              Expand any <strong>Employer party</strong> to see assigned promoters
            </li>
            <li className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5 text-xs">3</Badge>
              <strong>Click directly on any promoter card</strong> to open edit page
            </li>
            <li className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5 text-xs">4</Badge>
              <strong>Hover over cards</strong> to see enhanced visual effects
            </li>
            <li className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5 text-xs">5</Badge>
              Use the <strong>three-dot menu</strong> that appears on hover for quick actions
            </li>
          </ol>
        </div>

        {/* Technical Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-800">Visual Enhancements:</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• Smooth hover transitions and lift effects</li>
              <li>• Color-coded document status badges</li>
              <li>• Enhanced typography and spacing</li>
              <li>• Profile picture with edit overlay on hover</li>
              <li>• Gradient overlay effects</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-800">Functionality:</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• Direct navigation to edit pages</li>
              <li>• Quick preview dialog option</li>
              <li>• Keyboard accessibility support</li>
              <li>• Responsive design for all screen sizes</li>
              <li>• Smart click handling to avoid conflicts</li>
            </ul>
          </div>
        </div>

        {/* Location Information */}
        <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
          <h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Where to Find This Feature
          </h4>
          <p className="text-sm text-amber-700">
            This enhancement is active on the <strong>Manage Parties</strong> page, specifically in the 
            <strong>"Assigned Promoters"</strong> section that appears when you expand an Employer party row. 
            All promoter cards in this section are now interactive and clickable for immediate editing.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
