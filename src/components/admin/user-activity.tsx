import { User, Mail, Shield, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface UserActivity {
  id: string;
  name: string;
  email: string;
  role: "SUPERADMIN" | "ADMIN" | "CUSTOMER";
  created_at: string;
}

interface UserActivityProps {
  users: UserActivity[];
  currentUserRole?: "SUPERADMIN" | "ADMIN" | "CUSTOMER"; // Add current user role prop
}

export default function UserActivity({
  users,
  currentUserRole,
}: UserActivityProps) {
  // Filter out SUPERADMIN users if current user is not SUPERADMIN
  const filteredUsers = users.filter((user) => {
    if (currentUserRole === "SUPERADMIN") {
      return true; // SUPERADMIN can see all users
    }
    return user.role !== "SUPERADMIN"; // Others can't see SUPERADMIN
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "SUPERADMIN":
        return <Shield className="h-4 w-4 text-purple-500" />;
      case "ADMIN":
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
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

  const formatDate = (dateString: string) => {
    if (!dateString) return "Unknown date";

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid date";

      const now = new Date();
      const diffInDays = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (diffInDays === 0) {
        return "Today";
      } else if (diffInDays === 1) {
        return "Yesterday";
      } else if (diffInDays < 7) {
        return `${diffInDays} days ago`;
      } else if (diffInDays < 30) {
        const weeks = Math.floor(diffInDays / 7);
        return `${weeks} week${weeks !== 1 ? "s" : ""} ago`;
      } else {
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      }
    } catch (error) {
      return "Invalid date";
    }
  };

  const getDateIcon = (dateString: string) => {
    if (!dateString) return null;

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return <Calendar className="h-3 w-3" />;

      const now = new Date();
      const diffInDays = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (diffInDays === 0) {
        return <div className="h-2 w-2 rounded-full bg-green-500"></div>;
      } else if (diffInDays <= 3) {
        return <div className="h-2 w-2 rounded-full bg-blue-500"></div>;
      } else {
        return <Calendar className="h-3 w-3" />;
      }
    } catch (error) {
      return <Calendar className="h-3 w-3" />;
    }
  };

  // Calculate new users in last 7 days (excluding SUPERADMIN for non-SUPERADMIN users)
  const getNewUsersCount = () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return filteredUsers.filter((user) => {
      try {
        const userDate = new Date(user.created_at);
        return userDate >= sevenDaysAgo;
      } catch {
        return false;
      }
    }).length;
  };

  const newUsersCount = getNewUsersCount();

  // Don't show component if no users to display (after filtering)
  if (filteredUsers.length === 0) {
    return (
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Recent User Activity
          </h3>
          <p className="text-sm text-gray-600">No user activity to display</p>
        </div>
        <div className="px-6 py-12 text-center">
          <div className="text-gray-400">No users found</div>
          <p className="mt-1 text-sm text-gray-500">
            Users will appear here once they register
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Recent User Activity
            </h3>
            <p className="text-sm text-gray-600">
              New users who joined recently
            </p>
          </div>
          {newUsersCount > 0 && (
            <div className="px-3 py-1 bg-blue-50 rounded-full">
              <span className="text-sm font-medium text-blue-700">
                +{newUsersCount} new this week
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="shrink-0 h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {user.name}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-900">
                    <Mail className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="truncate max-w-200">{user.email}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}
                  >
                    {getRoleIcon(user.role)}
                    <span className="ml-1">{user.role}</span>
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-900">
                    <span className="mr-2">{getDateIcon(user.created_at)}</span>
                    <span>{formatDate(user.created_at)}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center">
              <User className="h-3 w-3 mr-1" />
              <span>
                {filteredUsers.length} user
                {filteredUsers.length !== 1 ? "s" : ""}
                {currentUserRole !== "SUPERADMIN" && (
                  <span className="text-xs text-gray-500 ml-2">in total</span>
                )}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-green-500 mr-1"></div>
                <span className="text-xs">Today</span>
              </div>
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-blue-500 mr-1"></div>
                <span className="text-xs">Last 3 days</span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                <span className="text-xs">Older</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
