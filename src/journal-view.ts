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
        
        // Track the current content
        let currentContent = content;
        
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
        
        // Flag to track if we're in a drag operation
        let isDragging = false;
        
        // Function to render the markdown content
        const renderContent = () => {
            renderedContent.empty();
            MarkdownRenderer.render(this.plugin.app, currentContent, renderedContent, file.path, this.plugin);
        };
        
        // Initial render
        renderContent();
        
        // Function to enter edit mode
        const enterEditMode = () => {
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
            // If we're currently dragging, don't exit edit mode
            if (isDragging) {
                return;
            }
            
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
        
        // Click on rendered content to edit
        renderedContent.addEventListener('click', (event) => {
            const target = event.target as HTMLElement;
            
            // Don't enter edit mode if clicking on links or hashtags
            if (target.tagName === 'A' || target.closest('a') || 
                target.classList.contains('cm-hashtag') || target.closest('.cm-hashtag')) {
                return;
            }
            
            // Enter edit mode
            enterEditMode();
        });
        
        // Exit edit mode when textarea loses focus (but not during drag operations)
        editableContent.addEventListener('blur', () => {
            // Add a small delay to check if we're in a drag operation
            setTimeout(() => {
                exitEditMode();
            }, 100);
        });
        
        // Handle Escape key to exit edit mode
        editableContent.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                editableContent.blur();
            }
        });
        
        // Drag events for handling image drops
        editableContent.addEventListener('dragenter', (event) => {
            isDragging = true;
            event.preventDefault();
            editableContent.classList.add('is-dragging-over');
        });
        
        editableContent.addEventListener('dragover', (event) => {
            event.preventDefault();
        });
        
        editableContent.addEventListener('dragleave', () => {
            editableContent.classList.remove('is-dragging-over');
        });
        
        editableContent.addEventListener('drop', async (event) => {
            event.preventDefault();
            editableContent.classList.remove('is-dragging-over');
            
            // Handle file drops (images)
            if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
                try {
                    // Process each dropped file
                    for (let i = 0; i < event.dataTransfer.files.length; i++) {
                        const file = event.dataTransfer.files[i];
                        
                        // Check if it's an image
                        if (file.type.startsWith('image/')) {
                            await this.handleImageDrop(file, editableContent, this.plugin.settings.journalFolder);
                        }
                    }
                } catch (error) {
                    console.error('Error handling dropped files:', error);
                    new Notice(`Error handling dropped files: ${error}`);
                }
            }
            
            // Reset dragging state
            setTimeout(() => {
                isDragging = false;
            }, 200);
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
    
    /**
     * Handles an image drop operation
     */
    private async handleImageDrop(file: File, textarea: HTMLTextAreaElement, journalFolder: string): Promise<void> {
        // Create a reader to read the image
        const reader = new FileReader();
        
        // Handle reader load
        reader.onload = async (event) => {
            if (event.target && event.target.result) {
                try {
                    // Convert the file to an ArrayBuffer
                    const buffer = await this.fileToArrayBuffer(file);
                    
                    // Create a file name for the image based on timestamp and original name
                    const timestamp = Date.now();
                    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9-_.]/g, '_');
                    const imageName = `journal-img-${timestamp}-${sanitizedFileName}`;
                    
                    // Determine the folder path for the image
                    let imageFolderPath = journalFolder ? `${journalFolder}/images` : 'images';
                    
                    // Ensure the images folder exists
                    try {
                        await this.plugin.app.vault.createFolder(imageFolderPath);
                    } catch (error) {
                        // Folder probably already exists, we can ignore this error
                    }
                    
                    // Path for the new image file
                    const imagePath = `${imageFolderPath}/${imageName}`;
                    
                    // Create the image file in the vault
                    await this.plugin.app.vault.createBinary(imagePath, buffer);
                    
                    // Insert the markdown for the image at the cursor position
                    const imageMarkdown = `![${file.name}](${imagePath})`;
                    this.insertTextAtCursor(textarea, imageMarkdown);
                    
                    // Trigger an input event to ensure content is saved
                    const inputEvent = new Event('input', { bubbles: true, cancelable: true });
                    textarea.dispatchEvent(inputEvent);
                    
                    new Notice(`Image "${file.name}" added`);
                } catch (error) {
                    console.error('Error saving image:', error);
                    new Notice(`Error saving image: ${error}`);
                }
            }
        };
        
        // Start reading the file
        reader.readAsDataURL(file);
    }
    
    /**
     * Converts a File to ArrayBuffer
     */
    private fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as ArrayBuffer);
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }
    
    /**
     * Inserts text at the cursor position in a textarea
     */
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
}