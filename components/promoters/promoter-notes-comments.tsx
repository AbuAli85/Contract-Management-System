'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageSquare, 
  Send, 
  Trash2, 
  Edit2, 
  Pin, 
  Clock,
  User,
  Tag,
  AlertCircle,
  CheckCircle,
  Info,
  X,
  Plus,
  Search,
  Filter
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { createClient } from '@/lib/supabase/client';

interface Note {
  id: string;
  promoter_id: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  content: string;
  category: 'general' | 'performance' | 'alert' | 'achievement' | 'document';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  is_pinned: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
  mentions?: string[];
}

interface PromoterNotesCommentsProps {
  promoterId: string;
  isAdmin: boolean;
  currentUserId: string;
  currentUserName: string;
}

export function PromoterNotesComments({
  promoterId,
  isAdmin,
  currentUserId,
  currentUserName
}: PromoterNotesCommentsProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Note['category']>('general');
  const [selectedPriority, setSelectedPriority] = useState<Note['priority']>('medium');
  const [newTags, setNewTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | Note['category']>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Load notes
  useEffect(() => {
    fetchNotes();
  }, [promoterId]);

  const fetchNotes = useCallback(async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      
      if (!supabase) {
        setNotes(getSampleNotes());
        return;
      }
      
      // Try to fetch from database
      const { data, error } = await supabase
        .from('promoter_notes')
        .select('*')
        .eq('promoter_id', promoterId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setNotes(data as Note[]);
      } else {
        // Fallback to sample data if table doesn't exist
        setNotes(getSampleNotes());
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
      setNotes(getSampleNotes());
    } finally {
      setIsLoading(false);
    }
  }, [promoterId]);

  const getSampleNotes = (): Note[] => {
    return [
      {
        id: '1',
        promoter_id: promoterId,
        author_id: currentUserId,
        author_name: currentUserName || 'System Admin',
        content: 'Excellent performance this month. Completed all assigned tasks ahead of schedule.',
        category: 'achievement',
        priority: 'medium',
        is_pinned: true,
        tags: ['performance', 'achievement'],
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '2',
        promoter_id: promoterId,
        author_id: currentUserId,
        author_name: 'HR Manager',
        content: 'ID card renewal required by end of next month. Please schedule appointment.',
        category: 'alert',
        priority: 'high',
        is_pinned: false,
        tags: ['document', 'urgent'],
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '3',
        promoter_id: promoterId,
        author_id: currentUserId,
        author_name: 'Team Lead',
        content: 'Great feedback from client on recent project. Customer satisfaction rating: 5/5.',
        category: 'performance',
        priority: 'medium',
        is_pinned: false,
        tags: ['feedback', 'client'],
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ];
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    setIsSaving(true);
    try {
      const newNoteObj: Note = {
        id: Date.now().toString(),
        promoter_id: promoterId,
        author_id: currentUserId,
        author_name: currentUserName || 'User',
        content: newNote,
        category: selectedCategory,
        priority: selectedPriority,
        is_pinned: false,
        tags: newTags,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Try to save to database
      const supabase = createClient();
      
      if (supabase) {
        const { error } = await supabase
          .from('promoter_notes')
          .insert([newNoteObj]);

        if (error) {
          console.warn('Database insert failed, using local state:', error);
        }
      }

      // Update local state regardless
      setNotes(prev => [newNoteObj, ...prev]);
      
      // Reset form
      setNewNote('');
      setNewTags([]);
      setTagInput('');
      setSelectedCategory('general');
      setSelectedPriority('medium');
    } catch (error) {
      console.error('Error adding note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const supabase = createClient();
      
      if (supabase) {
        await supabase
          .from('promoter_notes')
          .delete()
          .eq('id', noteId);
      }

      setNotes(prev => prev.filter(note => note.id !== noteId));
    } catch (error) {
      console.error('Error deleting note:', error);
      setNotes(prev => prev.filter(note => note.id !== noteId));
    }
  };

  const handleTogglePin = async (noteId: string) => {
    try {
      const note = notes.find(n => n.id === noteId);
      if (!note) return;

      const supabase = createClient();
      
      if (supabase) {
        await supabase
          .from('promoter_notes')
          .update({ is_pinned: !note.is_pinned })
          .eq('id', noteId);
      }

      setNotes(prev => prev.map(n => 
        n.id === noteId ? { ...n, is_pinned: !n.is_pinned } : n
      ));
    } catch (error) {
      console.error('Error toggling pin:', error);
      setNotes(prev => prev.map(n => 
        n.id === noteId ? { ...n, is_pinned: !n.is_pinned } : n
      ));
    }
  };

  const handleEditNote = (noteId: string, content: string) => {
    setEditingNoteId(noteId);
    setEditContent(content);
  };

  const handleSaveEdit = async (noteId: string) => {
    if (!editContent.trim()) return;

    try {
      const supabase = createClient();
      
      if (supabase) {
        await supabase
          .from('promoter_notes')
          .update({ 
            content: editContent,
            updated_at: new Date().toISOString()
          })
          .eq('id', noteId);
      }

      setNotes(prev => prev.map(n => 
        n.id === noteId 
          ? { ...n, content: editContent, updated_at: new Date().toISOString() }
          : n
      ));
      
      setEditingNoteId(null);
      setEditContent('');
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !newTags.includes(tagInput.trim())) {
      setNewTags([...newTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setNewTags(newTags.filter(t => t !== tag));
  };

  const getCategoryIcon = (category: Note['category']) => {
    switch (category) {
      case 'performance': return <CheckCircle className="h-4 w-4" />;
      case 'alert': return <AlertCircle className="h-4 w-4" />;
      case 'achievement': return <CheckCircle className="h-4 w-4" />;
      case 'document': return <Info className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: Note['category']) => {
    switch (category) {
      case 'performance': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'alert': return 'bg-red-100 text-red-700 border-red-200';
      case 'achievement': return 'bg-green-100 text-green-700 border-green-200';
      case 'document': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority: Note['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
    }
  };

  // Filter and search notes
  const filteredNotes = notes
    .filter(note => {
      if (filterCategory !== 'all' && note.category !== filterCategory) return false;
      if (searchQuery && !note.content.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      // Pinned notes first
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      // Then by date
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Notes & Comments
              </CardTitle>
              <CardDescription>
                Track important information and conversations ({notes.length} notes)
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? 'Hide' : 'Show'} Filters
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Filters */}
          {showFilters && (
            <div className="flex flex-col sm:flex-row gap-3 p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search notes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                {(['all', 'general', 'performance', 'alert', 'achievement', 'document'] as const).map((cat) => (
                  <Button
                    key={cat}
                    variant={filterCategory === cat ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterCategory(cat)}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Add New Note */}
          <div className="space-y-3 p-4 border rounded-lg bg-white">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{currentUserName?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  placeholder="Add a note or comment..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
            
            {/* Note Options */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Category:</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as Note['category'])}
                  className="text-sm border rounded px-2 py-1"
                  aria-label="Select note category"
                >
                  <option value="general">General</option>
                  <option value="performance">Performance</option>
                  <option value="alert">Alert</option>
                  <option value="achievement">Achievement</option>
                  <option value="document">Document</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Priority:</label>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value as Note['priority'])}
                  className="text-sm border rounded px-2 py-1"
                  aria-label="Select note priority"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div className="flex items-center gap-2 flex-1">
                <Input
                  placeholder="Add tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  className="text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddTag}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <Button
                onClick={handleAddNote}
                disabled={!newNote.trim() || isSaving}
                size="sm"
              >
                <Send className="h-4 w-4 mr-2" />
                {isSaving ? 'Posting...' : 'Post Note'}
              </Button>
            </div>

            {/* Tags Display */}
            {newTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {newTags.map((tag) => (
                  <Badge key={tag} variant="outline" className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-red-500"
                      aria-label={`Remove tag ${tag}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Notes List */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">
                Loading notes...
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No notes yet. Add your first note above!</p>
              </div>
            ) : (
              filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className={`p-4 border rounded-lg ${note.is_pinned ? 'border-blue-300 bg-blue-50' : 'bg-white'}`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      {note.author_avatar ? (
                        <AvatarImage src={note.author_avatar} />
                      ) : (
                        <AvatarFallback>{note.author_name?.charAt(0) || 'U'}</AvatarFallback>
                      )}
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{note.author_name}</span>
                          <Badge variant="outline" className={`${getCategoryColor(note.category)} flex items-center gap-1`}>
                            {getCategoryIcon(note.category)}
                            {note.category}
                          </Badge>
                          <Badge className={getPriorityColor(note.priority)}>
                            {note.priority}
                          </Badge>
                          {note.is_pinned && (
                            <Badge variant="outline" className="bg-blue-100 text-blue-700">
                              <Pin className="h-3 w-3 mr-1" />
                              Pinned
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTogglePin(note.id)}
                            className="h-7 w-7 p-0"
                          >
                            <Pin className={`h-4 w-4 ${note.is_pinned ? 'fill-current' : ''}`} />
                          </Button>
                          {isAdmin && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditNote(note.id, note.content)}
                                className="h-7 w-7 p-0"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteNote(note.id)}
                                className="h-7 w-7 p-0 hover:text-red-500"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {editingNoteId === note.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            rows={3}
                            className="resize-none"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleSaveEdit(note.id)}>
                              Save
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setEditingNoteId(null)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                      )}
                      
                      {note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {note.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              <Tag className="h-3 w-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                        </span>
                        {note.updated_at !== note.created_at && (
                          <span className="text-gray-400">(edited)</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

