'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  CheckCircle,
  X,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TodayAttendance {
  id: string;
  attendance_date: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
  total_hours: number | null;
  location: string | null;
  latitude?: number | null;
  longitude?: number | null;
  check_in_photo?: string | null;
  check_out_photo?: string | null;
  approval_status?: 'pending' | 'approved' | 'rejected';
  approved_by?: string | null;
  approved_at?: string | null;
  rejection_reason?: string | null;
}

interface AttendanceSummary {
  totalDays: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  totalHours: string;
}

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  accuracy?: number;
}

export function SmartAttendanceCard() {
  const [todayAttendance, setTodayAttendance] =
    useState<TodayAttendance | null>(null);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAttendance();
    // Refresh every minute to update the timer
    const interval = setInterval(fetchAttendance, 60000);
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

      // Find today's record
      const today = new Date().toISOString().slice(0, 10);
      const todayRecord = data.attendance?.find(
        (a: TodayAttendance) => a.attendance_date === today
      );

      setTodayAttendance(todayRecord || null);
      setSummary(data.summary);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = (): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        position => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        error => {
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

  const capturePhoto = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!video || !canvas) {
          reject(new Error('Video or canvas not available'));
          return;
        }

        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to base64
        const photoData = canvas.toDataURL('image/jpeg', 0.8);
        resolve(photoData);
      } catch (error) {
        reject(error);
      }
    });
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowPhotoDialog(true);
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
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
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

  const retakePhoto = () => {
    setCapturedPhoto(null);
    setShowPreview(false);
    startCamera();
  };

  const handleCheckIn = async () => {
    try {
      setActionLoading(true);
      setLocationError(null);

      // Step 1: Get location
      let locationData: LocationData;
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

      // Step 2: Capture photo if not already captured
      const photoData = capturedPhoto;
      if (!photoData) {
        await startCamera();
        // Wait for user to take photo
        return;
      }

      // Step 3: Get device info
      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };

      // Step 4: Get IP (will be captured server-side)
      const response = await fetch('/api/employee/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check_in',
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          accuracy: locationData.accuracy,
          photo: photoData,
          device_info: deviceInfo,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Check-in failed');
      }

      toast({
        title: '✅ Checked In Successfully',
        description:
          data.message ||
          'Your attendance has been recorded and is pending manager approval',
      });

      setTodayAttendance(data.attendance);
      setCapturedPhoto(null);
      setShowPreview(false);
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

      // Step 1: Get location
      let locationData: LocationData;
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

      // Step 2: Capture photo if not already captured
      const photoData = capturedPhoto;
      if (!photoData) {
        await startCamera();
        return;
      }

      // Step 3: Get device info
      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };

      const response = await fetch('/api/employee/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check_out',
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          accuracy: locationData.accuracy,
          photo: photoData,
          device_info: deviceInfo,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Check-out failed');
      }

      toast({
        title: '✅ Checked Out Successfully',
        description: data.message || 'Your check-out has been recorded',
      });

      setTodayAttendance(data.attendance);
      setCapturedPhoto(null);
      setShowPreview(false);
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

  const getWorkDuration = () => {
    if (!todayAttendance?.check_in) return null;

    const checkIn = new Date(todayAttendance.check_in);
    const now = todayAttendance.check_out
      ? new Date(todayAttendance.check_out)
      : new Date();

    const diffMs = now.getTime() - checkIn.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return { hours, minutes, total: (diffMs / (1000 * 60 * 60)).toFixed(1) };
  };

  const workDuration = getWorkDuration();

  if (loading) {
    return (
      <Card className='border-0 shadow-lg'>
        <CardContent className='flex items-center justify-center py-12'>
          <Loader2 className='h-8 w-8 animate-spin text-primary' />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className='border-0 shadow-lg overflow-hidden'>
        <CardHeader className='bg-gradient-to-r from-blue-600 to-indigo-600 text-white pb-4'>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='text-xl flex items-center gap-2'>
                <Shield className='h-5 w-5' />
                Smart Attendance
              </CardTitle>
              <p className='text-blue-100 mt-1'>
                {format(new Date(), 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
            <div className='flex flex-col items-end gap-2'>
              {todayAttendance?.status && (
                <Badge
                  className={cn(
                    'text-sm px-3 py-1',
                    todayAttendance.status === 'present' && 'bg-green-500',
                    todayAttendance.status === 'late' && 'bg-amber-500',
                    todayAttendance.status === 'absent' && 'bg-red-500'
                  )}
                >
                  {todayAttendance.status.charAt(0).toUpperCase() +
                    todayAttendance.status.slice(1)}
                </Badge>
              )}
              {todayAttendance?.approval_status && (
                <Badge
                  variant={
                    todayAttendance.approval_status === 'approved'
                      ? 'default'
                      : todayAttendance.approval_status === 'rejected'
                        ? 'destructive'
                        : 'secondary'
                  }
                  className='text-xs'
                >
                  {todayAttendance.approval_status === 'approved' && (
                    <CheckCircle className='h-3 w-3 mr-1' />
                  )}
                  {todayAttendance.approval_status === 'rejected' && (
                    <X className='h-3 w-3 mr-1' />
                  )}
                  {todayAttendance.approval_status === 'pending' && (
                    <Clock className='h-3 w-3 mr-1' />
                  )}
                  {todayAttendance.approval_status}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className='pt-6 space-y-6'>
          {/* Approval Status Alert */}
          {todayAttendance?.approval_status === 'pending' && (
            <Alert>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>
                Your attendance is pending manager approval. You will be
                notified once reviewed.
              </AlertDescription>
            </Alert>
          )}

          {todayAttendance?.approval_status === 'rejected' &&
            todayAttendance.rejection_reason && (
              <Alert variant='destructive'>
                <XCircle className='h-4 w-4' />
                <AlertDescription>
                  <strong>Rejected:</strong> {todayAttendance.rejection_reason}
                </AlertDescription>
              </Alert>
            )}

          {/* Current Status */}
          <div className='grid grid-cols-2 gap-4'>
            <div className='p-4 bg-gray-50 dark:bg-gray-900 rounded-xl'>
              <div className='flex items-center gap-2 text-gray-500 mb-2'>
                <LogIn className='h-4 w-4' />
                <span className='text-sm'>Check In</span>
              </div>
              <p className='text-xl font-bold text-gray-900 dark:text-white'>
                {todayAttendance?.check_in
                  ? format(new Date(todayAttendance.check_in), 'hh:mm a')
                  : '--:--'}
              </p>
              {todayAttendance?.check_in_photo && (
                <Button
                  variant='ghost'
                  size='sm'
                  className='mt-2 text-xs'
                  onClick={() => {
                    setCapturedPhoto(todayAttendance.check_in_photo || null);
                    setShowPreview(true);
                  }}
                >
                  <Camera className='h-3 w-3 mr-1' />
                  View Photo
                </Button>
              )}
            </div>

            <div className='p-4 bg-gray-50 dark:bg-gray-900 rounded-xl'>
              <div className='flex items-center gap-2 text-gray-500 mb-2'>
                <LogOut className='h-4 w-4' />
                <span className='text-sm'>Check Out</span>
              </div>
              <p className='text-xl font-bold text-gray-900 dark:text-white'>
                {todayAttendance?.check_out
                  ? format(new Date(todayAttendance.check_out), 'hh:mm a')
                  : '--:--'}
              </p>
              {todayAttendance?.check_out_photo && (
                <Button
                  variant='ghost'
                  size='sm'
                  className='mt-2 text-xs'
                  onClick={() => {
                    setCapturedPhoto(todayAttendance.check_out_photo || null);
                    setShowPreview(true);
                  }}
                >
                  <Camera className='h-3 w-3 mr-1' />
                  View Photo
                </Button>
              )}
            </div>
          </div>

          {/* Location Display */}
          {location && (
            <div className='p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200'>
              <div className='flex items-center gap-2 text-sm'>
                <MapPin className='h-4 w-4 text-blue-600' />
                <span className='text-blue-700 dark:text-blue-300'>
                  Location: {location.latitude.toFixed(6)},{' '}
                  {location.longitude.toFixed(6)}
                </span>
                {location.accuracy && (
                  <span className='text-xs text-blue-600'>
                    (Accuracy: ±{Math.round(location.accuracy)}m)
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Work Duration */}
          {workDuration && (
            <div className='p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Timer className='h-5 w-5 text-emerald-600' />
                  <span className='text-sm font-medium text-emerald-700 dark:text-emerald-400'>
                    {todayAttendance?.check_out
                      ? 'Total Work Time'
                      : 'Working Since'}
                  </span>
                </div>
                <div className='text-right'>
                  <p className='text-2xl font-bold text-emerald-700 dark:text-emerald-400'>
                    {workDuration.hours}h {workDuration.minutes}m
                  </p>
                  {!todayAttendance?.check_out && (
                    <p className='text-xs text-emerald-600'>
                      Started{' '}
                      {formatDistanceToNow(
                        new Date(todayAttendance!.check_in!)
                      )}{' '}
                      ago
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!todayAttendance?.check_in ? (
            <div className='space-y-4'>
              {locationError && (
                <Alert variant='destructive'>
                  <AlertCircle className='h-4 w-4' />
                  <AlertDescription>{locationError}</AlertDescription>
                </Alert>
              )}

              {capturedPhoto && showPreview ? (
                <div className='space-y-3'>
                  <div className='relative'>
                    <img
                      src={capturedPhoto}
                      alt='Attendance photo'
                      className='w-full rounded-lg border-2 border-gray-200'
                    />
                    <Button
                      variant='outline'
                      size='sm'
                      className='absolute top-2 right-2'
                      onClick={retakePhoto}
                    >
                      <Camera className='h-4 w-4 mr-1' />
                      Retake
                    </Button>
                  </div>
                  <Button
                    onClick={handleCheckIn}
                    disabled={actionLoading || !location}
                    className='w-full h-14 text-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg'
                  >
                    {actionLoading ? (
                      <Loader2 className='h-5 w-5 animate-spin mr-2' />
                    ) : (
                      <LogIn className='h-5 w-5 mr-2' />
                    )}
                    Confirm Check In
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={startCamera}
                  className='w-full h-14 text-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg'
                >
                  <Camera className='h-5 w-5 mr-2' />
                  Start Check In (Photo Required)
                </Button>
              )}
            </div>
          ) : !todayAttendance?.check_out ? (
            <div className='space-y-4'>
              {capturedPhoto && showPreview ? (
                <div className='space-y-3'>
                  <div className='relative'>
                    <img
                      src={capturedPhoto}
                      alt='Check-out photo'
                      className='w-full rounded-lg border-2 border-gray-200'
                    />
                    <Button
                      variant='outline'
                      size='sm'
                      className='absolute top-2 right-2'
                      onClick={retakePhoto}
                    >
                      <Camera className='h-4 w-4 mr-1' />
                      Retake
                    </Button>
                  </div>
                  <Button
                    onClick={handleCheckOut}
                    disabled={actionLoading || !location}
                    className='w-full h-14 text-lg bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg'
                  >
                    {actionLoading ? (
                      <Loader2 className='h-5 w-5 animate-spin mr-2' />
                    ) : (
                      <LogOut className='h-5 w-5 mr-2' />
                    )}
                    Confirm Check Out
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={startCamera}
                  className='w-full h-14 text-lg bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg'
                >
                  <Camera className='h-5 w-5 mr-2' />
                  Start Check Out (Photo Required)
                </Button>
              )}
            </div>
          ) : (
            <div className='p-4 bg-gray-100 dark:bg-gray-800 rounded-xl text-center'>
              <CheckCircle2 className='h-8 w-8 text-green-500 mx-auto mb-2' />
              <p className='font-medium text-gray-900 dark:text-white'>
                Workday Complete!
              </p>
              <p className='text-sm text-gray-500'>
                You worked {todayAttendance.total_hours?.toFixed(1)} hours today
              </p>
            </div>
          )}

          {/* Monthly Summary */}
          {summary && (
            <div className='pt-4 border-t'>
              <h4 className='text-sm font-medium text-gray-600 mb-3'>
                This Month
              </h4>
              <div className='grid grid-cols-4 gap-2'>
                <div className='text-center p-2 bg-gray-50 dark:bg-gray-900 rounded-lg'>
                  <p className='text-lg font-bold text-gray-900 dark:text-white'>
                    {summary.presentDays}
                  </p>
                  <p className='text-xs text-gray-500'>Present</p>
                </div>
                <div className='text-center p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg'>
                  <p className='text-lg font-bold text-amber-600'>
                    {summary.lateDays}
                  </p>
                  <p className='text-xs text-gray-500'>Late</p>
                </div>
                <div className='text-center p-2 bg-red-50 dark:bg-red-900/20 rounded-lg'>
                  <p className='text-lg font-bold text-red-600'>
                    {summary.absentDays}
                  </p>
                  <p className='text-xs text-gray-500'>Absent</p>
                </div>
                <div className='text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
                  <p className='text-lg font-bold text-blue-600'>
                    {summary.totalHours}
                  </p>
                  <p className='text-xs text-gray-500'>Hours</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photo Capture Dialog */}
      <Dialog
        open={showPhotoDialog}
        onOpenChange={open => {
          if (!open) stopCamera();
          setShowPhotoDialog(open);
        }}
      >
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Capture Attendance Photo</DialogTitle>
            <DialogDescription>
              Please position your face in the camera frame
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='relative bg-black rounded-lg overflow-hidden'>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className='w-full h-auto'
              />
              <canvas ref={canvasRef} className='hidden' />
            </div>
            <div className='flex gap-2'>
              <Button onClick={takePhoto} className='flex-1'>
                <Camera className='h-4 w-4 mr-2' />
                Capture Photo
              </Button>
              <Button
                variant='outline'
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

      {/* Photo Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Photo Preview</DialogTitle>
            <DialogDescription>Review your attendance photo</DialogDescription>
          </DialogHeader>
          {capturedPhoto && (
            <div className='space-y-4'>
              <img
                src={capturedPhoto}
                alt='Preview'
                className='w-full rounded-lg border-2 border-gray-200'
              />
              <div className='flex gap-2'>
                <Button
                  onClick={retakePhoto}
                  variant='outline'
                  className='flex-1'
                >
                  <Camera className='h-4 w-4 mr-2' />
                  Retake
                </Button>
                <Button
                  onClick={() => {
                    setShowPreview(false);
                    // Continue with check-in/out
                    if (!todayAttendance?.check_in) {
                      handleCheckIn();
                    } else {
                      handleCheckOut();
                    }
                  }}
                  className='flex-1'
                >
                  Use This Photo
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
