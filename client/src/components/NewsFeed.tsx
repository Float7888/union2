import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Calendar, Newspaper, Share } from "lucide-react";
import type { NewsItem } from "@shared/schema";

export function NewsFeed() {
  const [showAll, setShowAll] = useState(false);

  const { data: newsItems = [], isLoading, error } = useQuery<NewsItem[]>({
    queryKey: ['news-items'],
    queryFn: () => fetch('/api/news-items').then(res => {
      if (!res.ok) throw new Error('Failed to fetch news items');
      return res.json();
    }),
  });

  // Sort by publishedAt date (newest first)
  const sortedItems = Array.isArray(newsItems) ? [...newsItems].sort((a, b) => 
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  ) : [];

  // Show only first 5 items unless "Show All" is clicked
  const displayItems = showAll ? sortedItems : sortedItems.slice(0, 5);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  const getTypeIcon = (type: string) => {
    if (type === "social") return <Share className="h-4 w-4" />;
    if (type === "report") return <Newspaper className="h-4 w-4" />;
    return <Newspaper className="h-4 w-4" />;
  };

  const getTypeBadgeColor = (type: string) => {
    if (type === "social") return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    if (type === "report") return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
    return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Newspaper className="h-5 w-5 mr-2" />
            Latest News & Updates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || (newsItems && newsItems.length === 0)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Newspaper className="h-5 w-5 mr-2" />
            Latest News & Updates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            {error ? 'Unable to load news at this time.' : 'No news items available. Check back soon for updates from the labor movement.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Newspaper className="h-5 w-5 mr-2" />
          Latest News & Updates
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayItems.map((item) => (
            <div key={item.id} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0 pb-4 last:pb-0">
              <div className="flex items-start justify-between mb-2">
                <Badge className={`text-xs ${getTypeBadgeColor(item.type)}`}>
                  <span className="flex items-center">
                    {getTypeIcon(item.type)}
                    <span className="ml-1">
                      {item.type === "social" ? "Social" : 
                       item.type === "report" ? "Report" : "News"}
                    </span>
                  </span>
                </Badge>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3 mr-1" />
                  {formatDate(item.publishedAt.toString())}
                </div>
              </div>
              
              <h4 className="font-medium text-sm mb-2 line-clamp-2 leading-tight">
                <a 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {item.title}
                </a>
              </h4>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">
                  {item.source}
                </span>
                <a 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                >
                  Read more
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>
            </div>
          ))}
        </div>
        
        {sortedItems.length > 5 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowAll(!showAll)}
              className="w-full text-sm"
            >
              {showAll ? "Show Less" : `Show All (${sortedItems.length})`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}