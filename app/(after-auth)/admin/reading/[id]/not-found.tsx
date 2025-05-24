import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex h-[400px] flex-col items-center justify-center space-y-4">
      <h2 className="text-2xl font-bold">RC Level Not Found</h2>
      <p className="text-gray-600">Could not find the requested RC level.</p>
      <Button asChild>
        <Link href="/admin/reading">Return to RC Levels</Link>
      </Button>
    </div>
  );
}
