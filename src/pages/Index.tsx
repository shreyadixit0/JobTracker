import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <>
      <Seo
        title="JobTrackr – Track Your Job Applications"
        description="A clean, modern job application tracker to manage applications, interviews, rejections, and offers."
        canonical={window.location.href}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'JobTrackr',
          url: window.location.origin,
        }}
      />
      <section className="relative overflow-hidden min-h-screen flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" aria-hidden="true" />
        
        <div className="container mx-auto flex flex-col items-center justify-center px-6 text-center relative z-10">
          <div className="space-y-8 max-w-4xl">
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight">
              <span className="text-gradient">Job Application</span>
              <br />
              <span className="text-foreground">Tracker</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-3xl">
              Organize your job hunt with an elegant dashboard. Track applications, schedule interviews, and stay focused on your career goals.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link to="/auth">
                <Button size="lg" className="bg-primary hover:bg-primary/90 hover-scale font-semibold px-8 py-6 text-lg">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Index;
