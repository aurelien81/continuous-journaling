import { App, Notice, TFile, TFolder } from 'obsidian';
import { isDateFormat } from './date-utils';

/**
 * Ensures that the specified folder exists, creating it if necessary
 * Returns true if the folder exists or was created, false otherwise
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
        new Notice(`Cannot create journal folder: "${folderPath}" exists but is not a folder`);
        return false;
    }
    
    // Create folder if it doesn't exist
    if (!folderExists) {
        try {
            await app.vault.createFolder(folderPath);
            new Notice(`Created journal folder: ${folderPath}`);
            return true;
        } catch (error) {
            new Notice(`Failed to create journal folder: ${error}`);
            console.error('Failed to create journal folder:', error);
            return false;
        }
    }
    
    return true;
}

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
 * Checks if a file is a journal file based on its name pattern and location
 */
export function isJournalFile(file: TFile, journalFolder?: string): boolean {
    // Check if basename matches YYYY-MM-DD pattern
    const isDateBasename = isDateFormat(file.basename);
    
    // If folder is specified, also check if the file is in that folder
    if (journalFolder) {
        return isDateBasename && file.path.startsWith(journalFolder + '/');
    }
    
    // If no folder is specified, just check the basename
    return isDateBasename;
}

/**
 * Gets all journal files in the vault
 */
export function getJournalFiles(app: App, journalFolder?: string): TFile[] {
    // Get all markdown files in the vault
    const files = app.vault.getMarkdownFiles();

    // Filter files that follow a daily note pattern and are in the correct folder
    return files.filter((file) => isJournalFile(file, journalFolder));
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

/**
 * Creates or gets a journal file for the specified date
 */
export async function getOrCreateJournalFile(
    app: App, 
    journalFolder: string, 
    filename: string,
    initialContent: string = ''
): Promise<TFile | null> {
    await ensureFolder(app, journalFolder);
    
    const filePath = getFilePath(journalFolder, filename);
    
    // Check if the file already exists
    let file = app.vault.getAbstractFileByPath(filePath);
    
    if (file instanceof TFile) {
        return file;
    }
    
    // Create the file if it doesn't exist
    try {
        file = await app.vault.create(filePath, initialContent);
        new Notice(`Created journal entry: ${filename}`);
        return file as TFile;
    } catch (error) {
        new Notice(`Failed to create journal entry: ${error}`);
        console.error('Failed to create journal entry:', error);
        return null;
    }
}