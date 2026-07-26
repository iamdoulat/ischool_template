<?php

namespace App\Http\Controllers\Api\v1\Reports;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\BookIssue;
use Illuminate\Http\Request;

class LibraryReportController extends Controller
{
    /** ------------------------------------------------------------------ */
    /*  GET /reports/library/issue                                          */
    /** ------------------------------------------------------------------ */
    public function getBookIssueReport(Request $request)
    {
        $searchType  = $request->query('search_type', 'all');
        $memberType  = $request->query('member_type', 'all');

        $query = BookIssue::with('book');

        if ($memberType && $memberType !== 'all' && $memberType !== 'All') {
            $query->where('member_type', $memberType);
        }

        if ($searchType && $searchType !== 'all_time') {
            $today = now();
            switch ($searchType) {
                case 'today':
                    $query->whereDate('issue_date', $today->toDateString());
                    break;
                case 'this_week':
                    $query->whereBetween('issue_date', [$today->copy()->startOfWeek(), $today->copy()->endOfWeek()]);
                    break;
                case 'last_week':
                    $query->whereBetween('issue_date', [$today->copy()->subWeek()->startOfWeek(), $today->copy()->subWeek()->endOfWeek()]);
                    break;
                case 'this_month':
                    $query->whereMonth('issue_date', $today->month)->whereYear('issue_date', $today->year);
                    break;
                case 'last_month':
                    $query->whereMonth('issue_date', $today->copy()->subMonth()->month)->whereYear('issue_date', $today->copy()->subMonth()->year);
                    break;
                case 'this_year':
                    $query->whereYear('issue_date', $today->year);
                    break;
            }
        }

        $issues = $query->orderBy('issue_date', 'desc')->get()->map(function ($issue) {
            return [
                'bookTitle'   => optional($issue->book)->title ?? '-',
                'bookNumber'  => optional($issue->book)->book_number ?? '-',
                'issueDate'   => $issue->issue_date ? \Carbon\Carbon::parse($issue->issue_date)->format('m/d/Y') : '-',
                'dueDate'     => $issue->due_date ? \Carbon\Carbon::parse($issue->due_date)->format('m/d/Y') : '-',
                'memberId'    => $issue->member_id,
                'cardNo'      => $issue->library_card_no,
                'admissionNo' => $issue->admission_no ?? '-',
                'issueBy'     => $issue->issued_by,
                'memberType'  => $issue->member_type,
            ];
        });

        return response()->json([
            'data' => $issues,
        ]);
    }

    /** ------------------------------------------------------------------ */
    /*  GET /reports/library/due                                            */
    /** ------------------------------------------------------------------ */
    public function getBookDueReport(Request $request)
    {
        $memberType = $request->query('member_type', 'all');

        $searchType = $request->query('search_type', 'all_time');

        // Book Due Report typically shows books that haven't been returned yet
        $query = BookIssue::with('book')->whereNull('return_date');

        if ($memberType && $memberType !== 'all' && $memberType !== 'All') {
            $query->where('member_type', $memberType);
        }

        if ($searchType && $searchType !== 'all_time') {
            $today = now();
            switch ($searchType) {
                case 'today':
                    $query->whereDate('due_date', $today->toDateString());
                    break;
                case 'this_week':
                    $query->whereBetween('due_date', [$today->copy()->startOfWeek(), $today->copy()->endOfWeek()]);
                    break;
                case 'last_week':
                    $query->whereBetween('due_date', [$today->copy()->subWeek()->startOfWeek(), $today->copy()->subWeek()->endOfWeek()]);
                    break;
                case 'this_month':
                    $query->whereMonth('due_date', $today->month)->whereYear('due_date', $today->year);
                    break;
                case 'last_month':
                    $query->whereMonth('due_date', $today->copy()->subMonth()->month)->whereYear('due_date', $today->copy()->subMonth()->year);
                    break;
                case 'this_year':
                    $query->whereYear('due_date', $today->year);
                    break;
            }
        }

        $issues = $query->orderBy('due_date', 'asc')->get()->map(function ($issue) {
            return [
                'bookTitle'   => optional($issue->book)->title ?? '-',
                'bookNumber'  => optional($issue->book)->book_number ?? '-',
                'issueDate'   => $issue->issue_date ? \Carbon\Carbon::parse($issue->issue_date)->format('m/d/Y') : '-',
                'dueDate'     => $issue->due_date ? \Carbon\Carbon::parse($issue->due_date)->format('m/d/Y') : '-',
                'memberId'    => $issue->member_id,
                'cardNo'      => $issue->library_card_no,
                'admissionNo' => $issue->admission_no ?? '-',
                'issueBy'     => $issue->issued_by,
                'memberType'  => $issue->member_type,
            ];
        });

        return response()->json([
            'data' => $issues,
        ]);
    }

