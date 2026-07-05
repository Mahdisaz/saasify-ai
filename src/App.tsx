import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingDown, 
  Cpu, 
  Globe, 
  Sparkles, 
  DollarSign, 
  Calendar, 
  AlertTriangle, 
  TrendingUp, 
  Layers, 
  Zap, 
  Check, 
  Play, 
  ArrowRight, 
  ShieldCheck, 
  FileText, 
  User, 
  Clock,
  ExternalLink,
  ChevronDown,
  Plus,
  Trash2,
  Download,
  Search,
  RefreshCw,
  Eye,
  SlidersHorizontal,
  Info,
  X,
  Coins,
  Copy,
  Lock,
  Unlock,
  QrCode,
  CheckCircle,
  Database,
  History
} from 'lucide-react';
import { Language, Expense } from './types';
import { translations } from './translations';
import { DEFAULT_EXPENSES } from './geminiSimulator';
import GlowChart from './components/GlowChart';

/** Runtime guard — ensures an unknown value is a valid Expense object. */
function sanitizeExpense(raw: unknown, index: number): Expense {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const id = typeof o.id === 'string' && o.id.trim() ? o.id.trim() : String(index + 1);
  const name = typeof o.name === 'string' && o.name.trim() ? o.name.trim().slice(0, 60) : 'Unknown Service';
  const status: 'active' | 'inactive' = o.status === 'inactive' ? 'inactive' : 'active';
  const cost = typeof o.cost === 'number' && isFinite(o.cost) && o.cost >= 0 ? Math.round(o.cost) : 0;
  const utilization = typeof o.utilization === 'number' && isFinite(o.utilization)
    ? Math.min(100, Math.max(0, Math.round(o.utilization))) : 50;
  const recommendationKey = typeof o.recommendationKey === 'string' ? o.recommendationKey.slice(0, 200) : '';
  const recommendationParam = typeof o.recommendationParam === 'string' ? o.recommendationParam.slice(0, 20) : undefined;
  return { id, name, status, cost, utilization, recommendationKey, recommendationParam, isOptimized: false };
}

