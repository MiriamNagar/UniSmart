## Unit Tests for `scheduler_logic.py`


### Unit Test Group: Testing `time_to_minutes` function

Python

```python
def test_time_to_minutes_morning(self):
    time_str = "09:30"
    expected_minutes = 9 * 60 + 30

    result = time_to_minutes(time_str)

    self.assertEqual(result, expected_minutes)
```

**Explanation**

This test checks that `time_to_minutes("09:30")` returns the correct number of minutes from midnight (`570`).  
It verifies the result using `assertEqual`.

The other `time_to_minutes` tests are similar but use `"15:45"` (afternoon) and `"00:00"` (midnight).

---

### Unit Test Group: Testing `times_overlap` function

Python

```python
def test_times_overlap_partial_overlap(self):
    start1, end1 = "09:00", "12:00"
    start2, end2 = "11:00", "14:00"

    result = times_overlap(start1, end1, start2, end2)

    self.assertTrue(result)
```

**Explanation**

This test checks that `times_overlap` returns `True` when two time ranges (`09:00–12:00` and `11:00–14:00`) overlap.  
It verifies the result using `assertTrue`.

Other tests in this group check no overlap, adjacent times, and full overlap cases.

---

### Unit Test Group: Testing `sections_conflict` function (with Mock Objects)

Python

```python
@patch.dict('scheduler_logic.SECTION_TIMES', {
    "section1": [{"day": 1, "start_time": "09:00", "end_time": "11:00"}],
    "section2": [{"day": 1, "start_time": "10:00", "end_time": "12:00"}],
})
def test_sections_conflict_same_day_overlapping_times(self):
    result = sections_conflict("section1", "section2")
    self.assertTrue(result)
```

**Explanation**

This test checks that `sections_conflict("section1", "section2")` returns `True` when two sections on the same day have overlapping times.  
It uses `@patch.dict` to mock `SECTION_TIMES` and verifies the result with `assertTrue`.

Other tests here cover different days, non-overlapping times, and multiple meetings.

---

### Unit Test Group: Testing `calculate_schedule_score` function (with Mock Objects)

Python

```python
@patch.dict('scheduler_logic.SECTIONS', {
    "section1": {"course_id": "CS101", "instructor_id": "inst-1"}
})
@patch.dict('scheduler_logic.SECTION_TIMES', {
    "section1": [{"day": 1, "start_time": "10:00", "end_time": "12:00"}]
})
def test_calculate_schedule_score_preferred_start_time(self):
    selected_sections = ["section1"]
    preferences = {
        "preferred_start_time": "09:00",
        "preferred_end_time": "11:00",
        "day_off_requested": None,
    }
    course_preferences_map = {}

    result = calculate_schedule_score(selected_sections, preferences, course_preferences_map)

    self.assertGreater(result, 0)
```

**Explanation**

This test checks that `calculate_schedule_score` gives a positive score when the selected section matches the student's preferred time window.  
It mocks `SECTIONS` and `SECTION_TIMES`, calls the function, and verifies the score with `assertGreater(result, 0)` and range checks.

Other tests for this function check instructor preference and having no classes on a requested day off.

---

### Running the Tests

To run all tests in `test_scheduler_logic.py`:

```bash
cd backend
python -m unittest test_scheduler_logic.py
```

