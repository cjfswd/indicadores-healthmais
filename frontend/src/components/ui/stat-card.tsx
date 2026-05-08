import React from 'react';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export function StatCard({ 
  title, value, description, icon: Icon, trend, trendValue
}: { 
  title: string; 
  value: string | number; 
  description: string; 
  icon: React.ElementType; 
  trend?: 'up' | 'down' | 'neutral'; 
  trendValue?: string;
}) {
  return (
    <Card className="relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 duration-300 group">
      <div className="absolute top-0 right-0 p-4 opacity-[0.06] group-hover:opacity-[0.12] transition-opacity">
        <Icon className="w-20 h-20" />
      </div>
      <CardHeader className="pb-2">
        <CardDescription className="text-xs font-medium uppercase tracking-wider">{title}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-3">
          <span className="text-4xl font-black tracking-tight text-foreground">{value}</span>
          {trend && trendValue && (
            <Badge 
              variant={trend === 'up' ? 'default' : trend === 'down' ? 'destructive' : 'secondary'} 
              className="mb-1 text-[11px] gap-1"
            >
              {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {trendValue}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2 font-medium">{description}</p>
      </CardContent>
    </Card>
  );
}
