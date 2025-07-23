"use client"

import { useParties } from "@/hooks/use-parties"
import { usePromoters } from "@/hooks/use-promoters"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react"

export function DebugDataLoading() {
  const { isAuthenticated, user } = useAuth()
  const { data: allParties, isLoading: isLoadingParties, error: partiesError } = useParties()
  const { data: promoters, isLoading: isLoadingPromoters, error: promotersError } = usePromoters()

  // Filter parties by type
  const clientParties = allParties?.filter(party => party.type === 'Client') || []
  const employerParties = allParties?.filter(party => party.type === 'Employer') || []

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔍 Data Loading Debug
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Authentication Status */}
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            Authentication Status
            {isAuthenticated ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
          </h3>
          <div className="text-sm space-y-1">
            <p>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
            <p>User ID: {user?.id || 'None'}</p>
            <p>User Email: {user?.email || 'None'}</p>
          </div>
        </div>

        {/* Parties Data */}
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            Parties Data
            {isLoadingParties ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : partiesError ? (
              <XCircle className="h-4 w-4 text-red-500" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
          </h3>
          <div className="text-sm space-y-1">
            <p>Loading: {isLoadingParties ? 'Yes' : 'No'}</p>
            <p>Error: {partiesError ? partiesError.message : 'None'}</p>
            <p>Total Parties: {allParties?.length || 0}</p>
            <p>Client Parties: {clientParties.length}</p>
            <p>Employer Parties: {employerParties.length}</p>
            
            {clientParties.length > 0 && (
              <div className="mt-2">
                <p className="font-medium">Sample Client Parties:</p>
                <ul className="list-disc list-inside ml-2">
                  {clientParties.slice(0, 3).map((party) => (
                    <li key={party.id}>{party.name_en} (CRN: {party.crn})</li>
                  ))}
                </ul>
              </div>
            )}
            
            {employerParties.length > 0 && (
              <div className="mt-2">
                <p className="font-medium">Sample Employer Parties:</p>
                <ul className="list-disc list-inside ml-2">
                  {employerParties.slice(0, 3).map((party) => (
                    <li key={party.id}>{party.name_en} (CRN: {party.crn})</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Promoters Data */}
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            Promoters Data
            {isLoadingPromoters ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : promotersError ? (
              <XCircle className="h-4 w-4 text-red-500" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
          </h3>
          <div className="text-sm space-y-1">
            <p>Loading: {isLoadingPromoters ? 'Yes' : 'No'}</p>
            <p>Error: {promotersError ? promotersError.message : 'None'}</p>
            <p>Total Promoters: {promoters?.length || 0}</p>
            
            {promoters && promoters.length > 0 && (
              <div className="mt-2">
                <p className="font-medium">Sample Promoters:</p>
                <ul className="list-disc list-inside ml-2">
                  {promoters.slice(0, 3).map((promoter) => (
                    <li key={promoter.id}>{promoter.name_en} (ID: {promoter.id_card_number})</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Form Status */}
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            Form Status
            {!isAuthenticated ? (
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            ) : (isLoadingParties || isLoadingPromoters) ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (partiesError || promotersError) ? (
              <XCircle className="h-4 w-4 text-red-500" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
          </h3>
          <div className="text-sm space-y-1">
            <p>Form Ready: {!isAuthenticated ? 'No (Not authenticated)' : (isLoadingParties || isLoadingPromoters) ? 'No (Loading)' : (partiesError || promotersError) ? 'No (Error)' : 'Yes'}</p>
            <p>Client Dropdown Options: {clientParties.length}</p>
            <p>Employer Dropdown Options: {employerParties.length}</p>
            <p>Promoter Dropdown Options: {promoters?.length || 0}</p>
          </div>
        </div>

        {/* Recommendations */}
        <div className="space-y-2">
          <h3 className="font-semibold">Recommendations</h3>
          <div className="text-sm space-y-1">
            {!isAuthenticated && (
              <p className="text-red-600">⚠️ User needs to be authenticated to load data</p>
            )}
            {isAuthenticated && (isLoadingParties || isLoadingPromoters) && (
              <p className="text-blue-600">⏳ Data is still loading, please wait...</p>
            )}
            {isAuthenticated && !isLoadingParties && !isLoadingPromoters && (partiesError || promotersError) && (
              <p className="text-red-600">❌ There are errors loading data. Check the error messages above.</p>
            )}
            {isAuthenticated && !isLoadingParties && !isLoadingPromoters && !partiesError && !promotersError && (
              <p className="text-green-600">✅ Data loaded successfully! The form should work properly.</p>
            )}
            {clientParties.length === 0 && !isLoadingParties && !partiesError && (
              <p className="text-yellow-600">⚠️ No client parties found. Add some client parties to the database.</p>
            )}
            {employerParties.length === 0 && !isLoadingParties && !partiesError && (
              <p className="text-yellow-600">⚠️ No employer parties found. Add some employer parties to the database.</p>
            )}
            {(promoters?.length || 0) === 0 && !isLoadingPromoters && !promotersError && (
              <p className="text-yellow-600">⚠️ No promoters found. Add some promoters to the database.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 