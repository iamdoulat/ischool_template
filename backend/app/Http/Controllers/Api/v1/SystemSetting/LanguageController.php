<?php

namespace App\Http\Controllers\Api\v1\SystemSetting;

use App\Http\Controllers\Controller;
use App\Models\Language;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Exception;
use Illuminate\Support\Facades\DB;

class LanguageController extends Controller
{
    /**
     * Display a listing of the languages.
     */
    public function index()
    {
        try {
            $languages = Language::orderBy('id', 'asc')->get();
            return response()->json([
                'success' => true,
                'data' => $languages
            ], 200);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve languages: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Public list of enabled languages for the portal/login language switcher.
     */
    public function publicList()
    {
        $languages = Language::where('is_enabled', true)
            ->orderByDesc('is_active')
            ->orderBy('name')
            ->get(['name', 'short_code', 'country_code', 'is_rtl', 'is_active']);

        return response()->json([
            'success' => true,
            'data' => $languages
        ], 200);
    }

    /**
     * Store a newly created language.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:languages,name',
            'short_code' => 'required|string|max:10',
            'country_code' => 'required|string|max:10',
            'is_rtl' => 'boolean',
            'is_active' => 'boolean',
            'is_enabled' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $isActive = $request->input('is_active', false);

            if ($isActive) {
                // Deactivate all other languages
                Language::where('is_active', true)->update(['is_active' => false]);
            }

            $language = Language::create([
                'name' => $request->name,
                'short_code' => $request->short_code,
                'country_code' => $request->country_code,
                'is_rtl' => $request->input('is_rtl', false),
                'is_active' => $isActive,
                'is_enabled' => $request->input('is_enabled', true),
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Language created successfully',
                'data' => $language
            ], 201);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create language: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified language.
     */
    public function update(Request $request, $id)
    {
        $language = Language::find($id);

        if (!$language) {
            return response()->json([
                'success' => false,
                'message' => 'Language not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'string|max:255|unique:languages,name,' . $language->id,
            'short_code' => 'string|max:10',
            'country_code' => 'string|max:10',
            'is_rtl' => 'boolean',
            'is_active' => 'boolean',
            'is_enabled' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $isActive = $request->input('is_active', $language->is_active);

            if ($isActive && !$language->is_active) {
                // If this language is being set to active, deactivate all others
                Language::where('is_active', true)->where('id', '!=', $id)->update(['is_active' => false]);
            }

            $language->update($request->all());

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Language updated successfully',
                'data' => $language
            ], 200);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to update language: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified language.
     */
    public function destroy($id)
    {
        try {
            $language = Language::find($id);

            if (!$language) {
                return response()->json([
                    'success' => false,
                    'message' => 'Language not found'
                ], 404);
            }

            if ($language->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete an active language. Please set another language as active first.'
                ], 400);
            }

            $language->delete();

            return response()->json([
                'success' => true,
                'message' => 'Language deleted successfully'
            ], 200);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete language: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get translations for a specific language.
     */
    public function getTranslations($code)
    {
        try {
            $path = base_path("lang/{$code}.json");

            if (!file_exists($path)) {
                // Return English as fallback if requested language doesn't have a JSON file
                $path = base_path("lang/en.json");
            }

            if (!file_exists($path)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Translation file not found'
                ], 404);
            }

            $translations = json_decode(file_get_contents($path), true);

            return response()->json([
                'success' => true,
                'data' => $translations
            ], 200);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve translations: ' . $e->getMessage()
            ], 500);
        }
    }
}
