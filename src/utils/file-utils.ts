import { App, Notice, TFile, TFolder } from 'obsidian';
import { isDateFormat } from './date-utils';

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
    
    // Extract the date from the filename (assuming YYYY-MM-DD.md format)
    const datePart = filename.split('.')[0]; // Remove file extension
    if (!isDateFormat(datePart)) {
        // If filename doesn't match date pattern, fall back to flat structure
        return getFilePath(journalFolder, filename);
    }
    
    // Parse the date
    const [year, month, day] = datePart.split('-').map(part => parseInt(part));
    
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
    // Check if basename matches YYYY-MM-DD pattern
    const isDateBasename = isDateFormat(file.basename);
    
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
        const [year, month, day] = dateStr.split('-');
        
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
        if (sortDirection === 'newest-first') {
            return b.basename.localeCompare(a.basename);
        } else {
            return a.basename.localeCompare(b.basename);
        }
    });
}