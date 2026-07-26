<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'avatar',
        'phone',
        'admission_no',
        'username',
        'class',
        'father_name',
        'guardian_name',
        'guardian_phone',
        'staff_id',
        'designation',
        'department',
        'active',
        'academic_session_id',
        'school_class_id',
        'section_id',
        'roll_no',
        'last_name',
        'dob',
        'birth_place',
        'state',
        'nationality',
        'gender',
        'category',
        'religion',
        'caste',
        'admission_date',
        'blood_group',
        'house',
        'height',
        'weight',
        'measurement_date',
        'medical_history',
        'postal_code',
        'mother_tongue',
        'identification_marks',
        'father_phone',
        'father_occupation',
        'father_photo',
        'mother_name',
        'mother_phone',
        'mother_occupation',
        'mother_photo',
        'guardian_relation',
        'guardian_email',
        'guardian_photo',
        'parent_username',
        'guardian_occupation',
        'guardian_address',
        'middle_name',
        'guardian_type',
        'current_address',
        'permanent_address',
        'bank_account_no',
        'bank_name',
        'ifsc_code',
        'national_identification_no',
        'local_identification_no',
        'rte',
        'previous_school_details',
        'previous_academic_record',
        'note',
        'disable_reason',
        'disable_date',
        'hostel_id',
        'room_id',
        'face_descriptor',
        'qr_code',
        'full_name',
        'linked_student_id',
        'nfc_uid',
        'appraisal_achievements',
        'general_behaviour',
        'second_language',
        'basic_salary',
        'house_rent',
        'medical_allowance',
        'conveyance_allowance',
        'food_allowance',
    ];

    /**
     * The attributes that should be appended to the model's array form.
     *
     * @var array
     */
    protected $appends = ['permissions'];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'active' => 'boolean',
            'disable_date' => 'date',
            'dob' => 'date',
            'admission_date' => 'date',
            'measurement_date' => 'date',
            'face_descriptor' => 'array',
            'previous_academic_record' => 'array',
        ];
    }

    /**
     * Check if user has a specific permission.
     *
     * @param string $permissionName
     * @return bool
     */
    public function hasPermission(string $permissionName): bool
    {
        if ($this->role === 'Super Admin') {
            return true;
        }

        return Role::where('name', $this->role)
            ->whereHas('permissions', function ($query) use ($permissionName) {
                $query->where('name', $permissionName);
            })->exists();
    }

    /**
     * Get user permissions list.
     *
     * @return array
     */
    public function getPermissionsAttribute(): array
    {
        if ($this->role === 'Super Admin') {
            return ['all'];
        }

        $role = Role::where('name', $this->role)->first();
        if (!$role) {
            return [];
        }


        return $role->permissions()->pluck('name')->toArray();
    }

    /**
     * Get the school class that the student belongs to.
     */
    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'school_class_id');
    }

    /**
     * Get the section that the student belongs to.
     */
    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class, 'section_id');
    }

    /**
     * The student linked to this parent.
     */
    public function linkedStudent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'linked_student_id');
    }

    /**
     * Get the academic session that the student belongs to.
     */
    public function academicSession(): BelongsTo
    {
        return $this->belongsTo(AcademicSession::class, 'academic_session_id');
    }

    public function examResults(): HasMany
    {
        return $this->hasMany(ExamResult::class, 'student_id');
    }

    /**
     * Get the student category that the student belongs to.
     */
    public function studentCategory(): BelongsTo
    {
        return $this->belongsTo(StudentCategory::class, 'category');
    }

    /**
     * Get the disable reason for the student.
     */
    public function reason(): BelongsTo
    {
        return $this->belongsTo(DisableReason::class, 'disable_reason');
    }

    /**
     * Get the transport assignment for the student.
     */
    public function transportAssignment(): HasOne
    {
        return $this->hasOne(StudentTransportAssignment::class, 'student_id');
    }

    /**
     * Get the transport fees for the student.
     */
    public function transportFees(): HasMany
    {
        return $this->hasMany(StudentTransportFee::class, 'student_id');
    }

    /**
     * Get the hostel that the student belongs to.
     */
    public function hostel(): BelongsTo
    {
        return $this->belongsTo(Hostel::class, 'hostel_id');
    }

    /**
     * Get the room that the student belongs to.
     */
    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class, 'room_id');
    }

    /**
     * Scope a query to only include users with a certain role.
     */
    public function scopeRole($query, $role)
    {
        return $query->where('role', $role);
    }
    public function attendances(): HasMany
    {
        return $this->hasMany(StudentAttendance::class, 'student_id');
    }

    public function leaveRequests(): HasMany
    {
        return $this->hasMany(LeaveRequest::class, 'user_id');
    }

    public function staffAttendances(): HasMany
    {
        return $this->hasMany(StaffAttendance::class, 'user_id');
    }

    public function periodAttendances(): HasMany
    {
        return $this->hasMany(PeriodAttendance::class, 'student_id');
    }

    public function feesGroups(): BelongsToMany
    {
        return $this->belongsToMany(FeeGroup::class, 'student_fee_groups', 'student_id', 'fee_group_id')->withTimestamps();
    }

    public function feesDiscounts(): BelongsToMany
    {
        return $this->belongsToMany(FeeDiscount::class, 'student_fee_discounts', 'student_id', 'fee_discount_id')->withTimestamps();
    }

    public function libraryMember(): HasOne
    {
        return $this->hasOne(LibraryMember::class);
    }

    public function assignedIncidents(): HasMany
    {
        return $this->hasMany(AssignedIncident::class, 'student_id');
    }

    public function enrolledExams()
    {
        return $this->belongsToMany(Exam::class, 'exam_students', 'student_id', 'exam_id')->withTimestamps();
    }
}
