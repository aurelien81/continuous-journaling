import { Plugin, Notice } from 'obsidian';
import { DEFAULT_SETTINGS, JournalingSettings, JournalingSettingTab } from './settings';
import { JournalView } from './view/journal-view';
import { getTodayDate } from './utils/date-utils';
import { getOrCreateJournalFile } from './utils/file-utils';

export default class JournalingPlugin extends Plugin {
    settings: JournalingSettings;
    journalView: JournalView | null = null;

    async onload() {
        console.log('Loading Continuous Journaling plugin v0.3.0');
        
        // Load settings
        await this.loadSettings();
        
        // Add ribbon icon
        const ribbonIconEl = this.addRibbonIcon(
            'notebook-text', 
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
        
        // Add command specifically for creating today's journal
        this.addCommand({
            id: 'create-todays-journal',
            name: 'Create/Open Today\'s Journal',
            callback: () => {
                this.createTodaysJournal(true);
            },
        });
        
        // Register settings tab
        this.addSettingTab(new JournalingSettingTab(this.app, this));
    }

    onunload() {
        console.log('Unloading Continuous Journaling plugin');
        
        // Clean up resources
        if (this.journalView) {
            this.journalView.destroy();
            this.journalView = null;
        }
    }

    /**
     * Opens the continuous journal view
     */
    async openJournalView(): Promise<void> {
        // First, ensure today's journal exists
        await this.createTodaysJournal(false);
        
        // Initialize journal view if needed
        if (!this.journalView) {
            this.journalView = new JournalView(this);
        }
        
        // Open the continuous view
        await this.journalView.open();
    }
    
    /**
     * Creates or opens today's journal entry
     * @param openInNewLeaf Whether to open the file in a new leaf
     */
    async createTodaysJournal(openInNewLeaf: boolean = false): Promise<void> {
        const date = getTodayDate(this.settings.dateFormat);
        const fileName = `${date}.md`;
        
        // Get or create the journal file
        const file = await getOrCreateJournalFile(
            this.app, 
            this.settings.journalFolder, 
            fileName,
            this.settings.defaultTemplate
        );
        
        if (!file) {
            new Notice('Failed to create or open today\'s journal');
            return;
        }
        
        // Optionally open the file directly
        if (openInNewLeaf) {
            const leaf = this.app.workspace.getLeaf(true);
            await leaf.openFile(file);
        }
    }
    
    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}