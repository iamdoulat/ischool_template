<?php

namespace App\Http\Controllers\Api\v1\SystemSetting;

use App\Http\Controllers\Api\BaseController;
use App\Models\AdmissionFormSetting;
use App\Models\AdmissionFormDocument;
use App\Models\AdmissionFormField;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdmissionFormController extends BaseController
{
    /**
     * Get all admission form settings, documents, and fields.
     */
    public function index(): JsonResponse
    {
        $settings = AdmissionFormSetting::first();
        if (!$settings) {
            $settings = AdmissionFormSetting::create([
                'fee_policy' => '',
                'office_use_only' => '',
                'terms_conditions' => '',
                'declaration' => '',
            ]);
        }

        $documents = AdmissionFormDocument::orderBy('sort_order')->orderBy('id')->get();
        $fields = AdmissionFormField::orderBy('id')->get();

        // Seed default fields if empty
        if ($fields->isEmpty()) {
            $defaultFields = [
                ['name' => 'First Name', 'field_name' => 'name', 'is_active' => true],
                ['name' => 'Last Name', 'field_name' => 'last_name', 'is_active' => true],
                ['name' => 'Date Of Birth', 'field_name' => 'dob', 'is_active' => true],
                ['name' => 'Gender', 'field_name' => 'gender', 'is_active' => true],
                ['name' => 'Category', 'field_name' => 'category', 'is_active' => true],
                ['name' => 'Religion', 'field_name' => 'religion', 'is_active' => true],
                ['name' => 'Caste', 'field_name' => 'caste', 'is_active' => true],
                ['name' => 'Mobile Number', 'field_name' => 'phone', 'is_active' => true],
                ['name' => 'Email', 'field_name' => 'email', 'is_active' => true],
                ['name' => 'Student Photo', 'field_name' => 'avatar', 'is_active' => true],
                ['name' => 'House', 'field_name' => 'house', 'is_active' => true],
                ['name' => 'Blood Group', 'field_name' => 'blood_group', 'is_active' => true],
                ['name' => 'Height', 'field_name' => 'height', 'is_active' => true],
                ['name' => 'Weight', 'field_name' => 'weight', 'is_active' => true],
                ['name' => 'Measurement Date', 'field_name' => 'measurement_date', 'is_active' => true],
                ['name' => 'ID/Birth Cert', 'field_name' => 'national_identification_no', 'is_active' => true],
                ['name' => 'Place of Birth', 'field_name' => 'birth_place', 'is_active' => true],
                ['name' => 'State', 'field_name' => 'state', 'is_active' => true],
                ['name' => 'Nationality', 'field_name' => 'nationality', 'is_active' => true],
                ['name' => 'Postal / Zip Code', 'field_name' => 'postal_code', 'is_active' => true],
                ['name' => 'Mother Tongue', 'field_name' => 'mother_tongue', 'is_active' => true],
                ['name' => 'Current Address', 'field_name' => 'current_address', 'is_active' => true],
                ['name' => 'Permanent Address', 'field_name' => 'permanent_address', 'is_active' => true],
                ['name' => 'Father Name', 'field_name' => 'father_name', 'is_active' => true],
                ['name' => 'Father Phone', 'field_name' => 'father_phone', 'is_active' => true],
                ['name' => 'Father Occupation', 'field_name' => 'father_occupation', 'is_active' => true],
                ['name' => 'Father Photo', 'field_name' => 'father_photo', 'is_active' => true],
                ['name' => 'Mother Name', 'field_name' => 'mother_name', 'is_active' => true],
                ['name' => 'Mother Phone', 'field_name' => 'mother_phone', 'is_active' => true],
                ['name' => 'Mother Occupation', 'field_name' => 'mother_occupation', 'is_active' => true],
                ['name' => 'Mother Photo', 'field_name' => 'mother_photo', 'is_active' => true],
                ['name' => 'Guardian Type', 'field_name' => 'guardian_type', 'is_active' => true],
                ['name' => 'Guardian Name', 'field_name' => 'guardian_name', 'is_active' => true],
                ['name' => 'Guardian Relation', 'field_name' => 'guardian_relation', 'is_active' => true],
                ['name' => 'Guardian Phone', 'field_name' => 'guardian_phone', 'is_active' => true],
                ['name' => 'Guardian Email', 'field_name' => 'guardian_email', 'is_active' => true],
                ['name' => 'Guardian Occupation', 'field_name' => 'guardian_occupation', 'is_active' => true],
                ['name' => 'Guardian Address', 'field_name' => 'guardian_address', 'is_active' => true],
                ['name' => 'Guardian Photo', 'field_name' => 'guardian_photo', 'is_active' => true],
                ['name' => 'Previous School Details', 'field_name' => 'previous_school_details', 'is_active' => true],
                ['name' => 'Previous Academic Record', 'field_name' => 'previous_academic_record', 'is_active' => true],
                ['name' => 'Identification Marks', 'field_name' => 'identification_marks', 'is_active' => true],
                ['name' => 'Note', 'field_name' => 'note', 'is_active' => true],
                ['name' => 'Medical History', 'field_name' => 'medical_history', 'is_active' => true],
                ['name' => 'RTE', 'field_name' => 'rte', 'is_active' => true],
            ];

            foreach ($defaultFields as $field) {
                AdmissionFormField::create($field);
            }

            $fields = AdmissionFormField::orderBy('id')->get();
        }

        return $this->success([
            'settings' => $settings,
            'documents' => $documents,
            'fields' => $fields,
        ], 'Admission form settings fetched successfully');
    }

    /**
     * Update the admission form text settings (fee policy, office use only, terms, declaration).
     */
    public function updateSettings(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'fee_policy' => 'nullable|string',
            'office_use_only' => 'nullable|string',
            'terms_conditions' => 'nullable|string',
            'declaration' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            $settings = AdmissionFormSetting::first();
            if ($settings) {
                $settings->update($validated);
            } else {
                $settings = AdmissionFormSetting::create($validated);
            }

            DB::commit();
            return $this->success($settings, 'Admission form settings updated successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('Failed to update settings: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Add a new document requirement.
     */
    public function addDocument(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $maxOrder = AdmissionFormDocument::max('sort_order') ?? 0;
        $document = AdmissionFormDocument::create([
            'name' => $validated['name'],
            'is_active' => true,
            'sort_order' => $maxOrder + 1,
        ]);

        return $this->success($document, 'Document added successfully');
    }

    /**
     * Update a document (name, active status, sort order).
     */
    public function updateDocument(Request $request, int $id): JsonResponse
    {
        $document = AdmissionFormDocument::find($id);
        if (!$document) {
            return $this->error('Document not found', 404);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'is_active' => 'sometimes|boolean',
            'sort_order' => 'sometimes|integer',
        ]);

        $document->update($validated);
        return $this->success($document, 'Document updated successfully');
    }

    /**
     * Delete a document requirement.
     */
    public function deleteDocument(int $id): JsonResponse
    {
        $document = AdmissionFormDocument::find($id);
        if (!$document) {
            return $this->error('Document not found', 404);
        }

        $document->delete();
        return $this->success(null, 'Document deleted successfully');
    }

    /**
     * Update the admission form fields (toggle visibility).
     */
    public function updateFields(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'fields' => 'required|array',
            'fields.*.id' => 'required|integer|exists:admission_form_fields,id',
            'fields.*.is_active' => 'required|boolean',
        ]);

        DB::beginTransaction();
        try {
            foreach ($validated['fields'] as $fieldData) {
                AdmissionFormField::where('id', $fieldData['id'])->update([
                    'is_active' => $fieldData['is_active']
                ]);
            }

            DB::commit();
            return $this->success(null, 'Admission form fields updated successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('Failed to update fields: ' . $e->getMessage(), 500);
        }
    }
}
