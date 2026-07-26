<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\OnlineCourse;
use App\Models\OnlineCoursePurchase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CourseReportTest extends TestCase
{
    use RefreshDatabase;

    public function test_course_purchase_report_returns_real_data()
    {
        // Create an Admin user first (to use as instructor and for auth)
        $admin = User::factory()->create(['role' => 'Admin']);

        // 1. Create a Student user
        $student = User::factory()->create([
            'name' => 'Timmy Student',
            'role' => 'Student',
        ]);

        // 2. Create a Guest user
        $guest = User::factory()->create([
            'name' => 'John Guest',
            'role' => 'Guest',
        ]);

        // 3. Create course 1 (with assignments, exams, quizzes)
        $course1 = OnlineCourse::create([
            'title' => 'Laravel Advanced Mastery',
            'instructor_id' => $admin->id,
            'instructor_name' => 'Admin Instructor',
            'price' => 49.99,
            'total_assignments' => 2,
            'total_exams' => 1,
            'total_quizzes' => 3,
        ]);

        // 4. Create course 2 (empty metrics)
        $course2 = OnlineCourse::create([
            'title' => 'Basic HTML',
            'instructor_id' => $admin->id,
            'instructor_name' => 'Admin Instructor',
            'price' => 10.00,
            'total_assignments' => 0,
            'total_exams' => 0,
            'total_quizzes' => 0,
        ]);

        // 5. Create online course purchases in database
        OnlineCoursePurchase::create([
            'student_id' => $student->id,
            'course_id' => $course1->id,
            'amount' => 49.99,
            'payment_method' => 'Razorpay',
            'payment_date' => now()->format('Y-m-d'),
            'invoice_no' => 'INV-OC-0001',
            'status' => 'Completed',
        ]);

        OnlineCoursePurchase::create([
            'student_id' => $guest->id,
            'course_id' => $course2->id,
            'amount' => 10.00,
            'payment_method' => 'Offline',
            'payment_date' => now()->format('Y-m-d'),
            'invoice_no' => 'INV-OC-0002',
            'status' => 'Pending',
        ]);

        // Act as the admin to bypass auth:sanctum
        $this->actingAs($admin, 'sanctum');

        // 6. Test purchase report
        $response = $this->getJson('/api/v1/online-course/reports?report_type=purchase');
        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');

        // 7. Test complete report (only completed status)
        $responseComplete = $this->getJson('/api/v1/online-course/reports?report_type=complete');
        $responseComplete->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment(['user_name' => 'Timmy Student']);

        // 8. Test assignment report (only course 1 has assignments)
        $responseAssignment = $this->getJson('/api/v1/online-course/reports?report_type=assignment');
        $responseAssignment->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment(['course' => 'Laravel Advanced Mastery']);

        // 9. Test exam result report (only course 1 has exams)
        $responseExamResult = $this->getJson('/api/v1/online-course/reports?report_type=exam_result');
        $responseExamResult->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment(['course' => 'Laravel Advanced Mastery']);

        // 10. Test exam attempt report (course 1 has quizzes)
        $responseExamAttempt = $this->getJson('/api/v1/online-course/reports?report_type=exam_attempt');
        $responseExamAttempt->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment(['course' => 'Laravel Advanced Mastery']);

        // 11. Test trending report (returns records)
        $responseTrending = $this->getJson('/api/v1/online-course/reports?report_type=trending');
        $responseTrending->assertStatus(200)
            ->assertJsonCount(2, 'data');

        // 12. Test sell count report (returns records)
        $responseSell = $this->getJson('/api/v1/online-course/reports?report_type=sell_count');
        $responseSell->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }
}
