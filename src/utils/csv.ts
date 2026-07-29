export function parseCSV(csvString: string): Record<string, string>[] {
  const lines = csvString.split(/\r?\n/).filter(l => l.trim().length > 0)
  if (lines.length < 2) return []
  
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
  const results = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim())
    const obj: Record<string, string> = {}
    
    headers.forEach((header, index) => {
      obj[header] = values[index] || ''
    })
    results.push(obj)
  }
  
  return results
}
