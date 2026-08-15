import { notFound } from "next/navigation";
import { TrackWorkView } from "./components/TrackWorkView";
import { getWorkBySlug } from "./works-data";

export function WorkDetailView({ slug }: { slug: string }) {
  const work = getWorkBySlug(slug);
  if (!work) notFound();

  return (
    <section>
      <TrackWorkView slug={work.slug} projectName={work.title} projectType={work.projectType} presentationType={work.presentationType} />
      <h1>{work.title}</h1>
      <p>{work.summary}</p>
    </section>
  );
}
