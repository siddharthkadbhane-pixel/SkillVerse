import { AiReviewOutputSchema, AiReviewOutput } from './types';

export class AiOutputValidator {
  static parseAndValidate(rawOutput: string): AiReviewOutput {
    let cleanText = rawOutput.trim();

    // Extract JSON block if surrounded by markdown code blocks
    const jsonStart = cleanText.indexOf('{');
    const jsonEnd = cleanText.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
      cleanText = cleanText.substring(jsonStart, jsonEnd + 1);
    }

    try {
      const parsed = JSON.parse(cleanText);
      return AiReviewOutputSchema.parse(parsed);
    } catch (parseError: any) {
      console.warn('⚠️ Initial JSON parsing or Zod validation failed. Attempting self-healing...', parseError);
      
      // Try self-healing: strip trailing commas, fix escaped backslashes, etc.
      try {
        const healedText = cleanText
          .replace(/,\s*([}\]])/g, '$1') // Remove trailing commas
          .replace(/\\"/g, '"') // Remove nested escaped double quotes
          .replace(/[\u0000-\u0019]+/g, ''); // Remove non-printable control characters
          
        const parsed = JSON.parse(healedText);
        return AiReviewOutputSchema.parse(parsed);
      } catch (healingError: any) {
        console.error('❌ JSON Self-healing failed:', healingError);
        throw new Error(`Invalid AI response format: ${parseError.message}`);
      }
    }
  }
}
