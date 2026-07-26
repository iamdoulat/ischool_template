<?php

namespace App\Http\Controllers\Api\v1\SystemSetting;

use App\Http\Controllers\Api\BaseController;
use App\Models\Currency;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CurrencyController extends BaseController
{
    /**
     * Get all currencies.
     */
    public function index(): JsonResponse
    {
        $currencies = Currency::orderBy('id', 'asc')->get();
        return $this->success($currencies, 'Currencies fetched successfully');
    }

    /**
     * Batch update currencies.
     */
    public function updateBatch(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'currencies' => 'required|array',
            'currencies.*.id' => 'required|integer|exists:currencies,id',
            'currencies.*.symbol' => 'nullable|string',
            'currencies.*.rate' => 'nullable|numeric',
        ]);

        foreach ($validated['currencies'] as $currencyData) {
            $currency = Currency::find($currencyData['id']);
            if ($currency) {
                $currency->update([
                    'symbol' => $currencyData['symbol'] ?? $currency->symbol,
                    'rate' => $currencyData['rate'] ?? $currency->rate,
                ]);
            }
        }

        return $this->success(null, 'Currencies updated successfully');
    }

    /**
     * Toggle active status.
     */
    public function toggleActive($id): JsonResponse
    {
        // Only one currency can be active at a time
        Currency::where('is_active', true)->update(['is_active' => false]);

        $currency = Currency::findOrFail($id);
        $currency->update(['is_active' => true]);

        return $this->success($currency, 'Currency activated successfully');
    }

    /**
     * Toggle enabled status.
     */
    public function toggleEnabled($id): JsonResponse
    {
        $currency = Currency::findOrFail($id);
        $currency->update(['is_enabled' => !$currency->is_enabled]);

        return $this->success($currency, 'Currency status toggled successfully');
    }
}
