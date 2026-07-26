<?php

namespace App\Http\Controllers\Api\v1\Communicate;

use App\Http\Controllers\Controller;
use App\Models\EmailTemplate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class EmailTemplateController extends Controller
{
    public function index(Request $request)
    {
        $limit = $request->input('limit', 50);
        $search = $request->input('search');

        $query = EmailTemplate::query();

        if ($search) {
            $query->where('title', 'like', "%{$search}%")
                  ->orWhere('message', 'like', "%{$search}%");
        }

        $templates = $query->latest()->paginate($limit);

        return response()->json($templates);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'template_id' => 'nullable|string|max:255',
            'message' => 'required|string',
            'attachment' => 'nullable|file|mimes:pdf,jpg,jpeg,png,gif,doc,docx,pptx,xlsx,txt|max:5120',
        ]);

        $data = [
            'title' => $request->title,
            'template_id' => $request->template_id,
            'message' => $request->message,
        ];

        if ($request->hasFile('attachment')) {
            $data['attachment'] = $request->file('attachment')->store('communicate/template-attachments');
            $data['original_filename'] = $request->file('attachment')->getClientOriginalName();
        }

        $template = EmailTemplate::create($data);

        return response()->json([
            'message' => 'Template created successfully',
            'data' => $template
        ], 201);
    }

    public function show(EmailTemplate $emailTemplate)
    {
        return response()->json($emailTemplate);
    }

    public function update(Request $request, EmailTemplate $emailTemplate)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'template_id' => 'nullable|string|max:255',
            'message' => 'required|string',
            'attachment' => 'nullable|file|mimes:pdf,jpg,jpeg,png,gif,doc,docx,pptx,xlsx,txt|max:5120',
        ]);

        $data = [
            'title' => $request->title,
            'template_id' => $request->template_id,
            'message' => $request->message,
        ];

        if ($request->hasFile('attachment')) {
            if ($emailTemplate->attachment && Storage::exists($emailTemplate->attachment)) {
                Storage::delete($emailTemplate->attachment);
            }
            $data['attachment'] = $request->file('attachment')->store('communicate/template-attachments');
            $data['original_filename'] = $request->file('attachment')->getClientOriginalName();
        } elseif ($request->input('remove_attachment') === '1') {
            if ($emailTemplate->attachment && Storage::exists($emailTemplate->attachment)) {
                Storage::delete($emailTemplate->attachment);
            }
            $data['attachment'] = null;
            $data['original_filename'] = null;
        }

        $emailTemplate->update($data);

        return response()->json([
            'message' => 'Template updated successfully',
            'data' => $emailTemplate
        ]);
    }

    public function destroy(EmailTemplate $emailTemplate)
    {
        if ($emailTemplate->attachment && Storage::exists($emailTemplate->attachment)) {
            Storage::delete($emailTemplate->attachment);
        }

        $emailTemplate->delete();

        return response()->json([
            'message' => 'Template deleted successfully'
        ]);
    }

    public function downloadAttachment($id)
    {
        $template = EmailTemplate::find($id);
        if (!$template || !$template->attachment || !Storage::exists($template->attachment)) {
            return response()->json(['message' => 'Attachment not found'], 404);
        }

        $filename = $template->original_filename ?: basename($template->attachment);
        return response()->download(Storage::path($template->attachment), $filename);
    }
}
