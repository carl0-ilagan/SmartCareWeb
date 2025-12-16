/**
 * Database Schema Parser
 * Parses SQL dump file to extract table structures and relationships
 */

export function parseSQLSchema(sqlContent) {
  const tables = []
  const relationships = []
  const tableMap = new Map()
  
  // Extract CREATE TABLE statements - improved regex to handle multiline
  const createTableRegex = /CREATE TABLE `(\w+)`\s*\(([\s\S]*?)\)\s*ENGINE/gi
  let match
  
  while ((match = createTableRegex.exec(sqlContent)) !== null) {
    const tableName = match[1]
    const tableBody = match[2]
    
    const columns = []
    const primaryKeys = []
    
    // Split by lines and process each
    const lines = tableBody.split('\n')
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim()
      
      // Skip comments and empty lines
      if (!line || line.startsWith('--')) continue
      
      // Handle column definitions
      if (line.startsWith('`')) {
        // Extract column: `column_name` TYPE ATTRIBUTES
        // Handle types like: bigint(20) UNSIGNED, enum('val1','val2'), varchar(255)
        const columnMatch = line.match(/`([^`]+)`\s+(\w+(?:\([^)]+\))?(?:\s+\w+)?)\s*(.*?)(?:,|$)/)
        if (columnMatch) {
          const columnName = columnMatch[1]
          let columnType = columnMatch[2]
          const columnAttrs = (columnMatch[3] || '').trim()
          
          // Extract base type (remove size/values in parentheses and modifiers like UNSIGNED)
          // Examples: bigint(20) UNSIGNED -> bigint, enum('a','b') -> enum
          columnType = columnType.split(/\s+/)[0] // Get first word
          columnType = columnType.replace(/\([^)]+\)/, '') // Remove parentheses content
          columnType = columnType.toUpperCase().trim()
          
          const isPrimaryKey = columnName === 'id' || 
                               columnAttrs.includes('PRIMARY KEY') ||
                               columnAttrs.match(/PRIMARY\s+KEY/i)
          const isNullable = !columnAttrs.includes('NOT NULL') && !isPrimaryKey && 
                            (columnAttrs.includes('NULL') || columnAttrs.includes('DEFAULT NULL'))
          const isForeignKey = columnName.endsWith('_id') && columnName !== 'id'
          
          columns.push({
            name: columnName,
            type: columnType,
            nullable: isNullable,
            primaryKey: isPrimaryKey,
            foreignKey: isForeignKey
          })
          
          if (isPrimaryKey) {
            primaryKeys.push(columnName)
          }
        }
      }
    }
    
    const tableData = {
      name: tableName,
      columns: columns,
      primaryKeys: primaryKeys
    }
    
    tables.push(tableData)
    tableMap.set(tableName, tableData)
  }
  
  // Extract FOREIGN KEY constraints from ALTER TABLE statements
  // Handle both single-line and multi-line formats
  const alterTableRegex = /ALTER TABLE `(\w+)`\s+ADD CONSTRAINT `([^`]+)`\s+FOREIGN KEY\s+\(`([^`]+)`\)\s+REFERENCES `(\w+)`\s+\(`([^`]+)`\)/gi
  while ((match = alterTableRegex.exec(sqlContent)) !== null) {
    const fromTable = match[1]
    const fromColumn = match[3]
    const toTable = match[4]
    const toColumn = match[5]
    
    // Only add if both tables exist
    if (tableMap.has(fromTable) && tableMap.has(toTable)) {
      // Check if relationship already exists
      const exists = relationships.find(r => 
        r.fromTable === fromTable && 
        r.fromColumn === fromColumn &&
        r.toTable === toTable
      )
      
      if (!exists) {
        relationships.push({
          fromTable: fromTable,
          fromColumn: fromColumn,
          toTable: toTable,
          toColumn: toColumn,
          constraintName: match[2]
        })
      }
    }
  }
  
  // Also check for ADD CONSTRAINT statements that might be on separate lines
  const multiLineFKRegex = /ALTER TABLE `(\w+)`\s+ADD CONSTRAINT `([^`]+)`\s+FOREIGN KEY\s+\(`([^`]+)`\)\s+REFERENCES `(\w+)`\s+\(`([^`]+)`\)\s+ON DELETE\s+(\w+)/gi
  while ((match = multiLineFKRegex.exec(sqlContent)) !== null) {
    const fromTable = match[1]
    const fromColumn = match[3]
    const toTable = match[4]
    const toColumn = match[5]
    
    if (tableMap.has(fromTable) && tableMap.has(toTable)) {
      const exists = relationships.find(r => 
        r.fromTable === fromTable && 
        r.fromColumn === fromColumn &&
        r.toTable === toTable
      )
      
      if (!exists) {
        relationships.push({
          fromTable: fromTable,
          fromColumn: fromColumn,
          toTable: toTable,
          toColumn: toColumn,
          constraintName: match[2]
        })
      }
    }
  }
  
  // Also infer relationships from column names ending with _id
  tables.forEach(table => {
    table.columns.forEach(column => {
      if (column.name.endsWith('_id') && column.name !== 'id') {
        // Try different naming patterns
        const baseName = column.name.replace('_id', '')
        const possibleTableNames = [
          baseName + 's',
          baseName,
          baseName + 'es'
        ]
        
        const matchingTable = tables.find(t => 
          possibleTableNames.includes(t.name.toLowerCase()) ||
          t.name.toLowerCase() === baseName ||
          t.name.toLowerCase().includes(baseName)
        )
        
        if (matchingTable) {
          // Check if relationship already exists
          const exists = relationships.find(r => 
            r.fromTable === table.name && 
            r.fromColumn === column.name &&
            r.toTable === matchingTable.name
          )
          
          if (!exists) {
            relationships.push({
              fromTable: table.name,
              fromColumn: column.name,
              toTable: matchingTable.name,
              toColumn: 'id'
            })
          }
        }
      }
    })
  })
  
  return { tables, relationships }
}

/**
 * Generate Mermaid ER Diagram syntax
 */
export function generateMermaidDiagram(tables, relationships) {
  let mermaid = 'erDiagram\n\n'
  
  // Add tables with formatted columns
  tables.forEach(table => {
    // Escape table name if it contains special characters
    const tableName = escapeTableName(table.name)
    mermaid += `    ${tableName} {\n`
    
    // Show primary keys first, then other columns
    const pkColumns = table.columns.filter(c => c.primaryKey)
    const otherColumns = table.columns.filter(c => !c.primaryKey)
    
    // Primary keys
    pkColumns.forEach(column => {
      const type = formatType(column.type)
      const columnName = escapeColumnName(column.name)
      mermaid += `        ${type} ${columnName} PK\n`
    })
    
    // Other columns (limit to important ones for readability)
    const importantColumns = otherColumns.slice(0, 12) // Show first 12 non-PK columns
    importantColumns.forEach(column => {
      const type = formatType(column.type)
      const columnName = escapeColumnName(column.name)
      const fk = column.foreignKey ? ' FK' : ''
      mermaid += `        ${type} ${columnName}${fk}\n`
    })
    
    // Show count of hidden columns if any
    if (otherColumns.length > 12) {
      mermaid += `        string more_columns_${otherColumns.length - 12}_more\n`
    }
    
    mermaid += '    }\n\n'
  })
  
  // Add relationships
  const addedRelationships = new Set()
  relationships.forEach(rel => {
    const fromTable = tables.find(t => t.name === rel.fromTable)
    const toTable = tables.find(t => t.name === rel.toTable)
    
    if (fromTable && toTable) {
      const fromTableName = escapeTableName(rel.fromTable)
      const toTableName = escapeTableName(rel.toTable)
      const fromColumnName = escapeColumnName(rel.fromColumn)
      
      // Create unique relationship key to avoid duplicates
      const relKey = `${fromTableName}-${toTableName}-${fromColumnName}`
      
      if (!addedRelationships.has(relKey)) {
        // Use correct relationship syntax: one-to-many (||--o{)
        // Format: TABLE1 ||--o{ TABLE2 : "column_name"
        mermaid += `    ${fromTableName} ||--o{ ${toTableName} : "${fromColumnName}"\n`
        addedRelationships.add(relKey)
      }
    }
  })
  
  return mermaid.trim() + '\n'
}

function escapeTableName(name) {
  // Mermaid table names should be valid identifiers
  // Keep alphanumeric and underscores, replace others with underscore
  if (!name || name.length === 0) return 'table'
  return name.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^[0-9]/, '_$&')
}

function escapeColumnName(name) {
  // Mermaid column names in relationships should be valid strings
  if (!name || name.length === 0) return 'column'
  // Keep most characters but escape quotes
  return name.replace(/"/g, "'")
}

function formatType(type) {
  // Simplify type names for better readability in Mermaid
  // Mermaid ER diagrams support: int, string, double, float, date, datetime, timestamp, boolean
  const typeMap = {
    'BIGINT': 'int',
    'VARCHAR': 'string',
    'TEXT': 'string',
    'INT': 'int',
    'INTEGER': 'int',
    'DECIMAL': 'double',
    'DATE': 'date',
    'DATETIME': 'datetime',
    'TIMESTAMP': 'timestamp',
    'TIME': 'string',
    'TINYINT': 'int',
    'ENUM': 'string',
    'MEDIUMTEXT': 'string',
    'LONGTEXT': 'string',
    'FLOAT': 'float',
    'DOUBLE': 'double',
    'BOOLEAN': 'boolean',
    'BOOL': 'boolean'
  }
  
  const upperType = type.toUpperCase().trim()
  return typeMap[upperType] || 'string'
}

