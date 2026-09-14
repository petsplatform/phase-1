const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, 'src');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.jsx') || file.endsWith('.js')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(adminDir);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('dummyData')) {
    // Remove the import statement
    const importRegex = /import\s+\{([^}]+)\}\s+from\s+['"](?:\.\.\/)+data\/dummyData['"]\n?/g;
    let match;
    let newContent = content;
    
    while ((match = importRegex.exec(content)) !== null) {
      const importedVarsStr = match[1];
      const vars = importedVarsStr.split(',').map(s => s.trim());
      
      // For each variable, inject a `const X = [];` if it's not defined elsewhere in the file
      // Actually, since they are being used in the components, we can just declare them at the top of the file after imports.
      let declarations = '';
      vars.forEach(v => {
        // e.g. `products as initialProducts`
        const parts = v.split(/\s+as\s+/);
        const varName = parts[parts.length - 1].trim();
        declarations += `const ${varName} = [];\n`;
      });
      
      newContent = newContent.replace(match[0], declarations);
    }
    
    if (newContent !== content) {
      fs.writeFileSync(file, newContent, 'utf8');
      console.log(`Updated ${file}`);
    }
  }
});
