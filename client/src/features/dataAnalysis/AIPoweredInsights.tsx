import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AIPoweredInsightsProps {
  data: any[];
}

export const AIPoweredInsights: React.FC<AIPoweredInsightsProps> = ({ data }) => {
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      // You may need to adjust the endpoint and payload as per your backend
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      });
      if (!response.ok) throw new Error('Failed to fetch insights');
      const result = await response.json();
      setInsights(result.insights || []);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-2">AI-Powered Insights</h3>
      <Button onClick={fetchInsights} disabled={loading}>
        {loading ? 'Analyzing...' : 'Get Insights'}
      </Button>
      {error && <div className="mt-2 text-red-500">{error}</div>}
      <ul className="mt-4 space-y-2">
        {insights.map((insight, idx) => (
          <li key={idx} className="bg-gray-100 rounded p-2 text-sm">{insight}</li>
        ))}
      </ul>
    </Card>
  );
}; 