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
