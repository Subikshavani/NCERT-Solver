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
    ArrowLeft,
    Sparkles,
    Zap,
    Trophy,
    Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { logProgress, getStudentOverview, getRecentActivity, auth, logoutUser } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import AuthScreen from './components/AuthScreen';
import OnboardingScreen from './components/OnboardingScreen';
import ProfileSettings from './components/ProfileSettings';

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
                <button
                    onClick={() => setActiveTab('settings')}
                    className={cn(
                        "w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300",
                        activeTab === 'settings' ? "bg-accent/10 text-white shadow-[0_0_20px_rgba(99,102,241,0.1)]" : "text-text-dim hover:text-white"
                    )}
                >
                    <Settings className={cn("w-5 h-5", activeTab === 'settings' ? "text-accent" : "text-text-dim")} />
                    <span className="text-sm">Settings</span>
                </button>
                <button className="w-full flex items-center gap-4 px-4 py-3 text-text-dim hover:text-white transition-colors text-sm">
                    <HelpCircle className="w-5 h-5" />
                    <span>Support</span>
                </button>
            </div>
        </aside>
    );
};

const Dashboard = ({ studentId, profile, onSelectChapter }: { studentId: string, profile: any, onSelectChapter: (chapter: any) => void }) => {
    const [stats, setStats] = useState<any>(null);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [mission, setMission] = useState<any>(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!studentId) return;
            setLoading(true);
            const overview = await getStudentOverview(studentId);
            const activity = await getRecentActivity(studentId, 5);
            setStats(overview);
            setRecentActivity(activity);

            // Fetch Daily Mission
            try {
                const subjMastery: any = {};
                ['Science', 'Mathematics', 'English', 'Social Science'].forEach((s, idx) => {
                    subjMastery[s] = Math.floor(((studentId.charCodeAt(idx % studentId.length) % 40) + 40));
                });

                const res = await fetch('http://localhost:8000/mission', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        displayName: profile?.displayName || 'Student',
                        readiness: 60 + Math.min(20, (overview?.lessonsMastered || 0) * 5),
                        subjects_mastery: subjMastery,
                        recent_activity: activity,
                        persona: profile?.studyPersona || 'explorer'
                    })
                });
                const missionData = await res.json();
                setMission(missionData);
            } catch (e) {
                console.error("Mission fetch failed:", e);
            }

            setLoading(false);
        };
        fetchDashboardData();
    }, [studentId, profile]);

    const lessonsScore = Math.min(20, (stats?.lessonsMastered || 0) * 5);
    const doubtsScore = Math.min(10, (stats?.doubtsAsked || 0) * 1);
    const quizzesScore = Math.min(10, (stats?.quizzesCompleted || 0) * 2);
    const readiness = 60 + lessonsScore + doubtsScore + quizzesScore;

    const progressLabel = readiness > 80 ? "Excellent" : (readiness > 70 ? "On Track" : "Needs Review");
    const lastLesson = recentActivity.find(a => a.type === 'lesson_start');

    // Daily dedication calculation
    const dailyGoal = profile?.dailyGoalMinutes || 30;
    const currentProgress = Math.min(dailyGoal, (stats?.doubtsAsked || 0) * 5 + (stats?.quizzesCompleted || 0) * 10);
    const progressPercentage = Math.round((currentProgress / dailyGoal) * 100);

    const getPersonaBranding = (persona: string) => {
        switch (persona) {
            case 'sprinter': return { color: 'text-orange-400', bg: 'bg-orange-400/10', icon: Zap, label: 'The Sprinter' };
            case 'architect': return { color: 'text-accent', bg: 'bg-accent/10', icon: BookOpen, label: 'The Architect' };
            case 'analyst': return { color: 'text-emerald-400', bg: 'bg-emerald-400/10', icon: Trophy, label: 'The Analyst' };
            default: return { color: 'text-white/40', bg: 'bg-white/5', icon: Sparkles, label: 'Explorer' };
        }
    };

    const persona = getPersonaBranding(profile?.studyPersona);

    const subjectIcons: Record<string, any> = {
        'Science': Beaker,
        'Mathematics': GraduationCap,
        'English': Languages,
        'Social Science': History
    };

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
            transition={{ duration: 0.5 }}
            className="space-y-12"
        >
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="section-label mb-0">Academic Intelligence • {profile?.academicBoard || 'CBSE'}</span>
                    </div>
                    <h1 className="text-6xl md:text-7xl font-serif leading-tight">
                        Welcome back, <br /><span className="text-accent">{profile?.displayName?.split(' ')[0] || 'Student'}</span>.
                    </h1>
                </div>

                <div className={cn("hidden md:flex items-center gap-4 p-4 rounded-3xl border border-white/5", persona.bg)}>
                    <div className={cn("p-3 rounded-2xl", persona.bg)}>
                        <persona.icon className={cn("w-6 h-6", persona.color)} />
                    </div>
                    <div>
                        <span className="text-[10px] uppercase font-bold tracking-widest opacity-50 block">Identity</span>
                        <span className={cn("text-sm font-bold", persona.color)}>{persona.label}</span>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 auto-rows-[200px] gap-6">
                {/* Daily Mission Card - NEW */}
                {mission && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="md:col-span-4 premium-card bg-accent/5 border-accent/20 flex flex-col md:flex-row items-center justify-between gap-6 group hover:bg-accent/10 transition-all cursor-pointer shadow-[0_4px_20px_rgba(var(--accent-rgb),0.1)]"
                    >
                        <div className="flex items-center gap-6">
                            <div className="p-4 bg-accent/10 rounded-2xl group-hover:scale-110 transition-transform">
                                <Target className="w-8 h-8 text-accent" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-accent">Active Mission</span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
                                </div>
                                <h3 className="text-xl font-serif">{mission.mission_title}</h3>
                                <p className="text-sm text-text-dim max-w-xl">{mission.description}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <span className="text-[10px] uppercase font-bold tracking-widest opacity-40 block">Reward</span>
                                <span className="font-bold text-accent">+{mission.reward_points} XP</span>
                            </div>
                            <button className="p-3 bg-accent text-white rounded-xl hover:bg-accent/90 transition-colors">
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </motion.div>
                )}

                <div className="md:col-span-2 md:row-span-2 premium-card flex flex-col justify-between group overflow-hidden">
                    <div className="flex justify-between items-start z-10">
                        <div className="p-3 bg-accent/10 rounded-2xl group-hover:bg-accent/20 transition-colors">
                            <LayoutDashboard className="text-accent w-8 h-8" />
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="bg-accent/10 text-accent text-[10px] px-2 py-1 rounded font-bold uppercase tracking-widest mb-2">Live Progress</span>
                            <span className="text-[10px] text-text-dim uppercase tracking-widest">{profile?.primaryGoal || 'General Study'}</span>
                        </div>
                    </div>

                    <div className="z-10">
                        <h3 className="text-3xl font-serif mb-2">Readiness Score</h3>
                        <p className="text-text-dim text-sm max-w-xs">{progressLabel} — Calculated from lessons mastered (+{lessonsScore}%), doubts asked (+{doubtsScore}%), and quizzes done (+{quizzesScore}%).</p>
                    </div>

                    <div className="space-y-4 z-10">
                        <div className="flex justify-between items-end">
                            <span className="text-6xl font-serif">{readiness}<span className="text-2xl opacity-50">%</span></span>
                            <div className="text-right">
                                <span className="text-[10px] text-text-dim uppercase tracking-widest block font-bold">Class Average</span>
                                <span className="text-xs text-white/40">~ 72%</span>
                            </div>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${readiness}%` }}
                                transition={{ duration: 1.5, delay: 0.5 }}
                                className="h-full bg-gradient-to-r from-accent to-indigo-400 shadow-[0_0_15px_rgba(var(--accent-rgb),0.5)]"
                            />
                        </div>
                    </div>

                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent/5 blur-[80px] rounded-full pointer-events-none group-hover:bg-accent/10 transition-colors" />
                </div>

                {/* Daily Dedication Card */}
                <div className="md:col-span-1 premium-card flex flex-col justify-between items-center text-center group">
                    <div className="relative w-24 h-24 mb-2 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90">
                            <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/5" />
                            <motion.circle
                                cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="6" fill="transparent"
                                strokeDasharray={251.2}
                                initial={{ strokeDashoffset: 251.2 }}
                                animate={{ strokeDashoffset: 251.2 - (251.2 * progressPercentage) / 100 }}
                                className="text-accent"
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-xl font-bold">{progressPercentage}%</span>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-[10px] font-bold uppercase tracking-widest mb-1">Daily Commitment</h3>
                        <p className="text-[9px] text-text-dim">{currentProgress} / {dailyGoal} Minutes Done</p>
                    </div>
                </div>

                {/* Quick Resume Card */}
                <div className="md:col-span-1 premium-card flex flex-col justify-between group cursor-pointer hover:border-accent/40" onClick={() => lastLesson && onSelectChapter({ ...lastLesson })}>
                    <div className="p-3 bg-white/5 rounded-xl w-fit group-hover:bg-white/10 transition-colors">
                        <ArrowRight className="w-6 h-6 text-text-dim group-hover:text-accent group-hover:translate-x-1 transition-all" />
                    </div>
                    <div>
                        <h3 className="text-[10px] font-bold uppercase tracking-widest mb-1">Quick Resume</h3>
                        <p className="text-[9px] text-text-dim line-clamp-2">{lastLesson ? lastLesson.title : 'No recent activity'}</p>
                    </div>
                </div>

                <div className="md:col-span-2 premium-card flex flex-col justify-center gap-2 group">
                    <span className="text-[10px] text-text-dim uppercase tracking-widest font-bold">Learning Path Insights</span>
                    <div className="space-y-4 pt-2">
                        {recentActivity.length > 0 ? recentActivity.map((act, id) => (
                            <div key={id} className="flex items-center justify-between group/item">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover/item:bg-accent/10 transition-colors">
                                        <div className="w-1 h-1 rounded-full bg-accent" />
                                    </div>
                                    <span className="text-xs text-text-dim group-hover/item:text-white transition-colors line-clamp-1">
                                        {act.type === 'lesson_start' ? `Mastered ${act.title}` : `Consulted AI on ${act.query}`}
                                    </span>
                                </div>
                                <ArrowRight className="w-2 h-2 text-white/0 group-hover/item:text-white/20 transition-all" />
                            </div>
                        )) : (
                            <p className="text-text-dim text-xs italic py-4">Start a study session to see your progress.</p>
                        )}
                    </div>
                </div>

                <div className="md:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['Science', 'Mathematics', 'English', 'Social Science'].map((subj, idx) => {
                        const Icon = subjectIcons[subj] || Sparkles;
                        const subjectProgress = Math.floor(((studentId.charCodeAt(idx % studentId.length) % 40) + 40));
                        return (
                            <div key={idx} className="premium-card flex flex-col gap-4 group hover:border-accent/40 transition-all">
                                <div className="flex justify-between items-start">
                                    <div className="p-2 bg-white/5 rounded-lg group-hover:bg-accent/10 group-hover:text-accent transition-colors">
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-serif text-accent/80">{subjectProgress}%</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-text-dim uppercase tracking-widest font-bold block mb-2">{subj}</span>
                                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${subjectProgress}%` }}
                                            transition={{ duration: 1.5, delay: 0.8 + (idx * 0.1) }}
                                            className="h-full bg-gradient-to-r from-accent/60 to-accent rounded-full group-hover:from-accent group-hover:to-indigo-400 transition-all shadow-[0_0_10px_rgba(var(--accent-rgb),0.3)]"
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="premium-card flex flex-col justify-between group">
                    <div className="p-3 bg-orange-500/10 rounded-xl w-fit group-hover:bg-orange-500/20 transition-colors">
                        <GraduationCap className="text-orange-500 w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-md">Assessments</h3>
                        <p className="text-text-dim text-[10px]">{stats?.quizzesCompleted || 0} Test sessions completed</p>
                    </div>
                </div>

                <div className="premium-card flex flex-col justify-between group">
                    <div className="p-3 bg-pink-500/10 rounded-xl w-fit group-hover:bg-pink-500/20 transition-colors">
                        <Languages className="text-pink-500 w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-md">AI Consultations</h3>
                        <p className="text-text-dim text-[10px]">{stats?.doubtsAsked || 0} Doubts clarified instantly</p>
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

