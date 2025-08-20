interface JobData {
  id: string;
  title: string;
  organization: string;
  location: string;
  state?: string;
  type: string;
  salary?: string;
  postedDate: string;
  description: string;
  background?: string;
  responsibilities?: string;
  requirements?: string;
  benefits?: string;
  applicationInstructions?: string;
  tags: string[];
  jobUrl?: string; // URL for second-stage scraping
}

export class JobParser {
  static parseJobs(scrapedData: any[]): JobData[] {
    const jobs: JobData[] = [];

    scrapedData.forEach((page, index) => {
      const content = page.markdown || page.html || '';
      const url = page.metadata?.sourceURL || '';
      
      // Check for different job board types
      if (url.includes('unionjobs.com')) {
        const unionJobs = this.parseUnionJobs(content);
        jobs.push(...unionJobs);
      } else if (url.includes('ultipro.com') || url.includes('recruiting.') || content.includes('JobBoard')) {
        // UltiPro or similar recruiting platforms
        const ultiproJobs = this.parseUltiproJobs(content, url);
        jobs.push(...ultiproJobs);
      } else {
        // Use generic parser for other sites
        const organization = this.extractOrganization(url, content);
        const jobSections = this.findJobSections(content);
        
        jobSections.forEach((section, sectionIndex) => {
          const job = this.parseJobSection(section, organization, `${index}-${sectionIndex}`);
          if (job) {
            jobs.push(job);
          }
        });
      }
    });

    return jobs;
  }

  private static parseUnionJobs(content: string): JobData[] {
    const jobs: JobData[] = [];
    
    // Split content by organization sections
    const orgSections = content.split(/### \*\*([^*]+)\*\*/);
    
    for (let i = 1; i < orgSections.length; i += 2) {
      const orgName = orgSections[i].replace(/\s*\([^)]+\)\s*$/, '').trim(); // Remove parenthetical info
      const orgContent = orgSections[i + 1] || '';
      
      // Extract job listings from this organization
      const jobLines = orgContent.split('\n').filter(line => 
        line.includes('listing.php?id=') && line.includes('](https://unionjobs.com/listing.php?id=')
      );
      
      jobLines.forEach((line, jobIndex) => {
        const job = this.parseUnionJobLine(line, orgName, `union-${i}-${jobIndex}`);
        if (job) {
          jobs.push(job);
        }
      });
    }
    
    return jobs;
  }

  private static parseUnionJobLine(line: string, organization: string, id: string): JobData | null {
    // Extract job ID and title from markdown link
    const linkMatch = line.match(/\[.*?\]\(https:\/\/unionjobs\.com\/listing\.php\?id=(\d+)\)/);
    if (!linkMatch) return null;
    
    const jobId = linkMatch[1];
    const jobUrl = `https://unionjobs.com/listing.php?id=${jobId}`;
    
    // Extract job title (remove the image markdown and clean up)
    const titleMatch = line.match(/\[(?:!\[.*?\].*?)?([^\]]+)\]/);
    if (!titleMatch) return null;
    
    let title = titleMatch[1].replace(/!\[.*?\].*?\\n/, '').trim();
    
    // Extract location from the part after the link
    const afterLink = line.split('](https://unionjobs.com/listing.php?id=' + jobId + ')')[1] || '';
    
    // Extract location (text between "based in" and "(Posted:")
    const locationMatch = afterLink.match(/based in ([^(]+)\(/);
    const location = locationMatch ? locationMatch[1].replace(/\[.*?\]/, '').trim() : 'Location not specified';
    
    // Extract posted date
    const dateMatch = afterLink.match(/\(Posted: ([^)]+)\)/);
    const postedDate = dateMatch ? dateMatch[1] : 'Date not specified';
    
    // Extract states (text after the posted date)
    const statesMatch = afterLink.match(/\)\s*(.+)$/);
    const states = statesMatch ? statesMatch[1].trim() : '';
    
    // Combine location with states if available
    const fullLocation = states && states !== location ? `${location} (${states})` : location;
    
