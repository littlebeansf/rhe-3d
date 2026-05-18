import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-4" style={{ height: "calc(100dvh - 49px)" }}>
      <p className="text-5xl font-bold font-mono" style={{ color: "hsl(185 90% 42%)" }}>404</p>
      <p className="text-sm" style={{ color: "hsl(210 10% 50%)" }}>Page not found</p>
      <Link href="/">
        <span className="text-sm underline cursor-pointer" style={{ color: "hsl(185 90% 52%)" }}>
          Back to Editor
        </span>
      </Link>
    </div>
  );
}
