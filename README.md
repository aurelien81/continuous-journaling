# Continuous Journaling for Obsidian

A plugin for obsidian that displays the journals in one Logseq-like continuous page.

After installing this plugin, a new item is added to the obsidian ribbon. Clicking on this item creates a new tab that displays all the daily notes into one scrollable page. The notes are editable individually, and those edits are reflected in the original notes.

Each time the journals tab is triggered, a new daily note for the day is create if that daily note doesn't already exist.

The 'Daily Notes' core plugin is not necessary for this plugin to function.

![Dark Mode](./resources/screenshots/pluginPresentation-darkv2.png)
![Light Mode](./resources/screenshots/pluginPresentation-lightv2.png)

## Features

- **Continuous Journal View**: View all your daily journal entries in a single scrollable page
- **In-place Editing**: Edit journal entries directly in the continuous view
- **Dedicated Journal Folder**: Keep your journal entries organized in a dedicated folder
- **Automatic Creation**: Automatically creates today's journal entry when needed
- **Collapsible Entries**: Easily collapse and expand entries for better navigation
- **Customizable Settings**: Configure folder location, date format, and display preferences

## How to Use

After installing this plugin:

1. A new ribbon icon (notebook) is added to the left sidebar
2. Click the icon to open the continuous journal view
3. The view displays all your journal entries in one scrollable page
4. Click on an entry's content to edit it directly
5. Click on an entry's title to open it in a separate tab
6. Use the toggle button to collapse/expand entries

## Settings

- **Journal Folder**: Specify where journal entries are stored (default: "journals")
- **Date Format**: Format for journal filenames (default: "YYYY-MM-DD")
- **Sort Direction**: Display newest entries first or oldest entries first
- **Default Expand Entries**: Whether entries should be expanded by default

## Installation

### From Obsidian Community Plugins

1. Open Obsidian Settings
2. Go to Community Plugins
3. Browse and search for "Continuous Journaling"
4. Click Install and then Enable

### Manual Installation

1. Download the latest release from the GitHub repository
2. Extract the ZIP file into your Obsidian vault's `.obsidian/plugins/` directory
3. Reload Obsidian
4. Enable the plugin in Obsidian settings

## Why Use Continuous Journaling?

- **Seamless Experience**: View and edit all your journal entries without leaving the current context
- **Easy Navigation**: Quickly scroll through your journal history
- **Organization**: Keep your journal entries separate from other notes
- **Familiar Interface**: If you're coming from Logseq, you'll feel right at home

## Support

If you enjoy Continuous Journaling, please consider supporting the developer by buying them a coffee:

<a href="https://www.buymeacoffee.com/5SviNkXXo5" target="_blank">
  <img src="https://cdn.buymeacoffee.com/buttons/v2/default-blue.png" alt="Buy Me A Book" style="height: 60px !important;width: 217px !important;">
</a>

## Credits

Developed by Aurélien Lainé

## License

This project is licensed under the MIT License - see the LICENSE file for details.
















# Continuous Journaling for Obsidian - Functions Guide

## Core Features

### Journal View
The main view of the plugin displays all your journal entries in a continuous, scrollable page. Each entry is collapsible and editable directly from this view.

### Creating and Managing Entries

#### Automatic Creation
- **Today's Entry**: The plugin automatically creates today's journal entry when you open the journal view.
- **Entry Organization**: All entries are stored in your designated journal folder (default: "journals").

#### Navigation and Organization
- **Date Format**: Entries follow the YYYY-MM-DD format by default, which ensures proper chronological sorting.
- **Sorting Options**: View entries in either newest-first or oldest-first order.
- **Collapsible Entries**: Each entry can be expanded or collapsed to focus on specific days.

### Editing Capabilities

#### In-place Editing
- **Direct Editing**: Click on any entry's content to edit it directly within the continuous view.
- **Autosaving**: Changes are automatically saved after you stop typing (with a brief delay).
- **Visual Feedback**: A "Saving..." indicator appears while changes are being saved.
- **Close Button**: Press the "Close" button or hit Escape to exit editing mode.
- **Auto-resize**: The text area automatically adjusts its height as you type.

#### Formatting and Markdown
- **Markdown Support**: Full support for Obsidian's markdown syntax within the editor.
- **Link Handling**: Links and hashtags in the entries remain clickable and functional.

### Integration Features

#### File References
- **Insert References**: Right-click any file in Obsidian and select "Insert into Journal" to add a reference to that file in your active journal entry.
- **Image Embedding**: Insert image files as embedded content in your journal entries.
- **Note Linking**: Link to other notes within your journal entries using standard Obsidian syntax.

#### Navigation
- **Entry Links**: Click on an entry's title to open that journal entry in a separate tab.
- **Original File Access**: Each entry links to its original file for easy navigation.

## Settings and Customization

### Configuration Options
- **Journal Folder**: Specify the folder where journal entries are stored (default: "journals").
- **Date Format**: Choose the format for journal filenames (default: YYYY-MM-DD).
- **Sort Direction**: Display newest entries first or oldest entries first.
- **Default Expand Entries**: Choose whether entries should be expanded by default.

### Commands
- **Open Journal View**: Open the continuous scrollable view of all journal entries.
- **Create/Open Today's Journal**: Quickly create or access today's journal entry.

## Technical Features

### File Operations
- **Folder Creation**: Automatically creates the journal folder if it doesn't exist.
- **Date Detection**: Intelligently identifies journal entries based on their filename format.
- **File Handling**: Proper error handling for file operations (reading, writing, creation).

### User Interface
- **Responsive Design**: The interface adjusts to different screen sizes.
- **Visual Indicators**: Clear visual feedback for saving operations and editing mode.
- **Error Handling**: User-friendly error notices when operations fail.