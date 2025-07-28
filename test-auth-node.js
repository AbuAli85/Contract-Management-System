#!/usr/bin/env node

/**
 * Node.js Authentication Test Script
 * Tests the authentication endpoints from the command line
 */

const http = require('http')
const https = require('https')

const BASE_URL = 'http://localhost:3002'

// Simple HTTP client for testing
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const isHttps = urlObj.protocol === 'https:'
    const client = isHttps ? https : http
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    }
    
    const req = client.request(requestOptions, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data)
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          })
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          })
        }
      })
    })
    
    req.on('error', (error) => {
      reject(error)
    })
    
    if (options.body) {
      req.write(JSON.stringify(options.body))
    }
    
    req.end()
  })
}

async function testAuthEndpoints() {
  console.log('🧪 Testing Authentication Endpoints...')
  console.log('=====================================')
  
  const endpoints = [
    {
      name: 'Session Status (GET)',
      url: `${BASE_URL}/api/auth/refresh-session`,
      method: 'GET'
    },
    {
      name: 'Session Refresh (POST)',
      url: `${BASE_URL}/api/auth/refresh-session`,
      method: 'POST',
      body: {}
    },
    {
      name: 'Check Session',
      url: `${BASE_URL}/api/auth/check-session`,
      method: 'GET'
    },
    {
      name: 'Debug Session',
      url: `${BASE_URL}/api/debug/session`,
      method: 'GET'
    },
    {
      name: 'Test Connection',
      url: `${BASE_URL}/api/test-connection`,
      method: 'GET'
    },
    {
      name: 'Test Config',
      url: `${BASE_URL}/api/test-config`,
      method: 'GET'
    }
  ]
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n🔍 Testing: ${endpoint.name}`)
      console.log(`URL: ${endpoint.url}`)
      
      const response = await makeRequest(endpoint.url, {
        method: endpoint.method,
        body: endpoint.body
      })
      
      console.log(`Status: ${response.status}`)
      console.log(`Success: ${response.data.success ? '✅' : '❌'}`)
      
      if (response.data.error) {
        console.log(`Error: ${response.data.error}`)
      }
      
      if (response.data.hasSession !== undefined) {
        console.log(`Has Session: ${response.data.hasSession ? 'Yes' : 'No'}`)
      }
      
      if (response.data.user) {
        console.log(`User: ${response.data.user.email}`)
      }
      
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`)
    }
  }
  
  console.log('\n✅ Authentication endpoint test completed!')
}

async function testPageAccess() {
  console.log('\n🧪 Testing Page Access...')
  console.log('==========================')
  
  const pages = [
    {
      name: 'Login Page',
      url: `${BASE_URL}/en/auth/login`
    },
    {
      name: 'Dashboard',
      url: `${BASE_URL}/en/dashboard`
    },
    {
      name: 'Debug Auth',
      url: `${BASE_URL}/en/debug-auth`
    },
    {
      name: 'Root Path',
      url: `${BASE_URL}/`
    }
  ]
  
  for (const page of pages) {
    try {
      console.log(`\n🔍 Testing: ${page.name}`)
      console.log(`URL: ${page.url}`)
      
      const response = await makeRequest(page.url)
      
      console.log(`Status: ${response.status}`)
      console.log(`Accessible: ${response.status < 400 ? '✅' : '❌'}`)
      
      if (response.status === 302 || response.status === 307) {
        const location = response.headers.location
        console.log(`Redirects to: ${location}`)
      }
      
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`)
    }
  }
  
  console.log('\n✅ Page access test completed!')
}

async function main() {
  try {
    console.log('🚀 Starting Authentication Tests...')
    console.log(`Base URL: ${BASE_URL}`)
    console.log('Make sure your development server is running on port 3002')
    console.log('')
    
    await testAuthEndpoints()
    await testPageAccess()
    
    console.log('\n📋 Test Summary:')
    console.log('- Check if all endpoints return 200 status')
    console.log('- Verify session endpoints work correctly')
    console.log('- Ensure protected pages redirect properly')
    console.log('- Look for any error messages in the output')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.log('\n💡 Troubleshooting:')
    console.log('1. Make sure the development server is running')
    console.log('2. Check if the server is on port 3002')
    console.log('3. Verify environment variables are set')
    console.log('4. Check browser console for additional errors')
  }
}

// Run the test
if (require.main === module) {
  main()
}

module.exports = {
  testAuthEndpoints,
  testPageAccess
} 