import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MapPin, Clock, DollarSign } from "lucide-react";
import { useLocation } from "wouter";

interface JobCardProps {
  id: string;
  title: string;
  organization: string;
  location: string;
  type: string;
  salary?: string;
  postedDate: string;
  description: string;
  tags: string[];
  jobUrl?: string;
}

export const JobCard = ({ 
  id,
  title, 
  organization, 
  location, 
  type, 
  salary, 
  postedDate, 
  description, 
  tags,
  jobUrl
}: JobCardProps) => {
  const [, navigate] = useLocation();

  const handleClick = () => {
    // Save job data to localStorage for wouter navigation
    try {
      const jobData = {
        id,
        title,
        organization,
        location,
        type,
        salary,
        postedDate,
        description,
        tags,
        jobUrl
      };
      localStorage.setItem(`job_${id}`, JSON.stringify(jobData));
      navigate(`/job/${id}`);
    } catch (error) {
      console.error('Error saving job data:', error);
      navigate(`/job/${id}`);
    }
  };

  return (
    <Card 
      className="hover:shadow-card transition-all duration-200 border-border bg-card cursor-pointer hover:scale-[1.02]" 
      onClick={handleClick}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-card-foreground mb-1 hover:text-primary transition-colors cursor-pointer">
              {title}
            </h3>
            <p className="text-primary font-medium mb-2">{organization}</p>
          </div>
          <Badge variant="secondary" className="text-xs">
            {type}
          </Badge>
        </div>
        
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {location}
          </div>
          {salary && (
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {salary}
            </div>
          )}
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {postedDate}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
          {description}
        </p>
        
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};