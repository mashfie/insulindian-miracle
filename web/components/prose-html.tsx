type ProseHtmlProps = {
  html: string;
  className?: string;
};

export function ProseHtml({ html, className }: ProseHtmlProps) {
  return (
    <div
      className={className ? `prose ${className}` : "prose"}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
