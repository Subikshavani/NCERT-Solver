import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    GraduationCap,
    Mail,
    Lock,
    ArrowRight,
    Sparkles,
    Github,
    LogIn,
    UserPlus,
    AlertCircle
} from 'lucide-react';
import {
    signInWithGoogle,
    auth
} from '../lib/firebase';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from 'firebase/auth';

const AuthScreen: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
        } catch (err: any) {
            setError(err.message.replace('Firebase:', '').trim());
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError('');
        try {
            await signInWithGoogle();
        } catch (err: any) {
            setError(err.message.replace('Firebase:', '').trim());
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/80 backdrop-blur-xl">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-md premium-card p-12 relative overflow-hidden group shadow-[0_32px_100px_-20px_rgba(0,0,0,0.5)]"
            >
                {/* Background effects */}
                <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-80 h-80 bg-accent/10 blur-[100px] rounded-full group-hover:bg-accent/20 transition-all duration-700" />
                <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-80 h-80 bg-indigo-500/10 blur-[100px] rounded-full group-hover:bg-indigo-500/20 transition-all duration-700" />

                <div className="relative z-10 text-center space-y-8">
                    <div className="inline-flex p-4 bg-accent/10 rounded-2xl mb-2">
                        <GraduationCap className="w-10 h-10 text-accent" />
                    </div>

                    <div>
                        <h1 className="text-4xl font-serif font-bold mb-3 tracking-tight">
                            NCERT<span className="text-accent text-glow">AI</span>
                        </h1>
                        <p className="text-text-dim text-sm max-w-[280px] mx-auto leading-relaxed">
                            {isLogin ? "Welcome back! Access your secure study workspace." : "Create your account to start tracking your academic journey."}
                        </p>
                    </div>

                    <div className="space-y-4 pt-4">
                        <button
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                            className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white py-3.5 rounded-xl font-medium flex items-center justify-center gap-3 transition-all group/google disabled:opacity-50"
                        >
                            <svg className="w-5 h-5 group-hover/google:scale-110 transition-transform" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            <span>Continue with Google</span>
                        </button>

                        <div className="flex items-center gap-4 text-white/10 py-2">
                            <span className="h-[1px] bg-white/10 flex-1" />
                            <span className="text-[10px] uppercase font-bold tracking-widest text-text-dim/50">OR EMAIL</span>
                            <span className="h-[1px] bg-white/10 flex-1" />
                        </div>

                        <form onSubmit={handleAuth} className="space-y-4 text-left">
                            <div className="space-y-4">
                                <div className="relative group/input">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim group-focus-within/input:text-accent transition-colors" />
                                    <input
                                        type="email"
                                        placeholder="Email Address"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-6 py-4 text-sm focus:outline-none focus:border-accent/40 focus:bg-white/10 transition-all placeholder:text-white/20"
                                        required
                                    />
                                </div>
                                <div className="relative group/input">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim group-focus-within/input:text-accent transition-colors" />
                                    <input
                                        type="password"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-6 py-4 text-sm focus:outline-none focus:border-accent/40 focus:bg-white/10 transition-all placeholder:text-white/20"
                                        required
                                    />
                                </div>
                            </div>

                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="flex items-center gap-2 text-pink-500 text-[10px] font-bold uppercase tracking-wider bg-pink-500/5 p-3 rounded-lg border border-pink-500/20"
                                    >
                                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                        <span>{error}</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-accent text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-accent/90 transition-all shadow-lg shadow-accent/20 group/btn mt-2 disabled:opacity-50"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        {isLogin ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                                        <span>{isLogin ? "Sign In" : "Create Account"}</span>
                                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    <div className="pt-6">
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-xs text-text-dim hover:text-white transition-colors"
                        >
                            {isLogin ? "New here? Create an account" : "Already have an account? Sign In"}
                        </button>
                    </div>

                    <p className="text-[10px] text-text-dim uppercase tracking-widest mt-8 flex items-center justify-center gap-2">
                        <span className="w-8 h-[1px] bg-white/10" />
                        Secure Personal Workspace
                        <span className="w-8 h-[1px] bg-white/10" />
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default AuthScreen;
