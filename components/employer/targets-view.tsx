'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Target, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TargetsViewProps {
  employerEmployeeId: string;
}

export function TargetsView({ employerEmployeeId }: TargetsViewProps) {
  const [targets, setTargets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTargets();
  }, [employerEmployeeId]);

  const fetchTargets = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/employer/team/${employerEmployeeId}/targets?period=current`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch targets');
      }

      setTargets(data.targets || []);
    } catch (error) {
      console.error('Error fetching targets:', error);
      toast({
        title: 'Error',
        description: 'Failed to load targets',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Targets & Goals ({targets.length})
            </CardTitle>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Target
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : targets.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No targets assigned</p>
          ) : (
            <div className="space-y-4">
              {targets.map(target => (
                <Card key={target.id}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{target.title}</h4>
                        <Badge
                          variant={
                            target.status === 'completed'
                              ? 'default'
                              : target.status === 'active'
                                ? 'secondary'
                                : 'outline'
                          }
                        >
                          {target.status}
                        </Badge>
                      </div>
                      {target.description && (
                        <p className="text-sm text-gray-500">{target.description}</p>
                      )}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>
                            {target.current_value} / {target.target_value} {target.unit}
                          </span>
                          <span className="font-medium">
                            {target.progress_percentage}%
                          </span>
                        </div>
                        <Progress value={target.progress_percentage} />
                      </div>
                      <div className="flex gap-4 text-xs text-gray-500">
                        <span>
                          Start: {new Date(target.start_date).toLocaleDateString()}
                        </span>
                        <span>
                          End: {new Date(target.end_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

