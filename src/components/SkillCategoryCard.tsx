import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

interface SkillCategoryCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  count: number;
  color: string;
}

const SkillCategoryCard = ({ 
  title, 
  description, 
  icon: Icon, 
  count,
  color 
}: SkillCategoryCardProps) => {
  return (
    <Card className="bg-gradient-card shadow-card hover:shadow-hero transition-all duration-300 border-0 group cursor-pointer">
      <CardContent className="p-6 text-center">
        <div className={`mx-auto w-16 h-16 rounded-full bg-gradient-to-br ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="h-8 w-8 text-white" />
        </div>
        
        <h3 className="font-semibold text-lg text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm mb-4">{description}</p>
        
        <Badge variant="secondary" className="text-xs">
          {count} mentors available
        </Badge>
      </CardContent>
    </Card>
  );
};

export default SkillCategoryCard;