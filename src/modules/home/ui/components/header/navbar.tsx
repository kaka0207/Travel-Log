import Link from "next/link";
import Logo from "./logo";
import FlipLink from "@/components/flip-link";
import { ThemeSwitch } from "@/components/theme-toggle";
import { PenLine } from "lucide-react";

const Navbar = () => {
  return (
    <nav aria-label="主导航">
      <div className="flex items-center gap-5 px-4 pb-3 relative">
        <Logo />
        <div className="hidden lg:flex items-center gap-4">
          <FlipLink href="/travel">Travel</FlipLink>
          <FlipLink href="/discover">Discover</FlipLink>
          <FlipLink href="/blog">Blog</FlipLink>
          <FlipLink href="/about">About</FlipLink>
          <Link
            href="/dashboard/photos"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-primary px-3.5 text-sm text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <PenLine className="size-4" aria-hidden="true" />
            编辑
          </Link>
        </div>
        <ThemeSwitch />
      </div>
    </nav>
  );
};

export default Navbar;