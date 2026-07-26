<?php

namespace App\Http\Controllers\Api\v1\Examination;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\CbseExamCategory;

class CbseExamCategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = CbseExamCategory::query();

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

        $category = CbseExamCategory::create($request->all());
        return response()->json(['message' => 'CBSE exam category created successfully', 'data' => $category]);
    }

    public function show($id)
    {
        return response()->json(CbseExamCategory::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $category = CbseExamCategory::findOrFail($id);
        $category->update($request->all());
        return response()->json(['message' => 'CBSE exam category updated successfully', 'data' => $category]);
    }

    public function destroy($id)
    {
        CbseExamCategory::findOrFail($id)->delete();
        return response()->json(['message' => 'CBSE exam category deleted successfully']);
    }
}
