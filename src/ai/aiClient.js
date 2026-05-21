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

// text -> array of structured transactions [{ type, wallet, amount, category, subCategory, text }, ...]
export async function parseTransaction({ text, wallets, categories, defaultWallet }) {
    const today = new Date().toISOString().split('T')[0];
    const res = await callAi({
        mode: 'parse',
        payload: { text, wallets, categories, defaultWallet, today },
    });
    if (Array.isArray(res.data?.transactions)) return res.data.transactions;
    return res.data?.transaction ? [res.data.transaction] : [];
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
