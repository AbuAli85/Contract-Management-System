// Contract form options and constants
export const JOB_TITLES = [
  { value: "senior-software-engineer", label: "Senior Software Engineer" },
  { value: "software-engineer", label: "Software Engineer" },
  { value: "junior-software-engineer", label: "Junior Software Engineer" },
  { value: "full-stack-developer", label: "Full Stack Developer" },
  { value: "frontend-developer", label: "Frontend Developer" },
  { value: "backend-developer", label: "Backend Developer" },
  { value: "devops-engineer", label: "DevOps Engineer" },
  { value: "data-scientist", label: "Data Scientist" },
  { value: "product-manager", label: "Product Manager" },
  { value: "project-manager", label: "Project Manager" },
  { value: "ui-ux-designer", label: "UI/UX Designer" },
  { value: "marketing-specialist", label: "Marketing Specialist" },
  { value: "sales-representative", label: "Sales Representative" },
  { value: "sales-promoter", label: "Sales Promoter" },
  { value: "home-appliances-sales", label: "Home Appliances Sales" },
  { value: "salesman-saleswoman-electronics", label: "Salesman/Saleswoman Electronics" },
  { value: "business-analyst", label: "Business Analyst" },
  { value: "qa-engineer", label: "QA Engineer" },
  { value: "technical-lead", label: "Technical Lead" },
  { value: "team-lead", label: "Team Lead" },
  { value: "consultant", label: "Consultant" },
  { value: "other", label: "Other" },
] as const

export const DEPARTMENTS = [
  { value: "technology", label: "Technology" },
  { value: "engineering", label: "Engineering" },
  { value: "product", label: "Product" },
  { value: "design", label: "Design" },
  { value: "marketing", label: "Marketing" },
  { value: "sales", label: "Sales" },
  { value: "operations", label: "Operations" },
  { value: "finance", label: "Finance" },
  { value: "human-resources", label: "Human Resources" },
  { value: "legal", label: "Legal" },
  { value: "customer-success", label: "Customer Success" },
  { value: "business-development", label: "Business Development" },
  { value: "data-analytics", label: "Data & Analytics" },
  { value: "quality-assurance", label: "Quality Assurance" },
  { value: "administration", label: "Administration" },
  { value: "research-development", label: "Research & Development" },
  { value: "consulting", label: "Consulting" },
  { value: "other", label: "Other" },
] as const

export const CONTRACT_TYPES = [
  // Oman Labor Law Compliant Contract Types (Make.com Automated)
  {
    value: "oman-unlimited-makecom",
    label: "🤖 Oman Unlimited Contract (Auto PDF)",
    category: "Make.com Automated",
  },
  {
    value: "oman-fixed-term-makecom",
    label: "🤖 Oman Fixed-Term Contract (Auto PDF)",
    category: "Make.com Automated",
  },
  {
    value: "oman-part-time-makecom",
    label: "🤖 Oman Part-Time Contract (Auto PDF)",
    category: "Make.com Automated",
  },

  // Standard Oman Labor Law Contract Types
  { value: "unlimited-contract", label: "Unlimited Contract (Permanent)", category: "Standard" },
  { value: "limited-contract", label: "Limited Contract (Fixed-term)", category: "Standard" },
  { value: "part-time-contract", label: "Part-time Contract", category: "Standard" },

  // Employment Categories
  { value: "full-time-permanent", label: "Full-time Permanent", category: "Employment" },
  { value: "full-time-fixed", label: "Full-time Fixed-term", category: "Employment" },
  { value: "part-time-permanent", label: "Part-time Permanent", category: "Employment" },
  { value: "part-time-fixed", label: "Part-time Fixed-term", category: "Employment" },

  // Specialized Contract Types
  { value: "probationary", label: "Probationary Period", category: "Specialized" },
  { value: "training-contract", label: "Training Contract", category: "Specialized" },
  { value: "internship", label: "Internship", category: "Specialized" },
  { value: "graduate-trainee", label: "Graduate Trainee", category: "Specialized" },

  // Project & Consulting
  { value: "project-based", label: "Project-based Contract", category: "Project" },
  { value: "consulting", label: "Consulting Agreement", category: "Project" },
  { value: "freelance", label: "Freelance Contract", category: "Project" },
  { value: "contractor", label: "Independent Contractor", category: "Project" },

  // Seasonal & Temporary
  { value: "seasonal", label: "Seasonal Employment", category: "Temporary" },
  { value: "temporary", label: "Temporary Assignment", category: "Temporary" },
  { value: "casual", label: "Casual Employment", category: "Temporary" },

  // Management & Executive
  { value: "executive", label: "Executive Contract", category: "Management" },
  { value: "management", label: "Management Agreement", category: "Management" },
  { value: "director", label: "Director Contract", category: "Management" },

  // Special Categories
  { value: "remote-work", label: "Remote Work Contract", category: "Special" },
  { value: "hybrid-work", label: "Hybrid Work Agreement", category: "Special" },
  { value: "secondment", label: "Secondment Agreement", category: "Special" },
  { value: "apprenticeship", label: "Apprenticeship Contract", category: "Specialized" },

  // Service Agreements
  { value: "service-agreement", label: "Service Agreement", category: "Service" },
  { value: "retainer", label: "Retainer Agreement", category: "Service" },

  // Other
  { value: "other", label: "Other Contract Type", category: "Other" },
] as const

