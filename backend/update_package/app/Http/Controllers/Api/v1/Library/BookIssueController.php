<?php

namespace App\Http\Controllers\Api\v1\Library;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\BookIssue;
use App\Models\LibraryMember;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class BookIssueController extends Controller
{
    public function byMember($memberId)
    {
        $member = LibraryMember::where('member_id', $memberId)->first();
        if (!$member) {
            return response()->json(['message' => 'Member not found'], 404);
        }

        $issues = BookIssue::with('book')
            ->where('member_id', $memberId)
            ->latest()
            ->paginate(request('limit', 10));

        return response()->json($issues);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'member_id' => 'required|string|exists:library_members,member_id',
            'book_id' => 'required|exists:books,id',
            'due_date' => 'required|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $book = Book::findOrFail($request->book_id);
        if ($book->available < 1) {
            return response()->json(['message' => 'No copies available'], 422);
        }

        $member = LibraryMember::with('user')->where('member_id', $request->member_id)->firstOrFail();

        $issue = BookIssue::create([
            'book_id' => $request->book_id,
            'member_id' => $request->member_id,
            'library_card_no' => $member->library_card_no,
            'member_type' => $member->member_type,
            'admission_no' => $member->user?->admission_no,
            'issued_by' => auth()->user()?->name . ' (ID: ' . auth()->id() . ')',
            'issue_date' => now(),
            'due_date' => $request->due_date,
        ]);

        $book->decrement('available');

        return response()->json([
            'message' => 'Book issued successfully',
            'data' => $issue->load('book')
        ], 201);
    }

    public function return($id)
    {
        $issue = BookIssue::findOrFail($id);

        if ($issue->return_date) {
            return response()->json(['message' => 'Book already returned'], 422);
        }

        $issue->update(['return_date' => now()]);

        $issue->book->increment('available');

        return response()->json([
            'message' => 'Book returned successfully',
            'data' => $issue->load('book')
        ]);
    }
}
