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

    const prompt = `Transform the following bullet points into a Twitter thread format that efficiently ramps up readers on the key insights. Structure it as separate paragraphs where each paragraph:

- Is bite-sized and discussion-worthy 
- Flows logically from the previous point
- Contains one clear, actionable insight or key concept
- Is written in an engaging, informational tone
- Can stand alone as a conversation starter

Each paragraph should be separated by a double line break and represent what would be an individual tweet. Don't include numbering (like 1/n, 2/n) or calls-to-action like "RT/Follow" since this is for internal discussion, not actual Twitter publishing.

Make each paragraph conversational yet informative, like you're explaining complex ideas to a friend. Focus on the most impactful insights first, then build supporting details. End with a thought-provoking conclusion.

Bullet points:
${bulletPoints}

Twitter Thread:`;

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