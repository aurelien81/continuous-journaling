import { App, PluginSettingTab, Setting, Modal } from 'obsidian';
import JournalingPlugin from './main';

export interface JournalingSettings {
    journalFolder: string;
    dateFormat: string;
    sortDirection: 'newest-first' | 'oldest-first';
    defaultExpandEntries: boolean;
    folderFormat: string;
    entriesPerBatch: number;
}

export const DEFAULT_SETTINGS: JournalingSettings = {
    journalFolder: 'journals',
    dateFormat: 'YYYY-MM-DD',
    sortDirection: 'newest-first',
    defaultExpandEntries: true,
    folderFormat: '',
    entriesPerBatch: 10,
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

        // Function to generate preview text
        const generatePreviewText = (format: string): string => {
            const today = new Date();
            
            try {
                if (format === 'MMM Do, YYYY') {
                    // Generate human-readable format
                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    const month = monthNames[today.getMonth()];
                    const day = today.getDate();
                    const year = today.getFullYear();
                    
                    // Add ordinal suffix
                    const getDaySuffix = (day: number): string => {
                        if (day > 3 && day < 21) return 'th';
                        switch (day % 10) {
                            case 1: return 'st';
                            case 2: return 'nd';
                            case 3: return 'rd';
                            default: return 'th';
                        }
                    };
                    
                    return `${month} ${day}${getDaySuffix(day)}, ${year}`;
                } else {
                    // For other formats, follow Moment.js format standards
                    const year = today.getFullYear();
                    const month = today.getMonth() + 1;
                    const day = today.getDate();
                    const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                                            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    const monthNamesFull = ['January', 'February', 'March', 'April', 'May', 'June',
                                          'July', 'August', 'September', 'October', 'November', 'December'];
                    const monthNameShort = monthNamesShort[today.getMonth()];
                    const monthNameFull = monthNamesFull[today.getMonth()];
                    
                    // Add ordinal suffix for days
                    const getDaySuffix = (day: number): string => {
                        if (day > 3 && day < 21) return 'th';
                        switch (day % 10) {
                            case 1: return 'st';
                            case 2: return 'nd';
                            case 3: return 'rd';
                            default: return 'th';
                        }
                    };
                    
                    return format
                        .replace(/YYYY/g, year.toString())
                        .replace(/YY/g, year.toString().slice(-2))
                        .replace(/MMMM/g, monthNameFull) // Full month name
                        .replace(/MMM/g, monthNameShort) // Abbreviated month name
                        .replace(/MM/g, String(month).padStart(2, '0'))
                        .replace(/M/g, month.toString())
                        .replace(/Do/g, day.toString() + getDaySuffix(day)) // Day with ordinal (1st, 2nd, 3rd, etc.)
                        .replace(/DD/g, String(day).padStart(2, '0'))
                        .replace(/D/g, day.toString());
                }
            } catch (error) {
                return '[Invalid format]';
            }
        };

        const dateFormatSetting = new Setting(containerEl)
            .setName('Date Format')
            .setDesc(`Format for journal filenames (YYYY-MM-DD recommended). Your journal filename will look like this: ${generatePreviewText(this.plugin.settings.dateFormat)}.md`)
            .addText(text => text
                .setPlaceholder('YYYY-MM-DD')
                .setValue(this.plugin.settings.dateFormat)
                .onChange(async (value) => {
                    this.plugin.settings.dateFormat = value;
                    await this.plugin.saveSettings();
                    // Update the description with new preview
                    dateFormatSetting.setDesc(`Format for journal filenames (YYYY-MM-DD recommended). Your journal filename will look like this: ${generatePreviewText(value)}.md`);
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
            .setName('Folder Structure Format (Optional)')
            .setDesc('Format pattern for organizing journal entries in subfolders.\nExamples: empty for flat structure, "YYYY" for yearly folders, "YYYY/MM" for monthly folders.')
            .addText(text => text
                .setPlaceholder('YYYY/MM')
                .setValue(this.plugin.settings.folderFormat)
                .onChange(async (value) => {
                    this.plugin.settings.folderFormat = value;
                    await this.plugin.saveSettings();
        }));

        new Setting(containerEl)
            .setName('Entries Per Page')
            .setDesc('Number of journal entries to load at once')
            .addDropdown(dropdown => dropdown
                .addOption('10', '10 entries')
                .addOption('25', '25 entries')
                .addOption('50', '50 entries')
                .setValue(this.plugin.settings.entriesPerBatch.toString())
                .onChange(async (value) => {
                    this.plugin.settings.entriesPerBatch = parseInt(value);
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