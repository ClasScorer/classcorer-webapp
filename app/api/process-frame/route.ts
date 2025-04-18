import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get the form data from the request
    const formData = await request.formData();
    
    // Forward the request to the mock API server
    const response = await fetch('http://localhost:8000/api/process-frame', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      console.error(`Mock API server responded with status: ${response.status}`);
      const errorText = await response.text();
      console.error(`Error response: ${errorText}`);
      return new NextResponse(
        JSON.stringify({ error: 'Failed to process frame', details: errorText }),
        { 
          status: response.status, 
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Get the JSON response from the mock API
    const data = await response.json();
    
    // Return the response to the client
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error processing frame:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : String(error) 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}