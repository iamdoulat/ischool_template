<?php

namespace App\Http\Controllers\Api\v1\Attendance;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class FaceRegistrationController extends Controller
{
    /**
     * Get users for face registration.
     */
    public function getUsers(Request $request)
    {
        $search = $request->query('search');
        $role = $request->query('role'); // e.g., 'Student', 'Staff'

        $query = User::query();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('admission_no', 'like', "%{$search}%")
                  ->orWhere('staff_id', 'like', "%{$search}%");
            });
        }

        if ($role) {
            $query->where('role', $role);
        }

        $users = $query->select('id', 'name', 'role', 'admission_no', 'staff_id', 'avatar', 'face_descriptor')
            ->limit(30)
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'role' => $user->role,
                    'admission_no' => $user->admission_no,
                    'staff_id' => $user->staff_id,
                    'avatar' => $user->avatar,
                    'has_face' => !is_null($user->face_descriptor),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $users
        ]);
    }

    /**
     * Register a user's face descriptor.
     */
    public function registerFace(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'face_descriptor' => 'required|array|size:128',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid validation.',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::find($request->user_id);
        $user->face_descriptor = $request->face_descriptor;
        $user->save();

        return response()->json([
            'success' => true,
            'message' => "Face registered successfully for {$user->name}."
        ]);
    }

    /**
     * Get only registered face descriptors for attendance matching.
     */
    public function getRegisteredFaces()
    {
        $users = User::whereNotNull('face_descriptor')
            ->select('id', 'name', 'role', 'admission_no', 'staff_id', 'face_descriptor')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $users
        ]);
    }
}
