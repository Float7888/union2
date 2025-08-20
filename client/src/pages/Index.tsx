import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { JobCard } from "@/components/JobCard";
import { SearchFilters } from "@/components/SearchFilters";
import { MissionStatement } from "@/components/MissionStatement";
import { EmailAlertDialog } from "@/components/EmailAlertDialog";
import { NewsFeed } from "@/components/NewsFeed";
import { Users, MapPin, Briefcase, ArrowRight, Loader2 } from "lucide-react";
import laborBg from "@/assets/labor-movement-bg.svg";
import { useQuery } from "@tanstack/react-query";
import type { Job } from "@shared/schema";
import { Link } from "wouter";


// Sample job data removed - now using only database jobs

const Index = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState("all");
  const [emailAlertData, setEmailAlertData] = useState<{states: string[], jobTypes: string[], keywords: string} | null>(null);

  // Fetch jobs from database
  const { data: dbJobs = [], isLoading, error } = useQuery<Job[]>({
    queryKey: ['jobs'],
    queryFn: () => fetch('/api/jobs').then(res => res.json()),
  });

  // Convert database jobs to match the expected format
  const allJobs = dbJobs.map(job => ({
    id: job.id.toString(),
    title: job.title,
    organization: job.organization,
    location: job.location,
    type: job.type,
    salary: job.salary || undefined,
    postedDate: job.postedDate,
    description: job.description,
    tags: job.tags,
    jobUrl: job.jobUrl || undefined,
  }));
  
  const filteredJobs = allJobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesState = selectedStates.length === 0 || 
                        selectedStates.some(state => 
                          job.location.toLowerCase().includes(state.toLowerCase())
                        );
    
    const matchesType = typeFilter === "all" || job.type === typeFilter;
    
    return matchesSearch && matchesState && matchesType;
  });

  const handleEmailAlert = (filters: {states: string[], jobTypes: string[], keywords: string}) => {
    setEmailAlertData(filters);
  };



  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-[320px] bg-gradient-to-r from-blue-800 to-blue-900 text-white flex items-center">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: `url(${laborBg})` }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl text-center mx-auto">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Let's Work Together to Build a Powerful Labor Movement
            </h1>
            <div className="mt-6">
              <Link href="/post-job">
                <Button size="lg" className="bg-white text-blue-900 hover:bg-gray-100 font-semibold px-8 py-3">
                  Post a Job
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>



      {/* Job Search Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <MissionStatement />
          
          {/* Find Jobs Header */}
          <div className="mt-8 mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Find Jobs</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Search and Filters */}
            <div className="lg:col-span-3">
              <SearchFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                selectedStates={selectedStates}
                onStatesChange={setSelectedStates}
                typeFilter={typeFilter}
                onTypeChange={setTypeFilter}
                onEmailAlert={handleEmailAlert}
              />

              {emailAlertData && (
                <EmailAlertDialog 
                  filters={emailAlertData}
                  trigger={null}
                />
              )}

              <div className="mt-6">
                <div className="flex items-center justify-between mb-6">
                  <p className="text-muted-foreground">
                    Showing {filteredJobs.length} of {allJobs.length} positions
                    {dbJobs.length > 0 && (
                      <span className="text-accent"> • {dbJobs.length} from database</span>
                    )}
                  </p>
                </div>

                <div className="space-y-6">
                  {filteredJobs.map((job) => (
                    <JobCard key={job.id} {...job} />
                  ))}
                  
                  {filteredJobs.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground text-lg">
                        No positions found matching your criteria. Try adjusting your filters.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* News Feed Sidebar */}
            <div className="lg:col-span-1">
              <NewsFeed />
            </div>
          </div>
        </div>
      </section>





      {/* CTA Section */}
      <section className="py-16 bg-gradient-hero text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Build the Movement?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join labor unions, advocacy groups, and organizing campaigns making real change in their communities
          </p>
        </div>
      </section>
    </div>
  );
};

export default Index;
