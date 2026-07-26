<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('alumni_events', function (Blueprint $blueprint) {
            $blueprint->id();
            $blueprint->string('event_title');
            $blueprint->foreignId('school_class_id')->nullable()->constrained('school_classes')->onDelete('cascade');
            $blueprint->foreignId('section_id')->nullable()->constrained('sections')->onDelete('cascade');
            $blueprint->foreignId('session_id')->nullable()->constrained('academic_sessions')->onDelete('cascade'); // Pass out session
            $blueprint->date('from_date');
            $blueprint->date('to_date');
            $blueprint->text('note')->nullable();
            $blueprint->string('photo')->nullable();
            $blueprint->boolean('show_on_app')->default(true);
            $blueprint->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('alumni_events');
    }
};
