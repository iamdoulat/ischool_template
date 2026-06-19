export const mockUserDashboardData = {
    profile: {
        name: "Edward Thomas",
        attendance_percentage: 84.62,
        minimum_attendance: 75.00,
        barcode: "1800011",
        image: null
    },
    notices: [
        { id: 1, title: "Fee Submission Reminder", date: "06/05/2026", description: "This is a reminder that the term fee submission deadline is approaching. Please ensure all dues are cleared by the end of this week to avoid a late penalty. You can pay online through the Fees section of your portal." },
        { id: 2, title: "Extra class for Std - X to XII", date: "06/08/2026", description: "Extra classes for Standards X to XII will be conducted starting next Monday. Mathematics and Science sessions will be held from 4:00 PM to 5:30 PM in their respective classrooms. Attendance is mandatory." },
        { id: 3, title: "Parent-Teacher Meeting", date: "06/02/2026", description: "The quarterly Parent-Teacher Meeting is scheduled for this Saturday from 10:00 AM to 1:00 PM. Parents are requested to meet the respective class teachers to discuss student progress." },
        { id: 4, title: "Online Learning Notice", date: "05/27/2026", description: "Due to scheduled maintenance, classes on Friday will be conducted online via the live class portal. Please log in 10 minutes before your scheduled class time and ensure a stable internet connection." }
    ],
    subjectProgress: [
        { id: 1, subject: "English (210)", progress: 68 },
        { id: 2, subject: "Hindi (230)", progress: 0 },
        { id: 3, subject: "Mathematics (110)", progress: 0 },
        { id: 4, subject: "Science (111)", progress: 100 },
        { id: 5, subject: "Social Studies (212)", progress: 100 }
    ],
    upcomingClasses: [
        { id: 1, teacher: "Shivam Verma", code: "9002", subject: "English (210)", room: "100", time: "8:00 AM-08:45 AM" },
        { id: 2, teacher: "Jason Sharlton", code: "90006", subject: "Hindi (230)", room: "100", time: "8:45 AM-9:30 AM" },
        { id: 3, teacher: "Nishant Khare", code: "1002", subject: "Mathematics (110)", room: "100", time: "9:30 AM-10:15 AM" },
        { id: 4, teacher: "Aman Verma", code: "654", subject: "Science (111)", room: "100", time: "10:15 AM-11:00 AM" }
    ],
    homework: [
        { id: 1, subject: "Social Studies (212)", date: "06/23/2026", submission: "06/30/2026", status: "Pending" },
        { id: 2, subject: "Science (111)", date: "06/17/2026", submission: "06/23/2026", status: "Pending" },
        { id: 3, subject: "Mathematics (110)", date: "06/11/2026", submission: "06/17/2026", status: "Submitted" }
    ],
    teachers: [
        { id: 1, name: "Shivam Verma", code: "9002", isClassTeacher: true },
        { id: 2, name: "Jason Sharlton", code: "90006", isClassTeacher: true },
        { id: 3, name: "Nishant Khare", code: "1002", isClassTeacher: false },
        { id: 4, name: "Aman Verma", code: "654", isClassTeacher: false }
    ],
    visitors: [
        { id: 1, name: "Aman", purpose: "Marketing", date: "06/01/2026" },
        { id: 2, name: "Jaya", purpose: "Parent Teacher Meeting", date: "04/01/2026" },
        { id: 3, name: "Teacher", purpose: "Marketing", date: "04/26/2026" }
    ],
    libraryBooks: [
        { id: 1, no: "5463", title: "चंद गहना से लौटती बेर", author: "Suresh Kumar", issueDate: "04/01/2026", returnDate: "04/01/2026" },
        { id: 2, no: "5632B", title: "Human-environment interactions", author: "Lokesh Mishra", issueDate: "04/01/2026", returnDate: "04/01/2026" },
        { id: 3, no: "657", title: "संसार पुस्तक है", author: "Robert", issueDate: "05/04/2026", returnDate: "05/04/2026" },
        { id: 4, no: "64342", title: "The Little Fir Tree", author: "John", issueDate: "05/04/2026", returnDate: "05/22/2026" },
        { id: 5, no: "42355", title: "Physical and Chemical Changes", author: "Aman Goyal", issueDate: "06/02/2026", returnDate: "06/02/2026" }
    ]
};
