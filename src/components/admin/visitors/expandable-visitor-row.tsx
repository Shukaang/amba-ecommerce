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
  MapPin,
  Package,
  Eye,
  ShoppingCart,
  Heart,
} from "lucide-react";
import { Visitor } from "@/types/visitor";

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

  const getBrowserInfo = (deviceInfo: string | null) => {
    if (!deviceInfo) return "Unknown";
    if (deviceInfo.includes("Chrome")) return "Chrome";
    if (deviceInfo.includes("Firefox")) return "Firefox";
    if (deviceInfo.includes("Safari")) return "Safari";
    if (deviceInfo.includes("Edge")) return "Edge";
    return "Unknown";
  };

  const getDeviceType = (deviceInfo: string | null) => {
    if (!deviceInfo) return "Unknown";
    if (/mobile|android|iphone/i.test(deviceInfo)) return "Mobile";
    if (/tablet|ipad/i.test(deviceInfo)) return "Tablet";
    return "Desktop";
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0s";
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const handleDeleteClick = () => {
    setDeleting(true);
    onDelete(visitor.id);
    setDeleting(false);
  };

  const viewClicks =
    visitor.product_clicks?.filter((c) => c.type === "view") || [];
  const cartClicks =
    visitor.product_clicks?.filter((c) => c.type === "add_to_cart") || [];
  const wishlistClicks =
    visitor.product_clicks?.filter((c) => c.type === "add_to_wishlist") || [];

  return (
    <>
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
            <MapPin className="h-4 w-4 text-blue-600" />
            <div>
              <div className="font-medium text-sm">
                {visitor.country || "Unknown"}
              </div>
              {visitor.city && (
                <div className="text-xs text-gray-500">{visitor.city}</div>
              )}
            </div>
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
            onClick={handleDeleteClick}
            disabled={deleting}
            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>

      {isExpanded && (
        <TableRow className="bg-gray-50">
          <TableCell colSpan={6} className="p-0">
            <div className="p-4 border-t space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Location
                  </h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Country:</span>
                      <span>{visitor.country || "Unknown"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">City:</span>
                      <span>{visitor.city || "Unknown"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Region:</span>
                      <span>{visitor.region || "Unknown"}</span>
                    </div>
                    {visitor.latitude && visitor.longitude && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Coordinates:</span>
                        <span className="font-mono text-xs">
                          {visitor.latitude.toFixed(2)},{" "}
                          {visitor.longitude.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Session
                  </h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Session ID:</span>
                      <span className="font-mono text-xs">
                        {visitor.session_id.slice(0, 32)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span>{formatDuration(visitor.duration)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Active:</span>
                      <span>
                        {new Date(visitor.updated_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <User className="h-4 w-4" /> User
                  </h4>
                  {visitor.users ? (
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span>{visitor.users.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span>{visitor.users.email}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Guest user</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm flex items-center gap-2 mb-3">
                  <Package className="h-4 w-4" /> Product Interactions
                </h4>
                {visitor.product_clicks && visitor.product_clicks.length > 0 ? (
                  <div className="space-y-3">
                    {viewClicks.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                          <Eye className="h-3 w-3" /> Views ({viewClicks.length}
                          )
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {viewClicks.map((click, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="bg-blue-50 text-blue-700 border-blue-200"
                            >
                              {click.product_title ||
                                `Product ${click.product_id.substring(0, 6)}...`}{" "}
                              at{" "}
                              {new Date(click.timestamp).toLocaleTimeString()}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {cartClicks.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                          <ShoppingCart className="h-3 w-3" /> Added to Cart (
                          {cartClicks.length})
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {cartClicks.map((click, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="bg-green-50 text-green-700 border-green-200"
                            >
                              {click.product_title ||
                                `Product ${click.product_id.substring(0, 6)}...`}{" "}
                              at{" "}
                              {new Date(click.timestamp).toLocaleTimeString()}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {wishlistClicks.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                          <Heart className="h-3 w-3" /> Added to Wishlist (
                          {wishlistClicks.length})
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {wishlistClicks.map((click, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="bg-red-50 text-red-700 border-red-200"
                            >
                              {click.product_title ||
                                `Product ${click.product_id.substring(0, 6)}...`}{" "}
                              at{" "}
                              {new Date(click.timestamp).toLocaleTimeString()}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    No product interactions
                  </p>
                )}
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
