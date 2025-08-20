import { useLocation, useParams } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, MapPin, Clock, DollarSign, Building, Loader2 } from "lucide-react";
import { JobDetailParser } from "@/utils/JobDetailParser";
import { useToast } from "@/hooks/use-toast";

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
  jobUrl?: string;
}

interface JobDetailData {
  title: string;
  organization: string;
  location: string;
  type: string;
  salary?: string;
  postedDate: string;
  description: string;
  background?: string;
  requirements?: string;
  responsibilities?: string;
  benefits?: string;
  applicationInstructions?: string;
  tags: string[];
}

const JobDetail = () => {
  const [, navigate] = useLocation();
  const { id } = useParams();
  const { toast } = useToast();
  
  // Get job data from localStorage since wouter doesn't handle state the same way
  const job = (() => {
    try {
      const savedJob = localStorage.getItem(`job_${id}`);
      return savedJob ? JSON.parse(savedJob) : null;
    } catch (error) {
      console.error('Error loading job from localStorage:', error);
      return null;
    }
  })() as JobData;
  
  // State for detailed job data
  const [detailedJob, setDetailedJob] = useState<JobDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Effect to fetch detailed job data on mount
  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!job?.jobUrl) {
        // If no job URL, use the basic job data
        setDetailedJob({
          title: job?.title || '',
          organization: job?.organization || '',
          location: job?.location || '',
          type: job?.type || '',
          salary: job?.salary,
          postedDate: job?.postedDate || '',
          description: job?.description || '',
          tags: job?.tags || []
        });
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/scrape-job', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: job.jobUrl }),
        });

        const result = await response.json();
        
        if (result.success && result.markdown) {
          const scrapedContent = result.markdown || result.html || '';
          const parsedJobDetail = JobDetailParser.parseJobDetail(scrapedContent, job);
          setDetailedJob(parsedJobDetail);
        } else {
          setError(result.error || 'Failed to fetch job details');
          // Fallback to basic job data
          setDetailedJob({
            title: job.title,
            organization: job.organization,
            location: job.location,
            type: job.type,
            salary: job.salary,
            postedDate: job.postedDate,
            description: job.description,
            tags: job.tags
          });
        }
      } catch (err) {
        setError('Failed to fetch job details');
        // Fallback to basic job data
        setDetailedJob({
          title: job.title,
          organization: job.organization,
          location: job.location,
          type: job.type,
          salary: job.salary,
          postedDate: job.postedDate,
          description: job.description,
          tags: job.tags
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (job && job.id) {
      fetchJobDetails();
    }
  }, [job?.id]); // Only depend on job.id to prevent infinite re-renders

  if (!job) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <h2 className="text-lg font-semibold mb-2">Job Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The job listing you're looking for could not be found.
            </p>
            <Button onClick={() => navigate('/')}>
              Back to Jobs
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="mb-6 hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Jobs
        </Button>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
                <div className="flex gap-4 mt-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="mb-6">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-2 text-yellow-600 mb-2">
                <Loader2 className="h-5 w-5" />
                <span className="font-medium">Loading detailed job information...</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {error}. Showing basic job information below.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Job Content */}
        {detailedJob && (
          <>
            {/* Job Header */}
            <Card className="mb-6">
              <CardHeader className="pb-6">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                      {detailedJob.title}
                    </h1>
                    <div className="flex items-center gap-2 text-xl text-primary mb-4">
                      <Building className="h-5 w-5" />
                      {detailedJob.organization}
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                    {detailedJob.type}
                  </Badge>
                </div>
                
                <div className="flex flex-wrap gap-6 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{detailedJob.location}</span>
                  </div>
                  {detailedJob.salary && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      <span>{detailedJob.salary}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Posted {detailedJob.postedDate}</span>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Background */}
            {detailedJob.background && (
              <Card className="mb-6">
                <CardHeader>
                  <h2 className="text-xl font-semibold">Background</h2>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-neutral dark:prose-invert max-w-none">
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                      {detailedJob.background}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Job Description */}
            <Card className="mb-6">
              <CardHeader>
                <h2 className="text-xl font-semibold">Description</h2>
              </CardHeader>
              <CardContent>
                <div className="prose prose-neutral dark:prose-invert max-w-none">
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                    {detailedJob.description}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Responsibilities */}
            {detailedJob.responsibilities && (
              <Card className="mb-6">
                <CardHeader>
                  <h2 className="text-xl font-semibold">Responsibilities</h2>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-neutral dark:prose-invert max-w-none">
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                      {detailedJob.responsibilities}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Requirements */}
            {detailedJob.requirements && (
              <Card className="mb-6">
                <CardHeader>
                  <h2 className="text-xl font-semibold">Requirements</h2>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-neutral dark:prose-invert max-w-none">
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                      {detailedJob.requirements}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pay and Benefits */}
            {detailedJob.benefits && (
              <Card className="mb-6">
                <CardHeader>
                  <h2 className="text-xl font-semibold">Pay and Benefits</h2>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-neutral dark:prose-invert max-w-none">
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                      {detailedJob.benefits}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Skills & Tags */}
            {detailedJob.tags.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <h2 className="text-xl font-semibold">Skills & Tags</h2>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {detailedJob.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-sm">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Application Instructions */}
            {detailedJob.applicationInstructions && (
              <Card className="mb-6">
                <CardHeader>
                  <h2 className="text-xl font-semibold">How to Apply</h2>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-neutral dark:prose-invert max-w-none">
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                      {detailedJob.applicationInstructions}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Apply Section */}
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">
                    Interested in this position?
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Contact {detailedJob.organization} directly to apply for this role.
                  </p>
                  <div className="flex gap-3 justify-center">
                    {job.jobUrl ? (
                      <Button size="lg" asChild>
                        <a href={job.jobUrl} target="_blank" rel="noopener noreferrer">
                          Apply Now
                        </a>
                      </Button>
                    ) : (
                      <Button size="lg">
                        Apply Now
                      </Button>
                    )}
                    <Button variant="outline" size="lg">
                      Save Job
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default JobDetail;