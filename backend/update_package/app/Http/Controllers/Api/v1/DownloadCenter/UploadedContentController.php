<?php

namespace App\Http\Controllers\Api\v1\DownloadCenter;

use App\Http\Controllers\Controller;
use App\Models\UploadedContent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;

class UploadedContentController extends Controller
{
    public function index(Request $request)
    {
        $query = UploadedContent::with(['contentType', 'uploader']);

        if ($request->search) {
            $query->where('title', 'like', '%' . $request->search . '%');
        }

        if ($request->content_type_id) {
            $query->where('content_type_id', $request->content_type_id);
        }

        $contents = $query->latest()->paginate($request->limit ?? 12);

        return response()->json($contents);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'content_type_id' => 'required|exists:content_types,id',
            'file' => 'required|file|max:10240', // 10MB limit
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $path = $request->file('file')->store('download-center', 'public');

        $content = UploadedContent::create([
            'title' => $request->title,
            'content_type_id' => $request->content_type_id,
            'file_path' => $path,
            'file_type' => $request->file('file')->getClientOriginalExtension(),
            'file_size' => $request->file('file')->getSize(),
            'uploader_id' => Auth::id(),
            'description' => $request->description,
            'share_date' => $request->share_date,
            'valid_upto' => $request->valid_upto,
            'is_public' => $request->is_public ?? false,
        ]);

        return response()->json([
            'message' => 'Content uploaded successfully',
            'data' => $content
        ], 201);
    }

    public function destroy(UploadedContent $uploadedContent)
    {
        Storage::disk('public')->delete($uploadedContent->file_path);
        $uploadedContent->delete();

        return response()->json([
            'message' => 'Content deleted successfully'
        ]);
    }

    public function update(Request $request, UploadedContent $uploadedContent)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'content_type_id' => 'required|exists:content_types,id',
            'file' => 'nullable|file|max:10240', // 10MB limit
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = [
            'title' => $request->title,
            'content_type_id' => $request->content_type_id,
            'description' => $request->description,
            'is_public' => $request->is_public ?? false,
        ];

        if ($request->hasFile('file')) {
            Storage::disk('public')->delete($uploadedContent->file_path);
            $path = $request->file('file')->store('download-center', 'public');
            $data['file_path'] = $path;
            $data['file_type'] = $request->file('file')->getClientOriginalExtension();
            $data['file_size'] = $request->file('file')->getSize();
        }

        $uploadedContent->update($data);

        return response()->json([
            'message' => 'Content updated successfully',
            'data' => $uploadedContent
        ]);
    }

    public function stats()
    {
        return response()->json([
            'total_documents' => UploadedContent::count(),
            'total_size' => UploadedContent::sum('file_size'),
        ]);
    }
}
