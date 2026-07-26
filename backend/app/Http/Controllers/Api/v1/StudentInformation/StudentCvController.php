<?php

namespace App\Http\Controllers\Api\v1\StudentInformation;

use App\Http\Controllers\Api\BaseController;
use App\Models\User;
use App\Models\SchoolClass;
use App\Models\Section;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;

class StudentCvController extends BaseController
{
    private function ensureSeededData()
    {
        // 1. Seed classes, sections, students
        $session = \App\Models\AcademicSession::firstOrCreate(
            ['session' => '2026-27'],
            ['is_active' => true]
        );

        $class1 = \App\Models\SchoolClass::firstOrCreate(
            ['name' => 'Class 1'],
            ['academic_session_id' => $session->id]
        );

        $sectionA = \App\Models\Section::firstOrCreate(
            ['name' => 'A', 'school_class_id' => $class1->id],
            ['academic_session_id' => $session->id]
        );

        $obc = \App\Models\StudentCategory::firstOrCreate(['category_name' => 'OBC']);
        $general = \App\Models\StudentCategory::firstOrCreate(['category_name' => 'General']);

        if (\App\Models\User::where('role', 'Student')->where('school_class_id', $class1->id)->count() === 0) {
            $students = [
                [
                    'admission_no' => '002',
                    'name' => 'Sneha Patel',
                    'dob' => '2016-07-15',
                    'gender' => 'Female',
                    'category' => null,
                    'phone' => '9876200001',
                    'email' => 'sneha.patel@ischool.com'
                ],
                [
                    'admission_no' => '003',
                    'name' => 'Hariom Yadav',
                    'dob' => '2020-04-08',
                    'gender' => 'Male',
                    'category' => $obc->id,
                    'phone' => null,
                    'email' => 'hariom.yadav@ischool.com'
                ],
                [
                    'admission_no' => '1800011',
                    'name' => 'Edward Thomas',
                    'dob' => '2020-04-08',
                    'gender' => 'Male',
                    'category' => $obc->id,
                    'phone' => '98262573272',
                    'email' => 'edward.thomas@ischool.com'
                ],
                [
                    'admission_no' => 'A003',
                    'name' => 'Hariom Yadav',
                    'dob' => '2020-04-08',
                    'gender' => 'Male',
                    'category' => $obc->id,
                    'phone' => null,
                    'email' => 'hariom.yadav2@ischool.com'
                ],
                [
                    'admission_no' => 'A004',
                    'name' => 'Nisha',
                    'dob' => '2026-04-15',
                    'gender' => 'Female',
                    'category' => $general->id,
                    'phone' => null,
                    'email' => 'nisha@ischool.com'
                ],
                [
                    'admission_no' => 'A41003',
                    'name' => 'niya',
                    'dob' => '2026-04-22',
                    'gender' => 'Male',
                    'category' => null,
                    'phone' => null,
                    'email' => 'niya@ischool.com'
                ],
                [
                    'admission_no' => 'A5466',
                    'name' => 'ANANTA PATEL',
                    'dob' => '2025-04-15',
                    'gender' => 'Male',
                    'category' => null,
                    'phone' => '767765735652',
                    'email' => 'ananta.patel@ischool.com'
                ],
            ];

            foreach ($students as $s) {
                \App\Models\User::create([
                    'admission_no' => $s['admission_no'],
                    'name' => $s['name'],
                    'dob' => $s['dob'],
                    'gender' => $s['gender'],
                    'category' => $s['category'],
                    'phone' => $s['phone'],
                    'email' => $s['email'],
                    'password' => bcrypt('password'),
                    'role' => 'Student',
                    'school_class_id' => $class1->id,
                    'section_id' => $sectionA->id,
                    'active' => true,
                    'username' => 'std_' . $s['admission_no']
                ]);
            }
        }

        // Force recreation of table to sync exact mockup fields
        if (Schema::hasTable('student_cv_fields')) {
            $hasWorkExperience = DB::table('student_cv_fields')->where('name', 'Work Experience')->exists();
            if (!$hasWorkExperience) {
                Schema::dropIfExists('student_cv_fields');
            }
        }

        // 2. Self-healing DB Schema for CV Settings
        if (!Schema::hasTable('student_cv_fields')) {
            Schema::create('student_cv_fields', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('tab'); // 'cv_fields', 'cv_other_fields', 'student_panel_cv_setting'
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });

            $cvFields = [
                // CV Fields
                ['name' => 'Last Name', 'tab' => 'cv_fields', 'is_active' => true],
                ['name' => 'Gender', 'tab' => 'cv_fields', 'is_active' => true],
                ['name' => 'Date Of Birth', 'tab' => 'cv_fields', 'is_active' => true],
                ['name' => 'Category', 'tab' => 'cv_fields', 'is_active' => true],
                ['name' => 'Religion', 'tab' => 'cv_fields', 'is_active' => true],
                ['name' => 'Caste', 'tab' => 'cv_fields', 'is_active' => true],
                ['name' => 'Mobile Number', 'tab' => 'cv_fields', 'is_active' => true],
                ['name' => 'Email', 'tab' => 'cv_fields', 'is_active' => true],
                ['name' => 'Student Photo', 'tab' => 'cv_fields', 'is_active' => true],
                ['name' => 'Blood Group', 'tab' => 'cv_fields', 'is_active' => true],
                ['name' => 'Height', 'tab' => 'cv_fields', 'is_active' => true],
                ['name' => 'Weight', 'tab' => 'cv_fields', 'is_active' => true],
                ['name' => 'Father Name', 'tab' => 'cv_fields', 'is_active' => true],
                ['name' => 'Father Phone', 'tab' => 'cv_fields', 'is_active' => true],
                ['name' => 'Father Occupation', 'tab' => 'cv_fields', 'is_active' => true],
                ['name' => 'Mother Name', 'tab' => 'cv_fields', 'is_active' => true],
                ['name' => 'Mother Phone', 'tab' => 'cv_fields', 'is_active' => true],
                ['name' => 'Mother Occupation', 'tab' => 'cv_fields', 'is_active' => true],
                ['name' => 'Guardian Name', 'tab' => 'cv_fields', 'is_active' => true],
                ['name' => 'Guardian Relation', 'tab' => 'cv_fields', 'is_active' => true],
                ['name' => 'Guardian Email', 'tab' => 'cv_fields', 'is_active' => true],
                ['name' => 'Guardian Phone', 'tab' => 'cv_fields', 'is_active' => true],
                ['name' => 'Guardian Occupation', 'tab' => 'cv_fields', 'is_active' => true],
                ['name' => 'Guardian Address', 'tab' => 'cv_fields', 'is_active' => true],
                ['name' => 'National Identification Number', 'tab' => 'cv_fields', 'is_active' => true],
                ['name' => 'Local Identification Number', 'tab' => 'cv_fields', 'is_active' => true],
                ['name' => 'Personal Details', 'tab' => 'cv_fields', 'is_active' => true],
                ['name' => 'Parent Guardian Detail', 'tab' => 'cv_fields', 'is_active' => true],
                ['name' => 'Medical History', 'tab' => 'cv_fields', 'is_active' => false],

                // CV Other Fields (Exactly as in screenshot)
                ['name' => 'Work Experience', 'tab' => 'cv_other_fields', 'is_active' => true],
                ['name' => 'Education/Qualification', 'tab' => 'cv_other_fields', 'is_active' => true],
                ['name' => 'Technical Skills', 'tab' => 'cv_other_fields', 'is_active' => true],
                ['name' => 'Reference', 'tab' => 'cv_other_fields', 'is_active' => true],
                ['name' => 'Other Details', 'tab' => 'cv_other_fields', 'is_active' => true],

                // Student Panel CV Setting (Exactly as in screenshot)
                ['name' => 'Enable Download', 'tab' => 'student_panel_cv_setting', 'is_active' => true],
            ];

            DB::table('student_cv_fields')->insert($cvFields);
        }
    }

    /**
     * Get criteria for filtering.
     */
    public function criteria(): JsonResponse
    {
        $this->ensureSeededData();
        $classes = SchoolClass::with('sections')->get();
        return $this->success($classes, 'Criteria retrieved successfully');
    }

    /**
     * List students for CV download.
     */
    public function index(Request $request): JsonResponse
    {
        $this->ensureSeededData();

        $request->validate([
            'school_class_id' => 'required',
            'section_id' => 'required',
        ]);

        $students = User::where('role', 'Student')
            ->where('school_class_id', $request->school_class_id)
            ->where('section_id', $request->section_id)
            ->with(['schoolClass', 'section', 'studentCategory'])
            ->get();

        foreach ($students as $s) {
            $displayName = $s->full_name ?: trim(($s->first_name ?? $s->name) . ' ' . ($s->last_name ?? ''));
            $s->full_name = $displayName ?: $s->name;
            $s->photo_url = $this->resolvePhotoUrl($s);
        }

        return $this->success($students, 'Students retrieved successfully');
    }

    /**
     * Resolve student photo into Base64 Data URI or absolute URL.
     */
    private function resolvePhotoUrl($student): ?string
    {
        $photoField = $student->avatar ?: ($student->student_photo ?: ($student->photo ?? null));
        if (!$photoField || empty(trim($photoField))) {
            return null;
        }

        if (str_starts_with($photoField, 'data:image')) {
            return $photoField;
        }

        if (str_starts_with($photoField, 'http://') || str_starts_with($photoField, 'https://')) {
            return $photoField;
        }

        $cleanPath = ltrim($photoField, '/');
        if (str_starts_with($cleanPath, 'storage/')) {
            $cleanPath = substr($cleanPath, 8);
        }

        $possiblePaths = [
            storage_path('app/public/' . $cleanPath),
            public_path('storage/' . $cleanPath),
            public_path('uploads/' . $cleanPath),
            public_path($cleanPath),
        ];

        foreach ($possiblePaths as $path) {
            if (file_exists($path) && is_file($path)) {
                $mime = mime_content_type($path) ?: 'image/jpeg';
                $content = @file_get_contents($path);
                if ($content !== false) {
                    return 'data:' . $mime . ';base64,' . base64_encode($content);
                }
            }
        }

        return url('storage/' . $cleanPath);
    }

    /**
     * Purge student record (Delete).
     */
    public function destroy($id): JsonResponse
    {
        $student = User::where('role', 'Student')->findOrFail($id);
        $student->delete();
        return $this->success(null, 'Student record purged successfully');
    }

    /**
     * Get full details of a single student for CV download.
     */
    public function detail($id): JsonResponse
    {
        $this->ensureSeededData();

        $student = User::where('role', 'Student')
            ->with(['schoolClass', 'section', 'studentCategory'])
            ->findOrFail($id);

        $displayName = $student->full_name ?: trim(($student->first_name ?? $student->name) . ' ' . ($student->last_name ?? ''));
        $student->full_name = $displayName ?: $student->name;
        $student->photo_url = $this->resolvePhotoUrl($student);

        return $this->success($student, 'Student CV details retrieved successfully');
    }

    /**
     * Get all CV Settings fields.
     */
    public function getSettings(): JsonResponse
    {
        $this->ensureSeededData();
        $settings = DB::table('student_cv_fields')->get();
        return $this->success($settings, 'CV Settings fields retrieved successfully');
    }

    /**
     * Toggle a CV Setting field status.
     */
    public function toggleSetting(Request $request): JsonResponse
    {
        $request->validate([
            'id' => 'required|integer',
            'is_active' => 'required|boolean'
        ]);

        $this->ensureSeededData();

        DB::table('student_cv_fields')
            ->where('id', $request->id)
            ->update([
                'is_active' => $request->is_active,
                'updated_at' => now()
            ]);

        return $this->success(null, 'CV Field status updated successfully');
    }
}
