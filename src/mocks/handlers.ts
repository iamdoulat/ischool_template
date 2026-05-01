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
        avatar: null
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

  // Hostels
  http.get('/api/v1/hostels', () => {
    return HttpResponse.json({
      success: true,
      data: {
        data: [
          { id: 1, name: 'Hostel A' },
          { id: 2, name: 'Hostel B' }
        ]
      }
    })
  }),

  // Rooms
  http.get('/api/v1/rooms', () => {
    return HttpResponse.json({
      success: true,
      data: {
        data: [
          { id: 1, name: 'Room 101' },
          { id: 2, name: 'Room 102' }
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

  // Profile endpoint
  http.get('/api/v1/profile', () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: 1,
        name: 'Admin User',
        email: 'admin@ischool.com',
        role: 'admin',
        avatar: null
      }
    })
  }),

  // Languages endpoint
  http.get('/api/v1/system-setting/languages', () => {
    return HttpResponse.json({
      success: true,
      data: [
        { id: 1, language: 'English', short_code: 'en', is_active: true, is_rtl: false },
        { id: 2, language: 'Spanish', short_code: 'es', is_active: false, is_rtl: false }
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