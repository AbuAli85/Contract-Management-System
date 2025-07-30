import { SalaryCalculator } from "@/components/ui/salary-calculator"
import { ComplianceChecker } from "@/components/ui/compliance-checker"
import { ContractPreview } from "@/components/ui/contract-preview"

export default function TestComponents() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">Component Test Page</h1>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div>
            <h2 className="mb-4 text-xl font-semibold">Salary Calculator</h2>
            <SalaryCalculator />
          </div>

          <div>
            <h2 className="mb-4 text-xl font-semibold">Compliance Checker</h2>
            <ComplianceChecker />
          </div>

          <div>
            <h2 className="mb-4 text-xl font-semibold">Contract Preview</h2>
            <ContractPreview />
          </div>
        </div>

        <div className="mt-8">
          <a
            href="/"
            className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700"
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  )
}
