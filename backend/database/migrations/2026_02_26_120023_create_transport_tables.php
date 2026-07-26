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
        Schema::create('transport_pickup_points', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('latitude')->nullable();
            $table->string('longitude')->nullable();
            $table->timestamps();
        });

        Schema::create('transport_routes', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('transport_vehicles', function (Blueprint $table) {
            $table->id();
            $table->string('vehicle_no');
            $table->string('vehicle_model')->nullable();
            $table->string('year_made')->nullable();
            $table->string('registration_no')->nullable();
            $table->string('chassis_no')->nullable();
            $table->string('max_seating_capacity')->nullable();
            $table->string('driver_name')->nullable();
            $table->string('driver_license')->nullable();
            $table->string('driver_contact')->nullable();
            $table->text('note')->nullable();
            $table->timestamps();
        });

        Schema::create('transport_route_pickup_points', function (Blueprint $table) {
            $table->id();
            $table->foreignId('route_id')->constrained('transport_routes')->onDelete('cascade');
            $table->foreignId('pickup_point_id')->constrained('transport_pickup_points')->onDelete('cascade');
            $table->decimal('monthly_fees', 10, 2)->default(0);
            $table->decimal('distance', 10, 2)->nullable();
            $table->string('pickup_time')->nullable();
            $table->timestamps();
        });

        Schema::create('transport_route_vehicles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('route_id')->constrained('transport_routes')->onDelete('cascade');
            $table->foreignId('vehicle_id')->constrained('transport_vehicles')->onDelete('cascade');
            $table->timestamps();
        });

        Schema::create('student_transport_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('route_id')->constrained('transport_routes')->onDelete('cascade');
            $table->foreignId('vehicle_id')->constrained('transport_vehicles')->onDelete('cascade');
            $table->foreignId('pickup_point_id')->constrained('transport_pickup_points')->onDelete('cascade');
            $table->foreignId('academic_session_id')->nullable()->constrained('academic_sessions')->onDelete('set null');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_transport_assignments');
        Schema::dropIfExists('transport_route_vehicles');
        Schema::dropIfExists('transport_route_pickup_points');
        Schema::dropIfExists('transport_vehicles');
        Schema::dropIfExists('transport_routes');
        Schema::dropIfExists('transport_pickup_points');
    }
};
