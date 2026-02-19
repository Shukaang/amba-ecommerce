"use client";

import { useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronRight,
  User,
  Monitor,
  Globe,
  Calendar,
  FileText,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Visitor {
  id: string;
  session_id: string;
  user_id: string;
  users?: { email: string; name: string };
  ip_address: string;
  device_info: string;
  visited_at: string;
  updated_at: string;
}

interface ExpandableVisitorRowProps {
  visitor: Visitor;
  onDelete: (id: string) => void;
}

export function ExpandableVisitorRow({
  visitor,
  onDelete,
}: ExpandableVisitorRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Format duration
  const getDuration = (visitedAt: string) => {
    const now = new Date();
    const visited = new Date(visitedAt);
    const diff = Math.floor((now.getTime() - visited.getTime()) / 1000);
    return diff < 60 ? `${diff}s` : `${Math.floor(diff / 60)}m ${diff % 60}s`;
  };

  // Get browser info
  const getBrowserInfo = (deviceInfo: string) => {
    if (deviceInfo.includes("Chrome")) return "Chrome";
    if (deviceInfo.includes("Firefox")) return "Firefox";
    if (deviceInfo.includes("Safari")) return "Safari";
    if (deviceInfo.includes("Edge")) return "Edge";
    return "Unknown";
  };

  // Get device type
  const getDeviceType = (deviceInfo: string) => {
    if (/mobile|android|iphone/i.test(deviceInfo)) return "Mobile";
    if (/tablet|ipad/i.test(deviceInfo)) return "Tablet";
    return "Desktop";
  };

  const handleDelete = async () => {
    if (!confirm("Delete this visitor session?")) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/visitors/${visitor.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        onDelete(visitor.id);
      }
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {/* Main Row */}
      <TableRow className="cursor-pointer hover:bg-gray-50">
        <TableCell onClick={() => setIsExpanded(!isExpanded)}>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-6 w-6">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
            <span className="font-mono text-xs">
              {visitor.session_id.substring(0, 8)}...
            </span>
          </div>
        </TableCell>
        <TableCell onClick={() => setIsExpanded(!isExpanded)}>
          <div className="flex items-center gap-2">
            {visitor.users ? (
              <>
                <User className="h-4 w-4 text-green-600" />
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    {visitor.users.name}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {visitor.users.email}
                  </div>
                </div>
              </>
            ) : (
              <Badge variant="outline" className="text-gray-500">
                Anonymous
              </Badge>
            )}
          </div>
        </TableCell>
        <TableCell onClick={() => setIsExpanded(!isExpanded)}>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-blue-600" />
            <span className="font-mono text-sm">{visitor.ip_address}</span>
          </div>
        </TableCell>
        <TableCell onClick={() => setIsExpanded(!isExpanded)}>
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4 text-purple-600" />
            <div>
              <div className="font-medium text-sm">
                {getBrowserInfo(visitor.device_info)}
              </div>
              <div className="text-xs text-gray-500">
                {getDeviceType(visitor.device_info)}
              </div>
            </div>
          </div>
        </TableCell>
        <TableCell onClick={() => setIsExpanded(!isExpanded)}>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-600" />
            <div className="text-sm">
              {new Date(visitor.visited_at).toLocaleDateString()}
              <div className="text-xs text-gray-500">
                {new Date(visitor.visited_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={deleting}
            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>

      {/* Expanded Details Row */}
      {isExpanded && (
        <TableRow className="bg-gray-50">
          <TableCell colSpan={6} className="p-0">
            <div className="p-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {/* Session Info */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Session Details
                  </h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Session ID:</span>
                      <span className="font-mono text-xs truncate max-w-120">
                        {visitor.session_id.substring(0, 12)}...
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span>{getDuration(visitor.visited_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Active:</span>
                      <span>
                        {visitor.updated_at &&
                        visitor.updated_at !== "Invalid Date"
                          ? new Date(visitor.updated_at).toLocaleTimeString()
                          : new Date(visitor.visited_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* User Info */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <User className="h-4 w-4" />
                    User Information
                  </h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span>
                        {visitor.users ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            Registered
                          </Badge>
                        ) : (
                          <Badge variant="outline">Guest</Badge>
                        )}
                      </span>
                    </div>
                    {visitor.users && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Name:</span>
                          <span>{visitor.users.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Email:</span>
                          <span>{visitor.users.email}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Device Info */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    Device Information
                  </h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Browser:</span>
                      <span>{getBrowserInfo(visitor.device_info)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Device:</span>
                      <span>{getDeviceType(visitor.device_info)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">IP Address:</span>
                      <span className="font-mono text-xs">
                        {visitor.ip_address}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
