import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'

export async function GET() {
  try {
    const csvFilePath = path.join(process.cwd(), 'app/data/events.csv')
    const fileContent = fs.readFileSync(csvFilePath, 'utf-8')
    
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    })

    const events = records.map((record: any) => ({
      id: record.id,
      title: record.title,
      date: record.date,
      time: record.time,
      type: record.type,
      course: record.course || undefined,
      description: record.description,
    }))

    return NextResponse.json(events)
  } catch (error) {
    console.error('Error loading calendar events:', error)
    return NextResponse.json({ error: 'Failed to load calendar events' }, { status: 500 })
  }
} 