<?php

namespace App\Http\Controllers\Api\v1\Library;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\User;
use App\Models\BookIssue;
use App\Models\LibraryMember;
use Illuminate\Support\Facades\Validator;

class LibraryMemberController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        if ($request->only_members) {
            $members = LibraryMember::with(['user' => function($q) {
                $q->with(['schoolClass', 'section']);
            }])
            ->when($request->search, function ($query, $search) {
                $query->where('member_id', 'like', "%{$search}%")
                      ->orWhere('library_card_no', 'like', "%{$search}%")
                      ->orWhereHas('user', function($q) use ($search) {
                          $q->where('name', 'like', "%{$search}%");
                      });
            })
            ->latest()
            ->paginate($request->limit ?? 10);

            return response()->json($members);
        }

        $type = $request->type ?? 'staff'; // staff or student

        $query = User::query()
            ->when($type === 'staff', function($q) {
                $q->where('role', '!=', 'Student');
            })
            ->when($type === 'student', function($q) {
                $q->where('role', 'Student');
            })
            ->with('libraryMember')
            ->when($request->search, function ($query, $search) {
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('staff_id', 'like', "%{$search}%");
                });
            });

        $users = $query->latest()->paginate($request->limit ?? 10);

        return response()->json($users);
    }

    /**
     * Display a single member by member_id.
     */
    public function show($memberId)
    {
        $member = LibraryMember::with(['user.schoolClass', 'user.section'])
            ->where('member_id', $memberId)
            ->first();

        if (!$member) {
            return response()->json(['message' => 'Member not found'], 404);
        }

        return response()->json([
            'message' => 'Member retrieved successfully',
            'data' => $member
        ]);
    }

    /**
     * Store a newly created resource (Add Member).
     */
    public function store(Request $request)
    {
        if (in_array($request->user()->role, ['Student', 'Parent'])) {
            return response()->json(['message' => 'Unauthorized access'], 403);
        }

        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'library_card_no' => 'nullable|string|unique:library_members,library_card_no',
            'member_id' => 'required|string|unique:library_members,member_id',
            'member_type' => 'required|string|in:staff,student',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $member = LibraryMember::create($request->all());

        return response()->json([
            'message' => 'Member added successfully',
            'data' => $member
        ], 201);
    }

    /**
     * Update the specified resource (Edit Membership).
     */
    public function update(Request $request, $userId)
    {
        if (in_array($request->user()->role, ['Student', 'Parent'])) {
            return response()->json(['message' => 'Unauthorized access'], 403);
        }

        $member = LibraryMember::where('user_id', $userId)->firstOrFail();

        $validator = Validator::make($request->all(), [
            'library_card_no' => 'nullable|string|unique:library_members,library_card_no,' . $member->id,
            'member_id' => 'required|string|unique:library_members,member_id,' . $member->id,
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $member->update($request->only(['library_card_no', 'member_id']));

        return response()->json([
            'message' => 'Member updated successfully',
            'data' => $member
        ]);
    }

    /**
     * Remove the specified resource (Remove Membership).
     */
    public function destroy(Request $request, $userId)
    {
        if (in_array($request->user()->role, ['Student', 'Parent'])) {
            return response()->json(['message' => 'Unauthorized access'], 403);
        }

        $member = LibraryMember::where('user_id', $userId)->first();
        
        if (!$member) {
            return response()->json(['message' => 'Member not found'], 404);
        }

        $member->delete();

        return response()->json([
            'message' => 'Membership removed successfully'
        ]);
    }
}
