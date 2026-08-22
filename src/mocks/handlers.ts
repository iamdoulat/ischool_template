// @ts-nocheck
import { http, HttpResponse } from 'msw'
import { mockDashboardData } from '@/lib/mock-data'

let mockCaptchaSettings = [
  { id: 1, name: "User Login", alias: "user_login", is_active: true },
  { id: 2, name: "Admin Login", alias: "admin_login", is_active: true },
  { id: 3, name: "Online Admission", alias: "online_admission", is_active: true },
  { id: 4, name: "Student Admission", alias: "student_admission", is_active: true },
  { id: 5, name: "Complain", alias: "complain", is_active: false },
  { id: 6, name: "Forgot Password", alias: "forgot_password", is_active: false },
];

let mockCaptchaConfig = {
  captcha_type: "math",
  recaptcha_version: "v2",
  recaptcha_site_key: "",
  recaptcha_secret_key: "",
  turnstile_site_key: "",
  turnstile_secret_key: "",
  is_active: true,
};

const mockGeneralSettings = {
  school_name: "iSchool Management System",
  school_slogan: "Excellence in Education",
  school_description: "Comprehensive school management system for modern educational institutions",
  school_code: "ISCHOOL",
  address: "123 Education Street, Learning City, LC 12345",
  phone: "+880 185 104 6320",
  email: "admin@ischool.com",
  session: "2026-27",
  session_start_month: "4",
  date_format: "dd/mm/YYYY",
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
  school_name_title_color: "#6366f1",
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
  ],
  contact_form_receiver_email: "admin@ischool.com"
};

