<?php

namespace App\Http\Controllers\Api\v1\Examination;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\ExamGroup;
use App\Models\AdmitCardTemplate;

class PrintAdmitCardController extends Controller
{
    public function getCriteriaData()
    {
        return response()->json([
            'exam_groups' => ExamGroup::with('exams')->get(),
            'admit_card_templates' => AdmitCardTemplate::all(),
            'sessions' => \App\Models\AcademicSession::all(),
        ]);
    }

    public function searchStudents(Request $request)
    {
        $request->validate([
            'school_class_id' => 'required',
            'section_id' => 'required',
        ]);

        $query = User::role('Student')
            ->where('school_class_id', $request->school_class_id)
            ->where('section_id', $request->section_id);

        if ($request->filled('exam_id')) {
            $query->whereHas('enrolledExams', function ($q) use ($request) {
                $q->where('exam_id', $request->exam_id);
            });
        }

        if ($request->filled('session_id')) {
            $query->where(function ($q) use ($request) {
                $q->where('academic_session_id', $request->session_id)
                  ->orWhereNull('academic_session_id');
            });
        }

        $students = $query->select([
            'id', 'admission_no', 'name', 'last_name',
            'father_name', 'dob', 'gender', 'phone',
            'school_class_id', 'section_id', 'academic_session_id',
        ])->get()->map(function ($s) {
            return [
                'id'           => $s->id,
                'admission_no' => $s->admission_no,
                'name'         => trim(($s->name ?? '') . ' ' . ($s->last_name ?? '')),
                'last_name'    => $s->last_name,
                'father_name'  => $s->father_name,
                'dob'          => $s->dob,
                'gender'       => $s->gender,
                'phone'        => $s->phone,
            ];
        });

        return response()->json($students);
    }

    public function generate(Request $request)
    {
        $request->validate([
            'student_id' => 'required',
            'exam_id' => 'required',
            'template_id' => 'required',
        ]);

        $student = User::with(['schoolClass', 'section'])->find($request->student_id);
        if (!$student) {
            return response()->json(['success' => false, 'message' => 'Student not found'], 404);
        }

        $exam = \App\Models\Exam::with('examGroup')->find($request->exam_id);
        $template = AdmitCardTemplate::find($request->template_id);
        
        $schedules = \App\Models\ExamSchedule::with('subject')
            ->where('exam_id', $request->exam_id)
            ->orderBy('date_from', 'asc')
            ->orderBy('start_time', 'asc')
            ->get();
            
        $print_setting = \App\Models\PrintSetting::where('type', 'Online Exam')->first();

        return response()->json([
            'student' => [
                'name' => trim(($student->name ?? '') . ' ' . ($student->last_name ?? '')),
                'father_name' => $student->father_name,
                'mother_name' => $student->mother_name,
                'admission_no' => $student->admission_no,
                'roll_no' => $student->roll_no,
                'dob' => $student->dob,
                'gender' => $student->gender,
                'class' => $student->schoolClass ? $student->schoolClass->name : '',
                'section' => $student->section ? $student->section->name : '',
                'photo' => $student->avatar,
                'address' => $student->current_address,
            ],
            'exam' => [
                'name' => $exam->name ?? '',
                'session' => $exam->session ?? '',
                'group' => $exam->examGroup ? $exam->examGroup->name : '',
            ],
            'template' => $template,
            'print_setting' => $print_setting,
            'schedules' => $schedules->map(function ($s) {
                return [
                    'subject_name' => $s->subject ? $s->subject->name : '',
                    'subject_code' => $s->subject ? $s->subject->code : '',
                    'date' => $s->date_from,
                    'start_time' => $s->start_time,
                    'duration' => $s->duration,
                    'room_no' => $s->room_no,
                    'max_marks' => $s->max_marks,
                    'min_marks' => $s->min_marks,
                ];
            }),
        ]);
    }
}
