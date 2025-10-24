/**
 * CSV Parser Utility
 * Handles parsing and validation of CSV files for bulk imports
 */

export interface CSVParseResult<T> {
  data: T[];
  errors: CSVError[];
  warnings: CSVWarning[];
  stats: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    emptyRows: number;
  };
}

export interface CSVError {
  row: number;
  column?: string;
  message: string;
  severity: 'error' | 'critical';
}

export interface CSVWarning {
  row: number;
  column?: string;
  message: string;
}

export interface CSVColumn {
  key: string;
  label: string;
  required?: boolean;
  validator?: (value: string, row: any) => string | null; // Returns error message if invalid
  transformer?: (value: string) => any;
  example?: string;
}

/**
 * Parse CSV file content
 */
export async function parseCSV(
  file: File
): Promise<{ content: string; headers: string[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) {
        reject(new Error('File is empty'));
        return;
      }

      // Parse CSV headers
      const lines = content.split('\n').filter(line => line.trim());
      if (lines.length === 0) {
        reject(new Error('CSV file has no data'));
        return;
      }

      const firstLine = lines[0];
      if (!firstLine) {
        reject(new Error('CSV file has no headers'));
        return;
      }
      
      const headers = parseCSVLine(firstLine);
      resolve({ content, headers });
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

/**
 * Parse a single CSV line, handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quotes
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Add last field
  result.push(current.trim());

  return result;
}

/**
 * Validate and transform CSV data according to column definitions
 */
export function validateAndTransformCSV<T>(
  content: string,
  columns: CSVColumn[]
): CSVParseResult<T> {
  const lines = content.split('\n').filter(line => line.trim());
  const errors: CSVError[] = [];
  const warnings: CSVWarning[] = [];
  const data: T[] = [];

  if (lines.length === 0) {
    errors.push({
      row: 0,
      message: 'CSV file is empty',
      severity: 'critical',
    });

    return {
      data: [],
      errors,
      warnings,
      stats: {
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        emptyRows: 0,
      },
    };
  }

  // Parse headers
  const firstLine = lines[0];
  if (!firstLine) {
    errors.push({
      row: 0,
      message: 'CSV file has no header row',
      severity: 'critical',
    });
    return {
      data: [],
      errors,
      warnings,
      stats: {
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        emptyRows: 0,
      },
    };
  }
  
  const headers = parseCSVLine(firstLine);
  const headerMap = new Map<string, number>();
  headers.forEach((header, index) => {
    headerMap.set(header.toLowerCase().trim(), index);
  });

  // Check for missing required columns
  const missingColumns = columns
    .filter(col => col.required)
    .filter(col => !headerMap.has(col.label.toLowerCase()));

  if (missingColumns.length > 0) {
    errors.push({
      row: 0,
      message: `Missing required columns: ${missingColumns.map(c => c.label).join(', ')}`,
      severity: 'critical',
    });

    return {
      data: [],
      errors,
      warnings,
      stats: {
        totalRows: lines.length - 1,
        validRows: 0,
        invalidRows: lines.length - 1,
        emptyRows: 0,
      },
    };
  }

  let validRows = 0;
  let invalidRows = 0;
  let emptyRows = 0;

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || !line.trim()) {
      emptyRows++;
      continue;
    }

    const values = parseCSVLine(line);
    const row: any = {};
    let hasErrors = false;

    // Process each column
    for (const column of columns) {
      const headerIndex = headerMap.get(column.label.toLowerCase());
      const value = headerIndex !== undefined ? values[headerIndex] : '';

      // Check required fields
      if (column.required && (!value || !value.trim())) {
        errors.push({
          row: i + 1,
          column: column.label,
          message: `Required field '${column.label}' is missing`,
          severity: 'error',
        });
        hasErrors = true;
        continue;
      }

      // Validate value
      if (column.validator && value) {
        const validationError = column.validator(value, row);
        if (validationError) {
          errors.push({
            row: i + 1,
            column: column.label,
            message: validationError,
            severity: 'error',
          });
          hasErrors = true;
        }
      }

      // Transform value
      let transformedValue: any = value;
      if (column.transformer && value !== undefined) {
        try {
          transformedValue = column.transformer(value);
        } catch (error) {
          errors.push({
            row: i + 1,
            column: column.label,
            message: `Failed to transform value: ${error instanceof Error ? error.message : 'Unknown error'}`,
            severity: 'error',
          });
          hasErrors = true;
        }
      }

      row[column.key] = transformedValue;
    }

    if (hasErrors) {
      invalidRows++;
    } else {
      validRows++;
      data.push(row as T);
    }
  }

  return {
    data,
    errors,
    warnings,
    stats: {
      totalRows: lines.length - 1,
      validRows,
      invalidRows,
      emptyRows,
    },
  };
}

