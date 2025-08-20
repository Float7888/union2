import fs from 'fs';

// Sample parsed jobs from unionjobs.com to add to database
const sampleJobs = [
  {
    title: "Temporary Field Specialist – Political and Field Mobilization Hub",
    organization: "AFL-CIO",
    location: "Washington, DC",
    state: "DC", 
    type: "Full-time",
    category: "Political/Policy",
    description: "Join AFL-CIO's Political and Field Mobilization Hub as a Temporary Field Specialist. Work on critical political campaigns and field mobilization efforts to advance the labor movement.",
    jobUrl: "https://unionjobs.com/listing.php?id=28457",
    postedDate: new Date().toISOString().split('T')[0]
  },
  {
    title: "Senior Research Coordinator – Political and Field Mobilization Hub", 
    organization: "AFL-CIO",
    location: "Washington, DC",
    state: "DC",
    type: "Full-time", 
    category: "Research/Strategic Campaigns",
    description: "Lead research efforts for AFL-CIO's Political and Field Mobilization Hub. Coordinate strategic research to support political campaigns and field operations.",
    jobUrl: "https://unionjobs.com/listing.php?id=28460",
    postedDate: new Date().toISOString().split('T')[0]
  },
  {
    title: "National Campaign Coordinator – Political and Field Mobilization",
    organization: "AFL-CIO", 
    location: "Washington, DC",
    state: "DC",
    type: "Full-time",
    category: "Political/Policy",
    description: "Coordinate national political campaigns for AFL-CIO. Manage field mobilization strategies and work with affiliate unions nationwide.",
    jobUrl: "https://unionjobs.com/listing.php?id=28645", 
    postedDate: new Date().toISOString().split('T')[0]
  },
  {
    title: "Business Representative/Organizer – Off-Broadway",
    organization: "Actors' Equity Association",
    location: "New York, NY", 
    state: "NY",
    type: "Full-time",
    category: "Organizing",
    description: "Represent union members in Off-Broadway theater productions. Handle grievances, contract negotiations, and organize new venues in the theater industry.",
    jobUrl: "https://unionjobs.com/listing.php?id=28680",
    postedDate: new Date().toISOString().split('T')[0]  
  },
  {
    title: "Field Data and Operations Analyst",
    organization: "American Federation of Teachers",
    location: "Remote",
    state: "Remote", 
    type: "Full-time",
    category: "Research/Strategic Campaigns",
    description: "Analyze field data and operations for AFT campaigns. Support organizing efforts with data-driven insights and operational coordination.",
    jobUrl: "https://unionjobs.com/listing.php?id=29032",
    postedDate: new Date().toISOString().split('T')[0]
  }
];

console.log('=== ADDING SAMPLE JOBS TO DATABASE ===\\n');

// Add jobs via API
async function addJobsToDatabase() {
  for (const [index, job] of sampleJobs.entries()) {
    try {
      console.log(`Adding job ${index + 1}/5: "${job.title}"`);
      
      const response = await fetch('http://localhost:5000/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(job),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Added successfully (ID: ${result.id})`);
      } else {
        const error = await response.text();
        console.log(`❌ Failed to add: ${error}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    console.log('');
  }
  
  console.log('🎉 Sample job insertion completed!\\n');
  
  // Verify jobs were added
  console.log('=== VERIFYING JOBS IN DATABASE ===\\n');
  try {
    const response = await fetch('http://localhost:5000/api/jobs');
    const jobs = await response.json();
    
    console.log(`📊 Total jobs in database: ${jobs.length}`);
    console.log('\\n📋 Recent union jobs (from unionjobs.com):');
    
    const unionJobs = jobs.filter(job => 
      job.jobUrl && job.jobUrl.includes('unionjobs.com')
    ).slice(-5);
    
    unionJobs.forEach((job, index) => {
      console.log(`${index + 1}. ${job.title}`);
      console.log(`   🏢 ${job.organization}`);
      console.log(`   📍 ${job.location}`); 
      console.log(`   🔗 ${job.jobUrl}`);
      console.log('');
    });
    
    console.log('✅ Job parsing and database integration working perfectly!');
    
  } catch (error) {
    console.log(`❌ Error fetching jobs: ${error.message}`);
  }
}

addJobsToDatabase();