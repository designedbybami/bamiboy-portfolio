import Link from "next/link";
import { works } from "./works-data";

export function WorksListView() {
  return (
    <section>
      <h1>Works</h1>
      <ul>
        {works.map((work) => (
          <li key={work.slug}>
            <Link href={`/works/${work.slug}`}>{work.title}</Link>
            <p>{work.summary}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
