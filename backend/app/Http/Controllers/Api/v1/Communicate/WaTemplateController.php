<?php

namespace App\Http\Controllers\Api\v1\Communicate;

use App\Http\Controllers\Controller;
use App\Models\WaTemplate;
use Illuminate\Http\Request;

class WaTemplateController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $limit = $request->input('limit', 50);
        $search = $request->input('search');

        $query = WaTemplate::query();

        if ($search) {
            $query->where('title', 'like', "%{$search}%")
                  ->orWhere('message', 'like', "%{$search}%");
        }

        $templates = $query->latest()->paginate($limit);

        return response()->json($templates);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'template_id' => 'nullable|string|max:255',
            'message' => 'required|string',
        ]);

        $template = WaTemplate::create($validated);

        return response()->json([
            'message' => 'Template created successfully',
            'data' => $template
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(WaTemplate $waTemplate)
    {
        return response()->json($waTemplate);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, WaTemplate $waTemplate)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'template_id' => 'nullable|string|max:255',
            'message' => 'required|string',
        ]);

        $waTemplate->update($validated);

        return response()->json([
            'message' => 'Template updated successfully',
            'data' => $waTemplate
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(WaTemplate $waTemplate)
    {
        $waTemplate->delete();

        return response()->json([
            'message' => 'Template deleted successfully'
        ]);
    }
}
