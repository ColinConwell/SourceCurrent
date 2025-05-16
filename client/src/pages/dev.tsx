import React from "react";
import { PageHeader } from "@/components/ui/page-header";

export default function DevelopmentPage() {
  return (
    <div className="container p-6 mx-auto">
      <PageHeader
        title="Development"
        description="Advanced features for developers and administrators"
      />
      
      <div className="grid gap-6 mt-6">
        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <h3 className="text-lg font-medium mb-4">Development Area</h3>
          <p className="text-neutral-600 mb-4">
            This area is reserved for development features and tools that are still in development.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="border rounded p-4 bg-neutral-50">
              <h4 className="font-medium mb-2">API Testing</h4>
              <p className="text-sm text-neutral-600">
                Advanced tools for testing API connections and handling edge cases.
              </p>
            </div>
            
            <div className="border rounded p-4 bg-neutral-50">
              <h4 className="font-medium mb-2">Connection Debugger</h4>
              <p className="text-sm text-neutral-600">
                Detailed logs and diagnostics for troubleshooting integration issues.
              </p>
            </div>
            
            <div className="border rounded p-4 bg-neutral-50">
              <h4 className="font-medium mb-2">Data Visualizer</h4>
              <p className="text-sm text-neutral-600">
                Preview experimental data visualization tools and charts.
              </p>
            </div>
            
            <div className="border rounded p-4 bg-neutral-50">
              <h4 className="font-medium mb-2">Schema Editor</h4>
              <p className="text-sm text-neutral-600">
                Advanced tools for defining and modifying data schemas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
