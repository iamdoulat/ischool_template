<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();

        // All missing permissions: [module, feature, capability, name]
        $missingPermissions = [
            // student_information
            ['Student Information', 'Student Details', 'view', 'student.information.student.details.view'],
            ['Student Information', 'Student Details', 'edit', 'student.information.student.details.edit'],
            ['Student Information', 'Disabled Students', 'view', 'student.information.disabled.students.view'],
            ['Student Information', 'Disabled Students', 'edit', 'student.information.disabled.students.edit'],
            ['Student Information', 'Student House', 'view', 'student.information.student.house.view'],
            ['Student Information', 'Student House', 'add', 'student.information.student.house.add'],
            ['Student Information', 'Student House', 'edit', 'student.information.student.house.edit'],
            ['Student Information', 'Student House', 'delete', 'student.information.student.house.delete'],

            // income
            ['Income', 'Add Income', 'view', 'income.add.income.view'],
            ['Income', 'Add Income', 'add', 'income.add.income.add'],
            ['Income', 'Add Income', 'edit', 'income.add.income.edit'],
            ['Income', 'Add Income', 'delete', 'income.add.income.delete'],

            // expenses
            ['Expense', 'Add Expense', 'view', 'expense.add.expense.view'],
            ['Expense', 'Add Expense', 'add', 'expense.add.expense.add'],
            ['Expense', 'Add Expense', 'edit', 'expense.add.expense.edit'],
            ['Expense', 'Add Expense', 'delete', 'expense.add.expense.delete'],

            // attendance
            ['Student Attendance', 'Student Attendance', 'view', 'student.attendance.student.attendance.view'],
            ['Student Attendance', 'Student Attendance', 'add', 'student.attendance.student.attendance.add'],
            ['Student Attendance', 'Student Attendance', 'edit', 'student.attendance.student.attendance.edit'],
            ['Student Attendance', 'Leave Type', 'view', 'student.attendance.leave.type.view'],
            ['Student Attendance', 'Leave Type', 'add', 'student.attendance.leave.type.add'],
            ['Student Attendance', 'Leave Type', 'edit', 'student.attendance.leave.type.edit'],
            ['Student Attendance', 'Leave Type', 'delete', 'student.attendance.leave.type.delete'],

            // cbse_examination
            ['CBSE Examination', 'Exam', 'view', 'cbse.examination.exam.view'],
            ['CBSE Examination', 'Exam', 'add', 'cbse.examination.exam.add'],
            ['CBSE Examination', 'Exam', 'edit', 'cbse.examination.exam.edit'],
            ['CBSE Examination', 'Exam Schedule', 'view', 'cbse.examination.exam.schedule.view'],
            ['CBSE Examination', 'Exam Schedule', 'add', 'cbse.examination.exam.schedule.add'],
            ['CBSE Examination', 'Exam Schedule', 'edit', 'cbse.examination.exam.schedule.edit'],
            ['CBSE Examination', 'Print Marksheet', 'view', 'cbse.examination.print.marksheet.view'],
            ['CBSE Examination', 'Template', 'view', 'cbse.examination.template.view'],
            ['CBSE Examination', 'Template', 'add', 'cbse.examination.template.add'],
            ['CBSE Examination', 'Template', 'edit', 'cbse.examination.template.edit'],
            ['CBSE Examination', 'Assign Observation', 'view', 'cbse.examination.assign.observation.view'],
            ['CBSE Examination', 'Assign Observation', 'add', 'cbse.examination.assign.observation.add'],
            ['CBSE Examination', 'Assign Observation', 'edit', 'cbse.examination.assign.observation.edit'],
            ['CBSE Examination', 'Reports', 'view', 'cbse.examination.reports.view'],
            ['CBSE Examination', 'Setting', 'view', 'cbse.examination.setting.view'],
            ['CBSE Examination', 'Setting', 'edit', 'cbse.examination.setting.edit'],

            // online_examinations
            ['Online Examination', 'Online Exam', 'view', 'online.examination.online.exam.view'],
            ['Online Examination', 'Online Exam', 'add', 'online.examination.online.exam.add'],
            ['Online Examination', 'Online Exam', 'edit', 'online.examination.online.exam.edit'],
            ['Online Examination', 'Online Exam', 'delete', 'online.examination.online.exam.delete'],

            // academics
            ['Academics', 'Promote Students', 'view', 'academics.promote.students.view'],
            ['Academics', 'Promote Students', 'edit', 'academics.promote.students.edit'],
            ['Academics', 'Subjects', 'view', 'academics.subjects.view'],
            ['Academics', 'Subjects', 'add', 'academics.subjects.add'],
            ['Academics', 'Subjects', 'edit', 'academics.subjects.edit'],
            ['Academics', 'Subjects', 'delete', 'academics.subjects.delete'],
            ['Academics', 'Sections', 'view', 'academics.sections.view'],
            ['Academics', 'Sections', 'add', 'academics.sections.add'],
            ['Academics', 'Sections', 'edit', 'academics.sections.edit'],
            ['Academics', 'Sections', 'delete', 'academics.sections.delete'],

            // human_resource
            ['Human Resource', 'Staff Directory', 'view', 'human.resource.staff.directory.view'],
            ['Human Resource', 'Staff Directory', 'add', 'human.resource.staff.directory.add'],
            ['Human Resource', 'Staff Directory', 'edit', 'human.resource.staff.directory.edit'],
            ['Human Resource', 'Staff Directory', 'delete', 'human.resource.staff.directory.delete'],
            ['Human Resource', 'Payroll', 'view', 'human.resource.payroll.view'],
            ['Human Resource', 'Payroll', 'add', 'human.resource.payroll.add'],
            ['Human Resource', 'Payroll', 'edit', 'human.resource.payroll.edit'],
            ['Human Resource', 'Leave Type', 'view', 'human.resource.leave.type.view'],
            ['Human Resource', 'Leave Type', 'add', 'human.resource.leave.type.add'],
            ['Human Resource', 'Leave Type', 'edit', 'human.resource.leave.type.edit'],
            ['Human Resource', 'Leave Type', 'delete', 'human.resource.leave.type.delete'],
            ['Human Resource', 'Disabled Staff', 'view', 'human.resource.disabled.staff.view'],
            ['Human Resource', 'Disabled Staff', 'edit', 'human.resource.disabled.staff.edit'],

            // communicate
            ['Communicate', 'Send Email', 'view', 'communicate.send.email.view'],
            ['Communicate', 'Send Email', 'add', 'communicate.send.email.add'],
            ['Communicate', 'Send Sms', 'view', 'communicate.send.sms.view'],
            ['Communicate', 'Send Sms', 'add', 'communicate.send.sms.add'],
            ['Communicate', 'Send Wa', 'view', 'communicate.send.wa.view'],
            ['Communicate', 'Send Wa', 'add', 'communicate.send.wa.add'],
            ['Communicate', 'Wa Template', 'view', 'communicate.wa.template.view'],
            ['Communicate', 'Wa Template', 'add', 'communicate.wa.template.add'],
            ['Communicate', 'Wa Template', 'edit', 'communicate.wa.template.edit'],
            ['Communicate', 'Wa Template', 'delete', 'communicate.wa.template.delete'],

            // download_center
            ['Download Center', 'Upload Share Content', 'view', 'download.center.upload.share.content.view'],
            ['Download Center', 'Upload Share Content', 'add', 'download.center.upload.share.content.add'],
            ['Download Center', 'Upload Share Content', 'edit', 'download.center.upload.share.content.edit'],
            ['Download Center', 'Upload Share Content', 'delete', 'download.center.upload.share.content.delete'],

            // homework
            ['Homework', 'Add Homework', 'view', 'homework.add.homework.view'],
            ['Homework', 'Add Homework', 'add', 'homework.add.homework.add'],
            ['Homework', 'Add Homework', 'edit', 'homework.add.homework.edit'],

            // online_course
            ['Online Course', 'Online Course Report', 'view', 'online.course.online.course.report.view'],

            // library
            ['Library', 'Book List', 'view', 'library.book.list.view'],
            ['Library', 'Book List', 'add', 'library.book.list.add'],
            ['Library', 'Book List', 'edit', 'library.book.list.edit'],
            ['Library', 'Book List', 'delete', 'library.book.list.delete'],

            // transport
            ['Transport', 'Vehicles', 'view', 'transport.vehicles.view'],
            ['Transport', 'Vehicles', 'add', 'transport.vehicles.add'],
            ['Transport', 'Vehicles', 'edit', 'transport.vehicles.edit'],
            ['Transport', 'Vehicles', 'delete', 'transport.vehicles.delete'],

            // hostel
            ['Hostel', 'Hostel Room', 'view', 'hostel.hostel.room.view'],
            ['Hostel', 'Hostel Room', 'add', 'hostel.hostel.room.add'],
            ['Hostel', 'Hostel Room', 'edit', 'hostel.hostel.room.edit'],
            ['Hostel', 'Hostel Room', 'delete', 'hostel.hostel.room.delete'],

            // multi_branch
            ['Multi Branch', 'Report', 'view', 'multi.branch.report.view'],

            // behaviour_records
            ['Behaviour Records', 'Assign Incident', 'view', 'behaviour.records.assign.incident.view'],
            ['Behaviour Records', 'Assign Incident', 'add', 'behaviour.records.assign.incident.add'],
            ['Behaviour Records', 'Incidents', 'view', 'behaviour.records.incidents.view'],
            ['Behaviour Records', 'Incidents', 'edit', 'behaviour.records.incidents.edit'],
            ['Behaviour Records', 'Incidents', 'delete', 'behaviour.records.incidents.delete'],
            ['Behaviour Records', 'Reports', 'view', 'behaviour.records.reports.view'],
            ['Behaviour Records', 'Setting', 'view', 'behaviour.records.setting.view'],
            ['Behaviour Records', 'Setting', 'edit', 'behaviour.records.setting.edit'],

            // reports
            ['Reports', 'Student Information', 'view', 'reports.student.information.view'],
            ['Reports', 'Finance', 'view', 'reports.finance.view'],
            ['Reports', 'Examinations', 'view', 'reports.examinations.view'],
            ['Reports', 'Online Examinations', 'view', 'reports.online.examinations.view'],
            ['Reports', 'Lesson Plan', 'view', 'reports.lesson.plan.view'],
            ['Reports', 'Human Resource', 'view', 'reports.human.resource.view'],
            ['Reports', 'Library', 'view', 'reports.library.view'],
            ['Reports', 'Inventory', 'view', 'reports.inventory.view'],
        ];

        foreach ($missingPermissions as [$module, $feature, $capability, $name]) {
            $exists = DB::table('permissions')->where('name', $name)->exists();
            if (!$exists) {
                DB::table('permissions')->insert([
                    'module' => $module,
                    'feature' => $feature,
                    'capability' => $capability,
                    'name' => $name,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }

        // Assign ALL permissions to Admin role
        $adminRole = DB::table('roles')->where('name', 'Admin')->first();
        if ($adminRole) {
            $allPermIds = DB::table('permissions')->pluck('id')->toArray();
            $existingPermIds = DB::table('permission_role')
                ->where('role_id', $adminRole->id)
                ->pluck('permission_id')
                ->toArray();

            $newPermIds = array_diff($allPermIds, $existingPermIds);
            foreach ($newPermIds as $permId) {
                DB::table('permission_role')->insert([
                    'role_id' => $adminRole->id,
                    'permission_id' => $permId,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }
    }

    public function down(): void
    {
        // Remove all non-original permissions (the ones we added)
        $addedNames = [
            'student.information.student.details.view', 'student.information.student.details.edit',
            'student.information.disabled.students.view', 'student.information.disabled.students.edit',
            'student.information.student.house.view', 'student.information.student.house.add',
            'student.information.student.house.edit', 'student.information.student.house.delete',
            'income.add.income.view', 'income.add.income.add', 'income.add.income.edit', 'income.add.income.delete',
            'expense.add.expense.view', 'expense.add.expense.add', 'expense.add.expense.edit', 'expense.add.expense.delete',
            'student.attendance.student.attendance.view', 'student.attendance.student.attendance.add', 'student.attendance.student.attendance.edit',
            'student.attendance.leave.type.view', 'student.attendance.leave.type.add', 'student.attendance.leave.type.edit', 'student.attendance.leave.type.delete',
            'cbse.examination.exam.view', 'cbse.examination.exam.add', 'cbse.examination.exam.edit',
            'cbse.examination.exam.schedule.view', 'cbse.examination.exam.schedule.add', 'cbse.examination.exam.schedule.edit',
            'cbse.examination.print.marksheet.view',
            'cbse.examination.template.view', 'cbse.examination.template.add', 'cbse.examination.template.edit',
            'cbse.examination.assign.observation.view', 'cbse.examination.assign.observation.add', 'cbse.examination.assign.observation.edit',
            'cbse.examination.reports.view',
            'cbse.examination.setting.view', 'cbse.examination.setting.edit',
            'online.examination.online.exam.view', 'online.examination.online.exam.add', 'online.examination.online.exam.edit', 'online.examination.online.exam.delete',
            'academics.promote.students.view', 'academics.promote.students.edit',
            'academics.subjects.view', 'academics.subjects.add', 'academics.subjects.edit', 'academics.subjects.delete',
            'academics.sections.view', 'academics.sections.add', 'academics.sections.edit', 'academics.sections.delete',
            'human.resource.staff.directory.view', 'human.resource.staff.directory.add', 'human.resource.staff.directory.edit', 'human.resource.staff.directory.delete',
            'human.resource.payroll.view', 'human.resource.payroll.add', 'human.resource.payroll.edit',
            'human.resource.leave.type.view', 'human.resource.leave.type.add', 'human.resource.leave.type.edit', 'human.resource.leave.type.delete',
            'human.resource.disabled.staff.view', 'human.resource.disabled.staff.edit',
            'communicate.send.email.view', 'communicate.send.email.add',
            'communicate.send.sms.view', 'communicate.send.sms.add',
            'communicate.send.wa.view', 'communicate.send.wa.add',
            'communicate.wa.template.view', 'communicate.wa.template.add', 'communicate.wa.template.edit', 'communicate.wa.template.delete',
            'download.center.upload.share.content.view', 'download.center.upload.share.content.add', 'download.center.upload.share.content.edit', 'download.center.upload.share.content.delete',
            'homework.add.homework.view', 'homework.add.homework.add', 'homework.add.homework.edit',
            'online.course.online.course.report.view',
            'library.book.list.view', 'library.book.list.add', 'library.book.list.edit', 'library.book.list.delete',
            'transport.vehicles.view', 'transport.vehicles.add', 'transport.vehicles.edit', 'transport.vehicles.delete',
            'hostel.hostel.room.view', 'hostel.hostel.room.add', 'hostel.hostel.room.edit', 'hostel.hostel.room.delete',
            'multi.branch.report.view',
            'behaviour.records.assign.incident.view', 'behaviour.records.assign.incident.add',
            'behaviour.records.incidents.view', 'behaviour.records.incidents.edit', 'behaviour.records.incidents.delete',
            'behaviour.records.reports.view',
            'behaviour.records.setting.view', 'behaviour.records.setting.edit',
            'reports.student.information.view', 'reports.finance.view', 'reports.examinations.view',
            'reports.online.examinations.view', 'reports.lesson.plan.view', 'reports.human.resource.view',
            'reports.library.view', 'reports.inventory.view',
        ];

        DB::table('permission_role')
            ->whereIn('permission_id', function ($q) use ($addedNames) {
                $q->select('id')->from('permissions')->whereIn('name', $addedNames);
            })
            ->delete();

        DB::table('permissions')->whereIn('name', $addedNames)->delete();
    }
};
