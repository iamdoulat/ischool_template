<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('role_dashboard_widgets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('role_id')->constrained('roles')->cascadeOnDelete();
            $table->string('widget_key');
            $table->timestamps();
            $table->unique(['role_id', 'widget_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('role_dashboard_widgets');
    }
};
