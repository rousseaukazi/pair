import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const { messages }: { messages: ChatMessage[] } = await request.json();

    // Convert messages to Claude format
    const claudeMessages = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Create a streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log('Starting Claude stream...');
          
          // Get streaming response from Claude
          const stream = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 4000,
            messages: claudeMessages,
            stream: true,
          });

          let fullContent = '';

          for await (const chunk of stream) {
            console.log('Received chunk:', chunk.type);
            
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              const text = chunk.delta.text;
              fullContent += text;
              
              // Process text for formatting
              const processedText = processTextFormatting(text);
              
              console.log('Sending chunk:', processedText);
              
              // Send the chunk
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: processedText })}\n\n`));
            }
          }

          console.log('Stream complete, full content:', fullContent);
          
          // Send completion signal
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();

        } catch (error) {
          console.error('Streaming error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Anthropic API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ 
      error: `Failed to get response from Claude: ${errorMessage}` 
    }, { status: 500 });
  }
}

// Process text to ensure proper formatting
function processTextFormatting(text: string): string {
  let processed = text;
  
  // Ensure numbered lists start on new lines
  processed = processed.replace(/(\s)(\d+\.\s)/g, '\n$2');
  
  // Ensure bullet points start on new lines  
  processed = processed.replace(/(\s)([-•*]\s)/g, '\n$2');
  
  // Clean up multiple consecutive newlines
  processed = processed.replace(/\n{3,}/g, '\n\n');
  
  return processed;
} 