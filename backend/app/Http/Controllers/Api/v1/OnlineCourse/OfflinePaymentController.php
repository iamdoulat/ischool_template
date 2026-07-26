<?php

namespace App\Http\Controllers\Api\v1\OnlineCourse;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\SchoolClass;
use App\Models\Section;

class OfflinePaymentController extends Controller
{
    public function getCriteria()
    {
        $classes = SchoolClass::with('sections')->get();
        return response()->json($classes);
    }

    public function getStudents(Request $request)
    {
        $request->validate([
            'class_id' => 'required',
            'section_id' => 'required',
        ]);

        $students = User::role('student')
            ->where('school_class_id', $request->class_id)
            ->where('section_id', $request->section_id)
            ->get(['id', 'name', 'admission_no']);

        return response()->json($students);
    }

    public function searchCourses(Request $request)
    {
        $studentId = $request->student_id;

        $courses = \App\Models\OnlineCourse::with('instructor')->get()->map(function($course) use ($studentId) {
            $purchaseStatus = null;
            $invoiceNo = null;
            $paymentDate = null;
            if ($studentId) {
                $purchase = \App\Models\OnlineCoursePurchase::where('student_id', $studentId)
                    ->where('course_id', $course->id)
                    ->first();
                if ($purchase) {
                    $purchaseStatus = $purchase->status;
                    $invoiceNo = $purchase->invoice_no;
                    $paymentDate = $purchase->payment_date;
                }
            }

            return [
                'id' => $course->id,
                'title' => $course->title,
                'sections' => 0,
                'lessons' => $course->total_lessons ?? 0,
                'quizzes' => $course->total_quizzes ?? 0,
                'exams' => $course->total_exams ?? 0,
                'assignments' => $course->total_assignments ?? 0,
                'provider' => $course->instructor_name ?? 'Unknown',
                'price' => (float) ($course->original_price ?? 0),
                'current_price' => (float) ($course->price ?? 0),
                'purchase_status' => $purchaseStatus,
                'invoice_no' => $invoiceNo,
                'payment_date' => $paymentDate
            ];
        });

        return response()->json($courses);
    }

    public function store(Request $request)
    {
        $request->validate([
            'student_id' => 'required',
            'course_id' => 'required'
        ]);

        $course = \App\Models\OnlineCourse::findOrFail($request->course_id);
        $student = User::findOrFail($request->student_id);

        $invoiceNo = 'INV-OC-' . date('Ymd') . '-' . rand(1000, 9999);
        $amount = (float) ($course->price ?? $course->original_price ?? 0);

        $offlineBankPayment = \App\Models\OfflineBankPayment::create([
            'student_id' => $student->id,
            'course_id' => $course->id,
            'amount' => $amount,
            'payment_date' => date('Y-m-d'),
            'reference_no' => $invoiceNo,
            'status' => 'pending'
        ]);

        $purchase = \App\Models\OnlineCoursePurchase::create([
            'student_id' => $student->id,
            'course_id' => $course->id,
            'income_id' => null,
            'amount' => $amount,
            'payment_method' => 'Offline',
            'payment_date' => date('Y-m-d'),
            'invoice_no' => $invoiceNo,
            'status' => 'Pending',
        ]);

        $purchase->load(['student', 'course']);

        return response()->json([
            'message' => 'Payment request submitted for admin verification',
            'purchase' => $purchase
        ]);
    }
}
