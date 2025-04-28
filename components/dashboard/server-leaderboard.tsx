'use server';

import { loadStudents } from "@/lib/data";
import dynamic from 'next/dynamic';

// Use dynamic import for the client component
const StudentLeaderboard = dynamic(() => import('./student-leaderboard').then(mod => mod.StudentLeaderboard));

export async function ServerLeaderboard() {
  // Pre-load the data on the server
  await loadStudents();
  
  // Then render the client component which will use the cached data
  return <StudentLeaderboard />;
} 