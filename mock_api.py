from fastapi import FastAPI, UploadFile, File, Form, Request, Response
from fastapi.middleware.cors import CORSMiddleware
import random
import base64
import os
import uuid
from datetime import datetime
from fastapi.staticfiles import StaticFiles
import uvicorn
from fastapi.responses import JSONResponse

# Initialize FastAPI app
app = FastAPI(
    title="Mock Face Analysis Gateway API",
    description="Mock API Gateway for testing the frontend",
    version="1.0.0",
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create a directory for storing uploaded images
os.makedirs("uploads", exist_ok=True)

# Mount static files directory
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Sample student data to simulate recognition
SAMPLE_STUDENTS = [
    {"id": "1", "name": "John Doe"},
    {"id": "2", "name": "Jane Smith"},
    {"id": "3", "name": "Alex Johnson"},
    {"id": "4", "name": "Maria Garcia"},
    {"id": "5", "name": "Wei Chen"},
]

@app.post("/api/process-frame")
async def process_frame(
    image: UploadFile = File(...),
    lectureId: str = Form(...),
    timestamp: str = Form(...)
):
    """
    Mock implementation of the process-frame endpoint
    """
    # Save the uploaded image to verify it was received correctly
    file_path = f"uploads/{uuid.uuid4()}.jpg"
    with open(file_path, "wb") as f:
        f.write(await image.read())
    
    # Determine how many faces to generate (random between 0-5)
    num_faces = random.randint(1, 5)
    
    # Generate mock face data
    faces = []
    for _ in range(num_faces):
        # Pick a random student or generate an unknown face
        if random.random() > 0.3:  # 70% known students
            student = random.choice(SAMPLE_STUDENTS)
            person_id = student["id"]
            recognition_status = "known"
        else:
            person_id = f"new_{uuid.uuid4().hex[:8]}"
            recognition_status = "new"
        
        # Generate random attention status
        attention_status = "FOCUSED" if random.random() > 0.3 else "UNFOCUSED"
        
        # Generate random hand raising status
        is_hand_raised = random.random() > 0.8  # 20% chance of hand raised
        
        # Create a face entry
        face = {
            "person_id": person_id,
            "recognition_status": recognition_status,
            "attention_status": attention_status,
            "hand_raising_status": {
                "is_hand_raised": is_hand_raised,
                "confidence": random.uniform(0.65, 0.98),
                "hand_position": {
                    "x": random.uniform(0.1, 0.9),
                    "y": random.uniform(0.1, 0.9)
                }
            },
            "confidence": random.uniform(0.75, 0.99),
            "bounding_box": {
                "x": random.uniform(0.1, 0.7),
                "y": random.uniform(0.1, 0.7),
                "width": random.uniform(0.1, 0.3),
                "height": random.uniform(0.1, 0.3)
            }
        }
        faces.append(face)
    
    # Count statistics
    known_faces = sum(1 for face in faces if face["recognition_status"] == "known")
    new_faces = len(faces) - known_faces
    focused_faces = sum(1 for face in faces if face["attention_status"] == "FOCUSED")
    unfocused_faces = len(faces) - focused_faces
    hands_raised = sum(1 for face in faces if face["hand_raising_status"]["is_hand_raised"])
    
    # Create the response
    response = {
        "lecture_id": lectureId,
        "timestamp": timestamp,  # Use the same timestamp from the request
        "total_faces": len(faces),
        "faces": faces,
        "summary": {
            "new_faces": new_faces,
            "known_faces": known_faces,
            "focused_faces": focused_faces,
            "unfocused_faces": unfocused_faces,
            "hands_raised": hands_raised
        }
    }
    
    return response

# Add middleware route to handle OPTIONS requests for CORS preflight
@app.options("/api/process-frame")
async def options_process_frame():
    """Handle OPTIONS requests for CORS preflight"""
    return Response(
        content="",
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Max-Age": "86400",  # 24 hours
        }
    )

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "message": "Mock Gateway is running"}

@app.post("/api/lectures/engagement")
async def save_engagement_data(request: Request):
    """Mock endpoint for saving engagement data"""
    try:
        data = await request.json()
        # Just log the data and return success
        print(f"Received engagement data for lecture {data.get('lecture_id')}")
        return {"status": "success", "message": "Engagement data saved successfully"}
    except Exception as e:
        print(f"Error saving engagement data: {str(e)}")
        return {"status": "error", "message": str(e)}

# Special catch-all route to help debug 404 issues
@app.api_route("/{path_name:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
async def catch_all(request: Request, path_name: str):
    """Catch-all route to debug missing endpoints"""
    method = request.method
    path = request.url.path
    query_params = str(request.query_params)
    
    print(f"404 - Unhandled request: {method} {path} {query_params}")
    
    return JSONResponse(
        status_code=404,
        content={
            "error": "Endpoint not found",
            "method": method,
            "path": path,
            "query_params": query_params,
            "available_endpoints": [
                "/api/process-frame",
                "/api/lectures/engagement",
                "/health"
            ]
        }
    )

if __name__ == "__main__":
    uvicorn.run("mock_api:app", host="0.0.0.0", port=8000, reload=True)