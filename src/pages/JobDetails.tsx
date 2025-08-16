
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Seo from "@/components/Seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser, getApplicationsKey } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";

type Status = "Applied" | "Interview" | "Rejected" | "Hired";

const statusColors: Record<Status, { bg: string; text: string }> = {
  Applied: { bg: "bg-status-applied", text: "text-status-applied-foreground" },
  Interview: { bg: "bg-status-interview", text: "text-status-interview-foreground" },
  Rejected: { bg: "bg-status-rejected", text: "text-status-rejected-foreground" },
  Hired: { bg: "bg-status-hired", text: "text-status-hired-foreground" },
};

const JobDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const user = getCurrentUser();

  // Get the job data passed from FirstJob page
  const jobData = location.state?.jobData;

  const [status, setStatus] = useState<Status>(jobData?.status || "Applied");
  const [salaryRange, setSalaryRange] = useState(jobData?.salaryRange || "");

  useEffect(() => {
    if (!user || !jobData) {
      navigate("/dashboard");
    }
  }, [user, jobData, navigate]);

  const handleSaveAndContinue = () => {
    if (!user || !jobData) return;

    const updatedJob = {
      ...jobData,
      status,
      salaryRange,
    };

    try {
      const key = getApplicationsKey(user.email);
      const raw = localStorage.getItem(key);
      const apps = raw ? JSON.parse(raw) : [];
      
      // Update the job if it exists, or add it if it doesn't
      const existingIndex = apps.findIndex((app: any) => app.id === jobData.id);
      if (existingIndex >= 0) {
        apps[existingIndex] = updatedJob;
      } else {
        apps.unshift(updatedJob);
      }
      
      localStorage.setItem(key, JSON.stringify(apps));
      toast({ title: "Job details saved", description: `${jobData.company} – ${jobData.position}` });
      navigate("/dashboard");
    } catch (e) {
      toast({ title: "Could not save", description: "Please try again.", variant: "destructive" });
    }
  };

  if (!jobData) {
    return null;
  }

  return (
    <>
      <Seo
        title="Job Application Details – JobTrackr"
        description="Review and update your job application details."
        canonical={window.location.href}
      />
      <section className="min-h-[calc(100vh-56px)] bg-hero-gradient/10 flex items-center">
        <div className="container mx-auto px-4">
          <Card className="mx-auto w-full max-w-2xl shadow-lg animate-enter">
            <CardHeader>
              <CardTitle className="text-center">Job Application Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Job Info Display */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Company</Label>
                  <p className="font-medium">{jobData.company}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Position</Label>
                  <p className="font-medium">{jobData.position}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Location</Label>
                  <p className="font-medium">{jobData.location}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Job Type</Label>
                  <Badge variant="outline">{jobData.jobType}</Badge>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Date Applied</Label>
                  <p className="font-medium">{jobData.dateApplied}</p>
                </div>
                {jobData.resumeName && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Resume</Label>
                    <p className="font-medium">{jobData.resumeName}</p>
                  </div>
                )}
              </div>

              {/* Editable Fields */}
              <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="status">Application Status</Label>
                  <Select value={status} onValueChange={(v: Status) => setStatus(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Applied">Applied</SelectItem>
                      <SelectItem value="Interview">Interview</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                      <SelectItem value="Hired">Hired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salary">Salary Range</Label>
                  <Input 
                    id="salary" 
                    placeholder="e.g. $80k–$100k" 
                    value={salaryRange} 
                    onChange={(e) => setSalaryRange(e.target.value)} 
                  />
                </div>
              </div>

              {/* Current Status Badge */}
              <div className="flex justify-center pt-4">
                <Badge className={`${statusColors[status].bg} ${statusColors[status].text} text-lg px-4 py-2`}>
                  {status}
                </Badge>
              </div>

              <div className="pt-4">
                <Button onClick={handleSaveAndContinue} className="w-full">
                  Save and Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
};

export default JobDetails;
