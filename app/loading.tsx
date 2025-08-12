import React from 'react';
import { Loader2, FileText, Users, Shield, TrendingUp } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-6">
        {/* Logo/Brand */}
        <div className="flex items-center justify-center space-x-2 mb-8">
          <FileText className="w-8 h-8 text-primary" />
          <span className="text-2xl font-bold text-foreground">
            Contract Management System
          </span>
        </div>

        {/* Loading Animation */}
        <div className="relative">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
        </div>

        {/* Loading Text */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">
            Loading your dashboard...
          </h2>
          <p className="text-muted-foreground">
            Please wait while we prepare your workspace
          </p>
        </div>

        {/* Feature Icons */}
        <div className="flex items-center justify-center space-x-8 pt-8">
          <div className="flex flex-col items-center space-y-2 text-muted-foreground">
            <Users className="w-6 h-6" />
            <span className="text-xs">User Management</span>
          </div>
          <div className="flex flex-col items-center space-y-2 text-muted-foreground">
            <FileText className="w-6 h-6" />
            <span className="text-xs">Contracts</span>
          </div>
          <div className="flex flex-col items-center space-y-2 text-muted-foreground">
            <Shield className="w-6 h-6" />
            <span className="text-xs">Security</span>
          </div>
          <div className="flex flex-col items-center space-y-2 text-muted-foreground">
            <TrendingUp className="w-6 h-6" />
            <span className="text-xs">Analytics</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-64 mx-auto">
          <div className="bg-muted rounded-full h-2 overflow-hidden">
            <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
