<?php

namespace App\Http\Controllers\Api\v1\Examination;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\CbseTemplate;

class CbseTemplateController extends Controller
{
    public function index(Request $request)
    {
        $query = CbseTemplate::query();

        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        return response()->json($query->paginate($request->per_page ?? 10));
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $template = CbseTemplate::create($request->all());
        return response()->json(['message' => 'Template created successfully', 'data' => $template]);
    }

    public function show($id)
    {
        return response()->json(CbseTemplate::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $template = CbseTemplate::findOrFail($id);
        $template->update($request->all());
        return response()->json(['message' => 'Template updated successfully', 'data' => $template]);
    }

    public function destroy($id)
    {
        CbseTemplate::findOrFail($id)->delete();
        return response()->json(['message' => 'Template deleted successfully']);
    }
}
