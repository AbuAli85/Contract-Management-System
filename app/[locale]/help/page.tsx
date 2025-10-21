'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  HelpCircle,
  Book,
  Video,
  Mail,
  MessageCircle,
  Phone,
  Search,
  FileText,
  Users,
  FileCheck,
  Settings,
  Shield,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const quickLinks = [
    {
      title: 'Getting Started',
      description: 'Learn the basics of using the platform',
      icon: Book,
      href: '#getting-started',
    },
    {
      title: 'Video Tutorials',
      description: 'Watch step-by-step guides',
      icon: Video,
      href: '#tutorials',
    },
    {
      title: 'Contact Support',
      description: 'Get help from our team',
      icon: Mail,
      href: '#support',
    },
    {
      title: 'FAQs',
      description: 'Find answers to common questions',
      icon: HelpCircle,
      href: '#faqs',
    },
  ];

  const faqs = [
    {
      category: 'Promoters Management',
      questions: [
        {
          question: 'What is the difference between Promoters Intelligence Hub and Promoters List?',
          answer:
            'The Promoters Intelligence Hub provides analytics, insights, and performance dashboards with visual data representations. The Promoters List is a detailed table view where you can view, search, filter, and manage individual promoter records.',
        },
        {
          question: 'How do I add a new promoter?',
          answer:
            'Navigate to the Promoters List page and click the "Add Promoter" button. Fill in the required information including personal details, documents, and employment information.',
        },
        {
          question: 'How can I track document expiration dates?',
          answer:
            'The Promoters Intelligence Hub displays document health status and at-risk promoters with expiring documents. You can also view individual document expiry dates in the Promoters List.',
        },
      ],
    },
    {
      category: 'Contract Management',
      questions: [
        {
          question: 'What types of contracts can I generate?',
          answer:
            'You can generate Simple Contracts (employment-focused) and General Contracts (business agreements). Both support bilingual (Arabic/English) formats and PDF generation.',
        },
        {
          question: 'How do I view pending contracts?',
          answer:
            'Navigate to Contracts > Pending to see all contracts awaiting approval. You can filter by status, search by contract number, and view detailed information.',
        },
        {
          question: 'Can I download contracts as PDF?',
          answer:
            'Yes, all generated contracts can be downloaded as PDF files. Look for the download icon in the contract details or use the bulk download feature.',
        },
      ],
    },
    {
      category: 'User Management',
      questions: [
        {
          question: 'How do I update my profile information?',
          answer:
            'Go to Profile from the sidebar menu. You can update your name, phone, department, position, and upload a profile picture.',
        },
        {
          question: 'How do I change my password?',
          answer:
            'In your Profile page, go to the Account Settings section and click "Change Password". You\'ll need to enter your current password and choose a new one.',
        },
        {
          question: 'What permissions do I need to access certain features?',
          answer:
            'Permissions are role-based. Contact your administrator if you need access to specific features. Common permissions include contract:read, contract:create, promoter:manage, and admin roles.',
        },
      ],
    },
    {
      category: 'System & Settings',
      questions: [
        {
          question: 'How do I change the language?',
          answer:
            'Go to Profile > Preferences and select your preferred language (English or Arabic). The system supports full RTL for Arabic.',
        },
        {
          question: 'Can I customize notification preferences?',
          answer:
            'Yes, in your Profile page under Preferences, you can enable/disable email and SMS notifications.',
        },
        {
          question: 'Is my data secure?',
          answer:
            'Yes, we use industry-standard encryption (HTTPS/TLS), secure authentication (Supabase Auth), and implement Row Level Security (RLS) policies to protect your data.',
        },
      ],
    },
  ];

  const tutorials = [
    {
      title: 'Creating Your First Contract',
      duration: '5 min',
      description: 'Learn how to generate a contract from start to finish',
    },
    {
      title: 'Managing Promoter Records',
      duration: '8 min',
      description: 'Add, edit, and track promoter information',
    },
    {
      title: 'Understanding Analytics Dashboard',
      duration: '6 min',
      description: 'Navigate and interpret the intelligence hub metrics',
    },
    {
      title: 'Setting Up Permissions',
      duration: '4 min',
      description: 'Configure user roles and access controls',
    },
  ];

  const filteredFaqs = searchQuery
    ? faqs.map(category => ({
        ...category,
        questions: category.questions.filter(
          q =>
            q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            q.answer.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter(category => category.questions.length > 0)
    : faqs;

  return (
    <div className="container mx-auto space-y-6 py-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">Help & Documentation</h1>
        <p className="text-muted-foreground text-lg">
          Everything you need to know about using the Smart Pro Contracts Portal
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search for help topics, features, or questions..."
              className="pl-10 h-12 text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {quickLinks.map((link, index) => (
          <a key={index} href={link.href}>
            <Card className="h-full transition-shadow hover:shadow-md cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <link.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{link.title}</CardTitle>
                  </div>
                </div>
                <CardDescription>{link.description}</CardDescription>
              </CardHeader>
            </Card>
          </a>
        ))}
      </div>

      {/* Main Content */}
      <Tabs defaultValue="faqs" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="faqs">FAQs</TabsTrigger>
          <TabsTrigger value="guides">Guides</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
        </TabsList>

        {/* FAQs Tab */}
        <TabsContent value="faqs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Frequently Asked Questions
              </CardTitle>
              <CardDescription>
                {searchQuery
                  ? `Showing results for "${searchQuery}"`
                  : 'Find answers to common questions'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {filteredFaqs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <HelpCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No results found for "{searchQuery}"</p>
                  <Button
                    variant="link"
                    onClick={() => setSearchQuery('')}
                    className="mt-2"
                  >
                    Clear search
                  </Button>
                </div>
              ) : (
                filteredFaqs.map((category, idx) => (
                  <div key={idx} className="space-y-3">
                    <h3 className="text-lg font-semibold">{category.category}</h3>
                    <Accordion type="single" collapsible className="w-full">
                      {category.questions.map((faq, faqIdx) => (
                        <AccordionItem key={faqIdx} value={`item-${idx}-${faqIdx}`}>
                          <AccordionTrigger className="text-left">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Guides Tab */}
        <TabsContent value="guides" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Book className="h-5 w-5" />
                User Guides & Tutorials
              </CardTitle>
              <CardDescription>
                Step-by-step instructions for common tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {tutorials.map((tutorial, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-4 p-4 rounded-lg border hover:bg-accent transition-colors cursor-pointer"
                >
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Video className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{tutorial.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {tutorial.description}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {tutorial.duration}
                    </span>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Feature Documentation */}
          <Card>
            <CardHeader>
              <CardTitle>Feature Documentation</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Link href="/promoters">
                <div className="flex items-start gap-3 p-4 rounded-lg border hover:bg-accent transition-colors">
                  <Users className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">Promoters Intelligence Hub</h4>
                    <p className="text-sm text-muted-foreground">
                      Analytics and insights dashboard
                    </p>
                  </div>
                </div>
              </Link>
              <Link href="/manage-promoters">
                <div className="flex items-start gap-3 p-4 rounded-lg border hover:bg-accent transition-colors">
                  <FileText className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">Promoters List</h4>
                    <p className="text-sm text-muted-foreground">
                      Manage promoter records
                    </p>
                  </div>
                </div>
              </Link>
              <Link href="/contracts">
                <div className="flex items-start gap-3 p-4 rounded-lg border hover:bg-accent transition-colors">
                  <FileCheck className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">Contract Management</h4>
                    <p className="text-sm text-muted-foreground">
                      Generate and manage contracts
                    </p>
                  </div>
                </div>
              </Link>
              <Link href="/profile">
                <div className="flex items-start gap-3 p-4 rounded-lg border hover:bg-accent transition-colors">
                  <Settings className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">Profile & Settings</h4>
                    <p className="text-sm text-muted-foreground">
                      Manage your account
                    </p>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Support Tab */}
        <TabsContent value="support" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Contact Support
              </CardTitle>
              <CardDescription>
                Get help from our support team
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex flex-col items-center text-center p-4 rounded-lg border">
                  <div className="p-3 rounded-full bg-primary/10 mb-3">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-medium mb-1">Email Support</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Response within 24 hours
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <a href="mailto:support@smartpro.com">Send Email</a>
                  </Button>
                </div>

                <div className="flex flex-col items-center text-center p-4 rounded-lg border">
                  <div className="p-3 rounded-full bg-primary/10 mb-3">
                    <MessageCircle className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-medium mb-1">Live Chat</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Available 9AM - 5PM
                  </p>
                  <Button variant="outline" size="sm">Start Chat</Button>
                </div>

                <div className="flex flex-col items-center text-center p-4 rounded-lg border">
                  <div className="p-3 rounded-full bg-primary/10 mb-3">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-medium mb-1">Phone Support</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Call us directly
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <a href="tel:+1234567890">Call Now</a>
                  </Button>
                </div>
              </div>

              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-base">System Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-sm">All systems operational</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Security & Privacy
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p className="mb-2">
                    Your data is protected with industry-standard encryption and security measures.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="link" size="sm" className="h-auto p-0">
                      Privacy Policy
                    </Button>
                    <Button variant="link" size="sm" className="h-auto p-0">
                      Terms of Service
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export const dynamic = 'force-dynamic';
