export default function PdfRenderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Intentionally minimal. Print route injects its own CSS.
  return <>{children}</>;
}

