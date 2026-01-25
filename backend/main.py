"""
FastAPI application for University Schedule Generator.

This module provides the REST API endpoints for the UniSmart application,
handling course retrieval and schedule generation requests. The API uses
Google OR-Tools CP-SAT solver to generate optimal schedule options based
on user preferences and course selections.

Endpoints:
    GET /courses - Retrieve available courses
    POST /generate-schedules - Generate optimal schedule options
    GET / - Root endpoint with API information
    GET /health - Health check endpoint

Author: UniSmart Development Team
Version: 1.0.0
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from models import ScheduleRequest, ScheduleResponse, ScheduleOption, ScheduleItem, Meeting
from scheduler_logic import generate_schedules
from mock_db import COURSES, SECTIONS, SECTION_TIMES, INSTRUCTORS
import uvicorn

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
    
    This endpoint retrieves all available courses from the database. If a semester
    filter is provided, only courses for that semester are returned.
    
    Args:
        semester (str, optional): Semester filter (e.g., "A" for semester A).
            If None, returns all courses regardless of semester.
    
    Returns:
        dict: A dictionary containing a "courses" key with a list of course objects.
            Each course object contains:
            - id (str): Course identifier (e.g., "CS101")
            - name (str): Full course name
            - semester (str): Semester code (e.g., "A")
    
    Example:
        >>> GET /courses
        {"courses": [{"id": "CS101", "name": "Introduction to Computer Science", "semester": "A"}]}
        
        >>> GET /courses?semester=A
        {"courses": [{"id": "CS101", "name": "Introduction to Computer Science", "semester": "A"}]}
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
    
    This endpoint uses constraint programming (CP-SAT solver) to generate multiple
    optimal schedule options that satisfy hard constraints (no time conflicts,
    required sections) while maximizing soft constraints (preferred times, instructors,
    day-off requests).
    
    The algorithm:
    1. Validates all selected course IDs exist
    2. Filters out full sections (enrolled_count >= capacity)
    3. Builds conflict graph for time overlaps
    4. Uses CP-SAT solver to find valid combinations
    5. Scores each solution based on preferences
    6. Returns top N solutions sorted by score
    
    Args:
        request (ScheduleRequest): Request object containing:
            - selected_course_ids (List[str]): List of course IDs to include
            - preferences (Preferences): User preferences including:
                - preferred_start_time (str): Preferred start time in HH:MM format
                - preferred_end_time (str): Preferred end time in HH:MM format
                - day_off_requested (int, optional): Day to avoid (0=Sunday, 5=Friday)
                - course_preferences (List[CoursePreference]): Per-course instructor preferences
            - max_options (int): Maximum number of schedule options to return (1-20)
    
    Returns:
        ScheduleResponse: Response containing:
            - status (str): "success" if generation succeeded
            - options (List[ScheduleOption]): List of schedule options, each containing:
                - score (int): Fit score (0-100 percentage)
                - schedule (List[ScheduleItem]): List of course sections with:
                    - course_name (str): Full course name
                    - section_id (str): Section identifier
                    - type (str): "Lecture" or "Recitation"
                    - instructor (str): Instructor name
                    - meetings (List[Meeting]): Meeting times with day, start, end
    
    Raises:
        HTTPException: 
            - 400 (Bad Request): Invalid course IDs or no valid sections available
            - 500 (Internal Server Error): Server error during schedule generation
    
    Example:
        Request:
        {
            "selected_course_ids": ["CS101", "MATH101"],
            "preferences": {
                "preferred_start_time": "09:00",
                "preferred_end_time": "17:00",
                "day_off_requested": 5,
                "course_preferences": [
                    {"course_id": "CS101", "preferred_instructor_id": "inst-1"}
                ]
            },
            "max_options": 5
        }
        
        Response:
        {
            "status": "success",
            "options": [
                {
                    "score": 85,
                    "schedule": [...]
                }
            ]
        }
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
    """
    Root endpoint providing API information.
    
    Returns:
        dict: API metadata including:
            - message (str): API name
            - version (str): API version number
    """
    return {"message": "University Schedule Generator API", "version": "1.0.0"}


@app.get("/health")
async def health():
    """
    Health check endpoint for monitoring and load balancers.
    
    This endpoint can be used by monitoring systems to verify the API is
    running and responsive. Returns a simple status indicator.
    
    Returns:
        dict: Health status with "status" key set to "healthy"
    """
    return {"status": "healthy"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)