const Solver = ({ activeChapter, setActiveChapter, clearChapter, studentId, libraryData, selectedGrade }: {
    activeChapter: any | null,
    setActiveChapter: (chapter: any) => void,
    clearChapter: () => void,
    studentId: string,
    libraryData: any[],
    selectedGrade: number
}) => {
    const [selectedSubject, setSelectedSubject] = useState<string | null>(activeChapter?.subject || null);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'bot', content: activeChapter
                ? `Hello! I'm ready to help you with ${activeChapter.title}. What would you like to know about this lesson?`
                : "Hello! I'm your NCERT assistant. Please select a subject to start a focused study session.",
            citations: []
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isChapterSelectionOpen, setIsChapterSelectionOpen] = useState(false);

    // Reset when activeChapter changes or when selectedSubject is cleared
    useEffect(() => {
        if (activeChapter) {
            setMessages([{
                role: 'bot',
                content: `Focus Mode: ${activeChapter.title}. How can I assist you with this specific chapter?`,
                citations: []
            } as Message]);
            setSelectedSubject(activeChapter.subject);
            setIsChapterSelectionOpen(false);
        } else if (selectedSubject) {
            setMessages([{
                role: 'bot',
                content: `Subject Mode: ${selectedSubject}. I'm searching across all chapters in this subject. Ask me anything!`,
                citations: []
            } as Message]);
        } else {
            setMessages([{
                role: 'bot',
                content: "Hello! I'm your NCERT assistant. Please select a subject to start a focused study session.",
                citations: []
            } as Message]);
        }
    }, [activeChapter, selectedSubject]);

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
                    subject: selectedSubject,
                    grade: String(selectedGrade)
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

    if (!selectedSubject) {
        const filteredSubjects = (libraryData as any[])
            .map((group: any) => ({
                ...group,
                chapters: group.chapters.filter((c: any) => parseInt(c.grade) === selectedGrade)
            }))
            .filter((group: any) => group.chapters.length > 0);

        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto space-y-12"
            >
                <header>
                    <span className="section-label">AI Solver Initialize</span>
                    <h1 className="text-6xl font-serif">Choose a <br />Subject.</h1>
                    <p className="text-text-dim text-sm mt-4">Select a subject to start chatting with its entire knowledge base across all chapters.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSubjects.map((subjectGroup: any, idx: number) => (
                        <button
                            key={idx}
                            onClick={() => setSelectedSubject(subjectGroup.subject)}
                            className="premium-card text-left group hover:border-accent/40 transition-all"
                        >
                            <div className="p-3 bg-accent/10 rounded-xl w-fit mb-4 group-hover:bg-accent/20 transition-colors">
                                <BookOpen className="text-accent w-6 h-6" />
                            </div>
                            <h3 className="text-xl mb-1">{subjectGroup.subject}</h3>
                            <p className="text-[10px] text-text-dim uppercase tracking-widest">{subjectGroup.chapters.length} Chapters Available</p>
                        </button>
                    ))}
                </div>
            </motion.div>
        );
    }


    const currentSubjectData = (libraryData as any[]).find((s: any) => s.subject === selectedSubject);
    const filteredChapters = currentSubjectData?.chapters.filter((c: any) => parseInt(c.grade) === selectedGrade) || [];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-[calc(100vh-8rem)] flex flex-col max-w-5xl mx-auto"
        >
            <header className="mb-8 flex justify-between items-center group/header">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => { setSelectedSubject(null); clearChapter(); }}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-text-dim" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="section-label mb-0">{selectedSubject}</span>
                            {activeChapter && (
                                <>
                                    <span className="text-white/20 text-[10px]">•</span>
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-accent">Chapter Focus</span>
                                </>
                            )}
                        </div>
                        <h2 className="text-4xl font-serif flex items-center gap-3">
                            {activeChapter ? activeChapter.title : `Subject Intelligence`}
                        </h2>
                    </div>
                </div>

                <div className="flex gap-3">
                    {!activeChapter && (
                        <button
                            onClick={() => setIsChapterSelectionOpen(!isChapterSelectionOpen)}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-text-dim hover:text-white transition-all border border-white/5 flex items-center gap-2"
                        >
                            <BookOpen className="w-3 h-3" />
                            Refine to Chapter
                        </button>
                    )}
                    {activeChapter && (
                        <button
                            onClick={clearChapter}
                            className="px-4 py-2 bg-accent/10 hover:bg-accent/20 rounded-xl text-[10px] font-bold uppercase tracking-widest text-accent transition-all border border-accent/20"
                        >
                            Back to Subject View
                        </button>
                    )}
                </div>

                {/* Chapter Selection Dropdown Overlay */}
                <AnimatePresence>
                    {isChapterSelectionOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute top-20 right-0 w-80 premium-card z-[70] shadow-2xl border-accent/20 p-4 space-y-4"
                        >
                            <h4 className="text-[10px] uppercase font-bold tracking-widest text-text-dim border-b border-white/5 pb-2">Select Focus Chapter</h4>
                            <div className="max-h-60 overflow-y-auto space-y-1 no-scrollbar">
                                {filteredChapters.map((chapter: any, idx: number) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveChapter({ ...chapter, subject: selectedSubject })}
                                        className="w-full text-left p-3 rounded-lg hover:bg-white/5 text-xs transition-colors line-clamp-2"
                                    >
                                        {chapter.title}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
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

const Library = ({ onSelectChapter, selectedGrade, setSelectedGrade, libraryData }: {
    onSelectChapter: (chapter: any) => void,
    selectedGrade: number,
    setSelectedGrade: (grade: number) => void,
    libraryData: any[]
}) => {
    const loading = libraryData.length === 0;

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
            chapters: group.chapters.filter((c: any) => parseInt(c.grade) === selectedGrade)
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

const Assessment = ({ studentId, libraryData, selectedGrade }: {
    studentId: string,
    libraryData: any[],
    selectedGrade: number
}) => {
    const [loading, setLoading] = useState(false);
    const [assessment, setAssessment] = useState<any>(null);
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
    const [selectedChapter, setSelectedChapter] = useState<any | null>(null);
    const [isChapterListOpen, setIsChapterListOpen] = useState(false);
    const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
    const [showResults, setShowResults] = useState(false);

    const generateAssessment = async (topic?: string) => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8000/assessment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: topic || selectedChapter?.title || selectedSubject,
                    subject: selectedSubject,
                    grade: String(selectedGrade),
                    filename: selectedChapter?.filename
                })
            });
            const data = await response.json();
            setAssessment(data);
            setQuizAnswers({});
            setShowResults(false);

            logProgress(studentId, 'assessment_done', {
                topic: topic || selectedSubject,
                subject: selectedSubject,
                chapter: selectedChapter?.title
            });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const calculateScore = () => {
        if (!assessment?.quiz) return 0;
        let correct = 0;
        assessment.quiz.forEach((q: any, i: number) => {
            if (quizAnswers[i] === q.correct) correct++;
        });
        return Math.round((correct / assessment.quiz.length) * 100);
    };

    const filteredSubjects = (libraryData as any[])
        .map((group: any) => ({
            ...group,
            chapters: group.chapters.filter((c: any) => parseInt(c.grade) === selectedGrade)
        }))
        .filter((group: any) => group.chapters.length > 0);

    const currentSubjectChapters = (libraryData as any[]).find(s => s.subject === selectedSubject)?.chapters.filter((c: any) => parseInt(c.grade) === selectedGrade) || [];

    if (!selectedSubject) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                <header>
                    <span className="section-label">Diagnostic Hub</span>
                    <h1 className="text-6xl font-serif">Select <br />Assessment Area.</h1>
                </header>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSubjects.map((s: any, idx: number) => (
                        <button
                            key={idx}
                            onClick={() => setSelectedSubject(s.subject)}
                            className="premium-card text-left group hover:border-accent/40"
                        >
                            <div className="p-3 bg-accent/10 rounded-xl w-fit mb-4 group-hover:bg-accent/20">
                                <Sparkles className="text-accent w-6 h-6" />
                            </div>
                            <h3 className="text-xl mb-1">{s.subject}</h3>
                            <p className="text-[10px] text-text-dim uppercase tracking-widest">{s.chapters.length} Chapters Available</p>
                        </button>
                    ))}
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12 pb-20">
            <header className="flex justify-between items-end">
                <div className="flex items-center gap-4">
                    <button onClick={() => { setSelectedSubject(null); setAssessment(null); setSelectedChapter(null); }} className="p-2 hover:bg-white/10 rounded-full">
                        <ArrowLeft className="w-5 h-5 text-text-dim" />
                    </button>
                    <div>
                        <span className="section-label">{selectedSubject} Intelligence</span>
                        <h2 className="text-4xl font-serif">Diagnostic Session.</h2>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="relative">
                        <button
                            onClick={() => setIsChapterListOpen(!isChapterListOpen)}
                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-text-dim hover:text-white flex items-center gap-2"
                        >
                            <BookOpen className="w-3 h-3" />
                            {selectedChapter ? selectedChapter.title : 'Focus: All Chapters'}
                        </button>
                        <AnimatePresence>
                            {isChapterListOpen && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-12 right-0 w-80 premium-card z-[70] p-4 space-y-2">
                                    <button onClick={() => { setSelectedChapter(null); setIsChapterListOpen(false); }} className="w-full text-left p-2 hover:bg-white/5 text-xs text-accent">Reset to Subject-Wide</button>
                                    <div className="max-h-60 overflow-y-auto space-y-1 no-scrollbar">
                                        {currentSubjectChapters.map((c: any, idx: number) => (
                                            <button key={idx} onClick={() => { setSelectedChapter(c); setIsChapterListOpen(false); }} className="w-full text-left p-2 hover:bg-white/5 text-[10px] text-text-dim hover:text-white line-clamp-1">{c.title}</button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </header>

            {!assessment && !loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div onClick={() => generateAssessment()} className="premium-card cursor-pointer group hover:border-accent/50 bg-accent/5">
                        <Sparkles className="w-8 h-8 text-accent mb-6" />
                        <h3 className="text-2xl mb-4">Start Comprehensive Quiz</h3>
                        <p className="text-text-dim text-sm leading-relaxed mb-6">AI will synthesize questions across {selectedChapter ? 'the selected chapter' : 'all subject chapters'} to evaluate your readiness.</p>
                        <div className="flex items-center gap-2 text-accent text-[10px] font-bold uppercase tracking-widest">
                            <span>Begin Assessment</span>
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                </div>
            )}

            {loading && (
                <div className="flex flex-col items-center justify-center py-32 space-y-6">
                    <div className="w-12 h-12 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
                    <p className="text-text-dim font-serif text-xl animate-pulse">Synthesizing Diagnostic Questions...</p>
                </div>
            )}

            <AnimatePresence>
                {assessment && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-16">
                        <section>
                            <h3 className="section-label mb-8">Flash Memory Cards</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {assessment.flashcards.map((f: any, i: number) => (
                                    <div key={i} className="premium-card bg-white/[0.02] border-white/5 p-8 group hover:bg-white/[0.04] transition-all">
                                        <div className="text-[10px] text-accent font-bold uppercase tracking-[0.2em] mb-4">Concept {i + 1}</div>
                                        <p className="text-lg font-serif mb-4 leading-snug">{f.q}</p>
                                        <div className="h-px bg-white/10 w-8 mb-4" />
                                        <p className="text-sm text-text-dim leading-relaxed italic">{f.a}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {assessment.quiz && assessment.quiz.length > 0 && (
                            <section className="space-y-8">
                                <header className="flex justify-between items-end border-b border-white/5 pb-6">
                                    <h3 className="section-label mb-0">Diagnostic Quiz</h3>
                                    {showResults && (
                                        <div className="text-right">
                                            <span className="text-[10px] text-text-dim uppercase tracking-widest block mb-1">Session Score</span>
                                            <span className="text-4xl font-serif text-accent">{calculateScore()}%</span>
                                        </div>
                                    )}
                                </header>
                                <div className="space-y-12">
                                    {assessment.quiz.map((q: any, i: number) => (
                                        <div key={i} className="max-w-3xl">
                                            <p className="text-2xl font-serif mb-8 leading-snug"><span className="text-accent/40 mr-4">0{i + 1}.</span>{q.q}</p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {q.options.map((opt: string, oi: number) => {
                                                    const isSelected = quizAnswers[i] === opt;
                                                    const isCorrect = q.correct === opt;
                                                    return (
                                                        <button
                                                            key={oi}
                                                            onClick={() => !showResults && setQuizAnswers(prev => ({ ...prev, [i]: opt }))}
                                                            className={cn(
                                                                "text-left p-6 rounded-2xl border transition-all duration-300 text-sm",
                                                                isSelected
                                                                    ? "border-accent bg-accent/10 shadow-[0_0_20px_rgba(var(--accent-rgb),0.1)]"
                                                                    : "border-white/5 hover:border-white/20 hover:bg-white/5",
                                                                showResults && isCorrect && "border-emerald-500 bg-emerald-500/10",
                                                                showResults && isSelected && !isCorrect && "border-red-500 bg-red-500/10 opacity-50"
                                                            )}
                                                        >
                                                            {opt}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {!showResults && Object.keys(quizAnswers).length === assessment.quiz.length && (
                                    <button
                                        onClick={() => setShowResults(true)}
                                        className="px-12 py-4 bg-accent text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:scale-105 transition-transform"
                                    >
                                        Finalize Assessment
                                    </button>
                                )}
                                <div className="pt-12 border-t border-white/5">
                                    <button onClick={() => setAssessment(null)} className="text-[10px] font-bold uppercase tracking-widest text-text-dim hover:text-white transition-colors">Generate New Set</button>
                                </div>
                            </section>
                        )}
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
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedGrade, setSelectedGrade] = useState<number>(10);
    const [libraryData, setLibraryData] = useState<{ subject: string, chapters: any[] }[]>([]);

    useEffect(() => {
        const fetchLibrary = async () => {
            try {
                const response = await fetch('http://localhost:8000/library');
                const data = await response.json();
                setLibraryData(data.subjects || []);
            } catch (e) {
                console.error("Failed to fetch library:", e);
            }
        };
        fetchLibrary();
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                const data = await getStudentOverview(currentUser.uid);
                // If the user document exists but is missing critical profile info
                if (data && data.profileCompleted === undefined && !data.displayName) {
                    data.profileCompleted = false;
                }
                setProfile(data);
                if (data?.grade) setSelectedGrade(data.grade);
            } else {
                setProfile(null);
            }
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

    const getRank = (readiness: number) => {
        if (readiness > 85) return { name: "Scholar", color: "text-accent" };
        if (readiness > 70) return { name: "Explorer", color: "text-emerald-500" };
        return { name: "Novice", color: "text-amber-500" };
    };

    const rank = getRank(profile?.readiness || 65);

    return (
        <div className="flex bg-background min-h-screen text-white font-sans selection:bg-accent/30 selection:text-white">
            <AnimatePresence>
                {!user && <AuthScreen />}
                {user && (!profile || profile.profileCompleted === false) && (
                    <OnboardingScreen
                        userId={user.uid}
                        onComplete={(newProfile) => setProfile({ ...profile, ...newProfile, profileCompleted: true })}
                    />
                )}
            </AnimatePresence>

            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

            <main className="flex-1 p-12 overflow-y-auto">
                <AnimatePresence mode="wait">
                    {activeTab === 'home' && user && (
                        <Dashboard
                            key="home"
                            studentId={user.uid}
                            profile={profile}
                            onSelectChapter={handleSelectChapter}
                        />
                    )}
                    {activeTab === 'solver' && user && (
                        <Solver
                            key="solver"
                            activeChapter={activeChapter}
                            setActiveChapter={setActiveChapter}
                            clearChapter={() => setActiveChapter(null)}
                            studentId={user.uid}
                            libraryData={libraryData}
                            selectedGrade={selectedGrade}
                        />
                    )}
                    {activeTab === 'library' && (
                        <Library
                            key="library"
                            onSelectChapter={handleSelectChapter}
                            selectedGrade={selectedGrade}
                            setSelectedGrade={setSelectedGrade}
                            libraryData={libraryData}
                        />
                    )}
                    {activeTab === 'assess' && user && (
                        <Assessment
                            key="assess"
                            studentId={user.uid}
                            libraryData={libraryData}
                            selectedGrade={selectedGrade}
                        />
                    )}
                    {activeTab === 'settings' && user && (
                        <ProfileSettings
                            key="settings"
                            userId={user.uid}
                            initialProfile={profile}
                            onUpdate={(newProfile) => setProfile({ ...profile, ...newProfile })}
                            onBack={() => setActiveTab('home')}
                        />
                    )}
                </AnimatePresence>
            </main>

            {/* Global User Menu / Profile Card */}
            {user && (
                <div className="fixed bottom-8 left-8 z-[60] group">
                    <button
                        onClick={() => logoutUser()}
                        className="bg-white/5 border border-white/10 p-5 rounded-[2rem] text-text-dim hover:text-white hover:bg-white/10 transition-all flex items-center gap-4 backdrop-blur-3xl shadow-2xl group-hover:border-accent/30"
                    >
                        <div className="relative">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent/20 to-indigo-500/10 flex items-center justify-center text-lg font-bold text-accent border border-white/10 group-hover:scale-105 transition-transform">
                                {profile?.displayName?.trim() ? profile.displayName.charAt(0).toUpperCase() : (user.email?.charAt(0).toUpperCase() || "S")}
                            </div>
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-4 border-background" />
                        </div>

                        <div className="text-left">
                            <div className="flex items-center gap-2 mb-0.5">
                                <p className="text-xs font-bold text-white truncate max-w-[140px]">
                                    {profile?.displayName || "New Student"}
                                </p>
                                <span className={cn("text-[8px] px-1.5 py-0.5 rounded-full bg-white/5 font-bold uppercase tracking-tighter border border-white/5", rank.color)}>
                                    {rank.name}
                                </span>
                            </div>
                            <p className="text-[10px] font-medium tracking-wide text-white/30 uppercase">
                                {profile?.studyPersona || 'Unset'} • {profile?.academicBoard || 'Unset'}
                            </p>
                        </div>

                        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-accent ml-2" />
                    </button>

                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-0 mb-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none translate-y-2 group-hover:translate-y-0 transition-transform">
                        <div className="premium-card p-3 text-[10px] whitespace-nowrap bg-background/90 backdrop-blur-xl border-accent/20">
                            Click to Sign Out
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
