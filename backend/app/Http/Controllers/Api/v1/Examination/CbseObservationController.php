<?php

namespace App\Http\Controllers\Api\v1\Examination;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\CbseObservation;

class CbseObservationController extends Controller
{
    public function index(Request $request)
    {
        $query = CbseObservation::query();

        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('code', 'like', '%' . $request->search . '%');
        }

        return response()->json($query->paginate($request->per_page ?? 10));
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'term' => 'required|string',
        ]);

        $observation = CbseObservation::create($request->all());
        return response()->json(['message' => 'Observation created successfully', 'data' => $observation]);
    }

    public function show($id)
    {
        return response()->json(CbseObservation::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $observation = CbseObservation::findOrFail($id);
        $observation->update($request->all());
        return response()->json(['message' => 'Observation updated successfully', 'data' => $observation]);
    }

    public function destroy($id)
    {
        CbseObservation::findOrFail($id)->delete();
        return response()->json(['message' => 'Observation deleted successfully']);
    }
}
