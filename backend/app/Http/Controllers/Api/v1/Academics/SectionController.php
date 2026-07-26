<?php

namespace App\Http\Controllers\Api\v1\Academics;

use App\Http\Controllers\Api\BaseController;
use App\Models\Section;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use App\Models\AcademicSession;

class SectionController extends BaseController
{
    /**
     * Display a listing of distinct sections.
     */
    public function index(Request $request)
    {
        // Return all sections with class mapping (for pages like promote-students)
        if ($request->has('with_class') && $request->with_class == 'true') {
            $sections = Section::select('id', 'name', 'school_class_id')
                ->orderBy('school_class_id')
                ->orderBy('name')
                ->get();
            return $this->success($sections, 'Sections retrieved successfully');
        }

        // We group by name to only show unique section letters globally.
        $query = Section::query();

        if ($request->has('all_sessions') && $request->all_sessions == 'true') {
            $query->withoutGlobalScope('academic_session');
        }
        
        if ($request->has('school_class_id') && $request->school_class_id) {
            $query->where('school_class_id', $request->school_class_id);
        } else {
            $query->selectRaw('MIN(id) as id, name')->groupBy('name');
        }

        if ($request->has('search') && $request->search) {
            $query->having('name', 'like', '%' . $request->search . '%');
        }

        $perPage = $request->get('limit', 10);

        // Use a basic getter and manual paginator because paginate() can be buggy with groupBy
        $allDistinct = collect($query->orderBy('name', 'asc')->get());
        $page = $request->get('page', 1);
        if ($request->has('no_paginate') && $request->no_paginate == 'true') {
            $sections = $query->orderBy('name', 'asc')->get();
        } else {
            $perPage = $request->get('limit', 10);

            // Use a basic getter and manual paginator because paginate() can be buggy with groupBy
            $allDistinct = collect($query->orderBy('name', 'asc')->get());
            $page = $request->get('page', 1);

            $sections = new \Illuminate\Pagination\LengthAwarePaginator(
                $allDistinct->forPage($page, $perPage)->values(),
                $allDistinct->count(),
                $perPage,
                $page,
                ['path' => $request->url(), 'query' => $request->query()]
            );
        }

        return $this->success($sections, 'Sections retrieved successfully');
    }

    /**
     * Store a newly created global resource.
     * We create it with school_class_id = null so it exists in the system globally.
     */
    public function store(Request $request)
    {
        $activeSessionId = AcademicSession::where('is_active', true)->value('id');

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors()->first(), 422, $validator->errors());
        }

        // Prevent creating if the name already exists globally
        if (Section::where('name', $request->name)->exists()) {
            return $this->error('The section name has already been taken.', 422);
        }

        $section = Section::create([
            'name' => $request->name,
            'academic_session_id' => $activeSessionId,
            'school_class_id' => null
        ]);

        return $this->success($section, 'Section created successfully', 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Section $section)
    {
        return $this->success([
            'id' => $section->id,
            'name' => $section->name
        ], 'Section retrieved successfully');
    }

    /**
     * Update the global section name across ALL classes using this section name.
     */
    public function update(Request $request, Section $section)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors()->first(), 422, $validator->errors());
        }

        $oldName = $section->name;
        $newName = $request->name;

        // Prevent update if the new name already exists
        if ($oldName !== $newName && Section::where('name', $newName)->exists()) {
            return $this->error('The section name has already been taken.', 422);
        }

        // Update globally for ALL rows sharing this old name
        Section::where('name', $oldName)->update(['name' => $newName]);

        $section->name = $newName;

        return $this->success($section, 'Section updated successfully globally');
    }

    /**
     * Remove the section globally from ALL classes.
     */
    public function destroy(Section $section)
    {
        $oldName = $section->name;

        // Delete globally across all classes
        Section::where('name', $oldName)->delete();

        return $this->success(null, 'Section deleted successfully from all classes');
    }
}
