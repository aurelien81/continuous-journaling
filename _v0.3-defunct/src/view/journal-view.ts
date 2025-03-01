import { Notice, TFile, WorkspaceLeaf } from 'obsidian';
import JournalingPlugin from '../main';
import { formatDateForDisplay } from '../utils/date-utils';
import { getJournalFiles, sortJournalFiles } from '../utils/file-utils';
import { EntryRenderer } from './entry-renderer';

export class JournalView {
    plugin: JournalingPlugin;
    entryRenderers: Map<string, EntryRenderer> = new Map();
    
    constructor(plugin: JournalingPlugin) {
        this.plugin = plugin;
    }
    
    /**
     * Opens the continuous journal view in a new leaf
     */
    async open(): Promise<void> {
        // Create a new leaf (opens a new tab)
        const leaf = this.plugin.app.workspace.getLeaf(true);
        
        // Set the view state to Markdown to access containerEl
        await leaf.setViewState({
            type: "markdown",
            active: true,
        });
        
        // Get the container element
        const contentEl = leaf.view.containerEl;
        contentEl.empty();
        
        // Add class to container for styling
        contentEl.addClass('journaling-container');
        
        // Create a scrollable panel for journal entries
        const panel = contentEl.createDiv({ cls: 'custom-journal-panel' });
        
        // Add loading indicator
        const loadingEl = panel.createDiv({ cls: 'journal-loading' });
        loadingEl.setText('Loading journals...');
        
        try {
            // Get all journal files
            const journalFiles = getJournalFiles(this.plugin.app, this.plugin.settings.journalFolder);
            
            // Remove loading indicator
            loadingEl.remove();
            
            if (journalFiles.length === 0) {
                new Notice('No journal entries found.');
                this.renderEmptyState(panel);
                return;
            }
            
            // Sort the files according to user preference
            const sortedFiles = sortJournalFiles(journalFiles, this.plugin.settings.sortDirection);
            
            // Add each file to the panel
            for (const file of sortedFiles) {
                try {
                    const fileContent = await this.plugin.app.vault.read(file);
                    await this.addJournalEntry(panel, file, fileContent);
                } catch (error) {
                    console.error(`Error reading file ${file.path}:`, error);
                    this.addErrorMessage(panel, file.basename, error);
                }
            }
        } catch (error) {
            // Remove loading indicator
            loadingEl.remove();
            
            console.error("Error loading journal view:", error);
            new Notice("Error loading journals. Please try again.");
        }
    }
    
    /**
     * Renders an empty state message when no journal entries are found
     */
    private renderEmptyState(panel: HTMLElement): void {
        panel.createEl('div', { 
            cls: 'journal-empty-state',
            text: 'No journal entries found. Create one by clicking the journals icon in the ribbon.' 
        });
    }
    
    /**
     * Adds an error message to the panel when file reading fails
     */
    private addErrorMessage(panel: HTMLElement, filename: string, error: any): void {
        const errorDiv = panel.createDiv({ cls: 'journal-entry journal-error' });
        
        const errorHeader = errorDiv.createDiv({ cls: 'journal-entry-header' });
        errorHeader.createEl('h3', { 
            cls: 'journal-entry-title',
            text: `${filename} - Error` 
        });
        
        const errorContent = errorDiv.createDiv({ cls: 'journal-error-content' });
        errorContent.textContent = `Failed to load journal: ${error.message || error}`;
    }
    
    /**
     * Adds a journal entry to the panel
     */
    private async addJournalEntry(panel: HTMLElement, file: TFile, content: string): Promise<void> {
        const journalDate = file.basename;
        
        // Create the main container for this entry
        const journalEntryEl = panel.createDiv({ cls: 'journal-entry' });
        journalEntryEl.dataset.path = file.path;
        
        // Create the header section
        const header = journalEntryEl.createDiv({ cls: 'journal-entry-header' });
        
        // Add toggle button for collapsing/expanding
        const toggleButton = header.createEl('button', { cls: 'collapsible-toggle' });
        if (this.plugin.settings.defaultExpandEntries) {
            toggleButton.addClass('toggle-expanded');
        }
        
        // Add title with link to the original file
        const title = header.createEl('h3', { cls: 'journal-entry-title' });
        const titleLink = title.createEl('a', { 
            cls: 'journal-entry-link',
            text: formatDateForDisplay(journalDate)
        });
        
        // Handle click on the title to open the file
        titleLink.addEventListener('click', (event) => {
            event.preventDefault();
            this.plugin.app.workspace.openLinkText(file.basename, file.path);
        });
        
        // Create the content area
        const contentArea = journalEntryEl.createDiv({ 
            cls: 'collapsible-content' + (this.plugin.settings.defaultExpandEntries ? ' content-expanded' : '')
        });
        
        // Create the entry renderer
        const renderer = new EntryRenderer(this.plugin, file, contentArea);
        await renderer.render(content);
        
        // Store the renderer
        this.entryRenderers.set(file.path, renderer);
        
        // Toggle expand/collapse on button click
        toggleButton.addEventListener('click', () => {
            toggleButton.classList.toggle('toggle-expanded');
            contentArea.classList.toggle('content-expanded');
        });
    }
    
    /**
     * Cleans up resources when the view is closed
     */
    destroy(): void {
        // Clean up all entry renderers
        this.entryRenderers.forEach(renderer => {
            renderer.destroy();
        });
        this.entryRenderers.clear();
    }
}