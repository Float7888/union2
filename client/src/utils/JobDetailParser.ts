interface JobDetailData {
  title: string;
  organization: string;
  location: string;
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
}

interface BasicJobData {
  title: string;
  organization: string;
  location: string;
  type: string;
  salary?: string;
  postedDate: string;
  description: string;
  tags: string[];
}

export class JobDetailParser {
  // Clean up scraped content by removing navigation, links, and markdown formatting
  private static cleanContent(content: string): string {
    return content
      // Remove navigation elements and website headers/footers
      .replace(/\[Information\][\s\S]*?Search/g, '')
      .replace(/\[Home\][\s\S]*?\[Testimonials\][^\]]*\]/g, '')
      .replace(/unionjobs\.com[\s\S]*?Search/g, '')
      .replace(/\[.*?\]\(mailto:[^)]+\)/g, '') // Remove email links
      .replace(/\[.*?\]\(https?:\/\/[^)]+\)/g, '') // Remove all external links
      .replace(/!\[.*?\]\([^)]*\)/g, '') // Remove images
      .replace(/https?:\/\/[^\s\)]+/g, '') // Remove bare URLs
      
      // Clean up markdown formatting
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold markdown but keep text
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // Remove remaining markdown links but keep text
      .replace(/#{1,6}\s*/g, '') // Remove markdown headers
      .replace(/^\s*[-*]\s*/gm, '') // Remove bullet points
      
      // Remove extra whitespace and empty lines
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Reduce multiple empty lines to double
      .replace(/^\s+|\s+$/gm, '') // Trim each line
      .trim();
  }

  static parseJobDetail(scrapedContent: string, basicJob: BasicJobData): JobDetailData {
    // Clean the content first to remove navigation and formatting
    const cleanContent = this.cleanContent(scrapedContent).replace(/\s+/g, ' ').trim();
    
    // Check if this is a UltiPro SEIU job posting format
    if (scrapedContent.includes('Service Employees International Union') || scrapedContent.includes('SEIU')) {
      return this.parseUltiProSEIUJob(scrapedContent, basicJob);
    }
    
    // Extract sections using various patterns for general job postings
    const sections = {
      background: this.extractSection(cleanContent, [
        'background',
        'about',
        'about the role',
        'about this position',
        'organization background',
        'about the organization',
        'organization overview'
      ]),
      responsibilities: this.extractSection(cleanContent, [
        'responsibilities',
        'duties',
        'key responsibilities',
        'primary responsibilities',
        'role responsibilities',
        'job duties',
        'what you\'ll do',
        'you will',
        'responsibilities include',
        'essential functions'
      ]),
      requirements: this.extractSection(cleanContent, [
        'requirements',
        'qualifications',
        'required qualifications',
        'minimum qualifications',
        'education and experience',
        'skills and qualifications',
        'what we\'re looking for',
        'ideal candidate',
        'must have',
        'required skills'
      ]),
      benefits: this.extractSection(cleanContent, [
        'benefits',
        'compensation',
        'pay',
        'salary',
        'what we offer',
        'package includes',
        'benefits package',
        'pay and benefits',
        'compensation package',
        'total compensation'
      ]),
      applicationInstructions: this.extractSection(cleanContent, [
        'how to apply',
        'apply',
        'application',
        'application process',
        'to apply',
        'application instructions',
        'interested candidates',
        'submit',
        'send resume',
        'contact'
      ])
    };

    // Extract enhanced description if available
    let enhancedDescription = basicJob.description;
    const descriptionSection = this.extractSection(cleanContent, [
      'job description',
      'position description',
      'role description',
      'overview',
      'summary'
    ]);
    
    if (descriptionSection && descriptionSection.length > enhancedDescription.length) {
      enhancedDescription = descriptionSection;
    }

    // Extract salary information if not already present
    let salary = basicJob.salary;
    if (!salary) {
      salary = this.extractSalary(cleanContent);
    }

    return {
      title: basicJob.title,
      organization: basicJob.organization,
      location: basicJob.location,
      type: basicJob.type,
      salary: salary,
      postedDate: basicJob.postedDate,
      description: enhancedDescription,
      background: sections.background,
      responsibilities: sections.responsibilities,
      requirements: sections.requirements,
      benefits: sections.benefits,
      applicationInstructions: sections.applicationInstructions,
      tags: basicJob.tags
    };
  }

  private static extractSection(content: string, keywords: string[]): string | undefined {
    // Try different splitting methods for better parsing
    const sections = [
      content.split(/\n\n+/), // Double line breaks
      content.split(/\n/),    // Single line breaks
      content.split(/\. /)    // Sentence breaks
    ];
    
    for (const lines of sections) {
      const cleanLines = lines.map(line => line.trim()).filter(line => line.length > 0);
      
      for (const keyword of keywords) {
        // Find sections that contain the keyword
        const matchingLines = cleanLines.filter(line => {
          const lowerLine = line.toLowerCase();
          return lowerLine.includes(keyword.toLowerCase());
        });
        
        if (matchingLines.length > 0) {
          // Find the index of the first matching line
          const headerIndex = cleanLines.findIndex(line => 
            line.toLowerCase().includes(keyword.toLowerCase())
          );
          
          if (headerIndex !== -1) {
            // Extract content after the header
            const sectionLines = [];
            let foundContent = false;
            
            for (let i = headerIndex; i < cleanLines.length && sectionLines.length < 20; i++) {
              const line = cleanLines[i].trim();
              
              // Skip the header line itself
              if (i === headerIndex && line.toLowerCase().includes(keyword.toLowerCase())) {
                continue;
              }
              
              // Stop if we hit another major section header
              if (i > headerIndex && line.length < 100 && (
                line.toLowerCase().includes('essential functions') ||
                line.toLowerCase().includes('key responsibilities') ||
                line.toLowerCase().includes('qualifications') ||
                line.toLowerCase().includes('education') ||
                line.toLowerCase().includes('experience') ||
                line.toLowerCase().includes('skills') ||
                line.toLowerCase().includes('benefits') ||
                line.toLowerCase().includes('compensation') ||
                line.toLowerCase().includes('salary') ||
                line.toLowerCase().includes('how to apply') ||
                line.toLowerCase().includes('application') ||
                line.toLowerCase().includes('equal opportunity')
              )) {
                break;
              }
              
              if (line.length > 15) { // Only include substantial content
                sectionLines.push(line);
                foundContent = true;
              }
            }
            
            if (foundContent && sectionLines.length > 0) {
              return sectionLines.join(' ').trim();
            }
          }
        }
      }
    }
    
    return undefined;
  }

  private static extractSalary(content: string): string | undefined {
    // Patterns for salary detection
    const salaryPatterns = [
      /\$[\d,]+\s*-?\s*\$?[\d,]*\s*(per\s+year|annually|yearly|\/year)?/gi,
      /salary\s*:?\s*\$?[\d,]+\s*-?\s*\$?[\d,]*/gi,
      /compensation\s*:?\s*\$?[\d,]+\s*-?\s*\$?[\d,]*/gi,
      /pay\s*:?\s*\$?[\d,]+\s*-?\s*\$?[\d,]*/gi,
      /hourly\s*:?\s*\$?[\d,]+\s*-?\s*\$?[\d,]*/gi
    ];
    
    for (const pattern of salaryPatterns) {
      const match = content.match(pattern);
      if (match) {
        return match[0].trim();
      }
    }
    
    return undefined;
  }

  // Specialized parser for UltiPro SEIU job postings
  private static parseUltiProSEIUJob(content: string, basicJob: BasicJobData): JobDetailData {
    // Clean the content first
    const cleanedContent = this.cleanContent(content);
    // Extract title - updated pattern for SEIU format
    const titleMatch = cleanedContent.match(/JOB TITLE:\s*([^\n\r*]+)/i) ||
                      cleanedContent.match(/Job Title:\s*([^\n\r*]+)/i);
    const title = titleMatch ? titleMatch[1].trim() : basicJob.title;

    // Extract organization
    const organization = "Service Employees International Union (SEIU)";

    // Extract location - updated pattern
    const locationMatch = cleanedContent.match(/LOCATION:\s*([^\n\r*]+)/i) ||
                         cleanedContent.match(/Washington,?\s*DC[^a-z]*(?:\(Headquarters\))?/i);
    const location = locationMatch ? (locationMatch[1] || locationMatch[0]).trim() : basicJob.location;

    // Extract salary - updated pattern
    const salaryMatch = cleanedContent.match(/ANNUAL SALARY:\s*\$?([\d,]+\.?\d*)/i);
    const salary = salaryMatch ? `$${salaryMatch[1]}` : basicJob.salary;

    // Extract organization overview as background - look for content after the overview header
    const backgroundMatch = cleanedContent.match(/ORGANIZATION OVERVIEW:\s*([\s\S]*?)(?=\n\n|$)/i);
    let background = backgroundMatch ? backgroundMatch[1].trim() : undefined;
    
    // Handle truncated content by trying to find it elsewhere in the content
    if (background && background.includes('TRUNCATED')) {
      // Try to find the full organization description
      const fullOrgMatch = cleanedContent.match(/We are the Service Employees International Union[\s\S]*?(?=\n\n|$)/i);
      if (fullOrgMatch) {
        background = fullOrgMatch[0].replace(/TRUNCATED.*$/g, '').trim();
      } else {
        // Remove the truncated marker and provide what we have
        background = background.replace(/TRUNCATED.*$/g, '').trim();
        if (background.length > 50) {
          // Add standard SEIU description if we have partial content
          background += " SEIU is committed to building a just society where all workers are valued and all people respected.";
        }
      }
    }

    // Extract essential functions as responsibilities
    const responsibilitiesMatch = cleanedContent.match(/ESSENTIAL FUNCTIONS:\s*([\s\S]*?)(?=\n\n|$)/i) ||
                                 cleanedContent.match(/KEY RESPONSIBILITIES:\s*([\s\S]*?)(?=\n\n|$)/i);
    const responsibilities = responsibilitiesMatch ? responsibilitiesMatch[1].trim().replace(/TRUNCATED.*$/g, '').trim() : undefined;

    // Extract qualifications as requirements
    const requirementsMatch = cleanedContent.match(/QUALIFICATIONS:\s*([\s\S]*?)(?=\n\n|$)/i) ||
                             cleanedContent.match(/MINIMUM QUALIFICATIONS:\s*([\s\S]*?)(?=\n\n|$)/i);
    const requirements = requirementsMatch ? requirementsMatch[1].trim().replace(/TRUNCATED.*$/g, '').trim() : undefined;

    // Extract benefits
    const benefitsMatch = cleanedContent.match(/BENEFITS:\s*([\s\S]*?)(?=\n\n|$)/i) ||
                         cleanedContent.match(/WHAT WE OFFER:\s*([\s\S]*?)(?=\n\n|$)/i);
    const benefits = benefitsMatch ? benefitsMatch[1].trim().replace(/TRUNCATED.*$/g, '').trim() : undefined;

    // Extract application instructions
    const applicationMatch = cleanedContent.match(/HOW TO APPLY:\s*([\s\S]*?)(?=\n\n|$)/i) ||
                            cleanedContent.match(/APPLICATION PROCESS:\s*([\s\S]*?)(?=\n\n|$)/i);
    const applicationInstructions = applicationMatch ? applicationMatch[1].trim().replace(/TRUNCATED.*$/g, '').trim() : undefined;

    // Extract description - try to get a more comprehensive description
    const descriptionMatch = cleanedContent.match(/Description\s*([\s\S]*?)(?=\n\n|$)/i) ||
                            cleanedContent.match(/Job Details\s*Description\s*([\s\S]*?)(?=\n\n|$)/i);
    let description = descriptionMatch ? descriptionMatch[1].trim().replace(/TRUNCATED.*$/g, '').trim() : '';
    
    // If no specific description found, create one from available info
    if (!description && background) {
      // Use the first 500 characters of the background as description
      description = background.substring(0, 500);
      if (background.length > 500) {
        // Find the last complete sentence within 500 chars
        const lastPeriod = description.lastIndexOf('.');
        const lastExclamation = description.lastIndexOf('!');
        const lastSentenceEnd = Math.max(lastPeriod, lastExclamation);
        if (lastSentenceEnd > 300) {
          description = description.substring(0, lastSentenceEnd + 1);
        } else {
          description += '...';
        }
      }
    }
    
    // If still no description, create a basic one from the title and organization
    if (!description) {
      description = `${title} position at ${organization}. Located in ${location}.`;
      if (salary) {
        description += ` Annual salary: ${salary}.`;
      }
    }

    return {
      title,
      organization,
      location,
      type: basicJob.type,
      salary,
      postedDate: basicJob.postedDate,
      description,
      background,
      responsibilities,
      requirements,
      benefits,
      applicationInstructions,
      tags: basicJob.tags
    };
  }
}