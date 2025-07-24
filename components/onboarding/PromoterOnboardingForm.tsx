'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Star,
  Download,
  Eye,
  Edit,
  Trash2,
  Plus
} from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

interface OnboardingStep {
  id: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  required: boolean
}

interface OnboardingData {
  personalInfo: {
    firstName: string
    lastName: string
    email: string
    phone: string
    dateOfBirth: string
    nationality: string
    address: string
  }
  documents: {
    cv: File | null
    idCard: File | null
    passport: File | null
    profilePicture: File | null
  }
  requirements: {
    [key: string]: boolean
  }
  skills: string[]
  experience: string
  availability: {
    fullTime: boolean
    partTime: boolean
    flexible: boolean
    preferredHours: string
  }
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'personal-info',
    title: 'Personal Information',
    description: 'Basic personal details and contact information',
    status: 'pending',
    required: true
  },
  {
    id: 'documents',
    title: 'Document Upload',
    description: 'CV, ID card, passport, and profile picture',
    status: 'pending',
    required: true
  },
  {
    id: 'requirements',
    title: 'Requirements Checklist',
    description: 'Confirm eligibility and requirements',
    status: 'pending',
    required: true
  },
  {
    id: 'skills',
    title: 'Skills & Experience',
    description: 'Professional skills and work experience',
    status: 'pending',
    required: false
  },
  {
    id: 'availability',
    title: 'Availability',
    description: 'Work schedule and availability preferences',
    status: 'pending',
    required: true
  },
  {
    id: 'review',
    title: 'Review & Submit',
    description: 'Review all information and submit application',
    status: 'pending',
    required: true
  }
]

const REQUIREMENTS_CHECKLIST = [
  { id: 'age_18', label: 'I am 18 years or older', required: true },
  { id: 'legal_work', label: 'I have legal right to work in this country', required: true },
  { id: 'no_criminal', label: 'I have no criminal record', required: true },
  { id: 'communication', label: 'I have good communication skills', required: true },
  { id: 'teamwork', label: 'I can work well in a team', required: true },
  { id: 'flexible', label: 'I am flexible with working hours', required: true },
  { id: 'transport', label: 'I have reliable transportation', required: false },
  { id: 'experience', label: 'I have previous promotion experience', required: false },
]

