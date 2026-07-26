<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\v1\Library\LibraryMemberController;
use App\Http\Controllers\Api\v1\Library\BookController;
use App\Http\Controllers\Api\v1\Library\BookIssueController;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('library/members', [LibraryMemberController::class, 'index']);
    Route::post('library/members', [LibraryMemberController::class, 'store']);
    Route::put('library/members/{userId}', [LibraryMemberController::class, 'update']);
    Route::delete('library/members/{userId}', [LibraryMemberController::class, 'destroy']);

    Route::get('library/members/{memberId}', [LibraryMemberController::class, 'show']);
    Route::get('library/book-issues/member/{memberId}', [BookIssueController::class, 'byMember']);
    Route::post('library/book-issues', [BookIssueController::class, 'store']);
    Route::put('library/book-issues/{id}/return', [BookIssueController::class, 'return']);

    Route::apiResource('library/books', BookController::class);
});
