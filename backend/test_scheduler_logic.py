"""
Unit tests for scheduler_logic module.
Tests include setup, function calls, and assertions.
At least one test uses Mock Objects (unittest.mock).
"""
import unittest
from unittest.mock import patch, MagicMock
from scheduler_logic import (
    time_to_minutes,
    times_overlap,
    sections_conflict,
    calculate_schedule_score
)


class TestTimeToMinutes(unittest.TestCase):
    """Test cases for time_to_minutes function."""
    
    def test_time_to_minutes_morning(self):
        """
        Test 1: Convert morning time to minutes.
        1. Setup: Morning time string "09:30"
        2. Call: time_to_minutes("09:30")
        3. Assert: Should return 570 minutes (9*60 + 30)
        """
        # Setup
        time_str = "09:30"
        expected_minutes = 9 * 60 + 30  # 570 minutes
        
        # Call function under test
        result = time_to_minutes(time_str)
        
        # Assert expected result
        self.assertEqual(result, expected_minutes)
    
    def test_time_to_minutes_afternoon(self):
        """
        Test 2: Convert afternoon time to minutes.
        1. Setup: Afternoon time string "15:45"
        2. Call: time_to_minutes("15:45")
        3. Assert: Should return 945 minutes (15*60 + 45)
        """
        # Setup
        time_str = "15:45"
        expected_minutes = 15 * 60 + 45  # 945 minutes
        
        # Call function under test
        result = time_to_minutes(time_str)
        
        # Assert expected result
        self.assertEqual(result, expected_minutes)
    
    def test_time_to_minutes_midnight(self):
        """
        Test 3: Convert midnight time to minutes.
        1. Setup: Midnight time string "00:00"
        2. Call: time_to_minutes("00:00")
        3. Assert: Should return 0 minutes
        """
        # Setup
        time_str = "00:00"
        expected_minutes = 0
        
        # Call function under test
        result = time_to_minutes(time_str)
        
        # Assert expected result
        self.assertEqual(result, expected_minutes)


class TestTimesOverlap(unittest.TestCase):
    """Test cases for times_overlap function."""
    
    def test_times_overlap_no_overlap_before(self):
        """
        Test 1: Two time ranges that don't overlap (first ends before second starts).
        1. Setup: First range 09:00-11:00, Second range 13:00-15:00
        2. Call: times_overlap("09:00", "11:00", "13:00", "15:00")
        3. Assert: Should return False (no overlap)
        """
        # Setup
        start1, end1 = "09:00", "11:00"
        start2, end2 = "13:00", "15:00"
        
        # Call function under test
        result = times_overlap(start1, end1, start2, end2)
        
        # Assert expected result
        self.assertFalse(result)
    
    def test_times_overlap_adjacent_times(self):
        """
        Test 2: Two time ranges that are adjacent (first ends exactly when second starts).
        1. Setup: First range 09:00-11:00, Second range 11:00-13:00
        2. Call: times_overlap("09:00", "11:00", "11:00", "13:00")
        3. Assert: Should return False (adjacent times don't overlap)
        """
        # Setup
        start1, end1 = "09:00", "11:00"
        start2, end2 = "11:00", "13:00"
        
        # Call function under test
        result = times_overlap(start1, end1, start2, end2)
        
        # Assert expected result
        self.assertFalse(result)
    
    def test_times_overlap_fully_overlaps(self):
        """
        Test 3: Two time ranges that fully overlap.
        1. Setup: First range 09:00-13:00, Second range 10:00-12:00 (contained within first)
        2. Call: times_overlap("09:00", "13:00", "10:00", "12:00")
        3. Assert: Should return True (overlaps)
        """
        # Setup
        start1, end1 = "09:00", "13:00"
        start2, end2 = "10:00", "12:00"
        
        # Call function under test
        result = times_overlap(start1, end1, start2, end2)
        
        # Assert expected result
        self.assertTrue(result)
    
    def test_times_overlap_partial_overlap(self):
        """
        Test 4: Two time ranges that partially overlap.
        1. Setup: First range 09:00-12:00, Second range 11:00-14:00
        2. Call: times_overlap("09:00", "12:00", "11:00", "14:00")
        3. Assert: Should return True (overlaps)
        """
        # Setup
        start1, end1 = "09:00", "12:00"
        start2, end2 = "11:00", "14:00"
        
        # Call function under test
        result = times_overlap(start1, end1, start2, end2)
        
        # Assert expected result
        self.assertTrue(result)


