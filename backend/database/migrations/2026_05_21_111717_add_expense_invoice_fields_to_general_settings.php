<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('general_settings', function (Blueprint $table) {
            $table->boolean('expense_invoice_enable_auto_generation')->default(false);
            $table->string('expense_invoice_prefix')->nullable();
            $table->integer('expense_invoice_digit')->default(4);
            $table->string('expense_invoice_start_from')->nullable()->default('1');
        });
    }

    public function down(): void
    {
        Schema::table('general_settings', function (Blueprint $table) {
            $table->dropColumn([
                'expense_invoice_enable_auto_generation',
                'expense_invoice_prefix',
                'expense_invoice_digit',
                'expense_invoice_start_from',
            ]);
        });
    }
};
