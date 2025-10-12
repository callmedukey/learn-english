import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
      <h2 className="text-2xl font-bold">BPA Level Not Found</h2>
      <p className="text-gray-600">
        The BPA level you are looking for does not exist.
      </p>
      <Link href="/admin/bpa">
        <Button>Return to BPA Levels</Button>
      </Link>
    </div>
  );
}
