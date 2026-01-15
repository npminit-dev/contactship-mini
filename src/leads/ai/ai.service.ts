import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { Lead } from '../lead.entity';

@Injectable()
export class AiService {
  private ai = new GoogleGenAI({});

  async summarizeLead(
    lead: Lead,
  ): Promise<{ summary: string; next_action: string }> {
    try {
      const prompt = `
        You are an assistant integrated into a CRM system.

        Your task is to analyze a lead and produce:
        1) A concise professional summary
        2) A concrete next action for a sales or operations team

        STRICT RULES (MANDATORY):
        - Return ONLY valid JSON
        - Do NOT include markdown, explanations, or extra text
        - The JSON must have EXACTLY this shape:
          { "summary": string, "next_action": string }
        - "summary" MUST be a single paragraph with MAX 45 words
        - "next_action" MUST be a single actionable sentence with MAX 20 words
        - Use neutral, professional business language
        - Do NOT invent or assume missing personal data
        - Base your output ONLY on the provided lead data

        LEAD DATA:
        First name: ${lead.firstName}
        Last name: ${lead.lastName}
        Email: ${lead.email}
        Phone: ${lead.phone ?? 'Not provided'}
        Source: ${lead.source}
        Created at: ${lead.createdAt.toISOString()}

        If some fields are missing, produce a generic but reasonable summary based on the available information and lead source.
      `;

      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      const text = response.text;
      const parsed = JSON.parse(text as string);

      if (
        typeof parsed.summary !== 'string' ||
        typeof parsed.next_action !== 'string'
      ) {
        throw new Error('Invalid AI response format');
      }

      return parsed;
    } catch (error) {
      throw new InternalServerErrorException('AI summarization failed');
    }
  }
}
