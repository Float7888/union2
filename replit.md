# Project: Job Board Application

## Overview
This is a full-stack job board application for community organizing positions. The app allows users to browse jobs, search/filter listings, and scrape job data from external sources using Firecrawl.

## Project Architecture
- **Frontend**: React with Vite, TailwindCSS, shadcn/ui components
- **Backend**: Express.js with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state
- **Database**: PostgreSQL with Drizzle ORM
- **API**: RESTful API with full CRUD operations for jobs
- **UI Components**: Radix UI primitives with shadcn/ui

## Key Features
- Job listing browsing with advanced search and multi-state filtering
- Job detail pages with enhanced scraping capabilities
- Web scraping integration with Firecrawl service (admin-only)
- Email alert system for job notifications based on user criteria
- Geographic filtering by US states, Washington DC, and Puerto Rico
- Job categorization by specialized labor movement roles
- Mission statement highlighting labor movement goals
- Responsive design with dark/light theme support

## Recent Changes
- 2025-01-18: Started migration from Lovable to Replit
- 2025-01-18: Installed missing dependencies: react-router-dom, sonner, @mendable/firecrawl-js
- 2025-01-18: Migrated routing from React Router to Wouter (per Replit guidelines)
- 2025-01-18: Created admin dashboard at /admin with password protection
- 2025-01-18: Moved job scraper functionality to admin-only interface
- 2025-01-18: Removed CrawlForm from public website
- 2025-01-18: Added PostgreSQL database with Drizzle ORM
- 2025-01-18: Created full CRUD API endpoints for jobs
- 2025-01-18: Updated frontend to use database instead of localStorage
- 2025-01-18: Integrated TanStack Query for server state management
- 2025-01-18: Enhanced job categorization with new categories (Organizing, Bargaining/Contract Support, Research/Strategic Campaigns, Political/Policy, Communications/Digital, Legal, Administrative, Other)
- 2025-01-18: Added state field to jobs schema for geographic filtering
- 2025-01-18: Implemented multi-state selection in search filters
- 2025-01-18: Created email alerts system with PostgreSQL database storage
- 2025-01-18: Added mission statement component to homepage
- 2025-01-18: Removed specified tag buttons (Community Organizing, Climate Action, Social Justice)
- 2025-01-18: Enhanced JobParser with intelligent state detection from job locations
- 2025-01-19: Created custom SVG background image without people for header
- 2025-01-19: Updated headline to "Let's Work Together to Build a Powerful Labor Movement"
- 2025-01-19: Moved mission statement to serve as subheading under new headline
- 2025-01-19: Removed "Explore Positions", "Post a Job", and "Create Your Profile" buttons
- 2025-01-19: Removed Active Positions/Organizations/Cities & States statistics section
- 2025-01-19: Removed "Find Your Movement" section header
- 2025-01-19: Removed Featured Organizations section
- 2025-01-19: Simplified CTA section to focus solely on labor movement messaging
- 2025-01-19: Enhanced job detail scraping system with specialized SEIU UltiPro parser
- 2025-01-19: Added individual job URL scraper component for detailed job information extraction
- 2025-01-19: Created specialized parsing for background, responsibilities, requirements, benefits, and application instructions
- 2025-01-19: Fixed JobDetail component infinite re-render issue
- 2025-01-19: Enhanced database schema with additional detailed job fields
- 2025-01-21: Improved job detail scraper with better SEIU parsing and truncation handling
- 2025-01-21: Enhanced description generation from available content when full details are truncated
- 2025-01-21: Fixed regex compatibility issues and improved content extraction patterns
- 2025-01-21: Added news feed functionality with database backend
- 2025-01-21: Created admin interface for managing news items and social media links
- 2025-01-21: Integrated news sidebar into homepage with responsive design
- 2025-01-21: Added "Post a Job" button and comprehensive job posting information page
- 2025-01-22: Implemented complete server-side job scraping system with FIRECRAWL_API_KEY
- 2025-01-22: Created /api/crawl and /api/scrape-job endpoints for bulk and individual job extraction
- 2025-01-22: Successfully tested job scraping with unionjobs.com extracting 209 job listings
- 2025-01-22: Enhanced JobParser to process and structure scraped job data automatically
- 2025-01-22: Verified complete workflow: scraping → parsing → database integration → website display

## User Preferences
- Non-technical user, prefer simple explanations
- Focus on functionality over technical details

## Current Status
Migrating from Lovable to Replit environment. Need to:
1. Install missing dependencies
2. Migrate from react-router-dom to wouter (per Replit guidelines)
3. Ensure proper client/server separation
4. Test application functionality