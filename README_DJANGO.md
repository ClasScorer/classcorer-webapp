# Django Backend

This is a Django REST API backend for the application. It replaces the previous Next.js API routes.

## Setup

1. Install dependencies:
```bash
pip install django djangorestframework django-cors-headers psycopg2-binary python-dotenv
```

2. Run migrations and create a superuser:
```bash
python setup.py
```

3. Run the development server:
```bash
python manage.py runserver
```

## API Endpoints

### Authentication
- `POST /api/register/` - Register a new user
- `POST /api/login/` - Login a user
- `POST /api/logout/` - Logout a user
- `GET /api/user/` - Get the current user

### Courses
- `GET /api/courses/` - List all courses
- `POST /api/courses/` - Create a new course
- `GET /api/courses/{id}/` - Get a specific course
- `PUT /api/courses/{id}/` - Update a course
- `DELETE /api/courses/{id}/` - Delete a course

### Students
- `GET /api/students/` - List all students
- `POST /api/students/` - Create a new student
- `GET /api/students/{id}/` - Get a specific student
- `PUT /api/students/{id}/` - Update a student
- `DELETE /api/students/{id}/` - Delete a student

### Events
- `GET /api/events/` - List all events
- `POST /api/events/` - Create a new event
- `GET /api/events/{id}/` - Get a specific event
- `PUT /api/events/{id}/` - Update an event
- `DELETE /api/events/{id}/` - Delete an event

## Authentication

The API uses token authentication. To authenticate, include the token in the Authorization header:

```
Authorization: Token <your-token>
```

You can get a token by logging in with the `/api/login/` endpoint.

## Admin Interface

The admin interface is available at `/admin/`. You can use it to manage all the data in the application.

## Database

The application uses PostgreSQL as the database. The connection details are read from the `.env` file.

## Frontend Integration

Update your frontend API calls to use the new Django endpoints. The API structure is similar to the previous Next.js API routes, so minimal changes should be required. 