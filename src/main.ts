import { App, Plugin, Notice, TFile } from 'obsidian';
import { DEFAULT_SETTINGS, JournalingSettings, JournalingSettingTab } from './settings';
import { JournalView } from './journal-view';
import { getTodayDate } from './utils/date-utils';
import { getOrCreateJournalFile } from './utils/file-utils';

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
            'notebook-text', 
            'Open Journals', 
            async (evt: MouseEvent) => {
                await this.openJournalView();
            }
        );
        ribbonIconEl.addClass('journaling-ribbon-icon');
        
        // Add command
        this.addCommand({
            id: 'open-journal-view',
            name: 'Open Journal View',
            callback: () => {
                this.openJournalView();
            },
        });
        
        // Add another command specifically for creating today's journal
        this.addCommand({
            id: 'create-todays-journal',
            name: 'Create/Open Today\'s Journal',
            callback: () => {
                this.createTodaysJournal();
            },
        });
        
        // Register settings tab
        this.addSettingTab(new JournalingSettingTab(this.app, this));

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

    /**
     * Opens the continuous journal view
     */
    async openJournalView(): Promise<void> {
        // First, ensure today's journal exists
        await this.createTodaysJournal();
        
        // Then open the continuous view
        await this.journalView.open();
    }
    
    /**
     * Creates or opens today's journal entry
     */
    async createTodaysJournal(): Promise<void> {
        const date = getTodayDate();
        const fileName = `${date}.md`;
        
        const file = await getOrCreateJournalFile(
            this.app, 
            this.settings.journalFolder, 
            fileName
        );
        
        if (!file) {
            new Notice('Failed to create or open today\'s journal');
            return;
        }
    }

    getActiveEditor(): HTMLTextAreaElement | null {
        // Look for textareas with the active-view class within the journal view
        const activeEditors = document.querySelectorAll('.journal-entry textarea.editable-content.active-view');
        if (activeEditors.length > 0) {
            return activeEditors[0] as HTMLTextAreaElement;
        }
        return null;
    }
    
    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}