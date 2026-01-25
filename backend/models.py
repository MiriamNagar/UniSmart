"""
Pydantic models for request and response validation.

This module defines all data models used for API request/response validation.
All models use Pydantic for automatic validation, serialization, and documentation.

Models:
    Request Models:
        - CoursePreference: Instructor preference for a specific course
        - Preferences: User preferences for schedule generation
        - ScheduleRequest: Complete request for schedule generation
    
    Response Models:
        - Meeting: Single meeting time slot
        - ScheduleItem: Course section with instructor and meeting times
        - ScheduleOption: Complete schedule option with fit score
        - ScheduleResponse: API response containing multiple schedule options

Author: UniSmart Development Team
"""
from typing import List, Optional, Literal
from pydantic import BaseModel, Field


class CoursePreference(BaseModel):
    """
    Preference for a specific course.
    
    Used to specify which instructor a user prefers for a particular course.
    The scheduler will attempt to match this preference when generating schedules.
    
    Attributes:
        course_id (str): Unique identifier for the course (e.g., "CS101")
        preferred_instructor_id (str): ID of the preferred instructor (e.g., "inst-1")
    
    Example:
        CoursePreference(course_id="CS101", preferred_instructor_id="inst-1")
    """
    course_id: str = Field(..., description="Course ID")
    preferred_instructor_id: str = Field(..., description="Preferred instructor ID")


class Preferences(BaseModel):
    """
    User preferences for schedule generation.
    
    Contains all user preferences that influence schedule generation. These are
    soft constraints that the scheduler will try to satisfy but are not required
    for a valid schedule.
    
    Attributes:
        preferred_start_time (str): Preferred earliest start time in HH:MM format (24-hour).
            Example: "09:00" for 9:00 AM
        preferred_end_time (str): Preferred latest end time in HH:MM format (24-hour).
            Example: "17:00" for 5:00 PM. Use "23:59" for no preference.
        day_off_requested (Optional[int]): Day of week to avoid classes.
            0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday.
            None if no day-off preference.
        course_preferences (List[CoursePreference]): List of per-course instructor preferences.
            Empty list if no instructor preferences.
    
    Example:
        Preferences(
            preferred_start_time="09:00",
            preferred_end_time="17:00",
            day_off_requested=5,  # Friday off
            course_preferences=[CoursePreference(course_id="CS101", preferred_instructor_id="inst-1")]
        )
    """
    preferred_start_time: str = Field(..., description="Preferred start time in HH:MM format")
    preferred_end_time: str = Field(..., description="Preferred end time in HH:MM format")
    day_off_requested: Optional[int] = Field(None, description="Requested day off (0=Sunday, 5=Friday)")
    course_preferences: List[CoursePreference] = Field(default_factory=list, description="Per-course preferences")


class ScheduleRequest(BaseModel):
    """
    Request model for schedule generation.
    
    Complete request object sent to the /generate-schedules endpoint.
    Contains all information needed to generate optimal schedule options.
    
    Attributes:
        selected_course_ids (List[str]): List of course IDs to include in the schedule.
            Must contain at least one valid course ID. All courses must have available sections.
        preferences (Preferences): User preferences for schedule optimization.
        max_options (int): Maximum number of schedule options to return.
            Must be between 1 and 20 (inclusive). Default is 5.
    
    Example:
        ScheduleRequest(
            selected_course_ids=["CS101", "MATH101"],
            preferences=Preferences(...),
            max_options=5
        )
    """
    selected_course_ids: List[str] = Field(..., description="List of selected course IDs")
    preferences: Preferences = Field(..., description="User preferences")
    max_options: int = Field(5, ge=1, le=20, description="Maximum number of schedule options to generate")


# Response models
class Meeting(BaseModel):
    """
    A single meeting time slot.
    
    Represents one time slot when a course section meets. A section can have
    multiple meetings per week (e.g., Monday and Wednesday).
    
    Attributes:
        day (int): Day of week as integer.
            0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
        start (str): Start time in HH:MM format (24-hour). Example: "09:00"
        end (str): End time in HH:MM format (24-hour). Example: "11:00"
    
    Example:
        Meeting(day=1, start="09:00", end="11:00")  # Monday 9:00 AM - 11:00 AM
    """
    day: int = Field(..., description="Day of week (0=Sunday, 6=Saturday)")
    start: str = Field(..., description="Start time in HH:MM format")
    end: str = Field(..., description="End time in HH:MM format")


class ScheduleItem(BaseModel):
    """
    A single course section in a schedule.
    
    Represents one section (Lecture or Recitation) that is part of a generated
    schedule option. Contains all information needed to display the section.
    
    Attributes:
        course_name (str): Full name of the course (e.g., "Introduction to Computer Science")
        section_id (str): Unique identifier for the section (e.g., "intro_l1")
        type (Literal["Lecture", "Recitation"]): Type of section.
            "Lecture" for main lecture sections, "Recitation" for tutorial/recitation sections.
        instructor (str): Full name of the instructor (e.g., "Prof. Ben-Moshe Boaz")
        meetings (List[Meeting]): List of all meeting times for this section.
            Typically 1-3 meetings per week.
    
    Example:
        ScheduleItem(
            course_name="Introduction to Computer Science",
            section_id="intro_l1",
            type="Lecture",
            instructor="Prof. Ben-Moshe Boaz",
            meetings=[Meeting(day=0, start="15:00", end="17:00")]
        )
    """
    course_name: str = Field(..., description="Course name")
    section_id: str = Field(..., description="Section ID")
    type: Literal["Lecture", "Recitation"] = Field(..., description="Section type")
    instructor: str = Field(..., description="Instructor name")
    meetings: List[Meeting] = Field(..., description="List of meeting times")


class ScheduleOption(BaseModel):
    """
    A single schedule option with score.
    
    Represents one complete schedule solution generated by the scheduler.
    Contains all selected sections for all courses and a fit score indicating
    how well it matches user preferences.
    
    Attributes:
        score (int): Fit score as percentage (0-100).
            100 = perfect match to all preferences
            0 = valid schedule but doesn't match preferences
        schedule (List[ScheduleItem]): List of all course sections in this schedule.
            Includes both lectures and recitations for all selected courses.
            Sorted by course_id and type (Lectures first) for readability.
    
    Example:
        ScheduleOption(
            score=85,
            schedule=[
                ScheduleItem(...),  # CS101 Lecture
                ScheduleItem(...),  # CS101 Recitation
                ScheduleItem(...),  # MATH101 Lecture
                ...
            ]
        )
    """
    score: int = Field(..., description="Score for this schedule")
    schedule: List[ScheduleItem] = Field(..., description="List of schedule items")


class ScheduleResponse(BaseModel):
    """
    Response model for schedule generation.
    
    Complete response from the /generate-schedules endpoint. Contains the
    status of the request and all generated schedule options.
    
    Attributes:
        status (str): Status of the request. Always "success" for successful requests.
            Errors are returned as HTTP exceptions instead.
        options (List[ScheduleOption]): List of generated schedule options.
            Sorted by score in descending order (best options first).
            Empty list if no valid schedules could be generated.
    
    Example:
        ScheduleResponse(
            status="success",
            options=[
                ScheduleOption(score=90, schedule=[...]),
                ScheduleOption(score=85, schedule=[...]),
                ...
            ]
        )
    """
    status: str = Field(..., description="Status of the request")
    options: List[ScheduleOption] = Field(..., description="List of schedule options")