export const CURRENCIES = [
  { value: "OMR", label: "OMR - Omani Rial" },
  { value: "AED", label: "AED - UAE Dirham" },
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "SAR", label: "SAR - Saudi Riyal" },
  { value: "QAR", label: "QAR - Qatari Riyal" },
  { value: "KWD", label: "KWD - Kuwaiti Dinar" },
  { value: "BHD", label: "BHD - Bahraini Dinar" },
  { value: "EGP", label: "EGP - Egyptian Pound" },
  { value: "JOD", label: "JOD - Jordanian Dinar" },
  { value: "LBP", label: "LBP - Lebanese Pound" },
  { value: "INR", label: "INR - Indian Rupee" },
  { value: "PKR", label: "PKR - Pakistani Rupee" },
  { value: "BDT", label: "BDT - Bangladeshi Taka" },
  { value: "PHP", label: "PHP - Philippine Peso" },
  { value: "MYR", label: "MYR - Malaysian Ringgit" },
  { value: "SGD", label: "SGD - Singapore Dollar" },
  { value: "THB", label: "THB - Thai Baht" },
  { value: "IDR", label: "IDR - Indonesian Rupiah" },
] as const

export const WORK_LOCATIONS = [
  // Main Branches
  { value: "main-branch", label: "Main Branch", description: "Main location" },
  { value: "downtown-store", label: "Downtown Store", description: "Downtown location" },

  // eXtra Locations
  { value: "extra-os1", label: "eXtra Os1", description: "Al Ghubrah South District" },
  { value: "extra-os2", label: "eXtra Os2", description: "Al Mawaleh North District" },
  { value: "extra-os3", label: "eXtra Os3", description: "Sohar" },

  // Virgin Megastore Locations
  {
    value: "virgin-mall-of-oman",
    label: "Virgin Megastore - Mall of Oman",
    description: "Mall of Oman",
  },
  {
    value: "virgin-muscat-city-centre",
    label: "Virgin Megastore - Muscat City Centre",
    description: "Muscat City Centre",
  },

  // Emax Locations
  {
    value: "emax-muscat-city-centre",
    label: "Emax - Muscat City Centre",
    description: "Muscat City Centre",
  },
  { value: "emax-oasis-mall", label: "Emax - Oasis Mall", description: "Oasis Mall" },
  {
    value: "emax-al-meera-hypermarket",
    label: "Emax - Al Meera Hypermarket",
    description: "Al Meera Hypermarket",
  },
  {
    value: "emax-barka-grand-centre",
    label: "Emax - Barka Grand Centre",
    description: "Barka Grand Centre",
  },
  { value: "emax-mall-of-muscat", label: "Emax - Mall of Muscat", description: "Mall of Muscat" },
  {
    value: "emax-oasis-mall-sohar",
    label: "Emax - Oasis Mall Sohar",
    description: "Oasis Mall Sohar",
  },
  {
    value: "emax-oasis-mall-salalah",
    label: "Emax - Oasis Mall Salalah",
    description: "Oasis Mall Salalah",
  },
  {
    value: "emax-grand-mall-salalah",
    label: "Emax - Grand Mall Salalah",
    description: "Grand Mall Salalah",
  },

  // Nesto Hypermarket Locations
  {
    value: "nesto-maabilah-industrial",
    label: "Nesto Hypermarket - Maabilah Industrial Area",
    description: "Maabilah Industrial Area",
  },
  {
    value: "nesto-al-hail-north",
    label: "Nesto Hypermarket - Al Hail North",
    description: "Al Hail North",
  },
  { value: "nesto-al-khoudh", label: "Nesto Hypermarket - Al Khoudh", description: "Al Khoudh" },
  {
    value: "nesto-al-wadi-al-kabir",
    label: "Nesto Hypermarket - Al Wadi Al Kabir",
    description: "Al Wadi Al Kabir",
  },
  {
    value: "nesto-al-humriyyah",
    label: "Nesto Hypermarket - Al Humriyyah",
    description: "Al Humriyyah",
  },
  { value: "nesto-al-bandar", label: "Nesto Hypermarket - Al Bandar", description: "Al Bandar" },
  { value: "nesto-mabela", label: "Nesto Hypermarket - Mabela", description: "Mabela" },
  { value: "nesto-al-ansab", label: "Nesto Hypermarket - Al Ansab", description: "Al Ansab" },
  { value: "nesto-al-khadra", label: "Nesto Hypermarket - Al Khadra", description: "Al Khadra" },
  { value: "nesto-barka", label: "Nesto Hypermarket - Barka", description: "Barka" },
  { value: "nesto-saham", label: "Nesto Hypermarket - Saham", description: "Saham" },
  {
    value: "nesto-falaj-al-qabail",
    label: "Nesto Hypermarket - Falaj Al Qaba'il",
    description: "Falaj Al Qaba'il",
  },
  { value: "nesto-al-hambar", label: "Nesto Hypermarket - Al Hambar", description: "Al Hambar" },
  { value: "nesto-seeb", label: "Nesto Hypermarket - Seeb", description: "Seeb" },
  { value: "nesto-salalah", label: "Nesto Hypermarket - Salalah", description: "Salalah" },
  { value: "nesto-sohar", label: "Nesto Hypermarket - Sohar", description: "Sohar" },

  // LuLu Hypermarket Locations
  { value: "lulu-khasab", label: "LuLu Hypermarket - Khasab", description: "Khasab" },
  { value: "lulu-sohar", label: "LuLu Hypermarket - Sohar", description: "Sohar" },
  { value: "lulu-buraimi", label: "LuLu Hypermarket - Buraimi", description: "Buraimi" },
  { value: "lulu-khaburah", label: "LuLu Hypermarket - Khaburah", description: "Khaburah" },
  { value: "lulu-al-bidaya", label: "LuLu Hypermarket - Al Bidaya", description: "Al Bidaya" },
  { value: "lulu-suwaiq", label: "LuLu Hypermarket - Suwaiq", description: "Suwaiq" },
  { value: "lulu-barka", label: "LuLu Hypermarket - Barka", description: "Barka" },
  { value: "lulu-ibri", label: "LuLu Hypermarket - Ibri", description: "Ibri" },
  { value: "lulu-rustaq", label: "LuLu Hypermarket - Rustaq", description: "Rustaq" },
  {
    value: "lulu-bawadi-mall",
    label: "LuLu Hypermarket - Bawadi Mall",
    description: "Bawadi Mall",
  },
  {
    value: "lulu-al-mudhaibi",
    label: "LuLu Hypermarket - Al Mudhaibi",
    description: "Al Mudhaibi",
  },
  {
    value: "lulu-wadi-al-lawami",
    label: "LuLu Hypermarket - Wadi Al Lawami, Al Khoudh",
    description: "Wadi Al Lawami, Al Khoudh",
  },
  { value: "lulu-al-bandar", label: "LuLu Hypermarket - Al Bandar", description: "Al Bandar" },
  { value: "lulu-mabelah", label: "LuLu Hypermarket - Mabelah", description: "Mabelah" },
  { value: "lulu-darsait", label: "LuLu Hypermarket - Darsait", description: "Darsait" },
  { value: "lulu-al-khoudh", label: "LuLu Hypermarket - Al Khoudh", description: "Al Khoudh" },
  { value: "lulu-wadi-kabir", label: "LuLu Hypermarket - Wadi Kabir", description: "Wadi Kabir" },

  // HyperMax Locations
  { value: "hypermax-mall-of-oman", label: "HyperMax - Mall of Oman", description: "Mall of Oman" },
  {
    value: "hypermax-city-centre-qurum",
    label: "HyperMax - City Centre Qurum",
    description: "City Centre Qurum",
  },
  {
    value: "hypermax-city-centre-sohar",
    label: "HyperMax - City Centre Sohar",
    description: "City Centre Sohar",
  },
  {
    value: "hypermax-city-centre-al-moulaah",
    label: "HyperMax - City Centre Al Moulaah",
    description: "City Centre Al Moulaah",
  },
  { value: "hypermax-salalah", label: "HyperMax - Salalah", description: "Salalah" },
  { value: "hypermax-barka", label: "HyperMax - Barka", description: "Barka" },
  { value: "hypermax-seeb", label: "HyperMax - Seeb", description: "Seeb" },
  { value: "hypermax-sur", label: "HyperMax - Sur", description: "Sur" },
  { value: "hypermax-ibri", label: "HyperMax - Ibri", description: "Ibri" },
  { value: "hypermax-al-buraimi", label: "HyperMax - Al Buraimi", description: "Al Buraimi" },

  // Sharaf DG Locations
  {
    value: "sharaf-dg-muscat-grand-mall",
    label: "Sharaf DG - Muscat Grand Mall",
    description: "Muscat Grand Mall",
  },
  {
    value: "sharaf-dg-city-centre-muscat",
    label: "Sharaf DG - City Centre Muscat",
    description: "City Centre Muscat",
  },
  {
    value: "sharaf-dg-mall-of-oman",
    label: "Sharaf DG - Mall of Oman",
    description: "Mall of Oman",
  },
  {
    value: "sharaf-dg-safeer-mall-soha",
    label: "Sharaf DG - Safeer Mall Soha",
    description: "Safeer Mall Soha",
  },

  // Industrial Facilities
  {
    value: "iron-mountain-muscat",
    label: "Iron Mountain - Muscat Facility",
    description: "Iron Mountain operates a facility in Muscat",
  },

  // Additional Locations
  { value: "bousher", label: "Bousher", description: "Bousher" },
  { value: "qurum", label: "Qurum", description: "Qurum" },
  { value: "al-moulaah", label: "Al Moulaah", description: "Al Moulaah" },
  { value: "al-khuwair-muscat", label: "Al Khuwair, Muscat", description: "Al Khuwair, Muscat" },
  {
    value: "sohar-al-batinah-north",
    label: "Sohar, Al Batinah North",
    description: "Sohar, Al Batinah North",
  },
  {
    value: "ghala-industrial-area",
    label: "Ghala Industrial Area",
    description: "Ghala Industrial Area",
  },

  // Remote and Other Options
  { value: "remote-full", label: "Remote - Full Time", description: "Work from home full time" },
  {
    value: "remote-hybrid",
    label: "Remote - Hybrid",
    description: "Combination of remote and office work",
  },
  { value: "client-site", label: "Client Site", description: "Work at client location" },
  {
    value: "multiple-locations",
    label: "Multiple Locations",
    description: "Work across multiple locations",
  },
  { value: "field-work", label: "Field Work", description: "Mobile/field-based work" },
  { value: "other", label: "Other", description: "Other work location" },
] as const

