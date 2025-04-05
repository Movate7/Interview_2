import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "../auth/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Menu, 
  ChevronDown, 
  User, 
  LogOut, 
  LayoutDashboard, 
  Users, 
  Grid3X3, 
  DoorOpen, 
  FileSpreadsheet, 
  MessageSquare,
  X,
  PanelRight
} from "lucide-react";

export default function Navigation() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check if the location is a public queue page
  const isPublicQueuePage = location.startsWith("/queue/") || location.startsWith("/queue-email/");

  // Close mobile menu when location changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  // Don't show nav for public pages
  if (isPublicQueuePage) {
    return null;
  }

  return (
    <nav className="bg-primary shadow-md z-10 sticky top-0">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link href="/">
              <div className="flex items-center cursor-pointer">
                <svg 
                  className="h-10 w-10 mr-3 text-white" 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <h1 className="text-white text-xl font-medium">Walk-In Drive Portal</h1>
              </div>
            </Link>
          </div>

          {user ? (
            <>
              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-4">
                {user.role === "admin" && (
                  <>
                    <Link href="/admin">
                      <div 
                        className="text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
                        style={{ backgroundColor: location === "/admin" ? 'var(--primary-dark)' : '' }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-dark)'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = location === "/admin" ? 'var(--primary-dark)' : ''}
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </div>
                    </Link>
                    <Link href="/admin/panels">
                      <div 
                        className={`text-white hover:bg-primary-dark px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${location === "/admin/panels" ? "bg-primary-dark" : ""}`}
                      >
                        <Users className="h-4 w-4" />
                        Panels
                      </div>
                    </Link>
                    <Link href="/admin/pipeline">
                      <div 
                        className={`text-white hover:bg-primary-dark px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${location === "/admin/pipeline" ? "bg-primary-dark" : ""}`}
                      >
                        <Grid3X3 className="h-4 w-4" />
                        Pipeline
                      </div>
                    </Link>
                    <Link href="/admin/rooms">
                      <div 
                        className={`text-white hover:bg-primary-dark px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${location === "/admin/rooms" ? "bg-primary-dark" : ""}`}
                      >
                        <DoorOpen className="h-4 w-4" />
                        Rooms
                      </div>
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="text-white hover:bg-primary-dark flex items-center gap-2 h-9 px-3">
                          <FileSpreadsheet className="h-4 w-4" />
                          More
                          <ChevronDown className="h-3 w-3 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <Link href="/admin/sheets">
                          <DropdownMenuItem className="cursor-pointer">
                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                            Google Sheets
                          </DropdownMenuItem>
                        </Link>
                        <Link href="/admin/feedback">
                          <DropdownMenuItem className="cursor-pointer">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Feedback
                          </DropdownMenuItem>
                        </Link>
                        <Link href="/admin/users">
                          <DropdownMenuItem className="cursor-pointer">
                            <User className="h-4 w-4 mr-2" />
                            Users
                          </DropdownMenuItem>
                        </Link>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}

                {user.role === "panel" && (
                  <>
                    <Link href="/panel">
                      <div 
                        className={`text-white hover:bg-primary-dark px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${location === "/panel" ? "bg-primary-dark" : ""}`}
                      >
                        <PanelRight className="h-4 w-4" />
                        My Panel
                      </div>
                    </Link>
                    <Link href="/panel/feedback">
                      <div 
                        className={`text-white hover:bg-primary-dark px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${location === "/panel/feedback" ? "bg-primary-dark" : ""}`}
                      >
                        <MessageSquare className="h-4 w-4" />
                        Feedback
                      </div>
                    </Link>
                  </>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="text-white hover:bg-primary-dark">
                      <User className="h-4 w-4 mr-2" />
                      {user.name}
                      <ChevronDown className="h-4 w-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="cursor-pointer"
                      onClick={logout}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Mobile Menu Toggle */}
              <button 
                className="md:hidden text-white focus:outline-none"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <Menu className="h-6 w-6" />
              </button>
            </>
          ) : (
            location !== "/login" && (
              <Link href="/login">
                <div className="text-white hover:bg-primary-dark px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer">
                  Login
                </div>
              </Link>
            )
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-0 left-0 right-0 h-screen z-50" style={{ backgroundColor: 'var(--primary-dark)' }}>
          <div className="flex justify-between items-center p-4 border-b" style={{ borderColor: 'var(--primary-light)' }}>
            <div className="text-xl font-semibold text-white">Menu</div>
            <button 
              className="text-white focus:outline-none"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="px-2 pt-4 pb-3 space-y-2 overflow-y-auto h-[calc(100vh-70px)]">
            <div className="flex items-center px-3 py-3 border-b" style={{ borderColor: 'var(--primary-light)' }}>
              <User className="h-5 w-5 text-white mr-3" />
              <div className="text-white">
                <div className="text-sm font-medium">{user?.name}</div>
                <div className="text-xs opacity-75">{user?.role}</div>
              </div>
            </div>
            
            {user?.role === "admin" && (
              <>
                <Link href="/admin">
                  <div 
                    className={`flex items-center px-3 py-2 rounded-md text-base font-medium text-white ${location === "/admin" ? "" : ""}`}
                    style={{ backgroundColor: location === "/admin" ? 'var(--primary-light)' : '' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-light)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = location === "/admin" ? 'var(--primary-light)' : ''}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LayoutDashboard className="h-5 w-5 mr-3" />
                    Dashboard
                  </div>
                </Link>
                <Link href="/admin/panels">
                  <div 
                    className="flex items-center px-3 py-2 rounded-md text-base font-medium text-white"
                    style={{ backgroundColor: location === "/admin/panels" ? 'var(--primary-light)' : '' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-light)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = location === "/admin/panels" ? 'var(--primary-light)' : ''}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Users className="h-5 w-5 mr-3" />
                    Panels
                  </div>
                </Link>
                <Link href="/admin/pipeline">
                  <div 
                    className="flex items-center px-3 py-2 rounded-md text-base font-medium text-white"
                    style={{ backgroundColor: location === "/admin/pipeline" ? 'var(--primary-light)' : '' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-light)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = location === "/admin/pipeline" ? 'var(--primary-light)' : ''}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Grid3X3 className="h-5 w-5 mr-3" />
                    Pipeline
                  </div>
                </Link>
                <Link href="/admin/rooms">
                  <div 
                    className="flex items-center px-3 py-2 rounded-md text-base font-medium text-white"
                    style={{ backgroundColor: location === "/admin/rooms" ? 'var(--primary-light)' : '' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-light)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = location === "/admin/rooms" ? 'var(--primary-light)' : ''}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <DoorOpen className="h-5 w-5 mr-3" />
                    Rooms
                  </div>
                </Link>
                <Link href="/admin/sheets">
                  <div 
                    className="flex items-center px-3 py-2 rounded-md text-base font-medium text-white"
                    style={{ backgroundColor: location === "/admin/sheets" ? 'var(--primary-light)' : '' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-light)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = location === "/admin/sheets" ? 'var(--primary-light)' : ''}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FileSpreadsheet className="h-5 w-5 mr-3" />
                    Google Sheets
                  </div>
                </Link>
                <Link href="/admin/feedback">
                  <div 
                    className="flex items-center px-3 py-2 rounded-md text-base font-medium text-white"
                    style={{ backgroundColor: location === "/admin/feedback" ? 'var(--primary-light)' : '' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-light)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = location === "/admin/feedback" ? 'var(--primary-light)' : ''}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <MessageSquare className="h-5 w-5 mr-3" />
                    Feedback
                  </div>
                </Link>
                <Link href="/admin/users">
                  <div 
                    className="flex items-center px-3 py-2 rounded-md text-base font-medium text-white"
                    style={{ backgroundColor: location === "/admin/users" ? 'var(--primary-light)' : '' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-light)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = location === "/admin/users" ? 'var(--primary-light)' : ''}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="h-5 w-5 mr-3" />
                    Users
                  </div>
                </Link>
              </>
            )}

            {user?.role === "panel" && (
              <>
                <Link href="/panel">
                  <div 
                    className="flex items-center px-3 py-2 rounded-md text-base font-medium text-white"
                    style={{ backgroundColor: location === "/panel" ? 'var(--primary-light)' : '' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-light)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = location === "/panel" ? 'var(--primary-light)' : ''}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <PanelRight className="h-5 w-5 mr-3" />
                    My Panel
                  </div>
                </Link>
                <Link href="/panel/feedback">
                  <div 
                    className="flex items-center px-3 py-2 rounded-md text-base font-medium text-white"
                    style={{ backgroundColor: location === "/panel/feedback" ? 'var(--primary-light)' : '' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-light)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = location === "/panel/feedback" ? 'var(--primary-light)' : ''}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <MessageSquare className="h-5 w-5 mr-3" />
                    Feedback
                  </div>
                </Link>
              </>
            )}

            <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--primary-light)' }}>
              <button
                className="flex items-center w-full text-left px-3 py-2 rounded-md text-base font-medium text-white"

                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-light)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = ''}
              >
                <LogOut className="h-5 w-5 mr-3" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
