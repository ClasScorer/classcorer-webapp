import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import prisma from '@/app/lib/prisma';

// Face detection response type
interface HandRaising {
  is_hand_raised: boolean;
  confidence: number;
  hand_position: {
    x: number;
    y: number;
  };
}

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FaceData {
  person_id: string;
  recognition_status: "new" | "known";
  attention_status: "focused" | "unfocused";
  hand_raising_status: HandRaising;
  confidence: number;
  bounding_box: BoundingBox;
}

interface FaceDetectionSummary {
  new_faces: number;
  known_faces: number;
  focused_faces: number;
  unfocused_faces: number;
  hands_raised: number;
}

interface FaceDetectionResponse {
  lecture_id: string;
  timestamp: string;
  total_faces: number;
  faces: FaceData[];
  summary: FaceDetectionSummary;
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication - but allow development access
    let userId = 'dev-user-id';
    let isDevMode = false;
    
    try {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        userId = session.user.id as string;
      } else if (process.env.NODE_ENV === 'production') {
        // Only enforce strict auth in production
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      } else {
        isDevMode = true;
        console.log('DEV MODE: Using dev-user-id for authentication');
      }
    } catch (authError) {
      console.warn('Auth check failed, using development fallback:', authError);
      // Continue with development fallback in dev mode
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'Authentication error' },
          { status: 500 }
        );
      }
      isDevMode = true;
    }

    // Get the form data with the image and lecture ID
    const formData = await req.formData();
    const lecture_id = formData.get('lecture_id') as string;
    const image = formData.get('image') as File;

    if (!lecture_id || !image) {
      return NextResponse.json(
        { error: 'Missing required fields: lecture_id and image' },
        { status: 400 }
      );
    }

    // Get the students enrolled in the course for this lecture
    let studentIds: string[] = [];
    try {
      // Fetch the lecture to get course ID
      const lecture = await prisma.lecture.findUnique({
        where: { id: lecture_id },
        select: { courseId: true }
      });

      if (!lecture) {
        return NextResponse.json(
          { error: 'Lecture not found' },
          { status: 404 }
        );
      }

      // Get students enrolled in this course through the StudentEnrollment model
      const enrollments = await prisma.studentEnrollment.findMany({
        where: { 
          courseId: lecture.courseId
        },
        include: {
          student: {
            select: { id: true }
          }
        }
      });

      studentIds = enrollments.map(enrollment => enrollment.student.id);
    } catch (error) {
      console.warn('Error fetching enrolled students:', error);
      // In dev mode, continue with mock student IDs
      if (!isDevMode) {
        return NextResponse.json(
          { error: 'Failed to fetch enrolled students' },
          { status: 500 }
        );
      }
    }

    // If no students found or in dev mode, use some mock IDs
    if (studentIds.length === 0) {
      studentIds = ["student-1", "student-2", "student-3", "student-4", "student-5"];
    }

    // Generate random data for face detection (in a real app, this would process the image)
    const numStudents = studentIds.length;
    const maxFaces = Math.min(numStudents, 5); // Maximum 5 faces
    const detectedFaces = Math.floor(Math.random() * maxFaces) + 1; // At least 1 face

    // Generate a mix of known and new faces
    const knownFaces = Math.floor(Math.random() * detectedFaces) + 1;
    const newFaces = detectedFaces - knownFaces;

    // Generate focused vs unfocused stats
    const focusedFaces = Math.floor(Math.random() * knownFaces) + 1;
    const unfocusedFaces = knownFaces - focusedFaces;

    // Generate random number of students raising hands
    const handsRaised = Math.floor(Math.random() * knownFaces);

    // Prepare the face data array
    const faces = [];

    // Add known faces (recognized students)
    const shuffledStudentIds = [...studentIds].sort(() => 0.5 - Math.random());
    for (let i = 0; i < knownFaces; i++) {
      const studentId = shuffledStudentIds[i];
      const isFocused = i < focusedFaces;
      const isHandRaised = i < handsRaised;

      faces.push({
        person_id: studentId,
        recognition_status: "known",
        attention_status: isFocused ? "focused" : "unfocused",
        hand_raising_status: {
          is_hand_raised: isHandRaised,
          confidence: isHandRaised ? Math.random() * 0.3 + 0.7 : Math.random() * 0.2,
          hand_position: {
            x: Math.random(),
            y: Math.random()
          }
        },
        confidence: Math.random() * 0.2 + 0.8,
        bounding_box: {
          x: Math.random() * 0.8,
          y: Math.random() * 0.8,
          width: Math.random() * 0.2 + 0.1,
          height: Math.random() * 0.2 + 0.1
        }
      });
    }

    // Add unknown faces
    for (let i = 0; i < newFaces; i++) {
      const isFocused = Math.random() > 0.5;
      const isHandRaised = Math.random() > 0.8;

      faces.push({
        person_id: `unknown-${i}`,
        recognition_status: "new",
        attention_status: isFocused ? "focused" : "unfocused",
        hand_raising_status: {
          is_hand_raised: isHandRaised,
          confidence: isHandRaised ? Math.random() * 0.3 + 0.6 : Math.random() * 0.2,
          hand_position: {
            x: Math.random(),
            y: Math.random()
          }
        },
        confidence: Math.random() * 0.3 + 0.6,
        bounding_box: {
          x: Math.random() * 0.8,
          y: Math.random() * 0.8,
          width: Math.random() * 0.2 + 0.1,
          height: Math.random() * 0.2 + 0.1
        }
      });
    }

    // Prepare the response object
    const response = {
      lecture_id,
      timestamp: new Date().toISOString(),
      total_faces: detectedFaces,
      faces,
      summary: {
        new_faces: newFaces,
        known_faces: knownFaces,
        focused_faces: focusedFaces,
        unfocused_faces: unfocusedFaces,
        hands_raised: handsRaised
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error processing face detection:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
} 