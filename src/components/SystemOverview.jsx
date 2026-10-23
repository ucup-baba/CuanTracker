import React, { useState, useEffect, useRef } from 'react';
import { Shield, Sparkles, AlertTriangle, CheckCircle2, XCircle, Clock, BookOpen, Globe, ArrowLeft, X, Home, Truck, Lock } from 'lucide-react';

const CONTENT = {
    en: {
        badge: "AI IMPLEMENTATION & SYSTEM OVERVIEW",
        title: "CuanTracker — Baitul Qowwam Foundation",
        subtitle: "AI-Assisted Daily Operational Financial Tracking & Supervisory System",
        langLabel: "Language",
        closeBtn: "Close",
        backToLogin: "Back to Login / Dashboard",
        loginCta: "Proceed to Google Sign-In",
        sections: {
            overview: {
                title: "1. What is Inside This System?",
                desc: "CuanTracker is a dedicated web application built with AI assistance to record, categorize, and supervise routine day-to-day operational cash flows at Baitul Qowwam Foundation. When accessed by board members or evaluators, the platform provides the Supervisory Dashboard (Dashboard Pengurus) structured across three operational branches:",
                branches: [
                    {
                        name: "Boys' Dormitory (Asrama Putra) — Active",
                        color: "bg-indigo-500 text-white",
                        items: "Actively managed by younger alumni / dedication staff (pengabdian putra). Tracks daily kitchen & meal supplies, water/gas refills, utilities (electricity, water, Wi-Fi), hygiene supplies, and urgent maintenance."
                    },
                    {
                        name: "Girls' Dormitory (Asrama Putri) — Active",
                        color: "bg-rose-500 text-white",
                        items: "Actively managed by female alumni / dedication staff (pengabdian putri). Tracks daily groceries & cooking needs, dormitory sanitation, utilities, room upkeep, and daily student welfare."
                    },
                    {
                        name: "Logistics (Logistik) — Ready, Not Yet Used",
                        color: "bg-amber-500 text-black",
                        items: "Module & categories are fully prepared in the app, but records are currently empty (Rp 0) because Logistics is overseen by a senior/older board member who still finds digital recording challenging and uses manual bookkeeping for now."
                    }
                ]
            },
            aiRole: {
                title: "2. How AI is Utilized",
                points: [
                    {
                        head: "AI-Powered Fast Input (Smart Transaction Parsing)",
                        body: "Dormitory caretakers (alumni/pengabdian) can simply type or dictate everyday notes (e.g., \"Bought 5kg rice, cooking gas, and floor soap Rp 120,000\") and the integrated Gemini AI automatically extracts the amount, determines whether it is income or expense, and assigns the appropriate category and sub-category—even supporting multiple items in a single prompt."
                    },
                    {
                        head: "Real-Time Supervisory Consolidation",
                        body: "Transactions from active operational branches are synchronized in real time into the Supervisory Dashboard and Monthly Comparison module (/laporan), enabling transparent budget monitoring without manual spreadsheet compilation."
                    }
                ]
            },
            limitations: {
                title: "3. Current Scope & Practical Limitations",
                subtitle: "Why this system only covers daily dormitory operations for now:",
                includedTitle: "Currently Active in App (Managed by Alumni / Pengabdian)",
                includedItems: [
                    "Daily operational expenses & income for Boys' & Girls' Dormitories",
                    "Daily kitchen groceries, utilities, sanitation, and minor repairs",
                    "Operational cash matching (Cash Opname) & monthly comparison reports"
                ],
                excludedTitle: "Not Yet Active / Managed Manually (Handled by Senior Staff)",
                excludedItems: [
                    "Logistics division records (module ready, but currently empty / manual)",
                    "Teacher & staff monthly payroll / salaries (Gaji Guru & Staf)",
                    "Formal school tuition fees (SPP Sekolah) & building construction (Pembangunan)"
                ],
                reasonTitle: "Human & Generational Context:",
                reasonBody: "Daily operations for the Boys' and Girls' Dormitories are managed by younger alumni and dedication staff (pengabdian), making digital and AI-assisted adoption smooth and immediate. Conversely, the Logistics division as well as macro institutional finances (teacher salaries, tuition fees, and construction) are managed by senior board members (older administrators) who find digital interfaces difficult to operate and remain more comfortable with conventional manual ledgers. Therefore, a pragmatic phased approach is used."
            },
            access: {
                title: "4. Reviewer & Board Member Login Guide",
                body: "Evaluators (including representatives from GM Children Foundation) and board members are welcome to sign in using a Google account. For internal data security, newly registered external emails are automatically placed in a \"Pending Approval\" (Menunggu Persetujuan) state until verified by the Foundation Administrator (baitulqowwam2011@gmail.com)."
            }
        }
    },
    id: {
        badge: "INFORMASI SISTEM & LAPORAN PENGGUNAAN AI",
        title: "CuanTracker — Yayasan Baitul Qowwam",
        subtitle: "Sistem Pencatatan & Pengawasan Keuangan Operasional Harian Berbantuan AI",
        langLabel: "Bahasa",
        closeBtn: "Tutup",
        backToLogin: "Kembali ke Login / Dashboard",
        loginCta: "Lanjut ke Login Google",
        sections: {
            overview: {
                title: "1. Apa Saja Isi di Dalam Sistem Ini?",
                desc: "CuanTracker adalah aplikasi web yang dikembangkan dengan bantuan AI untuk mencatat, mengelompokkan, dan mengawasi arus kas operasional harian di Yayasan Baitul Qowwam. Bagi pengurus atau tim evaluator, sistem ini menampilkan Dashboard Pengurus yang terbagi ke dalam tiga pos operasional:",
                branches: [
                    {
                        name: "Asrama Putra (Aktif Digunakan)",
                        color: "bg-indigo-500 text-white",
                        items: "Dikelola harian oleh alumni / pengabdian putra. Mencatat belanja dapur & makan harian, isi ulang galon/gas, tagihan utilitas (listrik, air, Wi-Fi), kebersihan, serta perawatan fasilitas."
                    },
                    {
                        name: "Asrama Putri (Aktif Digunakan)",
                        color: "bg-rose-500 text-white",
                        items: "Dikelola harian oleh alumni / pengabdian putri. Mencatat kebutuhan dapur & bahan makanan harian, kebersihan asrama, tagihan rutin, pemeliharaan kamar, dan keperluan santri putri."
                    },
                    {
                        name: "Divisi Logistik (Fitur Siap, Data Masih Kosong)",
                        color: "bg-amber-500 text-black",
                        items: "Fitur & kategori sudah disiapkan di sistem, namun datanya saat ini masih kosong (Rp 0) karena bagian Logistik dipegang oleh pengurus senior (yang sudah agak sepuh) sehingga masih kesulitan menggunakan aplikasi dan sementara masih dicatat manual."
                    }
                ]
            },
            aiRole: {
                title: "2. Peran & Penggunaan AI dalam Aplikasi",
                points: [
                    {
                        head: "Input Cepat AI (Pencatatan Transaksi Pintar)",
                        body: "Penanggung jawab operasional (alumni/pengabdian) cukup mengetik atau mendiktekan catatan belanja sehari-hari (contoh: \"Beli beras 5kg, gas elpiji, dan sabun pel 120rb\"), lalu AI Gemini secara otomatis mengenali nominal, jenis transaksi, serta memilih kategori dan sub-kategori yang tepat (termasuk multi-transaksi sekaligus)."
                    },
                    {
                        head: "Rekapitulasi & Pengawasan Pengurus Real-Time",
                        body: "Seluruh pencatatan operasional langsung terhubung ke Dashboard Pengurus dan halaman Laporan Perbandingan Bulanan (/laporan), sehingga pengurus dapat memantau sisa saldo dan tren pengeluaran kapan saja."
                    }
                ]
            },
            limitations: {
                title: "3. Ruang Lingkup & Keterbatasan Saat Ini",
                subtitle: "Mengapa sistem ini baru aktif di operasional harian Putra & Putri:",
                includedTitle: "Sudah Aktif Digunakan (Dipegang Alumni / Pengabdian)",
                includedItems: [
                    "Pengeluaran & pemasukan operasional harian Asrama Putra & Putri",
                    "Belanja dapur harian, utilitas asrama, kebersihan, dan perbaikan ringan",
                    "Pencocokan kas fisik (Cash Match) & laporan perbandingan bulanan"
                ],
                excludedTitle: "Belum Aktif / Masih Manual (Dipegang Pengurus Senior)",
                excludedItems: [
                    "Transaksi Divisi Logistik (fitur sudah ada di web, namun masih kosong/manual)",
                    "Gaji guru dan staf yayasan (Payroll)",
                    "Pembayaran SPP sekolah formal & anggaran pembangunan fisik"
                ],
                reasonTitle: "Alasan & Konteks Sumber Daya Manusia:",
                reasonBody: "Operasional harian Asrama Putra dan Putri dipegang oleh para alumni / pengabdian muda, sehingga penggunaan aplikasi dan fitur AI berjalan sangat lancar. Sebaliknya, bagian Logistik serta keuangan makro yayasan (seperti gaji guru, SPP sekolah, dan pembangunan) masih diurusi oleh pengurus senior (yang berusia lebih sepuh) yang agak kesulitan jika harus mengoperasikan aplikasi digital, sehingga untuk sementara masih menggunakan pembukuan manual."
            },
            access: {
                title: "4. Panduan Login Pengurus & Evaluator",
                body: "Pihak pengurus maupun tim evaluator (seperti dari GM Children Foundation) dipersilakan mencoba login menggunakan akun Google pada tombol \"Login Pengurus\". Demi keamanan data internal yayasan, akun Google baru yang masuk akan berstatus \"Menunggu Persetujuan\" (Pending Approval) dan dapat langsung diaktifkan oleh Admin (baitulqowwam2011@gmail.com)."
            }
        }
    }
};

