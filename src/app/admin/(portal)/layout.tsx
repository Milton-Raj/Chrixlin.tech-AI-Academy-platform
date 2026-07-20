import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="min-w-0 flex-1 bg-navy p-4 sm:p-8">{children}</main>
    </div>
  );
}
