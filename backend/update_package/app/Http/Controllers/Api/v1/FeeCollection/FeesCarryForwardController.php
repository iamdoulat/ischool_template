<?php

namespace App\Http\Controllers\Api\v1\FeeCollection;

use App\Http\Controllers\Api\BaseController;
use App\Models\User;
use App\Models\StudentFeeMaster;
use App\Models\FeePayment;
use App\Models\AcademicSession;
use App\Models\FeeType;
use App\Models\FeeGroup;
use App\Models\FeeMaster;
use App\Models\GeneralSetting;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class FeesCarryForwardController extends BaseController
{
    /**
     * Search students for fees carry forward.
     */
    public function search(Request $request): JsonResponse
    {
        $request->validate([
            'school_class_id' => 'required|exists:school_classes,id',
            'section_id' => 'required|exists:sections,id',
        ]);

        // Get current and previous sessions
        $currentSessionId = GeneralSetting::first()->session ?? AcademicSession::where('is_active', true)->first()?->id;
        $previousSession = AcademicSession::where('id', '<', $currentSessionId)->orderBy('id', 'desc')->first();

        if (!$previousSession) {
            return $this->error('No previous session found to carry forward from.', 400);
        }

        // Get students in the selected class and section
        $students = User::where('role', 'Student')
            ->where('school_class_id', $request->school_class_id)
            ->where('section_id', $request->section_id)
            ->get();

        $results = [];

        foreach ($students as $student) {
            // Calculate balance from previous session
            $previousFees = StudentFeeMaster::with(['feeMaster', 'payments'])
                ->where('student_id', $student->id)
                ->where('academic_session_id', $previousSession->id)
                ->get();

            $totalAmount = 0;
            $totalPaid = 0;

            foreach ($previousFees as $fee) {
                $totalAmount += $fee->feeMaster->amount;
                $totalPaid += $fee->payments->sum('amount');
            }

            $balance = $totalAmount - $totalPaid;

            // Check if already carried forward to current session
            $isCarriedForward = StudentFeeMaster::where('student_id', $student->id)
                ->where('academic_session_id', $currentSessionId)
                ->whereHas('feeMaster.feeType', function($query) {
                    $query->where('name', 'Previous Session Balance');
                })
                ->exists();

            $results[] = [
                'id' => $student->id,
                'admission_no' => $student->admission_no,
                'name' => $student->name . ' ' . $student->last_name,
                'father_name' => $student->father_name,
                'balance' => $balance,
                'is_carried_forward' => $isCarriedForward,
            ];
        }

        return $this->success($results, 'Students retrieved successfully');
    }

    /**
     * Save fees carry forward for multiple students.
     */
    public function save(Request $request): JsonResponse
    {
        $request->validate([
            'students' => 'required|array',
            'students.*.student_id' => 'required|exists:users,id',
            'students.*.amount' => 'required|numeric|min:0',
        ]);

        $currentSessionId = GeneralSetting::first()->session ?? AcademicSession::where('is_active', true)->first()?->id;

        // Ensure "Previous Session Balance" FeeType and FeeGroup exist
        $feeType = FeeType::firstOrCreate(
            ['name' => 'Previous Session Balance'],
            ['code' => 'PSB', 'description' => 'Balance carried forward from previous session']
        );

        $feeGroup = FeeGroup::firstOrCreate(
            ['name' => 'Balance Master'],
            ['description' => 'Group for balance carry forward']
        );

        DB::beginTransaction();
        try {
            foreach ($request->students as $item) {
                // Check if already exists for current session
                $existing = StudentFeeMaster::where('student_id', $item['student_id'])
                    ->where('academic_session_id', $currentSessionId)
                    ->whereHas('feeMaster.feeType', function($query) use ($feeType) {
                        $query->where('id', $feeType->id);
                    })
                    ->first();

                if ($existing) {
                    continue; // Skip if already carried forward
                }

                // Create FeeMaster for this student in current session if it doesn't exist?
                // Usually we create a unique FeeMaster or use a generic one.
                // For carry forward, it's often unique per student if the amounts vary,
                // but FeeMaster is usually per group/type. 
                // Let's create a specific FeeMaster for this carry forward if needed,
                // or just a generic one for the group.
                
                $feeMaster = FeeMaster::create([
                    'fee_group_id' => $feeGroup->id,
                    'fee_type_id' => $feeType->id,
                    'due_date' => now()->format('Y-m-d'),
                    'amount' => $item['amount'],
                    'session_id' => $currentSessionId,
                ]);

                StudentFeeMaster::create([
                    'student_id' => $item['student_id'],
                    'fee_master_id' => $feeMaster->id,
                    'academic_session_id' => $currentSessionId,
                    'is_active' => true,
                ]);
            }

            DB::commit();
            return $this->success(null, 'Fees carried forward successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('Failed to carry forward fees: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Search students for deleting fees carry forward.
     */
    public function deleteSearch(Request $request): JsonResponse
    {
        $request->validate([
            'school_class_id' => 'required|exists:school_classes,id',
            'section_id' => 'required|exists:sections,id',
        ]);

        $currentSessionId = GeneralSetting::first()->session ?? AcademicSession::where('is_active', true)->first()?->id;

        $students = User::where('role', 'Student')
            ->where('school_class_id', $request->school_class_id)
            ->where('section_id', $request->section_id)
            ->get();

        $results = [];

        foreach ($students as $student) {
            $carryForwardRecord = StudentFeeMaster::with('feeMaster')
                ->where('student_id', $student->id)
                ->where('academic_session_id', $currentSessionId)
                ->whereHas('feeMaster.feeType', function($query) {
                    $query->where('name', 'Previous Session Balance');
                })
                ->first();

            if ($carryForwardRecord) {
                $results[] = [
                    'id' => $student->id,
                    'admission_no' => $student->admission_no,
                    'name' => $student->name . ' ' . $student->last_name,
                    'father_name' => $student->father_name,
                    'roll_number' => $student->roll_no ?? '-',
                    'admission_date' => $student->admission_date ? $student->admission_date->format('m/d/Y') : '-',
                    'balance' => $carryForwardRecord->feeMaster->amount,
                    'student_fee_master_id' => $carryForwardRecord->id,
                    'fee_master_id' => $carryForwardRecord->fee_master_id,
                ];
            }
        }

        return $this->success($results, 'Carried forward students retrieved successfully');
    }

    /**
     * Delete fees carry forward for multiple students.
     */
    public function delete(Request $request): JsonResponse
    {
        $request->validate([
            'student_fee_master_ids' => 'required|array',
            'student_fee_master_ids.*' => 'required|exists:student_fee_masters,id',
        ]);

        DB::beginTransaction();
        try {
            foreach ($request->student_fee_master_ids as $id) {
                $sfm = StudentFeeMaster::find($id);
                if ($sfm) {
                    $paymentsExist = FeePayment::where('student_fee_master_id', $id)->exists();
                    if ($paymentsExist) {
                        throw new \Exception("Cannot delete carry forward for a student who has already made payments towards it.");
                    }

                    $feeMasterId = $sfm->fee_master_id;
                    $sfm->delete();
                    
                    $fm = FeeMaster::find($feeMasterId);
                    if ($fm && $fm->feeType->name === 'Previous Session Balance') {
                        $fm->delete();
                    }
                }
            }

            DB::commit();
            return $this->success(null, 'Carry forward records deleted successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('Failed to delete carry forward records: ' . $e->getMessage(), 500);
        }
    }
}