export function SystemOverviewContent({ lang, setLang, onClose }) {
    const t = CONTENT[lang] || CONTENT.en;

    return (
        <div className="bg-white border-4 border-black pop-shadow max-w-4xl w-full mx-auto overflow-hidden text-left text-slate-900">
            {/* Top Banner */}
            <div className="bg-emerald-600 text-white border-b-4 border-black p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="inline-flex items-center gap-2 bg-black text-emerald-300 font-black uppercase tracking-widest text-[11px] px-3 py-1 mb-2 border-2 border-black">
                        <Sparkles size={13} strokeWidth={3} />
                        <span>{t.badge}</span>
                    </div>
                    <h1 id="systemOverviewTitle" className="text-2xl sm:text-3xl font-black uppercase tracking-tight leading-none">
                        {t.title}
                    </h1>
                    <p className="text-xs sm:text-sm font-bold text-emerald-100 mt-1">
                        {t.subtitle}
                    </p>
                </div>

                {/* Language Switcher + Close */}
                <div className="flex items-center gap-3 self-start sm:self-center shrink-0">
                    <div className="inline-flex border-3 border-black bg-white p-0.5 pop-shadow-sm" role="group" aria-label={t.langLabel}>
                        <button
                            type="button"
                            onClick={() => setLang('en')}
                            className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
                                lang === 'en' ? 'bg-black text-yellow-300' : 'bg-white text-black hover:bg-slate-100'
                            }`}
                        >
                            <span>🇬🇧</span> EN
                        </button>
                        <button
                            type="button"
                            onClick={() => setLang('id')}
                            className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
                                lang === 'id' ? 'bg-black text-yellow-300' : 'bg-white text-black hover:bg-slate-100'
                            }`}
                        >
                            <span>🇮🇩</span> ID
                        </button>
                    </div>

                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label={t.closeBtn}
                            className="bg-red-500 text-white p-2 border-3 border-black hover:bg-red-600 transition-colors pop-shadow-sm"
                        >
                            <X size={20} strokeWidth={3} />
                        </button>
                    )}
                </div>
            </div>

            {/* Body */}
            <div className="p-5 sm:p-8 space-y-6 bg-slate-50">
                {/* 1. Overview & 3 Branches */}
                <section className="bg-white border-4 border-black p-5 pop-shadow-sm">
                    <div className="flex items-center gap-2.5 mb-3">
                        <div className="bg-emerald-400 p-2 border-3 border-black">
                            <BookOpen size={20} strokeWidth={2.5} className="text-black" />
                        </div>
                        <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight">
                            {t.sections.overview.title}
                        </h2>
                    </div>
                    <p className="text-sm font-bold text-slate-600 leading-relaxed mb-4">
                        {t.sections.overview.desc}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {t.sections.overview.branches.map((b, idx) => (
                            <div key={idx} className="border-3 border-black bg-slate-50 flex flex-col">
                                <div className={`${b.color} px-3 py-2 border-b-3 border-black font-black uppercase text-xs tracking-wider flex items-center gap-2`}>
                                    {idx === 2 ? <Truck size={15} strokeWidth={2.5} /> : <Home size={15} strokeWidth={2.5} />}
                                    <span>{b.name}</span>
                                </div>
                                <p className="p-3 text-xs font-bold text-slate-700 leading-relaxed flex-1">
                                    {b.items}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 2. AI Utilization */}
                <section className="bg-white border-4 border-black p-5 pop-shadow-sm">
                    <div className="flex items-center gap-2.5 mb-3">
                        <div className="bg-yellow-400 p-2 border-3 border-black">
                            <Sparkles size={20} strokeWidth={2.5} className="text-black" />
                        </div>
                        <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight">
                            {t.sections.aiRole.title}
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {t.sections.aiRole.points.map((pt, idx) => (
                            <div key={idx} className="bg-yellow-50/70 border-3 border-black p-4">
                                <h3 className="font-black text-sm uppercase tracking-tight mb-1.5 text-slate-900">
                                    ✦ {pt.head}
                                </h3>
                                <p className="text-xs font-bold text-slate-600 leading-relaxed">
                                    {pt.body}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 3. Scope & Limitations (Crucial section) */}
                <section className="bg-white border-4 border-black p-5 pop-shadow-sm">
                    <div className="flex items-center gap-2.5 mb-1">
                        <div className="bg-amber-400 p-2 border-3 border-black">
                            <AlertTriangle size={20} strokeWidth={2.5} className="text-black" />
                        </div>
                        <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight">
                            {t.sections.limitations.title}
                        </h2>
                    </div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                        {t.sections.limitations.subtitle}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {/* Included */}
                        <div className="bg-emerald-50 border-3 border-black p-4">
                            <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-emerald-800 mb-2.5">
                                <CheckCircle2 size={17} strokeWidth={2.5} className="text-emerald-600 shrink-0" />
                                <span>{t.sections.limitations.includedTitle}</span>
                            </div>
                            <ul className="space-y-1.5">
                                {t.sections.limitations.includedItems.map((item, i) => (
                                    <li key={i} className="text-xs font-bold text-slate-700 flex items-start gap-2">
                                        <span className="text-emerald-600 font-black">✓</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Excluded */}
                        <div className="bg-rose-50 border-3 border-black p-4">
                            <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-rose-800 mb-2.5">
                                <XCircle size={17} strokeWidth={2.5} className="text-rose-600 shrink-0" />
                                <span>{t.sections.limitations.excludedTitle}</span>
                            </div>
                            <ul className="space-y-1.5">
                                {t.sections.limitations.excludedItems.map((item, i) => (
                                    <li key={i} className="text-xs font-bold text-slate-700 flex items-start gap-2">
                                        <span className="text-rose-600 font-black">✕</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Reason box */}
                    <div className="bg-amber-50 border-3 border-black p-4">
                        <h3 className="font-black text-xs uppercase tracking-wider text-amber-900 mb-1">
                            💡 {t.sections.limitations.reasonTitle}
                        </h3>
                        <p className="text-xs font-bold text-slate-700 leading-relaxed">
                            {t.sections.limitations.reasonBody}
                        </p>
                    </div>
                </section>

                {/* 4. Access & Approval Guide */}
                <section className="bg-emerald-50 border-4 border-black p-5 pop-shadow-sm">
                    <div className="flex items-start gap-3">
                        <div className="bg-emerald-500 text-white p-2 border-3 border-black shrink-0 mt-0.5">
                            <Lock size={20} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-black uppercase tracking-tight mb-1">
                                {t.sections.access.title}
                            </h2>
                            <p className="text-xs sm:text-sm font-bold text-slate-700 leading-relaxed">
                                {t.sections.access.body}
                            </p>
                        </div>
                    </div>
                </section>

                {/* Footer Action */}
                {onClose && (
                    <div className="flex justify-end pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-black text-white font-black uppercase tracking-widest text-xs sm:text-sm py-3 px-6 border-4 border-black hover:bg-emerald-500 hover:text-black transition-colors pop-shadow-sm flex items-center gap-2"
                        >
                            <ArrowLeft size={16} strokeWidth={3} />
                            <span>{t.backToLogin}</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * Modal dialog wrapper using native <dialog closedby="any"> with light-dismiss fallback.
 */
export function SystemOverviewDialog({ isOpen, onClose, initialLang = 'en' }) {
    const [lang, setLang] = useState(initialLang);
    const dialogRef = useRef(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        if (isOpen) {
            if (!dialog.open) {
                dialog.showModal();
            }
        } else if (dialog.open) {
            dialog.close();
        }
    }, [isOpen]);

    // Fallback for browsers without native closedby="any" support
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        const handleClose = () => {
            if (onClose) onClose();
        };
        dialog.addEventListener('close', handleClose);

        let handleBackdropClick;
        if (!('closedBy' in HTMLDialogElement.prototype)) {
            handleBackdropClick = (event) => {
                if (event.target !== dialog) return;
                const rect = dialog.getBoundingClientRect();
                const isDialogContent = (
                    rect.top <= event.clientY &&
                    event.clientY <= rect.top + rect.height &&
                    rect.left <= event.clientX &&
                    event.clientX <= rect.left + rect.width
                );
                if (isDialogContent) return;
                dialog.close();
            };
            dialog.addEventListener('click', handleBackdropClick);
        }

        return () => {
            dialog.removeEventListener('close', handleClose);
            if (handleBackdropClick) {
                dialog.removeEventListener('click', handleBackdropClick);
            }
        };
    }, [onClose]);

    return (
        <dialog
            ref={dialogRef}
            {...({ closedby: 'any' })}
            aria-labelledby="systemOverviewTitle"
            className="bg-transparent p-2 sm:p-6 max-w-4xl w-full m-auto backdrop:bg-black/60 backdrop:backdrop-blur-xs open:animate-fadeIn"
        >
            <SystemOverviewContent lang={lang} setLang={setLang} onClose={() => dialogRef.current?.close()} />
        </dialog>
    );
}

/**
 * Standalone full-page route component (/about or /info)
 */
export default function SystemOverviewPage({ onBack, initialLang = 'en' }) {
    const [lang, setLang] = useState(initialLang);

    return (
        <div
            className="min-h-screen bg-slate-100 font-sans py-8 px-4 sm:px-6 flex flex-col items-center justify-center"
            style={{
                backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)',
                backgroundSize: '20px 20px',
            }}
        >
            <SystemOverviewContent lang={lang} setLang={setLang} onClose={onBack} />
        </div>
    );
}
