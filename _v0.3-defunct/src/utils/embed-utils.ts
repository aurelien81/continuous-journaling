/**
 * Utility functions for handling embedded content while editing
 */

interface EmbedPosition {
    index: number;
    markdown: string;
    type: 'image' | 'obsidian-embed' | 'iframe' | 'other';
    placeholder: string;
}

/**
 * Detects embeds in markdown content
 * Returns positions and types of embeds found
 */
export function detectEmbeds(content: string): EmbedPosition[] {
    const embedPositions: EmbedPosition[] = [];
    const lines = content.split('\n');
    
    // Regular expressions for common embed types
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    const obsidianEmbedRegex = /!\[\[([^\]]+)\]\]/g;
    const iframeRegex = /<iframe[^>]*src="([^"]*)"[^>]*>.*?<\/iframe>/g;
    
    lines.forEach((line, lineIndex) => {
        // Check for Markdown images: ![alt](url)
        let match;
        while ((match = imageRegex.exec(line)) !== null) {
            embedPositions.push({
                index: getCharacterIndex(lines, lineIndex, match.index),
                markdown: match[0],
                type: 'image',
                placeholder: `[IMAGE_PLACEHOLDER_${embedPositions.length}]`
            });
        }
        
        // Reset regex lastIndex
        imageRegex.lastIndex = 0;
        
        // Check for Obsidian embeds: ![[note]]
        while ((match = obsidianEmbedRegex.exec(line)) !== null) {
            embedPositions.push({
                index: getCharacterIndex(lines, lineIndex, match.index),
                markdown: match[0],
                type: 'obsidian-embed',
                placeholder: `[OBSIDIAN_EMBED_PLACEHOLDER_${embedPositions.length}]`
            });
        }
        
        // Reset regex lastIndex
        obsidianEmbedRegex.lastIndex = 0;
        
        // Check for iframes: <iframe src="..."></iframe>
        while ((match = iframeRegex.exec(line)) !== null) {
            embedPositions.push({
                index: getCharacterIndex(lines, lineIndex, match.index),
                markdown: match[0],
                type: 'iframe',
                placeholder: `[IFRAME_PLACEHOLDER_${embedPositions.length}]`
            });
        }
        
        // Reset regex lastIndex
        iframeRegex.lastIndex = 0;
    });
    
    // Sort embeds by their position in the document
    return embedPositions.sort((a, b) => a.index - b.index);
}

/**
 * Calculates the absolute character index in the full content
 * based on line index and character position within the line
 */
function getCharacterIndex(lines: string[], lineIndex: number, charIndex: number): number {
    let absoluteIndex = 0;
    
    // Add lengths of all previous lines plus newline characters
    for (let i = 0; i < lineIndex; i++) {
        absoluteIndex += lines[i].length + 1; // +1 for the newline character
    }
    
    // Add position within the current line
    return absoluteIndex + charIndex;
}

/**
 * Replaces embeds with placeholders in the content
 * Returns the modified content and a map of placeholders to original markdown
 */
export function replaceEmbedsWithPlaceholders(content: string): { 
    modifiedContent: string, 
    placeholderMap: Map<string, string> 
} {
    const embeds = detectEmbeds(content);
    const placeholderMap = new Map<string, string>();
    let modifiedContent = content;
    
    // Process embeds in reverse order to avoid index shifting
    for (let i = embeds.length - 1; i >= 0; i--) {
        const embed = embeds[i];
        placeholderMap.set(embed.placeholder, embed.markdown);
        
        // Replace the embed with its placeholder
        modifiedContent = 
            modifiedContent.substring(0, embed.index) + 
            embed.placeholder + 
            modifiedContent.substring(embed.index + embed.markdown.length);
    }
    
    return { modifiedContent, placeholderMap };
}

/**
 * Restores embeds from placeholders in the content
 */
export function restoreEmbedsFromPlaceholders(
    content: string, 
    placeholderMap: Map<string, string>
): string {
    let restoredContent = content;
    
    // Replace each placeholder with the original markdown
    placeholderMap.forEach((markdown, placeholder) => {
        restoredContent = restoredContent.replace(placeholder, markdown);
    });
    
    return restoredContent;
}

/**
 * Extracts elements that represent embeds from the rendered content
 */
export function extractEmbeddedElements(element: HTMLElement): HTMLElement[] {
    // Find all elements that represent embeds
    const embeddedElements: HTMLElement[] = [];
    
    // Images
    element.querySelectorAll('img').forEach(img => {
        embeddedElements.push(img as HTMLElement);
    });
    
    // iframes (videos, etc.)
    element.querySelectorAll('iframe').forEach(iframe => {
        embeddedElements.push(iframe as HTMLElement);
    });
    
    // Obsidian embeds
    element.querySelectorAll('.internal-embed, .external-embed').forEach(embed => {
        embeddedElements.push(embed as HTMLElement);
    });
    
    return embeddedElements;
}

/**
 * Creates visual placeholder elements for embeds during editing
 */
export function createEmbedPlaceholders(
    container: HTMLElement, 
    embeds: HTMLElement[]
): Map<string, HTMLElement> {
    const placeholderElements = new Map<string, HTMLElement>();
    
    embeds.forEach((embed, index) => {
        // Create placeholder container
        const placeholder = container.createDiv({ cls: 'embed-placeholder' });
        
        // Determine the type of embed
        let embedType = 'Content';
        if (embed.tagName === 'IMG') embedType = 'Image';
        else if (embed.tagName === 'IFRAME') embedType = 'Video/iframe';
        else if (embed.classList.contains('internal-embed')) embedType = 'Embedded note';
        else if (embed.classList.contains('external-embed')) embedType = 'External content';
        
        // Add a label
        placeholder.createEl('span', { 
            cls: 'embed-placeholder-label',
            text: `Embedded ${embedType} (preserved during editing)`
        });
        
        // Store the placeholder with a key
        const placeholderKey = `embed-placeholder-${index}`;
        placeholderElements.set(placeholderKey, placeholder);
    });
    
    return placeholderElements;
}