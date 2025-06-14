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
}

export function RCQuizPassage({ title, passage }: PassageProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          <span
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(title),
            }}
          />
        </CardTitle>
        <CardDescription>Reading Passage</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none">
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            <span
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(passage),
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
