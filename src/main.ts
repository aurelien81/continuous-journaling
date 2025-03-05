import { App, Plugin, Notice, TFile, Modal } from 'obsidian';
import { DEFAULT_SETTINGS, JournalingSettings, JournalingSettingTab } from './settings';
import { JournalView } from './journal-view';
import { getTodayDate } from './utils/date-utils';
import { getOrCreateJournalFile, getJournalFiles, getJournalFilePath, ensureAllFolders } from './utils/file-utils';

export default class JournalingPlugin extends Plugin {
    settings: JournalingSettings;
    journalView: JournalView;

    async onload() {
        // Load settings
        await this.loadSettings();
        
        // Initialize journal view
        this.journalView = new JournalView(this);
        
        // Add ribbon icon
        const ribbonIconEl = this.addRibbonIcon(
            'notepad-text', 
            'Open Journals', 
            async (evt: MouseEvent) => {
                await this.openJournalView();
            }
        );
        ribbonIconEl.addClass('journaling-ribbon-icon');
        
        // Add command to open journal view
        this.addCommand({
            id: 'open-journal-view',
            name: 'Open Journal View',
            callback: () => {
                this.openJournalView();
            },
        });
        
        // Add command for creating today's journal
        this.addCommand({
            id: 'create-todays-journal',
            name: 'Create/Open Today\'s Journal',
            callback: () => {
                this.createTodaysJournal();
            },
        });
        
        // Register settings tab
        this.addSettingTab(new JournalingSettingTab(this.app, this));

        // Add context menu option for files to insert into journals
        this.registerEvent(
            this.app.workspace.on('file-menu', (menu, file) => {
                // Check if the file is a TFile (actual file)
                if (file instanceof TFile) {
                    menu.addItem((item) => {
                        item
                            .setTitle('Insert into Journal')
                            .setIcon('text-cursor-input')
                            .onClick(() => {
                                // Find the active journal view if it exists
                                const journalView = this.journalView;
                                if (journalView) {
                                    // Insert the file reference into the active editor
                                    journalView.insertFileReference(file.path);
                                } else {
                                    new Notice('Open the journal view first to insert file reference');
                                }
                            });
                    });
                }
            })
        );
    }

    // Opens the continuous journal view
    async openJournalView(): Promise<void> {
        // First, ensure today's journal exists
        await this.createTodaysJournal();
        
        // Then open the continuous view
        await this.journalView.open();
    }
    
    // Creates or opens today's journal entry
    async createTodaysJournal(): Promise<void> {
        const date = getTodayDate();
        const fileName = `${date}.md`;
        
        const file = await getOrCreateJournalFile(
            this.app, 
            this.settings.journalFolder, 
            fileName,
            this.settings.folderFormat // Pass the folder format setting
        );
        
        if (!file) {
            new Notice('Failed to create or open today\'s journal');
            return;
        }
    }
    
    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    /**
     * Migrates existing journal entries to the new folder structure
     */
    async migrateJournalEntries(): Promise<void> {
        const journalFiles = getJournalFiles(
            this.app, 
            this.settings.journalFolder,
            '' // Use empty folder format to get all files regardless of structure
        );
        
        if (journalFiles.length === 0) {
            new Notice('No journal entries found to migrate.');
            return;
        }
        
        // If no folder format is set, nothing to migrate
        if (!this.settings.folderFormat) {
            new Notice('Please set a folder format in settings before migrating.');
            return;
        }
        
        // Confirmation dialog
        const confirmMessage = `Migrate ${journalFiles.length} journal entries to new folder structure? This will:
    1. Move files to folders based on the pattern: ${this.settings.folderFormat}
    2. Create any necessary folders
    3. Keep the original filename
    
    This operation cannot be undone automatically.`;
        
        if (!confirm(confirmMessage)) {
            return;
        }
        
        // Create and open modal
        const modal = new MigrationModal(this.app, journalFiles.length);
        modal.open();
        
        // Track progress
        let migratedCount = 0;
        let errorCount = 0;
        
        for (const file of journalFiles) {
            try {
                // Update status
                modal.updateStatus(`Migrating ${file.name}...`);
                
                // Generate the new path based on the current folder format
                const newPath = getJournalFilePath(
                    this.settings.journalFolder,
                    file.name,
                    this.settings.folderFormat
                );
                
                // Skip if file is already in the correct location
                if (file.path === newPath) {
                    migratedCount++;
                    modal.updateProgress(migratedCount);
                    continue;
                }
                
                // Read file content
                const content = await this.app.vault.read(file);
                
                // Ensure all folders in the path exist
                await ensureAllFolders(this.app, newPath);
                
                // Create the file at the new location
                await this.app.vault.create(newPath, content);
                
                // Delete the original file
                await this.app.fileManager.trashFile(file);
                
                migratedCount++;
                modal.updateProgress(migratedCount);
            } catch (error) {
                console.error(`Error migrating file ${file.path}:`, error);
                modal.updateStatus(`Error migrating ${file.name}: ${error}`);
                errorCount++;
            }
        }
        
        // Update final status
        modal.updateStatus(`Migration complete! Migrated ${migratedCount} files with ${errorCount} errors.`);
        
        // Close modal after a delay
        setTimeout(() => {
            modal.close();
            new Notice(`Migration complete! Migrated ${migratedCount} files with ${errorCount} errors.`);
        }, 3000);
    }

