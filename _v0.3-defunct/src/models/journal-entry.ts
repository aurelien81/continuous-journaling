import { TFile } from 'obsidian';

/**
 * Model class representing a journal entry
 */
export class JournalEntry {
    file: TFile;
    content: string;
    
    constructor(file: TFile, content: string) {
        this.file = file;
        this.content = content;
    }
    
    /**
     * Gets the date from the file basename
     */
    get date(): string {
        return this.file.basename;
    }
    
    /**
     * Gets the path of the file
     */
    get path(): string {
        return this.file.path;
    }
    
    /**
     * Updates the content of the entry
     */
    updateContent(newContent: string): void {
        this.content = newContent;
    }
}