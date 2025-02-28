import { Plugin, Notice } from 'obsidian';
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
    
    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}