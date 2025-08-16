import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-footer-bg text-footer-text py-12 mt-20">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-primary shadow-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">JT</span>
              </div>
              <span className="text-xl font-black tracking-tight">JobTrackr</span>
            </div>
            <p className="text-footer-text/80 text-sm leading-relaxed">
              Track your job applications with elegance and precision. Stay organized, stay ahead.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold mb-4 text-lg">Product</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/dashboard" className="text-footer-text/80 hover:text-footer-text transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/features" className="text-footer-text/80 hover:text-footer-text transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-footer-text/80 hover:text-footer-text transition-colors">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4 text-lg">Company</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/about" className="text-footer-text/80 hover:text-footer-text transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-footer-text/80 hover:text-footer-text transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/careers" className="text-footer-text/80 hover:text-footer-text transition-colors">
                  Careers
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4 text-lg">Support</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/help" className="text-footer-text/80 hover:text-footer-text transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-footer-text/80 hover:text-footer-text transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-footer-text/80 hover:text-footer-text transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-footer-text/20 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-footer-text/60 text-sm">
            © 2024 JobTrackr. All rights reserved.
          </p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="text-footer-text/60 hover:text-footer-text transition-colors text-sm">
              Twitter
            </a>
            <a href="#" className="text-footer-text/60 hover:text-footer-text transition-colors text-sm">
              LinkedIn
            </a>
            <a href="#" className="text-footer-text/60 hover:text-footer-text transition-colors text-sm">
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;