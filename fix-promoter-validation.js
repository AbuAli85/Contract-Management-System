// Test the validation logic from the promoter form
function testValidationLogic() {
  console.log('=== Testing Promoter Form Validation Logic ===')
  
  // Simulate the validation function from the form
  function validateForm(formData) {
    const errors = {}
    
    // Required fields validation
    if (!formData.full_name?.trim()) {
      errors.full_name = "Full name is required"
    }
    
    if (!formData.name_ar?.trim()) {
      errors.name_ar = "Arabic name is required"
    }
    
    if (!formData.id_number?.trim()) {
      errors.id_number = "ID number is required"
    }
    
    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address"
    }
    
    // Phone validation
    if (formData.phone && !/^[\+]?[0-9\s\-\(\)]{8,}$/.test(formData.phone)) {
      errors.phone = "Please enter a valid phone number"
    }
    
    // Mobile validation
    if (formData.mobile_number && !/^[\+]?[0-9\s\-\(\)]{8,}$/.test(formData.mobile_number)) {
      errors.mobile_number = "Please enter a valid mobile number"
    }
    
    // Date validation
    if (formData.id_expiry_date) {
      const idDate = new Date(formData.id_expiry_date)
      if (isNaN(idDate.getTime())) {
        errors.id_expiry_date = "Please enter a valid ID expiry date"
      }
    }
    
    if (formData.passport_expiry_date) {
      const passportDate = new Date(formData.passport_expiry_date)
      if (isNaN(passportDate.getTime())) {
        errors.passport_expiry_date = "Please enter a valid passport expiry date"
      }
    }
    
    return errors
  }
  
  // Test cases
  const testCases = [
    {
      name: "Empty form",
      data: {},
      expectedErrors: ["full_name", "name_ar", "id_number"]
    },
    {
      name: "Partial data",
      data: {
        full_name: "John Doe",
        name_ar: "",
        id_number: ""
      },
      expectedErrors: ["name_ar", "id_number"]
    },
    {
      name: "Valid data",
      data: {
        full_name: "John Doe",
        name_ar: "جون دو",
        id_number: "123456789"
      },
      expectedErrors: []
    },
    {
      name: "Invalid email",
      data: {
        full_name: "John Doe",
        name_ar: "جون دو",
        id_number: "123456789",
        email: "invalid-email"
      },
      expectedErrors: ["email"]
    },
    {
      name: "Invalid phone",
      data: {
        full_name: "John Doe",
        name_ar: "جون دو",
        id_number: "123456789",
        phone: "123"
      },
      expectedErrors: ["phone"]
    }
  ]
  
  testCases.forEach(testCase => {
    console.log(`\nTesting: ${testCase.name}`)
    console.log('Input data:', testCase.data)
    
    const errors = validateForm(testCase.data)
    const errorKeys = Object.keys(errors)
    
    console.log('Validation errors:', errors)
    console.log('Error count:', errorKeys.length)
    
    if (errorKeys.length === 0) {
      console.log('✅ No validation errors')
    } else {
      console.log('❌ Validation errors found:')
      errorKeys.forEach(key => {
        console.log(`   - ${key}: ${errors[key]}`)
      })
    }
    
    // Check if expected errors match
    const expectedMatch = testCase.expectedErrors.length === errorKeys.length &&
      testCase.expectedErrors.every(expected => errorKeys.includes(expected))
    
    console.log(`Expected errors: ${testCase.expectedErrors.join(', ')}`)
    console.log(`Match: ${expectedMatch ? '✅' : '❌'}`)
  })
  
  console.log('\n=== Validation Logic Test Complete ===')
  console.log('\n📝 Common validation issues:')
  console.log('1. Missing required fields: full_name, name_ar, id_number')
  console.log('2. Invalid email format')
  console.log('3. Invalid phone/mobile format')
  console.log('4. Invalid date format')
  console.log('5. Empty or whitespace-only values')
}

testValidationLogic() 