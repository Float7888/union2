import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowLeft, Mail, Phone, Globe, FileText, Users, CheckCircle } from "lucide-react";

export default function PostJob() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Job Board
            </Button>
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Post a Job with Our Labor Movement Network
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Connect with dedicated professionals who are passionate about building a more just and equitable workplace for all workers.
          </p>
        </div>

        {/* Why Post Here Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-600" />
              Why Post Your Job Here?
            </CardTitle>
            <CardDescription>
              Reach qualified candidates who share your commitment to labor rights and social justice.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Targeted Audience</h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Connect with professionals experienced in organizing, advocacy, and labor relations.
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Mission-Driven Candidates</h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Find candidates who are motivated by more than just a paycheck.
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Specialized Skills</h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Access talent with expertise in organizing, policy, research, and communications.
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Network Reach</h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Tap into our extensive network of labor professionals and advocates.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How to Post Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2 text-blue-600" />
              How to Post Your Job
            </CardTitle>
            <CardDescription>
              Get your job listing in front of the right candidates in three simple steps.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-4 flex-shrink-0">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Contact Us</h4>
                  <p className="text-gray-600 dark:text-gray-300 mb-3">
                    Reach out to discuss your hiring needs and job requirements. We'll work with you to craft a compelling job posting.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-4 flex-shrink-0">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Job Details & Review</h4>
                  <p className="text-gray-600 dark:text-gray-300 mb-3">
                    Provide us with your job description, requirements, salary range, and organizational information. We'll review and optimize your listing.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-4 flex-shrink-0">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Go Live</h4>
                  <p className="text-gray-600 dark:text-gray-300 mb-3">
                    Your job posting goes live on our platform and gets shared with our network of qualified professionals.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="h-5 w-5 mr-2 text-blue-600" />
              Ready to Post Your Job?
            </CardTitle>
            <CardDescription>
              Contact us today to get started with your job posting.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-gray-500 mr-3" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">Email</p>
                      <p className="text-gray-600 dark:text-gray-300">jobs@labormovement.org</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 text-gray-500 mr-3" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">Phone</p>
                      <p className="text-gray-600 dark:text-gray-300">(555) 123-4567</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Globe className="h-5 w-5 text-gray-500 mr-3" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">Business Hours</p>
                      <p className="text-gray-600 dark:text-gray-300">Monday - Friday, 9:00 AM - 5:00 PM EST</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  <strong>Response Time:</strong> We typically respond to job posting inquiries within 24 hours. 
                  Include your organization name, job title, and any urgent timeline requirements in your initial message.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}