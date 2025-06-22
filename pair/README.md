# Pair - Capture Ideas from Conversations

A split-view web application for chatting with Claude 4 Sonnet (with web search) and capturing key insights into structured documents. Built with Next.js, TypeScript, and the latest Claude AI.

## Features

- **Split-View Interface**: Chat with Claude 4 Sonnet on the left, build documents on the right
- **Claude 4 Sonnet + Web Search**: Real-time, up-to-date information with built-in web search capabilities
- **Advanced Shift+Click Highlighting**: 
  - Hold Shift to enter highlight mode (cursor changes to highlighter icon)
  - Click or drag across sentences to highlight them
  - Sentences turn bright yellow when highlighted
  - After publishing, highlights become subtle gray to show "captured" state
- **Smart Sentence Detection**: Properly handles abbreviations, numbered lists, and code snippets
- **Dual Document Modes**: 
  - Bullets view: Clean bullet-point list
  - Narrative view: AI-generated conversational text
- **Auto-Narrative Generation**: Narrative view updates automatically as you add sentences (500ms debounced)
- **Expandable Chat Input**: Text input grows vertically when typing multiple sentences
- **Publish & Reset**: Publish documents and start fresh with page refresh
- **Resizable Panels**: Adjust the split between chat and document views (20-80% range)
- **Real-time Streaming**: See Claude's responses as they're generated

## Quick Start

1. **Clone and Install**
   ```bash
   cd pair
   npm install
   ```

2. **Set up Claude 4 API**
   - Get your API key from [console.anthropic.com](https://console.anthropic.com/)
   - Copy the example environment file:
     ```bash
     cp env.example .env.local
     ```
   - Edit `.env.local` and add your API key:
     ```
     ANTHROPIC_API_KEY=your_actual_api_key_here
     ```

3. **Run the App**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## How to Use

1. **Start Chatting**: Type your message and press Enter to chat with Claude 4 Sonnet
2. **Get Real-time Info**: Claude will automatically search the web when needed for current information
3. **Highlight Sentences**: 
   - Hold `Shift` to enter highlight mode (highlighter cursor appears)
   - Click individual sentences or drag across multiple sentences
   - Sentences turn bright yellow when captured
   - They appear as bullet points in the document panel
4. **Switch Views**: Toggle between Bullets and Narrative modes
5. **Auto-Narrative**: The narrative view updates automatically as you capture sentences
6. **Regenerate**: Click the refresh icon to regenerate the narrative
7. **Publish**: Click "Publish Document" when you're done
8. **Published State**: After publishing, highlights become subtle gray
9. **Start Fresh**: Refresh the page to begin a new document

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript
- **Styling**: Tailwind CSS
- **AI Integration**: Claude 4 Sonnet via Anthropic API (with web search)
- **Icons**: Lucide React
- **State Management**: React Context + useReducer

## Project Structure

```
app/
├── api/
│   ├── chat/route.ts          # Streaming chat with Claude 4 + web search
│   └── narrative/route.ts     # Narrative generation
├── components/
│   ├── ChatPanel.tsx          # Left panel - chat interface
│   ├── DocPanel.tsx           # Right panel - document editor
│   ├── HighlightableMessage.tsx # Advanced sentence highlighting
│   └── SplitView.tsx          # Resizable split layout
├── context/
│   └── AppContext.tsx         # Global state management
├── utils/
│   └── sentenceUtils.ts       # Enhanced sentence detection
├── types.ts                   # TypeScript interfaces
├── layout.tsx                 # Root layout
└── page.tsx                   # Main application
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Key Improvements

### **Claude 4 Sonnet with Web Search**
- Uses the latest `claude-sonnet-4-20250514` model
- Built-in web search via `web_search_20250305` tool
- Real-time, current information instead of stale responses
- March 2025 knowledge cutoff

### **Professional Highlighting System**
- Proper shift+click and drag functionality
- Custom highlighter cursor icon
- Sentence-by-sentence granular selection
- Prevents text selection conflicts
- Smooth visual transitions
- Published state with subtle gray highlights

### **Enhanced Chat Experience**
- Black text input (no more gray text issues)
- Vertically expanding textarea for multi-sentence messages
- Auto-sizing with max height of 200px
- Proper keyboard shortcuts (Enter to send, Shift+Enter for newline)

## Notes

- All state is client-side - refreshing resets the app
- Designed for desktop use (mobile support can be added later)
- Sentence detection handles most edge cases but may need domain-specific refinement
- Web search is automatically triggered by Claude when needed

## Future Enhancements

- Persistence with database integration
- Document export (PDF, Markdown)
- Mobile responsive design
- Multiple document management
- Collaborative editing
- Undo/redo for highlighting
- Custom highlight colors
- Search within captured sentences
