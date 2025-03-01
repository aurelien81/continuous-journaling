import { TFile } from 'obsidian';
import JournalingPlugin from '../main';
import { EntryRenderer } from './entry-renderer';

/**
 * Creates and manages edit buttons and editing functionality
 */
export class EditorView {
    plugin: JournalingPlugin;
    file: TFile;
    contentEl: HTMLElement;
    renderer: EntryRenderer;
    editButton: HTMLButtonElement | null = null;
    
    constructor(plugin: JournalingPlugin, file: TFile, contentEl: HTMLElement, renderer: EntryRenderer) {
        this.plugin = plugin;
        this.file = file;
        this.contentEl = contentEl;
        this.renderer = renderer;
        
        // Add edit button if enabled in settings
        if (this.plugin.settings.useEditButton) {
            this.addEditButton();
        }
    }
    
    /**
     * Adds an edit button to the content
     */
    private addEditButton(): void {
        this.editButton = this.contentEl.createEl('button', {
            cls: 'journal-edit-button',
            text: 'Edit'
        });
        
        // Add click event to toggle edit mode
        this.editButton.addEventListener('click', () => {
            this.toggleEditMode();
        });
    }
    
    /**
     * Toggles between edit and view modes
     */
    async toggleEditMode(): Promise<void> {
        await this.renderer.toggleEditMode();
        
        // Update button text if present
        if (this.editButton) {
            this.editButton.textContent = this.renderer.isEditing ? 'Save' : 'Edit';
        }
    }
    
    /**
     * Destroys this editor view and cleans up
     */
    destroy(): void {
        // Remove the edit button
        if (this.editButton) {
            this.editButton.removeEventListener('click', this.toggleEditMode);
            this.editButton.remove();
        }
    }
}