import { useNavigate } from "react-router-dom";
import Seo from "@/components/Seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { getCurrentUser, getApplicationsKey } from "@/lib/auth";

const FirstJob = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const user = getCurrentUser();

  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState<"Full-time" | "Part-time" | "Contract" | "Internship">("Full-time");
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate("/login");
      return;
    }

    if (!company.trim() || !role.trim() || !location.trim() || !jobType) {
      toast({ title: "Missing information", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    const today = new Date().toISOString().slice(0, 10);

    const newApp = {
      id: `${Date.now()}`,
      company,
      position: role,
      location,
      jobType,
      salaryRange: "",
      dateApplied: today,
      status: "Applied" as const,
      resumeName: resumeFile?.name,
    };

    // Navigate to job details page with the job data
    navigate("/job-details", { state: { jobData: newApp } });
  };

  return (
    <>
      <Seo
        title="Add Your First Job – JobTrackr"
        description="Enter your first job application details to start tracking."
        canonical={window.location.href}
      />
      <section className="min-h-[calc(100vh-56px)] bg-hero-gradient/10 flex items-center">
        <div className="container mx-auto px-4">
          <Card className="mx-auto w-full max-w-2xl shadow-lg animate-enter">
            <CardHeader>
              <CardTitle className="text-center">Add Your First Job Application</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Job Type</Label>
                  <Select value={jobType} onValueChange={(v: any) => setJobType(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select job type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Full-time">Full-time</SelectItem>
                      <SelectItem value="Part-time">Part-time</SelectItem>
                      <SelectItem value="Contract">Contract</SelectItem>
                      <SelectItem value="Internship">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="resume">Resume (PDF/DOC)</Label>
                  <Input id="resume" type="file" accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(e) => setResumeFile(e.target.files?.[0] || null)} />
                  <p className="text-xs text-muted-foreground">File is used for this submission only and not stored permanently.</p>
                </div>
                <div className="md:col-span-2">
                  <Button type="submit" className="w-full">Save and Continue</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
};

export default FirstJob;
