import { Course, CourseSection } from '@/types/courses';
import { StudentPreferences } from '@/types/constraints';
import { schedule, PlannerResult } from '@/types/planner-result';
import { isSectionValid, calculateFitScore } from './utils';

export function generateSchedules(
  courses: Course[], 
  preferences: StudentPreferences,
  maxResults: number = 5
): PlannerResult {
  
  const validSchedules: schedule[] = [];
  
  // סידור הקורסים כך שקורסי חובה ישובצו קודם
  // זה מייעל את הגיזום בעץ הקומבינטורי
  const sortedCourses = [...courses].sort((a, b) => {
    if (a.isMandatory === b.isMandatory) return 0;
    return a.isMandatory ? -1 : 1;
  });

  // פונקציית הרקורסיה (Backtracking)
  function backtrack(courseIndex: number, currentSections: CourseSection[]) {
    // תנאי עצירה: עברנו על כל הקורסים
    if (courseIndex === sortedCourses.length) {
      // יצירת אובייקט מערכת חוקית
      const newSchedule: schedule = {
        id: `sched-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        sections: [...currentSections],
        fitScore: calculateFitScore(currentSections, sortedCourses, preferences),
        totalCredits: currentSections.length, // כאן אפשר לשנות לסכימת נ"ז אמיתית אם תתווסף למודל
      };
      validSchedules.push(newSchedule);
      return;
    }

    const currentCourse = sortedCourses[courseIndex];

    // ענף 1: נסיון לדלג על הקורס (רק אם הוא קורס בחירה)
    if (!currentCourse.isMandatory) {
      backtrack(courseIndex + 1, currentSections);
    }

    // ענף 2: נסיון לשבץ את אחת מקבוצות הרישום של הקורס הנוכחי
    for (const section of currentCourse.availableSections) {
      if (isSectionValid(section, currentSections, preferences)) {
        currentSections.push(section); // הוספה למערכת הזמנית
        backtrack(courseIndex + 1, currentSections); // קריאה רקורסיבית
        currentSections.pop(); // Backtrack - הסרה והמשך נסיון לקבוצה הבאה
      }
    }
  }

  // הפעלת האלגוריתם
  backtrack(0, []);

  // מיון התוצאות מהציון הגבוה לנמוך והחזרת המערכות הטובות ביותר
  validSchedules.sort((a, b) => b.fitScore - a.fitScore);
  
  return {
    proposals: validSchedules.slice(0, maxResults)
  };
}