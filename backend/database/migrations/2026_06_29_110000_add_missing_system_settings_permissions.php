<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();

        // module, feature, capability, name
        $missingPermissions = [
            ['System Settings', 'WhatsApp Messaging', 'view', 'system.settings.whatsapp.messaging.view'],
            ['System Settings', 'WhatsApp Messaging', 'edit', 'system.settings.whatsapp.messaging.edit'],
            ['System Settings', 'WhatsApp Gateway', 'view', 'system.settings.whatsapp.gateway.view'],
            ['System Settings', 'WhatsApp Gateway', 'edit', 'system.settings.whatsapp.gateway.edit'],
            ['System Settings', 'Thermal Print', 'view', 'system.settings.thermal.print.view'],
            ['System Settings', 'Thermal Print', 'edit', 'system.settings.thermal.print.edit'],
            ['System Settings', 'Online Admission', 'view', 'system.settings.online.admission.view'],
            ['System Settings', 'Online Admission', 'edit', 'system.settings.online.admission.edit'],
            ['System Settings', 'Admission Form', 'view', 'system.settings.admission.form.view'],
            ['System Settings', 'Admission Form', 'edit', 'system.settings.admission.form.edit'],
            ['System Settings', 'Roles Permissions', 'view', 'system.settings.roles.permissions.view'],
            ['System Settings', 'Roles Permissions', 'edit', 'system.settings.roles.permissions.edit'],
            ['System Settings', 'Addons', 'view', 'system.settings.addons.view'],
            ['System Settings', 'Addons', 'edit', 'system.settings.addons.edit'],
            ['System Settings', 'Captcha Setting', 'view', 'system.settings.captcha.setting.view'],
            ['System Settings', 'Captcha Setting', 'edit', 'system.settings.captcha.setting.edit'],
            ['System Settings', 'File Types', 'view', 'system.settings.file.types.view'],
            ['System Settings', 'File Types', 'edit', 'system.settings.file.types.edit'],
            ['System Settings', 'System Update', 'view', 'system.settings.system.update.view'],
            ['System Settings', 'Modules', 'view', 'system.settings.modules.view'],
            ['System Settings', 'Modules', 'edit', 'system.settings.modules.edit'],
        ];

        foreach ($missingPermissions as [$module, $feature, $capability, $name]) {
            $exists = DB::table('permissions')->where('name', $name)->exists();
            if (!$exists) {
                DB::table('permissions')->insert([
                    'module' => $module,
                    'feature' => $feature,
                    'capability' => $capability,
                    'name' => $name,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }

        // Assign ALL system.settings.* permissions to Admin role
        $adminRole = DB::table('roles')->where('name', 'Admin')->first();
        if ($adminRole) {
            $allSysPermIds = DB::table('permissions')
                ->where('name', 'like', 'system.settings.%')
                ->pluck('id')
                ->toArray();

            $existingPermIds = DB::table('permission_role')
                ->where('role_id', $adminRole->id)
                ->whereIn('permission_id', $allSysPermIds)
                ->pluck('permission_id')
                ->toArray();

            $newPermIds = array_diff($allSysPermIds, $existingPermIds);
            foreach ($newPermIds as $permId) {
                DB::table('permission_role')->insert([
                    'role_id' => $adminRole->id,
                    'permission_id' => $permId,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }
    }

    public function down(): void
    {
        $names = [
            'system.settings.whatsapp.messaging.view', 'system.settings.whatsapp.messaging.edit',
            'system.settings.whatsapp.gateway.view', 'system.settings.whatsapp.gateway.edit',
            'system.settings.thermal.print.view', 'system.settings.thermal.print.edit',
            'system.settings.online.admission.view', 'system.settings.online.admission.edit',
            'system.settings.admission.form.view', 'system.settings.admission.form.edit',
            'system.settings.roles.permissions.view', 'system.settings.roles.permissions.edit',
            'system.settings.addons.view', 'system.settings.addons.edit',
            'system.settings.captcha.setting.view', 'system.settings.captcha.setting.edit',
            'system.settings.file.types.view', 'system.settings.file.types.edit',
            'system.settings.system.update.view',
            'system.settings.modules.view', 'system.settings.modules.edit',
        ];

        DB::table('permission_role')
            ->whereIn('permission_id', function ($q) use ($names) {
                $q->select('id')->from('permissions')->whereIn('name', $names);
            })
            ->delete();

        DB::table('permissions')->whereIn('name', $names)->delete();
    }
};
