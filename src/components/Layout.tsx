import React, { useRef, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router";

const Layout: React.FC = () => {
  const mainRef = useRef<HTMLElement>(null);
  const location = useLocation();

  // Restore scroll position when navigating back to "/"
  useEffect(() => {
    if (location.pathname === "/") {
      const saved = sessionStorage.getItem("homeScrollTop");
      if (saved && mainRef.current) {
        mainRef.current.scrollTop = parseInt(saved, 10);
      }
    }
  }, [location.pathname]);

  // Save scroll position while on "/"
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const onScroll = () => {
      if (location.pathname === "/") {
        sessionStorage.setItem("homeScrollTop", String(el.scrollTop));
      }
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [location.pathname]);

  return (
    <div className="grid grid-rows-[auto_1fr_auto] h-screen overflow-hidden">
      <header className="border-b">
        <div className="flex items-center justify-between p-4 mx-auto">
          <Link to="/">
            <span className="text-lg font-medium">Émile's Sketches</span>
          </Link>
          <Link
            to="https://aublet.ca"
            className="text-sm underline text-muted-foreground underline-offset-2 hover:text-white"
          >
            <span className="ml-2">aublet.ca</span>
          </Link>
        </div>
      </header>
      <main ref={mainRef} className="min-h-0 overflow-y-auto">
        <Outlet />
      </main>
      <footer>
        <div className="p-4 mx-auto">
          <p className="text-sm text-center text-muted-foreground">
            &copy; {new Date().getFullYear()} Émile Aublet. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
