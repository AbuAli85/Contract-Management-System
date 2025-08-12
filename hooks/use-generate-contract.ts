import { useState } from 'react';

export function useGenerateContract() {
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateContract = async (contractData: Record<string, any>) => {
    setLoading(true);
    setError(null);
    setPdfUrl(null);

    try {
      const response = await fetch('/api/contract-generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Ensures cookies/session are sent
        body: JSON.stringify(contractData),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to generate contract');
      }

      const result = await response.json();
      setPdfUrl(result.pdf_url);
      return result.pdf_url;
    } catch (err: any) {
      setError(err.message || 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { generateContract, loading, pdfUrl, error };
}
