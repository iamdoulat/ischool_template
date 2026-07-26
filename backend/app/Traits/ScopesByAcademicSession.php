<?php

namespace App\Traits;

use App\Models\AcademicSession;
use Illuminate\Database\Eloquent\Builder;

trait ScopesByAcademicSession
{
    protected static function bootScopesByAcademicSession()
    {
        static::creating(function ($model) {
            if (!$model->academic_session_id) {
                $activeSessionId = session('active_academic_session_id')
                    ?? AcademicSession::where('is_active', true)->value('id');

                if ($activeSessionId) {
                    $model->academic_session_id = $activeSessionId;
                }
            }
        });

        static::addGlobalScope('academic_session', function (Builder $builder) {
            $activeSessionId = session('active_academic_session_id')
                ?? AcademicSession::where('is_active', true)->value('id');

            if ($activeSessionId) {
                $builder->where($builder->getQuery()->from . '.academic_session_id', $activeSessionId);
            }
        });
    }
}