/**
 * Generate a sample CSV template based on column definitions
 */
export function generateCSVTemplate(columns: CSVColumn[]): string {
  const headers = columns.map(col => col.label).join(',');
  const examples = columns.map(col => col.example || '').join(',');
  return `${headers}\n${examples}`;
}

/**
 * Download CSV template
 */
export function downloadCSVTemplate(columns: CSVColumn[], filename: string) {
  const csv = generateCSVTemplate(columns);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Common validators
 */
export const validators = {
  email: (value: string): string | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? null : 'Invalid email format';
  },

  phone: (value: string): string | null => {
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
    return phoneRegex.test(value.replace(/\s/g, '')) ? null : 'Invalid phone number';
  },

  date: (value: string): string | null => {
    if (!value || !value.trim()) return null;
    
    // Try multiple date formats
    const formats = [
      // DD-MM-YYYY or DD/MM/YYYY
      /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/,
      // YYYY-MM-DD
      /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/,
    ];
    
    for (const format of formats) {
      const match = value.trim().match(format);
      if (match && match[1] && match[2] && match[3]) {
        let day, month, year;
        
        if (match[1].length === 4) {
          // YYYY-MM-DD format
          year = parseInt(match[1], 10);
          month = parseInt(match[2], 10);
          day = parseInt(match[3], 10);
        } else {
          // DD-MM-YYYY format
          day = parseInt(match[1], 10);
          month = parseInt(match[2], 10);
          year = parseInt(match[3], 10);
        }
        
        // Validate date parts
        if (month < 1 || month > 12) return 'Invalid month (must be 1-12)';
        if (day < 1 || day > 31) return 'Invalid day (must be 1-31)';
        if (year < 1900 || year > 2100) return 'Invalid year (must be 1900-2100)';
        
        // Create date and validate it's real
        const date = new Date(year, month - 1, day);
        if (date.getDate() !== day || date.getMonth() !== month - 1) {
          return 'Invalid date (e.g., 31st Feb doesn\'t exist)';
        }
        
        return null; // Valid date
      }
    }
    
    return 'Invalid date format (use DD-MM-YYYY, DD/MM/YYYY, or YYYY-MM-DD)';
  },

  number: (value: string): string | null => {
    return isNaN(Number(value)) ? 'Must be a number' : null;
  },

  url: (value: string): string | null => {
    try {
      new URL(value);
      return null;
    } catch {
      return 'Invalid URL format';
    }
  },

  required: (value: string): string | null => {
    return value && value.trim() ? null : 'This field is required';
  },

  minLength: (min: number) => (value: string): string | null => {
    return value.length >= min ? null : `Must be at least ${min} characters`;
  },

  maxLength: (max: number) => (value: string): string | null => {
    return value.length <= max ? null : `Must be at most ${max} characters`;
  },
};

/**
 * Common transformers
 */
export const transformers = {
  trim: (value: string) => value.trim(),
  
  lowercase: (value: string) => value.toLowerCase(),
  
  uppercase: (value: string) => value.toUpperCase(),
  
  date: (value: string) => {
    if (!value || !value.trim()) return null;
    
    // Parse multiple date formats and convert to ISO
    const formats = [
      // DD-MM-YYYY or DD/MM/YYYY
      /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/,
      // YYYY-MM-DD
      /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/,
    ];
    
    for (const format of formats) {
      const match = value.trim().match(format);
      if (match && match[1] && match[2] && match[3]) {
        let day, month, year;
        
        if (match[1].length === 4) {
          // YYYY-MM-DD format
          year = parseInt(match[1], 10);
          month = parseInt(match[2], 10);
          day = parseInt(match[3], 10);
        } else {
          // DD-MM-YYYY format
          day = parseInt(match[1], 10);
          month = parseInt(match[2], 10);
          year = parseInt(match[3], 10);
        }
        
        // Create date object (month is 0-indexed in JS)
        const date = new Date(year, month - 1, day);
        
        // Validate it's a real date
        if (date.getDate() === day && date.getMonth() === month - 1) {
          return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
        }
      }
    }
    
    // Try parsing as-is (fallback)
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
  },
  
  number: (value: string) => {
    const num = Number(value);
    return isNaN(num) ? null : num;
  },
  
  boolean: (value: string) => {
    const lower = value.toLowerCase().trim();
    return lower === 'true' || lower === 'yes' || lower === '1';
  },
  
  nullIfEmpty: (value: string) => {
    return value && value.trim() ? value.trim() : null;
  },
};

