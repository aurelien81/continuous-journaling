import { App, PluginSettingTab, Setting, Modal } from 'obsidian';
import JournalingPlugin from './main';

export interface JournalingSettings {
    journalFolder: string;
    dateFormat: string;
    sortDirection: 'newest-first' | 'oldest-first';
    defaultExpandEntries: boolean;
    folderFormat: string;
}

export const DEFAULT_SETTINGS: JournalingSettings = {
    journalFolder: 'journals',
    dateFormat: 'YYYY-MM-DD',
    sortDirection: 'newest-first',
    defaultExpandEntries: true,
    folderFormat: '',
};

export class JournalingSettingTab extends PluginSettingTab {
    plugin: JournalingPlugin;

    constructor(app: App, plugin: JournalingPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'Continuous Journaling Settings' });

        new Setting(containerEl)
            .setName('Journal Folder')
            .setDesc('Specify the folder where journal entries will be stored')
            .addText(text => text
                .setPlaceholder('journals')
                .setValue(this.plugin.settings.journalFolder)
                .onChange(async (value) => {
                    // Remove leading and trailing slashes for consistency
                    this.plugin.settings.journalFolder = value.replace(/^\/+|\/+$/g, '');
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Date Format')
            .setDesc('Format for journal filenames (YYYY-MM-DD recommended)')
            .addText(text => text
                .setPlaceholder('YYYY-MM-DD')
                .setValue(this.plugin.settings.dateFormat)
                .onChange(async (value) => {
                    this.plugin.settings.dateFormat = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Sort Direction')
            .setDesc('How to sort journal entries in the continuous view')
            .addDropdown(dropdown => dropdown
                .addOption('newest-first', 'Newest entries first')
                .addOption('oldest-first', 'Oldest entries first')
                .setValue(this.plugin.settings.sortDirection)
                .onChange(async (value: 'newest-first' | 'oldest-first') => {
                    this.plugin.settings.sortDirection = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Default Expand Entries')
            .setDesc('Automatically expand entries when opening the journals view')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.defaultExpandEntries)
                .onChange(async (value) => {
                    this.plugin.settings.defaultExpandEntries = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Folder Structure Format')
            .setDesc('Format pattern for organizing journal entries in subfolders. Examples: empty for flat structure, "YYYY" for yearly folders, "YYYY/MM" for monthly folders.')
            .addText(text => text
                .setPlaceholder('YYYY/MM')
                .setValue(this.plugin.settings.folderFormat)
                .onChange(async (value) => {
                    this.plugin.settings.folderFormat = value;
                    await this.plugin.saveSettings();
        }));

        new Setting(containerEl)
            .setName('Migrate Journal Entries')
            .setDesc('Move existing journal entries to the folder structure defined by the folder format pattern.')
            .addButton(button => button
                .setButtonText('Migrate Entries')
                .setCta() // Make it a call-to-action button
                .onClick(async () => {
                    await this.plugin.migrateJournalEntries();
        }));


        new Setting(containerEl)
        .setName('Delete Empty Journal Entries')
        .setDesc('Delete all EMPTY journal entries. This action cannot be undone.')
        .addButton(button => button
            .setButtonText('Delete Empty Entries')
            .setCta() // Make it a call-to-action button
            .setClass('journal-delete-button')
            .onClick(async () => {
                await this.plugin.deleteEmptyJournalEntries();
            }));
    }
}