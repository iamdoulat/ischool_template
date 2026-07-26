<?php

namespace App\Http\Controllers\Api\v1\DownloadCenter;

use App\Http\Controllers\Controller;
use App\Models\ContentType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ContentTypeController extends Controller
{
    public function index(Request $request)
    {
        $query = ContentType::query();

        if ($request->search) {
            $query->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('description', 'like', '%' . $request->search . '%');
        }

        if ($request->no_paginate) {
            $contentTypes = $query->get();
        } else {
            $contentTypes = $query->paginate($request->limit ?? 10);
        }

        return response()->json($contentTypes);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:content_types,name',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $contentType = ContentType::create($request->all());

        return response()->json([
            'message' => 'Content Type created successfully',
            'data' => $contentType
        ], 201);
    }

    public function show(ContentType $contentType)
    {
        return response()->json($contentType);
    }

    public function update(Request $request, ContentType $contentType)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:content_types,name,' . $contentType->id,
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $contentType->update($request->all());

        return response()->json([
            'message' => 'Content Type updated successfully',
            'data' => $contentType
        ]);
    }

    public function destroy(ContentType $contentType)
    {
        $contentType->delete();

        return response()->json([
            'message' => 'Content Type deleted successfully'
        ]);
    }
}
