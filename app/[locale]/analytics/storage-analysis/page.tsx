'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  HardDrive,
  FileImage,
  Database,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';

interface StorageStats {
  totalFiles: number;
  totalIdCards: number;
  totalPassports: number;
  totalSizeBytes: number;
  totalSizeMB: number;
  promotersWithDocs: number;
  filesList: Array<{
    name: string;
    size: number;
    created_at: string;
    url: string;
  }>;
}

export default function StorageAnalysisPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [stats, setStats] = useState<StorageStats>({
    totalFiles: 0,
    totalIdCards: 0,
    totalPassports: 0,
    totalSizeBytes: 0,
    totalSizeMB: 0,
    promotersWithDocs: 0,
    filesList: [],
  });
  const [dbStats, setDbStats] = useState({
    promotersWithIdUrl: 0,
    promotersWithPassportUrl: 0,
    promotersWithBothUrls: 0,
    totalPromoters: 0,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchStorageStats = async () => {
    const supabase = createClient();
    if (!supabase) {
      setError('Supabase client not available');
      setLoading(false);
      return;
    }

    try {
      // Fetch database statistics
      const { data: promoters, error: promotersError } = await supabase
        .from('promoters')
        .select('id, name_en, id_card_url, passport_url');

      if (promotersError) {
        console.error('Error fetching promoters:', promotersError);
        setError('Failed to fetch promoter data: ' + promotersError.message);
        return;
      }

      const dbStatsData = {
        totalPromoters: promoters?.length || 0,
        promotersWithIdUrl:
          promoters?.filter(p => p.id_card_url && p.id_card_url.trim() !== '')
            .length || 0,
        promotersWithPassportUrl:
          promoters?.filter(p => p.passport_url && p.passport_url.trim() !== '')
            .length || 0,
        promotersWithBothUrls:
          promoters?.filter(
            p =>
              p.id_card_url &&
              p.id_card_url.trim() !== '' &&
              p.passport_url &&
              p.passport_url.trim() !== ''
          ).length || 0,
      };

      setDbStats(dbStatsData);

      // Try to list files from storage bucket
      try {
        const { data: files, error: storageError } = await supabase.storage
          .from('promoter-documents')
          .list('', {
            limit: 1000,
            sortBy: { column: 'created_at', order: 'desc' },
          });

        if (storageError) {
          console.error('Storage list error:', storageError);
          // This is expected if we don't have direct storage access
          setError(
            'Note: Direct storage listing requires elevated permissions. Showing database URL statistics instead.'
          );
        }

        if (files && files.length > 0) {
          const totalSize = files.reduce(
            (sum, file) => sum + (file.metadata?.size || 0),
            0
          );
          const idCards = files.filter(
            f => f.name.includes('id') || f.name.includes('card')
          ).length;
          const passports = files.filter(f =>
            f.name.includes('passport')
          ).length;

          const filesList = files.map(file => ({
            name: file.name,
            size: file.metadata?.size || 0,
            created_at: file.created_at || '',
            url: supabase.storage
              .from('promoter-documents')
              .getPublicUrl(file.name).data.publicUrl,
          }));

          setStats({
            totalFiles: files.length,
            totalIdCards: idCards,
            totalPassports: passports,
            totalSizeBytes: totalSize,
            totalSizeMB: parseFloat((totalSize / (1024 * 1024)).toFixed(2)),
            promotersWithDocs: new Set(files.map(f => f.name.split('/')[0]))
              .size,
            filesList,
          });
        } else {
          // Use database statistics as fallback
          setStats({
            totalFiles:
              dbStatsData.promotersWithIdUrl +
              dbStatsData.promotersWithPassportUrl,
            totalIdCards: dbStatsData.promotersWithIdUrl,
            totalPassports: dbStatsData.promotersWithPassportUrl,
            totalSizeBytes: 0,
            totalSizeMB: 0,
            promotersWithDocs: new Set([
              ...(promoters?.filter(p => p.id_card_url).map(p => p.id) || []),
              ...(promoters?.filter(p => p.passport_url).map(p => p.id) || []),
            ]).size,
            filesList: [],
          });
        }
      } catch (storageErr) {
        console.error('Storage access error:', storageErr);
        // Use database statistics as fallback
        setStats({
          totalFiles:
            dbStatsData.promotersWithIdUrl +
            dbStatsData.promotersWithPassportUrl,
          totalIdCards: dbStatsData.promotersWithIdUrl,
          totalPassports: dbStatsData.promotersWithPassportUrl,
          totalSizeBytes: 0,
          totalSizeMB: 0,
          promotersWithDocs: new Set([
            ...(promoters?.filter(p => p.id_card_url).map(p => p.id) || []),
            ...(promoters?.filter(p => p.passport_url).map(p => p.id) || []),
          ]).size,
          filesList: [],
        });
      }
    } catch (error) {
      console.error('Error in fetchStorageStats:', error);
      setError(
        'Failed to load statistics: ' +
          (error instanceof Error ? error.message : 'Unknown error')
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!isClient) return;
    fetchStorageStats();
  }, [isClient]);

  const handleRefresh = () => {
    setRefreshing(true);
    setError(null);
    fetchStorageStats();
  };

  if (!isClient || loading) {
    return (
      <div className='flex h-[calc(100vh-150px)] items-center justify-center'>
        <Loader2 className='h-12 w-12 animate-spin text-primary' />
        <p className='ml-4 text-lg'>Analyzing storage...</p>
      </div>
    );
  }

  return (
    <div className='container mx-auto space-y-8 p-6'>
      <div className='mb-8 flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
            Storage Analysis
          </h1>
          <p className='text-muted-foreground mt-2'>
            Analysis of promoter documents in Supabase Storage
          </p>
          {error && (
            <div className='mt-2 text-sm text-yellow-600 bg-yellow-50 p-2 rounded'>
              {error}
            </div>
          )}
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} variant='outline'>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`}
          />
          Refresh
        </Button>
      </div>

      {/* Storage Statistics */}
      <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
        <Card className='border-blue-200 bg-blue-50/50'>
          <CardContent className='pt-6'>
            <div className='text-center'>
              <FileImage className='h-8 w-8 mx-auto text-blue-600 mb-2' />
              <p className='text-4xl font-bold text-blue-700'>
                {stats.totalFiles}
              </p>
              <p className='text-sm text-muted-foreground mt-1'>
                Total Documents
              </p>
              <p className='text-xs text-blue-600 mt-1'>in storage/database</p>
            </div>
          </CardContent>
        </Card>

        <Card className='border-green-200 bg-green-50/50'>
          <CardContent className='pt-6'>
            <div className='text-center'>
              <div className='text-3xl mb-2'>🆔</div>
              <p className='text-4xl font-bold text-green-700'>
                {stats.totalIdCards}
              </p>
              <p className='text-sm text-muted-foreground mt-1'>ID Cards</p>
              <p className='text-xs text-green-600 mt-1'>uploaded</p>
            </div>
          </CardContent>
        </Card>

        <Card className='border-purple-200 bg-purple-50/50'>
          <CardContent className='pt-6'>
            <div className='text-center'>
              <div className='text-3xl mb-2'>📕</div>
              <p className='text-4xl font-bold text-purple-700'>
                {stats.totalPassports}
              </p>
              <p className='text-sm text-muted-foreground mt-1'>Passports</p>
              <p className='text-xs text-purple-600 mt-1'>uploaded</p>
            </div>
          </CardContent>
        </Card>

        <Card className='border-orange-200 bg-orange-50/50'>
          <CardContent className='pt-6'>
            <div className='text-center'>
              <FolderOpen className='h-8 w-8 mx-auto text-orange-600 mb-2' />
              <p className='text-4xl font-bold text-orange-700'>
                {stats.promotersWithDocs}
              </p>
              <p className='text-sm text-muted-foreground mt-1'>Promoters</p>
              <p className='text-xs text-orange-600 mt-1'>with documents</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Storage Size Info */}
      {stats.totalSizeMB > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <HardDrive className='h-5 w-5' />
              Storage Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div>
                <p className='text-sm text-muted-foreground'>Total Size</p>
                <p className='text-2xl font-bold'>{stats.totalSizeMB} MB</p>
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>
                  Average per File
                </p>
                <p className='text-2xl font-bold'>
                  {stats.totalFiles > 0
                    ? (stats.totalSizeMB / stats.totalFiles).toFixed(2)
                    : '0'}{' '}
                  MB
                </p>
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>
                  Total Storage Used
                </p>
                <p className='text-2xl font-bold'>
                  {(stats.totalSizeBytes / 1024).toFixed(0)} KB
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Database Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Database className='h-5 w-5' />
            Database URL Statistics
          </CardTitle>
          <CardDescription>
            Document references stored in the promoters table
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
            <div className='space-y-2'>
              <p className='text-sm text-muted-foreground'>Total Promoters</p>
              <p className='text-3xl font-bold'>{dbStats.totalPromoters}</p>
            </div>
            <div className='space-y-2'>
              <p className='text-sm text-muted-foreground'>With ID Card URL</p>
              <p className='text-3xl font-bold text-green-600'>
                {dbStats.promotersWithIdUrl}
              </p>
              <Badge variant='outline' className='text-xs'>
                {dbStats.totalPromoters > 0
                  ? (
                      (dbStats.promotersWithIdUrl / dbStats.totalPromoters) *
                      100
                    ).toFixed(1)
                  : '0'}
                %
              </Badge>
            </div>
            <div className='space-y-2'>
              <p className='text-sm text-muted-foreground'>With Passport URL</p>
              <p className='text-3xl font-bold text-blue-600'>
                {dbStats.promotersWithPassportUrl}
              </p>
              <Badge variant='outline' className='text-xs'>
                {dbStats.totalPromoters > 0
                  ? (
                      (dbStats.promotersWithPassportUrl /
                        dbStats.totalPromoters) *
                      100
                    ).toFixed(1)
                  : '0'}
                %
              </Badge>
            </div>
            <div className='space-y-2'>
              <p className='text-sm text-muted-foreground'>With Both URLs</p>
              <p className='text-3xl font-bold text-purple-600'>
                {dbStats.promotersWithBothUrls}
              </p>
              <Badge variant='outline' className='text-xs'>
                {dbStats.totalPromoters > 0
                  ? (
                      (dbStats.promotersWithBothUrls / dbStats.totalPromoters) *
                      100
                    ).toFixed(1)
                  : '0'}
                %
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Files (if available) */}
      {stats.filesList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Files</CardTitle>
            <CardDescription>
              Latest {Math.min(20, stats.filesList.length)} files in storage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-2 max-h-96 overflow-y-auto'>
              {stats.filesList.slice(0, 20).map((file, index) => (
                <div
                  key={index}
                  className='flex items-center justify-between p-3 border rounded-lg hover:bg-accent'
                >
                  <div className='flex-1'>
                    <p className='font-medium text-sm'>{file.name}</p>
                    <p className='text-xs text-muted-foreground'>
                      {new Date(file.created_at).toLocaleDateString()} •{' '}
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <a
                    href={file.url}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-xs text-blue-600 hover:underline'
                  >
                    View
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Access */}
      <Card className='bg-gradient-to-r from-blue-50 to-purple-50'>
        <CardHeader>
          <CardTitle>Storage Bucket Access</CardTitle>
          <CardDescription>
            Direct link to your Supabase storage dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex items-center gap-4'>
            <div className='flex-1'>
              <p className='text-sm mb-2'>
                Bucket:{' '}
                <code className='bg-white px-2 py-1 rounded text-xs'>
                  promoter-documents
                </code>
              </p>
              <p className='text-xs text-muted-foreground'>
                Project: reootcngcptfogfozlmz
              </p>
            </div>
            <a
              href='https://supabase.com/dashboard/project/reootcngcptfogfozlmz/storage/buckets/promoter-documents'
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90'
            >
              Open in Supabase
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
