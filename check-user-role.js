// Script to check and update user role data
// Run this in the browser console on the dashboard page

async function checkAndUpdateUserRole() {
  try {
    console.log('🔍 Checking current user role data...')
    
    // Get current user from auth
    const authResponse = await fetch('/api/auth/user', {
      headers: { 'Cache-Control': 'no-cache' }
    })
    const authData = await authResponse.json()
    console.log('Auth user data:', authData)
    
    // Get user profile
    const profileResponse = await fetch(`/api/users/profile/${authData.user.id}`, {
      headers: { 'Cache-Control': 'no-cache' }
    })
    const profileData = await profileResponse.json()
    console.log('Profile data:', profileData)
    
    // Get users list to see what role is in the database
    const usersResponse = await fetch('/api/users', {
      headers: { 'Cache-Control': 'no-cache' }
    })
    const usersData = await usersResponse.json()
    const currentUserInList = usersData.users?.find(u => u.id === authData.user.id)
    console.log('User in users list:', currentUserInList)
    
    // Check if roles match
    const authRole = authData.user.user_metadata?.role
    const profileRole = profileData.role
    const listRole = currentUserInList?.role
    
    console.log('Role comparison:')
    console.log('- Auth metadata role:', authRole)
    console.log('- Profile API role:', profileRole)
    console.log('- Users list role:', listRole)
    
    if (listRole === 'admin' && (authRole !== 'admin' || profileRole !== 'admin')) {
      console.log('🔧 Role mismatch detected! Attempting to fix...')
      
      // Update profile
      const updateResponse = await fetch(`/api/users/profile/${authData.user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({ role: 'admin' })
      })
      
      if (updateResponse.ok) {
        console.log('✅ Profile role updated successfully')
        console.log('🔄 Please refresh the page to see changes')
        return true
      } else {
        console.error('❌ Failed to update profile role')
        return false
      }
    } else {
      console.log('✅ All roles match correctly')
      return true
    }
    
  } catch (error) {
    console.error('❌ Error checking user role:', error)
    return false
  }
}

// Run the check
checkAndUpdateUserRole().then(success => {
  if (success) {
    console.log('🎉 Role check completed successfully')
  } else {
    console.log('⚠️ Role check failed - manual intervention may be needed')
  }
})
