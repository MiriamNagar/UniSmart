import { Course, CourseSection, Lesson, Days } from '@/types/courses';
import { StudentPreferences } from '@/types/constraints';

// המרת שעה מפורמט HH:MM למספר דקות (להשוואה קלה)
export function parseTime(time: string): number {
  if (time === 'Any' || !time) return -1;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

// בדיקת חפיפה בין שני שיעורים בודדים
export function isLessonOverlap(lesson1: Lesson, lesson2: Lesson): boolean {
  if (lesson1.day !== lesson2.day) return false;
  
  const start1 = parseTime(lesson1.startTime);
  const end1 = parseTime(lesson1.endTime);
  const start2 = parseTime(lesson2.startTime);
  const end2 = parseTime(lesson2.endTime);

  return Math.max(start1, start2) < Math.min(end1, end2);
}

// בדיקה אם קבוצת רישום (Section) שלמה מתנגשת עם מערכת קיימת
export function hasCollision(newSection: CourseSection, currentSchedule: CourseSection[]): boolean {
  for (const existingSection of currentSchedule) {
    for (const existingLesson of existingSection.lessons) {
      for (const newLesson of newSection.lessons) {
        if (isLessonOverlap(existingLesson, newLesson)) {
          return true;
        }
      }
    }
  }
  return false;
}

// בדיקת אילוצים קשיחים: האם הקבוצה נופלת על ימים חסומים או מתנגשת
export function isSectionValid(
  section: CourseSection, 
  currentSchedule: CourseSection[], 
  preferences: StudentPreferences
): boolean {
  // בדיקת ימים חסומים
  const hasBlockedDay = section.lessons.some(lesson => 
    preferences.blockedDays.includes(lesson.day)
  );
  if (hasBlockedDay) return false;

  // בדיקת חפיפת שעות
  if (hasCollision(section, currentSchedule)) return false;

  return true;
}

// פונקציית דירוג (אילוצים רכים) - מחזירה ציון 0-100
export function calculateFitScore(
  currentSections: CourseSection[],
  allSelectedCourses: Course[], // כל הקורסים שהסטודנט סימן ב-Checklist
  preferences: StudentPreferences
): number {
  if (allSelectedCourses.length === 0) return 0;

  // --- 1. חישוב רכיב הנ"ז (40%) ---
  const maxPossibleCredits = allSelectedCourses.reduce((sum, c) => sum + (c.credits || 0), 0);
  
  // מציאת הנ"ז של הקורסים ששובצו בפועל
  const currentCredits = currentSections.reduce((sum, section) => {
    const parentCourse = allSelectedCourses.find(c => 
      c.availableSections.some(s => s.sectionID === section.sectionID)
    );
    return sum + (parentCourse?.credits || 0);
  }, 0);

  const creditScore = maxPossibleCredits > 0 
    ? (currentCredits / maxPossibleCredits) * 60
    : 0;

  // --- 2. חישוב רכיב השעות (60%) ---
  const allLessons = currentSections.flatMap(s => s.lessons);
  const totalLessonsCount = allLessons.length;

  if (totalLessonsCount === 0) return creditScore; // מערכת ריקה תקבל רק ניקוד נ"ז (0)

  const prefStart = parseTime(preferences.startHour);
  const prefEnd = parseTime(preferences.endHour);
  
  let penaltyCount = 0;

  for (const lesson of allLessons) {
    const start = parseTime(lesson.startTime);
    const end = parseTime(lesson.endTime);

    let isViolated = false;
    if (prefStart !== -1 && start < prefStart) isViolated = true;
    if (prefEnd !== -1 && end > prefEnd) isViolated = true;

    if (isViolated) {
      penaltyCount++;
    }
  }

  // כל שיעור שחורג מוריד את החלק היחסי שלו מתוך ה-60 נקודות
  const timeScore = 40 * (1 - (penaltyCount / totalLessonsCount));

  // ציון סופי
  return Math.round(creditScore + timeScore);
}