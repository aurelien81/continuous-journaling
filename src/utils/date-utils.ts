// Formats the current date in YYYY-MM-DD format
export function getTodayDate(): string {
    const today = new Date();
    return formatDateString(today);
}

// Formats a date as YYYY-MM-DD
export function formatDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Formats a date string in a human-readable format with ordinal suffix
export function formatDateForDisplay(dateString: string): string {
    const date = new Date(dateString);
    const dateFormatOptions: Intl.DateTimeFormatOptions = { 
        month: 'short', 
        year: 'numeric', 
        day: 'numeric' 
    };

    // Format date using Intl.DateTimeFormat
    const formattedDate = new Intl.DateTimeFormat('en-US', dateFormatOptions).format(date);

    // Extract day and add ordinal suffix (e.g., 'st', 'nd', 'rd', 'th')
    const day = date.getDate();
    const daySuffix = getDaySuffix(day);

    // Build the final formatted string
    const parts = formattedDate.split(' ');
    return `${parts[0]} ${day}${daySuffix}, ${parts[2]}`;
}

// Gets the appropriate ordinal suffix for a day number
export function getDaySuffix(day: number): string {
    if (day > 3 && day < 21) return 'th'; // Special case for 11th-19th
    switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
    }
}

// Checks if a string matches the YYYY-MM-DD pattern
export function isDateFormat(text: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(text);
}