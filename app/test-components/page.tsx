import { SalaryCalculator } from "@/components/ui/salary-calculator"
import { ComplianceChecker } from "@/components/ui/compliance-checker"
import { ContractPreview } from "@/components/ui/contract-preview"

export default function TestComponents() {
  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Component Test Page
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Salary Calculator</h2>
            <SalaryCalculator />
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Compliance Checker</h2>
            <ComplianceChecker />
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Contract Preview</h2>
            <ContractPreview />
          </div>
        </div>
        
        <div className="mt-8">
          <a 
            href="/" 
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  )
} 