    /** ------------------------------------------------------------------ */
    /*  GET /reports/library/inventory                                      */
    /** ------------------------------------------------------------------ */
    public function getBookInventoryReport(Request $request)
    {
        $search = $request->query('search');

        $query = Book::query()
            ->select([
                'id',
                'title',
                'book_number',
                'isbn_number',
                'publisher',
                'author',
                'subject',
                'rack_number',
                'qty',
                'available',
                'price',
                'post_date',
            ]);

        $searchType = $request->query('search_type', 'all_time');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('title',       'like', "%{$search}%")
                  ->orWhere('book_number', 'like', "%{$search}%")
                  ->orWhere('isbn_number', 'like', "%{$search}%")
                  ->orWhere('publisher',   'like', "%{$search}%")
                  ->orWhere('author',      'like', "%{$search}%")
                  ->orWhere('subject',     'like', "%{$search}%");
            });
        }

        if ($searchType && $searchType !== 'all_time') {
            $today = now();
            switch ($searchType) {
                case 'today':
                    $query->whereDate('post_date', $today->toDateString());
                    break;
                case 'this_week':
                    $query->whereBetween('post_date', [$today->copy()->startOfWeek(), $today->copy()->endOfWeek()]);
                    break;
                case 'last_week':
                    $query->whereBetween('post_date', [$today->copy()->subWeek()->startOfWeek(), $today->copy()->subWeek()->endOfWeek()]);
                    break;
                case 'this_month':
                    $query->whereMonth('post_date', $today->month)->whereYear('post_date', $today->year);
                    break;
                case 'last_month':
                    $query->whereMonth('post_date', $today->copy()->subMonth()->month)->whereYear('post_date', $today->copy()->subMonth()->year);
                    break;
                case 'this_year':
                    $query->whereYear('post_date', $today->year);
                    break;
            }
        }

        $books = $query->orderBy('title')->get()->map(function ($book) {
            return [
                'id'          => $book->id,
                'bookTitle'   => $book->title,
                'bookNumber'  => $book->book_number,
                'isbnNumber'  => $book->isbn_number,
                'publisher'   => $book->publisher,
                'author'      => $book->author,
                'subject'     => $book->subject,
                'rackNumber'  => $book->rack_number,
                'qty'         => (int) $book->qty,
                'available'   => (int) $book->available,
                'issued'      => max(0, (int) $book->qty - (int) $book->available),
                'bookPrice'   => number_format((float) $book->price, 2),
                'postDate'    => $book->post_date
                    ? \Carbon\Carbon::parse($book->post_date)->format('m/d/Y')
                    : null,
            ];
        });

        return response()->json([
            'data' => $books,
        ]);
    }

    /** ------------------------------------------------------------------ */
    /*  GET /reports/library/return                                         */
    /** ------------------------------------------------------------------ */
    public function getBookIssueReturnReport(Request $request)
    {
        $searchType = $request->query('search_type', 'all_time');

        $query = BookIssue::with('book')->whereNotNull('return_date');

        if ($searchType && $searchType !== 'all_time') {
            $today = now();
            switch ($searchType) {
                case 'today':
                    $query->whereDate('return_date', $today->toDateString());
                    break;
                case 'this_week':
                    $query->whereBetween('return_date', [$today->copy()->startOfWeek(), $today->copy()->endOfWeek()]);
                    break;
                case 'last_week':
                    $query->whereBetween('return_date', [$today->copy()->subWeek()->startOfWeek(), $today->copy()->subWeek()->endOfWeek()]);
                    break;
                case 'this_month':
                    $query->whereMonth('return_date', $today->month)->whereYear('return_date', $today->year);
                    break;
                case 'last_month':
                    $query->whereMonth('return_date', $today->copy()->subMonth()->month)->whereYear('return_date', $today->copy()->subMonth()->year);
                    break;
                case 'this_year':
                    $query->whereYear('return_date', $today->year);
                    break;
            }
        }

        $issues = $query->orderBy('return_date', 'desc')->get()->map(function ($issue) {
            return [
                'id'          => $issue->id,
                'bookTitle'   => optional($issue->book)->title ?? '-',
                'bookNumber'  => optional($issue->book)->book_number ?? '-',
                'issueDate'   => $issue->issue_date ? \Carbon\Carbon::parse($issue->issue_date)->format('m/d/Y') : '-',
                'returnDate'  => $issue->return_date ? \Carbon\Carbon::parse($issue->return_date)->format('m/d/Y') : '-',
                'memberId'    => $issue->member_id,
                'cardNo'      => $issue->library_card_no,
                'issueBy'     => $issue->issued_by,
                'memberType'  => $issue->member_type,
            ];
        });

        return response()->json([
            'data' => $issues,
        ]);
    }
}
