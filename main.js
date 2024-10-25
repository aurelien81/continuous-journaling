/*
THIS IS A GENERATED/BUNDLED FILE BY ESBUILD
if you want to view the source, please visit the github repository of this plugin
*/

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => journalingPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
var DEFAULT_SETTINGS = {
  journalingPluginSetting: "default"
};
var journalingPlugin = class extends import_obsidian.Plugin {
  async onload() {
    await this.loadSettings();
    const ribbonIconEl = this.addRibbonIcon("notebook-text", "Journals", async (evt) => {
      await this.showJournalsInLeaf();
    });
    ribbonIconEl.addClass("my-plugin-ribbon-class");
    const statusBarItemEl = this.addStatusBarItem();
    statusBarItemEl.setText("Status Bar Text");
    this.addCommand({
      id: "open-journal-page",
      name: "Open Journal Page",
      callback: () => {
        this.showJournalsInLeaf();
      }
    });
    this.addCommand({
      id: "sample-editor-command",
      name: "Sample editor command",
      editorCallback: (editor, view) => {
        editor.replaceSelection("Sample Editor Command");
      }
    });
    this.addCommand({
      id: "open-sample-modal-complex",
      name: "Open sample modal (complex)",
      checkCallback: (checking) => {
        const markdownView = this.app.workspace.getActiveViewOfType(import_obsidian.MarkdownView);
        if (markdownView) {
          if (!checking) {
            new SampleModal(this.app).open();
          }
          return true;
        }
      }
    });
  }
  // || --- journal files management ---
  // Find all journal/daily note files
  getJournalFiles() {
    const files = this.app.vault.getMarkdownFiles();
    const journalFiles = files.filter((file) => this.isJournalFile(file));
    return journalFiles;
  }
  // Check if a file is a journal file (based on file name or folder)
  isJournalFile(file) {
    const dailyNotePattern = /^\d{4}-\d{2}-\d{2}$/;
    return dailyNotePattern.test(file.basename);
  }
  // || --- Panel creation inside new tab ---
  async showJournalsInLeaf() {
    const journalFiles = this.getJournalFiles();
    if (journalFiles.length === 0) {
      new import_obsidian.Notice("No journal files found.");
      return;
    }
    const leaf = this.app.workspace.getLeaf(true);
    await leaf.setViewState({
      type: "markdown",
      // Set to markdown view type
      active: true
    });
    const contentElement = leaf.view.containerEl;
    contentElement.empty();
    const panel = document.createElement("div");
    panel.classList.add("custom-journal-panel");
    for (const file of journalFiles) {
      const fileContent = await this.app.vault.read(file);
      this.addJournalToPanel(panel, file, fileContent);
    }
    contentElement.appendChild(panel);
  }
  // || --- Detailed UI creation/update ---
  // Helper function to add each journal entry to the panel
  addJournalToPanel(panel, file, content) {
    const journalDate = file.basename;
    const journalEntry = document.createElement("div");
    journalEntry.classList.add("journal-entry");
    panel.appendChild(journalEntry);
    const journalEntryHeader = document.createElement("div");
    journalEntryHeader.classList.add("journal-entry-header");
    journalEntry.appendChild(journalEntryHeader);
    const toggleButton = document.createElement("button");
    toggleButton.classList.add("collapsible-toggle");
    toggleButton.classList.add("toggle-expanded");
    journalEntryHeader.appendChild(toggleButton);
    const journalEntryTitle = document.createElement("h3");
    journalEntryTitle.classList.add("journal-entry-title");
    const journalEntryLink = document.createElement("a");
    journalEntryLink.classList.add("journal-entry-link");
    journalEntryLink.textContent = formatDate(journalDate);
    journalEntryLink.style.cursor = "pointer";
    journalEntryTitle.appendChild(journalEntryLink);
    journalEntryHeader.appendChild(journalEntryTitle);
    journalEntryLink.addEventListener("click", () => {
      this.app.workspace.openLinkText(file.basename, file.path);
    });
    const collapsibleContent = document.createElement("div");
    collapsibleContent.classList.add("collapsible-content");
    collapsibleContent.classList.add("content-expanded");
    journalEntry.appendChild(collapsibleContent);
    const editableContent = document.createElement("textarea");
    editableContent.classList.add("editable-content");
    editableContent.value = content;
    collapsibleContent.appendChild(editableContent);
    requestAnimationFrame(() => {
      editableContent.style.height = editableContent.scrollHeight + "px";
    });
    editableContent.addEventListener("input", (e) => {
      editableContent.style.height = "auto";
      editableContent.style.height = editableContent.scrollHeight + "px";
    });
    window.addEventListener("resize", (e) => {
      editableContent.style.height = "auto";
      editableContent.style.height = editableContent.scrollHeight + "px";
    });
    toggleButton.addEventListener("click", () => {
      toggleButton.classList.toggle("toggle-expanded");
      collapsibleContent.classList.toggle("content-expanded");
    });
    editableContent.addEventListener("input", async () => {
      await this.app.vault.modify(file, editableContent.value);
    });
    function formatDate(journalDate2) {
      const rawDate = new Date(journalDate2);
      const dateFormatOptions = { month: "short", year: "numeric", day: "numeric" };
      const formattedDate = new Intl.DateTimeFormat("en-US", dateFormatOptions).format(rawDate);
      const day = rawDate.getDate();
      const daySuffix = getDaySuffix(day);
      const parts = formattedDate.split(" ");
      return `${parts[0]} ${day}${daySuffix}, ${parts[2]}`;
    }
    function getDaySuffix(day) {
      if (day > 3 && day < 21)
        return "th";
      switch (day % 10) {
        case 1:
          return "st";
        case 2:
          return "nd";
        case 3:
          return "rd";
        default:
          return "th";
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
};
var SampleModal = class extends import_obsidian.Modal {
  constructor(app) {
    super(app);
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.setText("Woah!");
  }
  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgQXBwLCBFZGl0b3IsIE1hcmtkb3duVmlldywgTW9kYWwsIE5vdGljZSwgUGx1Z2luLCBURmlsZSwgUGx1Z2luU2V0dGluZ1RhYiwgU2V0dGluZyB9IGZyb20gJ29ic2lkaWFuJztcbmltcG9ydCB7IGZvcm1hdCB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgdGV4dCB9IGZyb20gJ3N0cmVhbS9jb25zdW1lcnMnO1xuXG5pbnRlcmZhY2Ugam91cm5hbGluZ1BsdWdpblNldHRpbmdzIHtcblx0am91cm5hbGluZ1BsdWdpblNldHRpbmc6IHN0cmluZztcbn1cblxuY29uc3QgREVGQVVMVF9TRVRUSU5HUzogam91cm5hbGluZ1BsdWdpblNldHRpbmdzID0ge1xuXHRqb3VybmFsaW5nUGx1Z2luU2V0dGluZzogJ2RlZmF1bHQnXG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIGpvdXJuYWxpbmdQbHVnaW4gZXh0ZW5kcyBQbHVnaW4ge1xuXHRzZXR0aW5nczogam91cm5hbGluZ1BsdWdpblNldHRpbmdzO1xuXG5cdGFzeW5jIG9ubG9hZCgpIHtcblx0XHRhd2FpdCB0aGlzLmxvYWRTZXR0aW5ncygpO1xuXG5cdFx0Ly8gVGhpcyBjcmVhdGVzIGFuIGljb24gaW4gdGhlIGxlZnQgcmliYm9uLlxuXHRcdGNvbnN0IHJpYmJvbkljb25FbCA9IHRoaXMuYWRkUmliYm9uSWNvbignbm90ZWJvb2stdGV4dCcsICdKb3VybmFscycsIGFzeW5jIChldnQ6IE1vdXNlRXZlbnQpID0+IHtcblx0XHRcdGF3YWl0IHRoaXMuc2hvd0pvdXJuYWxzSW5MZWFmKCk7XG5cdFx0fSk7XG5cdFx0Ly8gUGVyZm9ybSBhZGRpdGlvbmFsIHRoaW5ncyB3aXRoIHRoZSByaWJib25cblx0XHRyaWJib25JY29uRWwuYWRkQ2xhc3MoJ215LXBsdWdpbi1yaWJib24tY2xhc3MnKTtcblxuXHRcdC8vIFRoaXMgYWRkcyBhIHN0YXR1cyBiYXIgaXRlbSB0byB0aGUgYm90dG9tIG9mIHRoZSBhcHAuIERvZXMgbm90IHdvcmsgb24gbW9iaWxlIGFwcHMuXG5cdFx0Y29uc3Qgc3RhdHVzQmFySXRlbUVsID0gdGhpcy5hZGRTdGF0dXNCYXJJdGVtKCk7XG5cdFx0c3RhdHVzQmFySXRlbUVsLnNldFRleHQoJ1N0YXR1cyBCYXIgVGV4dCcpO1xuXG5cdFx0Ly8gVGhpcyBhZGRzIGEgc2ltcGxlIGNvbW1hbmQgdGhhdCBjYW4gYmUgdHJpZ2dlcmVkIGFueXdoZXJlXG5cdFx0dGhpcy5hZGRDb21tYW5kKHtcblx0XHRcdGlkOiAnb3Blbi1qb3VybmFsLXBhZ2UnLFxuXHRcdFx0bmFtZTogJ09wZW4gSm91cm5hbCBQYWdlJyxcblx0XHRcdGNhbGxiYWNrOiAoKSA9PiB7XG5cdFx0XHRcdHRoaXMuc2hvd0pvdXJuYWxzSW5MZWFmKCk7XG5cdFx0XHR9LFxuXHRcdH0pO1xuXHRcdC8vIFRoaXMgYWRkcyBhbiBlZGl0b3IgY29tbWFuZCB0aGF0IGNhbiBwZXJmb3JtIHNvbWUgb3BlcmF0aW9uIG9uIHRoZSBjdXJyZW50IGVkaXRvciBpbnN0YW5jZVxuXHRcdHRoaXMuYWRkQ29tbWFuZCh7XG5cdFx0XHRpZDogJ3NhbXBsZS1lZGl0b3ItY29tbWFuZCcsXG5cdFx0XHRuYW1lOiAnU2FtcGxlIGVkaXRvciBjb21tYW5kJyxcblx0XHRcdGVkaXRvckNhbGxiYWNrOiAoZWRpdG9yOiBFZGl0b3IsIHZpZXc6IE1hcmtkb3duVmlldykgPT4ge1xuXHRcdFx0XHRlZGl0b3IucmVwbGFjZVNlbGVjdGlvbignU2FtcGxlIEVkaXRvciBDb21tYW5kJyk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0Ly8gVGhpcyBhZGRzIGEgY29tcGxleCBjb21tYW5kIHRoYXQgY2FuIGNoZWNrIHdoZXRoZXIgdGhlIGN1cnJlbnQgc3RhdGUgb2YgdGhlIGFwcCBhbGxvd3MgZXhlY3V0aW9uIG9mIHRoZSBjb21tYW5kXG5cdFx0dGhpcy5hZGRDb21tYW5kKHtcblx0XHRcdGlkOiAnb3Blbi1zYW1wbGUtbW9kYWwtY29tcGxleCcsXG5cdFx0XHRuYW1lOiAnT3BlbiBzYW1wbGUgbW9kYWwgKGNvbXBsZXgpJyxcblx0XHRcdGNoZWNrQ2FsbGJhY2s6IChjaGVja2luZzogYm9vbGVhbikgPT4ge1xuXHRcdFx0XHQvLyBDb25kaXRpb25zIHRvIGNoZWNrXG5cdFx0XHRcdGNvbnN0IG1hcmtkb3duVmlldyA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVWaWV3T2ZUeXBlKE1hcmtkb3duVmlldyk7XG5cdFx0XHRcdGlmIChtYXJrZG93blZpZXcpIHtcblx0XHRcdFx0XHQvLyBJZiBjaGVja2luZyBpcyB0cnVlLCB3ZSdyZSBzaW1wbHkgXCJjaGVja2luZ1wiIGlmIHRoZSBjb21tYW5kIGNhbiBiZSBydW4uXG5cdFx0XHRcdFx0Ly8gSWYgY2hlY2tpbmcgaXMgZmFsc2UsIHRoZW4gd2Ugd2FudCB0byBhY3R1YWxseSBwZXJmb3JtIHRoZSBvcGVyYXRpb24uXG5cdFx0XHRcdFx0aWYgKCFjaGVja2luZykge1xuXHRcdFx0XHRcdFx0bmV3IFNhbXBsZU1vZGFsKHRoaXMuYXBwKS5vcGVuKCk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Ly8gVGhpcyBjb21tYW5kIHdpbGwgb25seSBzaG93IHVwIGluIENvbW1hbmQgUGFsZXR0ZSB3aGVuIHRoZSBjaGVjayBmdW5jdGlvbiByZXR1cm5zIHRydWVcblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG5cblx0Ly8gfHwgLS0tIGpvdXJuYWwgZmlsZXMgbWFuYWdlbWVudCAtLS1cblxuXHQvLyBGaW5kIGFsbCBqb3VybmFsL2RhaWx5IG5vdGUgZmlsZXNcblx0Z2V0Sm91cm5hbEZpbGVzKCk6IFRGaWxlW10ge1xuXHRcdC8vIEdldCBhbGwgbWFya2Rvd24gZmlsZXMgaW4gdGhlIHZhdWx0XG5cdFx0Y29uc3QgZmlsZXMgPSB0aGlzLmFwcC52YXVsdC5nZXRNYXJrZG93bkZpbGVzKCk7XG5cblx0XHQvLyBGaWx0ZXIgZmlsZXMgdGhhdCBmb2xsb3cgYSBkYWlseSBub3RlIHBhdHRlcm5cblx0XHRjb25zdCBqb3VybmFsRmlsZXMgPSBmaWxlcy5maWx0ZXIoKGZpbGUpID0+IHRoaXMuaXNKb3VybmFsRmlsZShmaWxlKSk7XG5cdFx0cmV0dXJuIGpvdXJuYWxGaWxlcztcblx0fVxuXG5cdC8vIENoZWNrIGlmIGEgZmlsZSBpcyBhIGpvdXJuYWwgZmlsZSAoYmFzZWQgb24gZmlsZSBuYW1lIG9yIGZvbGRlcilcblx0aXNKb3VybmFsRmlsZShmaWxlOiBURmlsZSk6IGJvb2xlYW4ge1xuXHRcdC8vIEFkanVzdCB0aGUgcGF0dGVybiBvciBmb2xkZXIgY2hlY2sgZGVwZW5kaW5nIG9uIHlvdXIgZGFpbHkgbm90ZSBzZXR1cFxuXHRcdGNvbnN0IGRhaWx5Tm90ZVBhdHRlcm4gPSAvXlxcZHs0fS1cXGR7Mn0tXFxkezJ9JC87IC8vIE1hdGNoZXMgWVlZWS1NTS1ERFxuXHRcdHJldHVybiBkYWlseU5vdGVQYXR0ZXJuLnRlc3QoZmlsZS5iYXNlbmFtZSk7XG5cdH1cblxuXHQvLyB8fCAtLS0gUGFuZWwgY3JlYXRpb24gaW5zaWRlIG5ldyB0YWIgLS0tXG5cblx0YXN5bmMgc2hvd0pvdXJuYWxzSW5MZWFmKCkge1xuXHRcdGNvbnN0IGpvdXJuYWxGaWxlcyA9IHRoaXMuZ2V0Sm91cm5hbEZpbGVzKCk7XG5cdFxuXHRcdGlmIChqb3VybmFsRmlsZXMubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRuZXcgTm90aWNlKCdObyBqb3VybmFsIGZpbGVzIGZvdW5kLicpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XG5cdFx0Ly8gQ3JlYXRlIGEgbmV3IGxlYWYgKG9wZW5zIGEgbmV3IHRhYilcblx0XHRjb25zdCBsZWFmID0gdGhpcy5hcHAud29ya3NwYWNlLmdldExlYWYodHJ1ZSk7XG5cdFxuXHRcdC8vIFNldCB0aGUgdmlldyBzdGF0ZSB0byBNYXJrZG93biB0byBhY2Nlc3MgY29udGFpbmVyRWxcblx0XHRhd2FpdCBsZWFmLnNldFZpZXdTdGF0ZSh7XG5cdFx0XHR0eXBlOiBcIm1hcmtkb3duXCIsIC8vIFNldCB0byBtYXJrZG93biB2aWV3IHR5cGVcblx0XHRcdGFjdGl2ZTogdHJ1ZVxuXHRcdH0pO1xuXG5cdFx0Ly8gQWNjZXNzIHRoZSBjb250YWluZXIgZWxlbWVudCBvZiB0aGUgbWFya2Rvd24gdmlld1xuXHRcdGNvbnN0IGNvbnRlbnRFbGVtZW50ID0gbGVhZi52aWV3LmNvbnRhaW5lckVsOyAvLyBVc2UgY29udGFpbmVyRWwgdG8gYWNjZXNzIHRoZSBlbGVtZW50XG5cdFxuXHRcdGNvbnRlbnRFbGVtZW50LmVtcHR5KCk7IC8vIENsZWFyIHRoZSBjb250ZW50IGFyZWEgaWYgbmVjZXNzYXJ5XG5cdFxuXHRcdC8vIENyZWF0ZSBhIHNjcm9sbGFibGUgcGFuZWwgZm9yIGpvdXJuYWwgZW50cmllc1xuXHRcdGNvbnN0IHBhbmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cdFx0cGFuZWwuY2xhc3NMaXN0LmFkZCgnY3VzdG9tLWpvdXJuYWwtcGFuZWwnKTtcblxuXHRcblx0XHQvLyBBZGQgY29udGVudCBmb3IgZWFjaCBqb3VybmFsIGZpbGVcblx0XHRmb3IgKGNvbnN0IGZpbGUgb2Ygam91cm5hbEZpbGVzKSB7XG5cdFx0XHRjb25zdCBmaWxlQ29udGVudCA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LnJlYWQoZmlsZSk7XG5cdFx0XHR0aGlzLmFkZEpvdXJuYWxUb1BhbmVsKHBhbmVsLCBmaWxlLCBmaWxlQ29udGVudCk7XG5cdFx0fVxuXHRcblx0XHQvLyBBcHBlbmQgdGhlIGN1c3RvbSBwYW5lbCB0byB0aGUgbGVhZidzIGNvbnRhaW5lciBlbGVtZW50XG5cdFx0Y29udGVudEVsZW1lbnQuYXBwZW5kQ2hpbGQocGFuZWwpO1xuXHR9XG5cblx0Ly8gfHwgLS0tIERldGFpbGVkIFVJIGNyZWF0aW9uL3VwZGF0ZSAtLS1cblx0XG5cdC8vIEhlbHBlciBmdW5jdGlvbiB0byBhZGQgZWFjaCBqb3VybmFsIGVudHJ5IHRvIHRoZSBwYW5lbFxuXHRhZGRKb3VybmFsVG9QYW5lbChwYW5lbDogSFRNTEVsZW1lbnQsIGZpbGU6IFRGaWxlLCBjb250ZW50OiBzdHJpbmcpIHtcblx0XHRjb25zdCBqb3VybmFsRGF0ZSA9IGZpbGUuYmFzZW5hbWU7XG5cblx0XHRjb25zdCBqb3VybmFsRW50cnkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblx0XHRqb3VybmFsRW50cnkuY2xhc3NMaXN0LmFkZCgnam91cm5hbC1lbnRyeScpO1xuXHRcdHBhbmVsLmFwcGVuZENoaWxkKGpvdXJuYWxFbnRyeSk7XG5cblx0XHQvLyBBZGQgYSBoZWFkZXIgZm9yIHRoZSBqb3VybmFsIGVudHJ5XG5cdFx0Y29uc3Qgam91cm5hbEVudHJ5SGVhZGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cdFx0am91cm5hbEVudHJ5SGVhZGVyLmNsYXNzTGlzdC5hZGQoJ2pvdXJuYWwtZW50cnktaGVhZGVyJyk7XG5cdFx0am91cm5hbEVudHJ5LmFwcGVuZENoaWxkKGpvdXJuYWxFbnRyeUhlYWRlcik7XG5cblx0XHQvLyBDcmVhdGUgdGhlIHRvZ2dsZSBidXR0b25cblx0XHRjb25zdCB0b2dnbGVCdXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcblx0XHR0b2dnbGVCdXR0b24uY2xhc3NMaXN0LmFkZCgnY29sbGFwc2libGUtdG9nZ2xlJyk7XG5cdFx0dG9nZ2xlQnV0dG9uLmNsYXNzTGlzdC5hZGQoJ3RvZ2dsZS1leHBhbmRlZCcpO1xuXHRcdGpvdXJuYWxFbnRyeUhlYWRlci5hcHBlbmRDaGlsZCh0b2dnbGVCdXR0b24pO1xuXG5cdFx0Ly8gQWRkIGEgbGluayBmb3IgdGhlIGpvdXJuYWwgZW50cnkgdGl0bGUgbGVhZGluZyB0byB0aGUgb3JpZ2luYWwgZmlsZVxuXHRcdGNvbnN0IGpvdXJuYWxFbnRyeVRpdGxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaDMnKTtcblx0XHRqb3VybmFsRW50cnlUaXRsZS5jbGFzc0xpc3QuYWRkKCdqb3VybmFsLWVudHJ5LXRpdGxlJyk7XG5cdFx0Y29uc3Qgam91cm5hbEVudHJ5TGluayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKVxuXHRcdGpvdXJuYWxFbnRyeUxpbmsuY2xhc3NMaXN0LmFkZCgnam91cm5hbC1lbnRyeS1saW5rJyk7XG5cdFx0am91cm5hbEVudHJ5TGluay50ZXh0Q29udGVudCA9IGZvcm1hdERhdGUoam91cm5hbERhdGUpO1xuXHRcdGpvdXJuYWxFbnRyeUxpbmsuc3R5bGUuY3Vyc29yID0gJ3BvaW50ZXInO1xuXHRcdGpvdXJuYWxFbnRyeVRpdGxlLmFwcGVuZENoaWxkKGpvdXJuYWxFbnRyeUxpbmspO1xuXHRcdGpvdXJuYWxFbnRyeUhlYWRlci5hcHBlbmRDaGlsZChqb3VybmFsRW50cnlUaXRsZSk7XG5cblx0XHQvLyBPcGVuIGZpbGUgd2hlbiBjbGlja2luZyBvbiB0aXRsZVxuXHRcdGpvdXJuYWxFbnRyeUxpbmsuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG5cdFx0XHR0aGlzLmFwcC53b3Jrc3BhY2Uub3BlbkxpbmtUZXh0KGZpbGUuYmFzZW5hbWUsIGZpbGUucGF0aCk7XG5cdFx0fSk7XG5cblx0XHQvLyBDcmVhdGUgdGhlIGNvbGxhcHNpYmxlIGNvbnRlbnQgYXJlYVxuXHRcdGNvbnN0IGNvbGxhcHNpYmxlQ29udGVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXHRcdGNvbGxhcHNpYmxlQ29udGVudC5jbGFzc0xpc3QuYWRkKCdjb2xsYXBzaWJsZS1jb250ZW50Jyk7XG5cdFx0Y29sbGFwc2libGVDb250ZW50LmNsYXNzTGlzdC5hZGQoJ2NvbnRlbnQtZXhwYW5kZWQnKTtcblx0XHRqb3VybmFsRW50cnkuYXBwZW5kQ2hpbGQoY29sbGFwc2libGVDb250ZW50KTtcblxuXHRcdC8vIENyZWF0ZSBhbiBlZGl0YWJsZSB0ZXh0YXJlYSBmb3IgdGhlIGZpbGUgY29udGVudFxuXHRcdGNvbnN0IGVkaXRhYmxlQ29udGVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RleHRhcmVhJyk7XG5cdFx0ZWRpdGFibGVDb250ZW50LmNsYXNzTGlzdC5hZGQoJ2VkaXRhYmxlLWNvbnRlbnQnKTtcblx0XHRlZGl0YWJsZUNvbnRlbnQudmFsdWUgPSBjb250ZW50O1xuXHRcdGNvbGxhcHNpYmxlQ29udGVudC5hcHBlbmRDaGlsZChlZGl0YWJsZUNvbnRlbnQpO1xuXG5cdFx0Ly8gVXNlIHJlcXVlc3RBbmltYXRpb25GcmFtZSB0byBlbnN1cmUgcmVuZGVyaW5nIGlzIGRvbmUgZm9yIGVhY2ggZWxlbWVudFxuXHRcdHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG5cdFx0XHRlZGl0YWJsZUNvbnRlbnQuc3R5bGUuaGVpZ2h0ID0gZWRpdGFibGVDb250ZW50LnNjcm9sbEhlaWdodCArICdweCc7XG5cdFx0fSk7XG5cblx0XHQvLyBFdmVudCBsaXN0ZW5lciB0byBhZGp1c3QgdGhlIGhlaWdodCBvZiB0aGUgdGV4dGFyZWEgb24gaW5wdXRcblx0XHRlZGl0YWJsZUNvbnRlbnQuYWRkRXZlbnRMaXN0ZW5lcignaW5wdXQnLCBlID0+IHtcblx0XHRcdGVkaXRhYmxlQ29udGVudC5zdHlsZS5oZWlnaHQgPSAnYXV0byc7XG5cdFx0XHRlZGl0YWJsZUNvbnRlbnQuc3R5bGUuaGVpZ2h0ID0gZWRpdGFibGVDb250ZW50LnNjcm9sbEhlaWdodCArICdweCc7XG5cdFx0fSk7XG5cblx0XHQvLyBFdmVudCBsaXN0ZW5lciB0byBhZGp1c3QgdGhlIGhlaWdodCBvZiB0aGUgdGV4dGFyZWEgb24gd2luZG93IHJlc2l6ZVxuXHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCBlID0+IHtcblx0XHRcdGVkaXRhYmxlQ29udGVudC5zdHlsZS5oZWlnaHQgPSAnYXV0byc7XG5cdFx0XHRlZGl0YWJsZUNvbnRlbnQuc3R5bGUuaGVpZ2h0ID0gZWRpdGFibGVDb250ZW50LnNjcm9sbEhlaWdodCArICdweCc7XG5cdFx0fSk7XG5cblx0XHQvLyBBZGQgZXZlbnQgbGlzdGVuZXIgdG8gdG9nZ2xlIHRoZSBwYW5lbCBvbiBidXR0b24gY2xpY2tcblx0XHR0b2dnbGVCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG5cdFx0XHR0b2dnbGVCdXR0b24uY2xhc3NMaXN0LnRvZ2dsZSgndG9nZ2xlLWV4cGFuZGVkJyk7XG5cdFx0XHRjb2xsYXBzaWJsZUNvbnRlbnQuY2xhc3NMaXN0LnRvZ2dsZSgnY29udGVudC1leHBhbmRlZCcpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gU2F2ZSBlZGl0cyB0byB0aGUgb3JpZ2luYWwgZmlsZSB3aGVuIHRoZSBjb250ZW50IGNoYW5nZXNcblx0XHRlZGl0YWJsZUNvbnRlbnQuYWRkRXZlbnRMaXN0ZW5lcignaW5wdXQnLCBhc3luYyAoKSA9PiB7XG5cdFx0XHRhd2FpdCB0aGlzLmFwcC52YXVsdC5tb2RpZnkoZmlsZSwgZWRpdGFibGVDb250ZW50LnZhbHVlKTtcblx0XHR9KTtcblxuXHRcdC8vIEhlbHBlciBmdW5jdGlvbiB0byBmb3JtYXQgdGhlIGRhdGUgZm9yIHRoZSBlYWNoIGpvdXJuYWwgZW50cnkgdGl0bGVcblx0XHRmdW5jdGlvbiBmb3JtYXREYXRlKGpvdXJuYWxEYXRlOiBTdHJpbmcpOiBzdHJpbmcge1xuXHRcdFx0Y29uc3QgcmF3RGF0ZSA9IG5ldyBEYXRlKGpvdXJuYWxEYXRlIGFzIHN0cmluZyk7XG5cdFx0XHRjb25zdCBkYXRlRm9ybWF0T3B0aW9uczogSW50bC5EYXRlVGltZUZvcm1hdE9wdGlvbnMgPSB7IG1vbnRoOiAnc2hvcnQnLCB5ZWFyOiAnbnVtZXJpYycsIGRheTogJ251bWVyaWMnIH07XG5cblx0XHRcdC8vIEZvcm1hdCBkYXRlIHVzaW5nIEludGwuRGF0ZVRpbWVGb3JtYXRcblx0XHRcdGNvbnN0IGZvcm1hdHRlZERhdGUgPSBuZXcgSW50bC5EYXRlVGltZUZvcm1hdCgnZW4tVVMnLCBkYXRlRm9ybWF0T3B0aW9ucykuZm9ybWF0KHJhd0RhdGUpO1xuXG5cdFx0XHQvLyBFeHRyYWN0IGRheSBhbmQgYWRkIG9yZGluYWwgc3VmZml4IChlLmcuLCAnc3QnLCAnbmQnLCAncmQnLCAndGgnKVxuXHRcdFx0Y29uc3QgZGF5ID0gcmF3RGF0ZS5nZXREYXRlKCk7XG5cdFx0XHRjb25zdCBkYXlTdWZmaXggPSBnZXREYXlTdWZmaXgoZGF5KTtcblxuXHRcdFx0Ly8gQnVpbGQgdGhlIGZpbmFsIGZvcm1hdHRlZCBzdHJpbmdcblx0XHRcdGNvbnN0IHBhcnRzID0gZm9ybWF0dGVkRGF0ZS5zcGxpdCgnICcpO1xuXHRcdFx0cmV0dXJuIGAke3BhcnRzWzBdfSAke2RheX0ke2RheVN1ZmZpeH0sICR7cGFydHNbMl19YDtcblx0XHR9XG5cblx0XHQvLyBIZWxwZXIgZnVuY3Rpb24gdG8gZGV0ZXJtaW5lIHRoZSBhcHByb3ByaWF0ZSBvcmRpbmFsIHN1ZmZpeFxuXHRcdGZ1bmN0aW9uIGdldERheVN1ZmZpeChkYXk6IG51bWJlcik6IHN0cmluZyB7XG5cdFx0XHRpZiAoZGF5ID4gMyAmJiBkYXkgPCAyMSkgcmV0dXJuICd0aCc7IC8vIFNwZWNpYWwgY2FzZSBmb3IgMTF0aC0xOXRoXG5cdFx0XHRzd2l0Y2ggKGRheSAlIDEwKSB7XG5cdFx0XHRcdGNhc2UgMTogcmV0dXJuICdzdCc7XG5cdFx0XHRcdGNhc2UgMjogcmV0dXJuICduZCc7XG5cdFx0XHRcdGNhc2UgMzogcmV0dXJuICdyZCc7XG5cdFx0XHRcdGRlZmF1bHQ6IHJldHVybiAndGgnO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdC8vIHx8IC0tLSBQbHVnaW4gbWV0aG9kcyAtLS1cblxuXHRvbnVubG9hZCgpIHtcblx0fVxuXG5cblx0YXN5bmMgbG9hZFNldHRpbmdzKCkge1xuXHRcdHRoaXMuc2V0dGluZ3MgPSBPYmplY3QuYXNzaWduKHt9LCBERUZBVUxUX1NFVFRJTkdTLCBhd2FpdCB0aGlzLmxvYWREYXRhKCkpO1xuXHR9XG5cblx0YXN5bmMgc2F2ZVNldHRpbmdzKCkge1xuXHRcdGF3YWl0IHRoaXMuc2F2ZURhdGEodGhpcy5zZXR0aW5ncyk7XG5cdH1cbn1cblxuY2xhc3MgU2FtcGxlTW9kYWwgZXh0ZW5kcyBNb2RhbCB7XG5cdGNvbnN0cnVjdG9yKGFwcDogQXBwKSB7XG5cdFx0c3VwZXIoYXBwKTtcblx0fVxuXG5cdG9uT3BlbigpIHtcblx0XHRjb25zdCB7Y29udGVudEVsfSA9IHRoaXM7XG5cdFx0Y29udGVudEVsLnNldFRleHQoJ1dvYWghJyk7XG5cdH1cblxuXHRvbkNsb3NlKCkge1xuXHRcdGNvbnN0IHtjb250ZW50RWx9ID0gdGhpcztcblx0XHRjb250ZW50RWwuZW1wdHkoKTtcblx0fVxufVxuXG5jbGFzcyBTYW1wbGVTZXR0aW5nVGFiIGV4dGVuZHMgUGx1Z2luU2V0dGluZ1RhYiB7XG5cdHBsdWdpbjogam91cm5hbGluZ1BsdWdpbjtcblxuXHRjb25zdHJ1Y3RvcihhcHA6IEFwcCwgcGx1Z2luOiBqb3VybmFsaW5nUGx1Z2luKSB7XG5cdFx0c3VwZXIoYXBwLCBwbHVnaW4pO1xuXHRcdHRoaXMucGx1Z2luID0gcGx1Z2luO1xuXHR9XG5cblx0ZGlzcGxheSgpOiB2b2lkIHtcblx0XHRjb25zdCB7Y29udGFpbmVyRWx9ID0gdGhpcztcblxuXHRcdGNvbnRhaW5lckVsLmVtcHR5KCk7XG5cblx0XHRuZXcgU2V0dGluZyhjb250YWluZXJFbClcblx0XHRcdC5zZXROYW1lKCdTZXR0aW5nICMxJylcblx0XHRcdC5zZXREZXNjKCdJdFxcJ3MgYSBzZWNyZXQnKVxuXHRcdFx0LmFkZFRleHQodGV4dCA9PiB0ZXh0XG5cdFx0XHRcdC5zZXRQbGFjZWhvbGRlcignRW50ZXIgeW91ciBzZWNyZXQnKVxuXHRcdFx0XHQuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3Muam91cm5hbGluZ1BsdWdpblNldHRpbmcpXG5cdFx0XHRcdC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcblx0XHRcdFx0XHR0aGlzLnBsdWdpbi5zZXR0aW5ncy5qb3VybmFsaW5nUGx1Z2luU2V0dGluZyA9IHZhbHVlO1xuXHRcdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuXHRcdFx0XHR9KSk7XG5cdH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxzQkFBbUc7QUFRbkcsSUFBTSxtQkFBNkM7QUFBQSxFQUNsRCx5QkFBeUI7QUFDMUI7QUFFQSxJQUFxQixtQkFBckIsY0FBOEMsdUJBQU87QUFBQSxFQUdwRCxNQUFNLFNBQVM7QUFDZCxVQUFNLEtBQUssYUFBYTtBQUd4QixVQUFNLGVBQWUsS0FBSyxjQUFjLGlCQUFpQixZQUFZLE9BQU8sUUFBb0I7QUFDL0YsWUFBTSxLQUFLLG1CQUFtQjtBQUFBLElBQy9CLENBQUM7QUFFRCxpQkFBYSxTQUFTLHdCQUF3QjtBQUc5QyxVQUFNLGtCQUFrQixLQUFLLGlCQUFpQjtBQUM5QyxvQkFBZ0IsUUFBUSxpQkFBaUI7QUFHekMsU0FBSyxXQUFXO0FBQUEsTUFDZixJQUFJO0FBQUEsTUFDSixNQUFNO0FBQUEsTUFDTixVQUFVLE1BQU07QUFDZixhQUFLLG1CQUFtQjtBQUFBLE1BQ3pCO0FBQUEsSUFDRCxDQUFDO0FBRUQsU0FBSyxXQUFXO0FBQUEsTUFDZixJQUFJO0FBQUEsTUFDSixNQUFNO0FBQUEsTUFDTixnQkFBZ0IsQ0FBQyxRQUFnQixTQUF1QjtBQUN2RCxlQUFPLGlCQUFpQix1QkFBdUI7QUFBQSxNQUNoRDtBQUFBLElBQ0QsQ0FBQztBQUVELFNBQUssV0FBVztBQUFBLE1BQ2YsSUFBSTtBQUFBLE1BQ0osTUFBTTtBQUFBLE1BQ04sZUFBZSxDQUFDLGFBQXNCO0FBRXJDLGNBQU0sZUFBZSxLQUFLLElBQUksVUFBVSxvQkFBb0IsNEJBQVk7QUFDeEUsWUFBSSxjQUFjO0FBR2pCLGNBQUksQ0FBQyxVQUFVO0FBQ2QsZ0JBQUksWUFBWSxLQUFLLEdBQUcs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QixNQUFNLFNBQVMsZ0JBQWdCLGVBQWU7QUFBQSxJQUMvRCxDQUFDO0FBR0QsV0FBTyxpQkFBaUIsVUFBVSxPQUFLO0FBQ3RDLHNCQUFnQixNQUFNLFNBQVM7QUFDL0Isc0JBQWdCLE1BQU0sU0FBUyxnQkFBZ0IsZUFBZTtBQUFBLElBQy9ELENBQUM7QUFHRCxpQkFBYSxpQkFBaUIsU0FBUyxNQUFNO0FBQzVDLG1CQUFhLFVBQVUsT0FBTyxpQkFBaUI7QUFDL0MseUJBQW1CLFVBQVUsT0FBTyxrQkFBa0I7QUFBQSxJQUN2RCxDQUFDO0FBR0Qsb0JBQWdCLGlCQUFpQixTQUFTLFlBQVk7QUFDckQsWUFBTSxLQUFLLElBQUksTUFBTSxPQUFPLE1BQU0sZ0JBQWdCLEtBQUs7QUFBQSxJQUN4RCxDQUFDO0FBR0QsYUFBUyxXQUFXQSxjQUE2QjtBQUNoRCxZQUFNLFVBQVUsSUFBSSxLQUFLQSxZQUFxQjtBQUM5QyxZQUFNLG9CQUFnRCxFQUFFLE9BQU8sU0FBUyxNQUFNLFdBQVcsS0FBSyxVQUFVO0FBR3hHLFlBQU0sZ0JBQWdCLElBQUksS0FBSyxlQUFlLFNBQVMsaUJBQWlCLEVBQUUsT0FBTyxPQUFPO0FBR3hGLFlBQU0sTUFBTSxRQUFRLFFBQVE7QUFDNUIsWUFBTSxZQUFZLGFBQWEsR0FBRztBQUdsQyxZQUFNLFFBQVEsY0FBYyxNQUFNLEdBQUc7QUFDckMsYUFBTyxHQUFHLE1BQU0sQ0FBQyxLQUFLLE1BQU0sY0FBYyxNQUFNLENBQUM7QUFBQSxJQUNsRDtBQUdBLGFBQVMsYUFBYSxLQUFxQjtBQUMxQyxVQUFJLE1BQU0sS0FBSyxNQUFNO0FBQUksZUFBTztBQUNoQyxjQUFRLE1BQU0sSUFBSTtBQUFBLFFBQ2pCLEtBQUs7QUFBRyxpQkFBTztBQUFBLFFBQ2YsS0FBSztBQUFHLGlCQUFPO0FBQUEsUUFDZixLQUFLO0FBQUcsaUJBQU87QUFBQSxRQUNmO0FBQVMsaUJBQU87QUFBQSxNQUNqQjtBQUFBLElBQ0Q7QUFBQSxFQUNEO0FBQUE7QUFBQSxFQUlBLFdBQVc7QUFBQSxFQUNYO0FBQUEsRUFHQSxNQUFNLGVBQWU7QUFDcEIsU0FBSyxXQUFXLE9BQU8sT0FBTyxDQUFDLEdBQUcsa0JBQWtCLE1BQU0sS0FBSyxTQUFTLENBQUM7QUFBQSxFQUMxRTtBQUFBLEVBRUEsTUFBTSxlQUFlO0FBQ3BCLFVBQU0sS0FBSyxTQUFTLEtBQUssUUFBUTtBQUFBLEVBQ2xDO0FBQ0Q7QUFFQSxJQUFNLGNBQU4sY0FBMEIsc0JBQU07QUFBQSxFQUMvQixZQUFZLEtBQVU7QUFDckIsVUFBTSxHQUFHO0FBQUEsRUFDVjtBQUFBLEVBRUEsU0FBUztBQUNSLFVBQU0sRUFBQyxVQUFTLElBQUk7QUFDcEIsY0FBVSxRQUFRLE9BQU87QUFBQSxFQUMxQjtBQUFBLEVBRUEsVUFBVTtBQUNULFVBQU0sRUFBQyxVQUFTLElBQUk7QUFDcEIsY0FBVSxNQUFNO0FBQUEsRUFDakI7QUFDRDsiLAogICJuYW1lcyI6IFsiam91cm5hbERhdGUiXQp9Cg==
