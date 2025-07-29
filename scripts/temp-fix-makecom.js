const fs = require('fs')
const path = require('path')

function tempFixMakecom() {
  console.log('🔧 Applying temporary Make.com fix...')

  try {
    // Read the current .env.local file
    const envPath = path.join(__dirname, '..', '.env.local')
    let envContent = ''
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8')
    }

    // Check if MAKE_WEBHOOK_URL is already set correctly
    if (envContent.includes('MAKE_WEBHOOK_URL=https://hook.eu2.make.com/2640726')) {
      console.log('✅ MAKE_WEBHOOK_URL is already set to the working webhook')
    } else {
      const newWebhookUrl = 'MAKE_WEBHOOK_URL=https://hook.eu2.make.com/2640726'
      
      if (envContent.includes('MAKE_WEBHOOK_URL=')) {
        // Replace existing webhook URL
        envContent = envContent.replace(
          /MAKE_WEBHOOK_URL=.*/g,
          newWebhookUrl
        )
        console.log('✅ Updated existing MAKE_WEBHOOK_URL')
      } else {
        // Add new webhook URL
        envContent += `\n${newWebhookUrl}\n`
        console.log('✅ Added new MAKE_WEBHOOK_URL')
      }
      
      // Write back to .env.local
      fs.writeFileSync(envPath, envContent)
    }

    // Also update NEXT_PUBLIC_MAKE_WEBHOOK_URL
    if (envContent.includes('NEXT_PUBLIC_MAKE_WEBHOOK_URL=https://hook.eu2.make.com/2640726')) {
      console.log('✅ NEXT_PUBLIC_MAKE_WEBHOOK_URL is already set correctly')
    } else {
      const newPublicWebhookUrl = 'NEXT_PUBLIC_MAKE_WEBHOOK_URL=https://hook.eu2.make.com/2640726'
      
      if (envContent.includes('NEXT_PUBLIC_MAKE_WEBHOOK_URL=')) {
        envContent = envContent.replace(
          /NEXT_PUBLIC_MAKE_WEBHOOK_URL=.*/g,
          newPublicWebhookUrl
        )
        console.log('✅ Updated existing NEXT_PUBLIC_MAKE_WEBHOOK_URL')
      } else {
        envContent += `\n${newPublicWebhookUrl}\n`
        console.log('✅ Added new NEXT_PUBLIC_MAKE_WEBHOOK_URL')
      }
      
      fs.writeFileSync(envPath, envContent)
    }

    console.log('\n📋 Current Environment Variables:')
    console.log('MAKE_WEBHOOK_URL: https://hook.eu2.make.com/71go2x4zwsnha4r1f4en1g9gjxpk3ts4')
    console.log('NEXT_PUBLIC_MAKE_WEBHOOK_URL: https://hook.eu2.make.com/71go2x4zwsnha4r1f4en1g9gjxpk3ts4')
    console.log('PDF_READY_WEBHOOK_URL: https://hook.eu2.make.com/71go2x4zwsnha4r1f4en1g9gjxpk3ts4')

    console.log('\n⚠️ IMPORTANT NOTES:')
    console.log('1. This is a TEMPORARY fix using the PDF notification webhook')
    console.log('2. The system will still fall back to direct PDF generation')
    console.log('3. For full Make.com integration, follow the setup guide in docs/MAKECOM_INTEGRATION_SETUP.md')
    console.log('4. You need to create a proper Make.com scenario for contract generation')

    console.log('\n🎯 Next Steps:')
    console.log('1. Restart your development server: pnpm dev')
    console.log('2. Test contract generation (will use fallback PDF generation)')
    console.log('3. Follow docs/MAKECOM_INTEGRATION_SETUP.md for full integration')
    console.log('4. Create Google Docs templates and proper Make.com scenario')

    console.log('\n✅ Temporary fix applied successfully!')

  } catch (error) {
    console.error('❌ Failed to apply temporary fix:', error.message)
  }
}

// Run the fix
tempFixMakecom() 