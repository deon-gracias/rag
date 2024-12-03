import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grow flex items-center justify-center flex-col">
      <h2 className="text-6xl font-semibold tracking-tighter">404</h2>
      <p className="text-2xl mt-1">Not Found</p>
      <Link href="/" className={cn(buttonVariants({ size: "lg" }), "mt-8")}>
        <span>Return Home</span> <ArrowRightIcon />
      </Link>
    </div>
  );
}
