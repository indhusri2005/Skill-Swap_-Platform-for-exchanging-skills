import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerSections = {
    platform: {
      title: "Platform",
      links: [
        { label: "Find Mentors", path: "/find-mentors" },
        { label: "Browse Skills", path: "/browse-skills" },
        { label: "Start Teaching", path: "/start-teaching" },
        { label: "How it Works", path: "/how-it-works" },
      ]
    },
    community: {
      title: "Community",
      links: [
        { label: "Success Stories", path: "/success-stories" },
        { label: "Blog", path: "/blog" },
        { label: "Forum", path: "/forum" },
        { label: "Events", path: "/events" },
      ]
    },
    support: {
      title: "Support",
      links: [
        { label: "Help Center", path: "/help" },
        { label: "Contact Us", path: "/contact" },
        { label: "Safety Guidelines", path: "/safety" },
        { label: "Report Issues", path: "/report" },
      ]
    },
    legal: {
      title: "Legal",
      links: [
        { label: "Terms of Service", path: "/terms" },
        { label: "Privacy Policy", path: "/privacy" },
        { label: "Cookie Policy", path: "/cookies" },
        { label: "Refund Policy", path: "/refunds" },
      ]
    }
  };

  return (
    <footer className="bg-muted/30 border-t">
      {/* Newsletter Section */}
      <div className="border-b border-border/50">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Stay Updated with SkillSwap
            </h3>
            <p className="text-muted-foreground mb-6">
              Get the latest tips, success stories, and new features delivered to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email address"
                className="flex-1"
              />
              <Button variant="hero" className="sm:w-auto">
                Subscribe
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              No spam, unsubscribe at any time.
            </p>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="font-bold text-xl text-foreground">SkillSwap</span>
            </Link>
            <p className="text-muted-foreground text-sm mb-6">
              Connecting learners and mentors worldwide through peer-to-peer skill sharing.
              Build your expertise while teaching others in our supportive community.
            </p>
            
            {/* Social Links */}
            <div className="flex space-x-4">
              <Button variant="ghost" size="icon" className="hover:text-primary">
                <Facebook className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:text-primary">
                <Twitter className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:text-primary">
                <Instagram className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:text-primary">
                <Linkedin className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Footer Sections */}
          {Object.entries(footerSections).map(([key, section]) => (
            <div key={key}>
              <h4 className="font-semibold text-foreground mb-4">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact Info */}
        <div className="border-t border-border/50 pt-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">Email Us</p>
                <p className="text-muted-foreground text-sm">support@skillswap.com</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">Call Us</p>
                <p className="text-muted-foreground text-sm">+1 (555) 123-4567</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">Location</p>
                <p className="text-muted-foreground text-sm">San Francisco, CA</p>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-border/50 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-muted-foreground text-sm">
            © {currentYear} SkillSwap. All rights reserved.
          </p>
          <div className="flex items-center gap-6 mt-4 md:mt-0">
            <Link
              to="/accessibility"
              className="text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              Accessibility
            </Link>
            <Link
              to="/sitemap"
              className="text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              Sitemap
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">Made with</span>
              <span className="text-red-500">❤️</span>
              <span className="text-muted-foreground text-sm">for learners</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
