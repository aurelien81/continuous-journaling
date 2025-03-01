import { MarkdownRenderer, Notice, TFile, WorkspaceLeaf } from 'obsidian';
import JournalingPlugin from './main';
import { formatDateForDisplay } from './utils/date-utils';
import { getJournalFiles, sortJournalFiles } from './utils/file-utils';

let clickType: 'left' | 'right' | null = null;
let needsRendering = false;
let isContextMenuOpen = false;

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
        
        // Create save indicator
        const saveIndicator = contentArea.createDiv({ 
            cls: 'journal-save-indicator',
            text: 'Saving...'
        });
        
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
            
            // Make sure textarea has current content
            editableContent.value = currentContent;
            
            // Hide rendered view, show editable view
            renderedContent.classList.remove('active-view');
            editableContent.classList.add('active-view');
            
            // Adjust textarea height
            editableContent.style.height = 'auto';
            editableContent.style.height = editableContent.scrollHeight + 'px';
            editableContent.focus();
        };
        
        // Function to exit edit mode
        const exitEditMode = async () => {
            // Clear the editing flag
            isEditing = false;
            
            // Get current content from textarea
            currentContent = editableContent.value;
            
            // Save changes
            await this.saveContentToFile(file, currentContent);
            
            // Re-render content
            renderContent();
            
            // Hide editable view, show rendered view
            editableContent.classList.remove('active-view');
            renderedContent.classList.add('active-view');
        };

        renderedContent.addEventListener('click', (event) => {
            const target = event.target as HTMLElement;
            
            // Determine if this is a right-click
            const isRightClick = event.button === 2;
            
            // Don't enter edit mode if clicking on links or hashtags
            if (target.tagName === 'A' || target.closest('a') || 
                target.classList.contains('cm-hashtag') || target.closest('.cm-hashtag')) {
                return;
            }
            
            // Enter edit mode if not a right-click
            if (!isRightClick) {
                enterEditMode();
            }
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

        // Track click type on mousedown
        editableContent.addEventListener('mousedown', (event) => {
            switch (event.button) {
                case 0: // Left click
                    clickType = 'left';
                    break;
                case 2: // Right click
                    clickType = 'right';
                    break;
            }
        });

        // Track left-click for potential rendering need
        editableContent.addEventListener('click', (event) => {
            // If clicked outside of textarea, mark for rendering
            if (event.target !== editableContent) {
                needsRendering = true;
            }
        });

        // Handle context menu to prevent default right-click behavior
        editableContent.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });

        // Handle blur event
        editableContent.addEventListener('blur', (event) => {
            setTimeout(() => {
                // Render if:
                // 1. Needs rendering is true, or
                // 2. It was a left click outside the textarea
                if (needsRendering || (clickType === 'left' && !event.relatedTarget)) {
                    renderContent();
                    needsRendering = false;
                }

                // Exit edit mode if it was a left click
                if (clickType === 'left' && !event.relatedTarget) {
                    exitEditMode();
                }

                // Reset states
                clickType = null;
            }, 100);
        });

        // Reset state when leaving the textarea
        editableContent.addEventListener('mouseleave', () => {
            console.log('Mouse left textarea');
            // Reset states to prevent stuck states
            isContextMenuOpen = false;
        });

        // Auto-save content while typing
        let saveTimeout: NodeJS.Timeout | null = null;
        editableContent.addEventListener('input', () => {
            // Show 'Saving...' indicator
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
            }, 500);
        });
        
        // Toggle expand/collapse on button click
        toggleButton.addEventListener('click', () => {
            toggleButton.classList.toggle('toggle-expanded');
            contentArea.classList.toggle('content-expanded');
        });
    }
    
    // Inserts text at the cursor position in a textarea
    private insertTextAtCursor(textarea: HTMLTextAreaElement, text: string): void {
        const cursorPos = textarea.selectionStart;
        const textBefore = textarea.value.substring(0, cursorPos);
        const textAfter = textarea.value.substring(textarea.selectionEnd);
        
        // Insert text at cursor position with newlines for formatting
        const newText = textBefore + '\n\n' + text + '\n\n' + textAfter;
        textarea.value = newText;
        
        // Set cursor position after the inserted text
        const newCursorPos = cursorPos + text.length + 4; // +4 for the newlines
        textarea.setSelectionRange(newCursorPos, newCursorPos);
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

    // Inserts a reference to a file into the current journal entry
    insertFileReference(filePath: string): void {
        needsRendering = true;
        // Find all journal entries with an active editable content
        const activeEditableContents = document.querySelectorAll('.editable-content.active-view');
        
        if (activeEditableContents.length === 0) {
            new Notice('No active journal entry to insert file into');
            return;
        }
    
        // If multiple active contents, focus on the first one
        const activeEditableContent = activeEditableContents[0] as HTMLTextAreaElement;
    
        // Determine the file reference based on the file type
        const file = this.plugin.app.vault.getAbstractFileByPath(filePath);
        if (!(file instanceof TFile)) {
            new Notice('Invalid file');
            return;
        }
    
        let fileReference: string;
        
        // Handle different file types
        if (this.isImageFile(file)) {
            // For images, use markdown image syntax
            fileReference = `![[${file.name}]]`;
        } else if (this.isMarkdownFile(file)) {
            // For markdown files, use wiki-link style
            fileReference = `![[${file.name}]]`;
        } else {
            // For other files, use a generic link
            fileReference = `![[${file.name}]]`;
        }
    
        // Ensure the textarea is focused
        activeEditableContent.focus();
    
        // Get the current cursor position
        const cursorPos = activeEditableContent.selectionStart;
        const textBefore = activeEditableContent.value.substring(0, cursorPos);
        const textAfter = activeEditableContent.value.substring(activeEditableContent.selectionEnd);
    
        // Insert text with newlines
        const newText = textBefore + '\n\n' + fileReference + '\n\n' + textAfter;
        activeEditableContent.value = newText;
    
        // Set cursor position after the inserted text
        const newCursorPos = cursorPos + fileReference.length + 4; // +4 for the newlines
        activeEditableContent.setSelectionRange(newCursorPos, newCursorPos);
    
        // Trigger input event to ensure content is saved
        const inputEvent = new Event('input', { bubbles: true, cancelable: true });
        activeEditableContent.dispatchEvent(inputEvent);
    
        // Optional: trigger change event
        const changeEvent = new Event('change', { bubbles: true, cancelable: true });
        activeEditableContent.dispatchEvent(changeEvent);
    
        // Show a success notice
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
}