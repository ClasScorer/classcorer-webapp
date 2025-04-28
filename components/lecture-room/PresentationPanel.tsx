import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Presentation, MonitorIcon } from "lucide-react"
import { PresentationData } from "@/types/lecture-room"

interface PresentationPanelProps {
  presentationUrl: string
  embedUrl: string
  currentSlide: string | null
  isLoadingSlides: boolean
  isSharing: boolean
  presentationData: PresentationData | null
  activeSlideIndex: number
  lectureId: string | null
  handlePresentationUrl: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSlideUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  changeSlide: (index: number) => void
  openPresentationDisplay: (lectureId: string | null) => void
}

export function PresentationPanel({
  presentationUrl,
  embedUrl,
  currentSlide,
  isLoadingSlides,
  isSharing,
  presentationData,
  activeSlideIndex,
  lectureId,
  handlePresentationUrl,
  handleSlideUpload,
  changeSlide,
  openPresentationDisplay
}: PresentationPanelProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Presentation</CardTitle>
        <div className="flex items-center gap-2">
          {presentationData && (
            <Badge variant="outline" className="font-normal">
              Slide {activeSlideIndex + 1} of {presentationData.slides.length}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!isSharing && !embedUrl && !currentSlide && !presentationData && (
            <div className="flex flex-col gap-4">
              <Input 
                placeholder="Enter Google Slides URL"
                value={presentationUrl}
                onChange={handlePresentationUrl}
              />
              <div className="flex items-center">
                <p className="text-sm text-gray-500 mr-2">Or upload slides:</p>  
                <input
                  type="file"
                  onChange={handleSlideUpload}
                  accept="image/png, image/jpeg, application/pdf"
                  className="text-sm text-gray-500"
                />
              </div>
            </div>
          )}
          
          {isLoadingSlides && (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}
          
          {/* Display the presentation */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Main slide view */}
            <div className="md:col-span-3 aspect-video bg-black flex items-center justify-center rounded-md overflow-hidden">
              {embedUrl && (
                <iframe 
                  src={embedUrl}
                  title="Presentation"
                  className="w-full h-full border-0"
                  allowFullScreen
                ></iframe>
              )}
              {currentSlide && !embedUrl && (
                <img
                  src={currentSlide}
                  alt="Slide"
                  className="max-h-full max-w-full"
                />
              )}
              {presentationData && !embedUrl && !currentSlide && (
                <img
                  src={presentationData.slides[activeSlideIndex].thumbnailUrl}
                  alt={`Slide ${activeSlideIndex + 1}`}
                  className="max-h-full max-w-full"
                />
              )}
              {isSharing && !embedUrl && !currentSlide && !presentationData && (
                <div className="text-white">Screen sharing active...</div>
              )}
              {!isSharing && !embedUrl && !currentSlide && !presentationData && (
                <div className="text-white opacity-50 flex flex-col items-center">
                  <Presentation className="h-12 w-12 mb-2" />
                  <p>No presentation active</p>
                </div>
              )}
            </div>
            
            {/* Thumbnails navigation */}
            {presentationData && presentationData.slides.length > 0 && (
              <div className="md:col-span-1">
                <div className="text-sm font-medium mb-2">Slides</div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {presentationData.slides.map((slide, index) => (
                    <div
                      key={`slide-${slide.id}-${index}`}
                      className={`rounded-md overflow-hidden border-2 cursor-pointer transition-all ${index === activeSlideIndex ? 'border-primary' : 'border-transparent'}`}
                      onClick={() => changeSlide(index)}
                    >
                      <div className="relative">
                        <img
                          src={slide.thumbnailUrl}
                          alt={`Slide ${index + 1}`}
                          className="w-full aspect-video object-cover"
                        />
                        <div className="absolute bottom-0 right-0 bg-black bg-opacity-70 text-white text-xs px-1">
                          {index + 1}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Navigation buttons for presentation */}
          {presentationData && presentationData.slides.length > 0 && (
            <div className="flex justify-center gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => changeSlide(activeSlideIndex - 1)}
                disabled={activeSlideIndex <= 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => changeSlide(activeSlideIndex + 1)}
                disabled={activeSlideIndex >= presentationData.slides.length - 1}
              >
                Next
              </Button>
            </div>
          )}
          
          {/* Add this button after your existing presentation controls */}
          <Button 
            onClick={() => openPresentationDisplay(lectureId)}
            variant="outline"
            className="flex items-center gap-2 mt-4"
          >
            <MonitorIcon className="h-4 w-4" />
            Open on Second Screen
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 