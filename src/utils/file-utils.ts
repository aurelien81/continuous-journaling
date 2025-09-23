import { App, Notice, TFile, TFolder } from 'obsidian';
import { isDateFormat, isAnyDateFormat, humanDateToISO } from './date-utils';

/**
 * Gets the full path for a file within the specified folder
 */
export function getFilePath(folder: string, filename: string): string {
    if (folder) {
        return `${folder}/${filename}`;
    }
    return filename;
}

/**
 * Ensures that the specified folder exists, creating it if necessary
 */
export async function ensureFolder(app: App, folderPath: string): Promise<boolean> {
    // If no folder is specified, nothing to create
    if (!folderPath) {
        return true;
    }

    // Check if folder exists
    const folderExists = app.vault.getAbstractFileByPath(folderPath);
    
    // If it exists, make sure it's a folder
    if (folderExists && !(folderExists instanceof TFolder)) {
        new Notice(`Cannot create folder: "${folderPath}" exists but is not a folder`);
        return false;
    }
    
    // Create folder if it doesn't exist
    if (!folderExists) {
        try {
            await app.vault.createFolder(folderPath);
            new Notice(`Created folder: ${folderPath}`);
            return true;
        } catch (error) {
            new Notice(`Failed to create folder: ${error}`);
            console.error('Failed to create folder:', error);
            return false;
        }
    }
    
    return true;
}

/**
 * Generates a file path for a journal entry based on the date and folder format
 */
export function getJournalFilePath(journalFolder: string, filename: string, folderFormat: string = ''): string {
    // If no folder format is specified, use the flat structure
    if (!folderFormat) {
        return getFilePath(journalFolder, filename);
    }
    
    // Extract the date from the filename (supporting both YYYY-MM-DD.md and MMM Do, YYYY.md formats)
    const datePart = filename.split('.')[0]; // Remove file extension
    if (!isAnyDateFormat(datePart)) {
        // If filename doesn't match any supported date pattern, fall back to flat structure
        return getFilePath(journalFolder, filename);
    }
    
    // Convert to ISO format if needed
    let isoDate: string;
    if (isDateFormat(datePart)) {
        isoDate = datePart;
    } else {
        isoDate = humanDateToISO(datePart);
    }
    
    // Parse the ISO date
    const [year, month, day] = isoDate.split('-').map(part => parseInt(part));
    
    // Format the folder path based on the pattern
    let formattedPath = folderFormat;
    formattedPath = formattedPath.replace('YYYY', year.toString());
    formattedPath = formattedPath.replace('MM', month.toString().padStart(2, '0'));
    formattedPath = formattedPath.replace('DD', day.toString().padStart(2, '0'));
    
    // Combine the base folder, formatted path, and filename
    if (journalFolder) {
        return `${journalFolder}/${formattedPath}/${filename}`;
    }
    return `${formattedPath}/${filename}`;
}

/**
 * Ensures all folders in a path exist
 */
export async function ensureAllFolders(app: App, filePath: string): Promise<boolean> {
    // Split the path to ensure all folders exist
    const pathParts = filePath.split('/');
    const fileNameIndex = pathParts.length - 1;
    
    // Ensure all folders in the path exist
    let currentFolder = '';
    for (let i = 0; i < fileNameIndex; i++) {
        if (currentFolder) {
            currentFolder += '/';
        }
        currentFolder += pathParts[i];
        
        // Skip empty parts
        if (!currentFolder) continue;
        
        // Create folder if it doesn't exist
        if (!(await ensureFolder(app, currentFolder))) {
            return false;
        }
    }
    
    return true;
}

/**
 * Creates or gets a journal file for the specified date
 */
export async function getOrCreateJournalFile(
    app: App, 
    journalFolder: string, 
    filename: string,
    folderFormat: string = '',
    initialContent: string = ''
): Promise<TFile | null> {
    // Generate the file path using the new function
    const filePath = getJournalFilePath(journalFolder, filename, folderFormat);
    
    // Ensure all necessary folders exist
    if (!(await ensureAllFolders(app, filePath))) {
        return null;
    }
    
    // Check if the file already exists
    let file = app.vault.getAbstractFileByPath(filePath);
    
    if (file instanceof TFile) {
        return file;
    }
    
    // Create the file if it doesn't exist
    try {
        file = await app.vault.create(filePath, initialContent);
        new Notice(`Created journal entry: ${filename}`);
        if (file instanceof TFile) {
            return file;
        } else {
            console.error('Created file is not a TFile instance');
            return null;
        }
    } catch (error) {
        new Notice(`Failed to create journal entry: ${error}`);
        console.error('Failed to create journal entry:', error);
        return null;
    }
}

/**
 * Checks if a file is a journal file based on its name pattern and location
 */
export function isJournalFile(file: TFile, journalFolder?: string, folderFormat?: string): boolean {
    // Check if basename matches any supported date pattern
    const isDateBasename = isAnyDateFormat(file.basename);
    
    if (!isDateBasename) {
        return false;
    }
    
    // If no folder is specified, just check the basename
    if (!journalFolder) {
        return true;
    }
    
    // With folder format, we need a more sophisticated check
    if (folderFormat) {
        // Generate the expected base path
        const dateStr = file.basename.split('.')[0];
        
        // Convert to ISO format if needed
        let isoDate: string;
        if (isDateFormat(dateStr)) {
            isoDate = dateStr;
        } else {
            isoDate = humanDateToISO(dateStr);
        }
        
        const [year, month, day] = isoDate.split('-');
        
        let expectedPath = folderFormat;
        expectedPath = expectedPath.replace('YYYY', year);
        expectedPath = expectedPath.replace('MM', month);
        expectedPath = expectedPath.replace('DD', day);
        
        const expectedFullPath = `${journalFolder}/${expectedPath}`;
        
        // Check if the file's path contains the expected path
        return file.path.startsWith(expectedFullPath);
    }
    
    // Without folder format, just check if it's in the journal folder
    return file.path.startsWith(journalFolder + '/');
}

/**
 * Gets all journal files in the vault
 */
export function getJournalFiles(app: App, journalFolder?: string, folderFormat?: string): TFile[] {
    // Get all markdown files in the vault
    const files = app.vault.getMarkdownFiles();

    // Filter files that follow a daily note pattern and are in the correct folder structure
    return files.filter((file) => isJournalFile(file, journalFolder, folderFormat));
}

/**
 * Sorts journal files by date
 */
export function sortJournalFiles(files: TFile[], sortDirection: 'newest-first' | 'oldest-first'): TFile[] {
    return files.sort((a, b) => {
        // Convert both basenames to ISO format for proper sorting
        const getISODate = (basename: string): string => {
            if (isDateFormat(basename)) {
                return basename;
            } else {
                return humanDateToISO(basename);
            }
        };
        
        const dateA = getISODate(a.basename);
        const dateB = getISODate(b.basename);
        
        if (sortDirection === 'newest-first') {
            return dateB.localeCompare(dateA);
        } else {
            return dateA.localeCompare(dateB);
        }
    });
}