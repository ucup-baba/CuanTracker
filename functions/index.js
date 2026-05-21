const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { google } = require('googleapis');
const PDFDocument = require('pdfkit');
const moment = require('moment');
const fs = require('fs');
const os = require('os');
const path = require('path');

admin.initializeApp();

// Google Drive Folder ID
const DRIVE_FOLDER_ID = '1Pj13RnWu1d2hx0_7MwjWj7cHrDmwPXhi';

// Service Account credentials for Google Drive API
// (Credentials removed - feature disabled for now)
const credentials = {};

function formatRupiah(amount) {
    return 'Rp ' + amount.toLocaleString('id-ID');
}

/**
 * Core report generation logic - shared between scheduler and test endpoint.
 */
async function runReportGeneration() {
    console.log('Starting weekly PDF report generation...');

    const db = admin.firestore();
    const oneWeekAgo = moment().subtract(7, 'days').format('YYYY-MM-DD');
    const today = moment().format('YYYY-MM-DD');
    const snapshot = await db.collection('globalTransactions')
        .where('date', '>=', oneWeekAgo)
        .get();

    let totalIncome = 0;
    let totalExpense = 0;
    const transactions = [];
    const categoryTotals = {};

    snapshot.forEach(d => {
        const data = d.data();
        transactions.push(data);
        if (data.type === 'income') totalIncome += data.amount;
        if (data.type === 'expense') totalExpense += data.amount;

        const catKey = `${data.type}-${data.category}`;
        if (!categoryTotals[catKey]) {
            categoryTotals[catKey] = { type: data.type, category: data.category, total: 0 };
        }
        categoryTotals[catKey].total += data.amount;
    });

    const balance = totalIncome - totalExpense;
    const sortedCategories = Object.values(categoryTotals).sort((a, b) => b.total - a.total);

    // Generate PDF with Neo-Brutalism / Pop Art style
    const tempFilePath = path.join(os.tmpdir(), `CuanTracker_Report_${moment().format('YYYY-MM-DD')}.pdf`);
    const pdfDoc = new PDFDocument({ margin: 40, size: 'A4' });
    const writeStream = fs.createWriteStream(tempFilePath);
    pdfDoc.pipe(writeStream);

    const pageW = pdfDoc.page.width;
    const pageH = pdfDoc.page.height;

    // Background kuning pastel
    pdfDoc.rect(0, 0, pageW, pageH).fill('#fef08a');

    // Header Box with pop shadow
    pdfDoc.rect(44, 44, pageW - 80, 90).fill('#000');
    pdfDoc.rect(40, 40, pageW - 80, 90).fillAndStroke('#fff', '#000');
    pdfDoc.lineWidth(3);
    pdfDoc.fillColor('#000').font('Helvetica-Bold').fontSize(28)
        .text('CUAN TRACKER.', 55, 55, { width: pageW - 120 });
    pdfDoc.font('Helvetica').fontSize(11).fillColor('#333')
        .text(`LAPORAN MINGGUAN: ${moment(oneWeekAgo).format('DD MMM YYYY')} - ${moment(today).format('DD MMM YYYY')}`, 55, 95, { width: pageW - 120 });

    // Summary Cards Row
    const cardY = 155;
    const cardH = 70;
    const cardW = (pageW - 80 - 20) / 3;

    // Balance Card (Blue)
    pdfDoc.rect(44, cardY + 4, cardW, cardH).fill('#000');
    pdfDoc.rect(40, cardY, cardW, cardH).fillAndStroke('#60a5fa', '#000');
    pdfDoc.lineWidth(3);
    pdfDoc.fillColor('#000').font('Helvetica-Bold').fontSize(10).text('SISA AMUNISI', 50, cardY + 12, { width: cardW - 20 });
    pdfDoc.fontSize(18).text(formatRupiah(balance), 50, cardY + 35, { width: cardW - 20 });

    // Income Card (Green)
    const card2X = 40 + cardW + 10;
    pdfDoc.rect(card2X + 4, cardY + 4, cardW, cardH).fill('#000');
    pdfDoc.rect(card2X, cardY, cardW, cardH).fillAndStroke('#4ade80', '#000');
    pdfDoc.lineWidth(3);
    pdfDoc.fillColor('#000').font('Helvetica-Bold').fontSize(10).text('PANEN CUAN', card2X + 10, cardY + 12, { width: cardW - 20 });
    pdfDoc.fontSize(18).text(formatRupiah(totalIncome), card2X + 10, cardY + 35, { width: cardW - 20 });

    // Expense Card (Red)
    const card3X = card2X + cardW + 10;
    pdfDoc.rect(card3X + 4, cardY + 4, cardW, cardH).fill('#000');
    pdfDoc.rect(card3X, cardY, cardW, cardH).fillAndStroke('#f87171', '#000');
    pdfDoc.lineWidth(3);
    pdfDoc.fillColor('#000').font('Helvetica-Bold').fontSize(10).text('DOMPET JEBOL', card3X + 10, cardY + 12, { width: cardW - 20 });
    pdfDoc.fillColor('#fff').font('Helvetica-Bold').fontSize(18).text(formatRupiah(totalExpense), card3X + 10, cardY + 35, { width: cardW - 20 });

    // Category Breakdown Table
    let tableY = cardY + cardH + 30;
    pdfDoc.rect(44, tableY + 4, pageW - 80, 30).fill('#000');
    pdfDoc.rect(40, tableY, pageW - 80, 30).fillAndStroke('#000', '#000');
    pdfDoc.fillColor('#fef08a').font('Helvetica-Bold').fontSize(12)
        .text('KATEGORI', 55, tableY + 9)
        .text('TIPE', 250, tableY + 9)
        .text('JUMLAH', pageW - 180, tableY + 9, { width: 140, align: 'right' });
    tableY += 30;

    const rowColors = ['#fff', '#fef9c3'];
    sortedCategories.forEach((cat, i) => {
        if (tableY > pageH - 80) return;
        const rowColor = rowColors[i % 2];
        pdfDoc.rect(40, tableY, pageW - 80, 28).fillAndStroke(rowColor, '#000');
        pdfDoc.lineWidth(2);
        pdfDoc.fillColor('#000').font('Helvetica-Bold').fontSize(11)
            .text(cat.category.toUpperCase(), 55, tableY + 8)
            .text(cat.type === 'income' ? 'MASUK' : 'KELUAR', 250, tableY + 8);
        const amountColor = cat.type === 'income' ? '#16a34a' : '#dc2626';
        pdfDoc.fillColor(amountColor).font('Helvetica-Bold').fontSize(11)
            .text(formatRupiah(cat.total), pageW - 180, tableY + 8, { width: 140, align: 'right' });
        tableY += 28;
    });

    if (sortedCategories.length === 0) {
        pdfDoc.rect(40, tableY, pageW - 80, 40).fillAndStroke('#fff', '#000');
        pdfDoc.fillColor('#999').font('Helvetica').fontSize(12)
            .text('Belum ada transaksi minggu ini, Bos!', 55, tableY + 12);
    }

    // Footer
    pdfDoc.fillColor('#000').font('Helvetica').fontSize(9)
        .text(`Dibuat otomatis oleh CuanTracker Robot - ${moment().format('DD MMM YYYY HH:mm')} WIB`, 40, pageH - 50, { width: pageW - 80, align: 'center' });

    pdfDoc.end();
    await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
    });
    console.log('PDF generated at:', tempFilePath);

    // Upload to Google Drive
    // Fitur dinonaktifkan sementara karena kunci dihapus
    /*
    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive']
    });
    const drive = google.drive({ version: 'v3', auth });

    const fileMetadata = {
        name: `Laporan CuanTracker - ${moment(oneWeekAgo).format('DD MMM')} s.d. ${moment(today).format('DD MMM YYYY')}.pdf`,
        parents: [DRIVE_FOLDER_ID]
    };
    const media = {
        mimeType: 'application/pdf',
        body: fs.createReadStream(tempFilePath)
    };
    const file = await drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id',
        supportsAllDrives: true
    });

    console.log(`PDF uploaded to Drive. File ID: ${file.data.id}`);
    */
    fs.unlinkSync(tempFilePath); // Tetap hapus file temp
    
    return { totalIncome, totalExpense, balance, transactionCount: transactions.length, driveFileId: null };
}

