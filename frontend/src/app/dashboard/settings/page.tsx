import { SectionPanel } from "@/components/dashboard/section-panel";
import { AdminSettingsPanel } from "@/components/dashboard/admin-settings-panel";

export default function DashboardSettingsPage() {
  return (
    <SectionPanel
      title="Settings"
      description="Manage staff roles, company access, and module-level view or edit permissions. Only administrators can change these controls."
    >
      <AdminSettingsPanel />
    </SectionPanel>
  );
}
