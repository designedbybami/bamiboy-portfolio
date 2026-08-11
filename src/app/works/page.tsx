import type { Metadata } from "next";
import { WorksListView } from "@/features/works/WorksListView";

export const metadata: Metadata = { title: "Works" };

export default function Page() {
  return <WorksListView />;
}
