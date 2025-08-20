import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FirecrawlService } from "@/utils/FirecrawlService";
import { JobDetailParser } from "@/utils/JobDetailParser";
import { Loader2, ExternalLink, Save } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { InsertJob } from "@shared/schema";

interface JobDetailScraperProps {
  onJobSaved?: () => void;
}

export const JobDetailScraper = ({ onJobSaved }: JobDetailScraperProps) => {
  const [jobUrl, setJobUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [scrapedJob, setScrapedJob] = useState<any>(null);
  const [editableJob, setEditableJob] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Save job mutation
  const saveJobMutation = useMutation({
    mutationFn: (job: InsertJob) => apiRequest('/api/jobs', {
      method: 'POST',
      body: JSON.stringify(job),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast({
        title: "Success",
        description: "Job saved successfully",
      });
      if (onJobSaved) onJobSaved();
      setScrapedJob(null);
      setEditableJob(null);
      setJobUrl("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save job",
        variant: "destructive",
      });
    },
  });

  const handleScrapeJob = async () => {
    if (!jobUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a job URL",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/scrape-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: jobUrl }),
      });

      const result = await response.json();
      console.log('Full API response:', result);
      console.log('Response OK:', response.ok);
      console.log('Result success:', result.success);
      console.log('Result data:', result.data);
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (result.success) {
        // The Firecrawl response has markdown content directly in the result
        const scrapedContent = result.markdown || result.html || result.content || '';
        console.log('Raw scraped content (first 1000 chars):', scrapedContent ? scrapedContent.substring(0, 1000) : 'No content');
        console.log('Content length:', scrapedContent ? scrapedContent.length : 0);
        
        const basicJob = {
          title: "Job Title", 
          organization: "Organization", 
          location: "Location TBD", 
          type: "Other",
          postedDate: new Date().toLocaleDateString(),
          description: "",
          tags: []
        };
        
        const detailedJob = JobDetailParser.parseJobDetail(scrapedContent, basicJob);
        
        // Enhanced extraction from scraped content with multiple patterns
        
        // Extract title - try multiple patterns
        const titleMatch = scrapedContent.match(/\*\*([^*\n]+(?:Representative|Organizer|Specialist|Director|Manager|Coordinator|Analyst)[^*\n]*)\*\*/i) ||
                          scrapedContent.match(/has an opening for a \*\*([^*]+)\*\*/i) ||
                          scrapedContent.match(/Job Title:\s*([^\n\r]+)/i) ||
                          scrapedContent.match(/^([^\n–-]+(?:Representative|Organizer|Specialist|Director|Manager)[^\n–-]*)/m);
        if (titleMatch) {
          detailedJob.title = titleMatch[1].trim();
        }

        // Extract organization - try multiple patterns  
        if (scrapedContent.includes('American Federation of Musicians') || scrapedContent.includes('Local 802')) {
          detailedJob.organization = "American Federation of Musicians, Local 802";
        } else if (scrapedContent.includes('Service Employees International Union') || scrapedContent.includes('SEIU')) {
          detailedJob.organization = "Service Employees International Union (SEIU)";
        } else if (scrapedContent.includes('AFL-CIO')) {
          detailedJob.organization = "AFL-CIO";
        } else if (scrapedContent.includes("Actors' Equity")) {
          detailedJob.organization = "Actors' Equity Association";
        }

        // Extract location - try multiple patterns
        const locationMatch = scrapedContent.match(/\*\*Location:\*\*\s*([^\n\r*]+)/i) ||
                             scrapedContent.match(/Location:\s*([^\n\r]+)/i) ||
                             scrapedContent.match(/(New York|Washington,?\s*DC|Chicago|Los Angeles|Boston|Philadelphia)/i);
        if (locationMatch) {
          detailedJob.location = locationMatch[1] ? locationMatch[1].trim() : locationMatch[0].trim();
        }

        // Extract salary - try multiple patterns
        const salaryMatch = scrapedContent.match(/Starting salary is \$?([\d,]+\.?\d*)/i) ||
                           scrapedContent.match(/\*\*Annual Salary:\*\*\s*\$?([\d,]+)/i) ||
                           scrapedContent.match(/Annual Salary:\s*\$?([\d,]+)/i) ||
                           scrapedContent.match(/Salary:\s*\$?([\d,]+\.?\d*)/i);
        if (salaryMatch) {
          detailedJob.salary = `$${salaryMatch[1]}`;
        }

        // Extract job type based on content
        if (scrapedContent.includes('Organizer') || scrapedContent.includes('organizing')) {
          detailedJob.type = "Organizing";
        } else if (scrapedContent.includes('Representative') || scrapedContent.includes('Business Rep')) {
          detailedJob.type = "Bargaining/Contract Support";  
        } else if (scrapedContent.includes('Communications') || scrapedContent.includes('Digital')) {
          detailedJob.type = "Communications/Digital";
        }

        console.log('Parsed job details:', detailedJob);
        setScrapedJob(detailedJob);
        setEditableJob({ ...detailedJob });
        
        toast({
          title: "Success",
          description: "Job details scraped successfully",
        });
      } else {
        console.log('Scraping failed - result:', result);
        toast({
          title: "Error",
          description: result.error || "No job data returned from scraper",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error scraping job:', error);
      toast({
        title: "Error",
        description: `Failed to scrape job details: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveJob = () => {
    if (!editableJob) return;

    const jobData: InsertJob = {
      title: editableJob.title,
      organization: editableJob.organization,
      location: editableJob.location,
      state: editableJob.location ? extractStateFromLocation(editableJob.location) : null,
      type: categorizeJob(editableJob.title),
      salary: editableJob.salary || null,
      postedDate: editableJob.postedDate,
      description: editableJob.description,
      background: editableJob.background || null,
      responsibilities: editableJob.responsibilities || null,
      requirements: editableJob.requirements || null,
      benefits: editableJob.benefits || null,
      applicationInstructions: editableJob.applicationInstructions || null,
      tags: editableJob.tags || [],
      jobUrl: jobUrl,
    };

    saveJobMutation.mutate(jobData);
  };

  // Helper functions
  const extractStateFromLocation = (location: string): string | null => {
    const stateMap: { [key: string]: string } = {
      'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
      'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
      'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
      'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
      'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
      'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire',
      'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina',
      'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania',
      'RI': 'Rhode Island', 'SC': 'South Carolina', 'SD': 'South Dakota', 'TN': 'Tennessee',
      'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington',
      'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming', 'DC': 'Washington DC',
      'PR': 'Puerto Rico'
    };

    const abbrevMatch = location.match(/,\s*([A-Z]{2})\b/);
    if (abbrevMatch && stateMap[abbrevMatch[1]]) {
      return stateMap[abbrevMatch[1]];
    }

    for (const [abbrev, fullName] of Object.entries(stateMap)) {
      if (location.toLowerCase().includes(fullName.toLowerCase())) {
        return fullName;
      }
    }

    return null;
  };

  const categorizeJob = (title: string): string => {
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('organizer') || titleLower.includes('organizing')) {
      return 'Organizing';
    }
    if (titleLower.includes('bargaining') || titleLower.includes('contract') || 
        titleLower.includes('negotiator') || titleLower.includes('representative')) {
      return 'Bargaining/Contract Support';
    }
    if (titleLower.includes('research') || titleLower.includes('strategic') || 
        titleLower.includes('analyst') || titleLower.includes('data')) {
      return 'Research/Strategic Campaigns';
    }
    if (titleLower.includes('political') || titleLower.includes('policy') || 
        titleLower.includes('government') || titleLower.includes('legislative')) {
      return 'Political/Policy';
    }
    if (titleLower.includes('communication') || titleLower.includes('digital') || 
        titleLower.includes('media') || titleLower.includes('marketing')) {
      return 'Communications/Digital';
    }
    if (titleLower.includes('legal') || titleLower.includes('attorney') || 
        titleLower.includes('counsel') || titleLower.includes('paralegal')) {
      return 'Legal';
    }
    if (titleLower.includes('admin') || titleLower.includes('coordinator') || 
        titleLower.includes('assistant') || titleLower.includes('manager') || 
        titleLower.includes('finance') || titleLower.includes('hr')) {
      return 'Administrative';
    }
    
    return 'Other';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ExternalLink className="h-5 w-5" />
          Individual Job Scraper
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="jobUrl">Job Posting URL</Label>
          <Input
            id="jobUrl"
            type="url"
            value={jobUrl}
            onChange={(e) => setJobUrl(e.target.value)}
            placeholder="https://recruiting.ultipro.com/SER1005SEIU/JobBoard/..."
          />
        </div>
        
        <Button 
          onClick={handleScrapeJob} 
          disabled={isLoading || !jobUrl.trim()}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Scraping...
            </>
          ) : (
            "Scrape Job Details"
          )}
        </Button>

        {editableJob && (
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold">Scraped Job Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={editableJob.title}
                  onChange={(e) => setEditableJob({...editableJob, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="organization">Organization</Label>
                <Input
                  id="organization"
                  value={editableJob.organization}
                  onChange={(e) => setEditableJob({...editableJob, organization: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={editableJob.location}
                  onChange={(e) => setEditableJob({...editableJob, location: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary">Salary</Label>
                <Input
                  id="salary"
                  value={editableJob.salary || ""}
                  onChange={(e) => setEditableJob({...editableJob, salary: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editableJob.description}
                onChange={(e) => setEditableJob({...editableJob, description: e.target.value})}
                rows={3}
              />
            </div>

            {editableJob.background && (
              <div className="space-y-2">
                <Label htmlFor="background">Background</Label>
                <Textarea
                  id="background"
                  value={editableJob.background}
                  onChange={(e) => setEditableJob({...editableJob, background: e.target.value})}
                  rows={3}
                />
              </div>
            )}

            {editableJob.responsibilities && (
              <div className="space-y-2">
                <Label htmlFor="responsibilities">Responsibilities</Label>
                <Textarea
                  id="responsibilities"
                  value={editableJob.responsibilities}
                  onChange={(e) => setEditableJob({...editableJob, responsibilities: e.target.value})}
                  rows={3}
                />
              </div>
            )}

            {editableJob.requirements && (
              <div className="space-y-2">
                <Label htmlFor="requirements">Requirements</Label>
                <Textarea
                  id="requirements"
                  value={editableJob.requirements}
                  onChange={(e) => setEditableJob({...editableJob, requirements: e.target.value})}
                  rows={3}
                />
              </div>
            )}

            {editableJob.benefits && (
              <div className="space-y-2">
                <Label htmlFor="benefits">Pay and Benefits</Label>
                <Textarea
                  id="benefits"
                  value={editableJob.benefits}
                  onChange={(e) => setEditableJob({...editableJob, benefits: e.target.value})}
                  rows={3}
                />
              </div>
            )}

            {editableJob.applicationInstructions && (
              <div className="space-y-2">
                <Label htmlFor="applicationInstructions">Application Instructions</Label>
                <Textarea
                  id="applicationInstructions"
                  value={editableJob.applicationInstructions}
                  onChange={(e) => setEditableJob({...editableJob, applicationInstructions: e.target.value})}
                  rows={2}
                />
              </div>
            )}

            <Button 
              onClick={handleSaveJob}
              disabled={saveJobMutation.isPending}
              className="w-full"
            >
              {saveJobMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Job to Database
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};