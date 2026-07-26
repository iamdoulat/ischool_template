<?php

namespace App\Http\Controllers\Api\v1\StudentInformation;

use App\Http\Controllers\Api\BaseController;
use App\Models\SchoolClass;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StudentReportController extends BaseController
{
    /**
     * Get class & section report with student counts.
     */
    public function classSectionReport(Request $request): JsonResponse
    {
        $classes = SchoolClass::with('sections')->get();
        
        $studentCounts = DB::table('users')
            ->where('role', 'Student')
            ->where('active', true)
            ->select('section_id', DB::raw('count(*) as total'))
            ->groupBy('section_id')
            ->pluck('total', 'section_id');

        $reportData = [];
        $sno = 1;
        foreach ($classes as $class) {
            foreach ($class->sections as $section) {
                $count = $studentCounts->get($section->id, 0);
                $reportData[] = [
                    's_no' => $sno++,
                    'class_name' => $class->name,
                    'section_name' => $section->name,
                    'class_id' => $class->id,
                    'section_id' => $section->id,
                    'students_count' => $count
                ];
            }
        }
        
        if ($request->has('search') && $request->search) {
            $search = strtolower($request->search);
            $reportData = array_filter($reportData, function($item) use ($search) {
                return strpos(strtolower($item['class_name']), $search) !== false 
                    || strpos(strtolower($item['section_name']), $search) !== false;
            });
            $reportData = array_values($reportData);
        }

        $perPage = $request->get('limit', 50);
        $page = $request->get('page', 1);
        $offset = ($page - 1) * $perPage;
        
        $paginatedData = array_slice($reportData, $offset, $perPage);
        
        $response = [
            'current_page' => (int) $page,
            'data' => $paginatedData,
            'last_page' => max(1, ceil(count($reportData) / $perPage)),
            'per_page' => (int) $perPage,
            'total' => count($reportData),
        ];

        return $this->success($response, 'Class & section report retrieved successfully');
    }
    public function genderRatioReport(Request $request): JsonResponse
    {
        $classes = SchoolClass::with('sections')->get();
        
        $genderData = DB::table('users')
            ->where('role', 'Student')
            ->where('active', true)
            ->select('section_id', 'gender', DB::raw('count(*) as count'))
            ->groupBy('section_id', 'gender')
            ->get();

        $groupedGender = [];
        foreach ($genderData as $data) {
            if (!isset($groupedGender[$data->section_id])) {
                $groupedGender[$data->section_id] = ['boys' => 0, 'girls' => 0];
            }
            if (strtolower($data->gender) === 'male' || strtolower($data->gender) === 'boy') {
                $groupedGender[$data->section_id]['boys'] += $data->count;
            } elseif (strtolower($data->gender) === 'female' || strtolower($data->gender) === 'girl') {
                $groupedGender[$data->section_id]['girls'] += $data->count;
            }
        }

        $reportData = [];
        foreach ($classes as $class) {
            foreach ($class->sections as $section) {
                $counts = $groupedGender[$section->id] ?? ['boys' => 0, 'girls' => 0];
                $total = $counts['boys'] + $counts['girls'];
                
                // Calculate ratio
                $ratio = '0:0';
                if ($total > 0) {
                    if ($counts['girls'] == 0) {
                        $ratio = '1:0';
                    } else {
                        $rawRatio = $counts['boys'] / $counts['girls'];
                        $ratio = '1:' . round($rawRatio, 2);
                    }
                }

                $reportData[] = [
                    'class_section' => "{$class->name} ({$section->name})",
                    'total_boys' => $counts['boys'],
                    'total_girls' => $counts['girls'],
                    'total_students' => $total,
                    'ratio' => $ratio
                ];
            }
        }

        if ($request->has('search') && $request->search) {
            $search = strtolower($request->search);
            $reportData = array_filter($reportData, function($item) use ($search) {
                return strpos(strtolower($item['class_section']), $search) !== false;
            });
            $reportData = array_values($reportData);
        }

        $perPage = $request->get('limit', 50);
        $page = $request->get('page', 1);
        $offset = ($page - 1) * $perPage;
        
        $paginatedData = array_slice($reportData, $offset, $perPage);
        
        $response = [
            'current_page' => (int) $page,
            'data' => $paginatedData,
            'last_page' => max(1, ceil(count($reportData) / $perPage)),
            'per_page' => (int) $perPage,
            'total' => count($reportData),
        ];

        return $this->success($response, 'Gender ratio report retrieved successfully');
    }
    public function studentTeacherRatioReport(Request $request): JsonResponse
    {
        $classes = SchoolClass::with('sections')->get();
        
        $studentCounts = DB::table('users')
            ->where('role', 'Student')
            ->where('active', true)
            ->select('section_id', DB::raw('count(*) as total'))
            ->groupBy('section_id')
            ->pluck('total', 'section_id');

        $teacherCounts = DB::table('class_timetables')
            ->select('section_id', DB::raw('count(distinct staff_id) as total'))
            ->groupBy('section_id')
            ->pluck('total', 'section_id');

        $reportData = [];
        foreach ($classes as $class) {
            foreach ($class->sections as $section) {
                $studentsCount = $studentCounts->get($section->id, 0);
                $teachersCount = $teacherCounts->get($section->id, 0);
                
                // Calculate ratio
                $ratio = '0:0';
                if ($studentsCount > 0) {
                    if ($teachersCount == 0) {
                        $ratio = '1:0';
                    } else {
                        $rawRatio = $teachersCount / $studentsCount;
                        $ratio = '1:' . round($rawRatio, 2);
                    }
                }

                $reportData[] = [
                    'class_section' => "{$class->name} ({$section->name})",
                    'total_students' => $studentsCount,
                    'total_teachers' => $teachersCount,
                    'ratio' => $ratio
                ];
            }
        }

        if ($request->has('search') && $request->search) {
            $search = strtolower($request->search);
            $reportData = array_filter($reportData, function($item) use ($search) {
                return strpos(strtolower($item['class_section']), $search) !== false;
            });
            $reportData = array_values($reportData);
        }

        $perPage = $request->get('limit', 50);
        $page = $request->get('page', 1);
        $offset = ($page - 1) * $perPage;
        
        $paginatedData = array_slice($reportData, $offset, $perPage);
        
        $response = [
            'current_page' => (int) $page,
            'data' => $paginatedData,
            'last_page' => max(1, ceil(count($reportData) / $perPage)),
            'per_page' => (int) $perPage,
            'total' => count($reportData),
        ];

        return $this->success($response, 'Student teacher ratio report retrieved successfully');
    }
}
