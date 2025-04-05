import { ReactNode } from "react";
import { Card } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  iconBgColor: string;
}

export default function StatsCard({ title, value, icon, iconBgColor }: StatsCardProps) {
  return (
    <Card className="p-4 flex items-center">
      <div className={`rounded-full h-12 w-12 flex items-center justify-center ${iconBgColor} mr-4`}>
        {icon}
      </div>
      <div>
        <p className="text-neutral-600 text-sm">{title}</p>
        <p className="text-2xl font-medium">{value}</p>
      </div>
    </Card>
  );
}
