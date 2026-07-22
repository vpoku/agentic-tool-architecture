"use client";

import { AppShell } from "@/components/layout/AppShell";
import { CanvasBuilder } from "@/components/canvas/CanvasBuilder";

export default function AppBuilderPage() {
  return (
    <AppShell>
      <CanvasBuilder />
    </AppShell>
  );
}
