"""
Mock Database for University Schedule Generator
Contains sample data for courses, instructors, sections, and section times.
"""

# Courses dictionary: {course_id: {"name": str}}
COURSES = {
    "CS101": {"name": "Introduction to Computer Science"},
    "MATH101": {"name": "Infinitesimal Calculus 1 for CS"},
    "MATH102": {"name": "Linear Algebra 1 for CS"},
    "MATH103": {"name": "Logic and Set Theory for CS"},
    "CS102": {"name": "Digital Systems"},
}

# Instructors dictionary: {instructor_id: {"name": str}}
INSTRUCTORS = {
    "inst-1": {"name": "Prof. Ben-Moshe Boaz"},
    "inst-2": {"name": "Mr. Even-Hen Yedidia"},
    "inst-3": {"name": "Mr. Rudkin Amri"},
    "inst-4": {"name": "Mr. Tsadik Daniel"},
    "inst-5": {"name": "Prof. Weinstein Gilbert"},
    "inst-6": {"name": "Mr. Kasherim Baruch"},
    "inst-7": {"name": "Mr. Segal Ran"},
    "inst-8": {"name": "Mr. Danino Dotan"},
    "inst-9": {"name": "Mr. Mor Doron"},
    "inst-10": {"name": "Ms. Ben-David Tamar"},
    "inst-11": {"name": "Dr. Kalmanovich Daniel"},
    "inst-12": {"name": "Mr. Rosenberg Daniel"},
    "inst-13": {"name": "Ms. Lissek Bar"},
}

# Create instructor name to ID mapping
INSTRUCTOR_NAME_TO_ID = {
    "Prof. Ben-Moshe Boaz": "inst-1",
    "Mr. Even-Hen Yedidia": "inst-2",
    "Mr. Rudkin Amri": "inst-3",
    "Mr. Tsadik Daniel": "inst-4",
    "Prof. Weinstein Gilbert": "inst-5",
    "Mr. Kasherim Baruch": "inst-6",
    "Mr. Segal Ran": "inst-7",
    "Mr. Danino Dotan": "inst-8",
    "Mr. Mor Doron": "inst-9",
    "Ms. Ben-David Tamar": "inst-10",
    "Dr. Kalmanovich Daniel": "inst-11",
    "Mr. Rosenberg Daniel": "inst-12",
    "Ms. Lissek Bar": "inst-13",
}

# Day name to integer mapping: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
DAY_NAME_TO_INT = {
    "Sunday": 0,
    "Monday": 1,
    "Tuesday": 2,
    "Wednesday": 3,
    "Thursday": 4,
    "Friday": 5,
    "Saturday": 6,
}

# Sections dictionary: {section_id: {"course_id": str, "instructor_id": str, "type": str, "linked_recitations": list or None, "capacity": int, "enrolled_count": int}}
# type: "Lecture" or "Recitation"
# linked_recitations: For Lectures, list of recitation IDs; For Recitations, None
# Note: available_seats=0 means full. For available_seats=0, we assign a reasonable capacity and set enrolled_count = capacity (full).
# For available_seats > 0, we set capacity = available_seats + some enrolled, and enrolled_count such that capacity - enrolled_count = available_seats
SECTIONS = {
    # CS101 - Introduction to Computer Science
    "intro_l1": {"course_id": "CS101", "instructor_id": "inst-1", "type": "Lecture", "linked_recitations": ["intro_t2", "intro_t3"], "capacity": 21, "enrolled_count": 15},
    "intro_l2": {"course_id": "CS101", "instructor_id": "inst-1", "type": "Lecture", "linked_recitations": ["intro_t2"], "capacity": 4, "enrolled_count": 2},
    "intro_t1": {"course_id": "CS101", "instructor_id": "inst-2", "type": "Recitation", "linked_recitations": None, "capacity": 25, "enrolled_count": 25},  # Full
    "intro_t2": {"course_id": "CS101", "instructor_id": "inst-3", "type": "Recitation", "linked_recitations": None, "capacity": 2, "enrolled_count": 0},
    "intro_t3": {"course_id": "CS101", "instructor_id": "inst-4", "type": "Recitation", "linked_recitations": None, "capacity": 2, "enrolled_count": 0},
    
    # MATH101 - Infinitesimal Calculus 1 for CS
    "calc1_l1": {"course_id": "MATH101", "instructor_id": "inst-5", "type": "Lecture", "linked_recitations": ["calc1_t2", "calc1_t3"], "capacity": 62, "enrolled_count": 45},
    "calc1_t1": {"course_id": "MATH101", "instructor_id": "inst-6", "type": "Recitation", "linked_recitations": None, "capacity": 30, "enrolled_count": 30},  # Full
    "calc1_t2": {"course_id": "MATH101", "instructor_id": "inst-7", "type": "Recitation", "linked_recitations": None, "capacity": 9, "enrolled_count": 5},
    "calc1_t3": {"course_id": "MATH101", "instructor_id": "inst-6", "type": "Recitation", "linked_recitations": None, "capacity": 3, "enrolled_count": 1},
    "calc1_t4": {"course_id": "MATH101", "instructor_id": "inst-7", "type": "Recitation", "linked_recitations": None, "capacity": 11, "enrolled_count": 7},
    
    # MATH102 - Linear Algebra 1 for CS
    "algo1_l1": {"course_id": "MATH102", "instructor_id": "inst-8", "type": "Lecture", "linked_recitations": ["algo1_t1", "algo1_t2"], "capacity": 5, "enrolled_count": 3},
    "algo1_t1": {"course_id": "MATH102", "instructor_id": "inst-9", "type": "Recitation", "linked_recitations": None, "capacity": 2, "enrolled_count": 0},
    "algo1_t2": {"course_id": "MATH102", "instructor_id": "inst-9", "type": "Recitation", "linked_recitations": None, "capacity": 25, "enrolled_count": 25},  # Full
    "algo1_t3": {"course_id": "MATH102", "instructor_id": "inst-10", "type": "Recitation", "linked_recitations": None, "capacity": 30, "enrolled_count": 30},  # Full
    
    # MATH103 - Logic and Set Theory for CS
    "logic_l1": {"course_id": "MATH103", "instructor_id": "inst-11", "type": "Lecture", "linked_recitations": ["logic_t1", "logic_t2"], "capacity": 1, "enrolled_count": 0},
    "logic_t1": {"course_id": "MATH103", "instructor_id": "inst-9", "type": "Recitation", "linked_recitations": None, "capacity": 1, "enrolled_count": 0},
    "logic_t2": {"course_id": "MATH103", "instructor_id": "inst-9", "type": "Recitation", "linked_recitations": None, "capacity": 1, "enrolled_count": 0},
    "logic_t3": {"course_id": "MATH103", "instructor_id": "inst-9", "type": "Recitation", "linked_recitations": None, "capacity": 9, "enrolled_count": 6},
    
    # CS102 - Digital Systems
    "digi_l1": {"course_id": "CS102", "instructor_id": "inst-9", "type": "Lecture", "linked_recitations": ["digi_t2", "digi_t3"], "capacity": 30, "enrolled_count": 30},  # Full
    "digi_l2": {"course_id": "CS102", "instructor_id": "inst-9", "type": "Lecture", "linked_recitations": ["digi_t2", "digi_t4"], "capacity": 12, "enrolled_count": 8},
    "digi_t1": {"course_id": "CS102", "instructor_id": "inst-12", "type": "Recitation", "linked_recitations": None, "capacity": 25, "enrolled_count": 25},  # Full
    "digi_t2": {"course_id": "CS102", "instructor_id": "inst-9", "type": "Recitation", "linked_recitations": None, "capacity": 8, "enrolled_count": 5},
    "digi_t3": {"course_id": "CS102", "instructor_id": "inst-13", "type": "Recitation", "linked_recitations": None, "capacity": 3, "enrolled_count": 0},
    "digi_t4": {"course_id": "CS102", "instructor_id": "inst-12", "type": "Recitation", "linked_recitations": None, "capacity": 30, "enrolled_count": 30},  # Full
}

