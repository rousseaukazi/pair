// Enhanced sentence detection that intelligently handles list items and paragraphs
export function detectSentences(text: string): string[] {
  // Preserve original text exactly as streamed
  const lines = text.split('\n');
  const sentences: string[] = [];
  
  // Common abbreviations that shouldn't trigger sentence breaks
  const abbreviations = [
    'Dr', 'Mr', 'Mrs', 'Ms', 'Prof', 'vs', 'etc', 'i.e', 'e.g', 
    'U.S', 'U.K', 'U.N', 'Ph.D', 'M.D', 'B.A', 'M.A', 'CEO', 'CTO'
  ];
  
  // Create regex pattern for abbreviations
  const abbrevPattern = abbreviations.join('|');
  const sentenceRegex = new RegExp(
    `(?<!\\b(?:${abbrevPattern}))(?<=\\w\\.)(?:\\s+)(?=[A-Z])`,
    'g'
  );
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // Handle empty lines - preserve them as line breaks
    if (!trimmedLine) {
      sentences.push('\n');
      continue;
    }
    
    // Check if this is a list item (numbered or bulleted)
    const isListItem = /^(\s*)((?:\d+\.|\-|\•|\*)\s+)(.*)$/.test(trimmedLine);
    
    if (isListItem) {
      const match = trimmedLine.match(/^(\s*)((?:\d+\.|\-|\•|\*)\s+)(.*)$/);
      if (match) {
        const [, indent, marker, content] = match;
        
        // Split the content part into sentences
        const contentSentences = content.split(sentenceRegex)
          .map(s => s.trim())
          .filter(s => s.length > 0 && s !== '.');
        
        if (contentSentences.length <= 1) {
          // Single sentence or fragment - treat entire line as one unit
          // Add newline only between different list items/sections
          const shouldAddNewline = i < lines.length - 1 && lines[i + 1].trim() !== '';
          const lineWithNewline = shouldAddNewline ? line + '\n' : line;
          sentences.push(lineWithNewline);
        } else {
          // Multiple sentences - keep them as separate highlightable units but flowing together
          contentSentences.forEach((sentence, index) => {
            let processedSentence: string;
            if (index === 0) {
              // First sentence includes the list marker
              processedSentence = `${indent}${marker}${sentence}`;
            } else {
              // Subsequent sentences start with space for natural flow
              processedSentence = ` ${sentence}`;
            }
            
            // Only add newline after the last sentence of this list item (if not the last line)
            if (index === contentSentences.length - 1) {
              const shouldAddNewline = i < lines.length - 1 && lines[i + 1].trim() !== '';
              if (shouldAddNewline) {
                processedSentence += '\n';
              }
            }
            
            sentences.push(processedSentence);
          });
        }
      }
    } else {
      // Regular paragraph line - split into sentences
      const lineSentences = trimmedLine.split(sentenceRegex)
        .map(s => s.trim())
        .filter(s => s.length > 0 && s !== '.');
      
      if (lineSentences.length <= 1) {
        // Single sentence line - always add newline for paragraph spacing
        const lineWithNewline = i < lines.length - 1 ? line + '\n' : line;
        sentences.push(lineWithNewline);
      } else {
        // Multiple sentences on one line
        lineSentences.forEach((sentence, index) => {
          let processedSentence = sentence;
          
          // Add space before sentences that aren't the first (for natural flow)
          if (index > 0) {
            processedSentence = ` ${sentence}`;
          }
          
          // Add newline after the last sentence of this paragraph line
          if (index === lineSentences.length - 1) {
            const shouldAddNewline = i < lines.length - 1;
            if (shouldAddNewline) {
              processedSentence += '\n';
            }
          }
          
          sentences.push(processedSentence);
        });
      }
    }
  }
  
  return sentences.filter(s => s.length > 0);
}

// Find the sentence that contains a specific character position
export function findSentenceAtPosition(text: string, position: number): string | null {
  const sentences = detectSentences(text);
  let currentPos = 0;
  
  for (const sentence of sentences) {
    const sentenceStart = text.indexOf(sentence, currentPos);
    const sentenceEnd = sentenceStart + sentence.length;
    
    if (position >= sentenceStart && position <= sentenceEnd) {
      return sentence;
    }
    
    currentPos = sentenceEnd;
  }
  
  return null;
}

// Get the position range of a sentence within text
export function getSentenceRange(text: string, sentence: string): { start: number; end: number } | null {
  const index = text.indexOf(sentence);
  if (index === -1) return null;
  
  return {
    start: index,
    end: index + sentence.length
  };
} 