import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertJobSchema, insertEmailAlertSchema, insertNewsItemSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all jobs
  app.get("/api/jobs", async (req, res) => {
    try {
      const jobs = await storage.getAllJobs();
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      res.status(500).json({ error: "Failed to fetch jobs" });
    }
  });

  // Get job by ID
  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid job ID" });
      }
      
      const job = await storage.getJob(id);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      
      res.json(job);
    } catch (error) {
      console.error("Error fetching job:", error);
      res.status(500).json({ error: "Failed to fetch job" });
    }
  });

  // Create new job
  app.post("/api/jobs", async (req, res) => {
    try {
      const validatedJob = insertJobSchema.parse(req.body);
      const job = await storage.createJob(validatedJob);
      res.status(201).json(job);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid job data", details: error.errors });
      }
      console.error("Error creating job:", error);
      res.status(500).json({ error: "Failed to create job" });
    }
  });

  // Update job
  app.put("/api/jobs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid job ID" });
      }
      
      const validatedJob = insertJobSchema.partial().parse(req.body);
      const job = await storage.updateJob(id, validatedJob);
      
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      
      res.json(job);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid job data", details: error.errors });
      }
      console.error("Error updating job:", error);
      res.status(500).json({ error: "Failed to update job" });
    }
  });

  // Delete job
  app.delete("/api/jobs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid job ID" });
      }
      
      const deleted = await storage.deleteJob(id);
      if (!deleted) {
        return res.status(404).json({ error: "Job not found" });
      }
      
      res.json({ message: "Job deleted successfully" });
    } catch (error) {
      console.error("Error deleting job:", error);
      res.status(500).json({ error: "Failed to delete job" });
    }
  });

  // Email alerts endpoints
  
  // Create email alert
  app.post("/api/email-alerts", async (req, res) => {
    try {
      const validatedAlert = insertEmailAlertSchema.parse(req.body);
      const emailAlert = await storage.createEmailAlert(validatedAlert);
      res.status(201).json(emailAlert);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid email alert data", details: error.errors });
      }
      console.error("Error creating email alert:", error);
      res.status(500).json({ error: "Failed to create email alert" });
    }
  });

  // Get all email alerts (admin only - could add auth later)
  app.get("/api/email-alerts", async (req, res) => {
    try {
      const emailAlerts = await storage.getEmailAlerts();
      res.json(emailAlerts);
    } catch (error) {
      console.error("Error fetching email alerts:", error);
      res.status(500).json({ error: "Failed to fetch email alerts" });
    }
  });

  // Update email alert
  app.put("/api/email-alerts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid email alert ID" });
      }
      
      const validatedAlert = insertEmailAlertSchema.partial().parse(req.body);
      const emailAlert = await storage.updateEmailAlert(id, validatedAlert);
      
      if (!emailAlert) {
        return res.status(404).json({ error: "Email alert not found" });
      }
      
      res.json(emailAlert);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid email alert data", details: error.errors });
      }
      console.error("Error updating email alert:", error);
      res.status(500).json({ error: "Failed to update email alert" });
    }
  });

  // Delete email alert
  app.delete("/api/email-alerts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid email alert ID" });
      }
      
      const deleted = await storage.deleteEmailAlert(id);
      if (!deleted) {
        return res.status(404).json({ error: "Email alert not found" });
      }
      
      res.json({ message: "Email alert deleted successfully" });
    } catch (error) {
      console.error("Error deleting email alert:", error);
      res.status(500).json({ error: "Failed to delete email alert" });
    }
  });

  // News items endpoints
  
  // Get all news items
  app.get("/api/news-items", async (req, res) => {
    try {
      const newsItems = await storage.getAllNewsItems();
      res.json(newsItems);
    } catch (error) {
      console.error("Error fetching news items:", error);
      res.status(500).json({ error: "Failed to fetch news items" });
    }
  });

  // Create news item
  app.post("/api/news-items", async (req, res) => {
    try {
      const validatedNewsItem = insertNewsItemSchema.parse(req.body);
      const newsItem = await storage.createNewsItem(validatedNewsItem);
      res.status(201).json(newsItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", error.errors);
        return res.status(400).json({ error: "Invalid news item data", details: error.errors });
      }
      console.error("Error creating news item:", error);
      res.status(500).json({ error: "Failed to create news item" });
    }
  });

  // Delete news item
  app.delete("/api/news-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid news item ID" });
      }
      
      const deleted = await storage.deleteNewsItem(id);
      if (!deleted) {
        return res.status(404).json({ error: "News item not found" });
      }
      
      res.json({ message: "News item deleted successfully" });
    } catch (error) {
      console.error("Error deleting news item:", error);
      res.status(500).json({ error: "Failed to delete news item" });
    }
  });

  // Firecrawl crawl endpoint
  app.post("/api/crawl", async (req, res) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      if (!process.env.FIRECRAWL_API_KEY) {
        return res.status(500).json({ error: "Firecrawl API key not configured" });
      }

      console.log('Starting crawl for URL:', url);
      console.log('Making crawl request to Firecrawl API');

      const { default: FirecrawlApp } = await import('@mendable/firecrawl-js');
      const firecrawlApp = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

      const crawlResponse = await firecrawlApp.crawlUrl(url, {
        limit: 100,
        scrapeOptions: {
          formats: ['markdown', 'html'],
        }
      });

      if (!crawlResponse.success) {
        console.error('Crawl failed:', crawlResponse.error);
        return res.status(500).json({ 
          error: crawlResponse.error || 'Failed to crawl website',
          details: crawlResponse
        });
      }

      console.log('Crawl completed successfully');
      res.json(crawlResponse);
    } catch (error) {
      console.error('Error during crawl:', error);
      res.status(500).json({ 
        error: 'Internal server error during crawl',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Firecrawl scrape single job page endpoint
  app.post("/api/scrape-job", async (req, res) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      if (!process.env.FIRECRAWL_API_KEY) {
        return res.status(500).json({ error: "Firecrawl API key not configured" });
      }

      console.log('Scraping job details from:', url);

      const { default: FirecrawlApp } = await import('@mendable/firecrawl-js');
      const firecrawlApp = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

      const scrapeResponse = await firecrawlApp.scrapeUrl(url, {
        formats: ['markdown', 'html'],
        includeTags: ['title', 'h1', 'h2', 'h3', 'p', 'div', 'span', 'ul', 'li'],
        onlyMainContent: true
      });

      if (!scrapeResponse.success) {
        console.error('Job scrape failed:', scrapeResponse.error);
        return res.status(500).json({ 
          error: scrapeResponse.error || 'Failed to scrape job page',
          details: scrapeResponse
        });
      }

      console.log('Job details scraped successfully');
      res.json(scrapeResponse);
    } catch (error) {
      console.error('Error during job scrape:', error);
      res.status(500).json({ 
        error: 'Internal server error during job scrape',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
