import { Card, CardContent } from "@/components/ui/card"

interface StatsCardProps {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  iconColor?: string;
}

export function StatsCard({
  title,
  value,
  description,
  icon,
  iconColor = "text-blue-600"
}: StatsCardProps) {
  return (
    <Card className="hover:shadow-lg transition-all">
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0">
          <h3 className="tracking-tight text-sm font-medium text-muted-foreground">{title}</h3>
          <div className={`p-2 rounded-full bg-background ${iconColor}/10`}>
            {icon}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="text-2xl font-bold">{value}</div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
