// Thin client around the `aiAssistant` Cloud Function (Gemini proxy).
// The Gemini API key never reaches the browser — everything goes through the
// callable, which reads the key from a server-side secret.
import { functionsClient, httpsCallable } from '../firebase';

const callAi = httpsCallable(functionsClient, 'aiAssistant');

// Convert Indonesian shorthand amounts to a number, client-side, so we can
// pre-fill / sanity-check without always paying for an AI call.
// "15rb" / "15 ribu" / "15k" -> 15000 ; "2jt" / "2 juta" -> 2000000.
export function parseAmountId(input) {
    if (input == null) return 0;
    const s = String(input).toLowerCase().replace(/\s+/g, '');
    const m = s.match(/(\d+(?:[.,]\d+)?)(jt|juta|rb|ribu|k|m)?/);
    if (!m) return 0;
    let n = parseFloat(m[1].replace(',', '.')) || 0;
    const unit = m[2];
    if (unit === 'jt' || unit === 'juta' || unit === 'm') n *= 1_000_000;
    else if (unit === 'rb' || unit === 'ribu' || unit === 'k') n *= 1_000;
    return Math.round(n);
}

const INCOME_WORDS = ['masuk', 'gaji', 'bonus', 'thr', 'iuran', 'donasi', 'dana', 'reimburse', 'cashback', 'terima', 'dapat'];
const FOOD_WORDS = ['makan', 'minum', 'kopi', 'jajan', 'telur', 'beras', 'ayam', 'sayur', 'tempe', 'tahu', 'mie', 'roti', 'nasi', 'gas', 'galon'];
const TRANSPORT_WORDS = ['bensin', 'ojek', 'grab', 'gojek', 'parkir', 'tol', 'transport'];
const BILL_WORDS = ['listrik', 'air', 'wifi', 'internet', 'pulsa', 'tagihan'];

function textHasAny(text, words) {
    return words.some((word) => text.includes(word));
}

function firstCategory(categoriesForType = {}) {
    return Object.keys(categoriesForType)[0] || '';
}

function findCategoryByNames(categoriesForType = {}, names = []) {
    const entries = Object.entries(categoriesForType);
    const found = entries.find(([cat, subs]) => {
        const haystack = [cat, ...(subs || [])].join(' ').toLowerCase();
        return names.some((name) => haystack.includes(name));
    });
    return found?.[0] || '';
}

function pickSubCategory(subs = [], text = '') {
    if (!subs.length) return '';
    const lowerSubs = subs.map((sub) => ({ raw: sub, lower: sub.toLowerCase() }));
    const direct = lowerSubs.find(({ lower }) => text.includes(lower));
    if (direct) return direct.raw;

    if (textHasAny(text, ['telur', 'beras', 'ayam', 'sayur', 'tempe', 'tahu', 'gas', 'galon'])) {
        const bahan = lowerSubs.find(({ lower }) => lower.includes('bahan') || lower.includes('belanja'));
        if (bahan) return bahan.raw;
    }
    if (textHasAny(text, ['kopi', 'jajan', 'snack'])) {
        const jajan = lowerSubs.find(({ lower }) => lower.includes('kopi') || lower.includes('jajan') || lower.includes('snack'));
        if (jajan) return jajan.raw;
    }
    if (textHasAny(text, ['listrik', 'air', 'wifi', 'internet', 'pulsa'])) {
        const bill = lowerSubs.find(({ lower }) => text.includes(lower) || lower.includes('tagihan'));
        if (bill) return bill.raw;
    }
    return subs[0];
}

function parseLocalTransaction({ text, wallets = [], categories = {}, defaultWallet = 'pribadi' }) {
    const raw = String(text || '').trim();
    const lower = raw.toLowerCase();
    const amount = parseAmountId(lower);
    if (!raw || !amount) return [];

    const wallet = wallets.find((w) => lower.includes(w) || lower.includes(w.replace('asrama', 'asrama '))) || defaultWallet || wallets[0] || 'pribadi';
    const type = textHasAny(lower, INCOME_WORDS) ? 'income' : 'expense';
    const cats = categories?.[wallet]?.[type] || {};
    let category = '';

    if (type === 'income') {
        category = findCategoryByNames(cats, ['iuran', 'gaji', 'dana', 'reimburse', 'donasi', 'masuk']) || firstCategory(cats);
    } else if (textHasAny(lower, FOOD_WORDS)) {
        category = findCategoryByNames(cats, ['dapur', 'makan', 'minum', 'belanja bahan', 'konsumsi']) || firstCategory(cats);
    } else if (textHasAny(lower, TRANSPORT_WORDS)) {
        category = findCategoryByNames(cats, ['transport', 'bensin', 'ojek', 'parkir']);
    } else if (textHasAny(lower, BILL_WORDS)) {
        category = findCategoryByNames(cats, ['tagihan', 'listrik', 'internet', 'pulsa']);
    }

    category = category || firstCategory(cats);
    if (!category) return [];

    const subCategory = pickSubCategory(cats[category] || [], lower);
    const label = raw
        .replace(/\b\d+(?:[.,]\d+)?\s*(?:jt|juta|rb|ribu|k|m)?\b/i, '')
        .replace(/\b(pribadi|asrama|putri|logistik)\b/i, '')
        .replace(/\s+/g, ' ')
        .trim();

    return [{
        __localFallback: true,
        type,
        wallet,
        amount,
        category,
        subCategory,
        text: (label || raw).toUpperCase(),
        date: new Date().toISOString().split('T')[0],
    }];
}

// text -> array of structured transactions [{ type, wallet, amount, category, subCategory, text }, ...]
export async function parseTransaction({ text, wallets, categories, defaultWallet }) {
    const today = new Date().toISOString().split('T')[0];
    try {
        const res = await callAi({
            mode: 'parse',
            payload: { text, wallets, categories, defaultWallet, today },
        });
        if (Array.isArray(res.data?.transactions)) return res.data.transactions;
        return res.data?.transaction ? [res.data.transaction] : [];
    } catch (error) {
        const local = parseLocalTransaction({ text, wallets, categories, defaultWallet });
        if (local.length) return local;
        throw error;
    }
}

// finance question + aggregate summary -> { answer, transactions }
// When canRecord is true, the model may return transactions to be saved
// (categories/wallets describe what's valid so it picks correctly).
export async function financeChat({ question, summary, history, canRecord = false, categories, wallets, defaultWallet }) {
    const today = new Date().toISOString().split('T')[0];
    const res = await callAi({
        mode: 'chat',
        payload: { question, summary, history, canRecord, categories, wallets, defaultWallet, today },
    });
    return { answer: res.data?.answer || '', transactions: res.data?.transactions || [] };
}
