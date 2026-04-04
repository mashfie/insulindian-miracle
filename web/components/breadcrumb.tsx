import Link from "next/link";

type BreadcrumbItem = {
  href: string;
  label: string;
};

type BreadcrumbProps = {
  items: BreadcrumbItem[];
  current: string;
};

export function Breadcrumb({ items, current }: BreadcrumbProps) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <ol>
        {items.map((item) => (
          <li key={item.href}>
            <Link href={item.href}>{item.label}</Link>
          </li>
        ))}
        <li aria-current="page">{current}</li>
      </ol>
    </nav>
  );
}
