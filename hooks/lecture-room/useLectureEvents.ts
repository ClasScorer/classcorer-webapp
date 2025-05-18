import { useState, useEffect, useCallback } from "react";
import { Student } from "@/lib/data";
import { FaceData } from "@/types/lecture-room";

export type ActivityEvent = {
  id: string;
  timestamp: Date;
  message: string;
  type: "attention" | "hand-raising" | "system" | "info" | "warning";
  studentId?: string;
  studentName?: string;
};

interface UseLectureEventsProps {
  lectureId: string | null;
  students: Student[];
}

interface UseLectureEventsResult {
  events: ActivityEvent[];
  addEvent: (event: Omit<ActivityEvent, "id" | "timestamp">) => void;
  clearEvents: () => void;
  processFaceDetectionUpdate: (faceData: FaceData[]) => void;
}

export function useLectureEvents({
  lectureId,
  students,
}: UseLectureEventsProps): UseLectureEventsResult {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [previousStatuses, setPreviousStatuses] = useState<
    Map<string, { attention: string; handRaised: boolean }>
  >(new Map());

  // Function to add a new event
  const addEvent = useCallback(
    (event: Omit<ActivityEvent, "id" | "timestamp">) => {
      const newEvent = {
        ...event,
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date(),
      };

      setEvents((prevEvents) => {
        // Keep only the latest 100 events to prevent memory issues
        const updatedEvents = [newEvent, ...prevEvents];
        return updatedEvents.slice(0, 100);
      });
    },
    []
  );

  // Function to clear all events
  const clearEvents = useCallback(() => {
    setEvents([]);
    setPreviousStatuses(new Map());
  }, []);

  // Add a system message when lecture starts or ends
  useEffect(() => {
    if (lectureId) {
      addEvent({
        message: "Lecture started",
        type: "system",
      });
    }
    return () => {
      if (lectureId) {
        // Clean up if component unmounts during active lecture
        addEvent({
          message: "Lecture ended",
          type: "system",
        });
      }
    };
  }, [lectureId, addEvent]);

  // Process face detection updates and generate events
  const processFaceDetectionUpdate = useCallback(
    (faceData: FaceData[]) => {
      if (!lectureId) return;

      // Create a new Map to track current statuses
      const currentStatuses = new Map<
        string,
        { attention: string; handRaised: boolean }
      >();

      // Process each detected face
      faceData.forEach((face) => {
        const personId = face.person_id;
        const attention = face.attention_status.toLowerCase();
        const handRaised = face.hand_raising_status.is_hand_raised;
        
        // Find the student name if available
        const student = students.find((s) => s.id.toString() === personId);
        const studentName = student?.name || "Unknown student";

        // Store current status
        currentStatuses.set(personId, {
          attention,
          handRaised,
        });

        // Get previous status
        const prevStatus = previousStatuses.get(personId);

        // If this is a new face without previous status
        if (!prevStatus) {
          addEvent({
            message: `${studentName} has joined the class`,
            type: "info",
            studentId: personId,
            studentName,
          });
          return;
        }

        // Check for attention status change
        if (prevStatus.attention !== attention) {
          if (attention === "focused") {
            addEvent({
              message: `${studentName} is now focused`,
              type: "attention",
              studentId: personId,
              studentName,
            });
          } else {
            addEvent({
              message: `${studentName} is now unfocused`,
              type: "warning",
              studentId: personId,
              studentName,
            });
          }
        }

        // Check for hand raising status change
        if (prevStatus.handRaised !== handRaised) {
          if (handRaised) {
            addEvent({
              message: `${studentName} has raised their hand`,
              type: "hand-raising",
              studentId: personId,
              studentName,
            });
          } else {
            addEvent({
              message: `${studentName} has lowered their hand`,
              type: "info",
              studentId: personId,
              studentName,
            });
          }
        }
      });

      // Update the previous statuses for the next comparison
      setPreviousStatuses(currentStatuses);
    },
    [lectureId, students, addEvent]
  );

  return {
    events,
    addEvent,
    clearEvents,
    processFaceDetectionUpdate,
  };
} 