<?php

namespace App\Http\Controllers\Api\v1\Reports;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Item;
use App\Models\ItemStock;
use App\Models\IssueItem;

class InventoryReportController extends Controller
{
    /** ------------------------------------------------------------------ */
    /*  GET /reports/inventory/stack                                        */
    /** ------------------------------------------------------------------ */
    public function getStackReport(Request $request)
    {
        $searchType = $request->query('search_type', 'all_time');

        // Base query for items
        $query = Item::with(['itemCategory']);

        $items = $query->get()->map(function ($item) use ($searchType) {
            // Get stocks for this item
            $stockQuery = ItemStock::with(['supplier', 'store'])->where('item_id', $item->id);

            if ($searchType && $searchType !== 'all_time') {
                $today = now();
                switch ($searchType) {
                    case 'today':
                        $stockQuery->whereDate('date', $today->toDateString());
                        break;
                    case 'this_week':
                        $stockQuery->whereBetween('date', [$today->copy()->startOfWeek(), $today->copy()->endOfWeek()]);
                        break;
                    case 'last_week':
                        $stockQuery->whereBetween('date', [$today->copy()->subWeek()->startOfWeek(), $today->copy()->subWeek()->endOfWeek()]);
                        break;
                    case 'this_month':
                        $stockQuery->whereMonth('date', $today->month)->whereYear('date', $today->year);
                        break;
                    case 'last_month':
                        $stockQuery->whereMonth('date', $today->copy()->subMonth()->month)->whereYear('date', $today->copy()->subMonth()->year);
                        break;
                    case 'this_year':
                        $stockQuery->whereYear('date', $today->year);
                        break;
                }
            }
            
            // Apply date filtering to stock if needed, or just get all for totalQty
            $stocks = $stockQuery->get();
            $totalQty = $stocks->sum('quantity');
            
            // Get issued quantity (items that are currently issued out, i.e., return_date is null or in the future)
            // Or just sum all issued items? Usually "totalIssued" means currently issued out, affecting availableQty.
            // Let's assume it means all time issued items that haven't been returned.
            $totalIssued = IssueItem::where('item_id', $item->id)
                            ->where(function($q) {
                                $q->whereNull('return_date')->orWhere('return_date', '>', now()->toDateString());
                            })
                            ->sum('quantity');

            // Get the latest supplier/store from the most recent stock entry
            $latestStock = $stocks->sortByDesc('date')->first();

            return [
                'name'         => $item->item_name,
                'category'     => optional($item->itemCategory)->item_category ?? '-',
                'supplier'     => optional(optional($latestStock)->supplier)->item_supplier ?? '-',
                'store'        => optional(optional($latestStock)->store)->item_store ?? '-',
                'availableQty' => max(0, $totalQty - $totalIssued),
                'totalQty'     => $totalQty,
                'totalIssued'  => $totalIssued,
            ];
        });

        return response()->json([
            'data' => $items->values(),
        ]);
    }

    /** ------------------------------------------------------------------ */
    /*  GET /reports/inventory/add-item                                     */
    /** ------------------------------------------------------------------ */
    public function getAddItemReport(Request $request)
    {
        $searchType = $request->query('search_type', 'all_time');

        $query = ItemStock::with(['item', 'itemCategory', 'supplier', 'store']);

        if ($searchType && $searchType !== 'all_time') {
            $today = now();
            switch ($searchType) {
                case 'today':
                    $query->whereDate('date', $today->toDateString());
                    break;
                case 'this_week':
                    $query->whereBetween('date', [$today->copy()->startOfWeek(), $today->copy()->endOfWeek()]);
                    break;
                case 'this_month':
                    $query->whereMonth('date', $today->month)->whereYear('date', $today->year);
                    break;
                case 'last_month':
                    $query->whereMonth('date', $today->copy()->subMonth()->month)->whereYear('date', $today->copy()->subMonth()->year);
                    break;
                case 'this_year':
                    $query->whereYear('date', $today->year);
                    break;
            }
        }

        $stocks = $query->orderBy('date', 'desc')->get()->map(function ($stock) {
            return [
                'name'           => optional($stock->item)->item_name ?? '-',
                'category'       => optional($stock->itemCategory)->item_category ?? '-',
                'supplier'       => optional($stock->supplier)->item_supplier ?? '-',
                'store'          => optional($stock->store)->item_store ?? '-',
                'quantity'       => (int) $stock->quantity,
                'purchase_price' => number_format((float)$stock->purchase_price, 2),
                'date'           => $stock->date ? \Carbon\Carbon::parse($stock->date)->format('m/d/Y') : '-',
            ];
        });

        return response()->json([
            'data' => $stocks,
        ]);
    }

    /** ------------------------------------------------------------------ */
    /*  GET /reports/inventory/issue-item                                  */
    /** ------------------------------------------------------------------ */
    public function getIssueItemReport(Request $request)
    {
        $searchType = $request->query('search_type', 'all_time');

        // We load IssueItem with 'item' and 'itemCategory' relationships
        $query = \App\Models\IssueItem::with(['item', 'itemCategory']);

        if ($searchType && $searchType !== 'all_time') {
            $today = now();
            switch ($searchType) {
                case 'today':
                    $query->whereDate('issue_date', $today->toDateString());
                    break;
                case 'this_week':
                    $query->whereBetween('issue_date', [$today->copy()->startOfWeek(), $today->copy()->endOfWeek()]);
                    break;
                case 'this_month':
                    $query->whereMonth('issue_date', $today->month)->whereYear('issue_date', $today->year);
                    break;
                case 'last_month':
                    $query->whereMonth('issue_date', $today->copy()->subMonth()->month)->whereYear('issue_date', $today->copy()->subMonth()->year);
                    break;
                case 'this_year':
                    $query->whereYear('issue_date', $today->year);
                    break;
            }
        }

        $issues = $query->orderBy('issue_date', 'desc')->get()->map(function ($issue) {
            $issueDate = $issue->issue_date ? \Carbon\Carbon::parse($issue->issue_date)->format('m/d/Y') : '-';
            $returnDate = $issue->return_date ? \Carbon\Carbon::parse($issue->return_date)->format('m/d/Y') : '';
            $dateRange = $returnDate ? "{$issueDate} - {$returnDate}" : "{$issueDate} - ";

            return [
                'item'           => optional($issue->item)->item_name ?? '-',
                'note'           => $issue->note ?? '-',
                'category'       => optional($issue->itemCategory)->item_category ?? '-',
                'dateRange'      => $dateRange,
                'issue_to'       => $issue->issue_to ?? '-',
                'issue_by'       => $issue->issue_by ?? '-',
                'quantity'       => (int) $issue->quantity,
            ];
        });

        return response()->json([
            'data' => $issues,
        ]);
    }
}
