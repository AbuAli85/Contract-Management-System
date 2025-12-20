'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Clock,
  CheckCircle,
  XCircle,
  MapPin,
  Camera,
  User,
  Calendar,
  AlertCircle,
  Loader2,
  Eye,
  Download,
  Search,
  Filter,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface PendingAttendance {
  id: string;
  attendance_date: string;
  check_in: string;
  check_out: string | null;
  status: string;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  location_accuracy: number | null;
  check_in_photo: string | null;
  check_out_photo: string | null;
  location_verified: boolean;
  distance_from_office: number | null;
  ip_address: string | null;
  device_info: any;
  employer_employee: {
    id: string;
    employee: {
      id: string;
      full_name: string;
      email: string;
    };
    employer_id: string;
    company_id: string;
  };
}

export function AttendanceApprovalDashboard() {
  const [pendingAttendance, setPendingAttendance] = useState<PendingAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [selectedAttendance, setSelectedAttendance] = useState<PendingAttendance | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingAttendance();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingAttendance, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPendingAttendance = async () => {
    try {
      const response = await fetch('/api/employer/attendance/approve');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch pending attendance');
      }

      setPendingAttendance(data.attendance || []);
    } catch (error: any) {
      console.error('Error fetching pending attendance:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load pending attendance',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (attendanceId: string) => {
    try {
      setApproving(attendanceId);
      const response = await fetch('/api/employer/attendance/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendance_id: attendanceId,
          action: 'approve',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve attendance');
      }

      toast({
        title: '✅ Approved',
        description: 'Attendance has been approved successfully',
      });

      fetchPendingAttendance();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve attendance',
        variant: 'destructive',
      });
    } finally {
      setApproving(null);
    }
  };

  const handleReject = async () => {
    if (!selectedAttendance || !rejectionReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a rejection reason',
        variant: 'destructive',
      });
      return;
    }

    try {
      setApproving(selectedAttendance.id);
      const response = await fetch('/api/employer/attendance/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendance_id: selectedAttendance.id,
          action: 'reject',
          reason: rejectionReason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject attendance');
      }

      toast({
        title: 'Rejected',
        description: 'Attendance has been rejected',
        variant: 'default',
      });

      setShowRejectDialog(false);
      setSelectedAttendance(null);
      setRejectionReason('');
      fetchPendingAttendance();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject attendance',
        variant: 'destructive',
      });
    } finally {
      setApproving(null);
    }
  };

  const openRejectDialog = (attendance: PendingAttendance) => {
    setSelectedAttendance(attendance);
    setRejectionReason('');
    setShowRejectDialog(true);
  };

  // Filter attendance
  const filteredAttendance = pendingAttendance.filter(attendance => {
    const matchesStatus = statusFilter === 'all' || attendance.status === statusFilter;
    const matchesSearch = !searchTerm || 
      attendance.employer_employee.employee.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attendance.employer_employee.employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      new Date(attendance.attendance_date).toLocaleDateString().toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Toggle selection
  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Select all
  const selectAll = () => {
    if (selectedIds.size === filteredAttendance.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAttendance.map(a => a.id)));
    }
  };

  // Bulk approve
  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) {
      toast({
        title: 'No Selection',
        description: 'Please select at least one attendance record',
        variant: 'destructive',
      });
      return;
    }

    try {
      setApproving('bulk');
      const ids = Array.from(selectedIds);
      
      // Approve all selected
      const promises = ids.map(id =>
        fetch('/api/employer/attendance/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            attendance_id: id,
            action: 'approve',
          }),
        })
      );

      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      toast({
        title: 'Bulk Approval Complete',
        description: `Successfully approved ${successful} record(s)${failed > 0 ? `. ${failed} failed.` : ''}`,
      });

      setSelectedIds(new Set());
      fetchPendingAttendance();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve attendance',
        variant: 'destructive',
      });
    } finally {
      setApproving(null);
    }
  };

  const getLocationUrl = (lat: number | null, lng: number | null) => {
    if (!lat || !lng) return null;
    return `https://www.google.com/maps?q=${lat},${lng}`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Attendance Approval</h2>
          <p className="text-sm text-muted-foreground">
            Review and approve employee attendance records
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2 w-fit">
          {filteredAttendance.length} Pending
        </Badge>
      </div>

      {/* Filters and Bulk Actions */}
      {pendingAttendance.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              {/* Search */}
              <div className="relative flex-1 w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by name, email, or date..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-50 dark:bg-gray-900"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                </SelectContent>
              </Select>

              {/* Bulk Actions */}
              {selectedIds.size > 0 && (
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleBulkApprove}
                    disabled={approving === 'bulk'}
                    className="gap-2"
                  >
                    {approving === 'bulk' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    Approve {selectedIds.size}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedIds(new Set())}
                  >
                    Clear
                  </Button>
                </div>
              )}
            </div>

            {/* Select All */}
            {filteredAttendance.length > 0 && (
              <div className="mt-4 flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAll}
                  className="text-xs"
                >
                  {selectedIds.size === filteredAttendance.length ? 'Deselect All' : 'Select All'}
                </Button>
                {selectedIds.size > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {selectedIds.size} selected
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {filteredAttendance.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            {pendingAttendance.length === 0 ? (
              <>
                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                <p className="text-lg font-medium">All Clear!</p>
                <p className="text-sm text-muted-foreground">
                  No pending attendance records to review
                </p>
              </>
            ) : (
              <>
                <Search className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium">No matching records</p>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your filters or search term
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredAttendance.map((attendance) => (
            <Card key={attendance.id} className={cn(
              "overflow-hidden transition-all",
              selectedIds.has(attendance.id) && "ring-2 ring-primary border-primary"
            )}>
              {/* Selection Checkbox */}
              <div className="absolute top-4 right-4 z-10">
                <input
                  type="checkbox"
                  checked={selectedIds.has(attendance.id)}
                  onChange={() => toggleSelection(attendance.id)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
              </div>
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {attendance.employer_employee.employee.full_name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {attendance.employer_employee.employee.email}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={attendance.status === 'late' ? 'destructive' : 'default'}
                    className="ml-2"
                  >
                    {attendance.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {/* Date and Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Date</Label>
                    <p className="font-medium">
                      {format(parseISO(attendance.attendance_date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Check In</Label>
                    <p className="font-medium">
                      {format(parseISO(attendance.check_in), 'hh:mm a')}
                    </p>
                  </div>
                  {attendance.check_out && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Check Out</Label>
                      <p className="font-medium">
                        {format(parseISO(attendance.check_out), 'hh:mm a')}
                      </p>
                    </div>
                  )}
                </div>

                {/* Location Information */}
                {attendance.latitude && attendance.longitude && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-xs text-muted-foreground">Location</Label>
                    </div>
                    <div className="pl-6 space-y-1">
                      <p className="text-sm">
                        {attendance.latitude.toFixed(6)}, {attendance.longitude.toFixed(6)}
                      </p>
                      {attendance.location_accuracy && (
                        <p className="text-xs text-muted-foreground">
                          Accuracy: ±{Math.round(attendance.location_accuracy)}m
                        </p>
                      )}
                      {attendance.distance_from_office !== null && (
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={attendance.location_verified ? 'default' : 'destructive'}
                            className="text-xs"
                          >
                            {attendance.location_verified ? 'Verified' : 'Not Verified'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {Math.round(attendance.distance_from_office)}m from office
                          </span>
                        </div>
                      )}
                      {getLocationUrl(attendance.latitude, attendance.longitude) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() =>
                            window.open(
                              getLocationUrl(attendance.latitude, attendance.longitude)!,
                              '_blank'
                            )
                          }
                        >
                          <MapPin className="h-3 w-3 mr-1" />
                          View on Map
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Photos */}
                <div className="grid grid-cols-2 gap-4">
                  {attendance.check_in_photo && (
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">
                        Check-In Photo
                      </Label>
                      <Dialog>
                        <DialogTrigger asChild>
                          <div className="relative cursor-pointer group">
                            <img
                              src={attendance.check_in_photo}
                              alt="Check-in photo"
                              className="w-full h-32 object-cover rounded-lg border-2 border-gray-200 group-hover:border-primary transition-colors"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
                              <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Check-In Photo</DialogTitle>
                            <DialogDescription>
                              {attendance.employer_employee.employee.full_name} -{' '}
                              {format(parseISO(attendance.check_in), 'MMM dd, yyyy hh:mm a')}
                            </DialogDescription>
                          </DialogHeader>
                          <img
                            src={attendance.check_in_photo}
                            alt="Check-in photo"
                            className="w-full rounded-lg"
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                  {attendance.check_out_photo && (
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">
                        Check-Out Photo
                      </Label>
                      <Dialog>
                        <DialogTrigger asChild>
                          <div className="relative cursor-pointer group">
                            <img
                              src={attendance.check_out_photo}
                              alt="Check-out photo"
                              className="w-full h-32 object-cover rounded-lg border-2 border-gray-200 group-hover:border-primary transition-colors"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
                              <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Check-Out Photo</DialogTitle>
                            <DialogDescription>
                              {attendance.employer_employee.employee.full_name} -{' '}
                              {attendance.check_out &&
                                format(parseISO(attendance.check_out), 'MMM dd, yyyy hh:mm a')}
                            </DialogDescription>
                          </DialogHeader>
                          <img
                            src={attendance.check_out_photo}
                            alt="Check-out photo"
                            className="w-full rounded-lg"
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </div>

                {/* Additional Info */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  {attendance.ip_address && (
                    <div>
                      <Label className="text-xs text-muted-foreground">IP Address</Label>
                      <p className="text-sm font-mono">{attendance.ip_address}</p>
                    </div>
                  )}
                  {attendance.device_info && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Device</Label>
                      <p className="text-sm">
                        {attendance.device_info.platform || 'Unknown'} -{' '}
                        {attendance.device_info.screenWidth}x{attendance.device_info.screenHeight}
                      </p>
                    </div>
                  )}
                </div>

                {/* Warnings */}
                {!attendance.location_verified && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Location verification failed. Employee may be outside allowed office area.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={() => handleApprove(attendance.id)}
                    disabled={approving === attendance.id}
                    className="flex-1"
                    variant="default"
                  >
                    {approving === attendance.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Approve
                  </Button>
                  <Button
                    onClick={() => openRejectDialog(attendance)}
                    disabled={approving === attendance.id}
                    variant="destructive"
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Attendance</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this attendance record.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedAttendance && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium">
                  {selectedAttendance.employer_employee.employee.full_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(parseISO(selectedAttendance.attendance_date), 'MMM dd, yyyy')} -{' '}
                  {format(parseISO(selectedAttendance.check_in), 'hh:mm a')}
                </p>
              </div>
            )}
            <div>
              <Label htmlFor="rejection-reason">Rejection Reason *</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Location not verified, suspicious activity, incorrect time..."
                className="mt-2 min-h-[100px]"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleReject}
                disabled={!rejectionReason.trim() || approving !== null}
                variant="destructive"
                className="flex-1"
              >
                {approving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                Confirm Rejection
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectDialog(false);
                  setSelectedAttendance(null);
                  setRejectionReason('');
                }}
                className="flex-1"
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

