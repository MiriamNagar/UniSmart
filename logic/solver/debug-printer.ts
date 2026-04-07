import { PlannerResult, schedule } from '@/types/planner-result';
import { Days } from '@/types/courses';

export function printSchedulesToConsole(result: PlannerResult) {
  if (result.proposals.length === 0) {
    console.log("❌ No valid schedules found.");
    return;
  }

  console.log(`\nFound ${result.proposals.length} possible schedules:\n`);

  result.proposals.forEach((proposal, index) => {
    console.log(`=====================================================`);
    console.log(`  PROPOSAL #${index + 1} | FIT SCORE: ${proposal.fitScore}%`);
    console.log(`=====================================================`);

    // סידור ימי השבוע לפי הסדר הנכון
    const dayOrder = [Days.Sun, Days.Mon, Days.Tue, Days.Wed, Days.Thu, Days.Fri];

    dayOrder.forEach(day => {
      // סינון כל השיעורים שמתקיימים ביום הזה מכל הקורסים במערכת
      const lessonsInDay = proposal.sections.flatMap(section => 
        section.lessons
          .filter(lesson => lesson.day === day)
          .map(lesson => ({
            ...lesson,
            sectionID: section.sectionID
          }))
      );

      if (lessonsInDay.length > 0) {
        console.log(`\n ${day.toUpperCase()}:`);
        
        // מיון השיעורים לפי שעת התחלה
        lessonsInDay.sort((a, b) => a.startTime.localeCompare(b.startTime));

        lessonsInDay.forEach(l => {
          const timeRange = `${l.startTime} - ${l.endTime}`;
          const info = `[${l.sectionID}] ${l.type.padEnd(8)} | ${l.location.padEnd(10)} | ${l.lecturer}`;
          console.log(`  ${timeRange.padEnd(15)} | ${info}`);
        });
      }
    });
    console.log(`\n`);
  });
}