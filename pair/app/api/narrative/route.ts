import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const { sentences } = await request.json();

    if (!sentences || sentences.length === 0) {
      return Response.json({ narrative: '' });
    }

    // Create bullet points from sentences
    const bulletPoints = sentences.map((sentence: string) => `• ${sentence}`).join('\n');

    const prompt = `Take the following bullet points and write them in a concise and logical summary to make it easy for the user to understand and learn the points being shared. Focus on clarity, logical flow, and helping the reader grasp the key concepts and information.

Bullet points:
${bulletPoints}

Summary:`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const narrative = response.content[0].type === 'text' ? response.content[0].text : '';

    return Response.json({ narrative });
  } catch (error) {
    console.error('Narrative API error:', error);
    return Response.json({ error: 'Failed to generate narrative' }, { status: 500 });
  }
} 