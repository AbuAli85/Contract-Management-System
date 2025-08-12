'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Mail,
  Phone,
  MessageCircle,
  Users,
  Plus,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { PromoterCommunication, PromoterTask, PromoterNote } from '@/lib/types';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

interface PromoterCRMProps {
  promoterId: string;
  isAdmin: boolean;
}

export function PromoterCRM({ promoterId, isAdmin }: PromoterCRMProps) {
  const [activeTab, setActiveTab] = useState('communications');
  const [communications, setCommunications] = useState<PromoterCommunication[]>(
    []
  );
  const [tasks, setTasks] = useState<PromoterTask[]>([]);
  const [notes, setNotes] = useState<PromoterNote[]>([]);
  const [isCommDialogOpen, setIsCommDialogOpen] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Communication form
  const [commForm, setCommForm] = useState({
    type: '',
    subject: '',
    description: '',
    communication_time: format(new Date(), 'yyyy-MM-ddTHH:mm'),
    outcome: '',
    status: 'completed',
    participants: [],
    attachments: [],
  });

  // Task form
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    due_date: '',
    status: 'pending',
    priority: 'medium',
    assigned_to: '',
    related_communication: '',
  });

  // Note form
  const [noteForm, setNoteForm] = useState({
    content: '',
    note_time: format(new Date(), 'yyyy-MM-ddTHH:mm'),
    visibility: 'team',
    related_communication: '',
    related_task: '',
  });

  // Fetch data
  useEffect(() => {
    fetchCommunications();
    fetchTasks();
    fetchNotes();
  }, [promoterId]);

  const fetchCommunications = async () => {
    try {
      const response = await fetch(
        `/api/promoters/${promoterId}/communications`
      );
      if (response.ok) {
        const data = await response.json();
        setCommunications(data);
      }
    } catch (error) {
      console.error('Error fetching communications:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch(`/api/promoters/${promoterId}/tasks`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchNotes = async () => {
    try {
      const response = await fetch(`/api/promoters/${promoterId}/notes`);
      if (response.ok) {
        const data = await response.json();
        setNotes(data);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  // Communication handlers
  const handleCommSubmit = async () => {
    try {
      const url = `/api/promoters/${promoterId}/communications`;
      const method = editingItem ? 'PUT' : 'POST';
      const body = editingItem ? { id: editingItem.id, ...commForm } : commForm;
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (response.ok) {
        const newComm = await response.json();
        if (editingItem) {
          setCommunications(
            communications.map(c => (c.id === editingItem.id ? newComm : c))
          );
        } else {
          setCommunications([newComm, ...communications]);
        }
        setCommForm({
          type: '',
          subject: '',
          description: '',
          communication_time: format(new Date(), 'yyyy-MM-ddTHH:mm'),
          outcome: '',
          status: 'completed',
          participants: [],
          attachments: [],
        });
        setEditingItem(null);
        setIsCommDialogOpen(false);
        toast.success(
          editingItem ? 'Communication updated' : 'Communication added'
        );
      }
    } catch (error) {
      toast.error('Failed to save communication');
    }
  };

  const handleCommDelete = async (id: string) => {
    try {
      const response = await fetch(
        `/api/promoters/${promoterId}/communications`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        }
      );
      if (response.ok) {
        setCommunications(communications.filter(c => c.id !== id));
        toast.success('Communication deleted');
      }
    } catch (error) {
      toast.error('Failed to delete communication');
    }
  };

  // Task handlers
  const handleTaskSubmit = async () => {
    try {
      const url = `/api/promoters/${promoterId}/tasks`;
      const method = editingItem ? 'PUT' : 'POST';
      const body = editingItem ? { id: editingItem.id, ...taskForm } : taskForm;
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (response.ok) {
        const newTask = await response.json();
        if (editingItem) {
          setTasks(tasks.map(t => (t.id === editingItem.id ? newTask : t)));
        } else {
          setTasks([newTask, ...tasks]);
        }
        setTaskForm({
          title: '',
          description: '',
          due_date: '',
          status: 'pending',
          priority: 'medium',
          assigned_to: '',
          related_communication: '',
        });
        setEditingItem(null);
        setIsTaskDialogOpen(false);
        toast.success(editingItem ? 'Task updated' : 'Task added');
      }
    } catch (error) {
      toast.error('Failed to save task');
    }
  };

  const handleTaskDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/promoters/${promoterId}/tasks`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (response.ok) {
        setTasks(tasks.filter(t => t.id !== id));
        toast.success('Task deleted');
      }
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  // Note handlers
  const handleNoteSubmit = async () => {
    try {
      const url = `/api/promoters/${promoterId}/notes`;
      const method = editingItem ? 'PUT' : 'POST';
      const body = editingItem ? { id: editingItem.id, ...noteForm } : noteForm;
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (response.ok) {
        const newNote = await response.json();
        if (editingItem) {
          setNotes(notes.map(n => (n.id === editingItem.id ? newNote : n)));
        } else {
          setNotes([newNote, ...notes]);
        }
        setNoteForm({
          content: '',
          note_time: format(new Date(), 'yyyy-MM-ddTHH:mm'),
          visibility: 'team',
          related_communication: '',
          related_task: '',
        });
        setEditingItem(null);
        setIsNoteDialogOpen(false);
        toast.success(editingItem ? 'Note updated' : 'Note added');
      }
    } catch (error) {
      toast.error('Failed to save note');
    }
  };

  const handleNoteDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/promoters/${promoterId}/notes`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (response.ok) {
        setNotes(notes.filter(n => n.id !== id));
        toast.success('Note deleted');
      }
    } catch (error) {
      toast.error('Failed to delete note');
    }
  };

  const openEditDialog = (item: any, type: string) => {
    setEditingItem(item);
    if (type === 'communication') {
      setCommForm({
        type: item.type,
        subject: item.subject || '',
        description: item.description || '',
        communication_time: item.communication_time,
        outcome: item.outcome || '',
        status: item.status || 'completed',
        participants: item.participants || [],
        attachments: item.attachments || [],
      });
      setIsCommDialogOpen(true);
    } else if (type === 'task') {
      setTaskForm({
        title: item.title,
        description: item.description || '',
        due_date: item.due_date || '',
        status: item.status || 'pending',
        priority: item.priority || 'medium',
        assigned_to: item.assigned_to || '',
        related_communication: item.related_communication || '',
      });
      setIsTaskDialogOpen(true);
    } else if (type === 'note') {
      setNoteForm({
        content: item.content,
        note_time: item.note_time || format(new Date(), 'yyyy-MM-ddTHH:mm'),
        visibility: item.visibility || 'team',
        related_communication: item.related_communication || '',
        related_task: item.related_task || '',
      });
      setIsNoteDialogOpen(true);
    }
  };

  // Timeline data
  const timelineData = [
    ...communications.map(c => ({
      type: 'communication',
      time: c.communication_time,
      title: c.subject || c.type,
      description: c.description,
      icon:
        c.type === 'call' ? (
          <Phone />
        ) : c.type === 'email' ? (
          <Mail />
        ) : c.type === 'meeting' ? (
          <Users />
        ) : (
          <MessageCircle />
        ),
      status: c.status,
      id: c.id,
    })),
    ...tasks.map(t => ({
      type: 'task',
      time: t.due_date,
      title: t.title,
      description: t.description,
      icon: <CheckCircle />,
      status: t.status,
      id: t.id,
    })),
    ...notes.map(n => ({
      type: 'note',
      time: n.note_time,
      title: 'Note',
      description: n.content,
      icon: <FileText />,
      status: n.visibility,
      id: n.id,
    })),
  ].sort((a, b) => (b.time || '').localeCompare(a.time || ''));

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className='p-6'>
          <p className='text-center text-muted-foreground'>
            CRM features are restricted to administrators.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className='grid w-full grid-cols-4'>
          <TabsTrigger value='communications'>Communications</TabsTrigger>
          <TabsTrigger value='tasks'>Tasks</TabsTrigger>
          <TabsTrigger value='notes'>Notes</TabsTrigger>
          <TabsTrigger value='timeline'>Timeline</TabsTrigger>
        </TabsList>

        {/* Communications Tab */}
        <TabsContent value='communications' className='space-y-6'>
          <div className='flex items-center justify-between'>
            <h3 className='text-lg font-semibold'>Communications Log</h3>
            <Dialog open={isCommDialogOpen} onOpenChange={setIsCommDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className='mr-2 h-4 w-4' />
                  Add Communication
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? 'Edit Communication' : 'Add Communication'}
                  </DialogTitle>
                </DialogHeader>
                <div className='space-y-4'>
                  <div>
                    <Label htmlFor='comm-type'>Type</Label>
                    <Select
                      value={commForm.type}
                      onValueChange={v => setCommForm({ ...commForm, type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select type' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='call'>Call</SelectItem>
                        <SelectItem value='email'>Email</SelectItem>
                        <SelectItem value='meeting'>Meeting</SelectItem>
                        <SelectItem value='sms'>SMS</SelectItem>
                        <SelectItem value='whatsapp'>WhatsApp</SelectItem>
                        <SelectItem value='other'>Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor='comm-subject'>Subject</Label>
                    <Input
                      id='comm-subject'
                      value={commForm.subject}
                      onChange={e =>
                        setCommForm({ ...commForm, subject: e.target.value })
                      }
                      placeholder='Subject or title'
                    />
                  </div>
                  <div>
                    <Label htmlFor='comm-description'>Description</Label>
                    <Textarea
                      id='comm-description'
                      value={commForm.description}
                      onChange={e =>
                        setCommForm({
                          ...commForm,
                          description: e.target.value,
                        })
                      }
                      placeholder='Details of the communication'
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor='comm-time'>Date & Time</Label>
                    <Input
                      id='comm-time'
                      type='datetime-local'
                      value={commForm.communication_time}
                      onChange={e =>
                        setCommForm({
                          ...commForm,
                          communication_time: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor='comm-outcome'>Outcome</Label>
                    <Input
                      id='comm-outcome'
                      value={commForm.outcome}
                      onChange={e =>
                        setCommForm({ ...commForm, outcome: e.target.value })
                      }
                      placeholder='Outcome or status'
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant='outline'
                    onClick={() => {
                      setIsCommDialogOpen(false);
                      setEditingItem(null);
                      setCommForm({
                        type: '',
                        subject: '',
                        description: '',
                        communication_time: format(
                          new Date(),
                          'yyyy-MM-ddTHH:mm'
                        ),
                        outcome: '',
                        status: 'completed',
                        participants: [],
                        attachments: [],
                      });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCommSubmit}>
                    {editingItem ? 'Update' : 'Add'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className='space-y-4'>
            {communications.map(comm => (
              <Card key={comm.id}>
                <CardContent className='flex items-center justify-between p-4'>
                  <div>
                    <div className='mb-1 flex items-center gap-2'>
                      {comm.type === 'call' ? (
                        <Phone className='h-4 w-4' />
                      ) : comm.type === 'email' ? (
                        <Mail className='h-4 w-4' />
                      ) : comm.type === 'meeting' ? (
                        <Users className='h-4 w-4' />
                      ) : (
                        <MessageCircle className='h-4 w-4' />
                      )}
                      <span className='font-semibold'>
                        {comm.subject || comm.type}
                      </span>
                      <Badge variant='outline'>{comm.status}</Badge>
                    </div>
                    <div className='mb-1 text-sm text-muted-foreground'>
                      {comm.description}
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      {format(parseISO(comm.communication_time), 'PPpp')}
                    </div>
                  </div>
                  <div className='flex gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => openEditDialog(comm, 'communication')}
                    >
                      <Edit className='h-4 w-4' />
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => handleCommDelete(comm.id)}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {communications.length === 0 && (
              <Card>
                <CardContent className='p-8 text-center text-muted-foreground'>
                  No communications logged yet.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value='tasks' className='space-y-6'>
          <div className='flex items-center justify-between'>
            <h3 className='text-lg font-semibold'>Tasks</h3>
            <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className='mr-2 h-4 w-4' />
                  Add Task
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? 'Edit Task' : 'Add Task'}
                  </DialogTitle>
                </DialogHeader>
                <div className='space-y-4'>
                  <div>
                    <Label htmlFor='task-title'>Title</Label>
                    <Input
                      id='task-title'
                      value={taskForm.title}
                      onChange={e =>
                        setTaskForm({ ...taskForm, title: e.target.value })
                      }
                      placeholder='Task title'
                    />
                  </div>
                  <div>
                    <Label htmlFor='task-description'>Description</Label>
                    <Textarea
                      id='task-description'
                      value={taskForm.description}
                      onChange={e =>
                        setTaskForm({
                          ...taskForm,
                          description: e.target.value,
                        })
                      }
                      placeholder='Task details'
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor='task-due'>Due Date</Label>
                    <Input
                      id='task-due'
                      type='datetime-local'
                      value={taskForm.due_date}
                      onChange={e =>
                        setTaskForm({ ...taskForm, due_date: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor='task-priority'>Priority</Label>
                    <Select
                      value={taskForm.priority}
                      onValueChange={v =>
                        setTaskForm({ ...taskForm, priority: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select priority' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='low'>Low</SelectItem>
                        <SelectItem value='medium'>Medium</SelectItem>
                        <SelectItem value='high'>High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor='task-status'>Status</Label>
                    <Select
                      value={taskForm.status}
                      onValueChange={v =>
                        setTaskForm({ ...taskForm, status: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select status' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='pending'>Pending</SelectItem>
                        <SelectItem value='in_progress'>In Progress</SelectItem>
                        <SelectItem value='completed'>Completed</SelectItem>
                        <SelectItem value='overdue'>Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant='outline'
                    onClick={() => {
                      setIsTaskDialogOpen(false);
                      setEditingItem(null);
                      setTaskForm({
                        title: '',
                        description: '',
                        due_date: '',
                        status: 'pending',
                        priority: 'medium',
                        assigned_to: '',
                        related_communication: '',
                      });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleTaskSubmit}>
                    {editingItem ? 'Update' : 'Add'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className='space-y-4'>
            {tasks.map(task => (
              <Card key={task.id}>
                <CardContent className='flex items-center justify-between p-4'>
                  <div>
                    <div className='mb-1 flex items-center gap-2'>
                      <CheckCircle className='h-4 w-4' />
                      <span className='font-semibold'>{task.title}</span>
                      <Badge variant='outline'>{task.status}</Badge>
                      <Badge variant='secondary'>{task.priority}</Badge>
                    </div>
                    <div className='mb-1 text-sm text-muted-foreground'>
                      {task.description}
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      Due:{' '}
                      {task.due_date
                        ? format(parseISO(task.due_date), 'PPpp')
                        : 'N/A'}
                    </div>
                  </div>
                  <div className='flex gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => openEditDialog(task, 'task')}
                    >
                      <Edit className='h-4 w-4' />
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => handleTaskDelete(task.id)}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {tasks.length === 0 && (
              <Card>
                <CardContent className='p-8 text-center text-muted-foreground'>
                  No tasks yet.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value='notes' className='space-y-6'>
          <div className='flex items-center justify-between'>
            <h3 className='text-lg font-semibold'>Notes</h3>
            <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className='mr-2 h-4 w-4' />
                  Add Note
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? 'Edit Note' : 'Add Note'}
                  </DialogTitle>
                </DialogHeader>
                <div className='space-y-4'>
                  <div>
                    <Label htmlFor='note-content'>Content</Label>
                    <Textarea
                      id='note-content'
                      value={noteForm.content}
                      onChange={e =>
                        setNoteForm({ ...noteForm, content: e.target.value })
                      }
                      placeholder='Note content'
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor='note-time'>Date & Time</Label>
                    <Input
                      id='note-time'
                      type='datetime-local'
                      value={noteForm.note_time}
                      onChange={e =>
                        setNoteForm({ ...noteForm, note_time: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor='note-visibility'>Visibility</Label>
                    <Select
                      value={noteForm.visibility}
                      onValueChange={v =>
                        setNoteForm({ ...noteForm, visibility: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select visibility' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='private'>Private</SelectItem>
                        <SelectItem value='team'>Team</SelectItem>
                        <SelectItem value='admin'>Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant='outline'
                    onClick={() => {
                      setIsNoteDialogOpen(false);
                      setEditingItem(null);
                      setNoteForm({
                        content: '',
                        note_time: format(new Date(), 'yyyy-MM-ddTHH:mm'),
                        visibility: 'team',
                        related_communication: '',
                        related_task: '',
                      });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleNoteSubmit}>
                    {editingItem ? 'Update' : 'Add'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className='space-y-4'>
            {notes.map(note => (
              <Card key={note.id}>
                <CardContent className='flex items-center justify-between p-4'>
                  <div>
                    <div className='mb-1 flex items-center gap-2'>
                      <FileText className='h-4 w-4' />
                      <span className='font-semibold'>Note</span>
                      <Badge variant='outline'>{note.visibility}</Badge>
                    </div>
                    <div className='mb-1 text-sm text-muted-foreground'>
                      {note.content}
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      {note.note_time
                        ? format(parseISO(note.note_time), 'PPpp')
                        : ''}
                    </div>
                  </div>
                  <div className='flex gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => openEditDialog(note, 'note')}
                    >
                      <Edit className='h-4 w-4' />
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => handleNoteDelete(note.id)}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {notes.length === 0 && (
              <Card>
                <CardContent className='p-8 text-center text-muted-foreground'>
                  No notes yet.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value='timeline' className='space-y-6'>
          <div className='flex items-center justify-between'>
            <h3 className='text-lg font-semibold'>Unified Timeline</h3>
          </div>
          <div className='space-y-4'>
            {timelineData.map((item, idx) => (
              <Card key={`${item.type}-${item.id}-${idx}`}>
                <CardContent className='flex items-center gap-4 p-4'>
                  <div>{item.icon}</div>
                  <div className='flex-1'>
                    <div className='mb-1 flex items-center gap-2'>
                      <span className='font-semibold'>{item.title}</span>
                      <Badge variant='outline'>{item.type}</Badge>
                      <Badge variant='secondary'>{item.status}</Badge>
                    </div>
                    <div className='mb-1 text-sm text-muted-foreground'>
                      {item.description}
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      {item.time ? format(parseISO(item.time), 'PPpp') : ''}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {timelineData.length === 0 && (
              <Card>
                <CardContent className='p-8 text-center text-muted-foreground'>
                  No CRM activity yet.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
