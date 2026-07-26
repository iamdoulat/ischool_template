<?php

namespace App\Http\Controllers\Api\v1\Examination;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\ExamGroup;
use App\Models\Exam;
use App\Models\MarksheetTemplate;

class PrintMarksheetController extends Controller
{
    public function getCriteriaData()
    {
        return response()->json([
            'exam_groups' => ExamGroup::with('exams')->get(),
            'marksheet_templates' => MarksheetTemplate::all(),
            'sessions' => \App\Models\AcademicSession::all(),
        ]);
    }

    public function searchStudents(Request $request)
    {
        $request->validate([
            'school_class_id' => 'required',
            'section_id'      => 'required',
            'exam_id'         => 'nullable|exists:exams,id',
        ]);

        // Start with students in the selected class & section
        $query = User::role('Student')
            ->where('school_class_id', $request->school_class_id)
            ->where('section_id', $request->section_id);

        // If an exam is selected, restrict to students assigned to that exam via the pivot
        if ($request->filled('exam_id')) {
            $query->whereHas('enrolledExams', function ($q) use ($request) {
                $q->where('exam_id', $request->exam_id);
            });
        }

        // Session filter is optional — only apply when the user explicitly passes it
        // and students actually have academic_session_id populated
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

    public function generateMarksheet(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:users,id',
            'exam_id' => 'required|exists:exams,id',
        ]);

        $student = User::with(['schoolClass', 'section'])->findOrFail($request->student_id);
        $exam = Exam::with(['marksheetTemplate', 'examGroup'])->findOrFail($request->exam_id);

        if (!$exam->marksheetTemplate) {
            return response()->json(['message' => 'No template assigned to this exam'], 400);
        }

        $schedules = \App\Models\ExamSchedule::with('subject')
            ->where('exam_id', $exam->id)
            ->get();

        $results = \App\Models\ExamResult::where('exam_id', $exam->id)
            ->where('student_id', $student->id)
            ->get()
            ->keyBy('subject_id');

        $rank = \App\Models\ExamRank::where('exam_id', $exam->id)
            ->where('student_id', $student->id)
            ->first();

        // Calculate grades (assuming marks-grade exist, skip for simplicity or just return raw results)
        // Combine schedules and results
        $subjects = $schedules->map(function ($schedule) use ($results) {
            $result = $results->get($schedule->subject_id);
            $theory = $result ? $result->theory_marks : null;
            $practical = $result ? $result->practical_marks : null;
            $total = ($theory !== null ? (float)$theory : 0) + ($practical !== null ? (float)$practical : 0);
            
            return [
                'subject_name' => $schedule->subject ? $schedule->subject->name : '',
                'subject_code' => $schedule->subject ? $schedule->subject->code : '',
                'max_marks' => $schedule->max_marks,
                'min_marks' => $schedule->min_marks,
                'theory_marks' => $theory,
                'practical_marks' => $practical,
                'total_marks' => $result && ($theory !== null || $practical !== null) ? $total : null,
                'is_absent' => $result ? (bool)$result->is_absent : false,
                'note' => $result ? $result->note : '',
            ];
        });

        // Get general note from the first result (if teacher remark was saved per student)
        $teacherRemark = $results->firstWhere('note', '!=', null)->note ?? null;

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
            ],
            'exam' => [
                'name' => $exam->name,
                'session' => $exam->session,
                'group' => $exam->examGroup ? $exam->examGroup->name : '',
            ],
            'template' => $exam->marksheetTemplate,
            'print_setting' => \App\Models\PrintSetting::where('type', 'Online Exam')->first(),
            'subjects' => $subjects,
            'summary' => [
                'total_marks' => $rank ? $rank->total_marks : null,
                'rank' => $rank ? $rank->rank : null,
                'remark' => $teacherRemark,
            ],
        ]);
    }
}
