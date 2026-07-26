<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Http\Request;

class RoleController extends Controller
{
    use \App\Traits\ApiResponse;

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $roles = Role::query()
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->latest()
            ->paginate($request->limit ?? 10);

        return $this->success($roles, 'Roles retrieved successfully');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:roles,name',
            'is_system' => 'boolean'
        ]);

        // If is_system is not provided, it will use the DB default (true)
        $role = Role::create($validated);

        return $this->success($role, 'Role created successfully', 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Role $role)
    {
        return $this->success($role, 'Role retrieved successfully');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Role $role)
    {
        if ($role->name === 'Super Admin') {
            return $this->error('Super Admin role cannot be updated', 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|unique:roles,name,' . $role->id,
            'is_system' => 'boolean'
        ]);

        $role->update($validated);

        return $this->success($role, 'Role updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Role $role)
    {
        if ($role->name === 'Super Admin') {
            return $this->error('Super Admin role cannot be deleted', 403);
        }

        $role->delete();

        return $this->success(null, 'Role deleted successfully');
    }
}
