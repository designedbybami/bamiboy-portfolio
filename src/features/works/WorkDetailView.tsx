import { notFound } from "next/navigation";
import { TrackCaseStudyView } from "./components/TrackCaseStudyView";
import { getWorkBySlug } from "./works-data";

export function WorkDetailView({ slug }: { slug: string }) {
  const work = getWorkBySlug(slug);
  if (!work) notFound();

  return (
    <section>
      <TrackCaseStudyView projectName={work.title} projectType={work.tags[0]} />
      <h1>{work.title}</h1>
      <p>{work.summary}</p>
    </section>
  );
}
