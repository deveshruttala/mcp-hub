import { prisma } from "@/lib/db";
import { requireWorkspace } from "@/lib/workspace";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/utils";

export default async function SettingsPage() {
  const { user, workspace, role } = await requireWorkspace();
  const counts = await prisma.workspace.findUnique({
    where: { id: workspace.id },
    include: { _count: { select: { members: true, agents: true, installedTools: true, memoryItems: true } } },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your profile, workspace, billing, and security." />
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="workspace">Workspace</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Your personal account information.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:max-w-md">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input defaultValue={user.name ?? ""} />
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input defaultValue={user.email ?? ""} disabled />
              </div>
              <Button disabled>Save changes (placeholder)</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workspace">
          <Card>
            <CardHeader>
              <CardTitle>Workspace</CardTitle>
              <CardDescription>Workspace-level configuration.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 md:max-w-md">
              <div className="space-y-1">
                <Label>Workspace name</Label>
                <Input defaultValue={workspace.name} />
              </div>
              <div className="space-y-1">
                <Label>Slug</Label>
                <Input defaultValue={workspace.slug} disabled />
              </div>
              <dl className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded border bg-muted/20 p-3">
                  <dt className="text-muted-foreground">Members</dt>
                  <dd className="text-base font-semibold">{counts?._count.members ?? 1}</dd>
                </div>
                <div className="rounded border bg-muted/20 p-3">
                  <dt className="text-muted-foreground">Agents</dt>
                  <dd className="text-base font-semibold">{counts?._count.agents ?? 0}</dd>
                </div>
                <div className="rounded border bg-muted/20 p-3">
                  <dt className="text-muted-foreground">Installed tools</dt>
                  <dd className="text-base font-semibold">{counts?._count.installedTools ?? 0}</dd>
                </div>
                <div className="rounded border bg-muted/20 p-3">
                  <dt className="text-muted-foreground">Memory items</dt>
                  <dd className="text-base font-semibold">{counts?._count.memoryItems ?? 0}</dd>
                </div>
              </dl>
              <Badge variant="info">Your role: {role}</Badge>
              <p className="text-xs text-muted-foreground">Created {formatDate(workspace.createdAt)}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Billing</CardTitle>
              <CardDescription>Plan and usage. Billing is a placeholder in the MVP.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 md:max-w-md">
              <div className="rounded border bg-muted/20 p-4">
                <p className="text-sm font-semibold">Current plan</p>
                <p className="mt-1 text-2xl font-semibold capitalize">{workspace.plan}</p>
                <p className="text-xs text-muted-foreground">No payment method on file</p>
              </div>
              <Button disabled>Upgrade (placeholder)</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Authentication, sessions, and audit log.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 md:max-w-md">
              <div className="rounded border bg-muted/20 p-4 text-sm">
                <p className="font-semibold">Two-factor authentication</p>
                <p className="mt-1 text-xs text-muted-foreground">Coming soon. Add TOTP-based 2FA for admin actions.</p>
              </div>
              <div className="rounded border bg-muted/20 p-4 text-sm">
                <p className="font-semibold">Single sign-on (SSO)</p>
                <p className="mt-1 text-xs text-muted-foreground">Available on Team plan and above.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Data export & deletion</CardTitle>
              <CardDescription>Export your workspace, or queue a deletion request.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 md:max-w-md">
              <Button variant="outline">Export workspace (placeholder)</Button>
              <Button variant="destructive" disabled>
                Delete workspace (placeholder)
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
