# Frontend Integration with Django Backend

This document provides instructions on how to integrate the Next.js frontend with the Django backend.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
Create or update your `.env.local` file with the following:
```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

3. Run the frontend development server:
```bash
npm run dev
```

4. Make sure your Django backend is running:
```bash
python manage.py runserver
```

## Authentication Flow

The frontend now uses a hybrid authentication approach:
- Django's token-based authentication for API requests
- NextAuth.js for session management in the frontend

When a user logs in:
1. The frontend sends credentials to the Django backend
2. Django validates the credentials and returns a token
3. The token is stored in the NextAuth.js session
4. The token is used for all subsequent API requests

## API Client

A new API client has been created in `lib/api.ts` that handles all communication with the Django backend. This client:
- Automatically includes authentication tokens in requests
- Provides typed methods for all API endpoints
- Handles error responses consistently

Example usage:
```typescript
import { api } from "@/lib/api";

// Get all courses
const courses = await api.courses.getAll();

// Create a new student
await api.students.create({
  name: "John Doe",
  email: "john@example.com",
  courseId: "course-id"
});
```

## Modified Files

The following files have been modified to work with the Django backend:
- `lib/api.ts` - New API client
- `app/login/page.tsx` - Updated login flow
- `app/api/auth/[...nextauth]/route.ts` - Updated NextAuth configuration
- `middleware.ts` - Updated authentication middleware
- Various pages that make API calls

## Troubleshooting

If you encounter issues with the integration:

1. Check that both servers are running (Next.js and Django)
2. Verify that the `NEXT_PUBLIC_API_URL` is correct in your `.env.local` file
3. Check the browser console and server logs for errors
4. Ensure that CORS is properly configured in the Django backend
5. Clear your browser cookies and local storage if you experience authentication issues 