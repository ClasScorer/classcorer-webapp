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