    // Generate tags based on job title and organization
    const tags = this.generateUnionJobTags(title, organization);
    
    return {
      id: `union-${jobId}`,
      title,
      organization,
      location: fullLocation,
      state: this.extractStateFromLocation(fullLocation),
      type: this.categorizeJob(title),
      salary: undefined,
      postedDate,
      description: `${title} position at ${organization}. Location: ${fullLocation}`,
      tags,
      jobUrl
    };
  }

  private static parseUltiproJobs(content: string, url: string): JobData[] {
    const jobs: JobData[] = [];
    
    // Extract organization name from URL or content
    const organization = this.extractUltiproOrganization(url, content);
    
    // Look for job table rows or job listings in the content
    const jobMatches = this.findUltiproJobListings(content);
    
    jobMatches.forEach((jobMatch, index) => {
      const job = this.parseUltiproJobListing(jobMatch, organization, `ultipro-${index}`);
      if (job) {
        jobs.push(job);
      }
    });
    
    return jobs;
  }

  private static extractUltiproOrganization(url: string, content: string): string {
    // Try to extract from URL pattern like SER1005SEIU
    const urlMatch = url.match(/\/([A-Z0-9]+)\/JobBoard/);
    if (urlMatch) {
      const code = urlMatch[1];
      // Common organization codes
      if (code.includes('SEIU')) return 'SEIU';
      if (code.includes('AFL')) return 'AFL-CIO';
      if (code.includes('AFSCME')) return 'AFSCME';
      if (code.includes('UNITE')) return 'UNITE HERE';
      if (code.includes('CWA')) return 'CWA';
      if (code.includes('UFCW')) return 'UFCW';
      return code;
    }
    
    // Try to extract from content
    const titleMatch = content.match(/# (.+?) Opportunities/);
    if (titleMatch) {
      return titleMatch[1];
    }
    
    return 'Organization';
  }

  private static findUltiproJobListings(content: string): string[] {
    const jobListings = [];
    const seenJobs = new Set(); // Track duplicates
    
    // Look for job links/rows in the markdown content
    const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    
    while ((match = linkPattern.exec(content)) !== null) {
      const linkText = match[1];
      const linkUrl = match[2];
      
      // Skip navigation links and non-job links
      if (linkText.includes('Search') || linkText.includes('Tips') || 
          linkText.includes('Skip') || linkText.includes('What') ||
          linkUrl.includes('javascript:') || linkUrl.includes('#')) {
        continue;
      }
      
      // Skip browser icons and other unwanted content
      if (this.isValidJobTitle(linkText) && !seenJobs.has(linkText)) {
        jobListings.push(linkText);
        seenJobs.add(linkText);
      }
    }
    
    // If no job links found, look for job titles in headers
    if (jobListings.length === 0) {
      const headerPattern = /#{1,6}\s*([^\n]+)/g;
      while ((match = headerPattern.exec(content)) !== null) {
        const headerText = match[1].trim();
        if (this.isValidJobTitle(headerText) && !headerText.includes('Current') && 
            !headerText.includes('Opportunities') && !headerText.includes('Tips') &&
            !seenJobs.has(headerText)) {
          jobListings.push(headerText);
          seenJobs.add(headerText);
        }
      }
    }
    
    return jobListings;
  }

  private static isValidJobTitle(text: string): boolean {
    if (!text || text.trim().length === 0) return false;
    
    // Exclude browser icons and logos
    if (text.includes('![') || text.includes('Firefox') || text.includes('Chrome') || 
        text.includes('Internet Explorer') || text.includes('logo')) {
      return false;
    }
    
    // Exclude email addresses
    if (text.includes('@') && text.includes('.')) {
      return false;
    }
    
    // Exclude job descriptions and requirements (these are sentences, not titles)
    const descriptionPatterns = [
      'Knowledge of', 'Must provide', 'Ability to', 'Experience in', 'A minimum of',
      'Leads work with', 'Act as spokesperson', 'This position reports to',
      'years of experience', 'cell phone with', 'data plan', 'internet access',
      'home internet connection', 'work independently', 'leadership skills',
      'personal authority', 'collegial work style', 'inspire confidence',
      'campaign planning', 'messaging, and actions', 'legislative and policy',
      'union leadership', 'organizing or campaign', 'local unions to develop'
    ];
    
    if (descriptionPatterns.some(pattern => text.includes(pattern))) {
      return false;
    }
    
    // Exclude employer information and job metadata
    if (text.includes('**Employer:') || text.includes('**Job Title:') || 
        text.includes('**Direction and Decision Making:') || text.includes('**Service Employees')) {
      return false;
    }
    
    // Exclude common non-job phrases
    const excludePatterns = [
      'Know Your Rights', 'Tips & Tricks', 'Search modifier', 'Skip to main content',
      'What', 'Either terms', 'Exact phrase', 'Include terms', 'Exclude terms',
      'Either OR', 'Combining terms', 'Featured Opportunities'
    ];
    
    if (excludePatterns.some(pattern => text.includes(pattern))) {
      return false;
    }
    
    // Must be a reasonable length for a job title (most job titles are 15-80 chars)
    if (text.length < 10 || text.length > 80) {
      return false;
    }
    
    // Exclude sentences (job titles shouldn't have multiple sentences or end with periods)
    if (text.includes('.') && !text.endsWith('.') || text.split('.').length > 2) {
      return false;
    }
    
    // Check if it looks like a job title
    return this.isJobTitle(text);
  }

  private static parseUltiproJobListing(jobText: string, organization: string, id: string): JobData | null {
    if (!jobText || jobText.trim().length === 0) return null;
    
    // Clean up the job text
    const title = jobText.replace(/\s+/g, ' ').trim();
    
    // Generate basic job data
    const tags = this.generateJobTags(title, organization);
    const jobType = this.categorizeJob(title);
    
    return {
      id,
      title,
      organization,
      location: 'Various locations', // UltiPro often has multiple locations
      state: null, // UltiPro listings typically don't specify exact locations
      type: jobType,
      salary: undefined,
      postedDate: 'Recently posted',
      description: `${title} position at ${organization}. Apply through the organization's career portal for full details.`,
      tags,
      jobUrl: undefined
    };
  }

  // Extract detailed sections from job content
  private static extractDetailedSections(content: string): {
    description?: string;
    background?: string;
    responsibilities?: string;
    requirements?: string;
    benefits?: string;
    applicationInstructions?: string;
  } {
    const sections: any = {};
    const lines = content.split(/[.\n]/).map(line => line.trim());
    
    const keywords = {
      background: ['background', 'about', 'about the role', 'about this position'],
      responsibilities: ['responsibilities', 'duties', 'key responsibilities', 'what you\'ll do'],
      requirements: ['requirements', 'qualifications', 'required qualifications', 'skills'],
      benefits: ['benefits', 'compensation', 'pay', 'what we offer', 'pay and benefits'],
      applicationInstructions: ['how to apply', 'apply', 'application process', 'to apply']
    };
    
    for (const [sectionName, sectionKeywords] of Object.entries(keywords)) {
      for (const keyword of sectionKeywords) {
        const headerIndex = lines.findIndex(line => {
          const lowerLine = line.toLowerCase();
          return lowerLine.includes(keyword) && (lowerLine.endsWith(':') || lowerLine.length < 100);
        });
        
        if (headerIndex !== -1) {
          const sectionLines = [];
          for (let i = headerIndex + 1; i < lines.length && sectionLines.length < 8; i++) {
            const line = lines[i].trim();
            if (line.length > 10) {
              sectionLines.push(line);
            }
          }
          if (sectionLines.length > 0) {
            sections[sectionName] = sectionLines.join(' ').trim();
            break;
          }
        }
      }
    }
    
    return sections;
  }

  private static categorizeJob(title: string): string {
    const titleLower = title.toLowerCase();
    
    // Organizing roles
    if (titleLower.includes('organizer') || titleLower.includes('organizing')) {
      return 'Organizing';
    }
    
    // Bargaining/Contract roles
    if (titleLower.includes('bargaining') || titleLower.includes('contract') || 
        titleLower.includes('negotiator') || titleLower.includes('representative')) {
      return 'Bargaining/Contract Support';
    }
    
    // Research/Strategic roles
    if (titleLower.includes('research') || titleLower.includes('strategic') || 
        titleLower.includes('analyst') || titleLower.includes('data')) {
      return 'Research/Strategic Campaigns';
    }
    
    // Political/Policy roles
    if (titleLower.includes('political') || titleLower.includes('policy') || 
        titleLower.includes('government') || titleLower.includes('legislative')) {
      return 'Political/Policy';
    }
    
    // Communications/Digital roles
    if (titleLower.includes('communication') || titleLower.includes('digital') || 
        titleLower.includes('media') || titleLower.includes('marketing')) {
      return 'Communications/Digital';
    }
    
    // Legal roles
    if (titleLower.includes('legal') || titleLower.includes('attorney') || 
        titleLower.includes('counsel') || titleLower.includes('paralegal')) {
      return 'Legal';
    }
    
    // Administrative roles
    if (titleLower.includes('admin') || titleLower.includes('coordinator') || 
        titleLower.includes('assistant') || titleLower.includes('manager') || 
        titleLower.includes('finance') || titleLower.includes('hr')) {
      return 'Administrative';
    }
    
    return 'Other';
  }

  private static extractStateFromLocation(location: string): string | null {
    if (!location) return null;
    
    // Common state abbreviations and full names
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

    // Check for state abbreviations (e.g., "Brooklyn, NY")
    const abbrevMatch = location.match(/,\s*([A-Z]{2})\b/);
    if (abbrevMatch && stateMap[abbrevMatch[1]]) {
      return stateMap[abbrevMatch[1]];
    }

    // Check for full state names
    for (const [abbrev, fullName] of Object.entries(stateMap)) {
      if (location.toLowerCase().includes(fullName.toLowerCase())) {
        return fullName;
      }
    }

    // Special cases
    if (location.toLowerCase().includes('washington') && location.toLowerCase().includes('dc')) {
      return 'Washington DC';
    }

    return null;
  }

  private static generateUnionJobTags(title: string, organization: string): string[] {
    const tags = [];
    
    // Add organization-based tags
    if (organization.toLowerCase().includes('afl-cio')) tags.push('AFL-CIO');
    if (organization.toLowerCase().includes('union')) tags.push('Union');
    
    // Add role-based tags
    const titleLower = title.toLowerCase();
    if (titleLower.includes('director')) tags.push('Director');
    if (titleLower.includes('manager')) tags.push('Manager');
    if (titleLower.includes('coordinator')) tags.push('Coordinator');
    if (titleLower.includes('organizer')) tags.push('Organizer');
    if (titleLower.includes('representative')) tags.push('Representative');
    if (titleLower.includes('analyst')) tags.push('Analyst');
    if (titleLower.includes('specialist')) tags.push('Specialist');
    if (titleLower.includes('assistant')) tags.push('Assistant');
    
    // Add field-based tags
    if (titleLower.includes('communications')) tags.push('Communications');
    if (titleLower.includes('data') || titleLower.includes('technology')) tags.push('Technology');
    if (titleLower.includes('field')) tags.push('Field Work');
    if (titleLower.includes('political')) tags.push('Political');
    if (titleLower.includes('legal')) tags.push('Legal');
    if (titleLower.includes('research')) tags.push('Research');
    if (titleLower.includes('campaign')) tags.push('Campaign');
    if (titleLower.includes('organizing')) tags.push('Organizing');
    
    return tags.slice(0, 5); // Limit to 5 tags
  }

  private static generateJobTags(title: string, organization: string): string[] {
    const tags = [];
    
    // Add organization-based tags
    if (organization.toLowerCase().includes('seiu')) tags.push('SEIU');
    if (organization.toLowerCase().includes('afl')) tags.push('AFL-CIO');
    if (organization.toLowerCase().includes('afscme')) tags.push('AFSCME');
    if (organization.toLowerCase().includes('unite')) tags.push('UNITE HERE');
    if (organization.toLowerCase().includes('cwa')) tags.push('CWA');
    if (organization.toLowerCase().includes('ufcw')) tags.push('UFCW');
    if (organization.toLowerCase().includes('union')) tags.push('Union');
    
    // Add role-based tags
    const titleLower = title.toLowerCase();
    if (titleLower.includes('director')) tags.push('Director');
    if (titleLower.includes('manager')) tags.push('Manager');
    if (titleLower.includes('coordinator')) tags.push('Coordinator');
    if (titleLower.includes('organizer')) tags.push('Organizer');
    if (titleLower.includes('representative')) tags.push('Representative');
    if (titleLower.includes('analyst')) tags.push('Analyst');
    if (titleLower.includes('specialist')) tags.push('Specialist');
    if (titleLower.includes('assistant')) tags.push('Assistant');
    if (titleLower.includes('attorney')) tags.push('Legal');
    if (titleLower.includes('counsel')) tags.push('Legal');
    if (titleLower.includes('nurse')) tags.push('Healthcare');
    if (titleLower.includes('social worker')) tags.push('Social Work');
    
    // Add field-based tags
    if (titleLower.includes('communications')) tags.push('Communications');
    if (titleLower.includes('data') || titleLower.includes('technology')) tags.push('Technology');
    if (titleLower.includes('field')) tags.push('Field Work');
    if (titleLower.includes('political')) tags.push('Political');
    if (titleLower.includes('legal')) tags.push('Legal');
    if (titleLower.includes('research')) tags.push('Research');
    if (titleLower.includes('campaign')) tags.push('Campaign');
    if (titleLower.includes('organizing')) tags.push('Organizing');
    if (titleLower.includes('healthcare')) tags.push('Healthcare');
    if (titleLower.includes('education')) tags.push('Education');
    
    return tags.slice(0, 5); // Limit to 5 tags
  }

  private static extractOrganization(url: string, content: string): string {
    // Try to extract organization from URL
    if (url) {
      const domain = url.match(/https?:\/\/(?:www\.)?([^\/]+)/);
      if (domain) {
        return domain[1].replace(/\.(com|org|net|edu|gov)$/, '').replace(/[-_]/g, ' ');
      }
    }

    // Try to extract from content - look for company/organization headers
    const orgPatterns = [
      /company[:\s]+([^\n]+)/i,
      /organization[:\s]+([^\n]+)/i,
      /employer[:\s]+([^\n]+)/i,
      /<title>([^<]+)/i,
      /# ([^#\n]+)/
    ];

    for (const pattern of orgPatterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        return match[1].trim().replace(/\s+/g, ' ');
      }
    }

    return 'Unknown Organization';
  }

  private static findJobSections(content: string): string[] {
    // Split content into potential job sections
    const sections = [];
    
    // Look for job titles followed by content
    const jobTitlePatterns = [
      /#{1,3}\s*([^#\n]*(?:coordinator|organizer|manager|director|specialist|associate|assistant|analyst|intern|volunteer)[^#\n]*)/gi,
      /^([^#\n]*(?:coordinator|organizer|manager|director|specialist|associate|assistant|analyst|intern|volunteer)[^#\n]*)/gm,
      /\*\*([^*]*(?:coordinator|organizer|manager|director|specialist|associate|assistant|analyst|intern|volunteer)[^*]*)\*\*/gi
    ];

    for (const pattern of jobTitlePatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        // Extract content around the job title
        const startIndex = Math.max(0, match.index - 100);
        const endIndex = Math.min(content.length, match.index + 1000);
        const section = content.substring(startIndex, endIndex);
        sections.push(section);
      }
    }

    // If no specific job sections found, try to split by headers
    if (sections.length === 0) {
      const headerSections = content.split(/#{1,3}\s/);
      sections.push(...headerSections.filter(section => section.length > 100));
    }

    return sections;
  }

  private static parseJobSection(section: string, organization: string, id: string): JobData | null {
    // Extract job title
    const title = this.extractJobTitle(section);
    if (!title) return null;

    // Extract other job details
    const location = this.extractLocation(section);
    const jobType = this.categorizeJob(title);
    const salary = this.extractSalary(section);
    const description = this.extractDescription(section);
    const tags = this.extractTags(section);

    return {
      id,
      title,
      organization,
      location,
      state: this.extractStateFromLocation(location),
      type: jobType,
      salary,
      postedDate: 'Recently posted',
      description,
      tags,
      jobUrl: undefined // Generic parser doesn't have individual job URLs
    };
  }

  private static extractJobTitle(section: string): string | null {
    const titlePatterns = [
      /#{1,3}\s*([^#\n]+)/,
      /\*\*([^*]+)\*\*/,
      /^([^\n]+)/m
    ];

    for (const pattern of titlePatterns) {
      const match = section.match(pattern);
      if (match && match[1]) {
        const title = match[1].trim();
        // Check if this looks like a job title
        if (this.isJobTitle(title)) {
          return title;
        }
      }
    }

    return null;
  }

  private static isJobTitle(text: string): boolean {
    const jobKeywords = [
      'coordinator', 'organizer', 'manager', 'director', 'specialist', 
      'associate', 'assistant', 'analyst', 'intern', 'volunteer',
      'officer', 'representative', 'leader', 'developer', 'designer'
    ];

    return jobKeywords.some(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  private static extractLocation(section: string): string {
    const locationPatterns = [
      /location[:\s]+([^\n]+)/i,
      /based in[:\s]+([^\n]+)/i,
      /([A-Z][a-z]+,\s*[A-Z]{2})/,
      /(remote|hybrid)/i,
      /([A-Z][a-z]+\s*[A-Z][a-z]+,\s*[A-Z]{2})/
    ];

    for (const pattern of locationPatterns) {
      const match = section.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return 'Location not specified';
  }

  private static extractJobType(section: string): string {
    const typePatterns = [
      /full[- ]?time/i,
      /part[- ]?time/i,
      /contract/i,
      /temporary/i,
      /internship/i,
      /volunteer/i
    ];

    for (const pattern of typePatterns) {
      const match = section.match(pattern);
      if (match) {
        return match[0].toLowerCase().replace(/-/g, '-');
      }
    }

    return 'Full-time';
  }

  private static extractSalary(section: string): string | undefined {
    const salaryPatterns = [
      /\$[\d,]+(?:\s*[-–]\s*\$[\d,]+)?(?:\s*per\s*(?:hour|year))?/i,
      /salary[:\s]+([^\n]+)/i,
      /compensation[:\s]+([^\n]+)/i,
      /\$[\d,]+(?:k)?/i
    ];

    for (const pattern of salaryPatterns) {
      const match = section.match(pattern);
      if (match) {
        return match[0].trim();
      }
    }

    return undefined;
  }

  private static extractDescription(section: string): string {
    // Remove headers and formatting
    let description = section
      .replace(/#{1,6}\s*/g, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .trim();

    // Take first paragraph or reasonable length
    const paragraphs = description.split('\n\n');
    const firstParagraph = paragraphs[0] || description;
    
    // Limit length
    if (firstParagraph.length > 300) {
      return firstParagraph.substring(0, 300) + '...';
    }

    return firstParagraph || 'No description available';
  }

  private static extractTags(section: string): string[] {
    const tags = [];
    
    // Look for skill/requirement keywords
    const skillKeywords = [
      'community', 'organizing', 'advocacy', 'grassroots', 'campaign',
      'social justice', 'climate', 'environment', 'education', 'healthcare',
      'housing', 'immigration', 'labor', 'civil rights', 'nonprofit',
      'volunteer', 'leadership', 'fundraising', 'communications', 'digital',
      'research', 'policy', 'outreach', 'engagement', 'coalition'
    ];

    const lowerSection = section.toLowerCase();
    
    skillKeywords.forEach(keyword => {
      if (lowerSection.includes(keyword)) {
        // Capitalize first letter
        tags.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
      }
    });

    // Remove duplicates and limit to 5 tags
    return [...new Set(tags)].slice(0, 5);
  }
}