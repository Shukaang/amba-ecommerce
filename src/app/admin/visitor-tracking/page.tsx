import { Metadata } from "next";
import { VisitorAnalytics } from "@/components/admin/visitors/visitor-analytics";
import { VisitorTrackingTable } from "@/components/admin/visitors/visitor-tracking-table";

export const metadata: Metadata = {
  title: "Visitor Tracking - AmbaStore",
  description: "Monitor visitor sessions and analytics",
};

export default function VisitorsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Visitor Tracking</h1>
        <p className="text-gray-600">Monitor all user sessions and activity</p>
      </div>

      <VisitorAnalytics />
      <VisitorTrackingTable />
    </div>
  );
}
