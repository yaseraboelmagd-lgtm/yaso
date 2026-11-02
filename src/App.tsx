/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Scale,
  Gavel,
  Users,
  FileText,
  Calendar as CalendarIcon,
  DollarSign,
  Bot,
  Bell,
  ShieldCheck,
  Briefcase,
  Clock,
  Plus,
  Search,
  Download,
  Trash2,
  Edit,
  CheckCircle2,
  AlertCircle,
  Building2,
  Phone,
  Mail,
  UserCheck,
  BookOpen,
  Settings,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  X,
  Printer,
  Share2,
  Lock,
  Grid,
  List
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

// Types
interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  nationalId: string;
  type: 'فرد' | 'شركة';
  createdAt: string;
}

interface CaseItem {
  id: string;
  title: string;
  caseNumber: string;
  court: string;
  circuit: string;
  clientId: string;
  clientName: string;
  status: 'نشطة' | 'محجوزة للحكم' | 'منتهية' | 'معلقة';
  category: 'مدني' | 'جنائي' | 'تجاري' | 'عمالي' | 'أحوال شخصية' | 'إداري';
  filingDate: string;
  nextSessionDate: string;
  fees: number;
  paidFees: number;
  description: string;
}

interface SessionItem {
  id: string;
  caseId: string;
  caseTitle: string;
  caseNumber: string;
  date: string; // YYYY-MM-DD
  time: string;
  court: string;
  notes: string;
  status: 'قادمة' | 'منتهية' | 'مؤجلة';
}

interface DocumentItem {
  id: string;
  caseId: string;
  caseTitle: string;
  name: string;
  type: string;
  size: string;
  uploadDate: string;
  url?: string;
}

interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  caseId: string;
  caseTitle: string;
  amount: number;
  paid: number;
  status: 'مدفوعة بالكامل' | 'مدفوعة جزئياً' | 'غير مدفوعة';
  date: string;
  dueDate: string;
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

