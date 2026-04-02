type SectionNavProps = {
  items: Array<{
    id: string;
    title: string;
  }>;
  caption: string;
};

export function SectionNav({ items, caption }: SectionNavProps) {
  return (
    <nav className="nav-rail" aria-label="Section navigation">
      <ol>
        {items.map((item) => (
          <li key={item.id}>
            <a href={`#${item.id}`}>{item.title}</a>
          </li>
        ))}
      </ol>
      <p className="nav-rail__caption">{caption}</p>
    </nav>
  );
}
