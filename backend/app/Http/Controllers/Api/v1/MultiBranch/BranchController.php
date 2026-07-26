<?php

namespace App\Http\Controllers\Api\v1\MultiBranch;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Branch;

class BranchController extends Controller
{
    public function index(Request $request)
    {
        $query = Branch::query();

        if ($request->has('search')) {
            $query->where('branch_name', 'like', '%' . $request->search . '%')
                  ->orWhere('branch_url', 'like', '%' . $request->search . '%');
        }

        return response()->json($query->paginate($request->per_page ?? 10));
    }

    public function store(Request $request)
    {
        $request->validate([
            'branch_name' => 'required|string|max:255',
            'branch_url' => 'required|url|max:255',
        ]);

        $branch = Branch::create($request->all());
        return response()->json(['message' => 'Branch created successfully', 'data' => $branch]);
    }

    public function show($id)
    {
        return response()->json(Branch::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'branch_name' => 'required|string|max:255',
            'branch_url' => 'required|url|max:255',
        ]);

        $branch = Branch::findOrFail($id);
        $branch->update($request->all());
        return response()->json(['message' => 'Branch updated successfully', 'data' => $branch]);
    }

    public function destroy($id)
    {
        Branch::findOrFail($id)->delete();
        return response()->json(['message' => 'Branch deleted successfully']);
    }
}
