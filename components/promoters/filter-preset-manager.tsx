/**
 * Filter Preset Manager Component
 * Allows users to save, load, share, and manage filter presets
 */

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Bookmark,
  Download,
  Upload,
  Share2,
  Copy,
  Check,
  Trash2,
  Edit,
} from 'lucide-react';

interface FilterPreset {
  id: string;
  name: string;
  description?: string;
  filters: Record<string, any>;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface FilterPresetManagerProps {
  currentFilters: Record<string, any>;
  presets: FilterPreset[];
  onApplyPreset: (preset: FilterPreset) => void;
  onSavePreset: (preset: Omit<FilterPreset, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdatePreset: (id: string, updates: Partial<FilterPreset>) => void;
  onDeletePreset: (id: string) => void;
}

export function FilterPresetManager({
  currentFilters,
  presets,
  onApplyPreset,
  onSavePreset,
  onUpdatePreset,
  onDeletePreset,
}: FilterPresetManagerProps) {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDescription, setNewPresetDescription] = useState('');
  const [importJson, setImportJson] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);

  const handleSavePreset = () => {
    if (!newPresetName.trim()) {
      toast({
        title: 'Name required',
        description: 'Please provide a name for your filter preset',
        variant: 'destructive',
      });
      return;
    }

    onSavePreset({
      name: newPresetName,
      ...(newPresetDescription && { description: newPresetDescription }),
      filters: currentFilters,
    });

    setNewPresetName('');
    setNewPresetDescription('');
    setIsCreateOpen(false);

    toast({
      title: 'Preset saved',
      description: `Filter preset "${newPresetName}" has been saved`,
    });
  };

  const handleExportPreset = (preset: FilterPreset) => {
    const json = JSON.stringify(preset, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `filter-preset-${preset.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Preset exported',
      description: 'Filter preset downloaded as JSON file',
    });
  };

  const handleImportPreset = () => {
    try {
      const imported = JSON.parse(importJson);
      
      if (!imported.name || !imported.filters) {
        throw new Error('Invalid preset format');
      }

      onSavePreset({
        name: imported.name,
        description: imported.description,
        filters: imported.filters,
      });

      setImportJson('');
      setIsImportOpen(false);

      toast({
        title: 'Preset imported',
        description: `Successfully imported "${imported.name}"`,
      });
    } catch (error) {
      toast({
        title: 'Import failed',
        description: 'Invalid JSON format or missing required fields',
        variant: 'destructive',
      });
    }
  };

  const handleSharePreset = async (preset: FilterPreset) => {
    const params = new URLSearchParams(preset.filters);
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);

      toast({
        title: 'Link copied',
        description: 'Shareable filter link copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy link to clipboard',
        variant: 'destructive',
      });
    }
  };

  const customPresets = presets.filter((p) => !p.isDefault);

  return (
    <div className="flex items-center gap-2">
      {/* Save Current Filters */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Bookmark className="h-4 w-4 mr-2" />
            Save Filters
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Filter Preset</DialogTitle>
            <DialogDescription>
              Save your current filter configuration for quick access later
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="preset-name">Preset Name *</Label>
              <Input
                id="preset-name"
                placeholder="My Custom Filter"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preset-description">Description (optional)</Label>
              <Textarea
                id="preset-description"
                placeholder="Describe what this filter is for..."
                value={newPresetDescription}
                onChange={(e) => setNewPresetDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="font-medium mb-2">Current Filters:</p>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(currentFilters, null, 2)}
              </pre>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePreset}>Save Preset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Presets */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Manage ({customPresets.length})
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[300px]">
          <DropdownMenuLabel>Saved Filter Presets</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {customPresets.length === 0 ? (
            <div className="px-2 py-6 text-center text-sm text-muted-foreground">
              No saved presets yet
            </div>
          ) : (
            customPresets.map((preset) => (
              <div key={preset.id} className="px-2 py-2 hover:bg-accent rounded-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => onApplyPreset(preset)}
                      className="text-left w-full"
                    >
                      <p className="font-medium text-sm truncate">{preset.name}</p>
                      {preset.description && (
                        <p className="text-xs text-muted-foreground truncate">
                          {preset.description}
                        </p>
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleSharePreset(preset)}
                      title="Share preset"
                    >
                      {copiedUrl ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <Share2 className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleExportPreset(preset)}
                      title="Export preset"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onDeletePreset(preset.id)}
                      title="Delete preset"
                    >
                      <Trash2 className="h-3 w-3 text-red-600" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}

          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setIsImportOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import Preset
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Import Dialog */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Filter Preset</DialogTitle>
            <DialogDescription>
              Paste the JSON configuration of a filter preset
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="import-json">JSON Configuration</Label>
              <Textarea
                id="import-json"
                placeholder='{"name": "My Filter", "filters": {...}}'
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                rows={10}
                className="font-mono text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleImportPreset}>Import</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

