// Fetch a course by ID with additional error handling
export async function getCourseById(courseId: string) {
  try {
    console.log(`Fetching course with ID: ${courseId}`);
    const response = await fetch(`/api/courses/${courseId}`);
    
    // Log the response status and status text for debugging
    console.log(`API Response: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      // Try to get more error details from the response
      try {
        const errorData = await response.json();
        console.error('API error response:', errorData);
        throw new Error(errorData.error || errorData.details || `API error: ${response.status}`);
      } catch (parseError) {
        // If we can't parse the JSON, just use the status
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
    }
    
    const data = await response.json();
    
    // Check if the response data is valid
    if (!data || !data.id) {
      console.error('Invalid course data received:', data);
      throw new Error('Invalid course data received from API');
    }
    
    console.log(`Successfully fetched course: ${data.title}`);
    return data;
  } catch (error) {
    console.error('Error fetching course data:', error);
    throw new Error('Failed to get course: ' + (error instanceof Error ? error.message : String(error)));
  }
}