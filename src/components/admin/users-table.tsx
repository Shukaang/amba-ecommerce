"use client";

import { useState, useEffect } from "react";
import {
  Edit,
  Trash2,
  Mail,
  User,
  Shield,
  Ban,
  CheckCircle,
  Clock,
  Save,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  address: string | null;
  role: "SUPERADMIN" | "ADMIN" | "CUSTOMER";
  status: "ACTIVE" | "INACTIVE" | "BANNED";
  created_at: string;
}

interface UsersTableProps {
  users: User[];
}

export default function UsersTable({ users }: UsersTableProps) {
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editData, setEditData] = useState<{
    role: "SUPERADMIN" | "ADMIN" | "CUSTOMER";
    status: "ACTIVE" | "INACTIVE" | "BANNED";
  } | null>(null);
  const [localUsers, setLocalUsers] = useState<User[]>(users);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    setLocalUsers(users);
  }, [users]);

  const isSuperAdmin = currentUser?.role === "SUPERADMIN";
  const isAdmin = currentUser?.role === "ADMIN" || isSuperAdmin;

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "SUPERADMIN":
        return <Shield className="h-4 w-4 text-purple-600" />;
      case "ADMIN":
        return <Shield className="h-4 w-4 text-blue-600" />;
      default:
        return <User className="h-4 w-4 text-green-600" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "SUPERADMIN":
        return "bg-purple-100 text-purple-800";
      case "ADMIN":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-green-100 text-green-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "INACTIVE":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "BANNED":
        return <Ban className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "INACTIVE":
        return "bg-yellow-100 text-yellow-800";
      case "BANNED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredUsers = localUsers.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.address?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus =
      statusFilter === "all" || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleEditClick = (user: User) => {
    if (!isSuperAdmin) return;
    setEditingUser(user.id);
    setEditData({
      role: user.role,
      status: user.status,
    });
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditData(null);
  };

  const handleSaveEdit = async (userId: string) => {
    if (!editData || !isSuperAdmin) return;

    setLoading(`save-${userId}`);

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: editData.role,
          status: editData.status,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update user");
      }

      setLocalUsers((prev) =>
        prev.map((user) =>
          user.id === userId
            ? { ...user, role: editData.role, status: editData.status }
            : user,
        ),
      );

      toast.success("User updated successfully");
      setEditingUser(null);
      setEditData(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to update user");
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (!isSuperAdmin) return;

    if (
      !confirm(
        `Are you sure you want to permanently delete user "${userName}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    setLoading(`delete-${userId}`);

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete user");
      }

      setLocalUsers((prev) => prev.filter((user) => user.id !== userId));
      toast.success("User deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete user");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
      {/* Filters */}
      <div className="p-4 border-b">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 max-w-lg">
            <input
              type="search"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="CUSTOMER">Customer</option>
              {isAdmin && <option value="ADMIN">Admin</option>}
              {isSuperAdmin && <option value="SUPERADMIN">Super Admin</option>}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="BANNED">Banned</option>
            </select>
          </div>
        </div>
        {isSuperAdmin && (
          <div className="mt-2 flex items-center text-xs text-blue-600">
            <Shield className="h-3 w-3 mr-1" />
            <span>SUPERADMIN privileges enabled</span>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              {/* Only show Actions column header for SUPERADMIN */}
              {isSuperAdmin && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">
                        {user.name}
                        {currentUser?.id === user.id && (
                          <span className="ml-2 text-xs text-blue-600">
                            (You)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 text-gray-400 mr-2" />
                      {user.email}
                    </div>
                    {user.phone && (
                      <div className="text-sm text-gray-500 mt-1">
                        {user.phone}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {editingUser === user.id && isSuperAdmin ? (
                    <select
                      value={editData?.role || user.role}
                      onChange={(e) =>
                        setEditData((prev) =>
                          prev
                            ? {
                                ...prev,
                                role: e.target.value as
                                  | "SUPERADMIN"
                                  | "ADMIN"
                                  | "CUSTOMER",
                              }
                            : null,
                        )
                      }
                      className="px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      disabled={loading === `save-${user.id}`}
                    >
                      <option value="CUSTOMER">Customer</option>
                      {isAdmin && <option value="ADMIN">Admin</option>}
                      {isSuperAdmin && (
                        <option value="SUPERADMIN">Super Admin</option>
                      )}
                    </select>
                  ) : (
                    <div className="flex items-center">
                      {getRoleIcon(user.role)}
                      <span
                        className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}
                      >
                        {user.role}
                      </span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  {editingUser === user.id && isSuperAdmin ? (
                    <select
                      value={editData?.status || user.status}
                      onChange={(e) =>
                        setEditData((prev) =>
                          prev
                            ? {
                                ...prev,
                                status: e.target.value as
                                  | "ACTIVE"
                                  | "INACTIVE"
                                  | "BANNED",
                              }
                            : null,
                        )
                      }
                      className="px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      disabled={loading === `save-${user.id}`}
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                      <option value="BANNED">Banned</option>
                    </select>
                  ) : (
                    <div className="flex items-center">
                      {getStatusIcon(user.status)}
                      <span
                        className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}
                      >
                        {user.status}
                      </span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                {/* Only show Actions column for SUPERADMIN */}
                {isSuperAdmin && (
                  <td className="px-6 py-4 text-sm font-medium">
                    {editingUser === user.id ? (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleSaveEdit(user.id)}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          disabled={loading === `save-${user.id}`}
                        >
                          {loading === `save-${user.id}` ? (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent"></span>
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="text-red-600 hover:text-red-900"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        {currentUser?.id !== user.id && (
                          <>
                            <button
                              onClick={() => handleEditClick(user)}
                              className="text-blue-600 hover:text-blue-900"
                              disabled={!!loading}
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(user.id, user.name)}
                              className="text-red-600 hover:text-red-900"
                              disabled={loading === `delete-${user.id}`}
                            >
                              {loading === `delete-${user.id}` ? (
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent"></span>
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && (
          <div className="p-8 text-center">
            <div className="text-gray-400 mb-2">No users found</div>
            <p className="text-sm text-gray-500">
              {searchQuery || roleFilter !== "all" || statusFilter !== "all"
                ? "Try changing your filters"
                : "No users in the system yet"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
