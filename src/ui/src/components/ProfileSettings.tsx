import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    User,
    Save,
    Zap,
    BookOpen,
    Trophy,
    CheckCircle2,
    ArrowLeft
} from 'lucide-react';
import { updateUserProfile } from '../lib/firebase';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const BOARDS = ["CBSE", "ICSE", "State Board", "International"];
const GOALS = ["Board Exams", "Competitive Finals", "Concept Mastery", "Daily Homework"];
const PERSONAS = [
    { id: 'sprinter', name: 'The Sprinter', desc: 'Focus on clearing quick doubts and fast learning.', icon: Zap },
    { id: 'architect', name: 'The Architect', desc: 'Deep dives into core textbook concepts.', icon: BookOpen },
    { id: 'analyst', name: 'The Analyst', desc: 'Active practice and assessment focused.', icon: Trophy },
];

interface ProfileSettingsProps {
    userId: string;
    initialProfile: any;
    onUpdate: (profile: any) => void;
    onBack: () => void;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ userId, initialProfile, onUpdate, onBack }) => {
    const [profile, setProfile] = useState({
        displayName: initialProfile?.displayName || '',
        academicBoard: initialProfile?.academicBoard || 'CBSE',
        primaryGoal: initialProfile?.primaryGoal || 'Board Exams',
        studyPersona: initialProfile?.studyPersona || 'architect',
        grade: initialProfile?.grade || 10,
        dailyGoalMinutes: initialProfile?.dailyGoalMinutes || 30
    });
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        try {
            await updateUserProfile(userId, profile);
            onUpdate(profile);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-4xl mx-auto space-y-12 pb-24"
        >
            <header className="flex justify-between items-end">
                <div>
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-text-dim hover:text-white transition-colors mb-4 text-xs font-bold uppercase tracking-widest"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </button>
                    <span className="section-label">Account Settings</span>
                    <h1 className="text-6xl font-serif">Edit Profile.</h1>
                </div>
                <button
                    onClick={handleSave}
                    disabled={loading || !profile.displayName}
                    className="premium-card !bg-accent hover:!bg-accent/90 text-white !py-4 !px-8 flex items-center gap-3 transition-all disabled:opacity-50"
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : saved ? (
                        <CheckCircle2 className="w-5 h-5" />
                    ) : (
                        <Save className="w-5 h-5" />
                    )}
                    <span className="font-bold">{saved ? 'Changes Saved' : 'Save Details'}</span>
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Personal Identity */}
                <section className="premium-card space-y-8">
                    <h3 className="text-xl font-serif border-b border-white/5 pb-4">Personal Identity</h3>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-bold tracking-widest text-text-dim ml-1">Full Name</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-dim group-focus-within:text-accent transition-colors" />
                                <input
                                    type="text"
                                    value={profile.displayName}
                                    onChange={e => setProfile({ ...profile, displayName: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-sm focus:outline-none focus:border-accent/40 focus:bg-white/10 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] uppercase font-bold tracking-widest text-text-dim ml-1">Academic Board</label>
                            <div className="grid grid-cols-2 gap-2">
                                {BOARDS.map(board => (
                                    <button
                                        key={board}
                                        onClick={() => setProfile({ ...profile, academicBoard: board })}
                                        className={cn(
                                            "px-4 py-3 rounded-xl border text-xs transition-all text-left",
                                            profile.academicBoard === board
                                                ? "bg-accent/10 border-accent text-white"
                                                : "border-white/10 text-text-dim hover:border-white/20"
                                        )}
                                    >
                                        {board}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] uppercase font-bold tracking-widest text-text-dim ml-1">Current Class</label>
                            <div className="grid grid-cols-3 gap-2">
                                {[5, 6, 7, 8, 9, 10].map(grade => (
                                    <button
                                        key={grade}
                                        onClick={() => setProfile({ ...profile, grade: grade })}
                                        className={cn(
                                            "px-4 py-3 rounded-xl border text-xs transition-all font-bold text-center",
                                            profile.grade === grade
                                                ? "bg-indigo-500/10 border-indigo-500 text-white"
                                                : "border-white/10 text-text-dim hover:border-white/20"
                                        )}
                                    >
                                        Cl. {grade}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Academic Vision */}
                <section className="premium-card space-y-8">
                    <h3 className="text-xl font-serif border-b border-white/5 pb-4">Academic Vision</h3>

                    <div className="space-y-8">
                        <div className="space-y-3">
                            <label className="text-[10px] uppercase font-bold tracking-widest text-text-dim ml-1">Primary Goal</label>
                            <div className="flex flex-wrap gap-2">
                                {GOALS.map(goal => (
                                    <button
                                        key={goal}
                                        onClick={() => setProfile({ ...profile, primaryGoal: goal })}
                                        className={cn(
                                            "px-4 py-2 text-[10px] rounded-full border transition-all uppercase font-bold tracking-wider",
                                            profile.primaryGoal === goal
                                                ? "bg-accent text-white border-accent"
                                                : "bg-white/5 border-white/10 text-text-dim hover:bg-white/10"
                                        )}
                                    >
                                        {goal}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] uppercase font-bold tracking-widest text-text-dim ml-1">Daily Dedication</label>
                            <div className="flex gap-2">
                                {[15, 30, 60, 120].map(mins => (
                                    <button
                                        key={mins}
                                        onClick={() => setProfile({ ...profile, dailyGoalMinutes: mins })}
                                        className={cn(
                                            "flex-1 py-3 rounded-xl border text-center transition-all",
                                            profile.dailyGoalMinutes === mins
                                                ? "bg-emerald-500/10 border-emerald-500 text-white"
                                                : "bg-white/5 border-white/10 text-text-dim hover:bg-white/10"
                                        )}
                                    >
                                        <div className="text-xs font-bold leading-tight">{mins >= 60 ? `${mins / 60}h` : `${mins}m`}</div>
                                        <div className="text-[8px] opacity-50 uppercase font-bold tracking-tighter">Daily</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] uppercase font-bold tracking-widest text-text-dim ml-1">Study Persona</label>
                            <div className="grid grid-cols-1 gap-2">
                                {PERSONAS.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => setProfile({ ...profile, studyPersona: p.id })}
                                        className={cn(
                                            "flex items-center gap-4 p-4 rounded-2xl border text-left transition-all",
                                            profile.studyPersona === p.id
                                                ? "bg-indigo-500/10 border-indigo-500 text-white shadow-lg shadow-indigo-500/5"
                                                : "bg-white/2 border-white/10 text-text-dim hover:bg-white/5"
                                        )}
                                    >
                                        <div className={cn(
                                            "p-2 rounded-lg",
                                            profile.studyPersona === p.id ? "bg-indigo-500/20 text-indigo-500" : "bg-white/5 text-text-dim"
                                        )}>
                                            <p.icon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-xs">{p.name}</h4>
                                            <p className="text-[9px] opacity-50">{p.desc}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </motion.div>
    );
};

export default ProfileSettings;
