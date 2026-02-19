"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { ExpandableVisitorRow } from "./expandable-visitor-row";

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

export function VisitorTrackingTable() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [filteredVisitors, setFilteredVisitors] = useState<Visitor[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "registered" | "anonymous">(
    "all",
  );
  const [bulkDelete, setBulkDelete] = useState<string[]>([]);

  const fetchVisitors = async (pageNum = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: "15",
      });

      if (searchTerm) {
        params.set("search", searchTerm);
      }

      if (filter !== "all") {
        params.set("filter", filter);
      }

      const response = await fetch(`/api/admin/visitors?${params.toString()}`);
      const data = await response.json();

      setVisitors(data.visitors || []);
      setFilteredVisitors(data.visitors || []);
      setTotalPages(data.pages || 1);
      setBulkDelete([]); // Reset bulk delete
    } catch (error) {
      console.error("Error fetching visitors:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors(page);
  }, [page, filter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchVisitors(1);
  };

  const handleRefresh = () => {
    fetchVisitors(page);
  };

  const handleDelete = (id: string) => {
    setVisitors((prev) => prev.filter((v) => v.id !== id));
    setFilteredVisitors((prev) => prev.filter((v) => v.id !== id));
  };

  const handleBulkDelete = async () => {
    if (bulkDelete.length === 0) return;
    if (!confirm(`Delete ${bulkDelete.length} selected sessions?`)) return;

    try {
      await Promise.all(
        bulkDelete.map((id) =>
          fetch(`/api/admin/visitors/${id}`, { method: "DELETE" }),
        ),
      );
      fetchVisitors(page); // Refresh
    } catch (error) {
      console.error("Bulk delete failed:", error);
    }
  };

  const handleExport = () => {
    const csvContent = filteredVisitors.map((v) => ({
      SessionID: v.session_id,
      User: v.users ? v.users.email : "Anonymous",
      Name: v.users ? v.users.name : "Guest",
      IP: v.ip_address,
      Device: v.device_info,
      VisitedAt: new Date(v.visited_at).toLocaleString(),
    }));

    const csv = [
      Object.keys(csvContent[0] || {}).join(","),
      ...csvContent.map((row) => Object.values(row).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `visitors-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="p-6">
      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Search by email, IP, or session..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-80"
          />
          <Button type="submit" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </form>

        <div className="flex gap-2 flex-wrap">
          {/* Filter Buttons */}
          <div className="flex border rounded-lg">
            <Button
              variant={filter === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter("all")}
              className="rounded-r-none"
            >
              All
            </Button>
            <Button
              variant={filter === "registered" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter("registered")}
              className="rounded-none"
            >
              Registered
            </Button>
            <Button
              variant={filter === "anonymous" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter("anonymous")}
              className="rounded-l-none"
            >
              Anonymous
            </Button>
          </div>

          {/* Action Buttons */}
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          {bulkDelete.length > 0 && (
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete ({bulkDelete.length})
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-180">Session</TableHead>
              <TableHead className="w-200">User</TableHead>
              <TableHead className="w-150">IP Address</TableHead>
              <TableHead className="w-150">Device</TableHead>
              <TableHead className="w-150">Visit Time</TableHead>
              <TableHead className="w-80">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <td colSpan={6} className="text-center py-8">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                </td>
              </TableRow>
            ) : filteredVisitors.length === 0 ? (
              <TableRow>
                <td colSpan={6} className="text-center py-8">
                  <div className="text-gray-500">No visitor data found</div>
                </td>
              </TableRow>
            ) : (
              filteredVisitors.map((visitor) => (
                <ExpandableVisitorRow
                  key={visitor.id}
                  visitor={visitor}
                  onDelete={handleDelete}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!loading && filteredVisitors.length > 0 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-500">
            Showing {filteredVisitors.length} of {totalPages * 15} visitors
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center px-3">
              <span className="text-sm">
                Page {page} of {totalPages}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
