"""
CP-SAT solver logic for schedule generation using Google OR-Tools.
"""
from typing import List, Dict, Set, Tuple, Optional
from ortools.sat.python import cp_model
from mock_db import COURSES, SECTIONS, SECTION_TIMES, INSTRUCTORS


def time_to_minutes(time_str: str) -> int:
    """Convert time string (HH:MM) to minutes since midnight."""
    hours, minutes = map(int, time_str.split(":"))
    return hours * 60 + minutes


def times_overlap(start1: str, end1: str, start2: str, end2: str) -> bool:
    """Check if two time ranges overlap."""
    start1_min = time_to_minutes(start1)
    end1_min = time_to_minutes(end1)
    start2_min = time_to_minutes(start2)
    end2_min = time_to_minutes(end2)
    
    return not (end1_min <= start2_min or end2_min <= start1_min)


def sections_conflict(section_id1: str, section_id2: str) -> bool:
    """Check if two sections have conflicting meeting times."""
    times1 = SECTION_TIMES.get(section_id1, [])
    times2 = SECTION_TIMES.get(section_id2, [])
    
    for time1 in times1:
        for time2 in times2:
            if time1["day"] == time2["day"]:
                if times_overlap(time1["start_time"], time1["end_time"], 
                                time2["start_time"], time2["end_time"]):
                    return True
    return False


def get_valid_sections_for_courses(course_ids: List[str]) -> Dict[str, Dict[str, List[str]]]:
    """
    Get valid sections for each course, separated by type (excluding full sections).
    
    Returns:
        {course_id: {"lectures": [L1, L2, ...], "recitations": [R1, R2, ...]}}
    """
    course_to_sections: Dict[str, Dict[str, List[str]]] = {
        course_id: {"lectures": [], "recitations": []} 
        for course_id in course_ids
    }
    
    for section_id, section_data in SECTIONS.items():
        course_id = section_data["course_id"]
        if course_id in course_ids:
            # Skip full sections
            if section_data["enrolled_count"] < section_data["capacity"]:
                section_type = section_data.get("type", "Lecture")  # Default to Lecture for backward compatibility
                if section_type == "Lecture":
                    course_to_sections[course_id]["lectures"].append(section_id)
                elif section_type == "Recitation":
                    course_to_sections[course_id]["recitations"].append(section_id)
    
    return course_to_sections


