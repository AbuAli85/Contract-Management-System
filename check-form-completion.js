// Check Form Completion and Missing Fields
console.log('🔍 Analyzing Form Completion Issue (91%)...');

// This script will help identify what fields are missing to reach 100%
const analyzeFormCompletion = () => {
  console.log('📋 FORM COMPLETION ANALYSIS');
  console.log('Current completion: 91%');
  console.log('Target: 100% (required for submission)');
  
  console.log('\n🔍 LIKELY MISSING FIELDS:');
  console.log('Based on 91% completion, you are missing approximately 1-2 fields.');
  console.log('Common missing fields in contract forms:');
  
  const possiblyMissingFields = [
    '🔸 Employment Details section:',
    '   - Job Title (if not filled)',
    '   - Department (might be required)',
    '   - Work Location details',
    '   - Basic Salary amount',
    '   - Currency selection',
    '',
    '🔸 Advanced Settings section:',
    '   - Probation Period (Months)',
    '   - Notice Period (Days)', 
    '   - Working Hours/Week',
    '   - Contract Type (if not properly selected)',
    '',
    '🔸 Date fields:',
    '   - Start Date (properly formatted)',
    '   - End Date (properly formatted)',
    '',
    '🔸 Party selections:',
    '   - First Party (Client) - fully selected',
    '   - Second Party (Employer) - fully selected',
    '   - Promoter - properly associated with employer'
  ];
  
  possiblyMissingFields.forEach(field => console.log(field));
  
  console.log('\n📋 BROWSER DEBUG CODE:');
  console.log('Copy this code into your browser console (F12) to find missing fields:');
  
  return `
// === FIND MISSING FIELDS ===
console.clear();
console.log('🔍 Finding missing required fields...');

// Find the form
const form = document.querySelector('form');
if (!form) {
  console.log('❌ Form not found');
  return;
}

// Get all input fields
const allInputs = form.querySelectorAll('input, select, textarea');
console.log('📊 Total form fields:', allInputs.length);

// Check required fields
const requiredFields = [];
const emptyRequired = [];

allInputs.forEach((input, i) => {
  const isRequired = input.hasAttribute('required') || 
                    input.hasAttribute('aria-required') ||
                    input.getAttribute('data-required') === 'true';
                    
  if (isRequired) {
    requiredFields.push(input);
    
    const value = input.value?.trim() || '';
    const label = input.getAttribute('name') || 
                 input.getAttribute('id') || 
                 input.getAttribute('aria-label') ||
                 input.closest('label')?.textContent?.trim() ||
                 \`field-\${i}\`;
    
    if (!value || value === '' || value === 'Select...' || value === 'undefined') {
      emptyRequired.push({ input, label, value });
      console.log(\`❌ MISSING: \${label} = "\${value}"\`);
    } else {
      console.log(\`✅ FILLED: \${label} = "\${value}"\`);
    }
  }
});

console.log(\`\\n📊 Required fields: \${requiredFields.length}\`);
console.log(\`📊 Empty required: \${emptyRequired.length}\`);
console.log(\`📊 Completion: \${Math.round((requiredFields.length - emptyRequired.length) / requiredFields.length * 100)}%\`);

if (emptyRequired.length > 0) {
  console.log('\\n🎯 FOCUS ON THESE MISSING FIELDS:');
  emptyRequired.forEach((field, i) => {
    console.log(\`\${i + 1}. \${field.label}\`);
    // Try to focus the field for easy identification
    if (field.input.focus) {
      setTimeout(() => field.input.focus(), i * 1000);
    }
  });
} else {
  console.log('\\n✅ All required fields appear to be filled!');
  console.log('If form still shows 91%, check for:');
  console.log('- Hidden validation errors');
  console.log('- Format validation (dates, emails)');
  console.log('- Minimum value requirements');
}

// Check form validity
console.log('\\n🔍 Form validation status:');
console.log('Form valid:', form.checkValidity());

// Find invalid fields
const invalidFields = form.querySelectorAll(':invalid');
if (invalidFields.length > 0) {
  console.log('\\n❌ INVALID FIELDS:');
  invalidFields.forEach((field, i) => {
    const label = field.getAttribute('name') || field.getAttribute('id') || \`invalid-\${i}\`;
    console.log(\`\${i + 1}. \${label}: \${field.validationMessage}\`);
  });
}
`;
};

const debugCode = analyzeFormCompletion();
console.log(debugCode);

console.log('\n🎯 QUICK FIXES TO TRY:');
console.log('1. Scroll down to "Employment Details" section');
console.log('2. Check if "Job Title" field is filled');
console.log('3. Make sure "Department" is selected'); 
console.log('4. Verify "Basic Salary" has a number');
console.log('5. Check "Currency" is selected (OMR)');
console.log('6. Scroll to "Advanced Settings" if visible');
console.log('7. Fill "Probation Period (Months)" - try "3"');
console.log('8. Fill "Notice Period (Days)" - try "30"');
console.log('9. Fill "Working Hours/Week" - try "40"');

console.log('\n📱 STEP-BY-STEP INSTRUCTIONS:');
console.log('1. Press F12 to open Developer Tools');
console.log('2. Go to Console tab');
console.log('3. Paste the debug code above');
console.log('4. Press Enter to run it');
console.log('5. It will show you exactly which fields are missing');
console.log('6. Fill those fields');
console.log('7. Watch the completion percentage increase to 100%');
console.log('8. Then try clicking "Create Contract" button');
