// Test file to validate Mermaid syntax
// This can be used to test the generated syntax

export function testMermaidSyntax(mermaidCode) {
  // Basic validation
  if (!mermaidCode || !mermaidCode.trim().startsWith('erDiagram')) {
    return { valid: false, error: 'Must start with erDiagram' }
  }
  
  // Check for common syntax issues
  const lines = mermaidCode.split('\n')
  const errors = []
  
  lines.forEach((line, index) => {
    const trimmed = line.trim()
    
    // Check table definitions
    if (trimmed.includes('{') && !trimmed.includes('}')) {
      // Check if it's a valid table definition
      if (!trimmed.match(/^\s*\w+\s*{$/)) {
        errors.push(`Line ${index + 1}: Invalid table definition: ${trimmed}`)
      }
    }
    
    // Check relationships
    if (trimmed.includes('||--')) {
      if (!trimmed.match(/^\s*\w+\s+\|\|--[o{}]+\s+\w+\s*:\s*"[^"]+"$/)) {
        errors.push(`Line ${index + 1}: Invalid relationship syntax: ${trimmed}`)
      }
    }
    
    // Check for invalid characters in column definitions
    if (trimmed.match(/^\s+\w+\s+\w+/) && !trimmed.includes('{') && !trimmed.includes('}')) {
      // This might be a column definition
      if (trimmed.includes('"') && !trimmed.match(/"[^"]*"$/)) {
        errors.push(`Line ${index + 1}: Unclosed quote: ${trimmed}`)
      }
    }
  })
  
  return {
    valid: errors.length === 0,
    errors: errors
  }
}

