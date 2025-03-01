/**
 * Formats the current date in the specified format
 * Default is YYYY-MM-DD format
 */
export function getTodayDate(format: string = 'YYYY-MM-DD'): string {
    const today = new Date();
    
    if (format === 'YYYY-MM-DD') {
        return formatDateAsYYYYMMDD(today);
    }
    
    // Handle basic date format patterns
    // This is a simplified implementation and could be expanded
    return format
        .replace('YYYY', today.getFullYear().toString())
        .replace('MM', String(today.getMonth() + 1).padStart(2, '0'))
        .replace('DD', String(today.getDate()).padStart(2, '0'))
        .replace('ddd', getDayOfWeekShort(today))
        .replace('MMM', getMonthNameShort(today));
}

/**
 * Formats a date as YYYY-MM-DD
 */
export function formatDateAsYYYYMMDD(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Formats a date string in a human-readable format with ordinal suffix
 * @param dateString String in YYYY-MM-DD format or other format that Date can parse
 * @returns Formatted date string (e.g., "Feb 15th, 2023")
 */
export function formatDateForDisplay(dateString: string): string {
    const date = new Date(dateString);
    const dateFormatOptions: Intl.DateTimeFormatOptions = { 
        month: 'short', 
        year: 'numeric', 
        day: 'numeric' 
    };

    // Format date using Intl.DateTimeFormat
    const formattedDate = new Intl.DateTimeFormat('en-US', dateFormatOptions).format(date);

    // Extract day and add ordinal suffix
    const day = date.getDate();
    const daySuffix = getDaySuffix(day);

    // Build the final formatted string
    const parts = formattedDate.split(' ');
    return `${parts[0]} ${day}${daySuffix}, ${parts[2]}`;
}

/**
 * Gets the appropriate ordinal suffix for a day number
 */
export function getDaySuffix(day: number): string {
    if (day > 3 && day < 21) return 'th'; // Special case for 11th-19th
    switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
    }
}

/**
 * Gets short day name (Mon, Tue, etc.)
 */
export function getDayOfWeekShort(date: Date): string {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
}

/**
 * Gets short month name (Jan, Feb, etc.)
 */
export function getMonthNameShort(date: Date): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[date.getMonth()];
}

/**
 * Checks if a string matches the YYYY-MM-DD pattern
 */
export function isDateFormat(text: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(text);
}