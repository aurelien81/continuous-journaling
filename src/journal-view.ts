import { MarkdownRenderer, Notice, TFile, WorkspaceLeaf } from 'obsidian';
import JournalingPlugin from './main';
import { formatDateForDisplay } from './utils/date-utils';
import { getJournalFiles, sortJournalFiles } from './utils/file-utils';

export class JournalView {
    plugin: JournalingPlugin;
    
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
        
        // Create the main container
        const contentEl = leaf.view.containerEl;
        contentEl.empty();
        
        // Create a scrollable panel for journal entries
        const panel = contentEl.createDiv({ cls: 'custom-journal-panel' });
        
        // Get all journal files
        const journalFiles = getJournalFiles(this.plugin.app, this.plugin.settings.journalFolder);
        
        if (journalFiles.length === 0) {
            new Notice('No journal entries found.');
            panel.createEl('div', { 
                cls: 'journal-empty-state',
                text: 'No journal entries found. Create one by clicking the journals icon in the ribbon.' 
            });
            return;
        }
        
        // Sort the files according to user preference
        const sortedFiles = sortJournalFiles(journalFiles, this.plugin.settings.sortDirection);
        
        // Add each file to the panel
        for (const file of sortedFiles) {
            try {
                const fileContent = await this.plugin.app.vault.read(file);
                this.addJournalEntry(panel, file, fileContent);
            } catch (error) {
                console.error(`Error reading file ${file.path}:`, error);
                this.addErrorMessage(panel, file.basename, error);
            }
        }
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
    private addJournalEntry(panel: HTMLElement, file: TFile, content: string): void {
        const journalDate = file.basename;
        
        // Create the main container for this entry
        const journalEntry = panel.createDiv({ cls: 'journal-entry' });
        
        // Create the header section
        const header = journalEntry.createDiv({ cls: 'journal-entry-header' });
        
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
        const contentArea = journalEntry.createDiv({ 
            cls: 'collapsible-content' + (this.plugin.settings.defaultExpandEntries ? ' content-expanded' : '')
        });
        
        // Keep track of the current content value
        let currentContent = content;
        
        // Create the rendered view (markdown)
        const renderedContent = contentArea.createDiv({ 
            cls: 'rendered-content active-view' 
        });
        
        // Create the editable view (textarea)
        const editableContent = contentArea.createEl('textarea', { 
            cls: 'editable-content',
            value: currentContent
        });
        
        // Adjust textarea height to content
        window.requestAnimationFrame(() => {
            editableContent.style.height = editableContent.scrollHeight + 'px';
        });
        
        // Render the markdown content
        const renderContent = () => {
            renderedContent.empty();
            MarkdownRenderer.render(this.plugin.app, currentContent, renderedContent, file.path, this.plugin);
        };
        
        // Initial render
        renderContent();
        
        // Function to enter edit mode
        const enterEditMode = () => {
            // Make sure the textarea has the current content before showing it
            editableContent.value = currentContent;
            
            renderedContent.classList.toggle('active-view');
            editableContent.classList.toggle('active-view');
            editableContent.style.height = 'auto';
            editableContent.style.height = editableContent.scrollHeight + 'px';
            editableContent.focus();
        };
        
        // Click on rendered content to edit
        renderedContent.addEventListener('click', (event) => {
            const target = event.target as HTMLElement;
            
            // Don't enter edit mode if clicking on links or hashtags
            if (target.tagName === 'A' || target.closest('a') || 
                target.classList.contains('cm-hashtag') || target.closest('.cm-hashtag')) {
                return;
            }
            
            // Otherwise, trigger editing mode
            enterEditMode();
        });
        
        // Save changes and exit edit mode on blur
        editableContent.addEventListener('blur', async () => {
            currentContent = editableContent.value;
            await this.saveContentToFile(file, currentContent);
            renderContent();
            renderedContent.classList.toggle('active-view');
            editableContent.classList.toggle('active-view');
        });
        
        // Auto-adjust textarea height while typing
        editableContent.addEventListener('input', () => {
            editableContent.style.height = 'auto';
            editableContent.style.height = editableContent.scrollHeight + 'px';
            
            // Update current content while typing
            currentContent = editableContent.value;
        });
        
        // Save content periodically while typing
        let saveTimeout: NodeJS.Timeout | null = null;
        editableContent.addEventListener('input', () => {
            // Clear previous timeout
            if (saveTimeout) {
                clearTimeout(saveTimeout);
            }
            
            // Set a new timeout to save after 500ms of inactivity
            saveTimeout = setTimeout(() => {
                this.saveContentToFile(file, currentContent);
            }, 500);
        });
        
        // Toggle expand/collapse on button click
        toggleButton.addEventListener('click', () => {
            toggleButton.classList.toggle('toggle-expanded');
            contentArea.classList.toggle('content-expanded');
        });
    }
    
    /**
     * Saves the content to the file
     */
    private async saveContentToFile(file: TFile, content: string): Promise<void> {
        try {
            await this.plugin.app.vault.modify(file, content);
        } catch (error) {
            new Notice(`Failed to save changes: ${error}`);
            console.error('Failed to save changes:', error);
        }
    }
}