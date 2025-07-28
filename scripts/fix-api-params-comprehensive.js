const fs = require('fs');
const path = require('path');

// Function to recursively find all .ts files in a directory
function findTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findTsFiles(filePath, fileList);
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Function to fix params in a file
function fixParamsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Fix function signatures that use params directly
    const functionRegex = /export async function (GET|POST|PUT|DELETE|PATCH)\s*\(\s*([^)]*)\s*,\s*\{\s*params\s*\}\s*\)/g;
    
    content = content.replace(functionRegex, (match, method, reqParam) => {
      modified = true;
      return `export async function ${method}(${reqParam}, { params }: { params: Promise<{ id: string }> })`;
    });
    
    // Fix direct params destructuring with semicolon issues
    const paramsSemicolonRegex = /const\s*\{\s*([^}]+)\s*\}\s*=\s*await params;([^;]+)/g;
    
    content = content.replace(paramsSemicolonRegex, (match, destructuring, rest) => {
      modified = true;
      return `const { ${destructuring} } = await params;\n  ${rest.trim()}`;
    });
    
    // Fix direct params destructuring
    const paramsRegex = /const\s*\{\s*([^}]+)\s*\}\s*=\s*params\s*;?/g;
    
    content = content.replace(paramsRegex, (match, destructuring) => {
      modified = true;
      return `const { ${destructuring} } = await params;`;
    });
    
    // Fix params.id destructuring
    const paramsIdRegex = /const\s*\{\s*id\s*:\s*([^}]+)\s*\}\s*=\s*params\s*;?/g;
    
    content = content.replace(paramsIdRegex, (match, varName) => {
      modified = true;
      return `const { id: ${varName} } = await params;`;
    });
    
    // Fix specific cases where params is used with await but formatting is wrong
    const paramsAwaitWrongFormatRegex = /const\s*\{\s*([^}]+)\s*\}\s*=\s*await params;([^;]+)/g;
    
    content = content.replace(paramsAwaitWrongFormatRegex, (match, destructuring, rest) => {
      modified = true;
      return `const { ${destructuring} } = await params;\n  ${rest.trim()}`;
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

// Main execution
const apiDir = path.join(__dirname, '..', 'app', 'api');
const tsFiles = findTsFiles(apiDir);

console.log(`Found ${tsFiles.length} TypeScript files in API directory`);

let fixedCount = 0;
tsFiles.forEach(file => {
  if (fixParamsInFile(file)) {
    fixedCount++;
  }
});

console.log(`\n🎉 Fixed ${fixedCount} files with params issues`);
console.log('All API routes should now work with Next.js 15!'); 