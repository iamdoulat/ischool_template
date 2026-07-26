<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('general_settings', function (Blueprint $table) {
            $table->boolean('income_invoice_enable_auto_generation')->default(false);
            $table->string('income_invoice_prefix')->nullable();
            $table->integer('income_invoice_digit')->default(4);
            $table->string('income_invoice_start_from')->nullable()->default('1');
        });
    }

    public function down(): void
    {
        Schema::table('general_settings', function (Blueprint $table) {
            $table->dropColumn([
                'income_invoice_enable_auto_generation',
                'income_invoice_prefix',
                'income_invoice_digit',
                'income_invoice_start_from',
            ]);
        });
    }
};
