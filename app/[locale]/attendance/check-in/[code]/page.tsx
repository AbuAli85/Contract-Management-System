'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  MapPin,
  Camera,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Shield,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface LinkData {
  id: string;
  title: string;
  target_latitude: number;
  target_longitude: number;
  allowed_radius_meters: number;
  valid_until: string;
}

export default function AttendanceCheckInPage() {
  const params = useParams();
  const router = useRouter();
  const code = params?.code as string;
  const locale = params?.locale as string;
  
  const [linkData, setLinkData] = useState<LinkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number; accuracy?: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  // Handle missing code parameter
  useEffect(() => {
    if (!code) {
      setError('Invalid check-in link. Missing attendance code.');
      setLoading(false);
      return;
    }
  }, [code]);

  useEffect(() => {
    if (code) {
      fetchLinkData();
    }
  }, [code]);

  const fetchLinkData = async () => {
    try {
      const response = await fetch(`/api/attendance/check-in/${code}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to load check-in link');
        return;
      }

      setLinkData(data.link);
    } catch (error: any) {
      setError(error.message || 'Failed to load check-in link');
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

  const capturePhoto = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        // Add null checks to prevent parentNode errors
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

        // Ensure video is ready
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

  const startCamera = async () => {
    try {
      // Check if we're in browser environment
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
      // Add null check before accessing video element to prevent parentNode errors
      if (videoRef.current && videoRef.current.parentNode) {
        videoRef.current.srcObject = stream;
        setShowPhotoDialog(true);
      } else {
        // Clean up stream if video element is not available
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
    // Add null check to prevent parentNode errors
    if (videoRef.current && videoRef.current.parentNode) {
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

  const handleCheckIn = async () => {
    try {
      setCheckingIn(true);
      setLocationError(null);
      setError(null);

      // Step 1: Get location
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
        setCheckingIn(false);
        return;
      }

      // Step 2: Verify we have photo
      if (!capturedPhoto) {
        await startCamera();
        setCheckingIn(false);
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

      // Step 4: Submit check-in
      const response = await fetch(`/api/attendance/check-in/${code}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
        description: 'Your attendance has been recorded and is pending manager approval',
      });

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push(`/${locale}/dashboard`);
      }, 2000);
    } catch (error: any) {
      setError(error.message);
      toast({
        title: 'Check-in Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setCheckingIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !linkData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button
              onClick={() => router.push(`/${locale}/dashboard`)}
              className="mt-4 w-full"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <div className="max-w-2xl mx-auto pt-8">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Shield className="h-6 w-6" />
                Location-Restricted Check-In
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {linkData && (
                <>
                  <div className="space-y-2">
                    <h3 className="font-semibold">{linkData.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      Valid until: {format(new Date(linkData.valid_until), 'MMM dd, yyyy hh:mm a')}
                    </p>
                    <Badge variant="outline" className="mt-2">
                      <MapPin className="h-3 w-3 mr-1" />
                      Required within {linkData.allowed_radius_meters}m of location
                    </Badge>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {location && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Location captured: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                        {location.accuracy && ` (±${Math.round(location.accuracy)}m)`}
                      </AlertDescription>
                    </Alert>
                  )}

                  {capturedPhoto && showPreview ? (
                    <div className="space-y-3">
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
                            startCamera();
                          }}
                        >
                          <Camera className="h-4 w-4 mr-1" />
                          Retake
                        </Button>
                      </div>
                      <Button
                        onClick={handleCheckIn}
                        disabled={checkingIn || !location}
                        className="w-full h-14 text-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                      >
                        {checkingIn ? (
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        ) : (
                          <CheckCircle className="h-5 w-5 mr-2" />
                        )}
                        {checkingIn ? 'Checking In...' : 'Confirm Check-In'}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={startCamera}
                      className="w-full h-14 text-lg bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                    >
                      <Camera className="h-5 w-5 mr-2" />
                      Start Check-In (Photo Required)
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

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
    </>
  );
}

