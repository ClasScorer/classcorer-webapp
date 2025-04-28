import { useState, useCallback } from "react"
import { ChatMessage } from "@/types/lecture-room"
import { Course } from "@/lib/data"

interface UseChatManagerProps {
  course: Course
}

interface UseChatManagerResult {
  isChatOpen: boolean
  messages: ChatMessage[]
  messageInput: string
  setIsChatOpen: React.Dispatch<React.SetStateAction<boolean>>
  setMessageInput: React.Dispatch<React.SetStateAction<string>>
  handleSendMessage: () => void
}

export function useChatManager({ course }: UseChatManagerProps): UseChatManagerResult {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [messageInput, setMessageInput] = useState("")

  // Handle chat message
  const handleSendMessage = useCallback(() => {
    if (messageInput.trim()) {
      const professorMessage: ChatMessage = {
        student: {
          id: 'professor',
          name: 'Professor',
          email: typeof course.instructor === 'object' ? course.instructor.email || '' : course.instructor,
          avatar: '/avatars/professor.jpg',
          status: 'Excellent',
          courseId: course.id,
          score: 100,
          attendance: 100,
          level: 'Professor',
          average: 100,
          submissions: 0,
          lastSubmission: new Date().toISOString(),
          grade: 'A+',
          trend: 'up'
        },
        text: messageInput
      }
      setMessages(prev => [...prev, professorMessage])
      setMessageInput("")
    }
  }, [messageInput, course])

  return {
    isChatOpen,
    messages,
    messageInput,
    setIsChatOpen,
    setMessageInput,
    handleSendMessage
  }
} 