export default function PromoterOnboardingForm() {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<OnboardingData>({
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      nationality: '',
      address: ''
    },
    documents: {
      cv: null,
      idCard: null,
      passport: null,
      profilePicture: null
    },
    requirements: {},
    skills: [],
    experience: '',
    availability: {
      fullTime: false,
      partTime: false,
      flexible: false,
      preferredHours: ''
    }
  })

  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})
  const queryClient = useQueryClient()

  // Calculate completion percentage
  const completionPercentage = Math.round(
    (ONBOARDING_STEPS.filter(step => step.status === 'completed').length / ONBOARDING_STEPS.length) * 100
  )

  // Submit onboarding data
  const submitMutation = useMutation({
    mutationFn: async (data: OnboardingData) => {
      const formDataToSend = new FormData()
      
      // Add personal info
      Object.entries(data.personalInfo).forEach(([key, value]) => {
        formDataToSend.append(`personalInfo.${key}`, value)
      })

      // Add documents
      Object.entries(data.documents).forEach(([key, file]) => {
        if (file) {
          formDataToSend.append(`documents.${key}`, file)
        }
      })

      // Add other data
      formDataToSend.append('requirements', JSON.stringify(data.requirements))
      formDataToSend.append('skills', JSON.stringify(data.skills))
      formDataToSend.append('experience', data.experience)
      formDataToSend.append('availability', JSON.stringify(data.availability))

      const response = await fetch('/api/promoters/onboarding', {
        method: 'POST',
        body: formDataToSend
      })

      if (!response.ok) {
        throw new Error('Failed to submit onboarding data')
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success('Onboarding submitted successfully!')
      queryClient.invalidateQueries({ queryKey: ['promoters'] })
    },
    onError: (error) => {
      toast.error('Failed to submit onboarding data')
      console.error('Onboarding error:', error)
    }
  })

  const handleFileUpload = (field: keyof OnboardingData['documents'], file: File) => {
    setFormData(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [field]: file
      }
    }))
  }

  const handleRequirementChange = (requirementId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        [requirementId]: checked
      }
    }))
  }

  const handleSkillAdd = (skill: string) => {
    if (skill && !formData.skills.includes(skill)) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }))
    }
  }

  const handleSkillRemove = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }))
  }

  const nextStep = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const submitForm = () => {
    submitMutation.mutate(formData)
  }

  const StepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Onboarding Progress</h2>
        <Badge variant="outline">{completionPercentage}% Complete</Badge>
      </div>
      <Progress value={completionPercentage} className="mb-4" />
      <div className="grid grid-cols-6 gap-2">
        {ONBOARDING_STEPS.map((step, index) => (
          <div
            key={step.id}
            className={`text-center p-2 rounded-lg text-xs ${
              index === currentStep
                ? 'bg-primary text-primary-foreground'
                : step.status === 'completed'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            <div className="font-medium">{step.title}</div>
          </div>
        ))}
      </div>
    </div>
  )

  const PersonalInfoStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Personal Information
        </CardTitle>
        <CardDescription>
          Please provide your basic personal details and contact information.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              value={formData.personalInfo.firstName}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                personalInfo: { ...prev.personalInfo, firstName: e.target.value }
              }))}
              placeholder="Enter your first name"
            />
          </div>
          <div>
            <Label htmlFor="lastName">Last Name *</Label>
            <Input
              id="lastName"
              value={formData.personalInfo.lastName}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                personalInfo: { ...prev.personalInfo, lastName: e.target.value }
              }))}
              placeholder="Enter your last name"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.personalInfo.email}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                personalInfo: { ...prev.personalInfo, email: e.target.value }
              }))}
              placeholder="Enter your email address"
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.personalInfo.phone}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                personalInfo: { ...prev.personalInfo, phone: e.target.value }
              }))}
              placeholder="Enter your phone number"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="dateOfBirth">Date of Birth *</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={formData.personalInfo.dateOfBirth}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                personalInfo: { ...prev.personalInfo, dateOfBirth: e.target.value }
              }))}
            />
          </div>
          <div>
            <Label htmlFor="nationality">Nationality *</Label>
            <Input
              id="nationality"
              value={formData.personalInfo.nationality}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                personalInfo: { ...prev.personalInfo, nationality: e.target.value }
              }))}
              placeholder="Enter your nationality"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="address">Address *</Label>
          <Textarea
            id="address"
            value={formData.personalInfo.address}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              personalInfo: { ...prev.personalInfo, address: e.target.value }
            }))}
            placeholder="Enter your full address"
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  )

  const DocumentsStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Document Upload
        </CardTitle>
        <CardDescription>
          Please upload the required documents. All files should be in PDF, JPG, or PNG format.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {[
          { key: 'cv', label: 'CV/Resume', required: true, description: 'Upload your CV or resume' },
          { key: 'idCard', label: 'ID Card', required: true, description: 'Upload a clear copy of your ID card' },
          { key: 'passport', label: 'Passport', required: false, description: 'Upload your passport (if available)' },
          { key: 'profilePicture', label: 'Profile Picture', required: true, description: 'Upload a professional photo' }
        ].map(({ key, label, required, description }) => (
          <div key={key} className="space-y-2">
            <Label htmlFor={key} className="flex items-center gap-2">
              {label} {required && <span className="text-red-500">*</span>}
            </Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              {formData.documents[key as keyof OnboardingData['documents']] ? (
                <div className="space-y-2">
                  <FileText className="h-8 w-8 mx-auto text-gray-400" />
                  <p className="text-sm font-medium">
                    {formData.documents[key as keyof OnboardingData['documents']]?.name}
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRefs.current[key]?.click()}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        documents: { ...prev.documents, [key]: null }
                      }))}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 mx-auto text-gray-400" />
                  <p className="text-sm text-gray-600">{description}</p>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRefs.current[key]?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File
                  </Button>
                </div>
              )}
              <input
                ref={(el) => fileInputRefs.current[key] = el}
                type="file"
                id={key}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    handleFileUpload(key as keyof OnboardingData['documents'], file)
                  }
                }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )

  const RequirementsStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Requirements Checklist
        </CardTitle>
        <CardDescription>
          Please confirm that you meet all the required criteria to become a promoter.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {REQUIREMENTS_CHECKLIST.map((requirement) => (
            <div key={requirement.id} className="flex items-center space-x-3">
              <Checkbox
                id={requirement.id}
                checked={formData.requirements[requirement.id] || false}
                onCheckedChange={(checked) => 
                  handleRequirementChange(requirement.id, checked as boolean)
                }
              />
              <Label htmlFor={requirement.id} className="flex items-center gap-2">
                {requirement.label}
                {requirement.required && <span className="text-red-500">*</span>}
              </Label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  const SkillsStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          Skills & Experience
        </CardTitle>
        <CardDescription>
          Tell us about your skills and relevant work experience.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Skills</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.skills.map((skill) => (
              <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                {skill}
                <button
                  onClick={() => handleSkillRemove(skill)}
                  className="ml-1 hover:text-red-500"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <Input
              placeholder="Add a skill"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleSkillAdd((e.target as HTMLInputElement).value)
                  ;(e.target as HTMLInputElement).value = ''
                }
              }}
            />
            <Button
              variant="outline"
              onClick={() => {
                const input = document.querySelector('input[placeholder="Add a skill"]') as HTMLInputElement
                if (input?.value) {
                  handleSkillAdd(input.value)
                  input.value = ''
                }
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div>
          <Label htmlFor="experience">Work Experience</Label>
          <Textarea
            id="experience"
            value={formData.experience}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              experience: e.target.value
            }))}
            placeholder="Describe your relevant work experience..."
            rows={4}
          />
        </div>
      </CardContent>
    </Card>
  )

  const AvailabilityStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Availability
        </CardTitle>
        <CardDescription>
          Please indicate your availability and preferred working hours.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Work Type</Label>
          <div className="space-y-2 mt-2">
            {[
              { key: 'fullTime', label: 'Full Time' },
              { key: 'partTime', label: 'Part Time' },
              { key: 'flexible', label: 'Flexible' }
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center space-x-3">
                <Checkbox
                  id={key}
                  checked={formData.availability[key as keyof typeof formData.availability] as boolean}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    availability: {
                      ...prev.availability,
                      [key]: checked
                    }
                  }))}
                />
                <Label htmlFor={key}>{label}</Label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="preferredHours">Preferred Working Hours</Label>
          <Textarea
            id="preferredHours"
            value={formData.availability.preferredHours}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              availability: {
                ...prev.availability,
                preferredHours: e.target.value
              }
            }))}
            placeholder="e.g., Monday-Friday 9 AM-5 PM, or flexible with notice..."
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  )

  const ReviewStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Review & Submit
        </CardTitle>
        <CardDescription>
          Please review all the information before submitting your application.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="requirements">Requirements</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Name</Label>
                <p className="text-sm text-muted-foreground">
                  {formData.personalInfo.firstName} {formData.personalInfo.lastName}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Email</Label>
                <p className="text-sm text-muted-foreground">{formData.personalInfo.email}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Phone</Label>
                <p className="text-sm text-muted-foreground">{formData.personalInfo.phone}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Nationality</Label>
                <p className="text-sm text-muted-foreground">{formData.personalInfo.nationality}</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <div className="space-y-2">
              {Object.entries(formData.documents).map(([key, file]) => (
                <div key={key} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <Badge variant={file ? 'default' : 'secondary'}>
                    {file ? 'Uploaded' : 'Not uploaded'}
                  </Badge>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="requirements" className="space-y-4">
            <div className="space-y-2">
              {REQUIREMENTS_CHECKLIST.map((requirement) => (
                <div key={requirement.id} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm">{requirement.label}</span>
                  <Badge variant={formData.requirements[requirement.id] ? 'default' : 'secondary'}>
                    {formData.requirements[requirement.id] ? 'Confirmed' : 'Not confirmed'}
                  </Badge>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="skills" className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Skills</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.skills.map((skill) => (
                  <Badge key={skill} variant="secondary">{skill}</Badge>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Experience</Label>
              <p className="text-sm text-muted-foreground mt-1">{formData.experience}</p>
            </div>
          </TabsContent>

          <TabsContent value="availability" className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Work Type</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {Object.entries(formData.availability).slice(0, 3).map(([key, value]) => (
                  value && <Badge key={key} variant="secondary">{key.replace(/([A-Z])/g, ' $1')}</Badge>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Preferred Hours</Label>
              <p className="text-sm text-muted-foreground mt-1">{formData.availability.preferredHours}</p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            By submitting, you agree to our terms and conditions.
          </div>
          <Button
            onClick={submitForm}
            disabled={submitMutation.isPending}
            className="flex items-center gap-2"
          >
            {submitMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Submit Application
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <PersonalInfoStep />
      case 1:
        return <DocumentsStep />
      case 2:
        return <RequirementsStep />
      case 3:
        return <SkillsStep />
      case 4:
        return <AvailabilityStep />
      case 5:
        return <ReviewStep />
      default:
        return <PersonalInfoStep />
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Promoter Onboarding</h1>
        <p className="text-muted-foreground">
          Complete your application to become a promoter
        </p>
      </div>

      <StepIndicator />

      {renderStep()}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 0}
        >
          Previous
        </Button>

        <div className="flex items-center gap-2">
          {currentStep < ONBOARDING_STEPS.length - 1 ? (
            <Button onClick={nextStep}>
              Next Step
            </Button>
          ) : (
            <Button
              onClick={submitForm}
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? 'Submitting...' : 'Submit Application'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
} 