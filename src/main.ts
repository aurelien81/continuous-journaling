import { App, Editor, MarkdownView, Modal, Notice, Plugin, TFile, PluginSettingTab, Setting, MarkdownRenderer, ItemView, WorkspaceLeaf } from 'obsidian';
import { format } from 'path';
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
			await this.createDailyNote();
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('journaling-ribbon-icon');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		// const statusBarItemEl = this.addStatusBarItem();
		// statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-journal-page',
			name: 'Open Journal Page',
			callback: () => {
				this.createDailyNote();
			},
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

	async createDailyNote() {
		// Format today's date as YYYY-MM-DD
		const today = new Date();
		const formattedDate = today.toISOString().split('T')[0]; // YYYY-MM-DD
		const filePath = `${formattedDate}.md`; // Adjust this if you want a different naming format
	
		// Check if the note already exists
		let file = this.app.vault.getAbstractFileByPath(filePath);
	
		if (!file) {
			// If the file doesn't exist, create it
			const initialContent = '';
			file = await this.app.vault.create(filePath, initialContent);
			return this.showJournalsInLeaf();
		} 
	
		// Ensure file is of type TFile before opening
		if (!(file instanceof TFile)) {
			console.error(`The abstract file is not a valid TFile:`, file);
			return; // Exit if it's not a TFile
		} else {
			return this.showJournalsInLeaf();
		}
	}

	async showJournalsInLeaf() {
		// Create a scrollable panel for journal entries
		const panel = document.createElement('div');
		panel.classList.add('custom-journal-panel');

		const journalFiles = this.getJournalFiles();
	
		if (journalFiles.length === 0) {
			new Notice('No journal files found.');
			return;
		}
	
		// Create a new leaf (opens a new tab)
		const leaf = this.app.workspace.getLeaf(true);

		// Set the view state to Markdown to access containerEl
		await leaf.setViewState({
			type: "markdown",
			active: true,
		});

		// Access the container element of the markdown view
		const contentElement = leaf.view.containerEl; // Use containerEl to access the element
			
		contentElement.empty(); // Clear the content area if necessary
	
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
		const journalDate = file.basename;

		const journalEntry = document.createElement('div');
		journalEntry.classList.add('journal-entry');
		panel.appendChild(journalEntry);

		// Add a header for the journal entry
		const journalEntryHeader = document.createElement('div');
		journalEntryHeader.classList.add('journal-entry-header');
		journalEntry.appendChild(journalEntryHeader);

		// Create the toggle button
		const toggleButton = document.createElement('button');
		toggleButton.classList.add('collapsible-toggle');
		toggleButton.classList.add('toggle-expanded');
		journalEntryHeader.appendChild(toggleButton);

		// Add a link for the journal entry title leading to the original file
		const journalEntryTitle = document.createElement('h3');
		journalEntryTitle.classList.add('journal-entry-title');
		const journalEntryLink = document.createElement('a')
		journalEntryLink.classList.add('journal-entry-link');
		journalEntryLink.textContent = formatDate(journalDate);
		journalEntryTitle.appendChild(journalEntryLink);
		journalEntryHeader.appendChild(journalEntryTitle);

		// Open file when clicking on title
		journalEntryLink.addEventListener('click', () => {
			this.app.workspace.openLinkText(file.basename, file.path);
		});

		// Create the collapsible content area
		const collapsibleContent = document.createElement('div');
		collapsibleContent.classList.add('collapsible-content');
		collapsibleContent.classList.add('content-expanded');
		journalEntry.appendChild(collapsibleContent);

		const renderedContent = document.createElement('div');
		renderedContent.classList.add('rendered-content');
		renderedContent.classList.add('active-view');

		// Create an editable textarea for the file content
		const editableContent = document.createElement('textarea');
		editableContent.classList.add('editable-content');
		editableContent.value = content;

		collapsibleContent.appendChild(renderedContent);
		collapsibleContent.appendChild(editableContent);

		// Use requestAnimationFrame to ensure rendering is done for each element
		requestAnimationFrame(() => {
			editableContent.style.height = editableContent.scrollHeight + 'px';
		});

		// Function to render Markdown
		const renderContent = () => {
			renderedContent.empty();

			MarkdownRenderer.render(this.app, content, renderedContent, file.path, this);
		}

		// Initial render
		renderContent();

		// Enter edit mode
		function enterEditMode() {
			renderedContent.classList.toggle('active-view');
			editableContent.classList.toggle('active-view');
			// editableContent.style.height = 'auto';
			editableContent.style.height = editableContent.scrollHeight + 'px';
			editableContent.focus();
		}

		// Add a click event listener to the container
		renderedContent.addEventListener('click', (event) => {
			const target = event.target as HTMLElement;

			if (editableContent.placeholder === '') {
				enterEditMode(); // Call your edit mode function
			} else if (target.tagName === 'A' || target.closest('a') || target.classList.contains('cm-hastagh') || target.closest('.cm-hashtag')) {
				return;
			} else {
				// Otherwise, trigger the editing mode
				enterEditMode();
			}
		});

		editableContent.addEventListener('blur', async () => {
			content = editableContent.value; // Update content
			renderContent();
			renderedContent.classList.toggle('active-view');
			editableContent.classList.toggle('active-view');
		});

		// Event listener to adjust the height of the textarea on input
		editableContent.addEventListener('input', e => {
			editableContent.style.height = 'auto';
			editableContent.style.height = editableContent.scrollHeight + 'px';
		});

		// Event listener to adjust the height of the textarea on window resize
		window.addEventListener('resize', e => {
			editableContent.style.height = 'auto';
			editableContent.style.height = editableContent.scrollHeight + 'px';
		});

		// Add event listener to toggle the panel on button click
		toggleButton.addEventListener('click', () => {
			toggleButton.classList.toggle('toggle-expanded');
			collapsibleContent.classList.toggle('content-expanded');
		});

		// Save edits to the original file when the content changes
		editableContent.addEventListener('input', async () => {
			await this.app.vault.modify(file, editableContent.value);
		});

		// Helper function to format the date for the each journal entry title
		function formatDate(journalDate: String): string {
			const rawDate = new Date(journalDate as string);
			const dateFormatOptions: Intl.DateTimeFormatOptions = { month: 'short', year: 'numeric', day: 'numeric' };

			// Format date using Intl.DateTimeFormat
			const formattedDate = new Intl.DateTimeFormat('en-US', dateFormatOptions).format(rawDate);

			// Extract day and add ordinal suffix (e.g., 'st', 'nd', 'rd', 'th')
			const day = rawDate.getDate();
			const daySuffix = getDaySuffix(day);

			// Build the final formatted string
			const parts = formattedDate.split(' ');
			return `${parts[0]} ${day}${daySuffix}, ${parts[2]}`;
		}

		// Helper function to determine the appropriate ordinal suffix
		function getDaySuffix(day: number): string {
			if (day > 3 && day < 21) return 'th'; // Special case for 11th-19th
			switch (day % 10) {
				case 1: return 'st';
				case 2: return 'nd';
				case 3: return 'rd';
				default: return 'th';
			}
		}
	}

	// || --- Plugin methods ---

	onunload() {
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class continuousJournalingSettingTab extends PluginSettingTab {
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
