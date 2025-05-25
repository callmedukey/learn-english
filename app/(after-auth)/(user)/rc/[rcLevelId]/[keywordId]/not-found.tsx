import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h2 className="mb-4 text-2xl font-bold text-foreground">
        Topic Not Found
      </h2>
      <p className="mb-8 text-muted-foreground">
        The reading comprehension topic you&apos;re looking for doesn&apos;t
        exist.
      </p>
      <Link href="/rc">
        <Button>Return to RC Levels</Button>
      </Link>
    </div>
  );
}
