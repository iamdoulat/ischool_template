<?php

namespace App\Http\Controllers\Api\v1\Examination;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\MarksDivision;

class MarksDivisionController extends Controller
{
    public function index(Request $request)
    {
        $query = MarksDivision::query();

        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        return response()->json($query->paginate($request->per_page ?? 10));
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'percent_from' => 'required|numeric|min:0|max:100',
            'percent_upto' => 'required|numeric|min:0|max:100'
        ]);

        $marksDivision = MarksDivision::create($request->only(['name', 'percent_from', 'percent_upto']));
        return response()->json(['message' => 'Marks division created successfully', 'data' => $marksDivision]);
    }

    public function show($id)
    {
        return response()->json(MarksDivision::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'percent_from' => 'required|numeric|min:0|max:100',
            'percent_upto' => 'required|numeric|min:0|max:100'
        ]);

        $marksDivision = MarksDivision::findOrFail($id);
        $marksDivision->update($request->only(['name', 'percent_from', 'percent_upto']));
        return response()->json(['message' => 'Marks division updated successfully', 'data' => $marksDivision]);
    }

    public function destroy($id)
    {
        MarksDivision::findOrFail($id)->delete();
        return response()->json(['message' => 'Marks division deleted successfully']);
    }
}
