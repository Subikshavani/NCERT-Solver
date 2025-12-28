import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    MessageSquare,
    BookOpen,
    ClipboardCheck,
    Settings,
    HelpCircle,
    Search,
    Bell,
    ChevronRight,
    GraduationCap,
    Beaker,
    History,
    Languages,
    ArrowRight,
    Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { logProgress, getStudentOverview, getRecentActivity, auth, logoutUser } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import AuthScreen from './components/AuthScreen';

/** Utility for Tailwind class merging */
function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// --- Components ---

const Sidebar = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) => {
    const navItems = [
        { id: 'home', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'solver', label: 'AI Solver', icon: MessageSquare },
        { id: 'library', label: 'Library', icon: BookOpen },
        { id: 'assess', label: 'Assess', icon: ClipboardCheck },
    ];

    return (
        <aside className="w-72 border-r border-white/5 bg-background flex flex-col sticky top-0 h-screen p-8 z-50">
            <div className="flex items-center gap-2 mb-12">
                <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                    <GraduationCap className="text-white w-5 h-5" />
                </div>
                <span className="text-xl font-serif font-bold tracking-tight">
                    NCERT<span className="text-accent">AI</span>
                </span>
            </div>

            <nav className="flex-1 space-y-2">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={cn(
                            "w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group",
                            activeTab === item.id
                                ? "bg-accent/10 text-white shadow-[0_0_20px_rgba(99,102,241,0.1)]"
                                : "text-text-dim hover:text-white hover:bg-white/5"
                        )}
                    >
                        <item.icon className={cn(
                            "w-5 h-5 transition-transform duration-300 group-hover:scale-110",
                            activeTab === item.id ? "text-accent" : "text-text-dim group-hover:text-white"
                        )} />
                        <span className="text-sm font-medium tracking-wide">{item.label}</span>
                        {activeTab === item.id && (
                            <motion.div
                                layoutId="activeTab"
                                className="ml-auto w-1.5 h-1.5 rounded-full bg-accent"
                            />
                        )}
                    </button>
                ))}
            </nav>

            <div className="mt-auto pt-8 border-t border-white/5 space-y-2">
                <button className="w-full flex items-center gap-4 px-4 py-3 text-text-dim hover:text-white transition-colors text-sm">
                    <Settings className="w-5 h-5" />
                    <span>Settings</span>
                </button>
                <button className="w-full flex items-center gap-4 px-4 py-3 text-text-dim hover:text-white transition-colors text-sm">
                    <HelpCircle className="w-5 h-5" />
                    <span>Support</span>
                </button>
            </div>
        </aside>
    );
};

