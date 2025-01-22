import { sql } from "drizzle-orm"
import { text, integer, sqliteTable, primaryKey } from "drizzle-orm/sqlite-core"

// ... existing tables ...

export const lectures = sqliteTable('lectures', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  courseId: text('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  scheduledFor: text('scheduled_for').notNull(),
  duration: integer('duration').notNull(),
  description: text('description'),
  instructorName: text('instructor_name').notNull(),
  instructorTitle: text('instructor_title').notNull(),
  instructorAvatar: text('instructor_avatar'),
  recordingUrl: text('recording_url'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
})

// ... existing tables ... 