def calculate_schedule_score(
    selected_sections: List[str],
    preferences: Dict,
    course_preferences_map: Dict[str, str]
) -> int:
    """Calculate score for a schedule based on soft constraints."""
    score = 0
    
    # Get all meetings for selected sections
    all_meetings = []
    for section_id in selected_sections:
        meetings = SECTION_TIMES.get(section_id, [])
        for meeting in meetings:
            all_meetings.append({
                "day": meeting["day"],
                "start_time": meeting["start_time"],
                "section_id": section_id
            })
    
    if not all_meetings:
        return score
    
    # Preferred start time: Check if first lesson of the day starts within preferred range
    preferred_start_min = time_to_minutes(preferences.get("preferred_start_time", "00:00"))
    preferred_end_min = time_to_minutes(preferences.get("preferred_end_time", "23:59"))
    
    # Group meetings by day and find first lesson of each day
    meetings_by_day: Dict[int, List[Dict]] = {}
    for meeting in all_meetings:
        day = meeting["day"]
        if day not in meetings_by_day:
            meetings_by_day[day] = []
        meetings_by_day[day].append(meeting)
    
    # Scoring weights (fixed, sum to 100)
    # Preferred start time: 50% (50 points max, distributed across days with classes)
    # Instructor preferences: 30% (30 points max, distributed across preferences)
    # Day off bonus: 20% (20 points, only if requested and satisfied)
    
    day_off = preferences.get("day_off_requested")
    
    # Calculate maximum possible score based on requested preferences
    # Base weights that sum to 100
    max_preferred_start = 50  # Always available
    max_instructor_pref = 30  # Always available if preferences exist
    max_day_off = 20 if day_off is not None else 0  # Only if requested
    max_possible_score = max_preferred_start + max_instructor_pref + max_day_off
    
    # Calculate actual score components
    preferred_start_score = 0
    instructor_pref_score = 0
    day_off_score = 0
    
    # Preferred start time: Check if first lesson of each day starts within preferred range
    # Maximum is 50 points, distributed across days with classes
    num_days_with_classes = len(meetings_by_day)
    points_per_day = 50.0 / max(num_days_with_classes, 1) if num_days_with_classes > 0 else 0
    
    for day, day_meetings in meetings_by_day.items():
        first_meeting = min(day_meetings, key=lambda m: time_to_minutes(m["start_time"]))
        first_start_min = time_to_minutes(first_meeting["start_time"])
        
        if preferred_start_min <= first_start_min <= preferred_end_min:
            preferred_start_score += points_per_day
    
    # Instructor preference: Points for matching preferred_instructor_id
    # Maximum is 30 points, distributed across course preferences
    num_preferences = len(course_preferences_map)
    points_per_preference = 30.0 / max(num_preferences, 1) if num_preferences > 0 else 0
    
    matched_preferences = set()
    for section_id in selected_sections:
        section_data = SECTIONS.get(section_id, {})
        course_id = section_data.get("course_id")
        instructor_id = section_data.get("instructor_id")
        
        if course_id in course_preferences_map and course_id not in matched_preferences:
            preferred_instructor = course_preferences_map[course_id]
            if instructor_id == preferred_instructor:
                instructor_pref_score += points_per_preference
                matched_preferences.add(course_id)
    
    # Day off bonus: 20 points if requested day has zero sections
    if day_off is not None:
        days_with_meetings = {meeting["day"] for meeting in all_meetings}
        if day_off not in days_with_meetings:
            day_off_score = 20
    
    # Calculate total raw score
    total_raw_score = preferred_start_score + instructor_pref_score + day_off_score
    
    # Normalize to percentage (0-100)
    if max_possible_score > 0:
        score_percentage = (total_raw_score / max_possible_score) * 100
        return min(100, max(0, int(round(score_percentage))))
    
    return 0


