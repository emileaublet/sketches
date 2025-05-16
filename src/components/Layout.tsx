import React from "react";
import { Outlet, Link } from "react-router";

const Layout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container p-4 mx-auto">
          <Link to="/">
            <span className="text-lg font-medium">Sketches</span>
          </Link>
        </div>
      </header>
      <main className="container p-4 mx-auto grow">
        <Outlet />
      </main>
      <footer className="mt-12">
        <div className="container p-4 mx-auto">
          <p className="text-sm text-center text-muted-foreground">
            &copy; {new Date().getFullYear()} Émile Aublet. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