export const handlers = [
  // Dashboard endpoint
  http.get('*/api/v1/dashboard', () => {
    return HttpResponse.json(mockDashboardData)
  }),

  // Sessions endpoint
  http.get('*/api/v1/system-setting/sessions', () => {
    return HttpResponse.json({
      success: true,
      data: [
        { id: 1, session: "2025-26", is_active: 1 }
      ]
    })
  }),

  // Sidebar menu endpoint
  http.get('*/api/v1/system-setting/sidebar-menu', () => {
    return HttpResponse.json({
      success: true,
      data: []
    })
  }),
  // Profile endpoint
  http.get('*/api/v1/profile', () => {
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
  http.post('*/api/v1/login', async ({ request }) => {
    let body: any = {};
    try {
      body = await request.json();
    } catch (_) { }
    const email = body.email_or_username || 'superadmin@ischool.com';
    const isSuperAdmin = email.includes('superadmin');
    const isStudent = email.includes('STD') || email.includes('student');
    const isParent = email.includes('PAR') || email.includes('parent');

    const role = isStudent ? 'Student' : isParent ? 'Parent' : isSuperAdmin ? 'superadmin' : 'admin';
    const name = isSuperAdmin ? 'Super Admin' : isStudent ? 'Student User' : isParent ? 'Parent User' : 'Admin User';

    return HttpResponse.json({
      success: true,
      data: {
        access_token: 'mock-token-12345',
        user: {
          id: 1,
          name,
          email,
          role
        }
      }
    })
  }),

  // General settings
  http.get('*/api/v1/system-setting/general-setting', () => {
    return HttpResponse.json({
      status: "Success",
      data: mockGeneralSettings
    })
  }),

  // Save General settings
  http.post('*/api/v1/system-setting/general-setting', async ({ request }) => {
    try {
      const body = await request.json() as Record<string, any>;
      Object.assign(mockGeneralSettings, body);
    } catch (_) { }
    return HttpResponse.json({
      status: "Success",
      success: true,
      message: "General settings updated successfully",
      data: mockGeneralSettings
    })
  }),

  // Front CMS Page by Slug
  http.get('*/api/v1/front-cms/pages/show-by-slug/:slug', ({ params }) => {
    const slug = params.slug;
    return HttpResponse.json({
      status: "Success",
      data: {
        id: 1,
        title: String(slug).replace(/-/g, ' ').toUpperCase(),
        url: slug,
        content: ""
      }
    });
  }),

  // Front CMS Contact Form Submit
  http.post('*/api/v1/front-cms/contact-form/submit', async ({ request }) => {
    let body: any = {};
    try {
      body = await request.json();
    } catch (_) { }

    return HttpResponse.json({
      status: "Success",
      success: true,
      message: "Your message has been sent successfully."
    });
  }),

  // Examination Public List
  http.get('*/api/v1/examination/public/exam-list', () => {
    return HttpResponse.json({
      status: "Success",
      exam_groups: [
        {
          id: 1,
          name: "Annual Examination Group",
          exams: [
            { id: 1, name: "Final Term Examination 2026", session: "2026-27", is_result_published: true },
            { id: 2, name: "Mid Term Assessment 2026", session: "2026-27", is_result_published: false }
          ]
        }
      ]
    });
  }),

  // Examination Public Search
  http.post('*/api/v1/examination/public/search*', async ({ request }) => {
    let body: any = {};
    try {
      body = await request.json();
    } catch (_) { }

    const rollNo = (body.roll_no || body.admission_no || "").trim();
    const examId = Number(body.exam_id);

    // If exam 2 is selected (Unpublished mock exam)
    if (examId === 2) {
      return HttpResponse.json({
        found: false,
        published: false,
        message: "Result Not published Yet."
      });
    }

    if (!rollNo) {
      return HttpResponse.json({
        found: false,
        published: true,
        message: "Please enter your Roll Number."
      });
    }

    return HttpResponse.json({
      found: true,
      published: true,
      exam: {
        id: 1,
        name: "Final Term Examination 2026",
        group: "Annual Examination Group",
        session: "2026-27"
      },
      student: {
        id: 101,
        admission_no: "ADM-" + (rollNo || "202601"),
        roll_no: rollNo || "101",
        name: "Rahim",
        last_name: "Ahmed",
        class_name: "Class 5",
        section_name: "A"
      },
      exam_results: [
        { subject_name: "English", marks: 88, theory_marks: 68, practical_marks: 20, is_absent: false },
        { subject_name: "Mathematics", marks: 94, theory_marks: 74, practical_marks: 20, is_absent: false },
        { subject_name: "General Science", marks: 85, theory_marks: 65, practical_marks: 20, is_absent: false },
        { subject_name: "Social Studies", marks: 78, theory_marks: 58, practical_marks: 20, is_absent: false },
        { subject_name: "Bangla", marks: 91, theory_marks: 71, practical_marks: 20, is_absent: false }
      ]
    });
  }),

  // Notices endpoint
  http.get('*/api/v1/communicate/notices', () => {
    return HttpResponse.json({
      status: "Success",
      data: [
        {
          id: 1,
          title: "Annual Sports Day & Athletics Meet 2026",
          message: "<p>We are delighted to announce that our <strong>Annual Sports Day</strong> will be held on <strong>March 15, 2026</strong>. All students are requested to be present in their respective House Uniforms by 8:00 AM sharp at the main sports complex. Parents and guardians are cordially invited to join and cheer for our young athletes.</p>",
          notice_date: "2026-03-01",
          publish_date: "2026-03-01",
          message_to: "Student, Guardian, Staff",
          is_published: true
        },
        {
          id: 2,
          title: "Final Examination Schedule & Admit Card Distribution",
          message: "<p>The final term examinations will commence from <strong>April 5, 2026</strong>. Admit cards can be collected from the class teachers starting next Monday. Please ensure all library books and administrative dues are settled prior to collection.</p>",
          notice_date: "2026-02-28",
          publish_date: "2026-02-28",
          message_to: "Student, Guardian",
          is_published: true
        },
        {
          id: 3,
          title: "Parent-Teacher Conference (PTC) for Term 1",
          message: "<p>The Parent-Teacher Meeting will be conducted on <strong>Saturday, March 22</strong> between 9:00 AM and 1:00 PM. Parents can discuss academic progress and extracurricular development with the respective subject educators.</p>",
          notice_date: "2026-02-20",
          publish_date: "2026-02-20",
          message_to: "Guardian",
          is_published: true
        },
        {
          id: 4,
          title: "Inter-School STEM & Robotics Exhibition",
          message: "<p>Students from Classes 6 to 12 are invited to register their science models and robotics projects for the upcoming regional STEM championship. Registrations close on March 10 at the science lab coordinator desk.</p>",
          notice_date: "2026-02-15",
          publish_date: "2026-02-15",
          message_to: "Student, Staff",
          is_published: true
        }
      ]
    });
  }),

  // Online Admission settings
  http.get('*/api/v1/system-setting/online-admission', () => {
    return HttpResponse.json({
      success: true,
      data: {
        settings: {
          online_admission: true,
          online_admission_payment_option: true,
          online_admission_form_fees: "100.00",
          instructions: "General Instruction:- These instructions pertain to online application for admission to iSchool...",
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
  http.post('*/api/v1/system-setting/online-admission/settings', async ({ request }) => {
    await request.formData()
    return HttpResponse.json({
      success: true,
      message: 'Settings updated successfully'
    })
  }),

  // Save online admission fields
  http.post('*/api/v1/system-setting/online-admission/fields', async ({ request }) => {
    await request.json().catch(() => ({}));
    return HttpResponse.json({
      success: true,
      message: 'Fields updated successfully'
    })
  }),

  // Captcha Settings (Admin)
  http.get('*/api/v1/system-setting/captcha-settings', () => {
    return HttpResponse.json({
      success: true,
      data: mockCaptchaSettings
    })
  }),

  // Captcha Config (Admin)
  http.get('*/api/v1/system-setting/captcha-settings/config', () => {
    return HttpResponse.json({
      success: true,
      data: mockCaptchaConfig
    })
  }),

  // Save Captcha Config
  http.post('*/api/v1/system-setting/captcha-settings/config', async ({ request }) => {
    const body = await request.json().catch(() => ({}));
    mockCaptchaConfig = { ...mockCaptchaConfig, ...body };
    return HttpResponse.json({
      success: true,
      message: 'Captcha configuration saved successfully',
      data: mockCaptchaConfig
    })
  }),

  // Toggle Captcha Setting
  http.post('*/api/v1/system-setting/captcha-settings/:id/toggle', ({ params }) => {
    const id = Number(params.id);
    const item = mockCaptchaSettings.find(s => s.id === id);
    if (item) {
      item.is_active = !item.is_active;
    }
    return HttpResponse.json({
      success: true,
      message: 'Captcha setting updated successfully',
      data: item
    })
  }),

  // Captcha Public Map (for login and public forms)
  http.get('*/api/v1/system-setting/captcha-settings/public', () => {
    const modulesMap: Record<string, boolean> = {};
    mockCaptchaSettings.forEach(s => {
      modulesMap[s.alias] = s.is_active;
    });
    return HttpResponse.json({
      success: true,
      data: {
        modules: modulesMap,
        captcha_type: mockCaptchaConfig.captcha_type,
        recaptcha_site_key: mockCaptchaConfig.recaptcha_site_key,
        recaptcha_version: mockCaptchaConfig.recaptcha_version,
        turnstile_site_key: mockCaptchaConfig.turnstile_site_key,
      }
    })
  }),

  // Classes endpoint
  http.get('*/api/v1/classes', () => {
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
  http.get('*/api/v1/sections', () => {
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

  // Houses
  http.get('*/api/v1/houses', () => {
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
  http.get('*/api/v1/routes', () => {
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
  http.get('*/api/v1/pickup-points', () => {
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
  http.get('*/api/v1/students/generate-admission-no', () => {
    return HttpResponse.json({
      success: true,
      data: {
        auto_enabled: true,
        admission_no: 'ADM2026001'
      }
    })
  }),

  // Generate username
  http.get('*/api/v1/students/generate-username', () => {
    return HttpResponse.json({
      success: true,
      data: {
        auto_enabled: true,
        username: 'STU0001'
      }
    })
  }),

  // Matching parent username for a selected student
  http.get('*/api/v1/students/:id/matching-parent-username', ({ params }) => {
    const studentId = params.id;
    return HttpResponse.json({
      success: true,
      data: {
        parent_username: `PAR${String(studentId).padStart(4, '0')}`,
      }
    })
  }),

  // Generate parent username
  http.get('*/api/v1/system-setting/users/generate-parent-username', () => {
    return HttpResponse.json({
      success: true,
      data: {
        auto_enabled: true,
        username: 'PAR0001'
      }
    })
  }),

  // Languages endpoint
  http.get('*/api/v1/system-setting/languages', () => {
    return HttpResponse.json({
      success: true,
      data: [
        { id: 1, language: 'English', short_code: 'en', is_active: true, is_rtl: false, is_enabled: true },
        { id: 2, language: 'Spanish', short_code: 'es', is_active: false, is_rtl: false, is_enabled: false }
      ]
    })
  }),

  // Languages translations endpoint
  http.get('*/api/v1/system-setting/languages/translations/:code', () => {
    return HttpResponse.json({
      success: true,
      data: {}
    })
  }),

  // Currencies endpoint
  http.get('*/api/v1/system-setting/currencies', () => {
    return HttpResponse.json({
      status: 'Success',
      data: [
        { id: 1, currency: 'United States Dollar', short_code: 'USD', symbol: '$', rate: 1, is_base: true, is_active: true, is_enabled: true },
        { id: 2, currency: 'Bangladeshi Taka', short_code: 'BDT', symbol: '৳', rate: 110, is_base: false, is_active: false, is_enabled: true },
        { id: 3, currency: 'Indian Rupee', short_code: 'INR', symbol: '₹', rate: 83, is_base: false, is_active: false, is_enabled: true },
        { id: 4, currency: 'United Arab Emirates Dirham', short_code: 'AED', symbol: 'AED', rate: 3.67, is_base: false, is_active: false, is_enabled: true }
      ]
    })
  }),

  // Lesson Plan Report Criteria (classes, sections, subject groups, subjects)
  http.get('*/api/v1/reports/lesson-plan/criteria', () => {
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
  http.get('*/api/v1/reports/lesson-plan/report', ({ request }) => {
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
  http.post('*/api/v1/reports/lesson-plan/syllabus-status', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { class_id?: string };
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
              {
                name: "1 First Day at School", percentage: 100, topics: [
                  { name: "1.1 School Life", status: "Complete", date: "04/10/2025" },
                  { name: "1.2 School Day's", status: "Complete", date: "04/12/2025" },
                  { name: "1.3 Chapter-2", status: "Complete", date: "12/26/2025" },
                ]
              },
              {
                name: "2 The Wind and the Sun", percentage: 100, topics: [
                  { name: "2.1 The Wind", status: "Complete", date: "04/15/2025" },
                ]
              },
              {
                name: "3 Storm in the Garden", percentage: 100, topics: [
                  { name: "3.1 My Garden", status: "Complete", date: "04/25/2025" },
                  { name: "3.2 Chapter 2", status: "Complete", date: "11/20/2025" },
                ]
              },
              {
                name: "4 The Grasshopper and the Ant", percentage: 67, topics: [
                  { name: "4.1 The Ant", status: "Complete", date: "08/20/2025" },
                  { name: "4.2 Chapter 4", status: "Complete", date: "10/25/2025" },
                  { name: "4.3 Chapter-5", status: "Incomplete" },
                ]
              },
            ],
          },
          {
            name: "Hindi (230)", code: "230", percentage: 100,
            lessons: [
              {
                name: "1 पाठ 1", percentage: 100, topics: [
                  { name: "1.1 विषय", status: "Complete", date: "04/11/2025" },
                ]
              },
            ],
          },
          {
            name: "Mathematics (110)", code: "110", percentage: 75,
            lessons: [
              {
                name: "1 Numbers", percentage: 100, topics: [
                  { name: "1.1 Counting", status: "Complete", date: "04/10/2025" },
                  { name: "1.2 Addition", status: "Complete", date: "04/15/2025" },
                ]
              },
              {
                name: "2 Geometry", percentage: 50, topics: [
                  { name: "2.1 Shapes", status: "Complete", date: "05/01/2025" },
                  { name: "2.2 Angles", status: "Incomplete" },
                ]
              },
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
              {
                name: "1 Grammar Basics", percentage: 60, topics: [
                  { name: "1.1 Nouns", status: "Complete", date: "04/12/2025" },
                  { name: "1.2 Verbs", status: "Complete", date: "04/20/2025" },
                  { name: "1.3 Adjectives", status: "Incomplete" },
                ]
              },
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
  http.get('*/api/v1/student-cv/criteria', () => {
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

  // CV Settings (field toggles)
  http.get('*/api/v1/student-cv/settings', () => {
    return HttpResponse.json({
      success: true,
      data: [
        { id: 1, name: 'Date Of Birth', tab: 'cv_fields', is_active: true },
        { id: 2, name: 'Gender', tab: 'cv_fields', is_active: true },
        { id: 3, name: 'Category', tab: 'cv_fields', is_active: true },
        { id: 4, name: 'Religion', tab: 'cv_fields', is_active: true },
        { id: 5, name: 'Caste', tab: 'cv_fields', is_active: true },
        { id: 6, name: 'Blood Group', tab: 'cv_fields', is_active: true },
        { id: 7, name: 'Height', tab: 'cv_fields', is_active: false },
        { id: 8, name: 'Weight', tab: 'cv_fields', is_active: false },
        { id: 9, name: 'National Identification No', tab: 'cv_fields', is_active: false },
        { id: 10, name: 'Local Identification No', tab: 'cv_fields', is_active: false },
        { id: 11, name: 'Father Name', tab: 'cv_other_fields', is_active: true },
        { id: 12, name: 'Mother Name', tab: 'cv_other_fields', is_active: true },
        { id: 13, name: 'Father Occupation', tab: 'cv_other_fields', is_active: true },
        { id: 14, name: 'Mother Occupation', tab: 'cv_other_fields', is_active: true },
        { id: 15, name: 'Father Phone', tab: 'cv_other_fields', is_active: true },
        { id: 16, name: 'Mother Phone', tab: 'cv_other_fields', is_active: true },
        { id: 17, name: 'Guardian Name', tab: 'cv_other_fields', is_active: true },
        { id: 18, name: 'Guardian Relation', tab: 'cv_other_fields', is_active: false },
        { id: 19, name: 'Guardian Phone', tab: 'cv_other_fields', is_active: true },
        { id: 20, name: 'Guardian Email', tab: 'cv_other_fields', is_active: false },
        { id: 21, name: 'Student Login', tab: 'student_panel_cv_setting', is_active: true },
        { id: 22, name: 'Download CV', tab: 'student_panel_cv_setting', is_active: true },
      ],
    });
  }),

  // Toggle a CV setting
  http.post('*/api/v1/student-cv/settings/toggle', async ({ request }) => {
    await request.json().catch(() => ({}));
    return HttpResponse.json({ success: true, message: 'Setting updated' });
  }),

  // ── Track application status ────────────────────────────────────────────────

  // Track application status
  http.get('*/api/v1/online-admissions/track/:referenceNo', ({ params }) => {
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
  }),

  // Request book return
  http.post('*/api/v1/user/library/books-issued/:id/request-return', async () => {
    return HttpResponse.json({
      status: 'success',
      message: 'Return request submitted successfully',
    });
  }),

  // Cancel book return
  http.post('*/api/v1/user/library/books-issued/:id/cancel-return', async () => {
    return HttpResponse.json({
      status: 'success',
      message: 'Return request cancelled successfully',
    });
  }),

  // Admin return book
  http.put('*/api/v1/library/book-issues/:id/return', async () => {
    return HttpResponse.json({
      status: 'success',
      message: 'Book returned successfully',
    });
  })
]