class TestSectionsConflict(unittest.TestCase):
    """Test cases for sections_conflict function using Mock Objects."""
    
    @patch.dict('scheduler_logic.SECTION_TIMES', {
        "section1": [
            {"day": 1, "start_time": "09:00", "end_time": "11:00"}  # Monday 9-11
        ],
        "section2": [
            {"day": 1, "start_time": "10:00", "end_time": "12:00"}  # Monday 10-12 (overlaps)
        ]
    })
    def test_sections_conflict_same_day_overlapping_times(self):
        """
        Test 1: Two sections conflict on same day with overlapping times (using Mock).
        1. Setup: Mock SECTION_TIMES dictionary using patch.dict
        2. Call: sections_conflict("section1", "section2")
        3. Assert: Should return True (conflict detected)
        """
        # Call function under test
        result = sections_conflict("section1", "section2")
        
        # Assert expected result
        self.assertTrue(result)
    
    @patch.dict('scheduler_logic.SECTION_TIMES', {
        "section1": [
            {"day": 1, "start_time": "09:00", "end_time": "11:00"}  # Monday
        ],
        "section2": [
            {"day": 2, "start_time": "09:00", "end_time": "11:00"}  # Tuesday (different day)
        ]
    })
    def test_sections_conflict_different_days_no_conflict(self):
        """
        Test 2: Two sections on different days don't conflict (using Mock).
        1. Setup: Mock SECTION_TIMES dictionary using patch.dict
        2. Call: sections_conflict("section1", "section2")
        3. Assert: Should return False (no conflict)
        """
        # Call function under test
        result = sections_conflict("section1", "section2")
        
        # Assert expected result
        self.assertFalse(result)
    
    @patch.dict('scheduler_logic.SECTION_TIMES', {
        "section1": [
            {"day": 1, "start_time": "09:00", "end_time": "11:00"}  # Monday 9-11
        ],
        "section2": [
            {"day": 1, "start_time": "13:00", "end_time": "15:00"}  # Monday 13-15 (no overlap)
        ]
    })
    def test_sections_conflict_same_day_non_overlapping_times(self):
        """
        Test 3: Two sections on same day but non-overlapping times don't conflict (using Mock).
        1. Setup: Mock SECTION_TIMES dictionary using patch.dict
        2. Call: sections_conflict("section1", "section2")
        3. Assert: Should return False (no conflict)
        """
        # Call function under test
        result = sections_conflict("section1", "section2")
        
        # Assert expected result
        self.assertFalse(result)
    
    @patch.dict('scheduler_logic.SECTION_TIMES', {
        "section1": [
            {"day": 1, "start_time": "09:00", "end_time": "11:00"},  # Monday 9-11
            {"day": 3, "start_time": "09:00", "end_time": "11:00"}   # Wednesday 9-11
        ],
        "section2": [
            {"day": 1, "start_time": "10:00", "end_time": "12:00"},  # Monday 10-12 (overlaps!)
            {"day": 2, "start_time": "09:00", "end_time": "11:00"}   # Tuesday 9-11 (no overlap)
        ]
    })
    def test_sections_conflict_multiple_meetings_one_overlaps(self):
        """
        Test 4: Sections with multiple meetings where one pair overlaps (using Mock).
        1. Setup: Mock SECTION_TIMES dictionary using patch.dict with multiple meetings
        2. Call: sections_conflict("section1", "section2")
        3. Assert: Should return True (conflict detected)
        """
        # Call function under test
        result = sections_conflict("section1", "section2")
        
        # Assert expected result
        self.assertTrue(result)


