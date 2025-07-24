import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface OnboardingState {
  // Current step
  currentStep: number
  maxStep: number
  
  // Form data
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
  
  requirements: Record<string, boolean>
  skills: string[]
  experience: string
  
  availability: {
    fullTime: boolean
    partTime: boolean
    flexible: boolean
    preferredHours: string
  }
  
  // UI state
  isSubmitting: boolean
  submissionError: string | null
  uploadProgress: Record<string, number>
  
  // Actions
  setCurrentStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  resetOnboarding: () => void
  
  // Form actions
  updatePersonalInfo: (data: Partial<OnboardingState['personalInfo']>) => void
  updateDocuments: (field: keyof OnboardingState['documents'], file: File | null) => void
  updateRequirements: (requirementId: string, checked: boolean) => void
  addSkill: (skill: string) => void
  removeSkill: (skill: string) => void
  updateExperience: (experience: string) => void
  updateAvailability: (data: Partial<OnboardingState['availability']>) => void
  
  // Submission actions
  setSubmitting: (isSubmitting: boolean) => void
  setSubmissionError: (error: string | null) => void
  setUploadProgress: (field: string, progress: number) => void
  
  // Validation
  validateCurrentStep: () => boolean
  getCompletionPercentage: () => number
}

const initialState = {
  currentStep: 0,
  maxStep: 5,
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
  },
  isSubmitting: false,
  submissionError: null,
  uploadProgress: {}
}

export const useOnboardingStore = create<OnboardingState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // Step navigation
        setCurrentStep: (step: number) => {
          const { maxStep } = get()
          if (step >= 0 && step <= maxStep) {
            set({ currentStep: step })
          }
        },
        
        nextStep: () => {
          const { currentStep, maxStep, validateCurrentStep } = get()
          if (currentStep < maxStep && validateCurrentStep()) {
            set({ currentStep: currentStep + 1 })
          }
        },
        
        prevStep: () => {
          const { currentStep } = get()
          if (currentStep > 0) {
            set({ currentStep: currentStep - 1 })
          }
        },
        
        resetOnboarding: () => {
          set(initialState)
        },
        
        // Form updates
        updatePersonalInfo: (data) => {
          set((state) => ({
            personalInfo: { ...state.personalInfo, ...data }
          }))
        },
        
        updateDocuments: (field, file) => {
          set((state) => ({
            documents: { ...state.documents, [field]: file }
          }))
        },
        
        updateRequirements: (requirementId, checked) => {
          set((state) => ({
            requirements: { ...state.requirements, [requirementId]: checked }
          }))
        },
        
        addSkill: (skill) => {
          const { skills } = get()
          if (skill && !skills.includes(skill)) {
            set({ skills: [...skills, skill] })
          }
        },
        
        removeSkill: (skillToRemove) => {
          const { skills } = get()
          set({ skills: skills.filter(skill => skill !== skillToRemove) })
        },
        
        updateExperience: (experience) => {
          set({ experience })
        },
        
        updateAvailability: (data) => {
          set((state) => ({
            availability: { ...state.availability, ...data }
          }))
        },
        
        // Submission state
        setSubmitting: (isSubmitting) => {
          set({ isSubmitting })
        },
        
        setSubmissionError: (error) => {
          set({ submissionError: error })
        },
        
        setUploadProgress: (field, progress) => {
          set((state) => ({
            uploadProgress: { ...state.uploadProgress, [field]: progress }
          }))
        },
        
        // Validation
        validateCurrentStep: () => {
          const { currentStep, personalInfo, documents, requirements } = get()
          
          switch (currentStep) {
            case 0: // Personal Info
              return !!(
                personalInfo.firstName &&
                personalInfo.lastName &&
                personalInfo.email &&
                personalInfo.phone &&
                personalInfo.dateOfBirth &&
                personalInfo.nationality &&
                personalInfo.address
              )
            
            case 1: // Documents
              return !!(
                documents.cv &&
                documents.idCard &&
                documents.profilePicture
              )
            
            case 2: // Requirements
              const requiredRequirements = [
                'age_18',
                'legal_work',
                'no_criminal',
                'communication',
                'teamwork',
                'flexible'
              ]
              return requiredRequirements.every(req => requirements[req])
            
            case 3: // Skills (optional)
              return true
            
            case 4: // Availability
              const { availability } = get()
              return !!(
                (availability.fullTime || availability.partTime || availability.flexible) &&
                availability.preferredHours
              )
            
            case 5: // Review
              return true
            
            default:
              return false
          }
        },
        
        getCompletionPercentage: () => {
          const { currentStep, maxStep } = get()
          return Math.round((currentStep / maxStep) * 100)
        }
      }),
      {
        name: 'onboarding-storage',
        partialize: (state) => ({
          personalInfo: state.personalInfo,
          requirements: state.requirements,
          skills: state.skills,
          experience: state.experience,
          availability: state.availability
        })
      }
    ),
    {
      name: 'onboarding-store'
    }
  )
) 