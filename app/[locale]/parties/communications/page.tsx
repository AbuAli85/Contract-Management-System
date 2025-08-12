'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  MessageSquare,
  Send,
  Search,
  Filter,
  Phone,
  Mail,
  Calendar,
} from 'lucide-react';

export default function PartiesCommunicationsPage() {
  return (
    <div className='container mx-auto space-y-6 py-6'>
      <div className='flex items-center gap-3'>
        <MessageSquare className='h-8 w-8' />
        <div>
          <h1 className='text-3xl font-bold'>Party Communications</h1>
          <p className='text-muted-foreground'>
            Manage communications with all parties
          </p>
        </div>
      </div>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Messages
            </CardTitle>
            <MessageSquare className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>1,234</div>
            <p className='text-xs text-muted-foreground'>+156 this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Unread</CardTitle>
            <Mail className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>23</div>
            <p className='text-xs text-muted-foreground'>Requires attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Response Rate</CardTitle>
            <Send className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>94.2%</div>
            <p className='text-xs text-muted-foreground'>
              +2.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Avg Response Time
            </CardTitle>
            <Calendar className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>2.3h</div>
            <p className='text-xs text-muted-foreground'>
              -0.5h from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        <div className='lg:col-span-2'>
          <Card>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <div>
                  <CardTitle>Recent Communications</CardTitle>
                  <CardDescription>
                    Latest messages and interactions
                  </CardDescription>
                </div>
                <div className='flex items-center gap-2'>
                  <div className='relative'>
                    <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400' />
                    <Input
                      placeholder='Search messages...'
                      className='w-64 pl-10'
                    />
                  </div>
                  <Button variant='outline' size='sm'>
                    <Filter className='mr-2 h-4 w-4' />
                    Filter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div
                    key={i}
                    className='flex items-start gap-4 rounded-lg border p-4 transition-shadow hover:shadow-md'
                  >
                    <div className='flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 font-bold text-white'>
                      {String.fromCharCode(65 + (i % 26))}
                    </div>
                    <div className='flex-1'>
                      <div className='mb-2 flex items-center justify-between'>
                        <h3 className='font-semibold'>Company {i}</h3>
                        <div className='flex items-center gap-2'>
                          <Badge
                            variant={i % 3 === 0 ? 'default' : 'secondary'}
                          >
                            {i % 3 === 0
                              ? 'Urgent'
                              : i % 3 === 1
                                ? 'Important'
                                : 'Normal'}
                          </Badge>
                          <span className='text-xs text-muted-foreground'>
                            {i} hour{i !== 1 ? 's' : ''} ago
                          </span>
                        </div>
                      </div>
                      <p className='mb-2 text-sm text-muted-foreground'>
                        Subject: Contract {1000 + i} -{' '}
                        {i % 2 === 0 ? 'Approval Request' : 'Status Update'}
                      </p>
                      <p className='text-sm'>
                        {i % 2 === 0
                          ? 'We would like to discuss the terms of the contract and request some modifications...'
                          : 'Thank you for your prompt response. We have reviewed the contract and...'}
                      </p>
                      <div className='mt-3 flex items-center gap-4'>
                        <Button variant='outline' size='sm'>
                          <Mail className='mr-2 h-4 w-4' />
                          Reply
                        </Button>
                        <Button variant='outline' size='sm'>
                          <Phone className='mr-2 h-4 w-4' />
                          Call
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common communication tasks</CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
              <Button className='w-full justify-start' variant='outline'>
                <Mail className='mr-2 h-4 w-4' />
                Send Email
              </Button>
              <Button className='w-full justify-start' variant='outline'>
                <Phone className='mr-2 h-4 w-4' />
                Schedule Call
              </Button>
              <Button className='w-full justify-start' variant='outline'>
                <MessageSquare className='mr-2 h-4 w-4' />
                Send Message
              </Button>
              <Button className='w-full justify-start' variant='outline'>
                <Calendar className='mr-2 h-4 w-4' />
                Schedule Meeting
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Communication Stats</CardTitle>
              <CardDescription>
                This month's communication metrics
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center justify-between'>
                <span className='text-sm'>Emails Sent</span>
                <Badge variant='secondary'>234</Badge>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm'>Calls Made</span>
                <Badge variant='secondary'>45</Badge>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm'>Meetings Scheduled</span>
                <Badge variant='secondary'>12</Badge>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm'>Messages Sent</span>
                <Badge variant='secondary'>89</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Send Quick Message</CardTitle>
              <CardDescription>
                Send a message to selected parties
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <Input placeholder='To: Select parties...' />
              <Input placeholder='Subject...' />
              <Textarea placeholder='Message content...' rows={4} />
              <Button className='w-full'>
                <Send className='mr-2 h-4 w-4' />
                Send Message
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
