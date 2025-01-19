import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'

export async function GET() {
  try {
    const csvFilePath = path.join(process.cwd(), 'app/data/courses.csv')
    const fileContent = fs.readFileSync(csvFilePath, 'utf-8')
    
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    })

    const courses = records.map((record: any) => ({
      id: parseInt(record.id, 10),
      name: record.name,
      code: record.code,
      instructor: record.instructor,
      description: record.description,
      status: record.status,
      week: parseInt(record.week, 10),
      submissions: parseInt(record.submissions, 10),
      average: parseInt(record.average, 10),
      attendance: parseInt(record.attendance, 10),
      progress: parseInt(record.progress, 10),
      credits: parseInt(record.credits, 10),
      score: parseInt(record.score, 10),
      trend: record.trend,
      lastSubmission: record.lastSubmission,
      totalStudents: parseInt(record.totalStudents, 10),
      passRate: parseInt(record.passRate, 10),
      atRiskCount: parseInt(record.atRiskCount, 10),
      classAverage: parseInt(record.classAverage, 10),
    }))

    return NextResponse.json(courses)
  } catch (error) {
    console.error('Error loading courses:', error)
    return NextResponse.json({ error: 'Failed to load courses' }, { status: 500 })
  }
} 