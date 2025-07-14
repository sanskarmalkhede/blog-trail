import { BrowserRouter, Route, Routes, Navigate, Link } from "react-router-dom";
import { Provider } from 'react-redux';
import { store } from './store/store';
import { Button } from "./components/ui/button";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import PostsPage from "./pages/PostsPage";
import CreatePostPage from "./pages/CreatePostPage";
import { useAppSelector, useAppDispatch } from "./hooks/useTypedHooks";
import { logout } from "./store/authSlice";
import { Moon, Sun, PenTool, LogOut, User } from "lucide-react";
import { useState, useEffect } from "react";

function AppContent() {
  const auth = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [theme, setTheme] = useState<"light" | "dark">(
    localStorage.getItem("theme") === "dark" ? "dark" : "light"
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-card elevation-2">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link 
              to="/" 
              className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent hover:scale-105 transition-transform"
            >
              BlogTrail
            </Link>

            {/* Navigation Items */}
            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="rounded-full hover:bg-muted btn-material"
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>

              {/* User Menu */}
              {auth.user ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-muted/50">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{auth.user.name}</span>
                  </div>
                  
                  <Button variant="default" size="sm" asChild className="rounded-full btn-material elevation-1">
                    <Link to="/create" className="flex items-center gap-2">
                      <PenTool className="h-4 w-4" />
                      Create
                    </Link>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => dispatch(logout())}
                    className="rounded-full flex items-center gap-2 btn-material"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" asChild className="rounded-full btn-material">
                    <Link to="/login">Login</Link>
                  </Button>
                  <Button size="sm" asChild className="rounded-full btn-material elevation-1">
                    <Link to="/signup">Sign Up</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<PostsPage />} />
          <Route
            path="/create"
            element={auth.user ? <CreatePostPage /> : <Navigate to="/login" />}
          />
          <Route
            path="/login"
            element={auth.user ? <Navigate to="/" /> : <LoginPage />}
          />
          <Route
            path="/signup"
            element={auth.user ? <Navigate to="/" /> : <SignupPage />}
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="bg-card elevation-1 mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2025 BlogTrail. A minimal blog app.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </Provider>
  );
}

export default App;
