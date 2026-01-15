
const fs = require('fs');
try {
  const content = fs.readFileSync('lint.json', 'utf8');
  // The file might contain mixed output if not captured cleanly, so specific parsing might be needed if it's not valid JSON.
  // Assuming it is valid JSON or we can find the JSON part.
  const jsonStart = content.indexOf('[');
  const jsonEnd = content.lastIndexOf(']');
  if (jsonStart === -1 || jsonEnd === -1) {
      console.log('Could not find JSON array in lint.json');
      process.exit(1);
  }
  const jsonContent = content.substring(jsonStart, jsonEnd + 1);
  const results = JSON.parse(jsonContent);
  
  results.forEach(result => {
    if (result.messages.length > 0) {
      console.log(`\nFile: ${result.filePath}`);
      result.messages.forEach(msg => {
        console.log(`  [${msg.severity === 2 ? 'ERROR' : 'WARN'}] Line ${msg.line}: ${msg.message} (${msg.ruleId})`);
      });
    }
  });
} catch (e) {
  console.error('Error parsing lint.json:', e);
}
