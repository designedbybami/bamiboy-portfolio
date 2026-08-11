import type { Metadata } from "next";
import { AboutView } from "@/features/about/AboutView";

export const metadata: Metadata = { title: "About" };

export default function Page() {
  return <AboutView />;
}
