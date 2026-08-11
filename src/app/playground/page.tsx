import type { Metadata } from "next";
import { PlaygroundView } from "@/features/playground/PlaygroundView";

export const metadata: Metadata = { title: "Playground" };

export default function Page() {
  return <PlaygroundView />;
}
