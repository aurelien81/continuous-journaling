import { MarkdownRenderer, TFile, Notice } from 'obsidian';
import JournalingPlugin from '../main';
import { EditorIntegration } from './editor-integration';

/**
 * Class responsible for rendering and editing journal entries
 * Uses CodeMirror integration for editing
 */
export class EntryRenderer {
    plugin: JournalingPlugin;
    file: TFile;
    contentContainer: HTMLElement;
    renderedContent: HTMLElement;
    editorContainer: HTMLElement;
    isEditing: boolean = false;
    saveTimeout: NodeJS.Timeout | null = null;
    
    // Editor integration
    editorIntegration: EditorIntegration;
    editorInstance: any = null;
    editorCleanup: (() => void) | null = null;
    
    constructor(plugin: JournalingPlugin, file: TFile, contentContainer: HTMLElement) {
        this.plugin = plugin;
        this.file = file;
        this.contentContainer = contentContainer;
        
        // Create rendered content element
        this.renderedContent = contentContainer.createDiv({ cls: 'rendered-content active-view' });
        
        // Create editor container element
        this.editorContainer = contentContainer.createDiv({ cls: 'editor-container' });
        
        // Initialize editor integration
        this.editorIntegration = new EditorIntegration(this.plugin.app);
    }
    
    /**
     * Initializes event listeners for the rendered content
     * This is called after the content is first rendered
     */
    private initEventListeners(): void {
        // Add click event to rendered content for editing
        this.renderedContent.addEventListener('click', (event) => {
            const target = event.target as HTMLElement;
            
            // Don't enter edit mode if clicking on links, embeds, or hashtags
            if (target.tagName === 'A' || target.closest('a') || 
                target.classList.contains('cm-hashtag') || target.closest('.cm-hashtag')) {
                return;
            }
            
            this.enterEditMode();
        });
    }
    
    /**
     * Renders the content
     */
    async render(content: string): Promise<void> {
        try {
            // Clear the rendered content
            this.renderedContent.empty();
            
            // Render markdown
            await MarkdownRenderer.render(
                this.plugin.app, 
                content, 
                this.renderedContent, 
                this.file.path, 
                this.plugin
            );
            
            // Initialize event listeners if not already done
            this.initEventListeners();
            
        } catch (error) {
            console.error("Error rendering content:", error);
            this.renderedContent.setText("Error rendering content. Please try again.");
        }
    }
    
    /**
     * Enters edit mode with CodeMirror editor
     */
    async enterEditMode(): Promise<void> {
        if (this.isEditing) return;
        
        try {
            // Create the editor
            const editorResult = await this.editorIntegration.createEditor(
                this.editorContainer,
                this.file
            );
            
            // If we got an editor, set it up
            if (editorResult.editor) {
                this.editorInstance = editorResult.editor;
                this.editorCleanup = editorResult.cleanup;
                
                // Switch views
                this.renderedContent.classList.remove('active-view');
                this.editorContainer.classList.add('active-view');
                
                // Focus the editor
                this.editorInstance.focus();
                
                this.isEditing = true;
                
                // Add a "Done" button
                const doneButton = this.editorContainer.createEl('button', {
                    cls: 'editor-done-button',
                    text: 'Done'
                });
                
                doneButton.addEventListener('click', () => {
                    this.exitEditMode();
                });
            } else {
                // If we couldn't create a CodeMirror editor, fall back to a textarea
                console.warn("Falling back to textarea editor");
                
                // Get the current content
                const content = await this.plugin.app.vault.read(this.file);
                
                // Create a fallback textarea editor
                const fallbackEditor = this.editorIntegration.createFallbackEditor(
                    this.editorContainer,
                    content
                );
                
                this.editorCleanup = fallbackEditor.cleanup;
                
                // Add a save function
                const saveButton = this.editorContainer.createEl('button', {
                    cls: 'editor-save-button',
                    text: 'Save'
                });
                
                saveButton.addEventListener('click', async () => {
                    await this.saveChanges(fallbackEditor.getValue());
                    this.exitEditMode();
                });
                
                // Switch views
                this.renderedContent.classList.remove('active-view');
                this.editorContainer.classList.add('active-view');
                
                this.isEditing = true;
            }
        } catch (error) {
            console.error("Error entering edit mode:", error);
            new Notice("Error entering edit mode. Please try again.");
        }
    }
    
    /**
     * Exits edit mode and saves changes
     */
    async exitEditMode(): Promise<void> {
        if (!this.isEditing) return;
        
        try {
            // If we have an editor instance, save the content
            if (this.editorInstance) {
                const content = this.editorInstance.getValue();
                await this.saveChanges(content);
            }
            
            // Clean up the editor
            if (this.editorCleanup) {
                this.editorCleanup();
                this.editorCleanup = null;
            }
            
            // Remove any buttons we added
            const buttons = this.editorContainer.querySelectorAll('.editor-done-button, .editor-save-button');
            buttons.forEach(button => button.remove());
            
            // Switch views
            this.editorContainer.classList.remove('active-view');
            this.renderedContent.classList.add('active-view');
            
            this.isEditing = false;
            
            // Re-render the content
            const updatedContent = await this.plugin.app.vault.read(this.file);
            await this.render(updatedContent);
            
        } catch (error) {
            console.error("Error exiting edit mode:", error);
            new Notice("Error saving changes. Please try again.");
        }
    }
    
    /**
     * Saves changes to the file
     */
    private async saveChanges(content: string): Promise<void> {
        try {
            await this.plugin.app.vault.modify(this.file, content);
        } catch (error) {
            console.error('Failed to save changes:', error);
            new Notice(`Failed to save changes: ${error}`);
        }
    }
    
    /**
     * Destroys this renderer and cleans up resources
     */
    destroy(): void {
        // Clear any pending save timeout
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }
        
        // Clean up the editor if it exists
        if (this.editorCleanup) {
            this.editorCleanup();
        }
    }
}