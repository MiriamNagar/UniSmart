"""
Pydantic models for request and response validation.
"""
from typing import List, Optional, Literal
from pydantic import BaseModel, Field


class CoursePreference(BaseModel):
    """Preference for a specific course."""
    course_id: str = Field(..., description="Course ID")
    preferred_instructor_id: str = Field(..., description="Preferred instructor ID")


class Preferences(BaseModel):
    """User preferences for schedule generation."""
    preferred_start_time: str = Field(..., description="Preferred start time in HH:MM format")
    preferred_end_time: str = Field(..., description="Preferred end time in HH:MM format")
    day_off_requested: Optional[int] = Field(None, description="Requested day off (0=Sunday, 5=Friday)")
    course_preferences: List[CoursePreference] = Field(default_factory=list, description="Per-course preferences")


class ScheduleRequest(BaseModel):
    """Request model for schedule generation."""
    selected_course_ids: List[str] = Field(..., description="List of selected course IDs")
    preferences: Preferences = Field(..., description="User preferences")
    max_options: int = Field(5, ge=1, le=20, description="Maximum number of schedule options to generate")


# Response models
class Meeting(BaseModel):
    """A single meeting time."""
    day: int = Field(..., description="Day of week (0=Sunday, 6=Saturday)")
    start: str = Field(..., description="Start time in HH:MM format")
    end: str = Field(..., description="End time in HH:MM format")


class ScheduleItem(BaseModel):
    """A single course section in a schedule."""
    course_name: str = Field(..., description="Course name")
    section_id: str = Field(..., description="Section ID")
    type: Literal["Lecture", "Recitation"] = Field(..., description="Section type")
    instructor: str = Field(..., description="Instructor name")
    meetings: List[Meeting] = Field(..., description="List of meeting times")


class ScheduleOption(BaseModel):
    """A single schedule option with score."""
    score: int = Field(..., description="Score for this schedule")
    schedule: List[ScheduleItem] = Field(..., description="List of schedule items")


class ScheduleResponse(BaseModel):
    """Response model for schedule generation."""
    status: str = Field(..., description="Status of the request")
    options: List[ScheduleOption] = Field(..., description="List of schedule options")

