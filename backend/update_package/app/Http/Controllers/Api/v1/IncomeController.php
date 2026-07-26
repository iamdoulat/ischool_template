<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\GeneralSetting;
use App\Models\Income;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class IncomeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = \App\Models\Income::with('incomeHead');

        // Filter by Period
        if ($request->has('search_type') && $request->search_type !== 'all') {
            $type = $request->search_type;
            $now = \Carbon\Carbon::now();

            switch ($type) {
                case 'today':
                    $query->whereDate('date', $now->toDateString());
                    break;
                case 'this-week':
                    $query->whereBetween('date', [$now->startOfWeek()->toDateString(), $now->endOfWeek()->toDateString()]);
                    break;
                case 'last-week':
                    $lastWeek = $now->subWeek();
                    $query->whereBetween('date', [$lastWeek->startOfWeek()->toDateString(), $lastWeek->endOfWeek()->toDateString()]);
                    break;
                case 'this-month':
                    $query->whereMonth('date', $now->month)->whereYear('date', $now->year);
                    break;
                case 'last-month':
                    $lastMonth = $now->subMonth();
                    $query->whereMonth('date', $lastMonth->month)->whereYear('date', $lastMonth->year);
                    break;
                case 'last-3-months':
                    $query->where('date', '>=', $now->subMonths(3)->toDateString());
                    break;
                case 'last-6-months':
                    $query->where('date', '>=', $now->subMonths(6)->toDateString());
                    break;
                case 'last-12-months':
                    $query->where('date', '>=', $now->subMonths(12)->toDateString());
                    break;
                case 'this-year':
                    $query->whereYear('date', $now->year);
                    break;
                case 'last-year':
                    $query->whereYear('date', $now->year - 1);
                    break;
                case 'period':
                    if ($request->has('start_date') && $request->has('end_date')) {
                        $query->whereBetween('date', [$request->start_date, $request->end_date]);
                    }
                    break;
            }
        }

        // Filter by Keyword
        if ($request->has('keyword') && $request->keyword !== '') {
            $keyword = $request->keyword;
            $query->where(function($q) use ($keyword) {
                $q->where('name', 'like', "%{$keyword}%")
                  ->orWhere('invoice_number', 'like', "%{$keyword}%")
                  ->orWhere('description', 'like', "%{$keyword}%");
            });
        }

        $incomes = $query->get();
        
        return response()->json([
            'status' => 'Success',
            'data' => $incomes
        ]);
    }

    public function nextInvoiceNumber(): \Illuminate\Http\JsonResponse
    {
        $number = $this->generateNextInvoiceNumber();
        return response()->json([
            'status' => 'Success',
            'data' => ['invoice_number' => $number],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'income_head_id' => 'required|exists:income_heads,id',
            'name' => 'required|string|max:255',
            'invoice_number' => 'nullable|string|max:255',
            'date' => 'required|date',
            'amount' => 'required|numeric',
            'description' => 'nullable|string',
            'document' => 'nullable|file|mimes:jpg,jpeg,png,pdf,doc,docx|max:2048',
        ]);

        if ($request->hasFile('document')) {
            $path = $request->file('document')->store('incomes', 'public');
            $validated['document'] = $path;
        }

        $setting = GeneralSetting::first();
        if ($setting && $setting->income_invoice_enable_auto_generation && empty($validated['invoice_number'])) {
            $validated['invoice_number'] = $this->generateNextInvoiceNumber();
        }

        $income = Income::create($validated);

        return response()->json([
            'status' => 'Success',
            'message' => 'Income created successfully',
            'data' => $income->load('incomeHead')
        ]);
    }

    private function generateNextInvoiceNumber(): string
    {
        $setting = GeneralSetting::first();
        $prefix = $setting->income_invoice_prefix ?? 'INV-';
        $digit = max(1, (int)($setting->income_invoice_digit ?? 4));
        $startFrom = (int)($setting->income_invoice_start_from ?? 1);

        $last = Income::where('invoice_number', 'like', $prefix . '%')
            ->orderByDesc('id')
            ->lockForUpdate()
            ->first();

        if ($last && $last->invoice_number) {
            $lastNumber = (int) substr($last->invoice_number, strlen($prefix));
            $nextNumber = $lastNumber + 1;
        } else {
            $nextNumber = $startFrom;
        }

        return $prefix . str_pad((string)$nextNumber, $digit, '0', STR_PAD_LEFT);
    }

    public function show(string $id)
    {
        $income = \App\Models\Income::with('incomeHead')->findOrFail($id);
        return response()->json([
            'status' => 'Success',
            'data' => $income
        ]);
    }

    public function update(Request $request, string $id)
    {
        $income = \App\Models\Income::findOrFail($id);

        $validated = $request->validate([
            'income_head_id' => 'sometimes|required|exists:income_heads,id',
            'name' => 'sometimes|required|string|max:255',
            'invoice_number' => 'nullable|string|max:255',
            'date' => 'sometimes|required|date',
            'amount' => 'sometimes|required|numeric',
            'description' => 'nullable|string',
            'document' => 'nullable|file|mimes:jpg,jpeg,png,pdf,doc,docx|max:2048',
        ]);

        if ($request->hasFile('document')) {
            // Delete old document if exists
            if ($income->document) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($income->document);
            }
            $path = $request->file('document')->store('incomes', 'public');
            $validated['document'] = $path;
        }

        $income->update($validated);

        return response()->json([
            'status' => 'Success',
            'message' => 'Income updated successfully',
            'data' => $income->load('incomeHead')
        ]);
    }

    public function destroy(string $id)
    {
        $income = \App\Models\Income::findOrFail($id);
        
        if ($income->document) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($income->document);
        }
        
        $income->delete();

        return response()->json([
            'status' => 'Success',
            'message' => 'Income deleted successfully'
        ]);
    }
}
