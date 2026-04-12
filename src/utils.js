export const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(angka);
};

export const formatRupiahShort = (angka) => {
    if (angka === 0) return 'Rp 0';
    const isNegative = angka < 0;
    const absAngka = Math.abs(angka);
    let result = '';
    if (absAngka >= 1000000000) {
        result = (absAngka / 1000000000).toFixed(1).replace(/\.0$/, '') + 'b';
    } else if (absAngka >= 1000000) {
        result = (absAngka / 1000000).toFixed(1).replace(/\.0$/, '') + 'jt'; /* jt for juta */
    } else if (absAngka >= 1000) {
        result = (absAngka / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    } else {
        result = absAngka.toString();
    }
    return isNegative ? `-Rp ${result}` : `Rp ${result}`;
};
