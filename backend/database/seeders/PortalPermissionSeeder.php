<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

/**
 * Seeds the "Student Portal" permission module — one permission per student
 * portal sidebar menu (and submenu). These control which menus a portal role
 * (Student / Parent / Driver) can see.
 *
 * The permission `name` values here MUST stay in sync with
 * src/lib/portal-menu-permissions.ts on the frontend.
 */
class PortalPermissionSeeder extends Seeder
{
    public function run(): void
    {
        $module = 'Student Portal';

        // [permission name => feature label]. Submenus use a parent.child path.
        $items = [
            'portal.profile.view' => 'My Profile',
            'portal.fees.view' => 'Fees',
            'portal.online_course.view' => 'Online Course',
            'portal.zoom_live_classes.view' => 'Zoom Live Classes',
            'portal.gmeet_live_classes.view' => 'Gmeet Live Classes',
            'portal.class_timetable.view' => 'Class Timetable',
            'portal.lesson_plan.view' => 'Lesson Plan',
            'portal.syllabus_status.view' => 'Syllabus Status',
            'portal.homework.view' => 'Homework',
            'portal.online_exam.view' => 'Online Exam',
            'portal.apply_leave.view' => 'Apply Leave',
            'portal.visitor_book.view' => 'Visitor Book',
            'portal.download_center.view' => 'Download Center',
            'portal.download_center.contents.view' => 'Download Center - Contents',
            'portal.download_center.video_tutorial.view' => 'Download Center - Video Tutorial',
            'portal.attendance.view' => 'Attendance',
            'portal.behaviour.view' => 'Behaviour Records',
            'portal.cbse_examination.view' => 'CBSE Examination',
            'portal.cbse_examination.exam_schedule.view' => 'CBSE Examination - Exam Schedule',
            'portal.cbse_examination.exam_result.view' => 'CBSE Examination - Exam Result',
            'portal.examinations.view' => 'Examinations',
            'portal.examinations.exam_schedule.view' => 'Examinations - Exam Schedule',
            'portal.examinations.exam_result.view' => 'Examinations - Exam Result',
            'portal.notice_board.view' => 'Notice Board',
            'portal.teachers_reviews.view' => 'Teachers Reviews',
            'portal.library.view' => 'Library',
            'portal.library.books.view' => 'Library - Books',
            'portal.library.book_issued.view' => 'Library - Book Issued',
            'portal.transport_routes.view' => 'Transport Routes',
            'portal.hostel_rooms.view' => 'Hostel Rooms',
            'portal.certificates.view' => 'Certificates',
            'portal.id_card.view' => 'ID Card',
            'portal.my_qr_pass.view' => 'My QR Pass',
            'portal.branches.view' => 'Our Branches',
            'portal.events.view' => 'Events',
            'portal.news.view' => 'News',
            'portal.gallery.view' => 'Gallery',
            'portal.annual_calendar.view' => 'Annual Calendar',
        ];

        $permissionIds = [];
        foreach ($items as $name => $feature) {
            $permission = Permission::firstOrCreate(
                ['name' => $name],
                ['module' => $module, 'feature' => $feature, 'capability' => 'view']
            );
            $permissionIds[] = $permission->id;
        }

        // Grant all portal menus to the default portal roles so existing
        // behaviour is preserved; admins can then restrict per role.
        foreach (['Student', 'Parent', 'Driver'] as $roleName) {
            $role = Role::where('name', $roleName)->first();
            if ($role) {
                $role->permissions()->syncWithoutDetaching($permissionIds);
            }
        }
    }
}
