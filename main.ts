import { App, Editor, MarkdownView, Modal, Notice, Plugin, TFile, PluginSettingTab, Setting } from 'obsidian';
import { text } from 'stream/consumers';

interface journalingPluginSettings {
	journalingPluginSetting: string;
}

const DEFAULT_SETTINGS: journalingPluginSettings = {
	journalingPluginSetting: 'default'
}

export default class journalingPlugin extends Plugin {
	settings: journalingPluginSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('notebook-text', 'Journals', async (evt: MouseEvent) => {
			await this.showJournalsInLeaf();
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-journal-page',
			name: 'Open Journal Page',
			callback: () => {
				this.showJournalsInLeaf();
			},
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});
	}

	// || --- journal files management ---

	// Find all journal/daily note files
	getJournalFiles(): TFile[] {
		// Get all markdown files in the vault
		const files = this.app.vault.getMarkdownFiles();

		// Filter files that follow a daily note pattern
		const journalFiles = files.filter((file) => this.isJournalFile(file));
		return journalFiles;
	}

	// Check if a file is a journal file (based on file name or folder)
	isJournalFile(file: TFile): boolean {
		// Adjust the pattern or folder check depending on your daily note setup
		const dailyNotePattern = /^\d{4}-\d{2}-\d{2}$/; // Matches YYYY-MM-DD
		return dailyNotePattern.test(file.basename);
	}

	// || --- Panel creation inside new tab ---

	async showJournalsInLeaf() {
		const journalFiles = this.getJournalFiles();
	
		if (journalFiles.length === 0) {
			new Notice('No journal files found.');
			return;
		}
	
		// Create a new leaf (opens a new tab)
		const leaf = this.app.workspace.getLeaf(true);
	
		// Set the view state to Markdown to access containerEl
		await leaf.setViewState({
			type: "markdown", // Set to markdown view type
			active: true
		});

		// Access the container element of the markdown view
		const contentElement = leaf.view.containerEl; // Use containerEl to access the element
	
		contentElement.empty(); // Clear the content area if necessary
	
		// Create a scrollable panel for journal entries
		const panel = document.createElement('div');
		panel.classList.add('custom-journal-panel');

	
		// Add content for each journal file
		for (const file of journalFiles) {
			const fileContent = await this.app.vault.read(file);
			this.addJournalToPanel(panel, file, fileContent);
		}
	
		// Append the custom panel to the leaf's container element
		contentElement.appendChild(panel);
	}

	// || --- Detailed UI creation/update ---
	
	// Helper function to add each journal entry to the panel
	addJournalToPanel(panel: HTMLElement, file: TFile, content: string) {
		const journalContainer = document.createElement('div');
		journalContainer.classList.add('journal-entry');

		// Add a header for the journal entry
		const journalEntryHeader = document.createElement('div');
		journalEntryHeader.classList.add('journal-entry-header');
		panel.appendChild(journalEntryHeader);

		// Create the toggle button
		const toggleButton = document.createElement('button');
		toggleButton.classList.add('collapsible-toggle');
		toggleButton.classList.add('toggle-expanded');
		journalEntryHeader.appendChild(toggleButton);

		// Add a link for the journal entry title leading to the original file
		const journalEntryTitle = document.createElement('h3');
		const journalEntryLink = document.createElement('a')
		journalEntryLink.textContent = file.basename;
		journalEntryLink.style.cursor = 'pointer';

		// Open file when clicking on title
		journalEntryLink.addEventListener('click', () => {
			this.app.workspace.openLinkText(file.basename, file.path);
		});

		journalEntryTitle.appendChild(journalEntryLink);
		journalEntryHeader.appendChild(journalEntryTitle);

		// Create the collapsible content area
		const collapsibleContent = document.createElement('div');
		collapsibleContent.classList.add('collapsible-content');
		collapsibleContent.classList.add('content-expanded');

		panel.appendChild(collapsibleContent);

		// Create an editable textarea for the file content
		const editableContent = document.createElement('textarea');
		editableContent.classList.add('editable-content');
		editableContent.value = content;

		collapsibleContent.appendChild(editableContent);

		// Add event listener to toggle the panel on button click
		toggleButton.addEventListener('click', () => {
			toggleButton.classList.toggle('toggle-expanded');
			collapsibleContent.classList.toggle('content-expanded');
			console.log('editable content scroll height:', editableContent.scrollHeight);
		});

		// Save edits to the original file when the content changes
		editableContent.addEventListener('input', async () => {
			await this.app.vault.modify(file, editableContent.value);
		});

		journalContainer.appendChild(editableContent);
		collapsibleContent.appendChild(journalContainer);  // Append journal entry to the collapsible panel

		const horizontalRule = document.createElement('hr');
		horizontalRule.classList.add('journal-horizontal-hr');
		panel.appendChild(horizontalRule);
	}

	onunload() {
	}


	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: journalingPlugin;

	constructor(app: App, plugin: journalingPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.journalingPluginSetting)
				.onChange(async (value) => {
					this.plugin.settings.journalingPluginSetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