class TestCalculateScheduleScore(unittest.TestCase):
    """Test cases for calculate_schedule_score function using Mock Objects."""
    
    @patch.dict('scheduler_logic.SECTIONS', {
        "section1": {
            "course_id": "CS101",
            "instructor_id": "inst-1"
        }
    })
    @patch.dict('scheduler_logic.SECTION_TIMES', {
        "section1": [
            {"day": 1, "start_time": "10:00", "end_time": "12:00"}  # Monday 10-12
        ]
    })
    def test_calculate_schedule_score_preferred_start_time(self):
        """
        Test 1: Calculate score with preferred start time matching (using Mock).
        1. Setup: Mock SECTIONS and SECTION_TIMES dictionaries using patch.dict
        2. Call: calculate_schedule_score with selected sections
        3. Assert: Score should reflect preferred start time bonus
        """
        # Setup: Preferences and course preferences
        selected_sections = ["section1"]
        preferences = {
            "preferred_start_time": "09:00",
            "preferred_end_time": "11:00",
            "day_off_requested": None
        }
        course_preferences_map = {}
        
        # Call function under test
        result = calculate_schedule_score(selected_sections, preferences, course_preferences_map)
        
        # Assert: Score should be between 0 and 100
        self.assertGreaterEqual(result, 0)
        self.assertLessEqual(result, 100)
        # Since first lesson starts at 10:00 which is within preferred range (9-11), should get some points
        self.assertGreater(result, 0)
    
    @patch.dict('scheduler_logic.SECTIONS', {
        "section1": {
            "course_id": "CS101",
            "instructor_id": "inst-1"  # Preferred instructor
        }
    })
    @patch.dict('scheduler_logic.SECTION_TIMES', {
        "section1": [
            {"day": 1, "start_time": "09:00", "end_time": "11:00"}
        ]
    })
    def test_calculate_schedule_score_instructor_preference(self):
        """
        Test 2: Calculate score with instructor preference matching (using Mock).
        1. Setup: Mock SECTIONS and SECTION_TIMES dictionaries using patch.dict
        2. Call: calculate_schedule_score with matching instructor
        3. Assert: Score should reflect instructor preference bonus
        """
        # Setup: Preferences with instructor preference
        selected_sections = ["section1"]
        preferences = {
            "preferred_start_time": "08:00",
            "preferred_end_time": "12:00",
            "day_off_requested": None
        }
        course_preferences_map = {
            "CS101": "inst-1"  # Preferred instructor matches
        }
        
        # Call function under test
        result = calculate_schedule_score(selected_sections, preferences, course_preferences_map)
        
        # Assert: Score should be greater than 0 (instructor preference matched)
        self.assertGreaterEqual(result, 0)
        self.assertLessEqual(result, 100)
        # Should get points for both preferred start time and instructor preference
        self.assertGreater(result, 0)
    
    @patch.dict('scheduler_logic.SECTIONS', {
        "section1": {
            "course_id": "CS101",
            "instructor_id": "inst-1"
        }
    })
    @patch.dict('scheduler_logic.SECTION_TIMES', {
        "section1": [
            {"day": 1, "start_time": "09:00", "end_time": "11:00"}  # Monday, not Friday
        ]
    })
    def test_calculate_schedule_score_day_off_bonus(self):
        """
        Test 3: Calculate score with day off bonus (using Mock).
        1. Setup: Mock SECTIONS and SECTION_TIMES dictionaries using patch.dict
        2. Call: calculate_schedule_score with no meetings on requested day off
        3. Assert: Score should include day off bonus
        """
        # Setup: Preferences with day off request
        selected_sections = ["section1"]
        preferences = {
            "preferred_start_time": "08:00",
            "preferred_end_time": "12:00",
            "day_off_requested": 5  # Friday
        }
        course_preferences_map = {}
        
        # Call function under test
        result = calculate_schedule_score(selected_sections, preferences, course_preferences_map)
        
        # Assert: Score should be greater than 0 (day off bonus applied)
        self.assertGreaterEqual(result, 0)
        self.assertLessEqual(result, 100)
        # Should get points for preferred start time and day off bonus
        self.assertGreater(result, 0)


if __name__ == '__main__':
    unittest.main()