const ARABIC_DAYS = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'cases' | 'clients' | 'sessions' | 'documents' | 'billing' | 'advisor' | 'settings'>('dashboard');

  // Sessions Calendar View Mode: 'list' | 'month' | 'year'
  const [sessionViewMode, setSessionViewMode] = useState<'list' | 'month' | 'year'>('month');
  const [calendarDate, setCalendarDate] = useState(new Date(2026, 2, 1)); // March 2026

  // Selected Case for Details Modal / PDF Report
  const [selectedCaseDetail, setSelectedCaseDetail] = useState<CaseItem | null>(null);

  // Initial Mock Data
  const [clients, setClients] = useState<Client[]>([
    { id: 'c1', name: 'شركة النور للاستثمار العقاري', phone: '01012345678', email: 'info@alnoor.com', nationalId: '1029384756', type: 'شركة', createdAt: '2026-01-15' },
    { id: 'c2', name: 'أحمد محمود إبراهيم', phone: '01123456789', email: 'ahmed@gmail.com', nationalId: '29812034561234', type: 'فرد', createdAt: '2026-02-01' },
    { id: 'c3', name: 'منى عبد العزيز الشريف', phone: '01234567890', email: 'mona@hotmail.com', nationalId: '29504123456789', type: 'فرد', createdAt: '2026-02-10' },
  ]);

  const [cases, setCases] = useState<CaseItem[]>([
    {
      id: 'cs1',
      title: 'نزاع عقاري على أرض العريش',
      caseNumber: '1425/2025',
      court: 'محكمة استئناف القاهرة',
      circuit: 'الدائرة 14 مدني',
      clientId: 'c1',
      clientName: 'شركة النور للاستثمار العقاري',
      status: 'نشطة',
      category: 'مدني',
      filingDate: '2026-01-20',
      nextSessionDate: '2026-03-15',
      fees: 75000,
      paidFees: 45000,
      description: 'دعوى صحة ونفاذ عقد بيع مساحة 500 متر مربع بشارع النصر.'
    },
    {
      id: 'cs2',
      title: 'مطالبة مالية وتعويض عمالي',
      caseNumber: '892/2025',
      court: 'محكمة شمال القاهرة الابتدائية',
      circuit: 'دائرة العمال الكلية',
      clientId: 'c2',
      clientName: 'أحمد محمود إبراهيم',
      status: 'محجوزة للحكم',
      category: 'عمالي',
      filingDate: '2025-11-10',
      nextSessionDate: '2026-03-10',
      fees: 20000,
      paidFees: 20000,
      description: 'فصل تعسفي ومستحقات نهاية الخدمة والمهلة القانونية.'
    },
    {
      id: 'cs3',
      title: 'دعوى خلع ونفقة صغار',
      caseNumber: '314/2026',
      court: 'محكمة الأسرة بمصر القديمة',
      circuit: 'دائرة الأسرة الجزئية',
      clientId: 'c3',
      clientName: 'منى عبد العزيز الشريف',
      status: 'نشطة',
      category: 'أحوال شخصية',
      filingDate: '2026-02-05',
      nextSessionDate: '2026-03-18',
      fees: 15000,
      paidFees: 5000,
      description: 'إقامة دعوى خلع للتنازل عن جميع المهور ومؤخر الصداق.'
    },
    {
      id: 'cs4',
      title: 'نزاع تجاري على حقوق إنتفاع',
      caseNumber: '554/2026',
      court: 'محكمة الاقتصادية بالقاهرة',
      circuit: 'الدائرة التجارية الرابعة',
      clientId: 'c1',
      clientName: 'شركة النور للاستثمار العقاري',
      status: 'نشطة',
      category: 'تجاري',
      filingDate: '2026-02-20',
      nextSessionDate: '2026-04-05',
      fees: 120000,
      paidFees: 60000,
      description: 'نزاع حول شروط عقد توريد وتركيب مواد بناء.'
    }
  ]);

  const [sessions, setSessions] = useState<SessionItem[]>([
    { id: 's1', caseId: 'cs2', caseTitle: 'مطالبة مالية وتعويض عمالي', caseNumber: '892/2025', date: '2026-03-10', time: '09:00 صباحاً', court: 'محكمة شمال القاهرة', notes: 'النطق بالحكم في الدعوى', status: 'قادمة' },
    { id: 's2', caseId: 'cs1', caseTitle: 'نزاع عقاري على أرض العريش', caseNumber: '1425/2025', date: '2026-03-15', time: '10:00 صباحاً', court: 'محكمة استئناف القاهرة', notes: 'تقديم المستندات وختام المرافعة', status: 'قادمة' },
    { id: 's3', caseId: 'cs3', caseTitle: 'دعوى خلع ونفقة صغار', caseNumber: '314/2026', date: '2026-03-18', time: '11:00 صباحاً', court: 'محكمة الأسرة بمصر القديمة', notes: 'حضور تسوية المنازعات الأسرية', status: 'قادمة' },
    { id: 's4', caseId: 'cs4', caseTitle: 'نزاع تجاري على حقوق إنتفاع', caseNumber: '554/2026', date: '2026-04-05', time: '10:30 صباحاً', court: 'محكمة الاقتصادية', notes: 'اول جلسة وتقديم المستندات', status: 'قادمة' },
    { id: 's5', caseId: 'cs1', caseTitle: 'نزاع عقاري على أرض العريش', caseNumber: '1425/2025', date: '2026-03-30', time: '09:30 صباحاً', court: 'محكمة استئناف القاهرة', notes: 'تعقيب الخبير', status: 'قادمة' },
  ]);

  const [documents, setDocuments] = useState<DocumentItem[]>([
    { id: 'd1', caseId: 'cs1', caseTitle: 'نزاع عقاري على أرض العريش', name: 'عقد_البيع_الابتدائي.pdf', type: 'PDF', size: '2.4 MB', uploadDate: '2026-01-20' },
    { id: 'd2', caseId: 'cs1', caseTitle: 'نزاع عقاري على أرض العريش', name: 'إنحصار_إرث_ووكالة.pdf', type: 'PDF', size: '1.8 MB', uploadDate: '2026-01-22' },
    { id: 'd3', caseId: 'cs2', caseTitle: 'مطالبة مالية وتعويض عمالي', name: 'استمارة_6_فصل_تعسفي.pdf', type: 'PDF', size: '950 KB', uploadDate: '2025-11-11' },
    { id: 'd4', caseId: 'cs3', caseTitle: 'دعوى خلع ونفقة صغار', name: 'قسيمة_الزواج_الرسمية.pdf', type: 'PDF', size: '3.1 MB', uploadDate: '2026-02-06' },
  ]);

  const [invoices, setInvoices] = useState<InvoiceItem[]>([
    { id: 'inv1', invoiceNumber: 'INV-2026-001', clientId: 'c1', clientName: 'شركة النور للاستثمار العقاري', caseId: 'cs1', caseTitle: 'نزاع عقاري على أرض العريش', amount: 75000, paid: 45000, status: 'مدفوعة جزئياً', date: '2026-01-20', dueDate: '2026-03-30' },
    { id: 'inv2', invoiceNumber: 'INV-2026-002', clientId: 'c2', clientName: 'أحمد محمود إبراهيم', caseId: 'cs2', caseTitle: 'مطالبة مالية وتعويض عمالي', amount: 20000, paid: 20000, status: 'مدفوعة بالكامل', date: '2025-11-10', dueDate: '2025-12-10' },
    { id: 'inv3', invoiceNumber: 'INV-2026-003', clientId: 'c3', clientName: 'منى عبد العزيز الشريف', caseId: 'cs3', caseTitle: 'دعوى خلع ونفقة صغار', amount: 15000, paid: 5000, status: 'مدفوعة جزئياً', date: '2026-02-05', dueDate: '2026-03-05' },
  ]);

  // AI Advisor State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: 'أهلاً بك يا فندم في مساعد "المحامي الذكي". أنا مدعوم بنماذج الذكاء الاصطناعي المتقدمة لمساعدتك في صياغة العقود، استنتاج السوابق القضائية، تلخيص المذكرات القانونية، والرد على الاستشارات القانونية طبقاً للقوانين المصرية والعربية. كيف يمكنني خدمتك اليوم؟',
      timestamp: 'الآن'
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Modals state
  const [showNewCaseModal, setShowNewCaseModal] = useState(false);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [selectedDaySessions, setSelectedDaySessions] = useState<{ date: string; sessions: SessionItem[] } | null>(null);

  // New Case Form
  const [newCase, setNewCase] = useState({
    title: '',
    caseNumber: '',
    court: '',
    circuit: '',
    clientId: '',
    category: 'مدني' as CaseItem['category'],
    fees: 0,
    paidFees: 0,
    description: '',
    nextSessionDate: ''
  });

  // New Client Form
  const [newClient, setNewClient] = useState({
    name: '',
    phone: '',
    email: '',
    nationalId: '',
    type: 'فرد' as Client['type']
  });

  // Notifications
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'جلسة غداً', text: 'جلسة دعوى المطالبة المالية (892/2025) غداً الساعة 9 صباحاً', time: 'منذ ساعة' },
    { id: 2, title: 'مستند جديد', text: 'تم إرفاق قسيمة الزواج في قضية دعوى الخلع', time: 'منذ 3 ساعات' }
  ]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Handler for AI Chat
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPrompt.trim() || isAiLoading) return;

    const userText = inputPrompt;
    const newMsg: ChatMessage = { role: 'user', text: userText, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => [...prev, newMsg]);
    setInputPrompt('');
    setIsAiLoading(true);

    try {
      const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
      const ai = new GoogleGenAI({ apiKey: apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `أنت مستشار قانوني خبير ومحامي محترف. أجب بدقة واحترافية وبصياغة قانونية سليمة على السؤال التالي: ${userText}`
              }
            ]
          }
        ],
        config: {
          systemInstruction: 'أنت مستشار قانوني ذكي متخصص في القوانين المدنية، الجنائية، التجارية، والأسرة. قدم إجابات قانونية دقيقة ومنظمة بمراجع استدلالية أو خطوات إجرائية.'
        }
      });

      const replyText = response.text || 'عذراً، لم أتمكن من معالجة الطلب القانوني حالياً.';
      setMessages(prev => [...prev, { role: 'model', text: replyText, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          role: 'model',
          text: `بصفتي المستشار القانوني، وبناءً على القواعد القانونية المعمول بها: ${userText}\n\n[إشعار: للتشغيل الكامل، تأكد من ضبط مفتاح Gemini API في إعدادات النظام]. القانون يقضي في هذه الحالة بضرورة إثبات الحق بالمستندات الرسمية والشهادة القانونية وفقاً للإجراءات المنصوص عليها في قانون المرافعات.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Add Case Handler
  const handleCreateCase = (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find(c => c.id === newCase.clientId) || clients[0];
    const created: CaseItem = {
      id: 'cs_' + Date.now(),
      title: newCase.title,
      caseNumber: newCase.caseNumber || 'جديد/' + new Date().getFullYear(),
      court: newCase.court || 'محكمة الابتدائية',
      circuit: newCase.circuit || 'الدائرة العامة',
      clientId: client.id,
      clientName: client.name,
      status: 'نشطة',
      category: newCase.category,
      filingDate: new Date().toISOString().split('T')[0],
      nextSessionDate: newCase.nextSessionDate || '2026-04-01',
      fees: Number(newCase.fees) || 10000,
      paidFees: Number(newCase.paidFees) || 0,
      description: newCase.description
    };

    setCases([created, ...cases]);
    if (newCase.nextSessionDate) {
      setSessions([
        {
          id: 's_' + Date.now(),
          caseId: created.id,
          caseTitle: created.title,
          caseNumber: created.caseNumber,
          date: newCase.nextSessionDate,
          time: '10:00 صباحاً',
          court: created.court,
          notes: 'جلسة أول درجة',
          status: 'قادمة'
        },
        ...sessions
      ]);
    }

    setShowNewCaseModal(false);
    setNewCase({ title: '', caseNumber: '', court: '', circuit: '', clientId: '', category: 'مدني', fees: 0, paidFees: 0, description: '', nextSessionDate: '' });
  };

  // Add Client Handler
  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    const created: Client = {
      id: 'c_' + Date.now(),
      name: newClient.name,
      phone: newClient.phone,
      email: newClient.email || 'غير متاح',
      nationalId: newClient.nationalId || 'غير محدد',
      type: newClient.type,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setClients([created, ...clients]);
    setShowNewClientModal(false);
    setNewClient({ name: '', phone: '', email: '', nationalId: '', type: 'فرد' });
  };

  // Calculations
  const totalRevenue = invoices.reduce((acc, inv) => acc + inv.paid, 0);
  const totalOutstanding = invoices.reduce((acc, inv) => acc + (inv.amount - inv.paid), 0);
  const activeCasesCount = cases.filter(c => c.status === 'نشطة' || c.status === 'محجوزة للحكم').length;

  // Calendar Helpers
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
  };

  const handlePrevYear = () => {
    setCalendarDate(new Date(calendarDate.getFullYear() - 1, calendarDate.getMonth(), 1));
  };

  const handleNextYear = () => {
    setCalendarDate(new Date(calendarDate.getFullYear() + 1, calendarDate.getMonth(), 1));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 px-6 py-3.5 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              المحامي الذكي <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-medium">نسخة المحترفين</span>
            </h1>
            <p className="text-xs text-slate-400">نظام إدارة مكاتب المحاماة والاستشارات القانونية المتكامل</p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition relative"
              title="الإشعارات والتنبيهات"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse"></span>
            </button>

            {showNotifications && (
              <div className="absolute left-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl py-3 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 pb-2 border-b border-slate-800 flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-white">التنبيهات القضائية</h3>
                  <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">{notifications.length} جديدة</span>
                </div>
                <div className="divide-y divide-slate-800 max-h-72 overflow-y-auto">
                  {notifications.map(n => (
                    <div key={n.id} className="p-3 hover:bg-slate-800/50 transition cursor-pointer">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-amber-400">{n.title}</span>
                        <span className="text-[10px] text-slate-500">{n.time}</span>
                      </div>
                      <p className="text-xs text-slate-300 line-clamp-2">{n.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowNewCaseModal(true)}
            className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-sm shadow-lg shadow-amber-500/20 transition transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>قضية جديدة</span>
          </button>

          <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-amber-400">
              م.أ
            </div>
            <div className="hidden md:block text-right">
              <div className="text-xs font-semibold text-white">المحامي الأستاذ</div>
              <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                متصل بـ Supabase
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container with Sidebar & Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 bg-slate-900/80 backdrop-blur border-l border-slate-800 p-4 flex md:flex-col justify-between overflow-x-auto md:overflow-y-auto shrink-0">
          <nav className="flex md:flex-col gap-1.5 w-full">
            <div className="text-[11px] font-semibold text-slate-500 px-3 py-1 uppercase tracking-wider hidden md:block">الرئيسية</div>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition ${activeTab === 'dashboard' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}`}
            >
              <TrendingUp className="w-5 h-5 shrink-0" />
              <span>لوحة القيادة</span>
            </button>

            <div className="text-[11px] font-semibold text-slate-500 px-3 pt-4 pb-1 uppercase tracking-wider hidden md:block">إدارة المكتب</div>
            <button
              onClick={() => setActiveTab('cases')}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition ${activeTab === 'cases' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}`}
            >
              <Gavel className="w-5 h-5 shrink-0" />
              <span>القضايا والأحكام</span>
              <span className="mr-auto bg-slate-800 text-slate-300 text-xs px-2 py-0.5 rounded-full">{cases.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('clients')}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition ${activeTab === 'clients' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}`}
            >
              <Users className="w-5 h-5 shrink-0" />
              <span>الموكلون والعملاء</span>
              <span className="mr-auto bg-slate-800 text-slate-300 text-xs px-2 py-0.5 rounded-full">{clients.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('sessions')}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition ${activeTab === 'sessions' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}`}
            >
              <CalendarIcon className="w-5 h-5 shrink-0" />
              <span>الجلسات والتقويم</span>
              <span className="mr-auto bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded-full">{sessions.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('documents')}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition ${activeTab === 'documents' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}`}
            >
              <FileText className="w-5 h-5 shrink-0" />
              <span>المستندات والعقود</span>
            </button>

            <button
              onClick={() => setActiveTab('billing')}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition ${activeTab === 'billing' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}`}
            >
              <DollarSign className="w-5 h-5 shrink-0" />
              <span>الأتعاب والماليات</span>
            </button>

            <div className="text-[11px] font-semibold text-slate-500 px-3 pt-4 pb-1 uppercase tracking-wider hidden md:block">الذكاء الاصطناعي</div>
            <button
              onClick={() => setActiveTab('advisor')}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition relative ${activeTab === 'advisor' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}`}
            >
              <Sparkles className="w-5 h-5 shrink-0 text-amber-400 animate-pulse" />
              <span>المستشار القانوني الذكي</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition ${activeTab === 'settings' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}`}
            >
              <Settings className="w-5 h-5 shrink-0" />
              <span>الإعدادات والربط</span>
            </button>
          </nav>

          <div className="hidden md:block mt-6 p-3 bg-gradient-to-br from-amber-500/10 to-slate-900 border border-amber-500/20 rounded-2xl">
            <div className="flex items-center gap-2 mb-2 text-amber-400 font-semibold text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>حماية البيانات (SSL)</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">بيانات القضايا والموكلين مؤمنة ومشفرة تماماً على قاعدة بيانات Supabase الآمنة.</p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 bg-slate-950 p-6 overflow-y-auto">
          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30 border border-slate-800 p-6 rounded-3xl shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="absolute right-0 top-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
                <div>
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold mb-2">
                    <Scale className="w-4 h-4" />
                    <span>مرحباً بك يا فندم في لوحة تحكم المحاماة</span>
                  </div>
                  <h2 className="text-2xl font-black text-white">لديك اليوم {sessions.length} جلسات قضائية قادمة</h2>
                  <p className="text-sm text-slate-400 mt-1">جميع المواعيد والمستندات محدثة ومزامنة مع النظام السحابي بنجاح.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveTab('advisor')}
                    className="flex items-center gap-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 px-4 py-2.5 rounded-xl font-semibold text-sm transition"
                  >
                    <Bot className="w-4 h-4 text-amber-400" />
                    <span>اسأل المستشار الذكي</span>
                  </button>
                  <button
                    onClick={() => setShowNewCaseModal(true)}
                    className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-amber-500/20 transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>قضية جديدة</span>
                  </button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-sm hover:border-slate-700 transition">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                      <Gavel className="w-5 h-5" />
                    </div>
                    <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-medium">نشطة الآن</span>
                  </div>
                  <h3 className="text-2xl font-black text-white">{activeCasesCount}</h3>
                  <p className="text-xs text-slate-400 mt-1">القضايا النشطة والمتداولة</p>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-sm hover:border-slate-700 transition">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                    <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full font-medium">مسجلون</span>
                  </div>
                  <h3 className="text-2xl font-black text-white">{clients.length}</h3>
                  <p className="text-xs text-slate-400 mt-1">إجمالي الموكلين والشركات</p>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-sm hover:border-slate-700 transition">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-medium">المحصل</span>
                  </div>
                  <h3 className="text-2xl font-black text-white">{totalRevenue.toLocaleString()} ج.م</h3>
                  <p className="text-xs text-slate-400 mt-1">إجمالي الأتعاب المحصلة</p>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-sm hover:border-slate-700 transition">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                      <CalendarIcon className="w-5 h-5" />
                    </div>
                    <span className="text-xs text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full font-medium">جلسات قادمة</span>
                  </div>
                  <h3 className="text-2xl font-black text-white">{sessions.length}</h3>
                  <p className="text-xs text-slate-400 mt-1">جلسات خلال الأسبوع الحالي</p>
                </div>
              </div>

              {/* Two columns */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span>الجلسات القادمة</span>
                    </h3>
                    <button onClick={() => { setActiveTab('sessions'); setSessionViewMode('month'); }} className="text-xs text-amber-400 hover:underline">التقويم الشهري</button>
                  </div>
                  <div className="space-y-3">
                    {sessions.map(s => (
                      <div key={s.id} className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl hover:border-amber-500/30 transition">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-amber-400">{s.date}</span>
                          <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded">{s.time}</span>
                        </div>
                        <h4 className="font-bold text-sm text-white mb-1">{s.caseTitle}</h4>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" />
                          <span>{s.court} ({s.caseNumber})</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-white flex items-center gap-2">
                      <Gavel className="w-4 h-4 text-amber-400" />
                      <span>أحدث القضايا والنزاعات</span>
                    </h3>
                    <button onClick={() => setActiveTab('cases')} className="text-xs text-amber-400 hover:underline">إدارة القضايا</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                      <thead className="bg-slate-800/80 text-slate-400 text-xs uppercase">
                        <tr>
                          <th className="p-3 rounded-r-xl">اسم القضية</th>
                          <th className="p-3">رقم القيد</th>
                          <th className="p-3">الموكل</th>
                          <th className="p-3">الحالة</th>
                          <th className="p-3 rounded-l-xl">الجلسة القادمة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {cases.map(c => (
                          <tr key={c.id} className="hover:bg-slate-800/40 transition">
                            <td className="p-3 font-semibold text-white">{c.title}</td>
                            <td className="p-3 font-mono text-xs text-amber-400">{c.caseNumber}</td>
                            <td className="p-3 text-slate-300">{c.clientName}</td>
                            <td className="p-3">
                              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${c.status === 'نشطة' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : c.status === 'محجوزة للحكم' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-slate-700 text-slate-300'}`}>
                                {c.status}
                              </span>
                            </td>
                            <td className="p-3 text-slate-300 font-mono text-xs">{c.nextSessionDate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CASES TAB WITH PROGRESS BAR & PDF REPORT VIEW */}
          {activeTab === 'cases' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">إدارة القضايا والدعاوى</h2>
                  <p className="text-xs text-slate-400">متابعة سير القضايا، نسب الأتعاب المحصلة، والتقارير القانونية (PDF)</p>
                </div>
                <button
                  onClick={() => setShowNewCaseModal(true)}
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-amber-500/20 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>تسجيل قضية جديدة</span>
                </button>
              </div>

              {/* Case Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                {cases.map(c => {
                  const percentage = c.fees > 0 ? Math.min(100, Math.round((c.paidFees / c.fees) * 100)) : 0;
                  const progressColor = percentage === 100 ? 'bg-emerald-500' : percentage >= 50 ? 'bg-amber-500' : 'bg-blue-500';

                  return (
                    <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition flex flex-col justify-between shadow-sm">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs bg-slate-800 text-amber-400 px-2.5 py-1 rounded-lg font-mono font-medium">{c.caseNumber}</span>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${c.status === 'نشطة' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                            {c.status}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1.5">{c.title}</h3>
                        <p className="text-xs text-slate-400 line-clamp-2 mb-4">{c.description}</p>

                        <div className="space-y-2 text-xs text-slate-300 border-t border-slate-800 pt-3">
                          <div className="flex justify-between">
                            <span className="text-slate-500">الموكل:</span>
                            <span className="font-semibold text-white">{c.clientName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">المحكمة / الدائرة:</span>
                            <span>{c.court} - {c.circuit}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">الجلسة القادمة:</span>
                            <span className="text-amber-400 font-mono font-bold">{c.nextSessionDate}</span>
                          </div>
                        </div>

                        {/* FEES PROGRESS BAR SECTION */}
                        <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400">نسبة تحصيل الأتعاب</span>
                            <span className="font-mono font-bold text-white">{percentage}%</span>
                          </div>
                          <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                            <div
                              className={`h-full ${progressColor} transition-all duration-500 rounded-full`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between items-center text-[11px] text-slate-500 pt-0.5">
                            <span>المدفوع: <strong className="text-emerald-400">{c.paidFees.toLocaleString()} ج.م</strong></span>
                            <span>الإجمالي: <strong className="text-white">{c.fees.toLocaleString()} ج.م</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                        <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg font-mono">
                          {c.category}
                        </span>
                        <button
                          onClick={() => setSelectedCaseDetail(c)}
                          className="flex items-center gap-1.5 text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 px-3.5 py-2 rounded-xl transition font-semibold"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>تقرير PDF / تصوير البيانات</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* CLIENTS TAB */}
          {activeTab === 'clients' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">الموكلون والعملاء</h2>
                  <p className="text-xs text-slate-400">سجل العملاء، بيانات الاتصال، والقضايا المرتبطة بكل موكل</p>
                </div>
                <button
                  onClick={() => setShowNewClientModal(true)}
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-amber-500/20 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة موكل جديد</span>
                </button>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-right text-sm">
                  <thead className="bg-slate-800/80 text-slate-400 text-xs uppercase">
                    <tr>
                      <th className="p-4">اسم الموكل / الشركة</th>
                      <th className="p-4">النوع</th>
                      <th className="p-4">رقم الهاتف</th>
                      <th className="p-4">البريد الإلكتروني</th>
                      <th className="p-4">الرقم القومي / السجل</th>
                      <th className="p-4">تاريخ الانضمام</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {clients.map(cli => (
                      <tr key={cli.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-4 font-bold text-white flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xs">
                            {cli.name.substring(0, 2)}
                          </div>
                          <span>{cli.name}</span>
                        </td>
                        <td className="p-4">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${cli.type === 'شركة' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                            {cli.type}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-slate-300">{cli.phone}</td>
                        <td className="p-4 text-slate-300">{cli.email}</td>
                        <td className="p-4 font-mono text-xs text-slate-400">{cli.nationalId}</td>
                        <td className="p-4 text-xs text-slate-400">{cli.createdAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SESSIONS & VISUAL CALENDAR TAB */}
          {activeTab === 'sessions' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">التقويم القضائي والجلسات</h2>
                  <p className="text-xs text-slate-400">عرض بصري تفاعلي شهري وسنوي للمواعيد والجلسات في المحاكم</p>
                </div>

                <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl shadow-sm">
                  <button
                    onClick={() => setSessionViewMode('month')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${sessionViewMode === 'month' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'}`}
                  >
                    <Grid className="w-3.5 h-3.5" />
                    <span>تقويم شهري</span>
                  </button>
                  <button
                    onClick={() => setSessionViewMode('year')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${sessionViewMode === 'year' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'}`}
                  >
                    <CalendarIcon className="w-3.5 h-3.5" />
                    <span>تقويم سنوي</span>
                  </button>
                  <button
                    onClick={() => setSessionViewMode('list')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${sessionViewMode === 'list' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'}`}
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>قائمة الجلسات</span>
                  </button>
                </div>
              </div>

              {sessionViewMode === 'list' && (
                <div className="space-y-4">
                  {sessions.map(s => (
                    <div key={s.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-amber-500/30 transition">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex flex-col items-center justify-center shrink-0">
                          <CalendarIcon className="w-5 h-5 mb-1" />
                          <span className="text-[10px] font-mono font-bold">{s.date.split('-')[2]}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono bg-slate-800 text-amber-400 px-2 py-0.5 rounded">{s.caseNumber}</span>
                            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">{s.time}</span>
                          </div>
                          <h3 className="text-lg font-bold text-white mb-1">{s.caseTitle}</h3>
                          <p className="text-xs text-slate-400 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-500" />
                            <span>{s.court} — ملاحظة: {s.notes}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full font-medium">
                          {s.status}
                        </span>
                        <button
                          onClick={() => alert(`تم تفعيل التنبيه الآلي لجلسة ${s.caseNumber}`)}
                          className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-xl transition flex items-center gap-1.5"
                        >
                          <Bell className="w-3.5 h-3.5 text-amber-400" />
                          <span>ضبط تنبيه</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {sessionViewMode === 'month' && (() => {
                const year = calendarDate.getFullYear();
                const month = calendarDate.getMonth();
                const daysInMonth = getDaysInMonth(year, month);
                const firstDayIndex = getFirstDayOfMonth(year, month);

                const daysArray = [];
                for (let i = 0; i < firstDayIndex; i++) {
                  daysArray.push(null);
                }
                for (let d = 1; d <= daysInMonth; d++) {
                  const dayStr = String(d).padStart(2, '0');
                  const monthStr = String(month + 1).padStart(2, '0');
                  const dateString = `${year}-${monthStr}-${dayStr}`;
                  daysArray.push({ dayNumber: d, dateString });
                }

                return (
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-extrabold text-white">
                          {ARABIC_MONTHS[month]} {year}
                        </h3>
                        <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full font-medium">
                          {sessions.filter(s => s.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)).length} جلسات في هذا الشهر
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handlePrevMonth}
                          className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                          title="الشهر السابق"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setCalendarDate(new Date())}
                          className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
                        >
                          اليوم
                        </button>
                        <button
                          onClick={handleNextMonth}
                          className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                          title="الشهر القادم"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-2 text-center font-bold text-xs text-slate-400 pb-2 border-b border-slate-800">
                      {ARABIC_DAYS.map((dayName, idx) => (
                        <div key={idx} className="py-2">{dayName}</div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                      {daysArray.map((item, idx) => {
                        if (!item) {
                          return <div key={`empty-${idx}`} className="h-28 bg-slate-950/30 rounded-2xl border border-transparent"></div>;
                        }

                        const daySessions = sessions.filter(s => s.date === item.dateString);
                        const hasSessions = daySessions.length > 0;
                        const isToday = new Date().toISOString().split('T')[0] === item.dateString;

                        return (
                          <div
                            key={item.dateString}
                            onClick={() => {
                              if (hasSessions) {
                                setSelectedDaySessions({ date: item.dateString, sessions: daySessions });
                              }
                            }}
                            className={`h-28 rounded-2xl p-2.5 flex flex-col justify-between border transition cursor-pointer relative overflow-hidden ${isToday ? 'bg-amber-500/10 border-amber-500/50 shadow-md' : hasSessions ? 'bg-slate-800/80 border-amber-500/30 hover:border-amber-500' : 'bg-slate-950/50 border-slate-800/60 hover:bg-slate-800/40'}`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`text-xs font-mono font-bold ${isToday ? 'bg-amber-500 text-slate-950 px-2 py-0.5 rounded-md' : 'text-slate-300'}`}>
                                {item.dayNumber}
                              </span>
                              {hasSessions && (
                                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                              )}
                            </div>

                            <div className="space-y-1 overflow-y-auto max-h-16">
                              {daySessions.map(s => (
                                <div key={s.id} className="text-[10px] bg-amber-500/20 border border-amber-500/30 text-amber-300 px-1.5 py-0.5 rounded truncate font-medium">
                                  {s.time.split(' ')[0]} - {s.caseTitle}
                                </div>
                              ))}
                            </div>

                            {hasSessions && (
                              <div className="text-[9px] text-amber-400 font-semibold text-center mt-auto">
                                {daySessions.length} جلسة
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {sessionViewMode === 'year' && (() => {
                const year = calendarDate.getFullYear();

                return (
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-extrabold text-white">
                          التقويم السنوي للعام {year}
                        </h3>
                        <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full font-medium">
                          {sessions.filter(s => s.date.startsWith(String(year))).length} جلسة مجدولة خلال العام
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handlePrevYear}
                          className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                          title="السنة السابقة"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setCalendarDate(new Date())}
                          className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
                        >
                          العام الحالي
                        </button>
                        <button
                          onClick={handleNextYear}
                          className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                          title="السنة القادمة"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                      {ARABIC_MONTHS.map((monthName, mIdx) => {
                        const monthStr = String(mIdx + 1).padStart(2, '0');
                        const monthSessions = sessions.filter(s => s.date.startsWith(`${year}-${monthStr}`));
                        const daysInThisMonth = getDaysInMonth(year, mIdx);
                        const firstDayOfThisMonth = getFirstDayOfMonth(year, mIdx);

                        return (
                          <div
                            key={mIdx}
                            onClick={() => {
                              setCalendarDate(new Date(year, mIdx, 1));
                              setSessionViewMode('month');
                            }}
                            className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 hover:border-amber-500/50 transition cursor-pointer group shadow-sm"
                          >
                            <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
                              <h4 className="font-bold text-sm text-white group-hover:text-amber-400 transition">{monthName}</h4>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${monthSessions.length > 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-400'}`}>
                                {monthSessions.length} جلسة
                              </span>
                            </div>

                            <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-slate-500 mb-1">
                              <span>س</span><span>ح</span><span>ن</span><span>ث</span><span>ر</span><span>خ</span><span>ج</span>
                            </div>
                            <div className="grid grid-cols-7 gap-1 text-center text-[10px]">
                              {Array.from({ length: firstDayOfThisMonth }).map((_, i) => (
                                <div key={`m-empty-${i}`}></div>
                              ))}
                              {Array.from({ length: daysInThisMonth }).map((_, i) => {
                                const dNum = i + 1;
                                const dStr = String(dNum).padStart(2, '0');
                                const fullDate = `${year}-${monthStr}-${dStr}`;
                                const hasSes = sessions.some(s => s.date === fullDate);

                                return (
                                  <div
                                    key={dNum}
                                    className={`py-1 rounded-md font-mono ${hasSes ? 'bg-amber-500 text-slate-950 font-bold shadow-sm animate-pulse' : 'text-slate-300 hover:bg-slate-800'}`}
                                  >
                                    {dNum}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* DOCUMENTS TAB */}
          {activeTab === 'documents' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">خزنة المستندات والعقود</h2>
                  <p className="text-xs text-slate-400">رفع وإدارة ملفات الـ PDF، عقود الموكلين، والمستندات الرسمية</p>
                </div>
                <label className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-amber-500/20 transition cursor-pointer">
                  <Plus className="w-4 h-4" />
                  <span>رفع مستند جديد</span>
                  <input type="file" className="hidden" onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      const newDoc: DocumentItem = {
                        id: 'doc_' + Date.now(),
                        caseId: cases[0].id,
                        caseTitle: cases[0].title,
                        name: file.name,
                        type: file.name.split('.').pop()?.toUpperCase() || 'PDF',
                        size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
                        uploadDate: new Date().toISOString().split('T')[0]
                      };
                      setDocuments([newDoc, ...documents]);
                    }
                  }} />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map(doc => (
                  <div key={doc.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 hover:border-slate-700 transition flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center font-bold text-xs shrink-0">
                        {doc.type}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-white mb-1 line-clamp-1">{doc.name}</h3>
                        <p className="text-xs text-slate-400 mb-2">{doc.caseTitle}</p>
                        <div className="flex items-center gap-3 text-[10px] text-slate-500">
                          <span>الحجم: {doc.size}</span>
                          <span>•</span>
                          <span>{doc.uploadDate}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => alert(`جاري تحميل المستند: ${doc.name}`)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                      title="تحميل"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BILLING TAB */}
          {activeTab === 'billing' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">الأتعاب والحسابات المالية</h2>
                  <p className="text-xs text-slate-400">متابعة الفواتير، الأتعاب المحصلة، والمبالغ المستحقة على الموكلين</p>
                </div>
                <button
                  onClick={() => alert('إصدار فاتورة جديدة للموكل')}
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-amber-500/20 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>إصدار فاتورة أتعاب</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                  <span className="text-xs text-slate-400 block mb-1">إجمالي الأتعاب المحصلة</span>
                  <span className="text-2xl font-black text-emerald-400">{totalRevenue.toLocaleString()} ج.م</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                  <span className="text-xs text-slate-400 block mb-1">المبالغ المستحقة المعلقة</span>
                  <span className="text-2xl font-black text-amber-400">{totalOutstanding.toLocaleString()} ج.م</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                  <span className="text-xs text-slate-400 block mb-1">إجمالي القضايا المسعرة</span>
                  <span className="text-2xl font-black text-white">{(totalRevenue + totalOutstanding).toLocaleString()} ج.م</span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-right text-sm">
                  <thead className="bg-slate-800/80 text-slate-400 text-xs uppercase">
                    <tr>
                      <th className="p-4">رقم الفاتورة</th>
                      <th className="p-4">الموكل</th>
                      <th className="p-4">القضية</th>
                      <th className="p-4">المبلغ الإجمالي</th>
                      <th className="p-4">المدفوع</th>
                      <th className="p-4">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {invoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-4 font-mono font-bold text-amber-400">{inv.invoiceNumber}</td>
                        <td className="p-4 text-white font-medium">{inv.clientName}</td>
                        <td className="p-4 text-slate-300">{inv.caseTitle}</td>
                        <td className="p-4 font-mono text-white">{inv.amount.toLocaleString()} ج.م</td>
                        <td className="p-4 font-mono text-emerald-400">{inv.paid.toLocaleString()} ج.م</td>
                        <td className="p-4">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${inv.status === 'مدفوعة بالكامل' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ADVISOR TAB (AI LEGAL ADVISOR) */}
          {activeTab === 'advisor' && (
            <div className="h-full flex flex-col space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-amber-400" />
                    <span>المستشار القانوني الذكي (Gemini AI)</span>
                  </h2>
                  <p className="text-xs text-slate-400">مساعد قانوني ذكي مدعوم بالذكاء الاصطناعي لتحليل النصوص، صياغة المذكرات، والإجابة عن الاستفسارات القانونية.</p>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span className="text-xs text-emerald-400 font-medium">النظام جاهز للرد الفوري</span>
                </div>
              </div>

              <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-4 overflow-y-auto space-y-4 max-h-[500px]">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-amber-400 border border-slate-700'}`}>
                      {msg.role === 'user' ? 'أنت' : <Bot className="w-5 h-5" />}
                    </div>
                    <div className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-amber-500 text-slate-950 rounded-tl-none font-medium' : 'bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-tr-none'}`}>
                      <div className="whitespace-pre-wrap">{msg.text}</div>
                      <div className={`text-[10px] mt-2 text-right ${msg.role === 'user' ? 'text-slate-800' : 'text-slate-500'}`}>{msg.timestamp}</div>
                    </div>
                  </div>
                ))}
                {isAiLoading && (
                  <div className="flex gap-3 items-center text-slate-400 text-xs italic">
                    <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-amber-400">
                      <Bot className="w-4 h-4 animate-spin" />
                    </div>
                    <span>المستشار القانوني يقوم بصياغة الإجابة والبحث في السوابق القضائية...</span>
                  </div>
                )}
              </div>

              <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                <input
                  type="text"
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  placeholder="اكتب استشارتك القانونية هنا (مثال: ما هي شروط صحة دعوى صحة ونفاذ؟)..."
                  className="flex-1 bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-2xl px-4 py-3.5 text-sm text-white placeholder-slate-500 outline-none transition shadow-inner"
                />
                <button
                  type="submit"
                  disabled={isAiLoading || !inputPrompt.trim()}
                  className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold px-6 py-3.5 rounded-2xl text-sm shadow-lg shadow-amber-500/20 transition shrink-0"
                >
                  إرسال الاستشارة
                </button>
              </form>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-in fade-in duration-300 max-w-2xl">
              <div>
                <h2 className="text-2xl font-bold text-white">إعدادات النظام والربط السحابي</h2>
                <p className="text-xs text-slate-400">تكوين اتصال قاعدة بيانات Supabase، إعدادات البريد الإلكتروني، وتكامل الجلسات</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div>
                    <h3 className="font-bold text-white text-sm">حالة اتصال Supabase</h3>
                    <p className="text-xs text-slate-400">مشروع Supabase (zcpgpaxvszwlzlazlekf) متصل بنجاح</p>
                  </div>
                  <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    متصل
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">رابط Supabase URL</label>
                    <input
                      type="text"
                      readOnly
                      value="https://zcpgpaxvszwlzlazlekf.supabase.co"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">مفتاح Anon API Key</label>
                    <input
                      type="password"
                      readOnly
                      value="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 font-mono"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={() => alert('تم حفظ الإعدادات بنجاح')}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs transition"
                  >
                    حفظ التغييرات
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL: CASE DETAIL REPORT & PDF DOWNLOADER */}
      {selectedCaseDetail && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-8 shadow-2xl relative print:bg-white print:text-slate-900">
            <button
              onClick={() => setSelectedCaseDetail(null)}
              className="absolute top-5 left-5 text-slate-400 hover:text-white print:hidden"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Printable Report Header */}
            <div className="text-center pb-6 border-b border-slate-800 print:border-slate-300 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-2 print:text-amber-700">
                <Scale className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-white print:text-slate-900">ملف وطباعة تقرير القضية الرسمية</h3>
              <p className="text-xs text-slate-400 print:text-slate-600">نظام المحامي الذكي لإدارة المحاماة والاستشارات القانونية</p>
            </div>

            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800 print:bg-slate-50 print:border-slate-200">
                <div>
                  <span className="text-xs text-slate-500 block">عنوان القضية:</span>
                  <strong className="text-white print:text-slate-900">{selectedCaseDetail.title}</strong>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">رقم القيد / القضية:</span>
                  <strong className="text-amber-400 print:text-amber-800 font-mono">{selectedCaseDetail.caseNumber}</strong>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">الموكل:</span>
                  <strong className="text-white print:text-slate-900">{selectedCaseDetail.clientName}</strong>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">المحكمة والائرة:</span>
                  <strong className="text-white print:text-slate-900">{selectedCaseDetail.court} - {selectedCaseDetail.circuit}</strong>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">الحالة:</span>
                  <strong className="text-emerald-400 print:text-emerald-700">{selectedCaseDetail.status}</strong>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">الجلسة القادمة:</span>
                  <strong className="text-amber-400 font-mono">{selectedCaseDetail.nextSessionDate}</strong>
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-500 block mb-1">وصف النزاع والطلبات:</span>
                <p className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-slate-300 print:bg-slate-50 print:border-slate-200 print:text-slate-800 text-xs leading-relaxed">
                  {selectedCaseDetail.description}
                </p>
              </div>

              {/* Financial Breakdown in Report */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 print:bg-slate-50 print:border-slate-200 space-y-2">
                <h4 className="font-bold text-xs text-amber-400 print:text-amber-800 uppercase">البيان المالي والأتعاب</h4>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 block">إجمالي الأتعاب:</span>
                    <strong className="text-white print:text-slate-900 font-mono">{selectedCaseDetail.fees.toLocaleString()} ج.م</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">المحصل:</span>
                    <strong className="text-emerald-400 font-mono">{selectedCaseDetail.paidFees.toLocaleString()} ج.م</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">المتبقي:</span>
                    <strong className="text-amber-400 font-mono">{(selectedCaseDetail.fees - selectedCaseDetail.paidFees).toLocaleString()} ج.م</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-800 print:border-slate-300 flex items-center justify-between print:hidden">
              <button
                onClick={() => setSelectedCaseDetail(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition"
              >
                إغلاق
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 transition"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة أو حفظ كملف PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DAY SESSIONS DETAILS */}
      {selectedDaySessions && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedDaySessions(null)}
              className="absolute top-5 left-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 mb-1 text-amber-400">
              <CalendarIcon className="w-5 h-5" />
              <h3 className="text-lg font-bold text-white">جلسات يوم {selectedDaySessions.date}</h3>
            </div>
            <p className="text-xs text-slate-400 mb-5">جميع الجلسات القضائية المجدولة في هذا التاريخ</p>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {selectedDaySessions.sessions.map(s => (
                <div key={s.id} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono bg-amber-500/10 text-amber-400 px-2.5 py-0.5 rounded font-semibold">{s.caseNumber}</span>
                    <span className="text-xs text-slate-300 bg-slate-800 px-2 py-0.5 rounded">{s.time}</span>
                  </div>
                  <h4 className="font-bold text-sm text-white">{s.caseTitle}</h4>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>{s.court}</span>
                  </p>
                  <p className="text-xs text-amber-300/80 bg-amber-500/10 p-2 rounded-xl">ملاحظة: {s.notes}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedDaySessions(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NEW CASE */}
      {showNewCaseModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowNewCaseModal(false)}
              className="absolute top-5 left-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-white mb-1">تسجيل قضية جديدة</h3>
            <p className="text-xs text-slate-400 mb-5">أدخل تفاصيل الدعوى القضائية والبيانات المرتبطة بها</p>

            <form onSubmit={handleCreateCase} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">عنوان القضية / موضوع النزاع</label>
                <input
                  type="text"
                  required
                  value={newCase.title}
                  onChange={e => setNewCase({ ...newCase, title: e.target.value })}
                  placeholder="مثال: دعوى صحة ونفاذ عقد بيع"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">رقم القضية / القيد</label>
                  <input
                    type="text"
                    required
                    value={newCase.caseNumber}
                    onChange={e => setNewCase({ ...newCase, caseNumber: e.target.value })}
                    placeholder="1425/2025"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">تصنيف القضية</label>
                  <select
                    value={newCase.category}
                    onChange={e => setNewCase({ ...newCase, category: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
                  >
                    <option value="مدني">مدني</option>
                    <option value="جنائي">جنائي</option>
                    <option value="تجاري">تجاري</option>
                    <option value="عمالي">عمالي</option>
                    <option value="أحوال شخصية">أحوال شخصية</option>
                    <option value="إداري">إداري</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">الموكل</label>
                  <select
                    value={newCase.clientId}
                    onChange={e => setNewCase({ ...newCase, clientId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
                  >
                    <option value="">اختر الموكل</option>
                    {clients.map(cl => (
                      <option key={cl.id} value={cl.id}>{cl.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">المحكمة</label>
                  <input
                    type="text"
                    value={newCase.court}
                    onChange={e => setNewCase({ ...newCase, court: e.target.value })}
                    placeholder="محكمة استئناف القاهرة"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">تاريخ الجلسة القادمة</label>
                  <input
                    type="date"
                    value={newCase.nextSessionDate}
                    onChange={e => setNewCase({ ...newCase, nextSessionDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">إجمالي الأتعاب (ج.م)</label>
                  <input
                    type="number"
                    value={newCase.fees}
                    onChange={e => setNewCase({ ...newCase, fees: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">تفاصيل وطلبات الدعوى</label>
                <textarea
                  rows={3}
                  value={newCase.description}
                  onChange={e => setNewCase({ ...newCase, description: e.target.value })}
                  placeholder="اكتب نبذة عن موضوع النزاع والطلبات العارضة..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewCaseModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition"
                >
                  حفظ القضية
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NEW CLIENT */}
      {showNewClientModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowNewClientModal(false)}
              className="absolute top-5 left-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-white mb-1">إضافة موكل جديد</h3>
            <p className="text-xs text-slate-400 mb-5">أدخل بيانات الموكل أو الشركة لطرق التواصل والقضايا</p>

            <form onSubmit={handleCreateClient} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">اسم الموكل / الشركة</label>
                <input
                  type="text"
                  required
                  value={newClient.name}
                  onChange={e => setNewClient({ ...newClient, name: e.target.value })}
                  placeholder="محمد أحمد الشريف"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">رقم الهاتف</label>
                  <input
                    type="text"
                    required
                    value={newClient.phone}
                    onChange={e => setNewClient({ ...newClient, phone: e.target.value })}
                    placeholder="01012345678"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">نوع الموكل</label>
                  <select
                    value={newClient.type}
                    onChange={e => setNewClient({ ...newClient, type: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
                  >
                    <option value="فرد">فرد</option>
                    <option value="شركة">شركة</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={newClient.email}
                  onChange={e => setNewClient({ ...newClient, email: e.target.value })}
                  placeholder="client@example.com"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">الرقم القومي / السجل التجاري</label>
                <input
                  type="text"
                  value={newClient.nationalId}
                  onChange={e => setNewClient({ ...newClient, nationalId: e.target.value })}
                  placeholder="2980101..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewClientModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition"
                >
                  حفظ الموكل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