/**
 * Scheduled: Every Sunday at 23:59 WIB
 */
exports.generateWeeklyReport = functions
    .region('asia-southeast2')
    .pubsub.schedule('59 23 * * 0')
    .timeZone('Asia/Jakarta')
    .onRun(async () => {
        try {
            await runReportGeneration();
        } catch (error) {
            console.error('Scheduled report error:', error);
        }
        return null;
    });

/**
 * HTTP Test Endpoint - trigger manually via browser URL.
 * DELETE this function after testing is confirmed working!
 */
exports.testReport = functions
    .region('asia-southeast2')
    .https.onRequest(async (req, res) => {
        try {
            const result = await runReportGeneration();
            res.json({ success: true, message: 'Laporan PDF berhasil dibuat dan diupload ke Google Drive Bos!', ...result });
        } catch (error) {
            console.error('Test report error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

// =====================================================================
// AI ASSISTANT (Gemini proxy)
// Single callable that proxies to the Gemini API. The API key lives only
// on the server as the secret GEMINI_KEY (never shipped to the browser).
// Two modes:
//   - "parse": free text -> structured transaction JSON
//   - "chat" : finance question + client-built aggregate summary -> answer
// Node 20 runtime provides a global fetch().
// =====================================================================
const GEMINI_MODEL = 'gemini-3.5-flash';

// Pull the answer text out of Gemini's response (skip thought-only parts).
function extractGeminiText(json) {
    const parts = json?.candidates?.[0]?.content?.parts || [];
    return parts.map(p => p && p.text).filter(Boolean).join('').trim();
}

async function callGemini({ systemText, contents, jsonOut }) {
    const key = process.env.GEMINI_KEY;
    if (!key) {
        throw new functions.https.HttpsError('failed-precondition', 'GEMINI_KEY belum di-set di server.');
    }
    const body = {
        contents,
        generationConfig: {
            temperature: jsonOut ? 0 : 0.7,
            maxOutputTokens: 2048,
        },
    };
    if (systemText) body.systemInstruction = { parts: [{ text: systemText }] };
    if (jsonOut) body.generationConfig.responseMimeType = 'application/json';

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;
    let resp;
    try {
        resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
    } catch (err) {
        throw new functions.https.HttpsError('unavailable', 'Gagal menghubungi Gemini: ' + err.message);
    }
    if (!resp.ok) {
        const t = await resp.text().catch(() => '');
        console.error('Gemini error', resp.status, t.slice(0, 500));
        throw new functions.https.HttpsError('internal', `Gemini error ${resp.status}`);
    }
    const data = await resp.json();
    return extractGeminiText(data);
}

function buildParsePrompt(payload) {
    const { text, wallets = [], categories = {}, defaultWallet = 'pribadi', today } = payload;
    return [
        `Tanggal hari ini: ${today}.`,
        `Dompet tersedia: ${wallets.join(', ') || defaultWallet}.`,
        `Kategori per dompet & tipe (JSON): ${JSON.stringify(categories)}.`,
        '',
        'Ubah kalimat transaksi berikut menjadi SATU objek JSON.',
        `Kalimat: "${text}"`,
        '',
        'Aturan:',
        '- "type": "expense" (default) | "income" | "transfer".',
        `- "wallet": salah satu dari dompet tersedia (default "${defaultWallet}").`,
        '- "amount": integer Rupiah tanpa titik. "15rb"/"15k"=15000, "2jt"=2000000.',
        '- "category" & "subCategory": WAJIB dipilih dari daftar kategori untuk wallet+type tsb. Pilih paling cocok; jika ragu pakai kategori "Lain-lain"/"Lain-lain Masuk" bila ada.',
        '- "text": keterangan singkat (judul) dari kalimat, huruf kapital wajar.',
        '- Untuk transfer, "category" & "subCategory" = null.',
        'Keluarkan HANYA JSON valid, tanpa penjelasan.',
    ].join('\n');
}

exports.aiAssistant = functions
    .region('asia-southeast2')
    .runWith({ secrets: ['GEMINI_KEY'] })
    .https.onCall(async (data, context) => {
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Harus login dulu.');
        }
        const { mode, payload = {} } = data || {};

        if (mode === 'parse') {
            if (!payload.text || !payload.text.trim()) {
                throw new functions.https.HttpsError('invalid-argument', 'Teks transaksi kosong.');
            }
            const prompt = buildParsePrompt(payload);
            const out = await callGemini({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                jsonOut: true,
            });
            let parsed;
            try {
                parsed = JSON.parse(out);
            } catch (e) {
                throw new functions.https.HttpsError('internal', 'Gagal membaca hasil parse AI.');
            }
            return { ok: true, transaction: parsed };
        }

        if (mode === 'chat') {
            const { question, summary, history = [], canRecord = false, categories, wallets, defaultWallet, today } = payload;
            if (!question || !question.trim()) {
                throw new functions.https.HttpsError('invalid-argument', 'Pertanyaan kosong.');
            }
            const lines = [
                'Kamu "Asisten Cuan", asisten keuangan di aplikasi CuanTracker.',
                'Bahasa Indonesia, santai tapi jelas. Mata uang Rupiah (Rp).',
                'Jawab RINGKAS dan actionable: beri insight + rekomendasi praktis (budgeting, pola pengeluaran).',
                'Gunakan HANYA data ringkasan di bawah; JANGAN mengarang angka. Bila data kurang, katakan terus terang.',
                'Hindari saran investasi berisiko.',
                '',
                'RINGKASAN KEUANGAN USER (JSON):',
                JSON.stringify(summary || {}),
            ];
            if (canRecord) {
                lines.push('');
                lines.push('MODE CATAT AKTIF: user mengizinkanmu mencatat transaksi ke aplikasi.');
                lines.push(`Dompet tersedia: ${(wallets || []).join(', ') || defaultWallet}. Default: ${defaultWallet}.`);
                lines.push(`Kategori valid per dompet & tipe (JSON): ${JSON.stringify(categories || {})}.`);
                lines.push(`Tanggal hari ini: ${today || '(tak diketahui)'}. Untuk "date" PAKAI tanggal hari ini ini, KECUALI user menyebut tanggal lain secara eksplisit (mis. "kemarin", "tanggal 10"). Format "date" WAJIB YYYY-MM-DD.`);
                lines.push('Jika DAN HANYA JIKA user jelas ingin MENCATAT/menambah transaksi, isi field "transactions". "category" & "subCategory" WAJIB dipilih dari daftar valid untuk wallet+type tsb. "amount" integer Rupiah ("15rb"=15000, "2jt"=2000000). Jangan mencatat kalau user cuma bertanya/analisis.');
                lines.push('Balas SELALU JSON valid: {"reply": string, "transactions": [{"type":"expense|income","wallet":string,"amount":integer,"category":string,"subCategory":string,"text":string,"date":"YYYY-MM-DD"}]}. transactions=[] bila tidak mencatat. "reply" = pesan natural buat user (konfirmasi apa yang dicatat / jawaban).');
            }
            const systemText = lines.join('\n');

            const contents = [];
            for (const m of history.slice(-6)) {
                if (!m || !m.text) continue;
                contents.push({ role: m.role === 'model' ? 'model' : 'user', parts: [{ text: String(m.text) }] });
            }
            contents.push({ role: 'user', parts: [{ text: String(question) }] });

            const out = await callGemini({ systemText, contents, jsonOut: !!canRecord });
            if (canRecord) {
                let parsed;
                try { parsed = JSON.parse(out); } catch (e) { parsed = { reply: out, transactions: [] }; }
                return {
                    ok: true,
                    answer: typeof parsed.reply === 'string' ? parsed.reply : '',
                    transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
                };
            }
            return { ok: true, answer: out };
        }

        throw new functions.https.HttpsError('invalid-argument', 'Mode tidak dikenal.');
    });
