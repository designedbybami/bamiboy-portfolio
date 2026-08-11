import type { Metadata } from "next";
import { WorkDetailView } from "@/features/works/WorkDetailView";
import { getWorkBySlug } from "@/features/works/works-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const work = getWorkBySlug(slug);
  return { title: work?.title ?? "Work" };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <WorkDetailView slug={slug} />;
}