# Section Times dictionary: {section_id: [{"day": int, "start_time": str, "end_time": str}, ...]}
# Day encoding: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
SECTION_TIMES = {
    # CS101 - Introduction to Computer Science
    "intro_l1": [{"day": 0, "start_time": "15:00", "end_time": "17:00"}],  # Sunday
    "intro_l2": [{"day": 2, "start_time": "09:00", "end_time": "11:00"}],  # Tuesday
    "intro_t1": [{"day": 3, "start_time": "18:00", "end_time": "20:00"}],  # Wednesday
    "intro_t2": [{"day": 3, "start_time": "11:00", "end_time": "13:00"}],  # Wednesday
    "intro_t3": [{"day": 3, "start_time": "13:00", "end_time": "15:00"}],  # Wednesday
    
    # MATH101 - Infinitesimal Calculus 1 for CS
    "calc1_l1": [{"day": 1, "start_time": "13:00", "end_time": "15:00"}],  # Monday
    "calc1_t1": [{"day": 0, "start_time": "13:00", "end_time": "15:00"}],  # Sunday
    "calc1_t2": [{"day": 1, "start_time": "17:00", "end_time": "19:00"}],  # Monday
    "calc1_t3": [{"day": 1, "start_time": "15:00", "end_time": "17:00"}],  # Monday
    "calc1_t4": [{"day": 1, "start_time": "15:00", "end_time": "17:00"}],  # Monday
    
    # MATH102 - Linear Algebra 1 for CS
    "algo1_l1": [{"day": 0, "start_time": "15:00", "end_time": "17:00"}],  # Sunday
    "algo1_t1": [{"day": 0, "start_time": "17:00", "end_time": "19:00"}],  # Sunday
    "algo1_t2": [{"day": 0, "start_time": "15:00", "end_time": "17:00"}],  # Sunday
    "algo1_t3": [{"day": 1, "start_time": "17:00", "end_time": "19:00"}],  # Monday
    
    # MATH103 - Logic and Set Theory for CS
    "logic_l1": [{"day": 0, "start_time": "10:00", "end_time": "13:00"}],  # Sunday
    "logic_t1": [{"day": 2, "start_time": "13:00", "end_time": "15:00"}],  # Tuesday
    "logic_t2": [{"day": 3, "start_time": "13:00", "end_time": "15:00"}],  # Wednesday
    "logic_t3": [{"day": 2, "start_time": "15:00", "end_time": "17:00"}],  # Tuesday
    
    # CS102 - Digital Systems
    "digi_l1": [{"day": 3, "start_time": "15:00", "end_time": "17:00"}],  # Wednesday
    "digi_l2": [{"day": 3, "start_time": "17:00", "end_time": "19:00"}],  # Wednesday
    "digi_t1": [{"day": 1, "start_time": "16:00", "end_time": "17:00"}],  # Monday
    "digi_t2": [{"day": 2, "start_time": "18:00", "end_time": "19:00"}],  # Tuesday
    "digi_t3": [{"day": 0, "start_time": "15:00", "end_time": "16:00"}],  # Sunday
    "digi_t4": [{"day": 1, "start_time": "15:00", "end_time": "16:00"}],  # Monday
}
