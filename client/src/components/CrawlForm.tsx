import { useState } from 'react';
import { useToast } from "@/hooks/use-toast"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { JobParser } from '@/utils/JobParser';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Globe } from 'lucide-react';

interface CrawlResult {
  success: boolean;
  status?: string;
  completed?: number;
  total?: number;
  creditsUsed?: number;
  expiresAt?: string;
  data?: any[];
}

interface JobData {
  id: string;
  title: string;
  organization: string;
  location: string;
  type: string;
  salary?: string;
  postedDate: string;
  description: string;
  tags: string[];
}

interface CrawlFormProps {
  onJobsFound?: (jobs: JobData[]) => void;
}

export const CrawlForm = ({ onJobsFound }: CrawlFormProps) => {
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [crawlResult, setCrawlResult] = useState<CrawlResult | null>(null);
  const [parsedJobs, setParsedJobs] = useState<JobData[]>([]);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setProgress(0);
    setCrawlResult(null);
    setParsedJobs([]);
    
    try {
      console.log('Starting crawl for URL:', url);
      
      const response = await fetch('/api/crawl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (!result.success) {
        throw new Error(result.error || 'Crawl failed');
      }

      setCrawlResult(result);
      
      if (result.data) {
        const jobs = JobParser.parseJobs(result.data || []);
        setParsedJobs(jobs);
        
        // Notify parent component about found jobs
        if (onJobsFound) {
          onJobsFound(jobs);
        }
        
        toast({
          title: "Success",
          description: `Website crawled successfully. Found ${jobs.length} job postings.`,
        });
      }
    } catch (error) {
      console.error('Error crawling website:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to crawl website",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setProgress(100);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Job Website Scraper
        </CardTitle>
        <CardDescription>
          Scrape organization websites for job postings using Firecrawl API.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">
              Organization Website URL
            </Label>
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://recruiting.ultipro.com/SER1005SEIU/JobBoard/..."
              required
            />
            <p className="text-sm text-muted-foreground">
              Enter the URL of a job board or careers page to extract job listings
            </p>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Globe className="mr-2 h-4 w-4 animate-spin" />
                Crawling Website...
              </>
            ) : (
              <>
                <Globe className="mr-2 h-4 w-4" />
                Start Crawl
              </>
            )}
          </Button>
        </form>

        {isLoading && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground text-center">
              Processing website content...
            </p>
          </div>
        )}

        {crawlResult && (
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Crawl Results</h3>
            <div className="text-sm space-y-1">
              <p>Status: <span className="text-green-600">{crawlResult.status}</span></p>
              <p>Completed: {crawlResult.completed}/{crawlResult.total} pages</p>
              <p>Credits Used: {crawlResult.creditsUsed}</p>
              <p>Jobs Found: <span className="font-medium">{parsedJobs.length}</span></p>
            </div>
          </div>
        )}

        {parsedJobs.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold mb-4">Found Jobs ({parsedJobs.length})</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {parsedJobs.map((job) => (
                <div key={job.id} className="p-4 border rounded-lg">
                  <h4 className="font-medium">{job.title}</h4>
                  <p className="text-sm text-muted-foreground">{job.organization}</p>
                  <p className="text-sm">{job.location} • {job.type}</p>
                  {job.salary && <p className="text-sm text-green-600">{job.salary}</p>}
                  <p className="text-xs text-muted-foreground mt-2">{job.description.slice(0, 150)}...</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};