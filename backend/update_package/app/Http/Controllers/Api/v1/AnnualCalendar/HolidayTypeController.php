<?php

namespace App\Http\Controllers\Api\v1\AnnualCalendar;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\HolidayType;

class HolidayTypeController extends Controller
{
    public function index(Request $request)
    {
        if (\App\Models\HolidayType::count() === 0) {
            foreach (['Holiday', 'Activity', 'School Events', 'Vacation'] as $name) {
                \App\Models\HolidayType::create(['name' => $name]);
            }
        }

        $query = HolidayType::query();

        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        if ($request->has('no_paginate')) {
            return response()->json($query->get());
        }

        return response()->json($query->paginate($request->per_page ?? 10));
    }

    public function store(Request $request)
    {
        $request->validate(['name' => 'required|string|max:255']);
        $holidayType = HolidayType::create($request->all());
        return response()->json(['message' => 'Holiday type created successfully', 'data' => $holidayType]);
    }

    public function show($id)
    {
        return response()->json(HolidayType::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $request->validate(['name' => 'required|string|max:255']);
        $holidayType = HolidayType::findOrFail($id);
        $holidayType->update($request->all());
        return response()->json(['message' => 'Holiday type updated successfully', 'data' => $holidayType]);
    }

    public function destroy($id)
    {
        HolidayType::findOrFail($id)->delete();
        return response()->json(['message' => 'Holiday type deleted successfully']);
    }
}
