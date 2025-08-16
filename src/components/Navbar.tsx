import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  
  const isMinimal = user && (location.pathname.startsWith("/dashboard"));
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"} transition-colors`;
    
  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full glass-effect shadow-lg">
      <nav className="container mx-auto flex h-16 items-center justify-between px-6">
        <Link to="/" className="inline-flex items-center gap-3 hover-scale">
          <div className="h-8 w-8 rounded-xl bg-primary shadow-lg flex items-center justify-center" aria-hidden="true">
            <span className="text-primary-foreground font-bold text-sm">JT</span>
          </div>
          <span className="text-primary text-xl font-black tracking-tight">
            JobTrackr
          </span>
        </Link>

        <div className="flex items-center gap-6">
          {isMinimal ? (
            <Button variant="secondary" className="hover-scale shadow-lg" onClick={handleLogout}>
              Sign Out
            </Button>
          ) : (
            <>
              <NavLink to="/" className={navLinkClass} end>
                Home
              </NavLink>
              {user && (
                <NavLink to="/dashboard" className={navLinkClass}>
                  Dashboard
                </NavLink>
              )}
              {!user ? (
                <Link to="/auth">
                  <Button className="bg-primary hover:bg-primary/90 hover-scale font-semibold px-6">
                    Sign In
                  </Button>
                </Link>
              ) : (
                <span className="text-sm text-muted-foreground">
                  Welcome, {user.email}
                </span>
              )}
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;