const Dashboard = ({ studentId }: { studentId: string }) => {
    const [stats, setStats] = useState<any>(null);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!studentId) return;
            setLoading(true);
            const overview = await getStudentOverview(studentId);
            const activity = await getRecentActivity(studentId, 3);
            setStats(overview);
            setRecentActivity(activity);
            setLoading(false);
        };
        fetchDashboardData();
    }, [studentId]);

    const readiness = stats?.readiness || 65;
    const progressLabel = readiness > 80 ? "Excellent" : (readiness > 60 ? "On Track" : "Needs Review");

    if (loading) {
        return (
            <div className="space-y-12 animate-pulse">
                <div className="h-20 bg-white/5 w-1/2 rounded-2xl" />
                <div className="grid grid-cols-1 md:grid-cols-4 auto-rows-[200px] gap-6">
                    <div className="md:col-span-2 md:row-span-2 bg-white/5 rounded-3xl" />
                    <div className="md:col-span-2 bg-white/5 rounded-3xl" />
                    <div className="bg-white/5 rounded-3xl" />
                    <div className="bg-white/5 rounded-3xl" />
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="space-y-12"
        >
            <header>
                <span className="section-label">Academic Intelligence</span>
                <h1 className="text-6xl md:text-7xl font-serif leading-tight">
                    Your Progress <br />Overview.
                </h1>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 auto-rows-[200px] gap-6">
                <div className="md:col-span-2 md:row-span-2 premium-card flex flex-col justify-between group overflow-hidden">
                    <div className="flex justify-between items-start z-10">
                        <div className="p-3 bg-accent/10 rounded-2xl group-hover:bg-accent/20 transition-colors">
                            <LayoutDashboard className="text-accent w-8 h-8" />
                        </div>
                        <span className="bg-accent/10 text-accent text-[10px] px-2 py-1 rounded font-bold uppercase tracking-widest">Live Sync</span>
                    </div>

                    <div className="z-10">
                        <h3 className="text-2xl mb-2">Overall Readiness</h3>
                        <p className="text-text-dim text-sm max-w-xs">{progressLabel} — Analysis across all subjects based on {stats?.doubtsAsked || 0} doubts and {stats?.quizzesCompleted || 0} quizzes.</p>
                    </div>

                    <div className="space-y-4 z-10">
                        <div className="flex justify-between items-end">
                            <span className="text-5xl font-serif">{readiness}<span className="text-2xl opacity-50">%</span></span>
                            <span className="text-xs text-accent">Personalized Score</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${readiness}%` }}
                                transition={{ duration: 1.5, delay: 0.5 }}
                                className="h-full bg-gradient-to-r from-accent to-indigo-400"
                            />
                        </div>
                    </div>

                    {/* Decorative background element */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent/5 blur-[80px] rounded-full pointer-events-none group-hover:bg-accent/10 transition-colors" />
                </div>

                <div className="md:col-span-2 premium-card flex items-center gap-6 group">
                    <div className="p-4 bg-emerald-500/10 rounded-2xl group-hover:bg-emerald-500/20 transition-colors">
                        <Beaker className="text-emerald-500 w-8 h-8" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg">Science Mastery</h3>
                        <p className="text-text-dim text-xs">{stats?.lessonsMastered || 0} Lessons Mastered</p>
                    </div>
                    <div className="w-12 h-12 rounded-full border-2 border-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-500">
                        85%
                    </div>
                </div>

                <div className="md:col-span-2 premium-card flex flex-col justify-center gap-2 group">
                    <span className="text-[10px] text-text-dim uppercase tracking-widest font-bold">Recent Learning</span>
                    <div className="space-y-3">
                        {recentActivity.length > 0 ? recentActivity.map((act, id) => (
                            <div key={id} className="flex items-center gap-3 text-sm">
                                <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                                <span className="text-text-dim line-clamp-1">
                                    {act.type === 'lesson_start' ? `Started studying ${act.title}` : `Asked about ${act.query}`}
                                </span>
                            </div>
                        )) : (
                            <p className="text-text-dim text-xs italic">Start a lesson to see your activity here.</p>
                        )}
                    </div>
                </div>

                <div className="premium-card flex flex-col justify-between group">
                    <div className="p-3 bg-orange-500/10 rounded-xl w-fit group-hover:bg-orange-500/20 transition-colors">
                        <GraduationCap className="text-orange-500 w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-md">Assessments</h3>
                        <p className="text-text-dim text-[10px]">{stats?.quizzesCompleted || 0} Completed</p>
                    </div>
                </div>

                <div className="premium-card flex flex-col justify-between group">
                    <div className="p-3 bg-pink-500/10 rounded-xl w-fit group-hover:bg-pink-500/20 transition-colors">
                        <Languages className="text-pink-500 w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-md">Doubts Solved</h3>
                        <p className="text-text-dim text-[10px]">{stats?.doubtsAsked || 0} Questions asked</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

type Message = {
    role: 'user' | 'bot';
    content: string;
    citations: any[];
    lang?: string;
};

const Solver = ({ activeChapter, clearChapter, studentId }: { activeChapter: any | null, clearChapter: () => void, studentId: string }) => {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'bot', content: activeChapter
                ? `Hello! I'm ready to help you with ${activeChapter.title}. What would you like to know about this lesson?`
                : "Hello! I'm your NCERT assistant. Select a chapter from the Library to start a focused study session, or ask me anything!",
            citations: []
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Reset messages when activeChapter changes
    useEffect(() => {
        setMessages([{
            role: 'bot',
            content: activeChapter
                ? `Ready to study: ${activeChapter.title}. How can I assist you with this chapter?`
                : "Hello! I'm your NCERT assistant. Select a chapter from the Library to start a focused study session, or ask me anything!",
            citations: []
        } as Message]);
    }, [activeChapter]);

    const handleSend = async () => {
        if (!input || isLoading) return;

        const userMsg: Message = { role: 'user', content: input, citations: [] };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:8000/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: input,
                    filename: activeChapter?.filename,
                    subject: activeChapter?.subject,
                    grade: activeChapter?.grade
                })
            });
            const data = await response.json();

            // Log doubt to Firebase
            logProgress(studentId, 'doubt_asked', {
                query: input,
                chapter: activeChapter?.title || 'General',
                subject: activeChapter?.subject || 'General'
            });

            setMessages(prev => [...prev, {
                role: 'bot',
                content: data.answer,
                citations: data.citations || [],
                lang: data.detected_language
            } as Message]);
        } catch (e) {
            setMessages(prev => [...prev, { role: 'bot', content: "Connection interrupted. Please verify that the local intelligence engine is active.", citations: [] } as Message]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-[calc(100vh-8rem)] flex flex-col max-w-5xl mx-auto"
        >
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <span className="section-label">AI Study Assistant</span>
                    <h2 className="text-4xl font-serif">
                        {activeChapter ? (
                            <span className="flex items-center gap-3">
                                <BookOpen className="w-8 h-8 text-accent" />
                                {activeChapter.title}
                            </span>
                        ) : 'Doubt Solver'}
                    </h2>
                </div>
                {activeChapter && (
                    <button
                        onClick={clearChapter}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs uppercase tracking-widest text-text-dim hover:text-white transition-colors border border-white/5"
                    >
                        Reset Context
                    </button>
                )}
            </header>

            <div className="flex-1 overflow-y-auto pr-4 space-y-8 no-scrollbar">
                {messages.map((m, i) => (
                    <motion.div
                        initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={i}
                        className={cn(
                            "max-w-3xl p-6 relative group transition-colors",
                            m.role === 'bot'
                                ? "bg-card border border-white/5 border-l-accent"
                                : "bg-accent/10 border border-accent/20 ml-auto"
                        )}
                    >
                        <div className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</div>
                        {m.role === 'bot' && m.citations && m.citations.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-2">
                                {m.citations.map((c: any, ci: number) => (
                                    <span key={ci} className="text-[10px] text-text-dim px-2 py-1 bg-white/5 rounded border border-white/5">
                                        Source: {c.source} (p. {c.page})
                                    </span>
                                ))}
                            </div>
                        )}
                        <div className={cn(
                            "absolute top-0 bottom-0 w-0.5 transition-transform duration-500 group-hover:scale-y-110",
                            m.role === 'bot' ? "left-[-1px] bg-accent" : "right-[-1px] bg-accent"
                        )} />
                    </motion.div>
                ))}
                {isLoading && (
                    <div className="bg-card border border-white/5 border-l-accent p-6 max-w-3xl opacity-50 animate-pulse">
                        Processing inquiry...
                    </div>
                )}
            </div>

            <div className="mt-8 pt-8 border-t border-white/5">
                <div className="relative group">
                    <input
                        className="w-full bg-transparent border-b border-white/20 pb-4 text-xl font-light focus:outline-none focus:border-accent transition-colors placeholder:text-white/10"
                        placeholder="Search textbook knowledge..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading}
                        className="absolute right-0 bottom-4 text-white hover:text-accent transition-colors disabled:opacity-30"
                    >
                        {isLoading ? "..." : <ArrowRight className="w-6 h-6 border p-1 rounded-full" />}
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

const GradeSelector = ({ current, onChange }: { current: number, onChange: (grade: number) => void }) => (
    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 w-fit">
        {[5, 6, 7, 8, 9, 10].map(grade => (
            <button
                key={grade}
                onClick={() => onChange(grade)}
                className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300",
                    current === grade
                        ? "bg-accent text-white shadow-lg shadow-accent/20"
                        : "text-text-dim hover:text-white"
                )}
            >
                Class {grade}
            </button>
        ))}
    </div>
);

