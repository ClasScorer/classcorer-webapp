# Database Seeding

This directory contains the database seeding script that populates the application with test data.

## Usage

To reset and seed the database:

```bash
npx prisma migrate reset --force
```

## Seed Data Details

### Users

#### Admin
- **Email:** admin@university.edu
- **Password:** admin123
- **Role:** ADMIN
- **Department:** Computer Science

#### Professors
1. **Dr. Maria Rodriguez**
   - **Email:** rodriguez@university.edu
   - **Password:** faculty123
   - **Department:** Computer Science
   - **Courses:** CS101, CS201, CS301

2. **Dr. James Wilson**
   - **Email:** wilson@university.edu
   - **Password:** faculty123
   - **Department:** Mathematics
   - **Courses:** MATH201

3. **Dr. Li Wei**
   - **Email:** wei@university.edu
   - **Password:** faculty123
   - **Department:** Engineering
   - **Courses:** CS401

### Courses
1. **CS101 - Introduction to Programming**
   - Fundamentals of programming with Python
   - 3 credits
   - Instructor: Dr. Maria Rodriguez

2. **CS201 - Data Structures & Algorithms**
   - Advanced data structures and algorithm analysis
   - 3 credits
   - Instructor: Dr. Maria Rodriguez

3. **CS301 - Database Systems**
   - Design and implementation of database systems
   - 3 credits
   - Instructor: Dr. Maria Rodriguez

4. **MATH201 - Linear Algebra**
   - Vector spaces, matrices, and linear transformations
   - 3 credits
   - Instructor: Dr. James Wilson

5. **CS401 - Machine Learning**
   - Principles and applications of machine learning algorithms
   - 3 credits
   - Instructor: Dr. Li Wei

### Badges
1. **Top Performer**
   - Criteria: 90+ average score across 5+ submissions

2. **Perfect Attendance**
   - Criteria: All PRESENT attendances in 10+ lectures

3. **Quiz Master**
   - Criteria: 3+ perfect quiz scores

4. **Problem Solver**
   - Awarded randomly (30% chance)

5. **Team Player**
   - Awarded randomly (30% chance)

6. **Fast Learner**
   - Awarded randomly (30% chance)

### Students
20 students with diverse names, each:
- Enrolled in 1-3 random courses
- Performance based on student ID (60-96 base score)
- Random variations of ±10 points
- 80% submission rate
- 20% late submission rate
- 70% graded submissions

### Course Content per Course
- 5-10 assignments (mix of quizzes, projects, exams)
- 15-20 lectures with specific topics
- 3-5 course announcements
- Student submissions with realistic scores
- Attendance records
- Student engagement data

### Engagement Data
- Focus scores: 0-100
- Attention duration: Based on focus score
- Distraction count: Inverse of focus score
- Hand raised count: 0-2 per lecture
- Detection confidence: 85-100%

## Data Generation Patterns

### Performance Distribution
- Base score = 60 + (studentQuality * 4)
- studentQuality = student.id.charCodeAt(0) % 10
- Random variation: ±10 points
- Final score capped between 0-100

### Attendance Patterns
- Student quality affects attendance probability
- Quality factor = studentQuality / 10
- Absent: 10% - (qualityFactor * 5%)
- Late: 25% - (qualityFactor * 15%)
- Present: Remaining probability

### Engagement Patterns
- Base engagement = 50 + (studentQuality * 5)
- Random variation: ±10 points
- Engagement levels:
  - Low: < 40
  - Medium: 40-74
  - High: ≥ 75

## Helper Functions

### `generateFeedback(score)`
Returns personalized feedback based on score ranges:
- ≥90: "Excellent work! You've demonstrated a thorough understanding of the material."
- ≥80: "Good job! You've shown a solid grasp of the concepts with a few minor errors."
- ≥70: "Satisfactory work with good effort, but there's room for improvement in understanding key concepts."
- ≥60: "You've met the minimum requirements, but should review the material more carefully."
- <60: "This submission needs significant improvement. Please review the course materials and consider visiting office hours."

### `generateLectureTitle(courseCode, lectureNumber)`
Returns specific lecture titles based on course code and lecture number. Each course has 15 predefined lecture topics.

### `generateAnnouncementContent(title, courseName)`
Returns contextual announcement content based on the announcement type and course name. 