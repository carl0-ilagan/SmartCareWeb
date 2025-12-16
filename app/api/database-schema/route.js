import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET() {
  try {
    // Read the SQL file from the project root
    const filePath = join(process.cwd(), 'crownsysfinal (2).sql')
    const sqlContent = await readFile(filePath, 'utf-8')
    
    return new Response(sqlContent, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    })
  } catch (error) {
    console.error('Error reading SQL file:', error)
    return new Response('Error loading SQL file', { status: 500 })
  }
}

