// Formats the current date in YYYY-MM-DD format
export function getTodayDate(): string {
    const today = new Date();
    return formatDateString(today);
}

// Formats the current date in MMM Do, YYYY format (e.g., "Sep 23rd, 2025")
export function getTodayHumanDate(): string {
    const today = new Date();
    return formatDateForDisplay(formatDateString(today));
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
    let date: Date;
    
    // Handle both YYYY-MM-DD and MMM Do, YYYY formats
    if (isDateFormat(dateString)) {
        // Parse YYYY-MM-DD format in local timezone to avoid timezone issues
        const [year, month, day] = dateString.split('-').map(part => parseInt(part));
        date = new Date(year, month - 1, day); // month is 0-indexed
    } else if (isHumanDateFormat(dateString)) {
        // Parse human date format directly in local timezone
        const match = dateString.match(/^([A-Za-z]{3})\s+(\d{1,2})(st|nd|rd|th),\s+(\d{4})$/);
        if (!match) {
            console.error(`Could not parse human date: ${dateString}`);
            return dateString;
        }
        
        const [, monthStr, dayStr, , yearStr] = match;
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthIndex = monthNames.indexOf(monthStr);
        if (monthIndex === -1) {
            console.error(`Invalid month: ${monthStr}`);
            return dateString;
        }
        
        const year = parseInt(yearStr);
        const month = monthIndex; // 0-indexed for Date constructor
        const day = parseInt(dayStr);
        
        date = new Date(year, month, day);
    } else {
        // Fallback: try to parse as-is
        date = new Date(dateString);
    }
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
        console.error(`Invalid date string: ${dateString}`);
        return dateString; // Return original string if parsing fails
    }
    
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

// Checks if a string matches the MMM Do, YYYY pattern (e.g., "Apr 10th, 2025")
export function isHumanDateFormat(text: string): boolean {
    return /^[A-Za-z]{3}\s+\d{1,2}(st|nd|rd|th),\s+\d{4}$/.test(text);
}

// Checks if a string matches any supported date format
export function isAnyDateFormat(text: string): boolean {
    return isDateFormat(text) || isHumanDateFormat(text);
}

// Converts human date format (MMM Do, YYYY) to YYYY-MM-DD format
export function humanDateToISO(humanDate: string): string {
    if (!isHumanDateFormat(humanDate)) {
        throw new Error(`Invalid human date format: ${humanDate}`);
    }
    
    // Parse the human date format
    const match = humanDate.match(/^([A-Za-z]{3})\s+(\d{1,2})(st|nd|rd|th),\s+(\d{4})$/);
    if (!match) {
        throw new Error(`Could not parse human date: ${humanDate}`);
    }
    
    const [, monthStr, dayStr, , yearStr] = match;
    
    // Convert month name to number
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIndex = monthNames.indexOf(monthStr);
    if (monthIndex === -1) {
        throw new Error(`Invalid month: ${monthStr}`);
    }
    
    const month = monthIndex + 1; // Convert to 1-indexed for ISO format
    const day = parseInt(dayStr);
    const year = parseInt(yearStr);
    
    // Format as YYYY-MM-DD (this is just string formatting, no Date object creation)
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}