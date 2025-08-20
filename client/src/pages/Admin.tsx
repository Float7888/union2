import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CrawlForm } from "@/components/CrawlForm";
import { JobDetailScraper } from "@/components/JobDetailScraper";
import { Trash2, Eye, Settings, Plus } from "lucide-react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { NewsItemForm } from "@/components/NewsItemForm";
import type { Job, InsertJob } from "@shared/schema";

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

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  // Simple password protection (in production, use proper authentication)
  const ADMIN_PASSWORD = "admin123"; // Change this in production

  useEffect(() => {
    // Check if already authenticated
    const auth = localStorage.getItem("admin_auth");
    if (auth === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch jobs from database
  const { data: dbJobs = [], isLoading, refetch } = useQuery<Job[]>({
    queryKey: ['jobs'],
    enabled: isAuthenticated,
  });

  // Delete job mutation
  const deleteJobMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/jobs/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast({
        title: "Success",
        description: "Job deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to delete job",
        variant: "destructive",
      });
    },
  });

  // Create job mutation
  const createJobMutation = useMutation({
    mutationFn: (job: InsertJob) => apiRequest('/api/jobs', {
      method: 'POST',
      body: JSON.stringify(job),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast({
        title: "Success",
        description: "Job created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create job",
        variant: "destructive",
      });
    },
  });

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem("admin_auth", "true");
    } else {
      alert("Invalid password");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("admin_auth");
    setPassword("");
  };

  const handleJobsFound = (jobs: JobData[]) => {
    // Convert JobData[] to InsertJob[] and create jobs in database
    jobs.forEach(job => {
      const insertJob: InsertJob = {
        title: job.title,
        organization: job.organization,
        location: job.location,
        state: job.state,
        type: job.type,
        salary: job.salary,
        postedDate: job.postedDate,
        description: job.description,
        background: job.background,
        responsibilities: job.responsibilities,
        requirements: job.requirements,
        benefits: job.benefits,
        applicationInstructions: job.applicationInstructions,
        tags: job.tags,
        jobUrl: job.jobUrl,
      };
      createJobMutation.mutate(insertJob);
    });
  };

  const deleteJob = (jobId: number) => {
    deleteJobMutation.mutate(jobId);
  };

  const clearAllJobs = async () => {
    if (confirm("Are you sure you want to clear all jobs from the database?")) {
      // Delete all jobs one by one
      for (const job of dbJobs) {
        await deleteJobMutation.mutateAsync(job.id);
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Admin Login</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                placeholder="Enter admin password"
              />
            </div>
            <Button onClick={handleLogin} className="w-full">
              Login
            </Button>
            <div className="text-center">
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
                ← Back to Jobs
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage job scraping and listings</p>
          </div>
          <div className="flex gap-2">
            <Link href="/">
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                View Public Site
              </Button>
            </Link>
            <Button onClick={handleLogout} variant="outline">
              Logout
            </Button>
          </div>
        </div>

        {/* Job Scraper */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Bulk Job Scraper
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CrawlForm onJobsFound={handleJobsFound} />
          </CardContent>
        </Card>

        {/* Individual Job Scraper */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Enhanced Job Scraper
            </CardTitle>
          </CardHeader>
          <CardContent>
            <JobDetailScraper onJobSaved={() => refetch()} />
          </CardContent>
        </Card>

        {/* News Feed Management */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <NewsItemForm />
        </div>

        {/* Scraped Jobs Management */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Database Jobs ({dbJobs.length})
              </CardTitle>
              {dbJobs.length > 0 && (
                <Button onClick={clearAllJobs} variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center text-muted-foreground py-8">
                Loading jobs...
              </p>
            ) : dbJobs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No jobs in database yet. Use the scraper above to add jobs.
              </p>
            ) : (
              <div className="space-y-4">
                {dbJobs.map((job) => (
                  <div
                    key={job.id}
                    className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{job.title}</h3>
                        <p className="text-primary font-medium mb-2">{job.organization}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-2">
                          <span>{job.location}</span>
                          <span>{job.type}</span>
                          {job.salary && <span>{job.salary}</span>}
                          <span>{job.postedDate}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {job.description}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {job.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/job/${job.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </Link>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteJob(job.id)}
                          disabled={deleteJobMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;