import { App, Editor, MarkdownView, Modal, Notice, Plugin, TFile, PluginSettingTab, Setting } from 'obsidian';

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
		console.log('Journaling plugin loaded!');

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
				console.log(editor.getSelection());
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

		// This adds a settings tab so the user can configure various aspects of the plugin
		// this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		// this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
		// 	console.log('click', evt);
		// });

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		// this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	// Function to display journal page
	async openJournalPage() {
		const journalFiles = this.getJournalFiles(); // Step to get daily notes

		console.log('Concatenated Journal Content:', journalFiles);
	}

	// Find all journal/daily note files
	getJournalFiles(): TFile[] {
		// Get all markdown files in the vault
		const files = this.app.vault.getMarkdownFiles();
		console.log("List of files:", files);

		// Filter files that follow a daily note pattern
		const journalFiles = files.filter((file) => this.isJournalFile(file));

		console.log("List of journal files:", journalFiles);
		new Notice(`All journal files added to the console.`);
		return journalFiles;
	}

	// Check if a file is a journal file (based on file name or folder)
	isJournalFile(file: TFile): boolean {
		// Adjust the pattern or folder check depending on your daily note setup
		const dailyNotePattern = /^\d{4}-\d{2}-\d{2}$/; // Matches YYYY-MM-DD
		return dailyNotePattern.test(file.basename);
	}

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
		const contentEl = leaf.view.containerEl; // Use containerEl to access the element
	
		contentEl.empty(); // Clear the content area if necessary
	
		// Create a scrollable panel for journal entries
		const panel = document.createElement('div');
		panel.classList.add('custom-journal-panel');
		panel.style.overflowY = 'scroll';  // Enable vertical scrolling
		panel.style.height = '100vh';       // Adjust height as needed
		panel.style.padding = '10px';
		panel.style.border = '1px solid var(--background-modifier-border)';
		panel.style.background = 'var(--background-primary)'; // Obsidian theme color
	
		// Add content for each journal file
		for (const file of journalFiles) {
			const fileContent = await this.app.vault.read(file);
			this.addJournalToPanel(panel, file, fileContent);
		}
	
		// Append the custom panel to the leaf's container element
		contentEl.appendChild(panel);
	}
	
	// Helper function to add each journal entry to the panel
	addJournalToPanel(panel: HTMLElement, file: TFile, content: string) {
		const journalContainer = document.createElement('div');
		journalContainer.classList.add('journal-entry');
		// journalContainer.classList.add('expanded');
		journalContainer.style.marginBottom = '20px';

		// Add a header for the journal entry
		const header = document.createElement('h3');
		header.textContent = file.basename;
		panel.appendChild(header);

		// Create the toggle button
		const toggleButton = document.createElement('button');
		toggleButton.textContent = 'Toggle Journal View';
		toggleButton.classList.add('collapsible-toggle');
		header.appendChild(toggleButton);

		// Create the collapsible content area
		const collapsibleContent = document.createElement('div');
		collapsibleContent.classList.add('collapsible-content');
		collapsibleContent.style.maxHeight = '0';  // Initially collapsed
		collapsibleContent.style.overflow = 'hidden';
		collapsibleContent.style.transition = 'max-height 0.3s ease-out';

		panel.appendChild(collapsibleContent);

		// Create an editable textarea for the file content
		const editableContent = document.createElement('textarea');
		editableContent.value = content;
		editableContent.style.width = '100%';
		editableContent.style.height = '300px';
		editableContent.style.fontSize = '16px';

		collapsibleContent.appendChild(editableContent);

		// Add event listener to toggle the panel on button click
		toggleButton.addEventListener('click', () => {
			if (collapsibleContent.style.maxHeight === '0px' || !collapsibleContent.style.maxHeight) {
				collapsibleContent.style.maxHeight = collapsibleContent.scrollHeight + 'px';  // Expand
			} else {
				collapsibleContent.style.maxHeight = '0';  // Collapse
			}
		});

	// 	// Create a container for the collapsible section
	// 	const collapsibleContainer = document.createElement('div');
	// 	collapsibleContainer.classList.add('collapsible-container');
	// 	const header = document.createElement('div');
	// 	header.classList.add('journal-entry-header');
	// 	panel.appendChild(header);

	// 	// Create the toggle button
	// 	// const toggleButton = document.createElement('button');
	// 	// toggleButton.textContent = '';
	// 	// toggleButton.classList.add('collapsible-toggle');
	// 	// header.appendChild(toggleButton);

	// 	// Create the toggle button
	// 	const toggleButton = document.createElement('button');
	// 	toggleButton.textContent = 'Toggle Journal View';
	// 	toggleButton.classList.add('collapsible-toggle');
	// 	header.appendChild(toggleButton);

	// 	const journalEntryTitle = document.createElement('h1');
	// 	journalEntryTitle.classList.add('journal-entry-title');
	// 	journalEntryTitle.textContent = file.basename;
	// 	header.appendChild(journalEntryTitle);

	// 	// const collapsibleJournalEntry = document.createElement('div');
	// 	// collapsibleJournalEntry.classList.add('collapsible-journal-entry');
	// 	// collapsibleJournalEntry.style.maxHeight = '300px';
	// 	// collapsibleJournalEntry.style.overflow = 'hidden';
	// 	// collapsibleJournalEntry.style.transition = 'max-height 0.3s ease-out';
	// 	// journalContainer.appendChild(collapsibleJournalEntry);

	// 	// Create a div for the collapsible content (the panel where journal entries are added)
	// 	const collapsibleContent = document.createElement('div');
	// 	collapsibleContent.classList.add('collapsible-content');
	// 	collapsibleContent.style.maxHeight = '0';  // Initially collapsed
	// 	collapsibleContent.style.overflow = 'hidden';
	// 	collapsibleContent.style.transition = 'max-height 0.3s ease-out';
	// 	collapsibleContainer.appendChild(collapsibleContent);

	// 	const editableContent = document.createElement('textarea');
	// 	editableContent.value = content; // Populate with file content
	// 	editableContent.style.width = '100%';
	// 	editableContent.style.height = '300px';

	// 	// Update file content on edit
	// 	editableContent.addEventListener('input', async () => {
	// 		await this.app.vault.modify(file, editableContent.value); // Save edits to the file
	// 	});

	// 	// Add event listener to the toggle button to expand/collapse content
	// 	toggleButton.addEventListener('click', () => {
	// 		// Check if it's currently collapsed
	// 		if (collapsibleContent.style.maxHeight === '0px' || !collapsibleContent.style.maxHeight) {
	// 			// Expand the content
	// 			collapsibleContent.style.maxHeight = collapsibleContent.scrollHeight + 'px';
	// 		} else {
	// 			// Collapse the content
	// 			collapsibleContent.style.maxHeight = '0';
	// 		}
	// 	});

	// 	const horizontalRule = document.createElement('hr');
	// 	horizontalRule.classList.add('journal-horizontal-hr');

	// 	// Append the rule to your container
	// 	panel.appendChild(horizontalRule);
	// 	document.body.appendChild(collapsibleContainer);

	// Save edits to the original file when the content changes
	editableContent.addEventListener('input', async () => {
		await this.app.vault.modify(file, editableContent.value);

	
	journalContainer.appendChild(editableContent);
	panel.appendChild(journalContainer);  // Append journal entry to the collapsible panel
	
	});




		// async showJournalsInCustomPanel() {
		// 	const journalFiles = this.getJournalFiles();
		
		// 	if (journalFiles.length === 0) {
		// 		new Notice('No journal files found.');
		// 		return;
		// 	}
		
			// Create the collapsible container
			// const collapsibleContainer = document.createElement('div');
			// collapsibleContainer.classList.add('collapsible-container');
		
			// Create the toggle button
			// const toggleButton = document.createElement('button');
			// toggleButton.textContent = 'Toggle Journal View';
			// toggleButton.classList.add('collapsible-toggle');
			// collapsibleContainer.appendChild(toggleButton);
		
			// Create the collapsible content area
			// const collapsibleContent = document.createElement('div');
			// collapsibleContent.classList.add('collapsible-content');
			// collapsibleContent.style.maxHeight = '0';  // Initially collapsed
			// collapsibleContent.style.overflow = 'hidden';
			// collapsibleContent.style.transition = 'max-height 0.3s ease-out';
		
			// collapsibleContainer.appendChild(collapsibleContent);
		
			// Add event listener to toggle the panel on button click
			// toggleButton.addEventListener('click', () => {
			// 	if (collapsibleContent.style.maxHeight === '0px' || !collapsibleContent.style.maxHeight) {
			// 		collapsibleContent.style.maxHeight = collapsibleContent.scrollHeight + 'px';  // Expand
			// 	} else {
			// 		collapsibleContent.style.maxHeight = '0';  // Collapse
			// 	}
			// });
		
			// Add each journal file's content to the collapsible content area
			// for (const file of journalFiles) {
			// 	const fileContent = await this.app.vault.read(file);
			// 	this.addJournalToPanel(collapsibleContent, file, fileContent);
			// }
		
			// Append the entire collapsible panel to the workspace (or a specific leaf)
			// this.app.workspace.containerEl.appendChild(collapsibleContainer);
		// }
		
		// Function to add each journal file content to the collapsible panel
		// addJournalToPanel(panel: HTMLElement, file: TFile, content: string) {
		// 	const journalContainer = document.createElement('div');
		// 	journalContainer.classList.add('journal-entry');
		// 	journalContainer.style.marginBottom = '20px';
		
			// Add a header for the journal entry
			// const header = document.createElement('h3');
			// header.textContent = file.basename;
			// journalContainer.appendChild(header);
		
			// Create an editable textarea for the file content
			// const editableContent = document.createElement('textarea');
			// editableContent.value = content;
			// editableContent.style.width = '100%';
			// editableContent.style.height = '300px';
			// editableContent.style.fontSize = '16px';
		
			// Save edits to the original file when the content changes
			// editableContent.addEventListener('input', async () => {
			// 	await this.app.vault.modify(file, editableContent.value);
			// });
		
			// journalContainer.appendChild(editableContent);
			// panel.appendChild(journalContainer);  // Append journal entry to the collapsible panel
		
		


	}

	onunload() {
		console.log('Journal Page Plugin unloaded.');
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
