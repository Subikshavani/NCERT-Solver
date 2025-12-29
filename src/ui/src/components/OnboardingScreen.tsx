import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User,
    School,
    Target,
    Zap,
    Palette,
    ArrowRight,
    CheckCircle2,
    Sparkles,
    GraduationCap,
    BookOpen,
    Trophy
} from 'lucide-react';
import { updateUserProfile } from '../lib/firebase';

const BOARDS = ["CBSE", "ICSE", "State Board", "International"];
const GOALS = ["Board Exams", "Competitive Finals", "Concept Mastery", "Daily Homework"];
const PERSONAS = [
    { id: 'sprinter', name: 'The Sprinter', desc: 'Focus on clearing quick doubts and fast learning.', icon: Zap },
    { id: 'architect', name: 'The Architect', desc: 'Deep dives into core textbook concepts.', icon: BookOpen },
    { id: 'analyst', name: 'The Analyst', desc: 'Active practice and assessment focused.', icon: Trophy },
];

interface OnboardingProps {
    userId: string;
    onComplete: (profile: any) => void;
}

const OnboardingScreen: React.FC<OnboardingProps> = ({ userId, onComplete }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Profile State
    const [profile, setProfile] = useState({
        displayName: '',
        academicBoard: 'CBSE',
        primaryGoal: 'Board Exams',
        studyPersona: 'architect',
        grade: 10,
        dailyGoalMinutes: 30
    });

    const handleComplete = async () => {
        setLoading(true);
        try {
            await updateUserProfile(userId, profile);
            onComplete(profile);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => setStep(prev => prev + 1);

    return (
        <div className="fixed inset-0 z-[110] bg-background flex items-center justify-center p-6 overflow-y-auto">
            {/* Ambient Background */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl premium-card p-12 relative"
            >
                <div className="mb-12">
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-accent">Registration • Step {step} of 3</span>
                        <div className="flex gap-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className={`h-1 w-8 rounded-full transition-colors ${i <= step ? 'bg-accent' : 'bg-white/10'}`} />
                            ))}
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div>
                                    <h1 className="text-4xl font-serif mb-3 leading-tight">First, tell us <br />who you are.</h1>
                                    <p className="text-text-dim text-sm">We'll use this to personalize your academic workspace.</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-dim group-focus-within:text-accent transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="Your Full Name"
                                            value={profile.displayName}
                                            onChange={e => setProfile({ ...profile, displayName: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-5 text-lg focus:outline-none focus:border-accent/40 focus:bg-white/10 transition-all"
                                        />
                                    </div>
                                    <div className="bg-accent/5 p-4 rounded-xl border border-accent/10 flex items-start gap-3">
                                        <Sparkles className="w-4 h-4 text-accent mt-0.5" />
                                        <p className="text-[10px] text-accent/80 uppercase font-bold tracking-wider leading-relaxed">Your data is secured with high-grade encryption and synced across your NCERT AI workspace.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={nextStep}
                                    disabled={!profile.displayName}
                                    className="w-full bg-accent text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-accent/90 transition-all shadow-lg shadow-accent/20 group disabled:opacity-50"
                                >
                                    <span>Continue</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div>
                                    <h1 className="text-4xl font-serif mb-3 leading-tight">Your Academic <br />Context.</h1>
                                    <p className="text-text-dim text-sm">This helps us align our AI accuracy with your curriculum.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <label className="text-[10px] uppercase font-bold tracking-widest text-text-dim ml-1">Academic Board</label>
                                        <div className="space-y-2">
                                            {BOARDS.map(board => (
                                                <button
                                                    key={board}
                                                    onClick={() => setProfile({ ...profile, academicBoard: board })}
                                                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${profile.academicBoard === board ? 'bg-accent/10 border-accent text-white' : 'border-white/10 text-text-dim hover:border-white/20'}`}
                                                >
                                                    {board}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] uppercase font-bold tracking-widest text-text-dim ml-1">Current Class</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[5, 6, 7, 8, 9, 10].map(btnGrade => (
                                                <button
                                                    key={btnGrade}
                                                    onClick={() => setProfile({ ...profile, grade: btnGrade })}
                                                    className={`px-4 py-3 rounded-xl border text-sm transition-all font-bold ${profile.grade === btnGrade ? 'bg-indigo-500/10 border-indigo-500 text-white' : 'border-white/10 text-text-dim hover:border-white/20'}`}
                                                >
                                                    Class {btnGrade}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={nextStep}
                                    className="w-full bg-accent text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-accent/90 transition-all shadow-lg shadow-accent/20 group"
                                >
                                    <span>Define My Vision</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div>
                                    <h1 className="text-4xl font-serif mb-3 leading-tight">Your Learning <br />Vision.</h1>
                                    <p className="text-text-dim text-sm">Finally, how do you plan to use NCERT AI?</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] uppercase font-bold tracking-widest text-text-dim ml-1">Target Milestone</label>
                                        <div className="flex flex-wrap gap-2">
                                            {GOALS.map(goal => (
                                                <button
                                                    key={goal}
                                                    onClick={() => setProfile({ ...profile, primaryGoal: goal })}
                                                    className={`px-4 py-2 text-xs rounded-full border transition-all ${profile.primaryGoal === goal ? 'bg-accent text-white border-accent' : 'bg-white/5 border-white/10 text-text-dim hover:bg-white/10'}`}
                                                >
                                                    {goal}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] uppercase font-bold tracking-widest text-text-dim ml-1">Study Persona</label>
                                        <div className="grid grid-cols-1 gap-3">
                                            {PERSONAS.map(p => (
                                                <button
                                                    key={p.id}
                                                    onClick={() => setProfile({ ...profile, studyPersona: p.id })}
                                                    className={`flex items-center gap-4 p-4 rounded-2xl border text-left transition-all ${profile.studyPersona === p.id ? 'bg-indigo-500/10 border-indigo-500 text-white shadow-xl shadow-indigo-500/10' : 'bg-white/2 border-white/10 text-text-dim hover:bg-white/5'}`}
                                                >
                                                    <div className={`p-3 rounded-xl ${profile.studyPersona === p.id ? 'bg-indigo-500/20 text-indigo-500' : 'bg-white/5 text-text-dim'}`}>
                                                        <p.icon className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-sm block">{p.name}</h4>
                                                        <p className="text-[10px] opacity-60 leading-relaxed">{p.desc}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] uppercase font-bold tracking-widest text-text-dim ml-1">Daily Dedication</label>
                                        <div className="flex gap-3">
                                            {[15, 30, 60, 120].map(mins => (
                                                <button
                                                    key={mins}
                                                    onClick={() => setProfile({ ...profile, dailyGoalMinutes: mins })}
                                                    className={`flex-1 py-3 rounded-xl border text-center transition-all ${profile.dailyGoalMinutes === mins ? 'bg-emerald-500/10 border-emerald-500 text-white' : 'bg-white/5 border-white/10 text-text-dim hover:bg-white/10'}`}
                                                >
                                                    <div className="text-xs font-bold leading-tight">{mins >= 60 ? `${mins / 60}h` : `${mins}m`}</div>
                                                    <div className="text-[8px] opacity-50 uppercase font-bold tracking-tighter">Daily</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleComplete}
                                    disabled={loading}
                                    className="w-full bg-accent text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-accent/90 transition-all shadow-lg shadow-accent/20 group disabled:opacity-50"
                                >
                                    {loading ? (
                                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <span>Enter Workspace</span>
                                            <CheckCircle2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default OnboardingScreen;
