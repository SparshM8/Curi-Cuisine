import React from "react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFBF8] text-[#3a3a3a]">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-2xl mb-6">Page Not Found</p>
      <a href="/" className="text-blue-600 underline">Go Home</a>
    </div>
  );
}
