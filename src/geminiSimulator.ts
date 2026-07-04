import { Expense } from './types';

// Helper to generate UUIDs
const uuid = () => Math.random().toString(36).substring(2, 9);

export const DEFAULT_EXPENSES: Expense[] = [
  {
    id: '1',
    name: 'OpenAI Enterprise',
    status: 'active',
    cost: 1420,
    utilization: 42,
    recommendationKey: 'rec_openai',
    recommendationParam: '$360',
    isOptimized: false,
  },
  {
    id: '2',
    name: 'Claude.ai Team',
    status: 'active',
    cost: 480,
    utilization: 68,
    recommendationKey: 'rec_claude',
    recommendationParam: '$120',
    isOptimized: false,
  },
  {
    id: '3',
    name: 'Midjourney Pro',
    status: 'inactive',
    cost: 60,
    utilization: 8,
    recommendationKey: 'rec_midjourney',
    recommendationParam: '$60',
    isOptimized: false,
  },
  {
    id: '4',
    name: 'Pinecone Standard',
    status: 'active',
    cost: 350,
    utilization: 24,
    recommendationKey: 'rec_pinecone',
    recommendationParam: '$150',
    isOptimized: false,
  },
  {
    id: '5',
    name: 'Runway Gen-3 Max',
    status: 'active',
    cost: 125,
    utilization: 52,
    recommendationKey: 'rec_runway',
    recommendationParam: '$45',
    isOptimized: false,
  }
];

export async function simulateGeminiParsing(rawText: string): Promise<Expense[]> {
  // Simulate delay for AI Studio call
  await new Promise((resolve) => setTimeout(resolve, 1800));

  if (!rawText || rawText.trim().length === 0) {
    return DEFAULT_EXPENSES;
  }

  const normalized = rawText.toLowerCase();
  const parsedExpenses: Expense[] = [];

  // Keywords to hunt for
  const toolsToScan = [
    { key: 'openai', label: 'OpenAI API', defaultCost: 850, recKey: 'rec_openai', param: '$250', utilization: 48 },
    { key: 'chatgpt', label: 'ChatGPT Plus', defaultCost: 40, recKey: 'rec_openai', param: '$20', utilization: 50 },
    { key: 'claude', label: 'Claude.ai Team', defaultCost: 360, recKey: 'rec_claude', param: '$120', utilization: 65 },
    { key: 'midjourney', label: 'Midjourney Pro', defaultCost: 60, recKey: 'rec_midjourney', param: '$60', utilization: 5 },
    { key: 'pinecone', label: 'Pinecone Database', defaultCost: 280, recKey: 'rec_pinecone', param: '$140', utilization: 18 },
    { key: 'runway', label: 'Runway Video Gen', defaultCost: 95, recKey: 'rec_runway', param: '$35', utilization: 40 }
  ];

  // Try parsing costs using Regex near the keywords
  toolsToScan.forEach((tool) => {
    if (normalized.includes(tool.key)) {
      let cost = tool.defaultCost;
      
      // Look for a number near the keyword
      // e.g., "openai: $500" or "openai 500" or "openai budget is 500"
      const regex = new RegExp(`${tool.key}[^\\d]{0,25}\\$?\\s*(\\d+)`, 'i');
      const match = rawText.match(regex);
      if (match && match[1]) {
        const foundVal = parseInt(match[1], 10);
        if (foundVal > 0 && foundVal < 100000) {
          cost = foundVal;
        }
      }

      // Determine status and utilization dynamically if possible
      const isLowUtilization = tool.utilization < 30 || normalized.includes('unused') || normalized.includes('idle') || normalized.includes('not used');
      const utilization = isLowUtilization ? Math.floor(Math.random() * 15) + 5 : Math.floor(Math.random() * 45) + 40;
      const status = isLowUtilization ? 'inactive' : 'active';
      const savingParam = `$${Math.floor(cost * (isLowUtilization ? 1.0 : 0.35))}`;

      parsedExpenses.push({
        id: uuid(),
        name: tool.label,
        status: status as 'active' | 'inactive',
        cost: cost,
        utilization: utilization,
        recommendationKey: tool.recKey,
        recommendationParam: savingParam,
        isOptimized: false,
      });
    }
  });

  // If no matching tools found, scan for any line with a cash value and treat it as a generic SaaS
  if (parsedExpenses.length === 0) {
    const lines = rawText.split('\n');
    lines.forEach((line) => {
      const dollarMatch = line.match(/\$?(\d+)/);
      if (dollarMatch && dollarMatch[1]) {
        const cost = parseInt(dollarMatch[1], 10);
        if (cost > 5 && cost < 50000) {
          // Try to get a clean name from the line
          let name = line.replace(/\$?(\d+)/, '').replace(/[:\-_]/g, '').trim();
          if (name.length < 3 || name.length > 30) {
            name = 'Custom SaaS License';
          }
          
          parsedExpenses.push({
            id: uuid(),
            name: name,
            status: cost < 100 ? 'inactive' : 'active',
            cost: cost,
            utilization: cost < 100 ? 12 : 58,
            recommendationKey: cost < 100 ? 'rec_midjourney' : 'rec_openai',
            recommendationParam: `$${Math.floor(cost * 0.4)}`,
            isOptimized: false,
          });
        }
      }
    });
  }

  // Fallback to defaults if parsing produced absolutely nothing
  return parsedExpenses.length > 0 ? parsedExpenses : DEFAULT_EXPENSES;
}
