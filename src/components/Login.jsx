import React, { useState } from 'react';
import { signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { DollarSign, Shield } from 'lucide-react';
import { getAllAllowedEmails, getRoleFromEmail, ROLE_CONFIG } from '../constants';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const allowedPasswordEmail = "superbq@bqmail.com";

    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            setError('');
            await signInWithPopup(auth, googleProvider);
            // All Google logins are accepted now — role determined by getRoleFromEmail
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEmailLogin = async (e) => {
        e.preventDefault();

        if (email !== allowedPasswordEmail) {
            setError('Maaf, email Anda tidak terdaftar dalam sistem.');
            return;
        }

        try {
            setLoading(true);
            setError('');
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            setError('Email atau Password salah.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-pink-100 font-sans selection:bg-black selection:text-yellow-400 flex items-center justify-center p-6 bg-[radial-gradient(#000_1px,transparent_1px)] bg-[size:20px_20px]">
            <div className="max-w-md w-full bg-white border-4 border-black p-8 pop-shadow-sm flex flex-col items-center">

                {/* Logo */}
                <div className="bg-yellow-400 p-4 border-4 border-black rotate-[-6deg] mb-8 pop-shadow-sm">
                    <DollarSign size={64} className="stroke-[3]" />
                </div>

                <h1 className="text-4xl font-black uppercase tracking-tighter text-center mb-2">Cuan<br />Tracker<span className="text-yellow-400">.</span></h1>
                <p className="font-bold text-gray-500 uppercase tracking-widest text-sm mb-8 text-center border-b-4 border-black pb-4 w-full">Pencatatan Keuangan Asrama</p>

                {error && (
                    <div className="w-full bg-red-500 text-white font-bold p-4 border-4 border-black mb-6 text-sm">
                        ⚠️ {error}
                    </div>
                )}

                {/* Form Login Email */}
                <form onSubmit={handleEmailLogin} className="w-full space-y-4 mb-8">
                    <div>
                        <label className="block font-black uppercase tracking-widest mb-1 text-xs bg-black text-white inline-block px-2 py-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-yellow-50 border-4 border-black p-3 font-bold focus:outline-none focus:bg-yellow-100 transition-colors"
                            placeholder="email@asrama.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block font-black uppercase tracking-widest mb-1 text-xs bg-black text-white inline-block px-2 py-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-yellow-50 border-4 border-black p-3 font-bold focus:outline-none focus:bg-yellow-100 transition-colors"
                            placeholder="********"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-black text-white font-black uppercase tracking-widest text-lg py-4 border-4 border-black hover:bg-yellow-400 hover:text-black transition-colors pop-shadow mt-2 disabled:opacity-50"
                    >
                        {loading ? 'MEMPROSES...' : 'MASUK 🚀'}
                    </button>
                </form>

                <div className="w-full flex items-center gap-4 mb-8">
                    <div className="h-1 bg-black flex-1"></div>
                    <span className="font-black uppercase text-xl">ATAU</span>
                    <div className="h-1 bg-black flex-1"></div>
                </div>

                {/* Tombol Login Google */}
                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full bg-white text-black font-black uppercase tracking-widest text-lg py-4 border-4 border-black hover:bg-gray-100 flex items-center justify-center gap-3 transition-transform hover:-translate-y-1 pop-shadow mb-4"
                >
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    LOGIN VIA GOOGLE
                </button>

                {/* Divider for Pengurus */}
                <div className="w-full flex items-center gap-4 mb-4 mt-4">
                    <div className="h-0.5 bg-emerald-300 flex-1"></div>
                    <span className="font-black uppercase text-xs text-emerald-600 tracking-widest">PENGURUS</span>
                    <div className="h-0.5 bg-emerald-300 flex-1"></div>
                </div>

                {/* Tombol Login Pengurus */}
                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full bg-emerald-500 text-white font-black uppercase tracking-widest text-base py-4 border-4 border-black hover:bg-emerald-600 flex items-center justify-center gap-3 transition-transform hover:-translate-y-1 pop-shadow"
                >
                    <Shield size={22} strokeWidth={3} />
                    LOGIN PENGURUS
                </button>
                <p className="text-xs text-slate-400 mt-3 text-center font-bold">Login dengan Gmail untuk akses Dashboard Pengurus<br/>Perlu persetujuan admin.</p>
            </div>
        </div>
    );
};

export default Login;
