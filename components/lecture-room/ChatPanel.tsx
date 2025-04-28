import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageSquare, X, Send } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatMessage } from "@/types/lecture-room"

interface ChatPanelProps {
  isChatOpen: boolean
  messages: ChatMessage[]
  messageInput: string
  setIsChatOpen: React.Dispatch<React.SetStateAction<boolean>>
  setMessageInput: React.Dispatch<React.SetStateAction<string>>
  handleSendMessage: () => void
}

export function ChatPanel({
  isChatOpen,
  messages,
  messageInput,
  setIsChatOpen,
  setMessageInput,
  handleSendMessage
}: ChatPanelProps) {
  if (!isChatOpen) return null

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Class Chat</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => setIsChatOpen(false)}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 mx-auto text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">No messages yet</p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div 
                    key={`message-${index}`}
                    className={`flex gap-3 ${message.student.id === 'professor' ? 'justify-end' : ''}`}
                  >
                    {message.student.id !== 'professor' && (
                      <Avatar>
                        <AvatarImage 
                          src={message.student.avatar || ""}
                          alt={message.student.name}
                        />
                        <AvatarFallback>
                          {message.student.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`rounded-lg px-4 py-2 max-w-[75%] ${
                        message.student.id === 'professor'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="flex justify-between items-center gap-2 mb-1">
                        <p className="text-xs font-medium">
                          {message.student.name}
                        </p>
                      </div>
                      <p>{message.text}</p>
                    </div>
                    {message.student.id === 'professor' && (
                      <Avatar>
                        <AvatarImage
                          src={message.student.avatar || ""}
                          alt={message.student.name}
                        />
                        <AvatarFallback>
                          {message.student.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
          <div className="flex gap-2">
            <Input 
              placeholder="Type your message..."
              value={messageInput}
              onChange={e => setMessageInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  handleSendMessage()
                }
              }}
            />
            <Button onClick={handleSendMessage}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 