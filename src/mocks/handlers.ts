// @ts-nocheck
import { http, HttpResponse } from 'msw'

export const handlers = [
  // Profile endpoint
  http.get('/api/v1/profile', () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: 1,
        name: 'Admin User',
        email: 'admin@ischool.com',
        role: 'admin',
        avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=6366f1&color=fff&size=200',
        permissions: ['all']
      }
    })
  }),

  // Login endpoint
  http.post('/api/v1/login', async ({ request }) => {
    return HttpResponse.json({
      success: true,
      data: {
        access_token: 'mock-token-12345',
        user: {
          id: 1,
          name: 'Admin User',
          email: 'admin@ischool.com',
          role: 'admin'
        }
      }
    })
  }),

  // General settings
  http.get('/api/v1/system-setting/general-setting', () => {
    return HttpResponse.json({
      status: "Success",
      data: {
        school_name: "iSchool Management System",
        school_slogan: "Excellence in Education",
        school_description: "Comprehensive school management system for modern educational institutions",
        school_code: "ISCHOOL",
        address: "123 Education Street, Learning City, LC 12345",
        phone: "+1 234 567 890",
        email: "admin@ischool.com",
        session: "2026",
        session_start_month: "4",
        date_format: "d/m/Y",
        timezone: "UTC",
        start_day_of_week: "monday",
        time_format: "12",
        currency_format: "USD",
        base_url: "http://localhost:3000",
        file_upload_path: "uploads/",
        print_logo: "/logo-print.png",
        admin_logo: "/logo-admin.png",
        admin_small_logo: "/logo-admin-small.png",
        app_logo: "/logo-app.png",
        login_page_background_admin: "/bg-admin.jpg",
        login_page_background_user: "/bg-user.jpg",
        theme_mode: "light",
        skins: "default",
        side_menu: "default",
        primary_color: "#3b82f6",
        box_content: "default",
        mobile_api_url: "http://localhost:3000/api",
        mobile_primary_color: "#3b82f6",
        mobile_secondary_color: "#64748b",
        student_login: true,
        parent_login: true,
        student_login_admission_no: true,
        student_login_mobile_no: true,
        student_login_email: true,
        parent_login_mobile_no: true,
        parent_login_email: true,
        allow_student_to_add_timeline: true,
        attendance_type: "day_wise",
        biometric_attendance: false,
        devices: "",
        low_attendance_limit: "75",
        staff_attendance_settings: [
          { type: "Present", from: "0", upto: "100", total: "100" }
        ],
        student_attendance_settings: [
          { type: "Present", from: "0", upto: "100", total: "100" }
        ]
      }
    })
  }),

  // Online Admission settings
  http.get('/api/v1/system-setting/online-admission', () => {
    return HttpResponse.json({
      success: true,
      data: {
        settings: {
          online_admission: true,
          online_admission_payment_option: true,
          online_admission_form_fees: "100.00",
          instructions: "General Instruction:- These instructions pertain to online application for admission to Smart School...",
          terms_conditions: "General Terms & Conditions for Students:- 1. The User declares that the content of the Portal shall be accessed...",
          admission_form_file_name: null
        },
        fields: [
          { id: 1, name: "Last Name", is_active: true },
          { id: 2, name: "Category", is_active: true },
          { id: 3, name: "Religion", is_active: true },
          { id: 4, name: "Caste", is_active: true },
          { id: 5, name: "Mobile Number", is_active: true },
          { id: 6, name: "Email", is_active: true },
          { id: 7, name: "Student Photo", is_active: true },
          { id: 8, name: "House", is_active: true },
          { id: 9, name: "Blood Group", is_active: true },
          { id: 10, name: "Height", is_active: true },
          { id: 11, name: "Weight", is_active: true },
          { id: 12, name: "Measurement Date", is_active: true },
          { id: 13, name: "Father Name", is_active: true },
          { id: 14, name: "Father Phone", is_active: true },
          { id: 15, name: "Father Occupation", is_active: true },
          { id: 16, name: "Father Photo", is_active: true },
          { id: 17, name: "Mother Name", is_active: true },
          { id: 18, name: "Mother Phone", is_active: true },
          { id: 19, name: "Mother Occupation", is_active: true },
          { id: 20, name: "Mother Photo", is_active: true },
          { id: 21, name: "If Guardian Is", is_active: true },
          { id: 22, name: "Guardian Name", is_active: true },
          { id: 23, name: "Guardian Relation", is_active: true },
        ]
      }
    })
  }),

  // Save online admission settings
  http.post('/api/v1/system-setting/online-admission/settings', async ({ request }) => {
    const formData = await request.formData()
    return HttpResponse.json({
      success: true,
      message: 'Settings updated successfully'
    })
  }),

  // Save online admission fields
  http.post('*/api/v1/system-setting/online-admission/fields', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      success: true,
      message: 'Fields updated successfully'
    })
  }),

  // Classes endpoint
  http.get('/api/v1/classes', () => {
    return HttpResponse.json({
      success: true,
      data: {
        data: [
          { id: 1, name: 'Class 1' },
          { id: 2, name: 'Class 2' },
          { id: 3, name: 'Class 3' },
          { id: 4, name: 'Class 4' },
          { id: 5, name: 'Class 5' },
          { id: 6, name: 'Class 6' },
          { id: 7, name: 'Class 7' },
          { id: 8, name: 'Class 8' },
          { id: 9, name: 'Class 9' },
          { id: 10, name: 'Class 10' }
        ]
      }
    })
  }),

  // Sections endpoint
  http.get('/api/v1/sections', () => {
    return HttpResponse.json({
      success: true,
      data: {
        data: [
          { id: 1, name: 'A' },
          { id: 2, name: 'B' },
          { id: 3, name: 'C' },
          { id: 4, name: 'D' }
        ]
      }
    })
  }),

  // Academics Classes endpoint (used by User management modals)
  http.get('/api/v1/academics/classes', () => {
    return HttpResponse.json({
      success: true,
      data: [
        { id: 1, name: 'Class 1', sections: [{ id: 1, name: 'A' }, { id: 2, name: 'B' }] },
        { id: 2, name: 'Class 2', sections: [{ id: 3, name: 'A' }, { id: 4, name: 'B' }] },
        { id: 3, name: 'Class 3', sections: [{ id: 5, name: 'A' }, { id: 6, name: 'B' }] },
        { id: 4, name: 'Class 4', sections: [{ id: 7, name: 'A' }, { id: 8, name: 'B' }] },
        { id: 5, name: 'Class 5', sections: [{ id: 9, name: 'A' }, { id: 10, name: 'B' }] },
      ]
    })
  }),

  // Academics Sections endpoint
  http.get('/api/v1/academics/sections', ({ request }) => {
    const url = new URL(request.url);
    const classId = url.searchParams.get('school_class_id');
    const allSections: Record<string, { id: number; name: string }[]> = {
      '1': [{ id: 1, name: 'A' }, { id: 2, name: 'B' }],
      '2': [{ id: 3, name: 'A' }, { id: 4, name: 'B' }],
      '3': [{ id: 5, name: 'A' }, { id: 6, name: 'B' }],
      '4': [{ id: 7, name: 'A' }, { id: 8, name: 'B' }],
      '5': [{ id: 9, name: 'A' }, { id: 10, name: 'B' }],
    };
    return HttpResponse.json({
      success: true,
      data: (classId && allSections[classId]) || []
    })
  }),

  // Student categories
  http.get('/api/v1/student-categories', () => {
    return HttpResponse.json({
      success: true,
      data: {
        data: [
          { id: 1, name: 'General' },
          { id: 2, name: 'SC' },
          { id: 3, name: 'ST' },
          { id: 4, name: 'OBC' }
        ]
      }
    })
  }),

  // Houses
  http.get('/api/v1/houses', () => {
    return HttpResponse.json({
      success: true,
      data: {
        data: [
          { id: 1, name: 'Red' },
          { id: 2, name: 'Blue' },
          { id: 3, name: 'Green' },
          { id: 4, name: 'Yellow' }
        ]
      }
    })
  }),

  // Routes
  http.get('/api/v1/routes', () => {
    return HttpResponse.json({
      success: true,
      data: {
        data: [
          { id: 1, title: 'Route 1' },
          { id: 2, title: 'Route 2' }
        ]
      }
    })
  }),

  // Pickup points
  http.get('/api/v1/pickup-points', () => {
    return HttpResponse.json({
      success: true,
      data: {
        data: [
          { id: 1, title: 'Point A' },
          { id: 2, title: 'Point B' }
        ]
      }
    })
  }),

  // Generate admission number
  http.get('/api/v1/students/generate-admission-no', () => {
    return HttpResponse.json({
      success: true,
      data: {
        auto_enabled: true,
        admission_no: 'ADM2026001'
      }
    })
  }),

  // Generate username
  http.get('/api/v1/students/generate-username', () => {
    return HttpResponse.json({
      success: true,
      data: {
        auto_enabled: true,
        username: 'STU0001'
      }
    })
  }),

  // Matching parent username for a selected student
  http.get('/api/v1/students/:id/matching-parent-username', ({ params }) => {
    const studentId = params.id;
    return HttpResponse.json({
      success: true,
      data: {
        parent_username: `PAR${String(studentId).padStart(4, '0')}`,
      }
    })
  }),

  // Generate parent username
  http.get('/api/v1/system-setting/users/generate-parent-username', () => {
    return HttpResponse.json({
      success: true,
      data: {
        auto_enabled: true,
        username: 'PAR0001'
      }
    })
  }),

  // Languages endpoint
  http.get('/api/v1/system-setting/languages', () => {
    return HttpResponse.json({
      success: true,
      data: [
        { id: 1, language: 'English', short_code: 'en', is_active: true, is_rtl: false, is_enabled: true },
        { id: 2, language: 'Spanish', short_code: 'es', is_active: false, is_rtl: false, is_enabled: false }
      ]
    })
  }),

  // Languages translations endpoint
  http.get('/api/v1/system-setting/languages/translations/:code', () => {
    return HttpResponse.json({
      success: true,
      data: {}
    })
  }),

  // Currencies endpoint
  http.get('/api/v1/system-setting/currencies', () => {
    return HttpResponse.json({
      status: 'Success',
      data: [
        { id: 1, currency: 'USD', short_code: 'USD', symbol: '$', rate: 1, is_base: true, is_active: true, is_enabled: true },
        { id: 2, currency: 'EUR', short_code: 'EUR', symbol: '€', rate: 0.85, is_base: false, is_active: false, is_enabled: true }
      ]
    })
  }),

  // Classes endpoint
  http.get('/api/v1/classes', () => {
    return HttpResponse.json({
      success: true,
      data: {
        data: [
          { id: 1, name: 'Class 1' },
          { id: 2, name: 'Class 2' },
          { id: 3, name: 'Class 3' },
          { id: 4, name: 'Class 4' },
          { id: 5, name: 'Class 5' }
        ]
      }
    })
  }),

  // Sections endpoint
  http.get('/api/v1/sections', () => {
    return HttpResponse.json({
      success: true,
      data: {
        data: [
          { id: 1, name: 'A' },
          { id: 2, name: 'B' },
          { id: 3, name: 'C' }
        ]
      }
    })
  }),

  // Lesson Plan Report Criteria (classes, sections, subject groups, subjects)
  http.get('/api/v1/reports/lesson-plan/criteria', () => {
    return HttpResponse.json({
      classes: [
        {
          id: "1", name: "Class 1",
          sections: [{ id: "1", name: "A" }, { id: "2", name: "B" }, { id: "3", name: "C" }],
          subject_groups: [
            {
              id: "1", name: "Class 1st Subject Group",
              subjects: [
                { id: "1", name: "English", code: "210" },
                { id: "2", name: "Hindi", code: "230" },
                { id: "3", name: "Mathematics", code: "110" },
                { id: "4", name: "Science", code: "111" },
                { id: "5", name: "Drawing", code: "200" },
                { id: "6", name: "Computer", code: "00220" },
                { id: "7", name: "Elective 1", code: "101" },
              ],
            },
          ],
        },
        {
          id: "2", name: "Class 2",
          sections: [{ id: "4", name: "A" }, { id: "5", name: "B" }],
          subject_groups: [
            {
              id: "2", name: "Class 2nd Subject Group",
              subjects: [
                { id: "8", name: "English", code: "220" },
                { id: "9", name: "Hindi", code: "240" },
                { id: "10", name: "Mathematics", code: "120" },
              ],
            },
          ],
        },
        {
          id: "3", name: "Class 3",
          sections: [{ id: "6", name: "A" }, { id: "7", name: "B" }, { id: "8", name: "C" }],
          subject_groups: [
            {
              id: "3", name: "Class 3rd Subject Group",
              subjects: [
                { id: "11", name: "English", code: "310" },
                { id: "12", name: "Mathematics", code: "320" },
              ],
            },
          ],
        },
      ],
    });
  }),

  // Subject Lesson Plan Report
  http.get('/api/v1/reports/lesson-plan/report', ({ request }) => {
    const url = new URL(request.url);
    const classId = url.searchParams.get('school_class_id');

    interface ReportEntry {
      teacher_name: string;
      lesson_name: string;
      topic_name: string;
      sub_topic: string;
      date: string;
      time_from: string;
      time_to: string;
    }

    const mockReports: Record<string, ReportEntry[]> = {
      "1": [
        { teacher_name: "John Teacher", lesson_name: "First Day at School", topic_name: "School Life", sub_topic: "Introduction", date: "04/10/2025", time_from: "09:00 AM", time_to: "09:45 AM" },
        { teacher_name: "John Teacher", lesson_name: "First Day at School", topic_name: "School Day's", sub_topic: "Daily Routine", date: "04/12/2025", time_from: "09:00 AM", time_to: "09:45 AM" },
        { teacher_name: "Jane Teacher", lesson_name: "Numbers", topic_name: "Counting", sub_topic: "1-100", date: "04/10/2025", time_from: "10:00 AM", time_to: "10:45 AM" },
      ],
      "2": [
        { teacher_name: "Robert Teacher", lesson_name: "Grammar Basics", topic_name: "Nouns", sub_topic: "Common Nouns", date: "04/12/2025", time_from: "09:00 AM", time_to: "09:45 AM" },
      ],
    };

    return HttpResponse.json({ data: mockReports[classId || ""] || [] });
  }),

  // Syllabus Status Report
  http.post('/api/v1/reports/lesson-plan/syllabus-status', async ({ request }) => {
    const body = await request.json() as { class_id?: string };
    const classId = body.class_id;

    interface SyllabusEntry {
      subject: string;
      percentage: number;
    }

    interface TopicEntry {
      name: string;
      status: string;
      date?: string;
    }

    interface LessonEntry {
      name: string;
      percentage: number;
      topics: TopicEntry[];
    }

    interface SubjectLessonEntry {
      name: string;
      code: string;
      percentage: number;
      lessons: LessonEntry[];
    }

    interface ClassSyllabusData {
      syllabus: SyllabusEntry[];
      lessons: SubjectLessonEntry[];
    }

    const mockData: Record<string, ClassSyllabusData> = {
      "1": {
        syllabus: [
          { subject: "English (210)", percentage: 37 },
          { subject: "Hindi (230)", percentage: 100 },
          { subject: "Mathematics (110)", percentage: 75 },
          { subject: "Science (111)", percentage: 67 },
          { subject: "Drawing (200)", percentage: 100 },
          { subject: "Computer (00220)", percentage: 87 },
          { subject: "Elective 1 (101)", percentage: 50 },
        ],
        lessons: [
          {
            name: "English (210)", code: "210", percentage: 37,
            lessons: [
              { name: "1 First Day at School", percentage: 100, topics: [
                { name: "1.1 School Life", status: "Complete", date: "04/10/2025" },
                { name: "1.2 School Day's", status: "Complete", date: "04/12/2025" },
                { name: "1.3 Chapter-2", status: "Complete", date: "12/26/2025" },
              ]},
              { name: "2 The Wind and the Sun", percentage: 100, topics: [
                { name: "2.1 The Wind", status: "Complete", date: "04/15/2025" },
              ]},
              { name: "3 Storm in the Garden", percentage: 100, topics: [
                { name: "3.1 My Garden", status: "Complete", date: "04/25/2025" },
                { name: "3.2 Chapter 2", status: "Complete", date: "11/20/2025" },
              ]},
              { name: "4 The Grasshopper and the Ant", percentage: 67, topics: [
                { name: "4.1 The Ant", status: "Complete", date: "08/20/2025" },
                { name: "4.2 Chapter 4", status: "Complete", date: "10/25/2025" },
                { name: "4.3 Chapter-5", status: "Incomplete" },
              ]},
            ],
          },
          {
            name: "Hindi (230)", code: "230", percentage: 100,
            lessons: [
              { name: "1 पाठ 1", percentage: 100, topics: [
                { name: "1.1 विषय", status: "Complete", date: "04/11/2025" },
              ]},
            ],
          },
          {
            name: "Mathematics (110)", code: "110", percentage: 75,
            lessons: [
              { name: "1 Numbers", percentage: 100, topics: [
                { name: "1.1 Counting", status: "Complete", date: "04/10/2025" },
                { name: "1.2 Addition", status: "Complete", date: "04/15/2025" },
              ]},
              { name: "2 Geometry", percentage: 50, topics: [
                { name: "2.1 Shapes", status: "Complete", date: "05/01/2025" },
                { name: "2.2 Angles", status: "Incomplete" },
              ]},
            ],
          },
        ],
      },
      "2": {
        syllabus: [
          { subject: "English (220)", percentage: 60 },
          { subject: "Hindi (240)", percentage: 80 },
          { subject: "Mathematics (120)", percentage: 45 },
        ],
        lessons: [
          {
            name: "English (220)", code: "220", percentage: 60,
            lessons: [
              { name: "1 Grammar Basics", percentage: 60, topics: [
                { name: "1.1 Nouns", status: "Complete", date: "04/12/2025" },
                { name: "1.2 Verbs", status: "Complete", date: "04/20/2025" },
                { name: "1.3 Adjectives", status: "Incomplete" },
              ]},
            ],
          },
        ],
      },
    };

    const result = mockData[classId] || mockData["1"];

    return HttpResponse.json({ success: true, ...result });
  }),

  // ── Student CV ─────────────────────────────────────────────────────────────

  // Criteria: classes with nested sections
  http.get('/api/v1/student-cv/criteria', () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: 1, name: 'Class 1',
          sections: [
            { id: 1, name: 'A' },
            { id: 2, name: 'B' },
            { id: 3, name: 'C' },
          ],
        },
        {
          id: 2, name: 'Class 2',
          sections: [
            { id: 4, name: 'A' },
            { id: 5, name: 'B' },
          ],
        },
        {
          id: 3, name: 'Class 3',
          sections: [
            { id: 6, name: 'A' },
            { id: 7, name: 'B' },
          ],
        },
        {
          id: 4, name: 'Class 4',
          sections: [
            { id: 8, name: 'A' },
          ],
        },
        {
          id: 5, name: 'Class 5',
          sections: [
            { id: 9, name: 'A' },
            { id: 10, name: 'B' },
          ],
        },
      ],
    });
  }),

  // Students endpoint (used by User management modals)
  http.get('/api/v1/students', ({ request }) => {
    const url = new URL(request.url);
    const classId = url.searchParams.get('school_class_id');
    const sectionId = url.searchParams.get('section_id');

    const allStudents = [
      { id: 1, admission_no: 'ADM2026001', name: 'Sneha', last_name: 'Patel', school_class_id: 1, section_id: 1 },
      { id: 2, admission_no: 'ADM2026002', name: 'Rahul', last_name: 'Sharma', school_class_id: 1, section_id: 1 },
      { id: 3, admission_no: 'ADM2026003', name: 'Priya', last_name: 'Singh', school_class_id: 1, section_id: 2 },
      { id: 4, admission_no: 'ADM2026004', name: 'Amit', last_name: 'Kumar', school_class_id: 1, section_id: 1 },
      { id: 5, admission_no: 'ADM2026005', name: 'Kavya', last_name: 'Reddy', school_class_id: 2, section_id: 4 },
      { id: 6, admission_no: 'ADM2026006', name: 'Arjun', last_name: 'Mehta', school_class_id: 2, section_id: 4 },
    ];

    const filtered = allStudents.filter(s =>
      (!classId   || String(s.school_class_id) === classId) &&
      (!sectionId || String(s.section_id) === sectionId)
    );

    return HttpResponse.json({
      success: true,
      data: {
        data: filtered,
        current_page: 1,
        last_page: 1,
        total: filtered.length,
      }
    })
  }),

  // Students list by class & section
  http.get('/api/v1/student-cv/students', ({ request }) => {
    const url = new URL(request.url);
    const classId = url.searchParams.get('school_class_id');
    const sectionId = url.searchParams.get('section_id');

    const allStudents = [
      {
        id: '1', admission_no: 'ADM2026001', name: 'Sneha Patel',
        dob: '2016-07-15', gender: 'Female',
        student_category: { category_name: 'OBC' },
        phone: '9876200001', class_id: '1', section_id: '1',
      },
      {
        id: '2', admission_no: 'ADM2026002', name: 'Rahul Sharma',
        dob: '2016-03-22', gender: 'Male',
        student_category: { category_name: 'General' },
        phone: '9876200002', class_id: '1', section_id: '1',
      },
      {
        id: '3', admission_no: 'ADM2026003', name: 'Priya Singh',
        dob: '2016-11-08', gender: 'Female',
        student_category: { category_name: 'SC' },
        phone: '9876200003', class_id: '1', section_id: '2',
      },
      {
        id: '4', admission_no: 'ADM2026004', name: 'Amit Kumar',
        dob: '2016-05-18', gender: 'Male',
        student_category: { category_name: 'General' },
        phone: '9876200004', class_id: '1', section_id: '1',
      },
      {
        id: '5', admission_no: 'ADM2026005', name: 'Kavya Reddy',
        dob: '2016-09-30', gender: 'Female',
        student_category: { category_name: 'ST' },
        phone: '9876200005', class_id: '2', section_id: '4',
      },
      {
        id: '6', admission_no: 'ADM2026006', name: 'Arjun Mehta',
        dob: '2016-01-14', gender: 'Male',
        student_category: { category_name: 'OBC' },
        phone: '9876200006', class_id: '2', section_id: '4',
      },
    ];

    const filtered = allStudents.filter(s =>
      (!classId   || s.class_id   === classId) &&
      (!sectionId || s.section_id === sectionId)
    );

    return HttpResponse.json({ success: true, data: filtered });
  }),

  // Full student CV detail by ID
  http.get('/api/v1/student-cv/detail/:id', ({ params }) => {
    const id = params.id as string;

    const details: Record<string, object> = {
      '1': {
        id: '1', admission_no: 'ADM2026001', name: 'Sneha Patel',
        dob: '2016-07-15', gender: 'Female',
        student_category: { category_name: 'OBC' },
        phone: '9876200001', email: 'sneha.patel@gmail.com',
        address: '12 Rose Lane, Mumbai, MH 400001',
        category: 'OBC', religion: 'Hindu', caste: 'OBC',
        blood_group: 'A+', height: '4.2 ft', weight: '32 kg',
        national_id: '', local_id: '',
        father_name: 'Ramesh Patel',   mother_name: 'Kavita Patel',
        father_occupation: 'Service',  mother_occupation: 'Teacher',
        father_phone: '9876200002',    mother_phone: '9876200003',
        guardian_name: 'Ramesh',       guardian_relation: 'Father',
        guardian_phone: '787863476',   guardian_email: '',
        guardian_occupation: '',       guardian_address: '',
      },
      '2': {
        id: '2', admission_no: 'ADM2026002', name: 'Rahul Sharma',
        dob: '2016-03-22', gender: 'Male',
        student_category: { category_name: 'General' },
        phone: '9876200002', email: 'rahul.sharma@gmail.com',
        address: '45 MG Road, Delhi, DL 110001',
        category: 'General', religion: 'Hindu', caste: 'Brahmin',
        blood_group: 'B+', height: '4.5 ft', weight: '35 kg',
        national_id: '', local_id: '',
        father_name: 'Vijay Sharma',    mother_name: 'Sunita Sharma',
        father_occupation: 'Engineer',  mother_occupation: 'Homemaker',
        father_phone: '9876200010',     mother_phone: '9876200011',
        guardian_name: 'Vijay Sharma',  guardian_relation: 'Father',
        guardian_phone: '9876200010',   guardian_email: 'vijay@gmail.com',
        guardian_occupation: 'Engineer', guardian_address: '45 MG Road, Delhi',
      },
      '3': {
        id: '3', admission_no: 'ADM2026003', name: 'Priya Singh',
        dob: '2016-11-08', gender: 'Female',
        student_category: { category_name: 'SC' },
        phone: '9876200003', email: 'priya.singh@gmail.com',
        address: '78 Park Street, Kolkata, WB 700001',
        category: 'SC', religion: 'Hindu', caste: 'SC',
        blood_group: 'O+', height: '4.1 ft', weight: '30 kg',
        national_id: '', local_id: '',
        father_name: 'Ravi Singh',     mother_name: 'Meena Singh',
        father_occupation: 'Farmer',   mother_occupation: 'Nurse',
        father_phone: '9876200020',    mother_phone: '9876200021',
        guardian_name: 'Ravi Singh',   guardian_relation: 'Father',
        guardian_phone: '9876200020',  guardian_email: '',
        guardian_occupation: 'Farmer', guardian_address: '78 Park Street',
      },
      '4': {
        id: '4', admission_no: 'ADM2026004', name: 'Amit Kumar',
        dob: '2016-05-18', gender: 'Male',
        student_category: { category_name: 'General' },
        phone: '9876200004', email: 'amit.kumar@gmail.com',
        address: '23 Lake View, Pune, MH 411001',
        category: 'General', religion: 'Hindu', caste: 'Kayastha',
        blood_group: 'AB+', height: '4.3 ft', weight: '33 kg',
        national_id: '', local_id: '',
        father_name: 'Suresh Kumar',    mother_name: 'Radha Kumar',
        father_occupation: 'Business',  mother_occupation: 'Doctor',
        father_phone: '9876200030',     mother_phone: '9876200031',
        guardian_name: 'Suresh Kumar',  guardian_relation: 'Father',
        guardian_phone: '9876200030',   guardian_email: 'suresh@gmail.com',
        guardian_occupation: 'Business', guardian_address: '23 Lake View, Pune',
      },
      '5': {
        id: '5', admission_no: 'ADM2026005', name: 'Kavya Reddy',
        dob: '2016-09-30', gender: 'Female',
        student_category: { category_name: 'ST' },
        phone: '9876200005', email: 'kavya.reddy@gmail.com',
        address: '56 Hill Road, Hyderabad, TS 500001',
        category: 'ST', religion: 'Hindu', caste: 'ST',
        blood_group: 'A-', height: '4.0 ft', weight: '28 kg',
        national_id: '', local_id: '',
        father_name: 'Krishna Reddy',  mother_name: 'Lakshmi Reddy',
        father_occupation: 'Farmer',   mother_occupation: 'Homemaker',
        father_phone: '9876200040',    mother_phone: '9876200041',
        guardian_name: 'Krishna Reddy', guardian_relation: 'Father',
        guardian_phone: '9876200040',   guardian_email: '',
        guardian_occupation: 'Farmer',  guardian_address: '56 Hill Road',
      },
      '6': {
        id: '6', admission_no: 'ADM2026006', name: 'Arjun Mehta',
        dob: '2016-01-14', gender: 'Male',
        student_category: { category_name: 'OBC' },
        phone: '9876200006', email: 'arjun.mehta@gmail.com',
        address: '90 River Side, Ahmedabad, GJ 380001',
        category: 'OBC', religion: 'Hindu', caste: 'OBC',
        blood_group: 'B-', height: '4.4 ft', weight: '34 kg',
        national_id: '', local_id: '',
        father_name: 'Deepak Mehta',   mother_name: 'Pooja Mehta',
        father_occupation: 'Trader',   mother_occupation: 'Teacher',
        father_phone: '9876200050',    mother_phone: '9876200051',
        guardian_name: 'Deepak Mehta', guardian_relation: 'Father',
        guardian_phone: '9876200050',  guardian_email: 'deepak@gmail.com',
        guardian_occupation: 'Trader', guardian_address: '90 River Side',
      },
    };

    const detail = details[id];
    if (!detail) {
      return HttpResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    }
    return HttpResponse.json({ success: true, data: detail });
  }),

  // CV Settings (field toggles)
  http.get('/api/v1/student-cv/settings', () => {
    return HttpResponse.json({
      success: true,
      data: [
        { id: 1,  name: 'Date Of Birth',               tab: 'cv_fields',                  is_active: true  },
        { id: 2,  name: 'Gender',                       tab: 'cv_fields',                  is_active: true  },
        { id: 3,  name: 'Category',                     tab: 'cv_fields',                  is_active: true  },
        { id: 4,  name: 'Religion',                     tab: 'cv_fields',                  is_active: true  },
        { id: 5,  name: 'Caste',                        tab: 'cv_fields',                  is_active: true  },
        { id: 6,  name: 'Blood Group',                  tab: 'cv_fields',                  is_active: true  },
        { id: 7,  name: 'Height',                       tab: 'cv_fields',                  is_active: false },
        { id: 8,  name: 'Weight',                       tab: 'cv_fields',                  is_active: false },
        { id: 9,  name: 'National Identification No',  tab: 'cv_fields',                  is_active: false },
        { id: 10, name: 'Local Identification No',     tab: 'cv_fields',                  is_active: false },
        { id: 11, name: 'Father Name',                  tab: 'cv_other_fields',            is_active: true  },
        { id: 12, name: 'Mother Name',                  tab: 'cv_other_fields',            is_active: true  },
        { id: 13, name: 'Father Occupation',            tab: 'cv_other_fields',            is_active: true  },
        { id: 14, name: 'Mother Occupation',            tab: 'cv_other_fields',            is_active: true  },
        { id: 15, name: 'Father Phone',                 tab: 'cv_other_fields',            is_active: true  },
        { id: 16, name: 'Mother Phone',                 tab: 'cv_other_fields',            is_active: true  },
        { id: 17, name: 'Guardian Name',                tab: 'cv_other_fields',            is_active: true  },
        { id: 18, name: 'Guardian Relation',            tab: 'cv_other_fields',            is_active: false },
        { id: 19, name: 'Guardian Phone',               tab: 'cv_other_fields',            is_active: true  },
        { id: 20, name: 'Guardian Email',               tab: 'cv_other_fields',            is_active: false },
        { id: 21, name: 'Student Login',                tab: 'student_panel_cv_setting',   is_active: true  },
        { id: 22, name: 'Download CV',                  tab: 'student_panel_cv_setting',   is_active: true  },
      ],
    });
  }),

  // Toggle a CV setting
  http.post('/api/v1/student-cv/settings/toggle', async ({ request }) => {
    await request.json();
    return HttpResponse.json({ success: true, message: 'Setting updated' });
  }),

  // ── Track application status ────────────────────────────────────────────────

  // Track application status
  http.get('/api/v1/online-admissions/track/:referenceNo', ({ params }) => {
    const referenceNo = params.referenceNo as string;

    // Mock data for demonstration
    const mockApplications = {
      'ADM2026001': {
        id: 1,
        reference_no: 'ADM2026001',
        first_name: 'John',
        last_name: 'Doe',
        form_status: 'Submitted',
        payment_status: 'Paid',
        created_at: '2026-04-25T10:00:00Z'
      },
      'ADM2026002': {
        id: 2,
        reference_no: 'ADM2026002',
        first_name: 'Jane',
        last_name: 'Smith',
        form_status: 'Enrolled',
        payment_status: 'Paid',
        created_at: '2026-04-20T14:30:00Z'
      },
      'ADM2026003': {
        id: 3,
        reference_no: 'ADM2026003',
        first_name: 'Bob',
        last_name: 'Johnson',
        form_status: 'Submitted',
        payment_status: 'Pending',
        created_at: '2026-04-22T09:15:00Z'
      }
    };

    const application = mockApplications[referenceNo as keyof typeof mockApplications];

    if (application) {
      return HttpResponse.json({
        success: true,
        data: application
      });
    } else {
      return HttpResponse.json({
        success: false,
        message: 'Application not found'
      }, { status: 404 });
    }
  })
]
