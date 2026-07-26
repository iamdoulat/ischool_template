<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class PermissionController extends Controller
{
    use ApiResponse;

    public function index()
    {
        $permissions = Permission::all()->groupBy('module');
        // Transform for easier frontend consumption if needed, 
        // but grouping by module is a good start. 
        // We might want to group by Feature as well: Module -> Feature -> Capabilities

        $formattedPermissions = [];
        foreach ($permissions as $module => $modulePermissions) {
            $formattedPermissions[$module] = $modulePermissions->groupBy('feature');
        }

        return $this->success($formattedPermissions, 'Permissions retrieved successfully');
    }

    public function getRolePermissions(string $roleId)
    {
        $role = Role::find($roleId);

        if (!$role) {
            return $this->error('Role not found', 404);
        }

        $permissions = $role->permissions()->pluck('name');

        return $this->success($permissions, 'Role permissions retrieved successfully');
    }

    public function updateRolePermissions(Request $request, string $roleId)
    {
        $role = Role::find($roleId);

        if (!$role) {
            return $this->error('Role not found', 404);
        }

        if ($role->is_system && $role->name === 'Super Admin') {
            return $this->error('Cannot modify Super Admin permissions', 403);
        }

        $request->validate([
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,name'
        ]);

        $permissionNames = $request->input('permissions', []);
        $permissionIds = Permission::whereIn('name', $permissionNames)->pluck('id');

        $role->permissions()->sync($permissionIds);

        return $this->success(null, 'Role permissions updated successfully');
    }

    public function getRoleDashboardWidgets(Role $role)
    {
        $widgetKeys = $role->dashboardWidgets()->pluck('widget_key');
        return $this->success($widgetKeys, 'Dashboard widgets retrieved successfully');
    }

    public function updateRoleDashboardWidgets(Request $request, Role $role)
    {
        $request->validate([
            'widgets' => 'array',
            'widgets.*' => 'string'
        ]);

        $role->dashboardWidgets()->delete();
        foreach ($request->input('widgets', []) as $widgetKey) {
            $role->dashboardWidgets()->create(['widget_key' => $widgetKey]);
        }

        return $this->success(null, 'Dashboard widgets updated successfully');
    }
}
