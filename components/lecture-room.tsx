// Handle chat message
  const handleSendMessage = () => {
    if (messageInput.trim()) {
      // In a real app, this would send the message to a backend
      const professorMessage = {
        student: {
          id: 'professor',
          name: 'Professor',
          email: course.instructor,
          avatar: '/avatars/professor.jpg',
          status: 'Excellent',
          courseId: course.id,
          score: 100,
          attendance: 100,
          level: 'Professor',
          average: 100,
          submissions: course.submissions,
          lastSubmission: course.lastSubmission,
          grade: 'A+',
          trend: 'up',
        } as Student,
        text: messageInput
      }
      setMessages(prev => [...prev, professorMessage])
      setMessageInput("")
    }
  }
  
  // Track session ID for the presentation window
  const [presentationSessionId, setPresentationSessionId] = useState<string | null>(null);
  
  // Function to send activity updates to the API
  const sendActivityUpdate = useCallback(async (activities: any[]) => {
    if (!presentationSessionId || !lectureId) return;
    
    try {
      // Ensure all activities have unique IDs and timestamps
      const enhancedActivities = activities.map(activity => ({
        ...activity,
        id: activity.id || `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: activity.timestamp || new Date(),
      }));
      
      // Send to the activity API endpoint (not the engagement endpoint)
      await fetch('/api/activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: presentationSessionId,
          lectureId,
          activities: enhancedActivities
        }),
      });
    } catch (error) {
      console.error('Error sending activity update:', error);
    }
  }, [presentationSessionId, lectureId]);
  
  // Send activity updates when face data changes
  useEffect(() => {
    if (!presentationSessionId || !faceData || !faceData.faces) return;
    
    const activities = [];
    
    // Process hand raises
    const handRaisedStudents = faceData.faces.filter(face => 
      face.hand_raising_status?.is_hand_raised && 
      face.recognition_status === "known"
    );
    
    for (const face of handRaisedStudents) {
      const student = students.find(s => s.id === face.person_id);
      const studentName = student?.name || `Student ${face.person_id}`;
      
      activities.push({
        message: `${studentName} raised their hand`,
        type: 'warning',
        studentId: face.person_id,
        studentName,
        actionType: 'hand_raised'
      });
    }
    
    // Process focus changes from previous state
    if (previousFaceData && previousFaceData.faces) {
      faceData.faces.forEach(face => {
        if (face.recognition_status !== "known") return;
        
        const prevFace = previousFaceData.faces.find(f => f.person_id === face.person_id);
        if (prevFace && prevFace.attention_status !== face.attention_status) {
          const student = students.find(s => s.id === face.person_id);
          const studentName = student?.name || `Student ${face.person_id}`;
          const isFocused = face.attention_status.toLowerCase() === "focused";
          
          activities.push({
            message: `${studentName} is now ${isFocused ? 'focused' : 'unfocused'}`,
            type: isFocused ? 'success' : 'info',
            studentId: face.person_id,
            studentName,
            actionType: 'focus_change',
            focused: isFocused
          });
        }
      });
    }
    
    if (activities.length > 0) {
      sendActivityUpdate(activities);
    }
    
  }, [faceData, students, sendActivityUpdate, presentationSessionId]);
  
  // Keep track of previous face data to detect changes
  const [previousFaceData, setPreviousFaceData] = useState<EnhancedFaceDetectionResponse | null>(null);
  
  useEffect(() => {
    if (faceData) {
      setPreviousFaceData(faceData);
    }
  }, [faceData]);

  // Update the openPresentationDisplay function to include sessionId
  const openPresentationDisplay = () => {
    // Generate a unique session ID for this presentation window
    const sessionId = Date.now().toString();
    setPresentationSessionId(sessionId);
    
    // Construct URL with presentation data
    let url = `/presentation?`;
    if (presentationData) {
      url += `presentationId=${presentationData.id}&`;
    }
    if (embedUrl) {
      url += `embedUrl=${encodeURIComponent(embedUrl)}&`;
    }
    if (lectureId) {
      url += `lectureId=${lectureId}&`;
    }
    url += `sessionId=${sessionId}`;
    
    // Open in a new window
    window.open(
      url, 
      'presentationWindow', 
      'toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=1200,height=800'
    );
    
    toast.success("Presentation opened in new window");
  };

  // Generate simulated face detection data for testing
  const simulateDetectionData = () => {
    // Generate mock face detection data (this doesn't need to go to DB)
    const mockData = {
      session_id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      total_faces: Math.floor(Math.random() * 3) + 3,
      faces: generateRandomFaces(),
      summary: {
        new_faces: Math.floor(Math.random() * 2),
        known_faces: Math.floor(Math.random() * 4) + 1,
        focused_faces: Math.floor(Math.random() * 3) + 2,
        unfocused_faces: Math.floor(Math.random() * 2),
        hands_raised: Math.floor(Math.random() * 2)
      },
      classEngagement: Math.random() * 80 + 20
    };
    
    // Update local state only - don't send to database
    setFaceData(mockData);
    console.log("Generated simulated face detection data:", mockData);
    
    // Skip the saveEngagementData call that updates the database
    // saveEngagementData(mockData); <- This was causing DB errors
    
    // Simulate activity data for presentation if a session is active
    if (presentationSessionId && students.length > 0) {
      const simulatedActivities = [];
      const timestamp = new Date();
      const uniquePrefix = Date.now();
      
      // Random hand raises (0-2 students)
      const numHandRaises = Math.floor(Math.random() * 3); // 0-2 students
      if (numHandRaises > 0 && students.length > 0) {
        // Randomly select students to raise hands
        const handRaisers = [...students]
          .sort(() => 0.5 - Math.random())
          .slice(0, Math.min(numHandRaises, students.length));
          
        for (let i = 0; i < handRaisers.length; i++) {
          const student = handRaisers[i];
          simulatedActivities.push({
            id: `hr-${uniquePrefix}-${i}-${student.id}`,
            message: `${student.name} raised their hand`,
            type: 'warning',
            studentId: student.id,
            studentName: student.name,
            actionType: 'hand_raised',
            timestamp: new Date(timestamp.getTime() + i * 100) // Slightly different timestamps
          });
        }
      }
      
      // Random focus changes (1-3 students)
      const numFocusChanges = Math.floor(Math.random() * 3) + 1; // 1-3 students
      if (numFocusChanges > 0 && students.length > 0) {
        // Randomly select students for focus change
        const focusChangers = [...students]
          .sort(() => 0.5 - Math.random())
          .slice(0, Math.min(numFocusChanges, students.length));
          
        for (let i = 0; i < focusChangers.length; i++) {
          const student = focusChangers[i];
          const isFocused = Math.random() > 0.3; // 70% chance of being focused
          simulatedActivities.push({
            id: `fc-${uniquePrefix}-${i}-${student.id}`,
            message: `${student.name} is now ${isFocused ? 'focused' : 'unfocused'}`,
            type: isFocused ? 'success' : 'info',
            studentId: student.id,
            studentName: student.name,
            actionType: 'focus_change',
            focused: isFocused,
            timestamp: new Date(timestamp.getTime() + (i + numHandRaises) * 100)
          });
        }
      }
      
      // Detailed logging of simulated activities
      console.log("SIMULATED ACTIVITIES DETAILS:");
      console.log(`- Generated ${simulatedActivities.length} activities for presentation`);
      console.log(`- Hand raises: ${simulatedActivities.filter(a => a.actionType === 'hand_raised').length}`);
      console.log(`- Focus changes: ${simulatedActivities.filter(a => a.actionType === 'focus_change').length}`);
      console.log("- Full activity data:", JSON.stringify(simulatedActivities, null, 2));
      
      // Direct client-side update for the presentation window
      if (simulatedActivities.length > 0) {
        // Send them directly to the activity API (this should NOT update DB)
        // We're using the API to relay the activities to the presentation window
        fetch('/api/activity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: presentationSessionId,
            lectureId,
            activities: simulatedActivities,
            isSimulated: true // Flag to indicate this is simulated data
          }),
        }).then(response => {
          if (response.ok) {
            console.log("Successfully sent simulated activities to presentation");
          } else {
            console.error("Failed to send simulated activities");
          }
        }).catch(err => {
          console.error("Error sending simulated activities:", err);
        });
        
        toast.success(`Generated ${simulatedActivities.length} simulated activities for presentation`);
      }
    } else if (!presentationSessionId && students.length > 0) {
      toast.info("Open a presentation window first to see student activities");
    }
    
    toast.success("Simulated detection data generated");
  }