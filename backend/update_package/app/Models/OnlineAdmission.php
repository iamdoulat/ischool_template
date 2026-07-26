<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OnlineAdmission extends Model
{
    use HasFactory;

    protected $fillable = [
        'reference_no',
        'first_name',
        'middle_name',
        'last_name',
        'school_class_id',
        'section_id',
        'dob',
        'gender',
        'category',
        'religion',
        'caste',
        'phone',
        'email',
        'student_photo',
        'blood_group',
        'house',
        'height',
        'weight',
        'measurement_date',
        'father_name',
        'father_phone',
        'father_occupation',
        'father_photo',
        'mother_name',
        'mother_phone',
        'mother_occupation',
        'mother_photo',
        'guardian_type',
        'guardian_name',
        'guardian_relation',
        'guardian_phone',
        'guardian_email',
        'guardian_occupation',
        'guardian_photo',
        'guardian_address',
        'current_address',
        'permanent_address',
        'form_status',
        'payment_status',
        'paid_amount',
        'is_enrolled',
        'academic_session_id',
        'national_identification_no',
        'local_identification_no',
        'birth_place',
        'state',
        'nationality',
        'mother_tongue',
        'postal_code',
        'bank_account_no',
        'bank_name',
        'ifsc_code',
        'previous_school_details',
        'previous_academic_record',
        'note',
        'rte',
        'appraisal_achievements',
        'general_behaviour',
        'second_language',
        'identification_marks',
        'medical_history',
    ];

    protected $casts = [
        'dob' => 'date',
        'measurement_date' => 'date',
        'is_enrolled' => 'boolean',
        'previous_academic_record' => 'array',
    ];

    public function schoolClass()
    {
        return $this->belongsTo(SchoolClass::class, 'school_class_id');
    }

    public function section()
    {
        return $this->belongsTo(Section::class, 'section_id');
    }

    public function academicSession()
    {
        return $this->belongsTo(AcademicSession::class, 'academic_session_id');
    }

    public function studentCategory()
    {
        return $this->belongsTo(StudentCategory::class, 'category');
    }
}
