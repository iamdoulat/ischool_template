<?php

namespace App\Http\Controllers\Api\v1\Behaviour;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Incident;

class IncidentController extends Controller
{
    public function index(Request $request)
    {
        $query = Incident::query();

        if ($request->has('search') && $request->search) {
            $query->where('title', 'like', '%' . $request->search . '%')
                  ->orWhere('description', 'like', '%' . $request->search . '%');
        }

        return response()->json($query->paginate($request->per_page ?? 10));
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'point' => 'required|integer',
            'description' => 'nullable|string',
        ]);

        $incident = Incident::create($request->all());
        return response()->json(['message' => 'Incident created successfully', 'data' => $incident]);
    }

    public function show($id)
    {
        return response()->json(Incident::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'point' => 'required|integer',
            'description' => 'nullable|string',
        ]);

        $incident = Incident::findOrFail($id);
        $incident->update($request->all());
        return response()->json(['message' => 'Incident updated successfully', 'data' => $incident]);
    }

    public function destroy($id)
    {
        Incident::findOrFail($id)->delete();
        return response()->json(['message' => 'Incident deleted successfully']);
    }
}
