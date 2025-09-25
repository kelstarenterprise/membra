"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type TestData = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  nationalId: string;
  phone: string;
  residentialAddress: string;
  regionConstituencyElectoralArea: string;
  email: string;
  membershipLevel: string;
  level: string;
  status: string;
};

type ApiResponse = {
  status: number;
  data: unknown;
};

type DebugResult = {
  debug?: ApiResponse;
  real?: ApiResponse;
  error?: string;
  testData: TestData;
};

export default function DebugMemberPage() {
  const [result, setResult] = useState<DebugResult | null>(null);
  const [loading, setLoading] = useState(false);

  const testMemberCreation = async () => {
    setLoading(true);
    setResult(null);

    const testData = {
      firstName: "Debug",
      lastName: "Test",
      dateOfBirth: "1990-01-01",
      gender: "MALE",
      nationalId: "DEBUG123456",
      phone: "0244567890",
      residentialAddress: "123 Debug Street, Test City",
      regionConstituencyElectoralArea: "Greater Accra",
      email: "debug@example.com",
      membershipLevel: "ORDINARY",
      level: "BRONZE", // Using BRONZE category that exists
      status: "PROSPECT",
    };

    try {
      // First test the debug endpoint
      console.log("Testing debug endpoint...");
      const debugResponse = await fetch("/api/debug-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testData),
      });
      
      const debugResult = await debugResponse.json();
      console.log("Debug result:", debugResult);

      // Then test the real endpoint
      console.log("Testing real endpoint...");
      const realResponse = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testData),
      });
      
      const realResult = await realResponse.json();
      console.log("Real result:", realResult);

      setResult({
        debug: {
          status: debugResponse.status,
          data: debugResult,
        },
        real: {
          status: realResponse.status,
          data: realResult,
        },
        testData,
      });

    } catch (error) {
      console.error("Test failed:", error);
      setResult({
        error: error instanceof Error ? error.message : "Unknown error",
        testData,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Debug Member Creation</h1>
        <p className="text-muted-foreground">
          Test member creation API to identify issues
        </p>
      </div>

      <Button onClick={testMemberCreation} disabled={loading}>
        {loading ? "Testing..." : "Test Member Creation"}
      </Button>

      {result && (
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Test Data Sent:</h3>
            <pre className="text-sm overflow-x-auto">
              {JSON.stringify(result.testData, null, 2)}
            </pre>
          </div>

          {result.debug && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">
                Debug Endpoint (Status: {result.debug.status})
              </h3>
              <pre className="text-sm overflow-x-auto">
                {JSON.stringify(result.debug.data, null, 2)}
              </pre>
            </div>
          )}

          {result.real && (
            <div className={`p-4 rounded-lg ${result.real.status < 400 ? 'bg-green-50' : 'bg-red-50'}`}>
              <h3 className="font-semibold mb-2">
                Real Endpoint (Status: {result.real.status})
              </h3>
              <pre className="text-sm overflow-x-auto">
                {JSON.stringify(result.real.data, null, 2)}
              </pre>
            </div>
          )}

          {result.error && (
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2 text-red-700">Error:</h3>
              <p className="text-red-600">{result.error}</p>
            </div>
          )}
        </div>
      )}

      <div className="bg-yellow-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Click &ldquo;Test Member Creation&rdquo; to run the test</li>
          <li>Check the results above</li>
          <li>Check the browser console for detailed logs</li>
          <li>Check the server terminal for server-side logs</li>
        </ol>
      </div>
    </div>
  );
}