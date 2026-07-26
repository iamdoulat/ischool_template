<?php

namespace App\Http\Controllers\Api\v1\SystemSetting;

use App\Http\Controllers\Controller;
use App\Models\AcademicSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Exception;
use Illuminate\Support\Facades\DB;

class SessionSettingController extends Controller
{
    /**
     * Display a listing of the sessions.
     */
    public function index()
    {
        try {
            $sessions = AcademicSession::orderBy('id', 'desc')->get();
            return response()->json([
                'success' => true,
                'data' => $sessions
            ], 200);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve sessions: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created session.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'session' => 'required|string|max:255|unique:academic_sessions,session',
            'is_active' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $isActive = $request->input('is_active', false);

            if ($isActive) {
                // Deactivate all other sessions
                AcademicSession::where('is_active', true)->update(['is_active' => false]);
            }

            $session = AcademicSession::query()->create([
                'session' => $request->session,
                'is_active' => $isActive,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Session created successfully',
                'data' => $session
            ], 201);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create session: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified session.
     */
    public function update(Request $request, $id)
    {
        $session = AcademicSession::find($id);

        if (!$session) {
            return response()->json([
                'success' => false,
                'message' => 'Session not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'session' => 'required|string|max:255|unique:academic_sessions,session,' . $session->id,
            'is_active' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $isActive = $request->input('is_active', false);

            if ($isActive && !$session->is_active) {
                // If this session is being set to active, deactivate all others
                AcademicSession::where('is_active', true)->where('id', '!=', $id)->update(['is_active' => false]);
            }

            $session->session = $request->session;
            $session->is_active = $isActive;
            $session->save();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Session updated successfully',
                'data' => $session
            ], 200);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to update session: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified session.
     */
    public function destroy($id)
    {
        try {
            $session = AcademicSession::find($id);

            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found'
                ], 404);
            }

            if ($session->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete an active session. Please set another session as active first.'
                ], 400);
            }

            $session->delete();

            return response()->json([
                'success' => true,
                'message' => 'Session deleted successfully'
            ], 200);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete session: ' . $e->getMessage()
            ], 500);
        }
    }
}
