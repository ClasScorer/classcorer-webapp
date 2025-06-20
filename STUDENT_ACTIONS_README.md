# Student Actions System - Implementation Guide

## Overview

The Student Actions System enables real-time interaction with detected faces during lectures, allowing instructors to:
- Identify unknown students
- Award or deduct points
- Override attendance
- Add notes
- Perform manual actions on detected faces

## 🚀 New Features Implemented

### 1. **Click-to-Action Interface**
- Click on any detected face in the video feed
- Context menu appears with available actions
- Smart positioning that avoids screen edges

### 2. **Student Identification**
- Link unknown faces to specific students
- Searchable student dropdown
- Frame data storage for verification
- Conflict detection (person already mapped)

### 3. **Point Management**
- Quick point awards (3, 5, 10 points)
- Quick point deductions (-2, -5 points)
- Custom point amounts with validation
- Context-aware suggestions based on attention status

### 4. **Action Logging**
- Complete audit trail of all instructor actions
- Detailed metadata including face data
- Timestamps and reasoning
- Integration with existing scoring system

## 🆕 New Components Added

### 1. **ActionConfirmation**
- Visual feedback component that appears after actions
- Auto-dismisses after configurable delay
- Supports different styles for different action types
- Uses Framer Motion for smooth animations

### 2. **NoteDialog**
- Modal dialog for adding instructor notes
- Input validation and error handling
- Consistent styling with other dialogs
- Responsive layout for all devices

### 3. **Action History System**
- Complete tracking of all actions performed
- Filtering by student, action type, and date range
- API endpoints for history retrieval and management
- Hooks for easy integration in UI components

## 📁 File Structure

### Types
```
types/
├── student-actions.ts      # Core action types and interfaces
└── index.ts               # Export consolidation
```

### Utilities
```
lib/utils/
├── click-detection.ts     # Canvas click and coordinate conversion
└── student-actions.ts     # Validation, formatting, and helpers
```

### Hooks
```
hooks/
├── lecture-room/
│   ├── useClickDetection.ts    # Canvas click handling
│   ├── useContextMenu.ts       # Menu state management  
│   └── useStudentActions.ts    # API calls for actions
└── dashboard/
    └── useCourseStudents.ts    # Student data fetching
```

### API Routes
```
app/api/
├── students/
│   ├── identify/route.ts                    # Student identification
│   └── [studentId]/score/route.ts         # Point management
├── lectures/[lectureId]/actions/route.ts   # Action logging
└── courses/[courseId]/students/route.ts    # Student listing
```

### Components
```
components/lecture-room/
├── StudentActionMenu.tsx           # Context menu
├── StudentIdentificationDialog.tsx # ID selection dialog
├── PointAwardDialog.tsx           # Point entry dialog
├── ActionConfirmation.tsx         # Success/error feedback
└── StudentActionIntegration.tsx   # Main orchestrator
```

### Database Models
```
prisma/schema.prisma (additions):
- StudentAction         # Action records
- PersonStudentMapping  # Face-to-student links
- StudentActionType     # Action type enum
- ActionStatus         # Status enum
```

## 🔧 Integration

### Basic Usage
```tsx
import { StudentActionIntegration } from '@/components/lecture-room/StudentActionIntegration';

// In your VideoFeed component:
<StudentActionIntegration
  canvasRef={canvasRef}
  detectedFaces={faceData?.faces || []}
  courseId={courseId}
  lectureId={lectureId}
  students={students}
>
  <canvas 
    ref={canvasRef}
    // ... other props
  />
</StudentActionIntegration>
```

### Key Props
- `canvasRef`: Reference to the video canvas element
- `detectedFaces`: Array of face detection results
- `courseId`: Current course identifier
- `lectureId`: Current lecture identifier  
- `students`: List of enrolled students

## 🎯 Action Types

### 1. **IDENTIFY**
Links an unknown face to a specific student
- Opens student selection dialog
- Validates against existing mappings
- Updates attendance records automatically

### 2. **SCORE_AWARD** 
Awards points to a student
- Quick buttons for common values (3, 5, 10)
- Custom point entry for larger amounts
- Reason field for documentation

### 3. **SCORE_DEDUCT**
Deducts points from a student  
- Quick buttons for common penalties (-2, -5)
- Custom deduction amounts
- Mandatory reason field

### 4. **ATTENDANCE_OVERRIDE**
Manually marks attendance status
- Overrides AI-detected attendance
- Useful for edge cases and corrections

### 5. **MANUAL_NOTE**
Adds instructor notes
- Free-form text entry
- Timestamped automatically
- Useful for behavioral observations

## 🔄 Integration Flow

The complete action flow now includes:
1. Click on student face in video feed
2. Context menu appears with action options
3. Select action type (identify, award points, etc.)
4. Complete action in appropriate dialog
5. Receive visual confirmation via ActionConfirmation
6. Action is logged to history system

