import React from "react";
import { Outlet, Link } from "react-router";

const Layout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container flex items-center justify-between p-4 mx-auto">
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
