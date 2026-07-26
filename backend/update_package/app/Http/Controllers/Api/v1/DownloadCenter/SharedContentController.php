<?php

namespace App\Http\Controllers\Api\v1\DownloadCenter;

use App\Http\Controllers\Controller;
use App\Models\SharedContent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;

class SharedContentController extends Controller
{
    public function index(Request $request)
    {
        $query = SharedContent::with('sender');

        if ($request->search) {
            $query->where('title', 'like', '%' . $request->search . '%')
                  ->orWhere('description', 'like', '%' . $request->search . '%');
        }

        $sharedContents = $query->latest()->paginate($request->limit ?? 10);

        return response()->json($sharedContents);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'send_to' => 'required|string',
            'share_date' => 'required|date',
            'valid_upto' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->all();
        $data['shared_by'] = Auth::id();

        $sharedContent = SharedContent::create($data);

        return response()->json([
            'message' => 'Content shared successfully',
            'data' => $sharedContent
        ], 201);
    }

    public function show(SharedContent $sharedContent)
    {
        return response()->json($sharedContent->load('sender'));
    }

    public function destroy(SharedContent $sharedContent)
    {
        $sharedContent->delete();

        return response()->json([
            'message' => 'Shared content deleted successfully'
        ]);
    }
}
