"""
FastAPI application for University Schedule Generator.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from models import ScheduleRequest, ScheduleResponse, ScheduleOption, ScheduleItem, Meeting
from scheduler_logic import generate_schedules
from mock_db import COURSES, SECTIONS, SECTION_TIMES, INSTRUCTORS

app = FastAPI(title="University Schedule Generator", version="1.0.0")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/courses")
async def get_courses(semester: str = None):
    """
    Get list of available courses, optionally filtered by semester.
    """
    courses_list = []
    for course_id, course_data in COURSES.items():
        if semester is None or course_data.get("semester") == semester:
            courses_list.append({
                "id": course_id,
                "name": course_data["name"],
                "semester": course_data.get("semester", "A"),
            })
    
    return {"courses": courses_list}


@app.post("/generate-schedules", response_model=ScheduleResponse)
async def generate_schedules_endpoint(request: ScheduleRequest):
    """
    Generate optimal schedule options based on selected courses and preferences.
    """
    try:
        # Convert Pydantic preferences to dict for scheduler
        preferences_dict = {
            "preferred_start_time": request.preferences.preferred_start_time,
            "preferred_end_time": request.preferences.preferred_end_time,
            "day_off_requested": request.preferences.day_off_requested,
            "course_preferences": [
                {
                    "course_id": cp.course_id,
                    "preferred_instructor_id": cp.preferred_instructor_id
                }
                for cp in request.preferences.course_preferences
            ]
        }
        
        # Generate schedules using CP-SAT solver
        solutions = generate_schedules(
            selected_course_ids=request.selected_course_ids,
            preferences=preferences_dict,
            max_options=request.max_options
        )
        
        if not solutions:
            return ScheduleResponse(
                status="success",
                options=[]
            )
        
        # Format solutions into response
        options: List[ScheduleOption] = []
        
        for selected_sections, score in solutions:
            schedule_items: List[ScheduleItem] = []
            
            # Build schedule items for each selected section
            # Sort by course_id and type (Lecture first, then Recitation) for better readability
            sorted_sections = sorted(selected_sections, key=lambda sid: (
                SECTIONS.get(sid, {}).get("course_id", ""),
                0 if SECTIONS.get(sid, {}).get("type") == "Lecture" else 1
            ))
            
            for section_id in sorted_sections:
                section_data = SECTIONS.get(section_id, {})
                course_id = section_data.get("course_id")
                course_name = COURSES.get(course_id, {}).get("name", "Unknown Course")
                instructor_id = section_data.get("instructor_id")
                instructor_name = INSTRUCTORS.get(instructor_id, {}).get("name", "Unknown Instructor")
                section_type = section_data.get("type", "Lecture")  # Default to Lecture for backward compatibility
                
                # Get meeting times
                meetings_data = SECTION_TIMES.get(section_id, [])
                meetings = [
                    Meeting(
                        day=mt["day"],
                        start=mt["start_time"],
                        end=mt["end_time"]
                    )
                    for mt in meetings_data
                ]
                
                schedule_items.append(
                    ScheduleItem(
                        course_name=course_name,
                        section_id=section_id,
                        type=section_type,
                        instructor=instructor_name,
                        meetings=meetings
                    )
                )
            
            options.append(
                ScheduleOption(
                    score=score,
                    schedule=schedule_items
                )
            )
        
        return ScheduleResponse(
            status="success",
            options=options
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "University Schedule Generator API", "version": "1.0.0"}


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
