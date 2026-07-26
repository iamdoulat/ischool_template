<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     *
     * The original table created the status column as enum('Active','Passive','Dead'),
     * but the controller validation and the UI also allow 'Won' and 'Lost'. Saving
     * those values failed at the database layer. Widen the enum to match.
     */
    public function up(): void
    {
        // Raw statement keeps this portable for the MySQL dev database while being a
        // no-op-safe guard for the SQLite :memory: test database (no ENUM support).
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE admission_enquiries MODIFY status ENUM('Active','Passive','Dead','Won','Lost') NOT NULL DEFAULT 'Active'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            // Collapse any new statuses back to 'Active' before narrowing the column.
            DB::table('admission_enquiries')->whereIn('status', ['Won', 'Lost'])->update(['status' => 'Active']);
            DB::statement("ALTER TABLE admission_enquiries MODIFY status ENUM('Active','Passive','Dead') NOT NULL DEFAULT 'Active'");
        }
    }
};
