<?php

namespace App\Http\Controllers\Api\v1\Communicate;

use App\Http\Controllers\Controller;
use App\Models\SmsTemplate;
use Illuminate\Http\Request;

class SmsTemplateController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $limit = $request->input('limit', 50);
        $search = $request->input('search');

        $query = SmsTemplate::query();

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

        $template = SmsTemplate::create($validated);

        return response()->json([
            'message' => 'Template created successfully',
            'data' => $template
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(SmsTemplate $smsTemplate)
    {
        return response()->json($smsTemplate);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, SmsTemplate $smsTemplate)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'template_id' => 'nullable|string|max:255',
            'message' => 'required|string',
        ]);

        $smsTemplate->update($validated);

        return response()->json([
            'message' => 'Template updated successfully',
            'data' => $smsTemplate
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(SmsTemplate $smsTemplate)
    {
        $smsTemplate->delete();

        return response()->json([
            'message' => 'Template deleted successfully'
        ]);
    }
}