    async deleteEmptyJournalEntries(): Promise<void> {
        // Get all journal files
        const journalFiles = getJournalFiles(
            this.app, 
            this.settings.journalFolder,
            this.settings.folderFormat
        );
        
        if (journalFiles.length === 0) {
            new Notice('No journal entries found to check.');
            return;
        }
        
        // First confirmation dialog
        const confirmMessage = `Do you want to proceed with scanning ${journalFiles.length} journal entries?`;
        
        if (!confirm(confirmMessage)) {
            return;
        }
        
        // Show a scanning notification
        new Notice('Scanning for empty journal entries...');
        
        // Track progress
        let emptyFiles: TFile[] = [];
        let errorCount = 0;
        
        // Define what "empty" means
        const isFileEmpty = (content: string): boolean => {
            return content.trim().length === 0;
        };
        
        // Scan each file
        for (const file of journalFiles) {
            try {
                // Read file content
                const content = await this.app.vault.read(file);
                
                // Check if file is empty
                if (isFileEmpty(content)) {
                    emptyFiles.push(file);
                }
            } catch (error) {
                console.error(`Error scanning file ${file.path}:`, error);
                errorCount++;
            }
        }
        
        // If no empty files were found
        if (emptyFiles.length === 0) {
            new Notice('No empty journal entries found.');
            return;
        }
        
        // Second confirmation dialog with actual count
        const deleteConfirmMessage = `${emptyFiles.length} empty journal ${emptyFiles.length === 1 ? 'entry was' : 'entries were'} found.
        
        Do you want to proceed with the deletion? This operation cannot be undone.`;
        
        if (!confirm(deleteConfirmMessage)) {
            return;
        }
        
        // Show a deleting notification
        new Notice(`Deleting ${emptyFiles.length} empty journal entries...`);
        
        // Delete the empty files
        let deletedCount = 0;
        errorCount = 0; // Reset error count for deletion phase
        
        for (const file of emptyFiles) {
            try {
                // Delete the file
                await this.app.fileManager.trashFile(file);
                deletedCount++;
            } catch (error) {
                console.error(`Error deleting file ${file.path}:`, error);
                errorCount++;
            }
        }
        
        // Show completion notification
        if (errorCount > 0) {
            new Notice(`Deleted ${deletedCount} out of ${emptyFiles.length} empty journal entries. ${errorCount} errors occurred.`, 5000);
        } else {
            new Notice(`Successfully deleted ${deletedCount} empty journal entries.`, 5000);
        }
        
        // Refresh journal view if it's open
        if (deletedCount > 0 && this.journalView) {
            this.journalView.open();
        }
    }
}

class MigrationModal extends Modal {
    totalFiles: number;
    progressEl: HTMLElement;
    statusEl: HTMLElement;
    
    constructor(app: App, totalFiles: number) {
        super(app);
        this.totalFiles = totalFiles;
    }
    
    onOpen() {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: 'Migrating Journal Entries' });
        
        // Create progress display
        this.progressEl = contentEl.createEl('div', { 
            cls: 'migration-progress',
            text: '0/' + this.totalFiles
        });
        
        // Create status message
        this.statusEl = contentEl.createEl('div', {
            cls: 'migration-status',
            text: 'Starting migration...'
        });
    }
    
    updateProgress(completed: number) {
        this.progressEl.textContent = `${completed}/${this.totalFiles}`;
    }
    
    updateStatus(message: string) {
        this.statusEl.textContent = message;
    }
    
    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

class DeletionModal extends Modal {
    totalFiles: number;
    progressEl: HTMLElement;
    statusEl: HTMLElement;
    deletedCountEl: HTMLElement;
    
    constructor(app: App, totalFiles: number) {
        super(app);
        this.totalFiles = totalFiles;
    }
    
    onOpen() {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: 'Deleting Empty Journal Entries' });
        
        // Create progress display
        this.progressEl = contentEl.createEl('div', { 
            cls: 'migration-progress', // Reusing the same CSS class
            text: '0/' + this.totalFiles + ' scanned'
        });
        
        // Create deleted count display
        this.deletedCountEl = contentEl.createEl('div', {
            cls: 'migration-progress',
            text: '0 entries deleted'
        });
        
        // Create status message
        this.statusEl = contentEl.createEl('div', {
            cls: 'migration-status',
            text: 'Starting scan...'
        });
    }
    
    updateProgress(completed: number) {
        this.progressEl.textContent = `${completed}/${this.totalFiles} scanned`;
    }
    
    updateDeletedCount(count: number) {
        this.deletedCountEl.textContent = `${count} entries deleted`;
    }
    
    updateStatus(message: string) {
        this.statusEl.textContent = message;
    }
    
    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}