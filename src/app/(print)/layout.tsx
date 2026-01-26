import type { PropsWithChildren } from "react";

export default function PrintRootLayout({ children }: PropsWithChildren) {
  return (
    <div style={{ background: "#fff" }}>
      {children}
    </div>
  );
}