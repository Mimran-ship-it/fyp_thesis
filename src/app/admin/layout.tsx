import { getAdminSession } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  // IMPORTANT:
  // Do not redirect here. This layout wraps /admin/login too, and redirecting
  // would create an infinite loop (307 spam). Route protection is handled by
  // middleware; when unauthenticated we simply render the child (login page)
  // without the admin chrome.
  if (!session) {
    return <div className="flex-1 bg-gray-50">{children}</div>;
  }

  return <AdminShell username={session.username}>{children}</AdminShell>;
}

