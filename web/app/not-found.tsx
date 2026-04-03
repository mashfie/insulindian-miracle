import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main-content" className="archive-page" data-variant="archive">
      <article className="site-shell" style={{ paddingTop: "18rem", paddingBottom: "8rem" }}>
        <section className="section-full">
          <h1>Archive Register Missing</h1>
          <p className="lede">
            The requested route is not part of the current archive build.
          </p>
          <p>
            <Link href="/">Return to the landing page</Link>
          </p>
        </section>
      </article>
    </main>
  );
}
