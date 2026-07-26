<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('general_settings', function (Blueprint $table) {
            // ID Auto Generation
            $table->boolean('auto_admission_no')->default(false);
            $table->string('admission_no_prefix')->nullable();
            $table->integer('admission_no_digit')->default(4);
            $table->string('admission_start_from')->nullable();

            $table->boolean('auto_staff_id')->default(false);
            $table->string('staff_id_prefix')->nullable();
            $table->integer('staff_no_digit')->default(4);
            $table->string('staff_id_start_from')->nullable();

            // Fees
            $table->boolean('fees_offline_bank_payment_in_student_panel')->default(false);
            $table->text('fees_offline_bank_payment_instruction')->nullable();
            $table->boolean('fees_lock_student_panel_if_fees_remaining')->default(false);
            $table->json('fees_print_fees_receipt_for')->nullable();
            $table->integer('fees_due_days')->default(60);
            $table->boolean('fees_single_page_print')->default(true);
            $table->boolean('fees_collect_fees_in_back_date')->default(true);
            $table->boolean('fees_student_guardian_panel_fees_discount')->default(true);
            $table->boolean('fees_display_previous_fees')->default(true);
            $table->boolean('fees_allow_student_to_add_partial_payment')->default(true);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('general_settings', function (Blueprint $table) {
            $table->dropColumn([
                'auto_admission_no',
                'admission_no_prefix',
                'admission_no_digit',
                'admission_start_from',
                'auto_staff_id',
                'staff_id_prefix',
                'staff_no_digit',
                'staff_id_start_from',
                'fees_offline_bank_payment_in_student_panel',
                'fees_offline_bank_payment_instruction',
                'fees_lock_student_panel_if_fees_remaining',
                'fees_print_fees_receipt_for',
                'fees_due_days',
                'fees_single_page_print',
                'fees_collect_fees_in_back_date',
                'fees_student_guardian_panel_fees_discount',
                'fees_display_previous_fees',
                'fees_allow_student_to_add_partial_payment',
            ]);
        });
    }
};
