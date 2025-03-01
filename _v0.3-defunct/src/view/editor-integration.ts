import { App, Editor, MarkdownView, TFile } from 'obsidian';

/**
 * Class that handles integration with Obsidian's CodeMirror editor
 */
export class EditorIntegration {
    app: App;
    
    constructor(app: App) {
        this.app = app;
    }
    
    /**
     * Creates an editor instance for a specific file
     * @param containerEl - HTML element to place the editor in
     * @param file - The file being edited
     * @returns An object with methods to interact with the editor
     */
    async createEditor(containerEl: HTMLElement, file: TFile): Promise<{
        editor: Editor | null,
        cleanup: () => void,
        getValue: () => string,
        setValue: (content: string) => void
    }> {
        // Create a hidden leaf to host the editor
        const leaf = this.app.workspace.createLeafBySplit(
            this.app.workspace.getLeaf(false),
            'vertical'
        );
        
        // Open the file in the leaf
        await leaf.openFile(file);
        
        // Get the markdown view that contains the editor
        const view = leaf.view as MarkdownView;
        
        if (!view || !view.editor) {
            // If we couldn't get the editor, clean up and return null
            this.app.workspace.detachLeavesOfType('markdown');
            return {
                editor: null,
                cleanup: () => {},
                getValue: () => '',
                setValue: () => {}
            };
        }
        
        // Get the editor instance
        const editor = view.editor;
        
        // Get the editor's DOM element
        const editorEl = view.contentEl.querySelector('.cm-editor') as HTMLElement;
        
        if (!editorEl) {
            // If we couldn't find the editor element, clean up and return null
            this.app.workspace.detachLeavesOfType('markdown');
            return {
                editor: null,
                cleanup: () => {},
                getValue: () => '',
                setValue: () => {}
            };
        }
        
        // Move the editor element into our container
        containerEl.appendChild(editorEl);
        
        // Hide the original leaf
        leaf.containerEl.style.display = 'none';
        
        // Create a wrapper for the editor so we can style it properly
        const wrapper = containerEl.createDiv({ cls: 'editor-wrapper' });
        wrapper.appendChild(editorEl);
        
        // Make the editor fit our container
        editorEl.style.height = '100%';
        editorEl.style.width = '100%';
        
        // Return functions to interact with the editor
        return {
            editor,
            cleanup: () => {
                // Remove the editor element from our container
                if (containerEl.contains(editorEl)) {
                    containerEl.removeChild(wrapper);
                }
                
                // Detach the leaf
                this.app.workspace.detachLeavesOfType('markdown');
            },
            getValue: () => editor.getValue(),
            setValue: (content: string) => editor.setValue(content)
        };
    }
    
    /**
     * Alternative method using the app's internal functions to create an editor
     * This might be more reliable in some cases
     */
    async createEditorAlternative(containerEl: HTMLElement, file: TFile): Promise<{
        editor: any,
        cleanup: () => void,
        getValue: () => string,
        setValue: (content: string) => void
    }> {
        try {
            // Try to access Obsidian's internal editor component
            // This is internal API and might change
            const MarkdownEditView = (this.app as any).internalPlugins.plugins.editor
                .instance.constructor.MarkdownEditView;
                
            if (!MarkdownEditView) {
                throw new Error("Couldn't access Obsidian's internal editor component");
            }
            
            // Read the file content
            const content = await this.app.vault.read(file);
            
            // Create a new edit view
            const view = new MarkdownEditView(containerEl);
            
            // Set up the view with the file and content
            view.file = file;
            view.data = content;
            
            // Load the editor
            await view.onLoadFile(file);
            
            // Get the editor instance
            const editor = view.editor;
            
            return {
                editor,
                cleanup: () => {
                    view.onUnloadFile(file);
                    view.destroy();
                },
                getValue: () => editor.getValue(),
                setValue: (content: string) => editor.setValue(content)
            };
        } catch (error) {
            console.error("Failed to create editor using alternative method:", error);
            
            return {
                editor: null,
                cleanup: () => {},
                getValue: () => '',
                setValue: () => {}
            };
        }
    }
    
    /**
     * Creates a fallback textarea editor when CodeMirror integration fails
     */
    createFallbackEditor(containerEl: HTMLElement, content: string): {
        cleanup: () => void,
        getValue: () => string,
        setValue: (content: string) => void
    } {
        // Create a textarea for editing
        const textarea = containerEl.createEl('textarea', {
            cls: 'fallback-editor',
            value: content
        });
        
        // Style the textarea to match CodeMirror
        textarea.style.width = '100%';
        textarea.style.minHeight = '200px';
        textarea.style.padding = '10px';
        textarea.style.fontFamily = 'var(--font-monospace)';
        textarea.style.lineHeight = '1.5';
        textarea.style.resize = 'vertical';
        
        let currentContent = content;
        
        // Update content when typing
        textarea.addEventListener('input', () => {
            currentContent = textarea.value;
        });
        
        return {
            cleanup: () => {
                if (containerEl.contains(textarea)) {
                    containerEl.removeChild(textarea);
                }
            },
            getValue: () => currentContent,
            setValue: (content: string) => {
                currentContent = content;
                textarea.value = content;
            }
        };
    }
}