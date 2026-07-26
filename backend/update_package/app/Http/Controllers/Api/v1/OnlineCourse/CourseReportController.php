<?php

namespace App\Http\Controllers\Api\v1\OnlineCourse;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\OnlineCoursePurchase;
use Carbon\Carbon;

class CourseReportController extends Controller
{
    public function getCriteria()
    {
        return response()->json([
            'search_types' => [
                ['id' => 'all', 'label' => 'All'],
                ['id' => 'today', 'label' => 'Today'],
                ['id' => 'this_week', 'label' => 'This Week'],
                ['id' => 'this_month', 'label' => 'This Month'],
                ['id' => 'this_year', 'label' => 'This Year'],
            ],
            'payment_types' => [
                ['id' => 'all', 'label' => 'All'],
                ['id' => 'online', 'label' => 'Online'],
                ['id' => 'offline', 'label' => 'Offline'],
            ],
            'payment_status' => [
                ['id' => 'all', 'label' => 'All'],
                ['id' => 'success', 'label' => 'Success'],
                ['id' => 'pending', 'label' => 'Pending'],
                ['id' => 'failed', 'label' => 'Failed'],
            ],
            'user_types' => [
                ['id' => 'all', 'label' => 'All'],
                ['id' => 'student', 'label' => 'Student'],
                ['id' => 'guest', 'label' => 'Guest'],
            ],
        ]);
    }

    public function index(Request $request)
    {
        $report_type = $request->get('report_type', 'purchase');
        
        $query = OnlineCoursePurchase::with(['student', 'course']);
        
        // Filter by report type specifications
        if ($report_type === 'complete') {
            $query->whereIn('status', ['Completed', 'Success', 'completed', 'success']);
        } elseif ($report_type === 'assignment') {
            $query->whereHas('course', function ($q) {
                $q->where('total_assignments', '>', 0);
            });
        } elseif ($report_type === 'exam_result') {
            $query->whereHas('course', function ($q) {
                $q->where('total_exams', '>', 0);
            });
        } elseif ($report_type === 'exam_attempt') {
            $query->whereHas('course', function ($q) {
                $q->where('total_exams', '>', 0)
                  ->orWhere('total_quizzes', '>', 0);
            });
        } elseif ($report_type === 'trending') {
            $query->orderBy('payment_date', 'desc');
        } elseif ($report_type === 'sell_count') {
            $query->orderBy('course_id');
        }

        // Filter by Search Type (Date Range)
        $search_type = $request->get('search_type', 'all');
        if ($search_type !== 'all') {
            $now = Carbon::now();
            if ($search_type === 'today') {
                $query->whereDate('payment_date', Carbon::today());
            } elseif ($search_type === 'this_week') {
                $query->whereBetween('payment_date', [
                    $now->copy()->startOfWeek()->format('Y-m-d'),
                    $now->copy()->endOfWeek()->format('Y-m-d')
                ]);
            } elseif ($search_type === 'this_month') {
                $query->whereBetween('payment_date', [
                    $now->copy()->startOfMonth()->format('Y-m-d'),
                    $now->copy()->endOfMonth()->format('Y-m-d')
                ]);
            } elseif ($search_type === 'this_year') {
                $query->whereBetween('payment_date', [
                    $now->copy()->startOfYear()->format('Y-m-d'),
                    $now->copy()->endOfYear()->format('Y-m-d')
                ]);
            }
        }
        
        // Filter by Payment Type (Online vs Offline method)
        $payment_type = $request->get('payment_type', 'all');
        if ($payment_type !== 'all') {
            if ($payment_type === 'offline') {
                $query->where('payment_method', 'Offline');
            } else {
                $query->where('payment_method', '!=', 'Offline');
            }
        }
        
        // Filter by Payment Status
        $payment_status = $request->get('payment_status', 'all');
        if ($payment_status !== 'all') {
            if ($payment_status === 'success') {
                $query->whereIn('status', ['Completed', 'Success', 'completed', 'success']);
            } elseif ($payment_status === 'pending') {
                $query->whereIn('status', ['Pending', 'pending']);
            } elseif ($payment_status === 'failed') {
                $query->whereIn('status', ['Failed', 'failed']);
            }
        }
        
        // Filter by User Type (Student vs Guest role)
        $user_type = $request->get('user_type', 'all');
        if ($user_type !== 'all') {
            if ($user_type === 'student') {
                $query->whereHas('student', function ($q) {
                    $q->role('Student');
                });
            } elseif ($user_type === 'guest') {
                $query->whereHas('student', function ($q) {
                    $q->role('Guest');
                });
            }
        }
        
        $per_page = (int) $request->get('per_page', 20);
        $paginated = $query->paginate($per_page);
        
        $formattedData = collect($paginated->items())->map(function ($purchase) {
            $role = $purchase->student->role ?? 'Student';
            $isOffline = strtolower($purchase->payment_method) === 'offline';
            $paymentType = $isOffline ? 'Offline' : 'Online';
            
            return [
                'id' => $purchase->id,
                'user_name' => $purchase->student->name ?? 'Unknown',
                'user_type' => $role,
                'date' => Carbon::parse($purchase->payment_date)->format('d/m/Y'),
                'course' => $purchase->course->title ?? 'N/A',
                'provider' => $purchase->course->instructor_name ?? 'Unknown',
                'payment_type' => $paymentType,
                'payment_method' => $purchase->payment_method,
                'price' => (float) $purchase->amount,
            ];
        });
        
        return response()->json([
            'data' => $formattedData,
            'total' => $paginated->total(),
            'last_page' => $paginated->lastPage(),
            'current_page' => $paginated->currentPage(),
            'from' => $paginated->firstItem() ?? 0,
            'to' => $paginated->lastItem() ?? 0,
        ]);
    }
}
