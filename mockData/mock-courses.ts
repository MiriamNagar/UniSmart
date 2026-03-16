import { Course, Days } from "@/types";

export const mockCourses: Course[] = [
	{
		courseID: "CS101",
		courseName: "Introduction to Computer Science",
		isMandatory: true,
		credits: 5,
		semester: 'A',
		availableSections: [
			{
				sectionID: "CS101-001",
				lessons: [
					{
						day: Days.Mon,
						lecturer: "Dr. Smith",
						location: "Room 101",
						type: "Lecture",
						startTime: "09:00",
						endTime: "12:00"
					},
					{
						day: Days.Sun,
						lecturer: "Dr. Johnson",
						location: "Room 202",
						type: "Tutorial",
						startTime: "14:00",
						endTime: "16:00"
					}
				]
			},
			{
				sectionID: "CS101-002",
				lessons: [
					{
						day: Days.Mon,
						lecturer: "Dr. Lee",
						location: "Room 102",
						type: "Lecture",
						startTime: "10:00",
						endTime: "11:30"
					},
					{
						day: Days.Wed,
						lecturer: "Dr. Lee",
						location: "Room 102",
						type: "Lecture",
						startTime: "13:00",
						endTime: "14:30"
					},
					{
						day: Days.Sun,
						lecturer: "Dr. Johnson",
						location: "Room 202",
						type: "Tutorial",
						startTime: "16:00",
						endTime: "18:00"
					}
				]
			}
		]
	},
	{
		courseID: "MATH201",
		courseName: "Calculus I",
		isMandatory: true,
		credits: 4,
		semester: 'A',
		availableSections: [
			{
				sectionID: "MATH201-001",
				lessons: [
					{
						day: Days.Tue,
						lecturer: "Dr. Williams",
						location: "Room 303",
						type: "Lecture",
						startTime: "11:00",
						endTime: "12:30"
					},
					{
						day: Days.Thu,
						lecturer: "Dr. Clark",
						location: "Room 303",
						type: "Tutorial",
						startTime: "14:00",
						endTime: "15:00"
					}
				]
			},
			{
				sectionID: "MATH201-002",
				lessons: [
					{
						day: Days.Mon,
						lecturer: "Dr. Williams",
						location: "Room 303",
						type: "Lecture",
						startTime: "09:00",
						endTime: "10:30"
					},
					{
						day: Days.Thu,
						lecturer: "Dr. Clark",
						location: "Room 303",
						type: "Tutorial",
						startTime: "13:00",
						endTime: "14:00"
					}
				]
			}
		]
	},
	{
		courseID: "HIST150",
		courseName: "World History",
		isMandatory: false,
		credits: 2,
		semester: 'A',
		availableSections: [
			{
				sectionID: "HIST150-001",
				lessons: [
					{
						day: Days.Wed,
						lecturer: "Dr. Davis",
						location: "Room 404",
						type: "Lecture",
						startTime: "10:00",
						endTime: "11:30"
					}
				]
			}
		]
	},
	{
		courseID: "PHYS101",
		courseName: "General Physics",
		isMandatory: false,
		credits: 3,
		semester: 'A',
		availableSections: [
			{
				sectionID: "PHYS101-001",
				lessons: [
					{
						day: Days.Sun,
						lecturer: "Dr. Brown",
						location: "Room 505",
						type: "Lecture",
						startTime: "14:00",
						endTime: "15:30"
					}
				]
			}
		]
	}
]