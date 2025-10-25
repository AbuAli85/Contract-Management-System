'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X, Plus, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SearchCriteria {
  field: string;
  operator: string;
  value: string;
}

interface PromotersAdvancedSearchProps {
  onSearch: (criteria: SearchCriteria[]) => void;
  onClear: () => void;
  activeCriteria: SearchCriteria[];
}

const SEARCH_FIELDS = [
  { value: 'name', label: 'Name' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'id_card', label: 'ID Card Number' },
  { value: 'passport', label: 'Passport Number' },
  { value: 'employer', label: 'Employer/Company' },
  { value: 'status', label: 'Status' },
  { value: 'created_date', label: 'Created Date' },
];

const OPERATORS = [
  { value: 'contains', label: 'Contains' },
  { value: 'equals', label: 'Equals' },
  { value: 'starts_with', label: 'Starts with' },
  { value: 'ends_with', label: 'Ends with' },
  { value: 'not_equals', label: 'Does not equal' },
  { value: 'is_empty', label: 'Is empty' },
  { value: 'is_not_empty', label: 'Is not empty' },
  { value: 'greater_than', label: 'Greater than' },
  { value: 'less_than', label: 'Less than' },
];

/**
 * Advanced multi-field search dialog
 * Allows complex search queries across multiple fields
 */
export function PromotersAdvancedSearch({
  onSearch,
  onClear,
  activeCriteria,
}: PromotersAdvancedSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [criteria, setCriteria] = useState<SearchCriteria[]>(
    activeCriteria.length > 0 ? activeCriteria : [{ field: 'name', operator: 'contains', value: '' }]
  );

  const handleAddCriteria = () => {
    setCriteria([...criteria, { field: 'name', operator: 'contains', value: '' }]);
  };

  const handleRemoveCriteria = (index: number) => {
    setCriteria(criteria.filter((_, i) => i !== index));
  };

  const handleUpdateCriteria = (index: number, updates: Partial<SearchCriteria>) => {
    const updated = [...criteria];
    updated[index] = { ...updated[index], ...updates } as SearchCriteria;
    setCriteria(updated);
  };

  const handleSearch = () => {
    const validCriteria = criteria.filter(c => c.value.trim() !== '');
    onSearch(validCriteria);
    setIsOpen(false);
  };

  const handleClear = () => {
    setCriteria([{ field: 'name', operator: 'contains', value: '' }]);
    onClear();
  };

  const hasActiveCriteria = activeCriteria.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={hasActiveCriteria ? 'default' : 'outline'}
          size="sm"
          className="relative"
          aria-label="Open advanced search"
        >
          <Filter className="mr-2 h-4 w-4" />
          Advanced Search
          {hasActiveCriteria && (
            <Badge 
              variant="secondary" 
              className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-white text-primary"
            >
              {activeCriteria.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Advanced Search
          </DialogTitle>
          <DialogDescription>
            Create complex search queries by combining multiple criteria. All conditions must match.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {criteria.map((criterion, index) => (
            <div key={index} className="grid gap-3 p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">
                  Criteria {index + 1}
                </Label>
                {criteria.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleRemoveCriteria(index)}
                    aria-label={`Remove criteria ${index + 1}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid gap-3 md:grid-cols-[1fr_140px_1fr]">
                <div className="space-y-2">
                  <Label htmlFor={`field-${index}`} className="text-xs">
                    Search In
                  </Label>
                  <Select
                    value={criterion.field}
                    onValueChange={(value) => handleUpdateCriteria(index, { field: value })}
                  >
                    <SelectTrigger id={`field-${index}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SEARCH_FIELDS.map((field) => (
                        <SelectItem key={field.value} value={field.value}>
                          {field.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`operator-${index}`} className="text-xs">
                    Condition
                  </Label>
                  <Select
                    value={criterion.operator}
                    onValueChange={(value) => handleUpdateCriteria(index, { operator: value })}
                  >
                    <SelectTrigger id={`operator-${index}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OPERATORS.map((op) => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`value-${index}`} className="text-xs">
                    Value
                  </Label>
                  <Input
                    id={`value-${index}`}
                    value={criterion.value}
                    onChange={(e) => handleUpdateCriteria(index, { value: e.target.value })}
                    placeholder="Enter search value..."
                  />
                </div>
              </div>
            </div>
          ))}

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleAddCriteria}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Another Criteria
          </Button>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleClear} className="w-full sm:w-auto">
            Clear All
          </Button>
          <Button 
            onClick={handleSearch} 
            className="w-full sm:w-auto"
            disabled={criteria.every(c => c.value.trim() === '')}
          >
            <Search className="mr-2 h-4 w-4" />
            Apply Search
          </Button>
        </DialogFooter>

        {activeCriteria.length > 0 && (
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-2">Active Filters:</p>
            <div className="flex flex-wrap gap-2">
              {activeCriteria.map((c, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {SEARCH_FIELDS.find(f => f.value === c.field)?.label} {c.operator} "{c.value}"
                </Badge>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

