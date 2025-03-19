import { NextResponse } from 'next/server'
import { loadCourses } from '@/lib/data'

export async function GET() {
  try {
    const courses = await loadCourses()
    return NextResponse.json(courses)
  } catch (error) {
    console.error('[COURSES_GET]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
} 