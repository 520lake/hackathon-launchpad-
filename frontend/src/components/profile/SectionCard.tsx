import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface SectionCardProps {
  title: string;
  count: number;
  maxPreview?: number;
  onViewMore: () => void;
  children: React.ReactNode;
  emptyText?: string;
}

export default function SectionCard({
  title,
  count,
  maxPreview,
  onViewMore,
  children,
  emptyText = "未找到相关项目",
}: SectionCardProps) {
  const showViewMore = maxPreview != null ? count > maxPreview : count > 0;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <CardTitle className="text-base">{title}</CardTitle>
          <Badge variant="outline">{count}</Badge>
        </div>
        {showViewMore && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewMore}
            className="h-auto gap-1 px-2 text-xs"
          >
            查看更多
            <svg className="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <Separator className="mb-4" />
        {count > 0 ? children : (
          <div className="py-8 text-center text-sm text-muted-foreground">
            {emptyText}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
