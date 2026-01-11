# API Contract: /generate-schedules

## Request (POST)
{
  "selected_course_ids": ["uuid-1", "uuid-2"],
  "preferences": {
    "preferred_start_time": "09:00", 
    "preferred_end_time": "11:00",
    "day_off_requested": 5, // 0=Sun, 5=Fri
    "course_preferences": [
      { "course_id": "uuid-1", "preferred_instructor_id": "inst-1" }
    ]
  },
  "max_options": 5
}

## Response (JSON)
{
  "status": "success",
  "options": [
    {
      "score": 85,
      "schedule": [
        {
          "course_name": "Introduction to Computation",
          "section_id": "L1",
          "type": "Lecture",
          "instructor": "Prof. Boaz Ben-Moshe",
          "meetings": [
            {"day": 1, "start": "15:00", "end": "17:00"}
          ]
        },
        {
          "course_name": "Introduction to Computation",
          "section_id": "R2",
          "type": "Recitation",
          "instructor": "Mr. Amri Rodkin",
          "meetings": [
            {"day": 4, "start": "11:00", "end": "13:00"}
          ]
        }
      ]
    }
  ]
}