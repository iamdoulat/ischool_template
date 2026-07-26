<?php

namespace App\Http\Controllers\Api\v1\Communicate;

use App\Http\Controllers\Api\BaseController;
use App\Models\NotificationTemplate;
use Illuminate\Http\Request;

class NotificationTemplateController extends BaseController
{
    public function index(Request $request)
    {
        $query = NotificationTemplate::latest();
        if ($request->has('per_page') || $request->has('page')) {
            $perPage = (int) $request->input('per_page', 20);
            $templates = $query->paginate($perPage);
        } else {
            $templates = $query->get();
        }
        return $this->success($templates, 'Notification templates retrieved successfully');
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'template_id' => 'nullable|string|max:255',
        ]);

        $template = NotificationTemplate::create([
            'title' => $request->title,
            'message' => $request->message,
            'template_id' => $request->template_id,
        ]);

        return $this->success($template, 'Notification template created successfully', 201);
    }

    public function show($id)
    {
        $template = NotificationTemplate::findOrFail($id);
        return $this->success($template, 'Notification template retrieved successfully');
    }

    public function update(Request $request, $id)
    {
        $template = NotificationTemplate::findOrFail($id);

        $request->validate([
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'template_id' => 'nullable|string|max:255',
        ]);

        $template->update([
            'title' => $request->title,
            'message' => $request->message,
            'template_id' => $request->template_id,
        ]);

        return $this->success($template, 'Notification template updated successfully');
    }

    public function destroy($id)
    {
        $template = NotificationTemplate::findOrFail($id);
        $template->delete();

        return $this->success(null, 'Notification template deleted successfully');
    }
}