// Helper function to convert value back to label
export const getOptionLabel = (
  options: readonly { value: string; label: string; description?: string }[],
  value: string,
): string => {
  const option = options.find((opt) => opt.value === value)
  return option?.label || value
}

// Helper function to convert label back to value
export const getOptionValue = (
  options: readonly { value: string; label: string; description?: string }[],
  label: string,
): string => {
  const option = options.find((opt) => opt.label === label)
  return option?.value || label
}

// Helper function to get description for a work location
export const getWorkLocationDescription = (value: string): string => {
  const option = WORK_LOCATIONS.find((opt) => opt.value === value)
  return option?.description || ""
}

// Helper function to get contract types grouped by category
export function getContractTypesByCategory(): Record<
  string,
  Array<{ value: string; label: string; category?: string }>
> {
  const categories: Record<string, Array<{ value: string; label: string; category?: string }>> = {}

  CONTRACT_TYPES.forEach((contractType) => {
    const category = (contractType as unknown as { category?: string }).category || "Other"
    if (!categories[category]) {
      categories[category] = []
    }
    categories[category].push(
      contractType as unknown as { value: string; label: string; category?: string },
    )
  })

  return categories
}

// Helper function to check if a contract type is Make.com enabled
export function isMakecomEnabled(contractTypeValue: string): boolean {
  return contractTypeValue.includes("-makecom")
}

// Helper function to get Make.com enabled contract types only
export function getMakecomContractTypes(): Array<{
  value: string
  label: string
  category?: string
}> {
  return CONTRACT_TYPES.filter((type) => isMakecomEnabled(type.value)) as unknown as Array<{
    value: string
    label: string
    category?: string
  }>
}
