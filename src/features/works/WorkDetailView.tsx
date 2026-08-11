import { notFound } from "next/navigation";
import { getWorkBySlug } from "./works-data";

export function WorkDetailView({ slug }: { slug: string }) {
  const work = getWorkBySlug(slug);
  if (!work) notFound();

  return (
    <section>
      <h1>{work.title}</h1>
      <p>{work.summary}</p>
    </section>
  );
}