## 🛠️ Technical Implementation

### Click Detection Flow
1. Canvas receives click event
2. Convert screen coordinates to normalized coordinates
3. Check if click intersects any face bounding box
4. Return clicked face data and position
5. Open context menu at click location

### Face-to-Student Mapping
- Uses `PersonStudentMapping` table
- Links AI `person_id` to database `student_id`
- Scoped per lecture for session isolation
- Includes confidence scores and verification status

### Point Management
- Integrates with existing `ScoringConfig` system
- Updates `StudentEngagement` records
- Creates `StudentAction` audit records
- Validates against configured limits

### Database Transactions
- All actions are properly wrapped in transactions
- Rollback on failure to maintain consistency
- Optimistic updates with error handling

## 📊 API Endpoints

### `POST /api/students/identify`
Maps a detected person to a student
```json
{
  "personId": "ai_generated_id",
  "studentId": "student_uuid", 
  "lectureId": "lecture_uuid",
  "confidence": 0.85,
  "boundingBox": { "x": 0.1, "y": 0.2, "width": 0.15, "height": 0.2 }
}
```

### `POST /api/students/[studentId]/score`
Awards or deducts points
```json
{
  "lectureId": "lecture_uuid",
  "points": 5,
  "actionType": "award",
  "reason": "Correct answer with hand raised"
}
```

### `GET/POST /api/lectures/[lectureId]/actions`
Manages action logs
- GET: Retrieve action history with pagination
- POST: Log new action events

### `GET /api/courses/[courseId]/students`
Fetches course students for identification
- Supports search filtering
- Includes student stats and avatars
- Optimized for dropdown components

## 🎨 User Experience

### Visual Feedback
- **Hover Effects**: Canvas cursor changes over faces
- **Loading States**: Spinners during API calls  
- **Success Toasts**: Confirmation of completed actions
- **Error Handling**: Clear error messages and fallbacks

### Keyboard Shortcuts
- **Escape**: Close any open dialog/menu
- **Enter**: Confirm dialog actions
- **Tab**: Navigate dialog elements

### Mobile Support
- Touch-friendly hit targets
- Responsive dialog sizing
- Gesture support for canvas interactions

## 🚨 Error Handling

### Network Failures
- Retry mechanisms for failed API calls
- Offline detection and queuing
- Graceful degradation when services unavailable

### Validation Errors
- Client-side validation before API calls
- Server-side validation with detailed error messages
- Form validation with real-time feedback

### Edge Cases
- Duplicate identification attempts
- Invalid point values
- Missing student/lecture data
- Canvas not available

## 🔒 Security & Permissions

### Authentication
- All API routes require valid session
- User permissions checked against course ownership
- Student data isolation by instructor

### Data Validation
- Input sanitization on all endpoints
- Point value limits enforced
- Bounding box coordinate validation
- SQL injection protection via Prisma

### Privacy
- Face data stored with explicit consent model
- Optional frame data storage (can be disabled)
- GDPR-compliant data handling
- Student data access controls

## 📈 Performance Optimizations

### Click Detection
- Efficient coordinate conversion
- Minimal DOM updates
- Event delegation patterns
- Debounced rapid clicks

### Database Queries
- Indexed foreign keys
- Optimized joins with select clauses
- Pagination for large datasets
- Connection pooling

### Real-time Updates
- Optimistic UI updates
- Background sync for consistency
- Efficient state management
- Memory leak prevention

## 🧪 Testing Strategy

### Unit Tests
- Utility function validation
- Hook behavior testing
- Component interaction tests
- API endpoint validation

### Integration Tests
- End-to-end action flows
- Database transaction integrity
- Error scenario handling
- Performance benchmarks

### Manual Testing
- Cross-browser compatibility
- Mobile device testing
- Network condition simulation
- Accessibility compliance

## 🚀 Future Enhancements

### Planned Features
- **Batch Actions**: Select multiple faces for group actions
- **Custom Action Types**: User-defined action categories
- **Analytics Dashboard**: Action pattern analysis
- **Keyboard Shortcuts**: Power user efficiency features
- **Voice Commands**: Hands-free operation during lectures

### Performance Improvements
- **Canvas Virtualization**: Efficient rendering for large classes
- **Background Processing**: Async action processing
- **Caching Strategy**: Smart data caching for repeated operations
- **WebSocket Integration**: Real-time collaboration features

---

## 📞 Support

For implementation questions or issues:
1. Check the existing codebase patterns in `components/lecture-room/`
2. Review similar API implementations in `app/api/`
3. Reference the type definitions in `types/`
4. Follow the established error handling patterns

This implementation follows the existing ClassScorer architecture and maintains compatibility with all current features while adding powerful new functionality for instructor-student interaction during live lectures. 