import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AuthCallback() {
  const [_, setLocation] = useLocation();
  const [match, params] = useRoute("/auth/:service/callback");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Extract the authorization code from the URL
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");
  const service = params?.service || "";

  useEffect(() => {
    async function processOAuthCallback() {
      if (!code) {
        setStatus("error");
        setError("No authorization code found in the callback URL");
        return;
      }

      try {
        // In a real application, this would exchange the code for tokens
        // and create a connection in the database
        const response = await apiRequest(
          "POST",
          `/api/connections`,
          {
            service,
            name: `My ${service.charAt(0).toUpperCase() + service.slice(1)} Connection`,
            active: true,
            credentials: {
              // This would be the OAuth tokens in a real app
              // For the demo, we're using placeholder values
              code,
              token: "demo-token",
              client_id: "demo-client-id",
              client_secret: "demo-client-secret"
            }
          }
        );

        setStatus("success");

        toast({
          title: "Connection successful!",
          description: `Your ${service} account has been connected.`,
        });

        // Redirect back to dashboard after a short delay
        setTimeout(() => {
          setLocation("/");
        }, 2000);
      } catch (err) {
        setStatus("error");
        setError((err as Error).message || "Failed to complete authentication");

        toast({
          title: "Authentication failed",
          description: (err as Error).message || "Could not connect to service",
          variant: "destructive",
        });
      }
    }

    processOAuthCallback();
  }, [code, service, setLocation, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          {status === "loading" && (
            <div className="text-center py-8">
              <div className="inline-block w-12 h-12 rounded-full border-4 border-primary-100 border-t-primary-500 animate-spin mb-4"></div>
              <h2 className="text-xl font-semibold mb-2">Completing Authentication</h2>
              <p className="text-neutral-500">
                Please wait while we connect your {service.charAt(0).toUpperCase() + service.slice(1)} account...
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4">
                <i className="ri-check-line text-3xl"></i>
              </div>
              <h2 className="text-xl font-semibold mb-2">Successfully Connected!</h2>
              <p className="text-neutral-500">
                Your {service.charAt(0).toUpperCase() + service.slice(1)} account has been successfully connected to DataConnect.
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                <i className="ri-close-line text-3xl"></i>
              </div>
              <h2 className="text-xl font-semibold mb-2">Authentication Failed</h2>
              <p className="text-neutral-500 mb-4">
                {error || "There was an error connecting your account."}
              </p>
            </div>
          )}
        </CardContent>

        {status === "error" && (
          <CardFooter className="flex justify-center pb-6">
            <Button onClick={() => setLocation("/")}>
              Return to Dashboard
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