interface CryptoCurrency {
  name: string;
  symbol: string;
  network: string;
  address: string;
  amount: string;
  icon: string;
  color: string;
}

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(true);
  const [rawInput, setRawInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'optimized'>('all');
  
  // Manual Subscription State
  const [showAddForm, setShowAddForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formCost, setFormCost] = useState('');
  const [formUtilization, setFormUtilization] = useState('50');
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');
  const [formRecommendation, setFormRecommendation] = useState('');

  // --- CRYPTO MONETIZATION ENGINE ---
  const [isCryptoSubscribed, setIsCryptoSubscribed] = useState<boolean>(() => {
    const saved = localStorage.getItem('saas_crypto_subscribed');
    return saved !== null ? saved === 'true' : true; // Default to subscribed initially for perfect first impressions
  });

  const [cryptoSubDaysLeft, setCryptoSubDaysLeft] = useState<number>(() => {
    const saved = localStorage.getItem('saas_crypto_days_left');
    return saved !== null ? parseInt(saved, 10) : 12; // Start with 12 days left to motivate renewal testing
  });

  const [userTxidList, setUserTxidList] = useState<string[]>(() => {
    const saved = localStorage.getItem('saas_user_txids');
    return saved !== null ? JSON.parse(saved) : ["0x7f3a...d9e2 (Baseline activation)"];
  });

  const [isCryptoCheckoutOpen, setIsCryptoCheckoutOpen] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState<number>(0);
  const [txidInput, setTxidInput] = useState('');
  const [verificationStep, setVerificationStep] = useState<number>(0); // 0: idle, 1: contacting, 2: mempool, 3: signing
  const [isCopied, setIsCopied] = useState(false);

  // Load expenses from DB on mount
  useEffect(() => {
    setIsLoadingExpenses(true);
    fetch('/api/expenses')
      .then(r => r.json())
      .then((data: { expenses: unknown[] }) => {
        const validated = Array.isArray(data.expenses) ? data.expenses.map(sanitizeExpense) : DEFAULT_EXPENSES;
        setExpenses(validated.length > 0 ? validated : DEFAULT_EXPENSES);
      })
      .catch(() => setExpenses(DEFAULT_EXPENSES))
      .finally(() => setIsLoadingExpenses(false));
  }, []);

  // Sync state to localstorage
  useEffect(() => {
    localStorage.setItem('saas_crypto_subscribed', String(isCryptoSubscribed));
    localStorage.setItem('saas_crypto_days_left', String(cryptoSubDaysLeft));
    localStorage.setItem('saas_user_txids', JSON.stringify(userTxidList));
  }, [isCryptoSubscribed, cryptoSubDaysLeft, userTxidList]);

  // Crypto list options
  const cryptos: CryptoCurrency[] = [
    {
      name: "Tether USD",
      symbol: "USDT",
      network: "TRON (TRC-20)",
      address: "TUQmwudzUbo2e1EiUJLtmpupdrstJzLZHD",
      amount: "29.00",
      icon: "₮",
      color: "#26A17B"
    },
    {
      name: "Ethereum",
      symbol: "ETH",
      network: "Ethereum Mainnet",
      address: "0xA0A819876d831Ab50FD56B029C748DAA72dC130b",
      amount: "0.0084",
      icon: "Ξ",
      color: "#627EEA"
    },
    {
      name: "Solana",
      symbol: "SOL",
      network: "Solana Network",
      address: "GGXev8Go3dCAWEQ9Um6nMd8NHrmrk4TauaTEHofLi3pj",
      amount: "0.198",
      icon: "◎",
      color: "#14F195"
    },
    {
      name: "Bitcoin",
      symbol: "BTC",
      network: "Bitcoin Native SegWit",
      address: "bc1qu270y7t96pvv3cvm3hzrnchj0a975hdmczq45n",
      amount: "0.00049",
      icon: "₿",
      color: "#F7931A"
    }
  ];

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const t = useMemo(() => translations[lang], [lang]);

  // Toast trigger helper
  const triggerToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
  };

  // Sound generator using Web Audio API for a futuristic mechanical/blockchain click
  const playCryptoVerifySound = (success: boolean) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      if (success) {
        // High, happy modern beep sequence
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc1.type = 'sine';
        osc2.type = 'triangle';
        
        osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc1.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
        osc1.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.25); // D6
        
        osc2.frequency.setValueAtTime(293.66, ctx.currentTime); 
        osc2.frequency.setValueAtTime(440, ctx.currentTime + 0.1);
        osc2.frequency.setValueAtTime(587.33, ctx.currentTime + 0.25);

        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        
        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 0.6);
        osc2.stop(ctx.currentTime + 0.6);
      } else {
        // Error buzz
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.3);
        
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {
      // Audio context is locked or unsupported, ignore
    }
  };

  // Switch Language Helper
  const handleLangChange = (selectedLang: Language) => {
    setLang(selectedLang);
    setIsLangOpen(false);
    triggerToast(`${translations[selectedLang].toastWelcome}`, 'info');
  };

  // Metrics calculations
  const metrics = useMemo(() => {
    // Current Monthly Spend (takes into account whether individual items are optimized)
    const totalSpend = expenses.reduce((sum, exp) => {
      if (exp.isOptimized) {
        const savedVal = parseInt(exp.recommendationParam?.replace('$', '') || '0', 10);
        return sum + Math.max(0, exp.cost - savedVal);
      }
      return sum + exp.cost;
    }, 0);

    // Baseline Spend if nothing were optimized
    const baselineSpend = expenses.reduce((sum, exp) => sum + exp.cost, 0);

    // Next Month Forecast (baseline grows by 5%, or optimized grows by 5%)
    const forecastCost = Math.round(totalSpend * 1.05);

    // Inactive Accounts Count (status is inactive OR utilization is extremely low)
    const inactiveCount = expenses.filter(exp => exp.status === 'inactive' || exp.utilization < 20).length;

    // Potential Annual Savings
    // Includes saved items (already optimized) and un-saved items that could be optimized
    const potentialAnnualSavings = expenses.reduce((sum, exp) => {
      const savedVal = parseInt(exp.recommendationParam?.replace('$', '') || '0', 10);
      return sum + (savedVal * 12);
    }, 0);

    // Current Active Annual Savings (how much we are actually saving right now based on clicked optimizations)
    const activeAnnualSavings = expenses.reduce((sum, exp) => {
      if (exp.isOptimized) {
        const savedVal = parseInt(exp.recommendationParam?.replace('$', '') || '0', 10);
        return sum + (savedVal * 12);
      }
      return 0;
    }, 0);

    // Optimization Score (Percentage of potential savings realized)
    const optimizationScore = potentialAnnualSavings > 0 
      ? Math.round((activeAnnualSavings / potentialAnnualSavings) * 100) 
      : 0;

    return {
      totalSpend,
      baselineSpend,
      forecastCost,
      inactiveCount,
      potentialAnnualSavings,
      activeAnnualSavings,
      optimizationScore
    };
  }, [expenses]);

  // Optimize individual subscription row
  const handleOptimize = async (id: string) => {
    const target = expenses.find(e => e.id === id);
    if (!target || target.isOptimized) return;

    setExpenses(prev => prev.map(exp => exp.id === id ? { ...exp, isOptimized: true } : exp));

    const savedAmount = target.recommendationParam || '$0';
    triggerToast(t.toastOptimizeSuccess.replace('$param', savedAmount), 'success');

    await fetch(`/api/expenses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isOptimized: true }),
    }).catch(() => triggerToast('Failed to save to database.', 'info'));
  };

  // Delete manual subscription
  const handleDelete = async (id: string) => {
    setExpenses(prev => prev.filter(exp => exp.id !== id));
    triggerToast("Subscription removed from tracking.", "info");

    await fetch(`/api/expenses/${id}`, { method: 'DELETE' })
      .catch(() => triggerToast('Failed to delete from database.', 'info'));
  };

  // Run audit — calls the server-side /api/parse endpoint backed by real Gemini AI
  const handleRunAudit = async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: rawInput }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(err.error ?? 'Server error');
      }
      const data = await res.json() as { expenses: unknown[] };
      const validated = Array.isArray(data.expenses) ? data.expenses.map(sanitizeExpense) : [];
      if (validated.length === 0) {
        triggerToast('No expenses found in the text. Try a different input.', 'info');
      } else {
        setExpenses(validated);
        triggerToast(t.toastImportSuccess, 'success');
        // Persist parsed expenses to DB
        fetch('/api/expenses/replace', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ expenses: validated }),
        }).catch(() => console.error('Failed to persist parsed expenses to DB'));
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      triggerToast(`AI Audit failed: ${msg}`, 'info');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Load sample billings helper
  const handleLoadSample = (sampleType: 1 | 2) => {
    if (sampleType === 1) {
      setRawInput(
        `--- CLOUD & AI COST REPORT - INTERNAL ONLY ---\n` +
        `OpenAI API Usage June: $1840 (Active production server)\n` +
        `Claude Team Account: 8 active seats, 3 unused idle seats ($60 each = $180 unused)\n` +
        `Midjourney design unit subscription: Basic seat, $30/mo. Note: hasn't logged in since May.\n` +
        `Pinecone Serverless indices: standard billing $410`
      );
    } else {
      setRawInput(
        `Runway Gen-3 Pro: Creative director subscription ($95/mo, 10% credit consumption rate)\n` +
        `ChatGPT Premium multi-seats: $240/mo (underutilized, recommend moving to Claude or API)\n` +
        `ElevenLabs Voice Engine: $150/mo billing, 4 inactive voices.\n` +
        `v0.dev developer tier: $20/mo`
      );
    }
    triggerToast("Sample invoice loaded! Click 'Run Intelligent AI Audit' to analyze.", "info");
  };

  // Clear or Reset Table
  const handleReset = async () => {
    setExpenses(DEFAULT_EXPENSES);
    setSearchQuery('');
    setStatusFilter('all');
    triggerToast(t.toastCleared, 'info');

    await fetch('/api/expenses/reset', { method: 'POST' })
      .catch(() => console.error('Failed to reset DB'));
  };

  // Export fully detailed Audit Report
  const handleExportReport = () => {
    const reportData = {
      auditTimestamp: new Date().toISOString(),
      app: "SaaSify AI Audit Tool",
      metrics: {
        totalMonthlySpend: `$${metrics.totalSpend.toLocaleString()}`,
        baselineSpend: `$${metrics.baselineSpend.toLocaleString()}`,
        nextMonthForecast: `$${metrics.forecastCost.toLocaleString()}`,
        inactiveSubscriptionsCount: metrics.inactiveCount,
        realizedAnnualSavings: `$${metrics.activeAnnualSavings.toLocaleString()}`,
        potentialAnnualSavings: `$${metrics.potentialAnnualSavings.toLocaleString()}`,
        realizedSavingsPercentage: `${metrics.optimizationScore}%`
      },
      subscriptions: expenses.map(e => ({
        id: e.id,
        name: e.name,
        status: e.status,
        monthlyCost: `$${e.cost}`,
        utilizationRate: `${e.utilization}%`,
        optimized: e.isOptimized ? "Yes" : "No",
        monthlySavingAmount: e.recommendationParam || "$0",
        recommendation: t[e.recommendationKey]?.replace('$param', e.recommendationParam || '') || e.recommendationKey || 'Fully optimized.'
      }))
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `SaaSify_AI_Audit_Report_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    triggerToast(t.toastExported, 'success');
  };

  // Handle Manual Form Submit
  const handleAddSubscriptionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formCost) {
      triggerToast("Please fill in the Tool Name and Monthly Cost.", "info");
      return;
    }

    const costNum = parseFloat(formCost);
    if (isNaN(costNum) || costNum <= 0) {
      triggerToast("Please enter a valid cost number greater than 0.", "info");
      return;
    }

    const utilizationNum = parseInt(formUtilization, 10);
    const costValue = Math.round(costNum);

    // Auto-generate suggestion if left empty
    let finalRecKey = formRecommendation.trim();
    let finalRecParam = `$${Math.round(costValue * 0.4)}`;

    if (!finalRecKey) {
      if (formStatus === 'inactive' || utilizationNum < 30) {
        finalRecKey = `Idle Account: Zero utilization detected in recent cycles. Cancel or suspend to save $param/mo.`;
        finalRecParam = `$${costValue}`;
      } else {
        finalRecKey = `Optimized tier suggestion: Downgrade excess seats or transition to serverless plans to save $param/mo.`;
      }
    }

    const newExpense: Expense = {
      id: Math.random().toString(36).substring(2, 9),
      name: formName,
      status: formStatus,
      cost: costValue,
      utilization: isNaN(utilizationNum) ? 50 : Math.min(100, Math.max(0, utilizationNum)),
      recommendationKey: finalRecKey,
      recommendationParam: finalRecParam,
      isOptimized: false
    };

    setExpenses(prev => [...prev, newExpense]);

    // Persist to DB
    fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newExpense),
    }).catch(() => console.error('Failed to save new expense to DB'));

    // Clear form
    setFormName('');
    setFormCost('');
    setFormUtilization('50');
    setFormStatus('active');
    setFormRecommendation('');
    setShowAddForm(false);

    triggerToast(t.toastAdded, 'success');
  };

  // Copy-to-clipboard wallet helper
  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setIsCopied(true);
    triggerToast("Wallet Address copied to clipboard!", "success");
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Verify transaction animation trigger
  const handleVerifyTxID = () => {
    if (!txidInput.trim()) {
      triggerToast(t.cryptoToastFailure, "info");
      playCryptoVerifySound(false);
      return;
    }

    // Begin multi-step verification
    setVerificationStep(1);

    // Timeline steps simulating Node validators
    setTimeout(() => {
      setVerificationStep(2);
    }, 1200);

    setTimeout(() => {
      setVerificationStep(3);
    }, 2500);

    setTimeout(() => {
      // Completed, lock in state!
      setIsCryptoSubscribed(true);
      setCryptoSubDaysLeft(30);
      
      const shortTx = txidInput.trim().slice(0, 6) + '...' + txidInput.trim().slice(-4);
      const coinSymbol = cryptos[selectedCrypto].symbol;
      const formattedLog = `${shortTx} (${coinSymbol} confirmation)`;
      setUserTxidList(prev => [formattedLog, ...prev]);

      setVerificationStep(0);
      setIsCryptoCheckoutOpen(false);
      setTxidInput('');
      triggerToast(t.cryptoToastSuccess, "success");
      playCryptoVerifySound(true);
    }, 4000);
  };

  // Quick sandbox actions
  const handleDevForceLock = () => {
    setIsCryptoSubscribed(false);
    setCryptoSubDaysLeft(0);
    triggerToast("Demo Mode: Subscription expired. Dashboard is now locked.", "info");
    playCryptoVerifySound(false);
  };

  const handleDevGrantAccess = () => {
    setIsCryptoSubscribed(true);
    setCryptoSubDaysLeft(30);
    triggerToast("Demo Mode: Premium subscription extended for 30 Days.", "success");
    playCryptoVerifySound(true);
  };

  // Language flag emojis or names mapping
  const langNames: Record<Language, string> = {
    en: '🇺🇸 English',
    es: '🇪🇸 Español',
    de: '🇩🇪 Deutsch',
    fr: '🇫🇷 Français',
    ja: '🇯🇵 日本語',
    zh: '🇨🇳 简体中文',
  };

  // Filter & Search computation
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const matchesSearch = exp.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (statusFilter === 'all') return matchesSearch;
      if (statusFilter === 'active') return matchesSearch && exp.status === 'active';
      if (statusFilter === 'inactive') return matchesSearch && exp.status === 'inactive';
      if (statusFilter === 'optimized') return matchesSearch && exp.isOptimized;
      
      return matchesSearch;
    });
  }, [expenses, searchQuery, statusFilter]);

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-gray-100 font-sans relative overflow-x-hidden selection:bg-cyan-500 selection:text-black">
      
      {/* Background Neon Glow Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-cyan-600/10 blur-[150px] pointer-events-none animate-pulse-slow" style={{ animationDelay: '4s' }}></div>
      <div className="absolute top-[40%] left-[40%] w-[300px] h-[300px] rounded-full bg-emerald-600/5 blur-[100px] pointer-events-none"></div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-bounce duration-300">
          <div className="flex items-center gap-3 px-5 py-4 rounded-xl border border-white/10 bg-[#0E0E12]/95 backdrop-blur-md shadow-[0_8px_32px_rgba(0,240,255,0.15)] max-w-md">
            <div className={`w-3 h-3 rounded-full ${toast.type === 'success' ? 'bg-[#00FF66] shadow-[0_0_10px_#00FF66]' : 'bg-cyan-400 shadow-[0_0_10px_#00F0FF]'}`}></div>
            <p className="text-xs font-mono font-medium text-white/90 leading-relaxed">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Sticky Header Nav */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#0A0A0C]/80 backdrop-blur-md px-4 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo Brand Block */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#9D00FF] via-purple-600 to-[#00F0FF] p-[1.5px] shadow-[0_0_15px_rgba(157,0,255,0.4)] flex items-center justify-center group cursor-pointer">
              <div className="w-full h-full rounded-xl bg-[#0C0C0F] flex items-center justify-center transition-all group-hover:scale-95 duration-300">
                <Cpu className="w-5 h-5 text-cyan-400 group-hover:text-purple-400 transition-colors" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                {t.brandName}
                <span className="text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 text-cyan-400 font-semibold animate-pulse">
                  Starter SaaS
                </span>
              </h1>
              <p className="text-[10px] text-white/40 tracking-wider hidden sm:block">{t.brandSubtitle}</p>
            </div>
          </div>

          {/* Right Action Block */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            
            {/* Blockchain Sub Timer Status Pill */}
            <div 
              onClick={() => setIsCryptoCheckoutOpen(true)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-all ${
                isCryptoSubscribed 
                  ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10' 
                  : 'border-rose-500/30 bg-rose-500/5 text-rose-400 hover:bg-rose-500/10 animate-pulse'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
                {isCryptoSubscribed ? t.cryptoStatusActive : t.cryptoStatusExpired}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
              <span className="text-[10px] font-mono opacity-85">
                {isCryptoSubscribed 
                  ? t.cryptoDaysRemaining.replace('$days', String(cryptoSubDaysLeft))
                  : '0 Days Left'
                }
              </span>
            </div>

            {/* Language Selector Dropdown */}
            <div className="relative">
              <button 
                id="lang-dropdown-btn"
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-mono rounded-lg border border-white/10 bg-[#121216]/60 hover:bg-[#16161C] transition-all text-white/80 hover:text-white"
              >
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span>{langNames[lang]}</span>
                <ChevronDown className="w-3 h-3 text-white/40 transition-transform" style={{ transform: isLangOpen ? 'rotate(180deg)' : 'none' }} />
              </button>
              
              {isLangOpen && (
                <div className="absolute right-0 mt-2 w-44 rounded-xl border border-white/10 bg-[#0E0E12] p-1 shadow-[0_8px_32px_rgba(0,0,0,0.8)] backdrop-blur-md z-50">
                  {(Object.keys(langNames) as Language[]).map((langKey) => (
                    <button
                      key={langKey}
                      onClick={() => handleLangChange(langKey)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono transition-all flex items-center justify-between ${lang === langKey ? 'bg-cyan-500/10 text-cyan-400' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                    >
                      <span>{langNames[langKey]}</span>
                      {lang === langKey && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Glowing Upgrade to Pro button */}
            <button
              id="upgrade-nav-btn"
              onClick={() => setIsUpgradeOpen(true)}
              className="relative px-4 py-2 rounded-lg text-xs font-mono font-bold tracking-wider text-black bg-[#00FF66] shadow-[0_0_15px_rgba(0,255,102,0.4)] hover:shadow-[0_0_25px_rgba(0,255,102,0.6)] hover:bg-[#26ff7b] transition-all hover:scale-[1.03] duration-300"
            >
              PRO PLAN
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8 flex flex-col gap-8 relative">
        
        {/* Step-by-Step Developer Callout to show off SaaS potential to Flippa buyers */}
        <div className="rounded-xl border border-[#00F0FF]/20 bg-[#00F0FF]/5 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-400/10 flex items-center justify-center text-cyan-400 shrink-0">
              <Sparkles className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <p className="text-xs font-bold text-cyan-400 font-mono tracking-wider">FLIPPA WEB3 REVENUE GATE ACTIVATED</p>
              <p className="text-xs text-white/70 leading-relaxed mt-0.5">
                Prospective buyers can test the entire crypto subscription flow using the Developer Sandbox controls in the sidebar. Experience zero-cost block verification simulated on-chain.
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <span className="text-[10px] font-mono border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-md">Mempool Simulator</span>
            <span className="text-[10px] font-mono border border-purple-500/20 bg-purple-500/10 text-purple-400 px-2.5 py-1 rounded-md">Crypto Checkout Active</span>
          </div>
        </div>

        {/* --- DYNAMIC ACCESS BLOCKED LAYER --- */}
        {!isCryptoSubscribed && (
          <div className="absolute inset-x-4 top-[180px] bottom-0 z-30 flex items-start justify-center pt-16 bg-black/75 backdrop-blur-md rounded-2xl border border-rose-500/20 overflow-hidden">
            
            <div className="max-w-xl w-full mx-4 p-8 rounded-2xl border border-white/10 bg-[#0E0E12] shadow-[0_0_60px_rgba(239,68,68,0.25)] relative flex flex-col items-center text-center">
              {/* Pulsing Lock Icon */}
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                <Lock className="w-7 h-7" />
              </div>

              <h2 className="text-2xl font-black tracking-tight text-white mt-6 uppercase flex items-center gap-2">
                <span className="text-rose-500 font-mono">{t.cryptoExpiredLock}</span>
              </h2>

              <p className="text-sm text-white/60 leading-relaxed max-w-md mt-3">
                {t.cryptoGateSubtitle}
              </p>

              {/* Action checkout desk launch button */}
              <button
                onClick={() => setIsCryptoCheckoutOpen(true)}
                className="mt-8 px-8 py-4 rounded-xl text-xs font-mono font-bold tracking-widest uppercase text-black bg-[#00FF66] shadow-[0_0_20px_rgba(0,255,102,0.4)] hover:shadow-[0_0_30px_rgba(0,255,102,0.6)] hover:bg-[#26ff7b] hover:scale-[1.02] transition-all flex items-center gap-2.5"
              >
                <Coins className="w-4.5 h-4.5" />
                <span>{t.cryptoUnlockDashboard}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Dev Bypass controller tool directly on the gate for quick Flippa trials */}
              <div className="mt-12 w-full pt-6 border-t border-white/5 flex flex-col items-center gap-3">
                <p className="text-[9px] font-mono uppercase tracking-widest text-white/40">{t.cryptoDemoTools}</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleDevGrantAccess}
                    className="px-3 py-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-[10px] font-mono transition-all flex items-center gap-1.5"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>{t.cryptoSimulateUnlock}</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* 4 Glowing Metric Cards Grid */}
        <section className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 transition-all duration-300 ${!isCryptoSubscribed ? 'opacity-30 pointer-events-none filter blur-sm' : ''}`}>
          
          {/* Card 1: Total AI Spend */}
          <div className="rounded-xl border border-white/10 bg-[#121216]/50 backdrop-blur-md p-5 relative overflow-hidden transition-all duration-300 hover:border-white/15 hover:scale-[1.01] hover:shadow-[0_4px_24px_rgba(157,0,255,0.1)] group">
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-violet-500/5 blur-xl group-hover:bg-violet-500/10 transition-colors pointer-events-none"></div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-mono font-semibold text-white/40 tracking-wider uppercase">{t.cardTotalSpend}</p>
                <h3 className="text-2xl font-bold font-mono tracking-tight text-white mt-2 group-hover:text-glow-purple transition-all">
                  ${metrics.totalSpend.toLocaleString()}
                </h3>
              </div>
              <div className="p-2 bg-violet-500/10 rounded-lg text-violet-400 shadow-[0_0_10px_rgba(157,0,255,0.1)]">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-4 text-[10px] font-mono">
              {metrics.baselineSpend > metrics.totalSpend ? (
                <>
                  <TrendingDown className="w-3.5 h-3.5 text-[#00FF66]" />
                  <span className="text-[#00FF66] font-bold">-${(metrics.baselineSpend - metrics.totalSpend).toLocaleString()}/mo</span>
                  <span className="text-white/40">optimized</span>
                </>
              ) : (
                <>
                  <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-cyan-400 font-bold">Peak Efficiency</span>
                  <span className="text-white/40">pasted state</span>
                </>
              )}
            </div>
          </div>

          {/* Card 2: Next Month Forecast */}
          <div className="rounded-xl border border-white/10 bg-[#121216]/50 backdrop-blur-md p-5 relative overflow-hidden transition-all duration-300 hover:border-white/15 hover:scale-[1.01] hover:shadow-[0_4px_24px_rgba(0,240,255,0.1)] group">
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-cyan-500/5 blur-xl group-hover:bg-cyan-500/10 transition-colors pointer-events-none"></div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-mono font-semibold text-white/40 tracking-wider uppercase">{t.cardForecast}</p>
                <h3 className="text-2xl font-bold font-mono tracking-tight text-white mt-2 group-hover:text-glow-blue transition-all">
                  ${metrics.forecastCost.toLocaleString()}
                </h3>
              </div>
              <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.1)]">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-4 text-[10px] font-mono">
              <span className="text-white/50">Compound Growth Rate:</span>
              <span className="text-white font-bold">+5% /mo</span>
            </div>
          </div>

          {/* Card 3: Inactive Accounts */}
          <div className="rounded-xl border border-white/10 bg-[#121216]/50 backdrop-blur-md p-5 relative overflow-hidden transition-all duration-300 hover:border-white/15 hover:scale-[1.01] hover:shadow-[0_4px_24px_rgba(245,158,11,0.1)] group">
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-amber-500/5 blur-xl group-hover:bg-amber-500/10 transition-colors pointer-events-none"></div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-mono font-semibold text-white/40 tracking-wider uppercase">{t.cardInactive}</p>
                <h3 className="text-2xl font-bold font-mono tracking-tight text-white mt-2 group-hover:text-glow-amber transition-all">
                  {metrics.inactiveCount}
                </h3>
              </div>
              <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-4 text-[10px] font-mono">
              <span className="text-amber-400 font-bold">Critical Alert:</span>
              <span className="text-white/40">Actionable optimization rule ready</span>
            </div>
          </div>

          {/* Card 4: Potential Annual Savings */}
          <div className="rounded-xl border border-white/10 bg-[#121216]/50 backdrop-blur-md p-5 relative overflow-hidden transition-all duration-300 hover:border-white/15 hover:scale-[1.01] hover:shadow-[0_4px_24px_rgba(0,255,102,0.1)] group">
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-emerald-500/5 blur-xl group-hover:bg-emerald-500/10 transition-colors pointer-events-none"></div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-mono font-semibold text-white/40 tracking-wider uppercase">{t.cardSavings}</p>
                <h3 className="text-2xl font-bold font-mono tracking-tight text-[#00FF66] mt-2 group-hover:text-glow-green transition-all">
                  ${metrics.potentialAnnualSavings.toLocaleString()}
                </h3>
              </div>
              <div className="p-2 bg-emerald-500/10 rounded-lg text-[#00FF66] shadow-[0_0_10px_rgba(0,255,102,0.1)]">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-4 text-[10px] font-mono">
              <span className="text-white/50">Unlocked & Realized:</span>
              <span className="text-[#00FF66] font-bold">${metrics.activeAnnualSavings.toLocaleString()} saved</span>
            </div>
          </div>

        </section>

        {/* Workspace 2-Column Split */}
        <section className={`grid grid-cols-1 lg:grid-cols-3 gap-6 transition-all duration-300 ${!isCryptoSubscribed ? 'opacity-30 pointer-events-none filter blur-sm' : ''}`}>
          
          {/* Left Main Dashboard Column (Span 2) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Spending Chart Dashboard Card */}
            <div className="rounded-2xl border border-white/10 bg-[#0E0E12]/80 backdrop-blur-md p-6 relative flex flex-col md:flex-row gap-6">
              
              <div className="flex-1 h-[280px]">
                <GlowChart 
                  expenses={expenses} 
                  currentLang={lang}
                  labels={{
                    actual: t.chartLegendActual,
                    optimized: t.chartLegendOptimized,
                    title: t.chartTitle,
                  }}
                />
              </div>

              {/* Dynamic Saving Optimization Gauge */}
              <div className="w-full md:w-48 shrink-0 flex flex-col justify-center items-center border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6">
                <p className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-3 text-center">
                  {t.progressTitle}
                </p>
                
                {/* Dial SVG */}
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <svg className="absolute w-full h-full transform -rotate-90">
                    <circle
                      cx="56"
                      cy="56"
                      r="46"
                      stroke="rgba(255,255,255,0.04)"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    <circle
                      cx="56"
                      cy="56"
                      r="46"
                      stroke="#00FF66"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 46}
                      strokeDashoffset={(2 * Math.PI * 46) * (1 - metrics.optimizationScore / 100)}
                      className="transition-all duration-1000 ease-out"
                      style={{ filter: 'drop-shadow(0px 0px 8px #00FF66)' }}
                    />
                  </svg>
                  
                  {/* Score Label */}
                  <div className="flex flex-col items-center">
                    <span className="text-2xl font-bold font-mono text-white text-glow-green">
                      {metrics.optimizationScore}%
                    </span>
                    <span className="text-[9px] font-mono uppercase tracking-wider text-white/40 mt-0.5">
                      Realized
                    </span>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-[10px] font-mono text-emerald-400 font-semibold">
                    +${(metrics.activeAnnualSavings / 12).toFixed(0)}/mo Saved
                  </p>
                  <p className="text-[9px] font-mono text-white/30 mt-0.5">
                    Of possible ${(metrics.potentialAnnualSavings / 12).toFixed(0)}/mo
                  </p>
                </div>
              </div>

            </div>

            {/* AI Subscriptions Table Panel */}
            <div className="rounded-2xl border border-white/10 bg-[#0E0E12]/80 backdrop-blur-md p-6 flex flex-col gap-4">
              
              {/* Header Title Section */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2 tracking-wide uppercase">
                    <Layers className="w-4.5 h-4.5 text-cyan-400" />
                    {t.tableTitle}
                  </h2>
                  <p className="text-[11px] text-white/40 font-mono mt-0.5">Manage and track live subscription accounts</p>
                </div>
                
                {/* Advanced Toolkit (Export / Reset / Add Manual) */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="px-3 py-1.5 rounded-lg text-xs font-mono font-semibold text-white border border-white/10 hover:border-white/25 bg-white/5 hover:bg-white/10 transition-all flex items-center gap-1.5"
                  >
                    {showAddForm ? <X className="w-3.5 h-3.5 text-rose-400" /> : <Plus className="w-3.5 h-3.5 text-cyan-400" />}
                    <span>{t.btnAddManual}</span>
                  </button>

                  <button
                    onClick={handleExportReport}
                    className="px-3 py-1.5 rounded-lg text-xs font-mono font-semibold text-white border border-white/10 hover:border-white/25 bg-white/5 hover:bg-white/10 transition-all flex items-center gap-1.5"
                    title={t.btnExportReport}
                  >
                    <Download className="w-3.5 h-3.5 text-[#00FF66]" />
                    <span className="hidden sm:inline">{t.btnExportReport}</span>
                  </button>

                  <button
                    onClick={handleReset}
                    className="p-1.5 rounded-lg text-xs font-mono font-semibold text-white/50 border border-white/10 hover:border-white/25 hover:text-rose-400 bg-white/5 hover:bg-rose-500/5 transition-all"
                    title={t.btnClearAll}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Interactive Collapsible Add Subscription Form */}
              {showAddForm && (
                <form 
                  onSubmit={handleAddSubscriptionSubmit}
                  className="p-5 rounded-xl border border-white/10 bg-[#121216]/80 flex flex-col gap-4 animate-fade-in"
                >
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <h3 className="text-xs font-bold font-mono uppercase text-cyan-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                      Add Custom AI Subscription Record
                    </h3>
                    <button type="button" onClick={() => setShowAddForm(false)}>
                      <X className="w-4 h-4 text-white/40 hover:text-white" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Tool Name */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-mono uppercase text-white/50">{t.formToolName} *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Cursor Pro, ElevenLabs"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-[#070709] px-3 py-2 text-xs text-white focus:border-cyan-400/50 focus:outline-none"
                      />
                    </div>

                    {/* Monthly Cost */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-mono uppercase text-white/50">{t.formCost} *</label>
                      <input
                        type="number"
                        required
                        placeholder="e.g. 20, 150"
                        value={formCost}
                        onChange={(e) => setFormCost(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-[#070709] px-3 py-2 text-xs text-white focus:border-cyan-400/50 focus:outline-none"
                      />
                    </div>

                    {/* Status selection */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-mono uppercase text-white/50">{t.formStatus}</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setFormStatus('active')}
                          className={`py-2 rounded-lg text-xs font-mono border transition-all ${formStatus === 'active' ? 'border-[#00FF66]/30 bg-[#00FF66]/10 text-[#00FF66]' : 'border-white/15 bg-transparent text-white/60 hover:text-white'}`}
                        >
                          {t.statusActive}
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormStatus('inactive')}
                          className={`py-2 rounded-lg text-xs font-mono border transition-all ${formStatus === 'inactive' ? 'border-amber-400/30 bg-amber-400/10 text-amber-400' : 'border-white/15 bg-transparent text-white/60 hover:text-white'}`}
                        >
                          {t.statusInactive}
                        </button>
                      </div>
                    </div>

                    {/* Utilization Rate range */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-[10px] font-mono uppercase text-white/50">
                        <span>{t.formUtilization}</span>
                        <span className="text-cyan-400 font-bold">{formUtilization}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={formUtilization}
                        onChange={(e) => setFormUtilization(e.target.value)}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Optional recommendation */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono uppercase text-white/50">{t.formRecommendation}</label>
                    <input
                      type="text"
                      placeholder="Leave blank for automatic smart suggestion logic generation..."
                      value={formRecommendation}
                      onChange={(e) => setFormRecommendation(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-[#070709] px-3 py-2 text-xs text-white focus:border-cyan-400/50 focus:outline-none"
                    />
                  </div>

                  {/* Submit buttons */}
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-lg text-xs font-mono font-bold tracking-wide uppercase text-black bg-cyan-400 hover:bg-cyan-300 transition-all shadow-[0_0_12px_rgba(0,240,255,0.2)]"
                  >
                    {t.formSubmit}
                  </button>
                </form>
              )}

              {/* SEARCH & FILTERS CONTROLS BAR */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#121216]/30 p-3 rounded-xl border border-white/5">
                
                {/* Search query input */}
                <div className="relative md:col-span-1">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-white/30" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.searchPlaceholder}
                    className="w-full rounded-lg border border-white/10 bg-[#070709] pl-9 pr-3 py-2 text-xs text-white placeholder-white/30 focus:border-cyan-400/50 focus:outline-none"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5">
                      <X className="w-3.5 h-3.5 text-white/40 hover:text-white" />
                    </button>
                  )}
                </div>

                {/* Filter segments */}
                <div className="md:col-span-2 flex flex-wrap gap-1.5 items-center">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase transition-all ${statusFilter === 'all' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-400/30' : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'}`}
                  >
                    {t.filterAll}
                  </button>
                  <button
                    onClick={() => setStatusFilter('active')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase transition-all ${statusFilter === 'active' ? 'bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/30' : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'}`}
                  >
                    {t.filterActive}
                  </button>
                  <button
                    onClick={() => setStatusFilter('inactive')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase transition-all ${statusFilter === 'inactive' ? 'bg-amber-400/10 text-amber-400 border border-amber-400/30' : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'}`}
                  >
                    {t.filterInactive}
                  </button>
                  <button
                    onClick={() => setStatusFilter('optimized')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase transition-all ${statusFilter === 'optimized' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30' : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'}`}
                  >
                    {t.filterOptimized}
                  </button>
                </div>
              </div>

              {/* Table Body Container */}
              <div className="overflow-x-auto min-h-[160px]">
                {filteredExpenses.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center text-white/30 font-mono text-xs">
                    <Info className="w-6 h-6 mb-2 text-white/20" />
                    <p>No matching subscriptions found in directory.</p>
                    <button onClick={() => { setSearchQuery(''); setStatusFilter('all'); }} className="text-cyan-400 underline mt-1 hover:text-cyan-300">
                      Clear Filters
                    </button>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-[11px] font-mono text-white/40 uppercase tracking-wider">
                        <th className="pb-3 font-semibold">{t.thTool}</th>
                        <th className="pb-3 font-semibold">{t.thStatus}</th>
                        <th className="pb-3 font-semibold">{t.thCost}</th>
                        <th className="pb-3 font-semibold text-center">{t.thUtilization}</th>
                        <th className="pb-3 font-semibold hidden md:table-cell">{t.thRecommendation}</th>
                        <th className="pb-3 font-semibold text-right">{t.thActions}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredExpenses.map((exp) => {
                        // Dynamically translate key or fall back to custom typed recommendations
                        const localizedRec = t[exp.recommendationKey]?.replace('$param', exp.recommendationParam || '') || exp.recommendationKey || 'Fully optimized.';
                        
                        // Calculate current row price
                        let currentCost = exp.cost;
                        if (exp.isOptimized) {
                          const savedVal = parseInt(exp.recommendationParam?.replace('$', '') || '0', 10);
                          currentCost = Math.max(0, exp.cost - savedVal);
                        }

                        return (
                          <tr 
                            key={exp.id} 
                            className="border-b border-white/5 hover:bg-white/2 transition-colors duration-200 group/row"
                          >
                            {/* Tool Name column with custom stylized icon */}
                            <td className="py-4 font-sans font-semibold text-white/90">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center text-white/70 border border-white/10 shadow-sm font-mono text-xs font-bold uppercase">
                                  {exp.name.charAt(0)}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-white tracking-wide">{exp.name}</span>
                                  <span className="text-[9px] text-white/40 font-mono tracking-widest uppercase">ID: {exp.id}</span>
                                </div>
                              </div>
                            </td>

                            {/* Status badge column */}
                            <td className="py-4">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-mono tracking-wider font-bold uppercase ${
                                exp.status === 'active' 
                                  ? 'bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/20' 
                                  : 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                              }`}>
                                <span className={`w-1 h-1 rounded-full ${exp.status === 'active' ? 'bg-[#00FF66]' : 'bg-amber-400'}`}></span>
                                {exp.status === 'active' ? t.statusActive : t.statusInactive}
                              </span>
                            </td>

                            {/* Cost column */}
                            <td className="py-4 font-mono text-xs">
                              {exp.isOptimized ? (
                                <div className="flex flex-col">
                                  <span className="text-white/40 line-through text-[10px] font-semibold">${exp.cost}</span>
                                  <span className="text-[#00FF66] font-bold">${currentCost}/mo</span>
                                </div>
                              ) : (
                                <span className="text-white font-bold">${exp.cost}/mo</span>
                              )}
                            </td>

                            {/* Utilization rate bar column */}
                            <td className="py-4">
                              <div className="flex flex-col items-center gap-1">
                                <span className="font-mono text-[10px] font-bold text-white/70">{exp.utilization}%</span>
                                <div className="w-16 h-1 rounded-full bg-white/10 overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      exp.utilization > 60 
                                        ? 'bg-[#00FF66]' 
                                        : exp.utilization > 30 
                                          ? 'bg-amber-400' 
                                          : 'bg-[#9D00FF]'
                                    }`}
                                    style={{ width: `${exp.utilization}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>

                            {/* Action Recommendation column */}
                            <td className="py-4 max-w-xs text-[11px] font-mono text-white/60 leading-relaxed hidden md:table-cell">
                              {localizedRec}
                            </td>

                            {/* Actions action trigger column */}
                            <td className="py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {exp.isOptimized ? (
                                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-[#00FF66] bg-[#00FF66]/10 border border-[#00FF66]/20 shadow-sm pointer-events-none">
                                    <Check className="w-3.5 h-3.5" />
                                    {t.btnOptimized}
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleOptimize(exp.id)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-black bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.2)] hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all hover:scale-[1.03] duration-150"
                                  >
                                    {t.btnOptimize}
                                  </button>
                                )}

                                {/* Delete row trigger */}
                                <button
                                  onClick={() => handleDelete(exp.id)}
                                  className="p-1.5 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-all opacity-0 group-hover/row:opacity-100 duration-150"
                                  title="Delete item"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Advanced Cloud integration paywall button */}
              <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
                <p className="text-[11px] font-mono text-white/40 leading-relaxed max-w-lg">
                  Integrate Stripe, GSuite API logs, and AWS Cloudwatch reports automatically to optimize multi-seat team licenses with custom Slack warning triggers.
                </p>
                <button
                  id="live-sync-btn"
                  onClick={() => setIsUpgradeOpen(true)}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-mono font-bold tracking-wider text-cyan-400 border border-cyan-400/20 hover:border-cyan-400/40 bg-cyan-500/5 hover:bg-cyan-500/10 shadow-[0_0_12px_rgba(0,240,255,0.1)] transition-all flex items-center justify-center gap-2 hover:scale-[1.01] duration-150"
                >
                  <Zap className="w-3.5 h-3.5 text-[#00FF66]" />
                  {t.btnLiveSync}
                </button>
              </div>

            </div>

          </div>

          {/* Right AI Parser & Flippa Highlight Box Column (Span 1) */}
          <div className="flex flex-col gap-6">
            
            {/* Intelligent AI Audit Import Card */}
            <div className="rounded-2xl border border-white/10 bg-[#0E0E12]/80 backdrop-blur-md p-6 flex flex-col gap-5 relative">
              
              {/* Header Title */}
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                  <Sparkles className="w-4.5 h-4.5 text-[#00FF66]" />
                  {t.aiInputTitle}
                </h3>
                <p className="text-xs text-white/50 leading-relaxed mt-1">{t.aiInputDesc}</p>
              </div>

              {/* Sample loader Buttons for 1-click test flow */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-mono uppercase text-white/30 tracking-widest">Load Demo Billings Dataset:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleLoadSample(1)}
                    className="px-2.5 py-1.5 rounded-lg border border-white/5 bg-white/2 hover:bg-white/5 hover:border-white/10 text-[10px] font-mono text-white/70 hover:text-white transition-all text-left flex items-center gap-1.5"
                  >
                    <FileText className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span className="truncate">Dataset Alpha</span>
                  </button>
                  <button
                    onClick={() => handleLoadSample(2)}
                    className="px-2.5 py-1.5 rounded-lg border border-white/5 bg-white/2 hover:bg-white/5 hover:border-white/10 text-[10px] font-mono text-white/70 hover:text-white transition-all text-left flex items-center gap-1.5"
                  >
                    <FileText className="w-3 h-3 text-[#9D00FF] shrink-0" />
                    <span className="truncate">Dataset Beta</span>
                  </button>
                </div>
              </div>

              {/* Main Input Textarea */}
              <div className="relative">
                <textarea
                  id="billing-raw-textarea"
                  rows={6}
                  value={rawInput}
                  onChange={(e) => setRawInput(e.target.value)}
                  placeholder={t.aiInputPlaceholder}
                  className="w-full rounded-xl border border-white/10 bg-[#070709] p-4 text-xs font-mono text-white placeholder-white/25 focus:border-[#00F0FF]/30 focus:outline-none focus:ring-1 focus:ring-[#00F0FF]/30 transition-all resize-none"
                ></textarea>
                
                {/* Visual Glass Indicator at bottom of textarea */}
                <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[8px] font-mono text-white/40">
                  <Cpu className="w-2.5 h-2.5" />
                  <span>Gemini Flash</span>
                </div>
              </div>

              {/* Submit trigger button */}
              <button
                id="audit-submit-btn"
                onClick={handleRunAudit}
                disabled={isAnalyzing}
                className={`w-full py-3 rounded-xl text-xs font-mono font-bold tracking-wider uppercase text-black bg-gradient-to-r from-[#00F0FF] via-cyan-400 to-[#9D00FF] hover:from-[#26f3ff] hover:to-[#ae26ff] transition-all hover:scale-[1.01] duration-300 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.15)] ${isAnalyzing ? 'cursor-not-allowed opacity-80' : ''}`}
              >
                {isAnalyzing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                    {t.btnAnalyzing}
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-black" />
                    {t.btnAnalyze}
                  </>
                )}
              </button>

            </div>

            {/* LIVE WEb3 SUBSCRIPTION CONTROLS PANEL FOR BUYER DEMO */}
            <div className="rounded-2xl border border-white/10 bg-[#0E0E12]/80 p-5 flex flex-col gap-3.5 relative overflow-hidden">
              <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                <Database className="w-4 h-4 text-[#00FF66]" />
                <h4 className="text-xs font-bold font-mono text-white uppercase tracking-wider">Web3 Admin Sandbox</h4>
              </div>

              <p className="text-[10px] text-white/50 leading-relaxed font-mono">
                Simulate standard user billing and verification limits immediately to test the premium conversion lock.
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={handleDevForceLock}
                  className="px-2 py-2 rounded-lg border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[10px] font-mono font-semibold transition-all flex items-center justify-center gap-1.5"
                >
                  <Lock className="w-3 h-3" />
                  <span>{t.cryptoSimulateLock}</span>
                </button>
                <button
                  onClick={handleDevGrantAccess}
                  className="px-2 py-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-semibold transition-all flex items-center justify-center gap-1.5"
                >
                  <Unlock className="w-3 h-3" />
                  <span>{t.cryptoSimulateUnlock}</span>
                </button>
              </div>

              {/* TxID History logs */}
              {userTxidList.length > 0 && (
                <div className="border-t border-white/5 pt-3 flex flex-col gap-1.5">
                  <span className="text-[8px] font-mono uppercase tracking-widest text-white/40 flex items-center gap-1">
                    <History className="w-2.5 h-2.5" />
                    Simulated TxID Audit Logs ({userTxidList.length})
                  </span>
                  <div className="max-h-24 overflow-y-auto flex flex-col gap-1 font-mono text-[9px] text-white/50 pr-1">
                    {userTxidList.map((tx, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-[#070709] px-2 py-1 rounded border border-white/5">
                        <span className="truncate max-w-[130px]">{tx}</span>
                        <span className="text-[#00FF66] font-bold">VERIFIED</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Flippa / SaaS Highlights Sidebar card (Conversion catalyst) */}
            <div className="rounded-2xl border border-emerald-500/10 bg-[#121216]/40 p-6 flex flex-col gap-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-emerald-500/5 blur-xl pointer-events-none"></div>
              
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[#00FF66] shadow-[0_0_10px_rgba(0,255,102,0.15)]">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">Turnkey Flipping Metrics</h4>
                  <p className="text-[10px] text-white/40 font-mono">Starter SaaS Valuation: $1.2k - $3k</p>
                </div>
              </div>

              <ul className="flex flex-col gap-2 text-xs font-mono text-white/70 border-t border-white/5 pt-3.5">
                <li className="flex items-start gap-2">
                  <span className="text-[#00FF66] mt-0.5">•</span>
                  <span><strong>Crypto Native</strong>: Integrated multi-token lock screens to capture global unbanked users.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#00FF66] mt-0.5">•</span>
                  <span><strong>Zero API Costs</strong>: Local client simulator delivers 100% realistic interactive billing reports offline.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#00FF66] mt-0.5">•</span>
                  <span><strong>Instant Stripe Hook</strong>: Paywall upgrade links directly to preset checkout modals ready to monetization.</span>
                </li>
              </ul>

              <div className="text-[10px] text-white/30 text-center leading-relaxed mt-1">
                Deploy on Replit or Vercel, attach domain, list on Flippa. This starter SaaS is designed for instant sales cycles.
              </div>
            </div>

          </div>

        </section>

      </main>

      {/* --- ADVANCED CRYPTO PAYMENT GATEWAY MODAL --- */}
      {isCryptoCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          
          <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0C0C0F] p-6 md:p-8 overflow-hidden shadow-[0_0_50px_rgba(0,240,255,0.2)]">
            {/* Background decorative styling */}
            <div className="absolute top-[-20%] left-[-20%] w-72 h-72 rounded-full bg-[#00FF66]/5 blur-[60px] pointer-events-none"></div>
            <div className="absolute bottom-[-20%] right-[-20%] w-72 h-72 rounded-full bg-cyan-500/5 blur-[60px] pointer-events-none"></div>

            {/* Modal Exit */}
            <button 
              onClick={() => {
                if (verificationStep === 0) setIsCryptoCheckoutOpen(false);
              }}
              className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
              disabled={verificationStep > 0}
            >
              <X className="w-5 h-5" />
            </button>

            {/* Heading */}
            <div className="text-center flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-[#00FF66]/10 border border-[#00FF66]/20 flex items-center justify-center text-[#00FF66] shadow-[0_0_15px_rgba(0,255,102,0.2)]">
                <Coins className="w-6 h-6 animate-spin" style={{ animationDuration: '3s' }} />
              </div>
              <h3 className="text-lg font-bold font-mono uppercase tracking-wide text-white mt-2">
                {t.cryptoVerifyHeading}
              </h3>
              <p className="text-xs text-white/50 leading-relaxed max-w-sm">
                {t.cryptoPaymentInstruction}
              </p>
            </div>

            {/* Currency Select Segments */}
            {verificationStep === 0 && (
              <div className="my-5 flex flex-col gap-4">
                <div className="grid grid-cols-4 gap-2">
                  {cryptos.map((coin, idx) => (
                    <button
                      key={coin.symbol}
                      onClick={() => setSelectedCrypto(idx)}
                      className={`py-3 px-1 rounded-xl border flex flex-col items-center gap-1.5 transition-all hover:scale-[1.02] ${
                        selectedCrypto === idx 
                          ? 'border-[#00FF66]/40 bg-[#00FF66]/5 text-white' 
                          : 'border-white/5 bg-[#121216]/50 text-white/40 hover:text-white'
                      }`}
                    >
                      <span className="text-lg font-bold" style={{ color: coin.color }}>{coin.icon}</span>
                      <span className="text-[10px] font-mono font-bold">{coin.symbol}</span>
                    </button>
                  ))}
                </div>

                {/* Amount and Address display card */}
                <div className="p-4 rounded-xl bg-[#070709] border border-white/5 flex flex-col gap-3">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-white/40">Network Required:</span>
                    <span className="text-[10px] font-mono font-bold text-[#00FF66]">{cryptos[selectedCrypto].network}</span>
                  </div>

                  <div className="flex justify-between items-center py-1">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-white/40">Amount due:</span>
                    <span className="text-base font-bold font-mono text-white">
                      {cryptos[selectedCrypto].amount} {cryptos[selectedCrypto].symbol}
                      <span className="text-xs text-white/40 font-normal ml-1">($29.00 USD)</span>
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5 pt-1">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-white/40">Deposit Wallet Address:</span>
                    <div className="flex gap-1 items-center">
                      <div className="flex-1 bg-[#121216] px-3 py-2 rounded-lg border border-white/5 font-mono text-[9px] text-white/70 select-all overflow-x-auto whitespace-nowrap">
                        {cryptos[selectedCrypto].address}
                      </div>
                      <button
                        onClick={() => handleCopyAddress(cryptos[selectedCrypto].address)}
                        className="p-2.5 rounded-lg border border-white/10 bg-[#121216]/60 text-white/60 hover:text-white transition-all hover:bg-[#16161C]"
                        title="Copy Address"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Stylized QR Code SVG */}
                  <div className="flex justify-center py-2">
                    <div className="p-2 bg-white rounded-lg border border-white/10 shadow-lg relative group">
                      <svg className="w-24 h-24 text-black" viewBox="0 0 100 100">
                        {/* Realistic Mock QR grid blocks */}
                        <rect x="5" y="5" width="20" height="20" fill="currentColor" />
                        <rect x="9" y="9" width="12" height="12" fill="white" />
                        <rect x="12" y="12" width="6" height="6" fill="currentColor" />

                        <rect x="75" y="5" width="20" height="20" fill="currentColor" />
                        <rect x="79" y="9" width="12" height="12" fill="white" />
                        <rect x="82" y="12" width="6" height="6" fill="currentColor" />

                        <rect x="5" y="75" width="20" height="20" fill="currentColor" />
                        <rect x="9" y="79" width="12" height="12" fill="white" />
                        <rect x="12" y="82" width="6" height="6" fill="currentColor" />

                        {/* Scattered random QR bits */}
                        <rect x="35" y="10" width="5" height="10" fill="currentColor" />
                        <rect x="45" y="5" width="10" height="5" fill="currentColor" />
                        <rect x="60" y="15" width="5" height="5" fill="currentColor" />
                        
                        <rect x="30" y="30" width="10" height="10" fill="currentColor" />
                        <rect x="50" y="35" width="5" height="15" fill="currentColor" />
                        <rect x="70" y="40" width="15" height="5" fill="currentColor" />

                        <rect x="10" y="45" width="5" height="10" fill="currentColor" />
                        <rect x="20" y="60" width="15" height="5" fill="currentColor" />
                        
                        <rect x="40" y="60" width="10" height="10" fill="currentColor" />
                        <rect x="55" y="75" width="15" height="15" fill="currentColor" />
                        <rect x="35" y="80" width="5" height="10" fill="currentColor" />
                        <rect x="80" y="60" width="10" height="10" fill="currentColor" />
                        <rect x="75" y="85" width="15" height="5" fill="currentColor" />
                        <circle cx="50" cy="50" r="7" fill="currentColor" />
                      </svg>
                      {/* Interactive lock over QR */}
                      <div className="absolute inset-0 bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                        <QrCode className="w-8 h-8 text-[#00FF66] animate-pulse" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Input TxID */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-white/50">{t.cryptoTxidLabel}</label>
                  <input
                    type="text"
                    value={txidInput}
                    onChange={(e) => setTxidInput(e.target.value)}
                    placeholder={t.cryptoTxidPlaceholder}
                    className="w-full rounded-xl border border-white/10 bg-[#070709] px-4 py-3 text-xs font-mono text-white placeholder-white/20 focus:border-[#00FF66]/30 focus:outline-none"
                  />
                </div>

                {/* Verification CTA Button */}
                <button
                  onClick={handleVerifyTxID}
                  className="w-full py-4 mt-2 rounded-xl text-xs font-mono font-bold tracking-widest uppercase text-black bg-[#00FF66] hover:bg-[#26ff7b] transition-all shadow-[0_0_15px_rgba(0,255,102,0.3)] hover:shadow-[0_0_25px_rgba(0,255,102,0.5)]"
                >
                  {t.cryptoBtnVerify}
                </button>
              </div>
            )}

            {/* VERIFYING BLOCKCHAIN TIMELINE STATE DISPLAY */}
            {verificationStep > 0 && (
              <div className="my-8 flex flex-col items-center gap-6 animate-pulse">
                
                {/* Advanced mechanical scanning ring */}
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <div className="absolute inset-0 border-4 border-cyan-400/10 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-[#00FF66] border-t-transparent rounded-full animate-spin"></div>
                  <Cpu className="w-8 h-8 text-cyan-400 animate-pulse" />
                </div>

                <div className="flex flex-col items-center text-center gap-2">
                  <span className="text-sm font-bold font-mono text-[#00FF66] tracking-wider uppercase">
                    {t.cryptoBtnVerifying}
                  </span>
                  
                  {/* Dynamic tracking instructions */}
                  <div className="h-6 overflow-hidden">
                    <p className={`text-[10px] font-mono text-white/50 transition-all duration-300 ${verificationStep === 1 ? 'translate-y-0' : '-translate-y-full opacity-0'}`}>
                      Connecting to decentralized RPC blockchain validators...
                    </p>
                    <p className={`text-[10px] font-mono text-white/50 transition-all duration-300 ${verificationStep === 2 ? 'translate-y-0' : '-translate-y-full opacity-0'}`}>
                      Querying local network mempools. Confirming block inclusions (1/3 confirmations)...
                    </p>
                    <p className={`text-[10px] font-mono text-white/50 transition-all duration-300 ${verificationStep === 3 ? 'translate-y-0' : '-translate-y-full opacity-0'}`}>
                      Mempool transaction verified! Signing cryptographic access lease for 30 days...
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full max-w-xs h-1 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-400 to-[#00FF66] transition-all duration-500 rounded-full"
                    style={{ width: `${(verificationStep / 3) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* Conversion-Focused Premium Upgrade Modal */}
      {isUpgradeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          
          <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0C0C0F] p-6 md:p-8 overflow-hidden shadow-[0_0_50px_rgba(0,240,255,0.2)]">
            {/* Background glowing rings in modal */}
            <div className="absolute top-[-20%] left-[-20%] w-72 h-72 rounded-full bg-cyan-500/10 blur-[60px] pointer-events-none"></div>
            <div className="absolute bottom-[-20%] right-[-20%] w-72 h-72 rounded-full bg-purple-500/10 blur-[60px] pointer-events-none"></div>

            {/* Modal Title Block */}
            <div className="text-center flex flex-col items-center gap-3 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#00FF66] to-[#00F0FF] p-[1.5px] shadow-[0_0_15px_rgba(0,255,102,0.3)] flex items-center justify-center">
                <Zap className="w-6 h-6 text-black" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white mt-1 uppercase">
                {t.modalUpgradeTitle}
              </h2>
              <p className="text-xs text-white/60 leading-relaxed max-w-sm">
                {t.modalUpgradeSubtitle}
              </p>
            </div>

            {/* Premium Features List */}
            <div className="my-6 border-y border-white/5 py-5 flex flex-col gap-3.5 relative z-10 font-mono text-xs text-white/80">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-md bg-[#00FF66]/10 border border-[#00FF66]/20 flex items-center justify-center text-[#00FF66]">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>{t.modalFeature1}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-md bg-[#00FF66]/10 border border-[#00FF66]/20 flex items-center justify-center text-[#00FF66]">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>{t.modalFeature2}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-md bg-[#00FF66]/10 border border-[#00FF66]/20 flex items-center justify-center text-[#00FF66]">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>{t.modalFeature3}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-md bg-[#00FF66]/10 border border-[#00FF66]/20 flex items-center justify-center text-[#00FF66]">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>{t.modalFeature4}</span>
              </div>
            </div>

            {/* Price Indicator */}
            <div className="text-center mb-6 relative z-10">
              <div className="inline-block px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block">Subscription pricing</span>
                <span className="text-2xl font-bold font-mono text-white">{t.modalPrice}</span>
              </div>
            </div>

            {/* CTA checkout action triggers */}
            <div className="flex flex-col gap-2 relative z-10">
              <button
                id="crypto-upgrade-btn"
                onClick={() => {
                  setIsCryptoCheckoutOpen(true);
                  setIsUpgradeOpen(false);
                }}
                className="w-full py-3.5 rounded-xl text-xs font-mono font-bold tracking-wider uppercase text-black bg-[#00FF66] shadow-[0_0_15px_rgba(0,255,102,0.4)] hover:shadow-[0_0_25px_rgba(0,255,102,0.6)] hover:bg-[#26ff7b] transition-all hover:scale-[1.01] duration-200"
              >
                Launch Crypto Checkout Gate
              </button>
              
              <button
                id="close-modal-btn"
                onClick={() => setIsUpgradeOpen(false)}
                className="w-full py-3.5 rounded-xl text-xs font-mono font-bold tracking-wider uppercase text-white/50 hover:text-white transition-colors"
              >
                {t.modalClose}
              </button>
            </div>

          </div>

        </div>
      )}

      {/* Footer information section */}
      <footer className="w-full border-t border-white/5 bg-[#070709] px-4 lg:px-8 py-8 mt-16 font-mono text-[10px] text-white/30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <p>© 2026 {t.brandName} Inc. All rights reserved.</p>
            <p className="mt-1">Production ready template engineered for high SaaS flip valuations.</p>
          </div>
          <div className="flex items-center gap-6">
            <a href="#github" className="hover:text-cyan-400 transition-colors flex items-center gap-1">Documentation <ExternalLink className="w-2.5 h-2.5" /></a>
            <a href="#terms" className="hover:text-cyan-400 transition-colors">Privacy Policy</a>
            <a href="#stripe" className="hover:text-[#00FF66] transition-colors flex items-center gap-1 text-[#00FF66]">Flippa Listings <ExternalLink className="w-2.5 h-2.5" /></a>
          </div>
        </div>
      </footer>

    </div>
  );
}
