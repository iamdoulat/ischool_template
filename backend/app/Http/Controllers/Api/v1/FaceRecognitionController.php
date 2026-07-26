<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Api\BaseController;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class FaceRecognitionController extends BaseController
{
    /**
     * Fetch users that could be registered
     */
    public function getUsers(Request $request): JsonResponse
    {
        $role = $request->query('role');
        
        $query = User::query();
        if ($role) {
            $query->where('role', $role);
        }
        
        $users = $query->select('id', 'name', 'email', 'role', 'face_descriptor', 'avatar')
                       ->orderBy('name', 'asc')
                       ->get();

        return $this->success($users, 'Users fetched successfully');
    }

    /**
     * Register a face descriptor for a user
     */
    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'face_descriptor' => 'required|array', 
        ]);

        $user = User::findOrFail($request->user_id);
        
        $user->face_descriptor = $request->input('face_descriptor'); 
        $user->save();

        return $this->success($user, 'Face registered successfully');
    }

    /**
     * Get users with face descriptors for recognition
     */
    public function recognize(Request $request): JsonResponse
    {
        $usersWithFaces = User::whereNotNull('face_descriptor')
                              ->select('id', 'name', 'role', 'avatar', 'face_descriptor')
                              ->get();

        return $this->success($usersWithFaces, 'Face descriptors fetched');
    }
}
