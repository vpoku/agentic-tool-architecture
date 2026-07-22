"use client";

import { AppShell } from "@/components/layout/AppShell";
import { MigrationCanvasBuilder } from "@/components/migration/MigrationCanvasBuilder";

export default function MigrationLandingPage() {
  return (
    <AppShell>
      <MigrationCanvasBuilder />
    </AppShell>
  );
}
