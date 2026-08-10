import { NextResponse } from 'next/server';

interface VerificationResult {
  verified: boolean;
  message: string;
  details: {
    totalSources: number;
    matchedSources: number;
    unmatchedSources: string[];
    matchedContent: {
      text: string;
      source: string;
    }[];
    unmatchedContent: {
      text: string;
      reason: string;
    }[];
  };
}

async function fetchSourceContent(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const text = await response.text();
    return text;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return '';
  }
}

function findMatchingContent(aiResponse: string, sourceContent: string): string[] {
  // Split the AI response into sentences
  const sentences = aiResponse.split(/[.!?]+/).filter((s: string) => s.trim().length > 0);
  
  // Find sentences that appear in the source content
  return sentences.filter((sentence: string) => 
    sourceContent.toLowerCase().includes(sentence.toLowerCase().trim())
  );
}

export async function POST(request: Request) {
  try {
    const { aiResponse, sourceUrls } = await request.json();

    if (!aiResponse || !sourceUrls) {
      return NextResponse.json(
        { error: 'AI response and source URLs are required' },
        { status: 400 }
      );
    }

    // Split source URLs into an array
    const urls = sourceUrls.split('\n').filter((url: string) => url.trim());
    
    const verificationResult: VerificationResult = {
      verified: false,
      message: '',
      details: {
        totalSources: urls.length,
        matchedSources: 0,
        unmatchedSources: [],
        matchedContent: [],
        unmatchedContent: []
      }
    };

    // Process each source URL
    for (const url of urls) {
      const sourceContent = await fetchSourceContent(url);
      
      if (!sourceContent) {
        verificationResult.details.unmatchedSources.push(url);
        continue;
      }

      const matchingContent = findMatchingContent(aiResponse, sourceContent);
      
      if (matchingContent.length > 0) {
        verificationResult.details.matchedSources++;
        matchingContent.forEach(text => {
          verificationResult.details.matchedContent.push({
            text,
            source: url
          });
        });
      } else {
        verificationResult.details.unmatchedSources.push(url);
      }
    }

    // Find unmatched content
    const allMatchedText = verificationResult.details.matchedContent.map(m => m.text);
    const sentences = aiResponse.split(/[.!?]+/).filter((s: string) => s.trim().length > 0);
    
    sentences.forEach((sentence: string) => {
      if (!allMatchedText.includes(sentence)) {
        verificationResult.details.unmatchedContent.push({
          text: sentence,
          reason: 'No matching content found in provided sources'
        });
      }
    });

    // Set verification status and message
    verificationResult.verified = verificationResult.details.matchedSources > 0;
    verificationResult.message = verificationResult.verified
      ? `Found matching content in ${verificationResult.details.matchedSources} out of ${verificationResult.details.totalSources} sources.`
      : 'No matching content found in any of the provided sources.';

    return NextResponse.json(verificationResult);
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'An error occurred during verification' },
      { status: 500 }
    );
  }
} 