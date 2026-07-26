<?php

namespace App\Http\Controllers\Api\v1\SystemSetting;

use App\Http\Controllers\Api\BaseController;
use App\Models\OnlineAdmissionField;
use App\Models\OnlineAdmissionSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class OnlineAdmissionController extends BaseController
{
    /**
     * Get the online admission settings and fields.
     */
    public function index(): JsonResponse
    {
        $settings = OnlineAdmissionSetting::first();
        if (!$settings) {
            $settings = OnlineAdmissionSetting::create([
                'online_admission' => true,
                'online_admission_payment_option' => true,
                'online_admission_form_fees' => 100.00,
                'instructions' => 'General Instruction:- These instructions pertain to online application for admission to Smart School...',
                'terms_conditions' => 'General Terms & Conditions for Students:- 1. The User declares that the content of the Portal shall be accessed...',
            ]);
        }

        $fields = OnlineAdmissionField::orderBy('id')->get();

        // If no fields exist, create default fields
        if ($fields->isEmpty()) {
            $defaultFields = [
                ['name' => 'Last Name', 'field_name' => 'last_name', 'is_active' => true],
                ['name' => 'Category', 'field_name' => 'category', 'is_active' => true],
                ['name' => 'Religion', 'field_name' => 'religion', 'is_active' => true],
                ['name' => 'Caste', 'field_name' => 'caste', 'is_active' => true],
                ['name' => 'Mobile Number', 'field_name' => 'mobile_number', 'is_active' => true],
                ['name' => 'Email', 'field_name' => 'email', 'is_active' => true],
                ['name' => 'Student Photo', 'field_name' => 'student_photo', 'is_active' => true],
                ['name' => 'House', 'field_name' => 'house', 'is_active' => true],
                ['name' => 'Blood Group', 'field_name' => 'blood_group', 'is_active' => true],
                ['name' => 'Height', 'field_name' => 'height', 'is_active' => true],
                ['name' => 'Weight', 'field_name' => 'weight', 'is_active' => true],
                ['name' => 'Measurement Date', 'field_name' => 'measurement_date', 'is_active' => true],
                ['name' => 'Father Name', 'field_name' => 'father_name', 'is_active' => true],
                ['name' => 'Father Phone', 'field_name' => 'father_phone', 'is_active' => true],
                ['name' => 'Father Occupation', 'field_name' => 'father_occupation', 'is_active' => true],
                ['name' => 'Father Photo', 'field_name' => 'father_photo', 'is_active' => true],
                ['name' => 'Mother Name', 'field_name' => 'mother_name', 'is_active' => true],
                ['name' => 'Mother Phone', 'field_name' => 'mother_phone', 'is_active' => true],
                ['name' => 'Mother Occupation', 'field_name' => 'mother_occupation', 'is_active' => true],
                ['name' => 'Mother Photo', 'field_name' => 'mother_photo', 'is_active' => true],
                ['name' => 'If Guardian Is', 'field_name' => 'if_guardian_is', 'is_active' => true],
                ['name' => 'Guardian Name', 'field_name' => 'guardian_name', 'is_active' => true],
                ['name' => 'Guardian Relation', 'field_name' => 'guardian_relation', 'is_active' => true],
            ];

            foreach ($defaultFields as $field) {
                OnlineAdmissionField::create($field);
            }

            $fields = OnlineAdmissionField::orderBy('id')->get();
        }

        // Add file name if exists
        $settingsData = $settings->toArray();
        if ($settings->admission_form_path && Storage::disk('public')->exists($settings->admission_form_path)) {
            $settingsData['admission_form_file_name'] = basename($settings->admission_form_path);
        } else {
            $settingsData['admission_form_file_name'] = '';
        }

        return $this->success([
            'settings' => $settingsData,
            'fields' => $fields,
        ], 'Online admission settings fetched successfully');
    }

    /**
     * Update the online admission settings.
     */
    public function updateSettings(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'online_admission' => 'required|boolean',
            'online_admission_payment_option' => 'required|boolean',
            'online_admission_form_fees' => 'required|numeric|min:0',
            'instructions' => 'required|string',
            'terms_conditions' => 'required|string',
            'admission_form_file' => 'nullable|file|mimes:pdf,doc,docx|max:10240', // 10MB max
        ]);

        DB::beginTransaction();
        try {
            $settings = OnlineAdmissionSetting::first();

            $data = [
                'online_admission' => $validated['online_admission'],
                'online_admission_payment_option' => $validated['online_admission_payment_option'],
                'online_admission_form_fees' => $validated['online_admission_form_fees'],
                'instructions' => $validated['instructions'],
                'terms_conditions' => $validated['terms_conditions'],
            ];

            // Handle file upload
            if ($request->hasFile('admission_form_file')) {
                // Delete old file if exists
                if ($settings && $settings->admission_form_path) {
                    Storage::disk('public')->delete($settings->admission_form_path);
                }

                $file = $request->file('admission_form_file');
                $fileName = time() . '_' . $file->getClientOriginalName();
                $path = $file->storeAs('admission_forms', $fileName, 'public');
                $data['admission_form_path'] = $path;
            }

            if ($settings) {
                $settings->update($data);
            } else {
                $settings = OnlineAdmissionSetting::create($data);
            }

            DB::commit();

            // Add file name to response
            $settingsData = $settings->toArray();
            if ($settings->admission_form_path && Storage::disk('public')->exists($settings->admission_form_path)) {
                $settingsData['admission_form_file_name'] = basename($settings->admission_form_path);
            } else {
                $settingsData['admission_form_file_name'] = '';
            }

            return $this->success($settingsData, 'Online admission settings updated successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('Failed to update settings: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Update the online admission fields.
     */
    public function updateFields(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'fields'                  => 'required|array',
            'fields.*.field_name'     => 'required|string|exists:online_admission_fields,field_name',
            'fields.*.is_active'      => 'required|boolean',
        ]);

        DB::beginTransaction();
        try {
            foreach ($validated['fields'] as $fieldData) {
                OnlineAdmissionField::where('field_name', $fieldData['field_name'])->update([
                    'is_active' => $fieldData['is_active'],
                ]);
            }

            DB::commit();

            return $this->success(null, 'Online admission fields updated successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('Failed to update fields: ' . $e->getMessage(), 500);
        }
    }
}
