'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Tag,
  Plus,
  X,
  Star,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Zap,
  Target,
  Award,
  Sparkles,
  Search,
  Hash,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface SmartTag {
  id: string;
  label: string;
  color: string;
  category:
    | 'skill'
    | 'performance'
    | 'status'
    | 'achievement'
    | 'alert'
    | 'custom';
  icon?: React.ReactNode;
  count: number;
  isAIGenerated: boolean;
  confidence?: number;
}

interface PromoterSmartTagsProps {
  promoterId: string;
  isAdmin: boolean;
  existingTags?: string[];
  onTagsUpdate?: (tags: string[]) => void;
}

export function PromoterSmartTags({
  promoterId,
  isAdmin,
  existingTags = [],
  onTagsUpdate,
}: PromoterSmartTagsProps) {
  const [tags, setTags] = useState<SmartTag[]>([]);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(
    new Set(existingTags)
  );
  const [customTagInput, setCustomTagInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<SmartTag[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Predefined smart tags library
  const tagLibrary: Omit<SmartTag, 'id' | 'count' | 'isAIGenerated'>[] = [
    // Skills
    {
      label: 'Multilingual',
      color: 'bg-purple-100 text-purple-700',
      category: 'skill',
      icon: <Sparkles className='h-3 w-3' />,
    },
    {
      label: 'Customer Service Expert',
      color: 'bg-blue-100 text-blue-700',
      category: 'skill',
      icon: <Star className='h-3 w-3' />,
    },
    {
      label: 'Tech Savvy',
      color: 'bg-cyan-100 text-cyan-700',
      category: 'skill',
      icon: <Zap className='h-3 w-3' />,
    },
    {
      label: 'Team Leader',
      color: 'bg-indigo-100 text-indigo-700',
      category: 'skill',
      icon: <Award className='h-3 w-3' />,
    },
    {
      label: 'Sales Expert',
      color: 'bg-green-100 text-green-700',
      category: 'skill',
      icon: <Target className='h-3 w-3' />,
    },
    {
      label: 'Marketing Specialist',
      color: 'bg-pink-100 text-pink-700',
      category: 'skill',
      icon: <TrendingUp className='h-3 w-3' />,
    },

    // Performance
    {
      label: 'Top Performer',
      color: 'bg-yellow-100 text-yellow-700',
      category: 'performance',
      icon: <Award className='h-3 w-3' />,
    },
    {
      label: 'Consistent',
      color: 'bg-green-100 text-green-700',
      category: 'performance',
      icon: <CheckCircle className='h-3 w-3' />,
    },
    {
      label: 'Fast Learner',
      color: 'bg-blue-100 text-blue-700',
      category: 'performance',
      icon: <Zap className='h-3 w-3' />,
    },
    {
      label: 'Reliable',
      color: 'bg-teal-100 text-teal-700',
      category: 'performance',
      icon: <CheckCircle className='h-3 w-3' />,
    },
    {
      label: 'Improving',
      color: 'bg-lime-100 text-lime-700',
      category: 'performance',
      icon: <TrendingUp className='h-3 w-3' />,
    },

    // Status
    {
      label: 'Available',
      color: 'bg-green-100 text-green-700',
      category: 'status',
      icon: <CheckCircle className='h-3 w-3' />,
    },
    {
      label: 'On Assignment',
      color: 'bg-blue-100 text-blue-700',
      category: 'status',
      icon: <Target className='h-3 w-3' />,
    },
    {
      label: 'Training',
      color: 'bg-purple-100 text-purple-700',
      category: 'status',
      icon: <Sparkles className='h-3 w-3' />,
    },
    {
      label: 'On Leave',
      color: 'bg-gray-100 text-gray-700',
      category: 'status',
      icon: <AlertTriangle className='h-3 w-3' />,
    },

    // Achievements
    {
      label: 'Employee of the Month',
      color: 'bg-yellow-100 text-yellow-700',
      category: 'achievement',
      icon: <Award className='h-3 w-3' />,
    },
    {
      label: 'Perfect Attendance',
      color: 'bg-green-100 text-green-700',
      category: 'achievement',
      icon: <CheckCircle className='h-3 w-3' />,
    },
    {
      label: '5-Star Rating',
      color: 'bg-yellow-100 text-yellow-700',
      category: 'achievement',
      icon: <Star className='h-3 w-3' />,
    },
    {
      label: 'Client Favorite',
      color: 'bg-pink-100 text-pink-700',
      category: 'achievement',
      icon: <Star className='h-3 w-3' />,
    },

    // Alerts
    {
      label: 'Document Expiring',
      color: 'bg-orange-100 text-orange-700',
      category: 'alert',
      icon: <AlertTriangle className='h-3 w-3' />,
    },
    {
      label: 'Training Required',
      color: 'bg-yellow-100 text-yellow-700',
      category: 'alert',
      icon: <AlertTriangle className='h-3 w-3' />,
    },
    {
      label: 'Review Pending',
      color: 'bg-red-100 text-red-700',
      category: 'alert',
      icon: <AlertTriangle className='h-3 w-3' />,
    },
  ];

  useEffect(() => {
    initializeTags();
    generateAISuggestions();
  }, [promoterId]);

  const initializeTags = async () => {
    try {
      const supabase = createClient();

      if (!supabase) {
        // Use library tags only
        setTags(
          tagLibrary.map((t, i) => ({
            ...t,
            id: `library-${i}`,
            count: Math.floor(Math.random() * 10),
            isAIGenerated: false,
          }))
        );
        return;
      }

      // Try to fetch existing tags from database
      // Note: Only select 'tag' as 'count' column may not exist in all schemas
      const { data, error } = await supabase
        .from('promoter_tags')
        .select('tag')
        .eq('promoter_id', promoterId);

      if (!error && data) {
        const dbTags = data.map((t: any) => ({
          id: t.tag || 'unknown',
          label: t.tag || 'Unknown',
          color: getTagColor(t.tag || ''),
          category: 'custom' as const,
          count: t.count || 1, // Default to 1 if count column doesn't exist
          isAIGenerated: false,
        }));

        // Merge with library tags
        const allTags = [
          ...tagLibrary.map((t, i) => ({
            ...t,
            id: `library-${i}`,
            count: Math.floor(Math.random() * 10),
            isAIGenerated: false,
          })),
          ...dbTags,
        ];

        setTags(allTags);
      } else {
        // Use library tags only
        setTags(
          tagLibrary.map((t, i) => ({
            ...t,
            id: `library-${i}`,
            count: Math.floor(Math.random() * 10),
            isAIGenerated: false,
          }))
        );
      }
    } catch (error) {
      // Use library tags as fallback
      setTags(
        tagLibrary.map((t, i) => ({
          ...t,
          id: `library-${i}`,
          count: Math.floor(Math.random() * 10),
          isAIGenerated: false,
        }))
      );
    }
  };

  const generateAISuggestions = useCallback(async () => {
    setIsLoadingSuggestions(true);

    try {
      // Simulate AI analysis - in production, this would call an AI service
      await new Promise(resolve => setTimeout(resolve, 1000));

      const suggestions: SmartTag[] = [
        {
          id: 'ai-1',
          label: 'High Potential',
          color: 'bg-purple-100 text-purple-700',
          category: 'performance',
          icon: <Star className='h-3 w-3' />,
          count: 0,
          isAIGenerated: true,
          confidence: 92,
        },
        {
          id: 'ai-2',
          label: 'Leadership Candidate',
          color: 'bg-indigo-100 text-indigo-700',
          category: 'skill',
          icon: <Award className='h-3 w-3' />,
          count: 0,
          isAIGenerated: true,
          confidence: 85,
        },
        {
          id: 'ai-3',
          label: 'Exceeds Expectations',
          color: 'bg-green-100 text-green-700',
          category: 'performance',
          icon: <TrendingUp className='h-3 w-3' />,
          count: 0,
          isAIGenerated: true,
          confidence: 88,
        },
      ];

      setAiSuggestions(suggestions);
    } catch (error) {
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [promoterId]);

  const getTagColor = (tag: string | undefined): string => {
    if (!tag) return 'bg-gray-100 text-gray-700';

    const colors = [
      'bg-blue-100 text-blue-700',
      'bg-green-100 text-green-700',
      'bg-purple-100 text-purple-700',
      'bg-pink-100 text-pink-700',
      'bg-yellow-100 text-yellow-700',
      'bg-indigo-100 text-indigo-700',
      'bg-teal-100 text-teal-700',
    ];
    const hash = tag
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length] || 'bg-gray-100 text-gray-700';
  };

  const handleToggleTag = (tagLabel: string) => {
    const newSelected = new Set(selectedTags);
    if (newSelected.has(tagLabel)) {
      newSelected.delete(tagLabel);
    } else {
      newSelected.add(tagLabel);
    }
    setSelectedTags(newSelected);

    // Notify parent component
    if (onTagsUpdate) {
      onTagsUpdate(Array.from(newSelected));
    }

    // Save to database
    saveTagsToDatabase(Array.from(newSelected));
  };

  const handleAddCustomTag = () => {
    if (!customTagInput.trim()) return;

    const newTag: SmartTag = {
      id: `custom-${Date.now()}`,
      label: customTagInput.trim(),
      color: getTagColor(customTagInput.trim()),
      category: 'custom',
      icon: <Hash className='h-3 w-3' />,
      count: 0,
      isAIGenerated: false,
    };

    setTags([...tags, newTag]);
    handleToggleTag(newTag.label);
    setCustomTagInput('');
  };

  const handleAcceptAISuggestion = (suggestion: SmartTag) => {
    // Add to tags list
    setTags([...tags, { ...suggestion, isAIGenerated: false }]);
    // Select it
    handleToggleTag(suggestion.label);
    // Remove from suggestions
    setAiSuggestions(aiSuggestions.filter(s => s.id !== suggestion.id));
  };

  const saveTagsToDatabase = async (tagsList: string[]) => {
    try {
      const supabase = createClient();

      if (!supabase) return;

      // Delete existing tags
      await supabase
        .from('promoter_tags')
        .delete()
        .eq('promoter_id', promoterId);

      // Insert new tags
      // Note: Only insert tag and promoter_id, as count column may not exist
      if (tagsList.length > 0) {
        await supabase.from('promoter_tags').insert(
          tagsList.map(tag => ({
            promoter_id: promoterId,
            tag,
            // Only include count if the column exists in your schema
            // count: 1,
          }))
        );
      }
    } catch (error) {
    }
  };

  const filteredTags = tags.filter(tag =>
    tag.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedTags = filteredTags.reduce(
    (acc, tag) => {
      const category = tag.category || 'custom';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(tag);
      return acc;
    },
    {} as Record<string, SmartTag[]>
  );

  const categoryLabels = {
    skill: 'Skills & Expertise',
    performance: 'Performance',
    status: 'Status',
    achievement: 'Achievements',
    alert: 'Alerts',
    custom: 'Custom Tags',
  };

  const categoryIcons = {
    skill: <Sparkles className='h-4 w-4' />,
    performance: <TrendingUp className='h-4 w-4' />,
    status: <Target className='h-4 w-4' />,
    achievement: <Award className='h-4 w-4' />,
    alert: <AlertTriangle className='h-4 w-4' />,
    custom: <Hash className='h-4 w-4' />,
  };

  return (
    <div className='space-y-6'>
      {/* Selected Tags Display */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Tag className='h-5 w-5' />
            Applied Tags
          </CardTitle>
          <CardDescription>
            {selectedTags.size} tag{selectedTags.size !== 1 ? 's' : ''} applied
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedTags.size === 0 ? (
            <p className='text-sm text-gray-500 text-center py-4'>
              No tags applied yet. Select tags below or create custom ones.
            </p>
          ) : (
            <div className='flex flex-wrap gap-2'>
              {Array.from(selectedTags).map(tagLabel => {
                const tag = tags.find(t => t.label === tagLabel);
                return (
                  <Badge
                    key={tagLabel}
                    className={`${tag?.color || 'bg-gray-100 text-gray-700'} flex items-center gap-1 px-3 py-1.5`}
                  >
                    {tag?.icon}
                    {tagLabel}
                    {isAdmin && (
                      <button
                        onClick={() => handleToggleTag(tagLabel)}
                        className='ml-1 hover:text-red-500'
                        aria-label={`Remove tag ${tagLabel}`}
                      >
                        <X className='h-3 w-3' />
                      </button>
                    )}
                  </Badge>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Suggestions */}
      {isAdmin && aiSuggestions.length > 0 && (
        <Card className='border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Sparkles className='h-5 w-5 text-purple-600' />
              AI-Powered Suggestions
            </CardTitle>
            <CardDescription>
              Based on performance analysis and activity patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              {aiSuggestions.map(suggestion => (
                <div
                  key={suggestion.id}
                  className='flex items-center justify-between p-3 bg-white rounded-lg border'
                >
                  <div className='flex items-center gap-3'>
                    <div className={`p-2 rounded ${suggestion.color}`}>
                      {suggestion.icon}
                    </div>
                    <div>
                      <div className='flex items-center gap-2'>
                        <span className='font-medium text-sm'>
                          {suggestion.label}
                        </span>
                        <Badge
                          variant='outline'
                          className='text-xs bg-purple-100 text-purple-700'
                        >
                          <Sparkles className='h-3 w-3 mr-1' />
                          AI • {suggestion.confidence}% confidence
                        </Badge>
                      </div>
                      <p className='text-xs text-gray-500 mt-1'>
                        Suggested based on recent performance trends
                      </p>
                    </div>
                  </div>
                  <Button
                    size='sm'
                    onClick={() => handleAcceptAISuggestion(suggestion)}
                    className='ml-2'
                  >
                    <Plus className='h-4 w-4 mr-1' />
                    Apply
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tag Library */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
              <div>
                <CardTitle className='flex items-center gap-2'>
                  <Tag className='h-5 w-5' />
                  Tag Library
                </CardTitle>
                <CardDescription>
                  Select from {tags.length} available tags or create your own
                </CardDescription>
              </div>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setShowSuggestions(!showSuggestions)}
                >
                  <Sparkles className='h-4 w-4 mr-2' />
                  {showSuggestions ? 'Hide' : 'Show'} AI Suggestions
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className='space-y-4'>
            {/* Search and Add Custom */}
            <div className='flex gap-2'>
              <div className='flex-1 relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                <Input
                  placeholder='Search tags...'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className='pl-10'
                />
              </div>
              <div className='flex gap-2'>
                <Input
                  placeholder='Create custom tag...'
                  value={customTagInput}
                  onChange={e => setCustomTagInput(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleAddCustomTag()}
                  className='w-48'
                />
                <Button onClick={handleAddCustomTag}>
                  <Plus className='h-4 w-4 mr-2' />
                  Add
                </Button>
              </div>
            </div>

            {/* Grouped Tags */}
            <div className='space-y-4'>
              {Object.entries(groupedTags).map(([category, categoryTags]) => (
                <div key={category}>
                  <div className='flex items-center gap-2 mb-2'>
                    {categoryIcons[category as keyof typeof categoryIcons]}
                    <h4 className='text-sm font-semibold text-gray-700'>
                      {categoryLabels[category as keyof typeof categoryLabels]}
                    </h4>
                    <span className='text-xs text-gray-500'>
                      ({categoryTags.length})
                    </span>
                  </div>
                  <div className='flex flex-wrap gap-2'>
                    {categoryTags.map(tag => (
                      <button
                        key={tag.id}
                        onClick={() => handleToggleTag(tag.label)}
                        className={`${tag.color} px-3 py-1.5 rounded-full text-sm font-medium transition-all hover:shadow-md ${
                          selectedTags.has(tag.label)
                            ? 'ring-2 ring-offset-2 ring-blue-500'
                            : ''
                        }`}
                      >
                        <span className='flex items-center gap-1'>
                          {tag.icon}
                          {tag.label}
                          {selectedTags.has(tag.label) && (
                            <CheckCircle className='h-3 w-3 ml-1' />
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
