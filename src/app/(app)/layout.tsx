import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { requireWorkspace } from "@/lib/workspace";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, workspace } = await requireWorkspace();

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar
          user={{ name: user.name, email: user.email }}
          workspaceName={workspace.name}
        />
        <main className="flex-1 px-4 py-6 pb-24 md:px-8 md:pb-10">{children}</main>
        <MobileNav />
      </div>
    </div>
  );
}
