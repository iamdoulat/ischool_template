<?php

namespace App\Http\Controllers\Api\v1\Communicate;

use App\Http\Controllers\Controller;
use App\Models\Notice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Database\QueryException;

class NoticeController extends Controller
{
    public function index(Request $request)
    {
        $query = Notice::query();

        if ($request->search) {
            $query->where('title', 'like', '%' . $request->search . '%')
                  ->orWhere('message', 'like', '%' . $request->search . '%');
        }

        $perPage = (int) $request->input('per_page', 20);
        $notices = $query->latest()->paginate($perPage);

        return response()->json($notices);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'publish_date' => 'required|date',
            'notice_date' => 'required|date',
            'notify_to' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $notice = Notice::create($request->all());
        } catch (QueryException $e) {
            $msg = $e->getMessage();
            if (str_contains($msg, 'Unknown column')) {
                DB::statement('ALTER TABLE notices ADD notify_to VARCHAR(255) NULL AFTER message_to');
                $notice = Notice::create($request->all());
            } elseif (str_contains($msg, 'Data too long')) {
                DB::statement('ALTER TABLE notices MODIFY message LONGTEXT');
                $notice = Notice::create($request->all());
            } else {
                throw $e;
            }
        }

        return response()->json([
            'message' => 'Notice posted successfully',
            'data' => $notice
        ], 201);
    }

    public function show(Notice $notice)
    {
        return response()->json($notice);
    }

    public function update(Request $request, Notice $notice)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'publish_date' => 'required|date',
            'notice_date' => 'required|date',
            'notify_to' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $notice->update($request->all());
        } catch (QueryException $e) {
            $msg = $e->getMessage();
            if (str_contains($msg, 'Unknown column')) {
                DB::statement('ALTER TABLE notices ADD notify_to VARCHAR(255) NULL AFTER message_to');
                $notice->update($request->all());
            } elseif (str_contains($msg, 'Data too long')) {
                DB::statement('ALTER TABLE notices MODIFY message LONGTEXT');
                $notice->update($request->all());
            } else {
                throw $e;
            }
        }

        return response()->json([
            'message' => 'Notice updated successfully',
            'data' => $notice
        ]);
    }

    public function destroy(Notice $notice)
    {
        $notice->delete();

        return response()->json([
            'message' => 'Notice deleted successfully'
        ]);
    }

    public function destroyAll(Request $request)
    {
        $ids = $request->input('ids');
        if ($ids && is_array($ids)) {
            Notice::whereIn('id', $ids)->delete();
            $count = count($ids);
            return response()->json(['message' => "{$count} notice(s) deleted successfully"]);
        }
        Notice::truncate();
        return response()->json(['message' => 'Notice board cleared successfully']);
    }
}
