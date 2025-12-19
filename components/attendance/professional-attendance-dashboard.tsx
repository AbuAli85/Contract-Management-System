'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Clock,
  LogIn,
  LogOut,
  MapPin,
  Timer,
  Calendar,
  CheckCircle2,
  XCircle,
  Camera,
  Loader2,
  AlertCircle,
  Shield,
  Coffee,
  TrendingUp,
  BarChart3,
  FileText,
  Settings,
  Bell,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow, differenceInHours, differenceInMinutes, parseISO } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AttendanceHistoryView } from './attendance-history-view';
import { AttendanceReportsAnalytics } from './attendance-reports-analytics';

interface TodayAttendance {
  id: string;
  attendance_date: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
  total_hours: number | null;
  overtime_hours: number | null;
  break_duration_minutes: number | null;
  location: string | null;
  latitude?: number | null;
  longitude?: number | null;
  check_in_photo?: string | null;
  check_out_photo?: string | null;
  approval_status?: 'pending' | 'approved' | 'rejected';
  notes?: string | null;
}

interface AttendanceSummary {
  totalDays: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  totalHours: string;
  averageHours: string;
  overtimeHours: string;
}

interface BreakSession {
  id: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
}

export function ProfessionalAttendanceDashboard() {
  const [todayAttendance, setTodayAttendance] = useState<TodayAttendance | null>(null);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number; accuracy?: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'today' | 'history' | 'analytics'>('today');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchAttendance();
    // Refresh every 30 seconds
    const interval = setInterval(fetchAttendance, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAttendance = async () => {
    try {
      const response = await fetch('/api/employee/attendance');
      const data = await response.json();

      if (!response.ok) {
        if (response.status !== 404) {
          throw new Error(data.error);
        }
        return;
      }

      const today = new Date().toISOString().slice(0, 10);
      const todayRecord = data.attendance?.find(
        (record: TodayAttendance) => record.attendance_date === today
      );

      setTodayAttendance(todayRecord || null);
      setSummary(data.summary || null);
      
      // Check if on break (break_start_time exists and check_out is null)
      if (todayRecord && (todayRecord as any).break_start_time && !todayRecord.check_out) {
        // Break is active
      }
    } catch (error: any) {
      console.error('Error fetching attendance:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch attendance data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = (): Promise<{ latitude: number; longitude: number; accuracy?: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          reject(new Error(`Location error: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  const startCamera = async () => {
    try {
      if (typeof window === 'undefined' || !navigator.mediaDevices) {
        toast({
          title: 'Camera Not Available',
          description: 'Camera access is not available in this environment',
          variant: 'destructive',
        });
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
      
      streamRef.current = stream;
      if (videoRef.current && videoRef.current.parentNode) {
        videoRef.current.srcObject = stream;
        setShowPhotoDialog(true);
      } else {
        stream.getTracks().forEach(track => track.stop());
        toast({
          title: 'Camera Error',
          description: 'Video element is not ready',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Camera Access Denied',
        description: 'Please allow camera access to capture attendance photo',
        variant: 'destructive',
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current && videoRef.current.parentNode) {
      videoRef.current.srcObject = null;
    }
  };

  const capturePhoto = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        if (typeof window === 'undefined') {
          reject(new Error('Cannot capture photo on server'));
          return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        if (!video || !canvas) {
          reject(new Error('Video or canvas not available'));
          return;
        }

        if (video.readyState < 2) {
          reject(new Error('Video not ready'));
          return;
        }

        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('Canvas context not available'));
          return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const photoData = canvas.toDataURL('image/jpeg', 0.8);
        resolve(photoData);
      } catch (error) {
        reject(error);
      }
    });
  };

  const takePhoto = async () => {
    try {
      const photo = await capturePhoto();
      setCapturedPhoto(photo);
      setShowPreview(true);
      stopCamera();
      setShowPhotoDialog(false);
    } catch (error: any) {
      toast({
        title: 'Photo Capture Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleCheckIn = async () => {
    try {
      setActionLoading(true);
      setLocationError(null);

      // Get location
      let locationData;
      try {
        locationData = await getCurrentLocation();
        setLocation(locationData);
      } catch (error: any) {
        setLocationError(error.message);
        toast({
          title: 'Location Required',
          description: 'Please enable location services to check in',
          variant: 'destructive',
        });
        setActionLoading(false);
        return;
      }

      // Capture photo if not already captured
      if (!capturedPhoto) {
        await startCamera();
        setActionLoading(false);
        return;
      }

      // Get device info
      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };

      // Submit check-in
      const response = await fetch('/api/employee/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check_in',
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          accuracy: locationData.accuracy,
          photo: capturedPhoto,
          device_info: deviceInfo,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Check-in failed');
      }

      toast({
        title: '✅ Checked In Successfully',
        description: 'Your attendance has been recorded',
      });

      setCapturedPhoto(null);
      setShowPreview(false);
      await fetchAttendance();
    } catch (error: any) {
      toast({
        title: 'Check-in Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setActionLoading(true);
      setLocationError(null);

      // Get location
      let locationData;
      try {
        locationData = await getCurrentLocation();
        setLocation(locationData);
      } catch (error: any) {
        setLocationError(error.message);
        toast({
          title: 'Location Required',
          description: 'Please enable location services to check out',
          variant: 'destructive',
        });
        setActionLoading(false);
        return;
      }

      // Capture photo
      if (!capturedPhoto) {
        await startCamera();
        setActionLoading(false);
        return;
      }

      // Get device info
      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };

      // Submit check-out
      const response = await fetch('/api/employee/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check_out',
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          accuracy: locationData.accuracy,
          photo: capturedPhoto,
          device_info: deviceInfo,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Check-out failed');
      }

      toast({
        title: '✅ Checked Out Successfully',
        description: `Total hours: ${data.attendance?.total_hours || 0}h`,
      });

      setCapturedPhoto(null);
      setShowPreview(false);
      await fetchAttendance();
    } catch (error: any) {
      toast({
        title: 'Check-out Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleBreak = async (action: 'start' | 'end') => {
    try {
      setActionLoading(true);
      const response = await fetch('/api/employee/attendance/break', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Break action failed');
      }

      toast({
        title: action === 'start' ? '☕ Break Started' : '✅ Break Ended',
        description: action === 'start' 
          ? 'Your break time is now being tracked'
          : `Break duration: ${data.break_duration_minutes || 0} minutes`,
      });

      await fetchAttendance();
    } catch (error: any) {
      toast({
        title: 'Break Action Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Calculate working hours
  const calculateWorkingHours = () => {
    if (!todayAttendance?.check_in) return null;
    
    const checkInTime = parseISO(todayAttendance.check_in);
    const checkOutTime = todayAttendance.check_out ? parseISO(todayAttendance.check_out) : currentTime;
    const breakMinutes = todayAttendance.break_duration_minutes || 0;
    
    const totalMinutes = differenceInMinutes(checkOutTime, checkInTime) - breakMinutes;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return { hours, minutes, totalMinutes };
  };

  const workingHours = calculateWorkingHours();
  const isCheckedIn = !!todayAttendance?.check_in;
  const isCheckedOut = !!todayAttendance?.check_out;
  const canCheckIn = !isCheckedIn;
  const canCheckOut = isCheckedIn && !isCheckedOut;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-6">
          {/* Today's Status Card */}
          <Card className="border-2">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Today's Attendance</CardTitle>
                  <CardDescription className="text-blue-100">
                    {format(currentTime, 'EEEE, MMMM dd, yyyy')} • {format(currentTime, 'hh:mm:ss a')}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {isCheckedIn ? (isCheckedOut ? 'Checked Out' : 'Checked In') : 'Not Checked In'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Status Indicators */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg border-2 border-blue-200 bg-blue-50">
                  <LogIn className={cn("h-8 w-8 mx-auto mb-2", isCheckedIn ? "text-green-600" : "text-gray-400")} />
                  <div className="text-sm font-medium text-gray-600">Check In</div>
                  <div className="text-lg font-bold">
                    {todayAttendance?.check_in 
                      ? format(parseISO(todayAttendance.check_in), 'hh:mm a')
                      : '--:--'}
                  </div>
                </div>
                <div className="text-center p-4 rounded-lg border-2 border-purple-200 bg-purple-50">
                  <Coffee className={cn("h-8 w-8 mx-auto mb-2", (todayAttendance as any)?.break_start_time && !todayAttendance?.check_out ? "text-orange-600" : "text-gray-400")} />
                  <div className="text-sm font-medium text-gray-600">Break</div>
                  <div className="text-lg font-bold">
                    {todayAttendance?.break_duration_minutes 
                      ? `${Math.floor((todayAttendance.break_duration_minutes || 0) / 60)}h ${(todayAttendance.break_duration_minutes || 0) % 60}m`
                      : '0h 0m'}
                  </div>
                </div>
                <div className="text-center p-4 rounded-lg border-2 border-indigo-200 bg-indigo-50">
                  <LogOut className={cn("h-8 w-8 mx-auto mb-2", isCheckedOut ? "text-green-600" : "text-gray-400")} />
                  <div className="text-sm font-medium text-gray-600">Check Out</div>
                  <div className="text-lg font-bold">
                    {todayAttendance?.check_out 
                      ? format(parseISO(todayAttendance.check_out), 'hh:mm a')
                      : '--:--'}
                  </div>
                </div>
              </div>

              {/* Working Hours Timer */}
              {isCheckedIn && !isCheckedOut && (
                <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-2">Working Hours</div>
                      <div className="text-4xl font-bold text-green-700 mb-2">
                        {workingHours ? `${workingHours.hours}h ${workingHours.minutes}m` : '0h 0m'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {todayAttendance?.check_in && formatDistanceToNow(parseISO(todayAttendance.check_in), { addSuffix: false })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4">
                {canCheckIn && (
                  <Button
                    onClick={handleCheckIn}
                    disabled={actionLoading}
                    size="lg"
                    className="h-16 text-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                  >
                    {actionLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : (
                      <LogIn className="h-5 w-5 mr-2" />
                    )}
                    Check In
                  </Button>
                )}
                
                {canCheckOut && (
                  <Button
                    onClick={handleCheckOut}
                    disabled={actionLoading}
                    size="lg"
                    className="h-16 text-lg bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600"
                  >
                    {actionLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : (
                      <LogOut className="h-5 w-5 mr-2" />
                    )}
                    Check Out
                  </Button>
                )}

                {isCheckedIn && !isCheckedOut && (
                  <>
                    {!(todayAttendance as any)?.break_start_time ? (
                      <Button
                        onClick={() => handleBreak('start')}
                        disabled={actionLoading}
                        variant="outline"
                        size="lg"
                        className="h-16 text-lg"
                      >
                        <Coffee className="h-5 w-5 mr-2" />
                        Start Break
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleBreak('end')}
                        disabled={actionLoading}
                        variant="outline"
                        size="lg"
                        className="h-16 text-lg"
                      >
                        <RotateCcw className="h-5 w-5 mr-2" />
                        End Break
                      </Button>
                    )}
                  </>
                )}
              </div>

              {/* Location Status */}
              {location && (
                <Alert>
                  <MapPin className="h-4 w-4" />
                  <AlertDescription>
                    Location: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    {location.accuracy && ` (±${Math.round(location.accuracy)}m)`}
                  </AlertDescription>
                </Alert>
              )}

              {locationError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{locationError}</AlertDescription>
                </Alert>
              )}

              {/* Photo Preview */}
              {capturedPhoto && showPreview && (
                <div className="relative">
                  <img
                    src={capturedPhoto}
                    alt="Attendance photo"
                    className="w-full rounded-lg border-2 border-gray-200"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setCapturedPhoto(null);
                      setShowPreview(false);
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary Stats */}
          {summary && (
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{summary.presentDays}</div>
                    <div className="text-sm text-gray-600">Present Days</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{summary.lateDays}</div>
                    <div className="text-sm text-gray-600">Late Days</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{summary.totalHours}</div>
                    <div className="text-sm text-gray-600">Total Hours</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{summary.overtimeHours}</div>
                    <div className="text-sm text-gray-600">Overtime</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          <AttendanceHistoryView />
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics & Reports</CardTitle>
              <CardDescription>Detailed attendance analytics and insights</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-500 py-8">Analytics view coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Photo Capture Dialog */}
      <Dialog open={showPhotoDialog} onOpenChange={(open) => {
        if (!open) stopCamera();
        setShowPhotoDialog(open);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Capture Attendance Photo</DialogTitle>
            <DialogDescription>
              Please position your face in the camera frame
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-auto"
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            <div className="flex gap-2">
              <Button onClick={takePhoto} className="flex-1">
                <Camera className="h-4 w-4 mr-2" />
                Capture Photo
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  stopCamera();
                  setShowPhotoDialog(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

