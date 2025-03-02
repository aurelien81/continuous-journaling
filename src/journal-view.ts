import { MarkdownRenderer, Notice, TFile, WorkspaceLeaf } from 'obsidian';
import JournalingPlugin from './main';
import { formatDateForDisplay } from './utils/date-utils';
import { getJournalFiles, sortJournalFiles } from './utils/file-utils';

export class JournalView {
    plugin: JournalingPlugin;
    activeEditor: HTMLTextAreaElement | null = null;
    
    constructor(plugin: JournalingPlugin) {
        this.plugin = plugin;
        this.registerCleanup();
    }
    
    // Opens the continuous journal view in a new leaf
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
    
    // Adds an error message to the panel when file reading fails
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
    
    // Adds a journal entry to the panel
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
        
        // Track the current content
        let currentContent = content;
        
        // Flag to track if the entry is in edit mode
        let isEditing = false;
        
        // Create the rendered content view
        const renderedContent = contentArea.createDiv({ 
            cls: 'rendered-content active-view' 
        });
        
        // Create the editable textarea
        const editableContent = contentArea.createEl('textarea', { 
            cls: 'editable-content',
            value: currentContent
        });
        
        // Create close button (new requirement)
        const closeButton = contentArea.createEl('button', {
            cls: 'journal-close-button',
            text: 'Close'
        });
        closeButton.style.display = 'none'; // Hide initially
        
        // Create save indicator
        const saveIndicator = contentArea.createDiv({ 
            cls: 'journal-save-indicator',
            text: 'Saved'
        });
        saveIndicator.style.display = 'none'; // Hide initially
        
        // Adjust textarea height to content
        window.requestAnimationFrame(() => {
            editableContent.style.height = editableContent.scrollHeight + 'px';
        });
        
        // Function to render the markdown content
        const renderContent = () => {
            renderedContent.empty();
            MarkdownRenderer.render(this.plugin.app, currentContent, renderedContent, file.path, this.plugin);
        };
        
        // Initial render
        renderContent();
        
        // Function to enter edit mode
        const enterEditMode = () => {
            // Set editing flag
            isEditing = true;
            this.activeEditor = editableContent;
            
            // Make sure textarea has current content
            editableContent.value = currentContent;
            
            // Hide rendered view, show editable view and close button
            renderedContent.classList.remove('active-view');
            editableContent.classList.add('active-view');
            closeButton.style.display = 'block';
            
            // Adjust textarea height
            editableContent.style.height = 'auto';
            editableContent.style.height = editableContent.scrollHeight + 'px';
            editableContent.focus();
        };
        
        // Function to exit edit mode
        const exitEditMode = async () => {
            // Ensure content is saved before exiting
            if (isEditing) {
                // Get current content from textarea
                currentContent = editableContent.value;
                
                // Save changes
                await this.saveContentToFile(file, currentContent);
                
                // Re-render content
                renderContent();
                
                // Hide editable view and close button, show rendered view
                editableContent.classList.remove('active-view');
                closeButton.style.display = 'none';
                renderedContent.classList.add('active-view');
                
                // Clear editing flag and active editor reference
                isEditing = false;
                if (this.activeEditor === editableContent) {
                    this.activeEditor = null;
                }
            }
        };

        // Click on rendered content to edit
        renderedContent.addEventListener('click', (event) => {
            const target = event.target as HTMLElement;
            
            // Don't enter edit mode if clicking on links or hashtags
            if (target.tagName === 'A' || target.closest('a') || 
                target.classList.contains('cm-hashtag') || target.closest('.cm-hashtag')) {
                return;
            }
            
            enterEditMode();
        });
        
        // Close button to exit edit mode
        closeButton.addEventListener('click', () => {
            exitEditMode();
        });
        