const Library = ({ onSelectChapter, selectedGrade, setSelectedGrade }: { onSelectChapter: (chapter: any) => void, selectedGrade: number, setSelectedGrade: (grade: number) => void }) => {
    const [libraryData, setLibraryData] = useState<{ subject: string, chapters: any[] }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLibrary = async () => {
            try {
                const response = await fetch('http://localhost:8000/library');
                const data = await response.json();
                setLibraryData(data.subjects || []);
            } catch (e) {
                console.error("Failed to fetch library:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchLibrary();
    }, []);

    const getSubjectIcon = (subject: string) => {
        const s = subject.toLowerCase();
        if (s.includes('science')) return Beaker;
        if (s.includes('math')) return GraduationCap;
        if (s.includes('social') || s.includes('history') || s.includes('politics')) return History;
        if (s.includes('english') || s.includes('hindi')) return Languages;
        return BookOpen;
    };

    const getSubjectGradient = (subject: string) => {
        const s = subject.toLowerCase();
        if (s.includes('science')) return 'from-blue-900 to-indigo-950';
        if (s.includes('math')) return 'from-slate-900 to-gray-950';
        if (s.includes('social') || s.includes('history') || s.includes('politics')) return 'from-emerald-900 to-teal-950';
        if (s.includes('english') || s.includes('hindi')) return 'from-purple-900 to-fuchsia-950';
        return 'from-gray-800 to-gray-900';
    };

    const filteredData = libraryData
        .map(group => ({
            ...group,
            chapters: group.chapters.filter(c => parseInt(c.grade) === selectedGrade)
        }))
        .filter(group => group.chapters.length > 0);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12 pb-20"
        >
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div>
                    <span className="section-label">NCERT Archives</span>
                    <h1 className="text-6xl font-serif leading-tight">Academic <br />Knowledge.</h1>
                </div>
                <GradeSelector current={selectedGrade} onChange={setSelectedGrade} />
            </header>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="aspect-[2/3] bg-white/5 animate-pulse rounded-lg" />
                    ))}
                </div>
            ) : (
                <div className="space-y-16">
                    {filteredData.length > 0 ? (
                        filteredData.map((subjectGroup, sidx) => (
                            <section key={sidx} className="space-y-8">
                                <h3 className="text-2xl font-serif border-b border-white/5 pb-4 flex items-center gap-3">
                                    {subjectGroup.subject}
                                    <span className="text-xs font-sans text-text-dim uppercase tracking-widest mt-1">
                                        ({subjectGroup.chapters.length} Chapters)
                                    </span>
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                                    {subjectGroup.chapters.map((chapter) => {
                                        const Icon = getSubjectIcon(subjectGroup.subject);
                                        const gradient = getSubjectGradient(subjectGroup.subject);
                                        return (
                                            <motion.div
                                                whileHover={{ y: -10 }}
                                                key={chapter.id}
                                                className="group cursor-pointer"
                                                onClick={() => onSelectChapter({ ...chapter, subject: subjectGroup.subject })}
                                            >
                                                <div className="aspect-[2/3] relative rounded-lg overflow-hidden border border-white/10 mb-4 bg-card transition-all duration-500 group-hover:border-accent/50 group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)]">
                                                    <div className={cn("absolute inset-0 bg-gradient-to-br opacity-40 group-hover:opacity-100 transition-opacity", gradient)} />
                                                    <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                                                        <Icon className="absolute w-24 h-24 text-white/5 group-hover:scale-110 transition-transform duration-500" />
                                                        <h4 className="text-lg font-serif text-white relative z-10 line-clamp-4 leading-snug">
                                                            {chapter.title}
                                                        </h4>
                                                    </div>
                                                    <div className="absolute bottom-4 left-6 right-6">
                                                        <span className="text-[10px] uppercase tracking-[0.2em] text-white/60 mb-1 block">Class {chapter.grade}</span>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center px-1">
                                                    <span className="text-[9px] text-text-dim uppercase tracking-widest">{chapter.filename}</span>
                                                    <ArrowRight className="w-4 h-4 text-text-dim group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </section>
                        ))
                    ) : (
                        <div className="text-center py-32 premium-card bg-white/[0.02] border-dashed">
                            <Sparkles className="w-12 h-12 mx-auto mb-6 text-accent/20" />
                            <h3 className="text-2xl font-serif mb-2">Expanding Class {selectedGrade}</h3>
                            <p className="text-text-dim max-w-sm mx-auto">
                                Our collectors are currently indexing Class {selectedGrade} content. Class 10 is fully available for your session.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    );
};

const Assessment = ({ studentId }: { studentId: string }) => {
    const [loading, setLoading] = useState(false);
    const [assessment, setAssessment] = useState<any>(null);

    const generateAssessment = async (topic: string) => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8000/assessment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: topic })
            });
            const data = await response.json();
            setAssessment(data);

            // Log assessment completion to Firebase
            logProgress(studentId, 'assessment_done', {
                topic: topic,
                quizSize: data.quiz?.questions?.length || 0
            });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-12 pb-12"
        >
            <header>
                <span className="section-label">Diagnostic Hub</span>
                <h1 className="text-6xl font-serif leading-tight">Skill <br />Assessment.</h1>
            </header>

            {!assessment && !loading && (
                <div
                    onClick={() => generateAssessment("Photosynthesis")}
                    className="premium-card max-w-2xl cursor-pointer group"
                >
                    <h3 className="text-2xl mb-4 group-hover:text-accent transition-colors">Generate Dynamic Quiz</h3>
                    <p className="text-text-dim leading-relaxed mb-8">
                        Our AI will synthesize a custom diagnostic test based on your recent activity in <b>Photosynthesis</b>.
                    </p>
                    <div className="flex items-center gap-2 text-accent font-medium">
                        <span>Begin Evaluation</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                </div>
            )}

            {loading && (
                <div className="space-y-4">
                    <div className="h-8 bg-white/5 animate-pulse w-1/3 rounded" />
                    <div className="h-32 bg-white/5 animate-pulse w-full rounded" />
                </div>
            )}

            <AnimatePresence>
                {assessment && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="space-y-12"
                    >
                        <section>
                            <h3 className="section-label mb-6">Flash Memory Cards</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {assessment.flashcards.map((f: any, i: number) => (
                                    <div key={i} className="bg-card border border-white/5 p-6 rounded hover:border-white/10 transition-colors">
                                        <p className="font-semibold mb-2">{f.q}</p>
                                        <p className="text-sm text-text-dim">{f.a}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="premium-card bg-accent/5 border-accent/20">
                            <h3 className="section-label mb-6 text-accent">Active Quiz Question</h3>
                            <p className="text-2xl font-serif mb-8">{assessment.quiz.q}</p>
                            <div className="grid gap-3">
                                {assessment.quiz.options.map((opt: string, i: number) => (
                                    <button
                                        key={i}
                                        className="w-full text-left p-4 border border-white/10 hover:border-accent hover:bg-accent/10 transition-all rounded transition-colors text-sm"
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </section>

                        <button
                            className="text-text-dim hover:text-white transition-colors flex items-center gap-2"
                            onClick={() => setAssessment(null)}
                        >
                            <span>Discard Results</span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// --- Main App ---

const App: React.FC = () => {
    const [activeTab, setActiveTab] = useState('home');
    const [activeChapter, setActiveChapter] = useState<any | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedGrade, setSelectedGrade] = useState<number>(10);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleSelectChapter = (chapter: any) => {
        if (!user) return;
        setActiveChapter(chapter);
        setActiveTab('solver');
        // Log lesson start to Firebase
        logProgress(user.uid, 'lesson_start', {
            title: chapter.title,
            filename: chapter.filename,
            subject: chapter.subject
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex bg-background min-h-screen text-white font-sans selection:bg-accent/30 selection:text-white">
            <AnimatePresence>
                {!user && <AuthScreen />}
            </AnimatePresence>

            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

            <main className="flex-1 p-12 overflow-y-auto">
                <AnimatePresence mode="wait">
                    {activeTab === 'home' && user && <Dashboard key="home" studentId={user.uid} />}
                    {activeTab === 'solver' && user && (
                        <Solver
                            key="solver"
                            activeChapter={activeChapter}
                            clearChapter={() => setActiveChapter(null)}
                            studentId={user.uid}
                        />
                    )}
                    {activeTab === 'library' && (
                        <Library
                            key="library"
                            onSelectChapter={handleSelectChapter}
                            selectedGrade={selectedGrade}
                            setSelectedGrade={setSelectedGrade}
                        />
                    )}
                    {activeTab === 'assess' && user && <Assessment key="assess" studentId={user.uid} />}
                </AnimatePresence>
            </main>

            {/* Global User Menu / Logout */}
            {user && (
                <div className="fixed bottom-8 left-8 z-[60] group">
                    <button
                        onClick={() => logoutUser()}
                        className="bg-white/5 border border-white/10 p-4 rounded-xl text-text-dim hover:text-white hover:bg-white/10 transition-all flex items-center gap-3 backdrop-blur-md"
                    >
                        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-[10px] font-bold text-accent">
                            {user.email?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Student Session</p>
                            <p className="text-xs truncate max-w-[120px]">{user.email || "Anonymous"}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default App;