def generate_schedules(
    selected_course_ids: List[str],
    preferences: Dict,
    max_options: int = 5
) -> List[Tuple[List[str], int]]:
    """
    Generate top N unique schedules using CP-SAT solver.
    
    Returns:
        List of tuples (selected_section_ids, score) sorted by score descending.
    """
    # Validate course IDs
    for course_id in selected_course_ids:
        if course_id not in COURSES:
            raise ValueError(f"Invalid course ID: {course_id}")
    
    # Get valid sections for each course (separated by type)
    course_to_sections = get_valid_sections_for_courses(selected_course_ids)
    
    # Check if we have at least one section per course
    for course_id, sections_dict in course_to_sections.items():
        lectures = sections_dict["lectures"]
        recitations = sections_dict["recitations"]
        if not lectures and not recitations:
            raise ValueError(f"No available sections for course: {COURSES[course_id]['name']}")
        # If course has recitations, it must have lectures too (for linkage)
        if recitations and not lectures:
            raise ValueError(f"Course {COURSES[course_id]['name']} has recitations but no available lectures")
    
    # Build course preferences map
    course_preferences_map = {}
    if "course_preferences" in preferences:
        for cp in preferences["course_preferences"]:
            course_preferences_map[cp["course_id"]] = cp["preferred_instructor_id"]
    
    # Collect all valid sections (both lectures and recitations)
    all_valid_sections = []
    for sections_dict in course_to_sections.values():
        all_valid_sections.extend(sections_dict["lectures"])
        all_valid_sections.extend(sections_dict["recitations"])
    
    # Build conflict graph
    conflicts: Set[Tuple[str, str]] = set()
    for i, section1 in enumerate(all_valid_sections):
        for section2 in all_valid_sections[i+1:]:
            if sections_conflict(section1, section2):
                conflicts.add((section1, section2))
    
    solutions: List[Tuple[List[str], int]] = []
    forbidden_combinations: List[Set[str]] = []
    
    for solution_num in range(max_options):
        model = cp_model.CpModel()
        
        # Create boolean variables for each section
        section_vars = {section_id: model.NewBoolVar(f"section_{section_id}") 
                       for section_id in all_valid_sections}
        
        # Hard constraints: Course-level constraints
        for course_id, sections_dict in course_to_sections.items():
            lectures = sections_dict["lectures"]
            recitations = sections_dict["recitations"]
            
            if lectures and recitations:
                # Course has both lectures and recitations: must select exactly one of each
                model.Add(sum(section_vars[lec] for lec in lectures) == 1)
                model.Add(sum(section_vars[rec] for rec in recitations) == 1)
                
                # Linkage constraints: Selected recitation must be linked to selected lecture
                # For each recitation, it can only be selected if at least one of its linked lectures is selected
                for recitation_id in recitations:
                    recitation_var = section_vars[recitation_id]
                    # Find all lectures that link to this recitation
                    linked_lectures = [
                        lec_id for lec_id in lectures 
                        if recitation_id in SECTIONS.get(lec_id, {}).get("linked_recitations", [])
                    ]
                    if linked_lectures:
                        # Recitation can only be selected if at least one of its linked lectures is selected
                        # recitation_var <= sum(linked_lecture_vars)
                        linked_lecture_vars = [section_vars[lec_id] for lec_id in linked_lectures]
                        model.Add(recitation_var <= sum(linked_lecture_vars))
                    # If a recitation has no linked lectures, it shouldn't be selectable (shouldn't happen with valid data)
                
                # Additionally, if a lecture is selected, only its linked recitations can be selected
                # This is handled by the constraint above: if L1 is selected and R is not in L1's linked_recitations,
                # then R cannot be selected because R <= sum(lectures that link to R), and L1 is not in that sum
            
            elif lectures:
                # Course has only lectures: select exactly one lecture
                model.Add(sum(section_vars[lec] for lec in lectures) == 1)
            # Note: Course with only recitations (no lectures) is not valid and should be caught above
        
        # Hard constraint: No conflicts between selected sections
        for section1, section2 in conflicts:
            model.Add(section_vars[section1] + section_vars[section2] <= 1)
        
        # Forbid previously found combinations
        for forbidden_combo in forbidden_combinations:
            # Add constraint: At least one section must be different
            # This is done by: sum of (1 - var) for sections in combo >= 1
            # Which means: sum(1 - var) >= 1  =>  len(combo) - sum(var) >= 1  =>  sum(var) <= len(combo) - 1
            combo_vars = [section_vars[s] for s in forbidden_combo if s in section_vars]
            if combo_vars:
                model.Add(sum(combo_vars) <= len(combo_vars) - 1)
        
        # Soft constraints: Build objective function
        objective_terms = []
        
        # Preferred start time scoring (approximate - checked after solving)
        # Instructor preference scoring
        for section_id, var in section_vars.items():
            section_data = SECTIONS.get(section_id, {})
            course_id = section_data.get("course_id")
            
            if course_id in course_preferences_map:
                preferred_instructor = course_preferences_map[course_id]
                if section_data.get("instructor_id") == preferred_instructor:
                    objective_terms.append(20 * var)
        
        # Note: Preferred start time and day off are calculated after solving
        # because they depend on the full schedule combination
        
        model.Maximize(sum(objective_terms))
        
        # Solve
        solver = cp_model.CpSolver()
        status = solver.Solve(model)
        
        if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
            # Extract solution
            selected_sections = [
                section_id for section_id, var in section_vars.items() 
                if solver.Value(var) == 1
            ]
            
            # Calculate full score (including start time and day off bonuses)
            score = calculate_schedule_score(selected_sections, preferences, course_preferences_map)
            
            solutions.append((selected_sections, score))
            
            # Add this combination to forbidden list
            forbidden_combinations.append(set(selected_sections))
        else:
            # No more solutions found
            break
    
    # Sort solutions by score descending
    solutions.sort(key=lambda x: x[1], reverse=True)
    
    return solutions

