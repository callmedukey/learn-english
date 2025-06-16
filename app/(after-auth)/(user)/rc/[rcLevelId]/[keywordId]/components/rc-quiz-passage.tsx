import DOMPurify from "isomorphic-dompurify";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PassageProps {
  title: string;
  passage: string;
  fontSizeClasses: string;
}

export function RCQuizPassage({
  title,
  passage,
  fontSizeClasses,
}: PassageProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          <div
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(title),
            }}
          />
        </CardTitle>
        <CardDescription>Reading Passage</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none">
          <div
            className={`text-sm leading-relaxed whitespace-pre-line [&_p]:mb-2 [&_p:empty]:h-4 [&_p:last-child]:mb-0 ${fontSizeClasses}`}
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(passage),
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
