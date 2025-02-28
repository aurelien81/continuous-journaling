import { App, PluginSettingTab, Setting } from 'obsidian';
import JournalingPlugin from './main';

export interface JournalingSettings {
    journalFolder: string;
    dateFormat: string;
    sortDirection: 'newest-first' | 'oldest-first';
    defaultExpandEntries: boolean;
}

export const DEFAULT_SETTINGS: JournalingSettings = {
    journalFolder: 'journals',
    dateFormat: 'YYYY-MM-DD',
    sortDirection: 'newest-first',
    defaultExpandEntries: true,
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
    }
}