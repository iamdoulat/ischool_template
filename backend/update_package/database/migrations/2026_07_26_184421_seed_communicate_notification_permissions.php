<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Add missing Communicate module permissions:
     * - communicate.send.notification.*
     * - communicate.notification.template.*
     *
     * Uses conditional insert so it is safe to run multiple times.
     */
    public function up(): void
    {
        $now = now();

        // Schema: id | module | feature | capability | name | created_at | updated_at
        $newPerms = [
            // Send Notification
            ['module' => 'Communicate', 'feature' => 'Send Notification', 'capability' => 'view',   'name' => 'communicate.send.notification.view'],
            ['module' => 'Communicate', 'feature' => 'Send Notification', 'capability' => 'add',    'name' => 'communicate.send.notification.add'],
            ['module' => 'Communicate', 'feature' => 'Send Notification', 'capability' => 'edit',   'name' => 'communicate.send.notification.edit'],
            ['module' => 'Communicate', 'feature' => 'Send Notification', 'capability' => 'delete', 'name' => 'communicate.send.notification.delete'],
            // Notification Template
            ['module' => 'Communicate', 'feature' => 'Notification Template', 'capability' => 'view',   'name' => 'communicate.notification.template.view'],
            ['module' => 'Communicate', 'feature' => 'Notification Template', 'capability' => 'add',    'name' => 'communicate.notification.template.add'],
            ['module' => 'Communicate', 'feature' => 'Notification Template', 'capability' => 'edit',   'name' => 'communicate.notification.template.edit'],
            ['module' => 'Communicate', 'feature' => 'Notification Template', 'capability' => 'delete', 'name' => 'communicate.notification.template.delete'],
        ];

        foreach ($newPerms as $perm) {
            $exists = DB::table('permissions')->where('name', $perm['name'])->exists();
            if (!$exists) {
                DB::table('permissions')->insert(array_merge($perm, [
                    'created_at' => $now,
                    'updated_at' => $now,
                ]));
            }
        }
    }

    public function down(): void
    {
        DB::table('permissions')->whereIn('name', [
            'communicate.send.notification.view',
            'communicate.send.notification.add',
            'communicate.send.notification.edit',
            'communicate.send.notification.delete',
            'communicate.notification.template.view',
            'communicate.notification.template.add',
            'communicate.notification.template.edit',
            'communicate.notification.template.delete',
        ])->delete();
    }
};