        // Manual save/exit when pressing Escape
        editableContent.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                exitEditMode();
            }
        });
        
        // Auto-adjust textarea height while typing
        editableContent.addEventListener('input', () => {
            editableContent.style.height = 'auto';
            editableContent.style.height = editableContent.scrollHeight + 'px';
            
            // Update current content while typing
            currentContent = editableContent.value;
        });

        // Auto-save content while typing
        let saveTimeout: NodeJS.Timeout | null = null;
        editableContent.addEventListener('input', () => {
            // Show 'Saving...' indicator
            saveIndicator.style.display = 'block';
            saveIndicator.classList.remove('saved');
            saveIndicator.classList.add('saving');
            saveIndicator.textContent = 'Saving...';
            
            // Clear previous timeout
            if (saveTimeout) {
                clearTimeout(saveTimeout);
            }
            
            // Set a new timeout to save after 500ms of inactivity
            saveTimeout = setTimeout(async () => {
                await this.saveContentToFile(file, currentContent);
                
                // Update indicator to 'Saved'
                saveIndicator.classList.remove('saving');
                saveIndicator.classList.add('saved');
                saveIndicator.textContent = 'Saved';
                
                // Hide the indicator after a delay
                setTimeout(() => {
                    if (saveIndicator.classList.contains('saved')) {
                        saveIndicator.style.display = 'none';
                    }
                }, 2000);
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

    /**
     * Inserts a reference to a file into the active journal entry
     */
    insertFileReference(filePath: string): void {
        // Find the active editor
        if (!this.activeEditor) {
            new Notice('No active journal entry to insert file into');
            return;
        }
    
        // Get the file
        const file = this.plugin.app.vault.getAbstractFileByPath(filePath);
        if (!(file instanceof TFile)) {
            new Notice('Invalid file');
            return;
        }
    
        // Create the appropriate file reference
        let fileReference: string;
        
        // Handle different file types
        if (this.isImageFile(file)) {
            fileReference = `![[${file.name}]]`;
        } else if (this.isMarkdownFile(file)) {
            fileReference = `![[${file.name}]]`;
        } else {
            fileReference = `![[${file.name}]]`;
        }
    
        // Focus the active editor
        this.activeEditor.focus();
    
        // Get cursor position
        const cursorPos = this.activeEditor.selectionStart;
        const textBefore = this.activeEditor.value.substring(0, cursorPos);
        const textAfter = this.activeEditor.value.substring(this.activeEditor.selectionEnd);
    
        // Insert text with newlines
        const newText = textBefore + '\n\n' + fileReference + '\n\n' + textAfter;
        this.activeEditor.value = newText;
    
        // Set cursor position after the inserted text
        const newCursorPos = cursorPos + fileReference.length + 4; // +4 for the newlines
        this.activeEditor.setSelectionRange(newCursorPos, newCursorPos);
    
        // Trigger input event to ensure content is saved
        const inputEvent = new Event('input', { bubbles: true, cancelable: true });
        this.activeEditor.dispatchEvent(inputEvent);
    
        new Notice(`Inserted reference to ${file.name}`);
    }
    
    /**
     * Check if a file is an image
     */
    private isImageFile(file: TFile): boolean {
        const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'];
        const ext = file.extension.toLowerCase();
        return imageExtensions.includes(ext);
    }
    
    /**
     * Check if a file is a markdown file
     */
    private isMarkdownFile(file: TFile): boolean {
        const ext = file.extension.toLowerCase();
        return ext === 'md' || ext === 'markdown';
    }

    private registerCleanup(): void {
        // Watch for workspace layout changes (which happen when changing pages/tabs)
        this.plugin.registerEvent(
            this.plugin.app.workspace.on('layout-change', () => {
                // Check if we have an active editor
                if (this.activeEditor) {
                    // Find the journal entry containing this editor
                    const journalEntry = this.activeEditor.closest('.journal-entry');
                    if (journalEntry) {
                        // Trigger the exit edit mode function for this entry
                        const event = new KeyboardEvent('keydown', { key: 'Escape' });
                        this.activeEditor.dispatchEvent(event);
                    }
                    
                    // Clear the active editor reference
                    this.activeEditor = null;
                }
            })
        );
    }
}