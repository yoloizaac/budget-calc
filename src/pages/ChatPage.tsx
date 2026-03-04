import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { MessageCircle, Send, Loader2, Bot, User, ChevronDown, Sparkles, TrendingUp, Target, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';

type Msg = { role: 'user' | 'assistant'; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/budget-chat`;

async function streamChat({
  messages,
  token,
  onDelta,
  onDone,
}: {
  messages: Msg[];
  token: string;
  onDelta: (text: string) => void;
  onDone: () => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ messages }),
  });

  if (!resp.ok || !resp.body) {
    const errData = await resp.json().catch(() => ({}));
    throw new Error(errData.error || `Request failed (${resp.status})`);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let streamDone = false;

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buffer.indexOf('\n')) !== -1) {
      let line = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);
      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (line.startsWith(':') || line.trim() === '') continue;
      if (!line.startsWith('data: ')) continue;
      const json = line.slice(6).trim();
      if (json === '[DONE]') { streamDone = true; break; }
      try {
        const parsed = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch {
        buffer = line + '\n' + buffer;
        break;
      }
    }
  }
  onDone();
}

const SUGGESTION_CATEGORIES = [
  {
    label: 'Spending',
    icon: BarChart3,
    items: [
      "Break down my spending by category",
      "What did I spend the most on this week?",
      "How much have I spent this month?",
    ],
  },
  {
    label: 'Budget',
    icon: Target,
    items: [
      "Am I over or under my daily budget?",
      "How much can I spend per day for the rest of the month?",
      "Which daily category am I overspending on?",
    ],
  },
  {
    label: 'Forecast',
    icon: TrendingUp,
    items: [
      "Will my funding last until the end of my internship?",
      "What's my projected total spend?",
      "Am I on track with my spending?",
    ],
  },
  {
    label: 'Compare',
    icon: Sparkles,
    items: [
      "Compare my food spending vs transport",
      "How does this week compare to last week?",
      "What's my biggest expense category?",
    ],
  },
];

const PROMPT_TEMPLATES = [
  { label: "Summarize spending", template: "Summarize my spending for " },
  { label: "Category total", template: "How much have I spent on " },
  { label: "Compare categories", template: "Compare my spending on " },
  { label: "Daily breakdown", template: "Show my daily spending breakdown for " },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Msg = { role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setIsLoading(false); return; }

    let assistantSoFar = '';
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
        }
        return [...prev, { role: 'assistant', content: assistantSoFar }];
      });
    };

    try {
      await streamChat({
        messages: [...messages, userMsg],
        token: session.access_token,
        onDelta: upsert,
        onDone: () => setIsLoading(false),
      });
    } catch (e: any) {
      upsert(`\n\n⚠️ Error: ${e.message}`);
      setIsLoading(false);
    }
  };

  const insertTemplate = (template: string) => {
    setInput(template);
    setShowTemplates(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] md:h-[calc(100vh-5rem)] overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-9 w-9 rounded-xl gradient-primary flex items-center justify-center">
          <Bot className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-bold">Budget Chat</h1>
          <p className="text-xs text-muted-foreground">Ask me anything about your spending</p>
        </div>
      </div>

      <ScrollArea className="flex-1 pr-2">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center gap-6 py-8">
            <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center">
              <MessageCircle className="h-8 w-8 text-primary-foreground" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold">Hi! I'm your budget assistant 💰</h2>
              <p className="text-sm text-muted-foreground mt-1">I know your budget targets & spending data. Try a prompt below!</p>
            </div>

            <div className="w-full max-w-lg space-y-4">
              {SUGGESTION_CATEGORIES.map(cat => (
                <div key={cat.label}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <cat.icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{cat.label}</span>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {cat.items.map(s => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="text-left text-sm px-3 py-2.5 rounded-xl border border-border/50 bg-card hover:bg-accent/50 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4 pb-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}>
                {m.role === 'assistant' && (
                  <div className="h-7 w-7 rounded-lg gradient-primary flex-shrink-0 flex items-center justify-center mt-1">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
                <div className={`max-w-[75%] min-w-0 rounded-2xl px-4 py-3 text-sm overflow-hidden ${
                  m.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-card border border-border/50 rounded-bl-md'
                }`}>
                  {m.role === 'assistant' ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1 [&_pre]:overflow-x-auto [&_pre]:max-w-full [&_code]:break-all [&_table]:overflow-x-auto [&_table]:block">
                      <ReactMarkdown
                        skipHtml={true}
                        components={{
                          a: ({ node, ...props }) => (
                            <a {...props} rel="noopener noreferrer" target="_blank" />
                          ),
                        }}
                      >{m.content}</ReactMarkdown>
                    </div>
                  ) : m.content}
                </div>
                {m.role === 'user' && (
                  <div className="h-7 w-7 rounded-lg bg-secondary/20 flex-shrink-0 flex items-center justify-center mt-1">
                    <User className="h-4 w-4 text-secondary" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex gap-3">
                <div className="h-7 w-7 rounded-lg gradient-primary flex-shrink-0 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="bg-card border border-border/50 rounded-2xl rounded-bl-md px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        )}
      </ScrollArea>

      {/* Prompt templates bar */}
      <div className="relative">
        {showTemplates && (
          <div className="absolute bottom-full left-0 right-0 mb-1 bg-card border border-border/50 rounded-xl p-2 shadow-lg z-10">
            <div className="grid grid-cols-2 gap-1">
              {PROMPT_TEMPLATES.map(t => (
                <button
                  key={t.label}
                  onClick={() => insertTemplate(t.template)}
                  className="text-left text-xs px-3 py-2 rounded-lg hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={e => { e.preventDefault(); send(input); }}
        className="flex gap-2 pt-3 border-t border-border/50"
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => setShowTemplates(!showTemplates)}
          title="Prompt templates"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${showTemplates ? 'rotate-180' : ''}`} />
        </Button>
        <Input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about your budget..."
          disabled={isLoading}
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}
