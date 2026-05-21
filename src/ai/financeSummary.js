// Build a COMPACT, aggregate-only summary of the user's finances to send to the
// AI assistant. We deliberately send aggregates (not raw rows) to keep tokens
// low and avoid shipping every transaction off-device.
//
// `walletFilter` scopes the data: e.g. the putra account holds both "pribadi"
// and "asrama" wallets, but the assistant should only reason over the personal
// ("pribadi") wallet — never analyze the shared dormitory funds separately.
//
// IMPORTANT — must match the dashboard math (App.jsx totals): for the scoped
// wallet, a transfer INTO it counts as income and a transfer OUT counts as
// expense. We still expose those internal transfers separately (and the real,
// non-transfer cashflow) so the AI can tell "moved my own money" apart from
// "actually earned/spent".

const MONTH_KEY = (date) => String(date || '').slice(0, 7); // YYYY-MM

export function buildFinanceSummary(transactions = [], { walletFilter = null, monthsBack = 4, scopeLabel = null } = {}) {
    let totalIncome = 0;   // dashboard-consistent (includes transfer-in)
    let totalExpense = 0;  // dashboard-consistent (includes transfer-out)
    let realIncome = 0;    // excludes internal transfers
    let realExpense = 0;
    let transfersIn = 0;
    let transfersOut = 0;
    let count = 0;

    const expenseByCat = {};
    const incomeByCat = {};
    const byMonth = {};
    const subByCat = {};
    let minDate = null;
    let maxDate = null;

    const bumpMonth = (mk, key, amt) => {
        if (!byMonth[mk]) byMonth[mk] = { income: 0, expense: 0 };
        byMonth[mk][key] += amt;
    };
    const touchDate = (d) => {
        if (!d) return;
        if (!minDate || d < minDate) minDate = d;
        if (!maxDate || d > maxDate) maxDate = d;
    };

    for (const t of transactions) {
        const amt = Number(t.amount) || 0;
        const mk = MONTH_KEY(t.date);

        if (t.type === 'transfer') {
            // Single-wallet roles (putri/logistik) have no transfers.
            if (!walletFilter) continue;
            if (t.toWallet === walletFilter) {
                totalIncome += amt; transfersIn += amt; count++;
                touchDate(t.date); bumpMonth(mk, 'income', amt);
                incomeByCat['Transfer Masuk (antar dompet)'] = (incomeByCat['Transfer Masuk (antar dompet)'] || 0) + amt;
            } else if (t.fromWallet === walletFilter) {
                totalExpense += amt; transfersOut += amt; count++;
                touchDate(t.date); bumpMonth(mk, 'expense', amt);
                expenseByCat['Transfer Keluar (antar dompet)'] = (expenseByCat['Transfer Keluar (antar dompet)'] || 0) + amt;
            }
            continue;
        }

        if (walletFilter && t.wallet !== walletFilter) continue;
        count++;
        touchDate(t.date);

        if (t.type === 'income') {
            totalIncome += amt; realIncome += amt;
            incomeByCat[t.category || 'Lainnya'] = (incomeByCat[t.category || 'Lainnya'] || 0) + amt;
            bumpMonth(mk, 'income', amt);
        } else {
            totalExpense += amt; realExpense += amt;
            const cat = t.category || 'Lainnya';
            expenseByCat[cat] = (expenseByCat[cat] || 0) + amt;
            bumpMonth(mk, 'expense', amt);
            if (t.subCategory) {
                if (!subByCat[cat]) subByCat[cat] = {};
                subByCat[cat][t.subCategory] = (subByCat[cat][t.subCategory] || 0) + amt;
            }
        }
    }

    const topExpenses = Object.entries(expenseByCat)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([category, total]) => ({ category, total, subs: subByCat[category] || undefined }));

    const recentMonths = Object.keys(byMonth)
        .sort()
        .slice(-monthsBack)
        .reduce((acc, k) => { acc[k] = byMonth[k]; return acc; }, {});

    return {
        currency: 'IDR',
        scope: scopeLabel || (walletFilter ? `dompet "${walletFilter}"` : 'semua data'),
        transactionCount: count,
        dateRange: minDate && maxDate ? { from: minDate, to: maxDate } : null,
        // Sama persis dengan angka di kartu Dashboard:
        totals: { income: totalIncome, expense: totalExpense, balance: totalIncome - totalExpense },
        // Bagian yang sebenarnya cuma pindah antar dompet sendiri (bukan cuan/biaya riil):
        internalTransfers: { masuk: transfersIn, keluar: transfersOut },
        // Cashflow riil tanpa transfer antar dompet:
        realCashflow: { pemasukanRiil: realIncome, pengeluaranRiil: realExpense, selisihRiil: realIncome - realExpense },
        topExpenseCategories: topExpenses,
        incomeByCategory: incomeByCat,
        monthlyTrend: recentMonths,
        note: 'totals = sama dgn kartu Dashboard (transfer antar-dompet sendiri DIHITUNG sebagai masuk/keluar dompet ini). internalTransfers = bagian yang cuma pindah uang sendiri antar dompet, BUKAN pemasukan/pengeluaran riil. Pakai realCashflow untuk menilai apakah user benar-benar surplus/defisit dari aktivitas nyata, dan jelaskan bedanya ke user bila relevan.',
    };
}
