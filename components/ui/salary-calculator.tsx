'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calculator, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface SalaryCalculatorProps {
  onSalaryChange?: (salary: number, currency: string) => void;
  initialSalary?: number;
  initialCurrency?: string;
}

interface SalaryBreakdown {
  basic: number;
  allowances: number;
  benefits: number;
  total: number;
}

export function SalaryCalculator({
  onSalaryChange,
  initialSalary = 0,
  initialCurrency = 'SAR',
}: SalaryCalculatorProps) {
  const [basicSalary, setBasicSalary] = useState(initialSalary);
  const [currency, setCurrency] = useState(initialCurrency);
  const [allowances, setAllowances] = useState(0);
  const [benefits, setBenefits] = useState(0);
  const [breakdown, setBreakdown] = useState<SalaryBreakdown>({
    basic: initialSalary,
    allowances: 0,
    benefits: 0,
    total: initialSalary,
  });

  const currencies = [
    { value: 'SAR', label: 'Saudi Riyal (SAR)' },
    { value: 'USD', label: 'US Dollar (USD)' },
    { value: 'EUR', label: 'Euro (EUR)' },
    { value: 'GBP', label: 'British Pound (GBP)' },
  ];

  useEffect(() => {
    const total = basicSalary + allowances + benefits;
    const newBreakdown = {
      basic: basicSalary,
      allowances,
      benefits,
      total,
    };
    setBreakdown(newBreakdown);

    if (onSalaryChange) {
      onSalaryChange(total, currency);
    }
  }, [basicSalary, allowances, benefits, currency, onSalaryChange]);

  const calculateAllowances = (basic: number) => {
    // Standard allowance calculation (20% of basic salary)
    return Math.round(basic * 0.2);
  };

  const calculateBenefits = (basic: number) => {
    // Standard benefits calculation (15% of basic salary)
    return Math.round(basic * 0.15);
  };

  const handleBasicSalaryChange = (value: string) => {
    const salary = parseFloat(value) || 0;
    setBasicSalary(salary);

    // Auto-calculate allowances and benefits
    const calculatedAllowances = calculateAllowances(salary);
    const calculatedBenefits = calculateBenefits(salary);

    setAllowances(calculatedAllowances);
    setBenefits(calculatedBenefits);
  };

  const getSalaryRecommendation = (basic: number) => {
    if (basic < 3000) {
      return {
        type: 'low',
        message: 'Consider market rates for this position',
      };
    } else if (basic > 15000) {
      return { type: 'high', message: 'Salary is competitive for the market' };
    } else {
      return { type: 'medium', message: 'Salary is within market range' };
    }
  };

  const recommendation = getSalaryRecommendation(basicSalary);

  return (
    <Card className='w-full'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Calculator className='h-5 w-5' />
          Salary Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <div className='space-y-2'>
            <Label htmlFor='basic-salary'>Basic Salary</Label>
            <Input
              id='basic-salary'
              type='number'
              value={basicSalary}
              onChange={e => handleBasicSalaryChange(e.target.value)}
              placeholder='Enter basic salary'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='currency'>Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger>
                <SelectValue placeholder='Select currency' />
              </SelectTrigger>
              <SelectContent>
                {currencies.map(curr => (
                  <SelectItem key={curr.value} value={curr.value}>
                    {curr.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
          <div className='space-y-2'>
            <Label htmlFor='allowances'>Allowances</Label>
            <Input
              id='allowances'
              type='number'
              value={allowances}
              onChange={e => setAllowances(parseFloat(e.target.value) || 0)}
              placeholder='Housing, transport, etc.'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='benefits'>Benefits</Label>
            <Input
              id='benefits'
              type='number'
              value={benefits}
              onChange={e => setBenefits(parseFloat(e.target.value) || 0)}
              placeholder='Insurance, bonuses, etc.'
            />
          </div>

          <div className='space-y-2'>
            <Label>Total Package</Label>
            <div className='flex items-center gap-2 rounded-md bg-muted p-2'>
              <DollarSign className='h-4 w-4' />
              <span className='font-semibold'>
                {breakdown.total.toLocaleString()} {currency}
              </span>
            </div>
          </div>
        </div>

        <div className='space-y-2'>
          <Label>Salary Breakdown</Label>
          <div className='grid grid-cols-1 gap-2 text-sm md:grid-cols-4'>
            <div className='rounded bg-blue-50 p-2'>
              <div className='font-medium'>Basic</div>
              <div>
                {breakdown.basic.toLocaleString()} {currency}
              </div>
            </div>
            <div className='rounded bg-green-50 p-2'>
              <div className='font-medium'>Allowances</div>
              <div>
                {breakdown.allowances.toLocaleString()} {currency}
              </div>
            </div>
            <div className='rounded bg-purple-50 p-2'>
              <div className='font-medium'>Benefits</div>
              <div>
                {breakdown.benefits.toLocaleString()} {currency}
              </div>
            </div>
            <div className='rounded bg-orange-50 p-2'>
              <div className='font-medium'>Total</div>
              <div className='font-bold'>
                {breakdown.total.toLocaleString()} {currency}
              </div>
            </div>
          </div>
        </div>

        {basicSalary > 0 && (
          <div
            className={`rounded-md p-3 ${
              recommendation.type === 'high'
                ? 'border border-green-200 bg-green-50'
                : recommendation.type === 'medium'
                  ? 'border border-yellow-200 bg-yellow-50'
                  : 'border border-red-200 bg-red-50'
            }`}
          >
            <div className='flex items-center gap-2'>
              {recommendation.type === 'high' ? (
                <TrendingUp className='h-4 w-4 text-green-600' />
              ) : recommendation.type === 'medium' ? (
                <TrendingUp className='h-4 w-4 text-yellow-600' />
              ) : (
                <TrendingDown className='h-4 w-4 text-red-600' />
              )}
              <span className='text-sm font-medium'>
                {recommendation.message}
              </span>
            </div>
          </div>
        )}

        <div className='flex gap-2'>
          <Button
            variant='outline'
            onClick={() => {
              const newAllowances = calculateAllowances(basicSalary);
              const newBenefits = calculateBenefits(basicSalary);
              setAllowances(newAllowances);
              setBenefits(newBenefits);
            }}
            disabled={basicSalary === 0}
          >
            Auto-Calculate
          </Button>

          <Button
            variant='outline'
            onClick={() => {
              setBasicSalary(0);
              setAllowances(0);
              setBenefits(0);
            }}
          >
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
