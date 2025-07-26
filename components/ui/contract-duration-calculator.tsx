"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Badge } from './badge'
import { differenceInDays, differenceInMonths, differenceInYears, isValid } from 'date-fns'
import { Calendar, Clock, AlertTriangle, CheckCircle } from 'lucide-react'

interface ContractDurationCalculatorProps {
  startDate: Date | null
  endDate: Date | null
  contractType?: string
}

export function ContractDurationCalculator({
  startDate,
  endDate,
  contractType
}: ContractDurationCalculatorProps) {
  if (!startDate || !endDate || !isValid(startDate) || !isValid(endDate)) {
    return null
  }

  const days = differenceInDays(endDate, startDate)
  const months = differenceInMonths(endDate, startDate)
  const years = differenceInYears(endDate, startDate)

  const isPastStart = startDate < new Date()
  const isInvalidDuration = days < 0
  const isShortDuration = days < 30
  const isLongDuration = years > 5

  const getDurationStatus = () => {
    if (isInvalidDuration) return { status: 'error', message: 'End date cannot be before start date', icon: AlertTriangle }
    if (isPastStart) return { status: 'warning', message: 'Start date is in the past', icon: AlertTriangle }
    if (isShortDuration) return { status: 'warning', message: 'Very short contract duration', icon: AlertTriangle }
    if (isLongDuration) return { status: 'warning', message: 'Very long contract duration', icon: AlertTriangle }
    return { status: 'success', message: 'Valid contract duration', icon: CheckCircle }
  }

  const durationStatus = getDurationStatus()

  const formatDuration = () => {
    if (years > 0) {
      return `${years} year${years > 1 ? 's' : ''} ${months % 12} month${months % 12 !== 1 ? 's' : ''}`
    }
    if (months > 0) {
      return `${months} month${months > 1 ? 's' : ''} ${days % 30} day${days % 30 !== 1 ? 's' : ''}`
    }
    return `${days} day${days !== 1 ? 's' : ''}`
  }

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4" />
          Contract Duration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Duration:</span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            durationStatus.status === 'success' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {formatDuration()}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center p-2 bg-white rounded border">
            <div className="font-bold text-blue-600">{years}</div>
            <div className="text-muted-foreground">Years</div>
          </div>
          <div className="text-center p-2 bg-white rounded border">
            <div className="font-bold text-blue-600">{months}</div>
            <div className="text-muted-foreground">Months</div>
          </div>
          <div className="text-center p-2 bg-white rounded border">
            <div className="font-bold text-blue-600">{days}</div>
            <div className="text-muted-foreground">Days</div>
          </div>
        </div>

        <div className={`flex items-center gap-2 text-xs p-2 rounded ${
          durationStatus.status === 'success' 
            ? 'bg-green-100 text-green-700' 
            : 'bg-yellow-100 text-yellow-700'
        }`}>
          <durationStatus.icon className="h-3 w-3" />
          <span>{durationStatus.message}</span>
        </div>

        {contractType && (
          <div className="text-xs text-muted-foreground">
            Contract Type: <span className="font-medium">{contractType}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 