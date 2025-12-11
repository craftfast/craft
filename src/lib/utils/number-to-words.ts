/**
 * Number to Words Conversion Utility
 * 
 * Converts numeric amounts to words for invoices and receipts.
 * Supports Indian numbering system (Crore, Lakh, Thousand).
 */

const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

/**
 * Convert a number less than 1000 to words
 */
function convertLessThanThousand(num: number): string {
    if (num === 0) return '';
    if (num < 20) return ones[num];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
    return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + convertLessThanThousand(num % 100) : '');
}

/**
 * Convert a number to words using Indian numbering system
 * (Crore, Lakh, Thousand)
 */
function convertIndian(num: number): string {
    if (num === 0) return 'Zero';

    let result = '';

    // Crores (1,00,00,000)
    if (num >= 10000000) {
        result += convertLessThanThousand(Math.floor(num / 10000000)) + ' Crore ';
        num %= 10000000;
    }

    // Lakhs (1,00,000)
    if (num >= 100000) {
        result += convertLessThanThousand(Math.floor(num / 100000)) + ' Lakh ';
        num %= 100000;
    }

    // Thousands
    if (num >= 1000) {
        result += convertLessThanThousand(Math.floor(num / 1000)) + ' Thousand ';
        num %= 1000;
    }

    // Hundreds and below
    if (num > 0) {
        result += convertLessThanThousand(num);
    }

    return result.trim();
}

/**
 * Convert a currency amount to words
 * @param amount - The numeric amount
 * @param currency - Currency code ('INR' or 'USD')
 * @returns Amount in words (e.g., "One Thousand Two Hundred Thirty Four Rupees and Fifty Six Paise Only")
 */
export function amountToWords(amount: number, currency: string): string {
    const mainUnit = Math.floor(amount);
    const subUnit = Math.round((amount - mainUnit) * 100);

    const currencyName = currency === 'INR' ? 'Rupees' : 'Dollars';
    const subunitName = currency === 'INR' ? 'Paise' : 'Cents';

    let words = convertIndian(mainUnit) + ' ' + currencyName;
    if (subUnit > 0) {
        words += ' and ' + convertIndian(subUnit) + ' ' + subunitName;
    }
    words += ' Only';

    return words;
}
