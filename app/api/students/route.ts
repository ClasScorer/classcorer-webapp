import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'

export async function GET() {
  try {
    const csvFilePath = path.join(process.cwd(), 'app/data/students.csv')
    const fileContent = fs.readFileSync(csvFilePath, 'utf-8')
    
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    })

    const students = records.map((record: any) => ({
      id: parseInt(record.id, 10),
      name: record.name,
      email: record.email,
      avatar: record.avatar,
      score: parseInt(record.score, 10),
      level: parseInt(record.level, 10),
      average: parseInt(record.average, 10),
      attendance: record.attendance,
      submissions: record.submissions,
      lastSubmission: record.lastSubmission,
      status: record.status,
      trend: record.trend,
      badges: record.badges.split(',').map((b: string) => b.trim()),
      progress: parseInt(record.progress, 10),
      streak: parseInt(record.streak, 10),
      recentAchievement: record.recentAchievement,
      courseId: parseInt(record.courseId, 10),
      grade: record.grade,
    }))

    return NextResponse.json(students)
  } catch (error) {
    console.error('Error loading students:', error)
    return NextResponse.json({ error: 'Failed to load students' }, { status: 500 })
  }
} 