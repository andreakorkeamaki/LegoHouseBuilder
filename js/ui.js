import { buildingTemplates } from './templates.js';
import { appState } from './state.js';
import { selectPlacedHouseById } from './selection.js';
import { selectTemplateByItemKey } from './selection.js'; // Corrected import name

// --- UI Element References ---
// These are assigned in main.js after the DOM is ready
export const uiElements = {
    templateSelectorDiv: null,
    placedHousesListDiv: null,
    statusElement: null,
    cancelBtn: null,
    rotateSelectedBtn: null,
    unbuildSelectedBtn: null,
    container: null,
};

// Assign elements (call this from main.js)
export function initializeUIElements() {
    uiElements.templateSelectorDiv = document.getElementById('templateSelector');
    uiElements.placedHousesListDiv = document.getElementById('placedHousesList');
    uiElements.statusElement = document.getElementById('status');
    uiElements.cancelBtn = document.getElementById('cancelBtn');
    uiElements.rotateSelectedBtn = document.getElementById('rotateSelectedBtn');
    uiElements.unbuildSelectedBtn = document.getElementById('unbuildSelectedBtn');
    uiElements.container = document.getElementById('container'); // Needed for cursor style
}


// --- UI Creation & Updates ---
export function createTemplateUI() {
    if (!uiElements.templateSelectorDiv) return;
    uiElements.templateSelectorDiv.innerHTML = '';
    for (const templateId in buildingTemplates) {
        const template = buildingTemplates[templateId];
        template.variations.forEach((variation, index) => {
            const div = document.createElement('div');
            div.classList.add('template-item');
            const itemKey = `${templateId}:${index}`;
            div.dataset.itemKey = itemKey;
            const dims = variation.dimensions;
            div.innerHTML = `${template.name} (${variation.name})<span>${dims.width}w x ${dims.depth}d x ${dims.height}h</span>`;
            // Use selection handler from selection.js
            div.addEventListener('click', () => selectTemplateByItemKey(itemKey));
            uiElements.templateSelectorDiv.appendChild(div);
        });
    }
}

export function updatePlacedHousesUI() {
    if (!uiElements.placedHousesListDiv) return;
    uiElements.placedHousesListDiv.innerHTML = '';
    const sortedIds = Object.keys(appState.placedHouses).sort();
    if (sortedIds.length === 0) {
        uiElements.placedHousesListDiv.innerHTML = '<p style="font-style: italic; color: #888; text-align: center;">No buildings placed yet.</p>';
        return;
    }
    sortedIds.forEach(instanceId => {
        const instance = appState.placedHouses[instanceId];
        if (!instance) return;

        const template = buildingTemplates[instance.templateId];
        const variation = template.variations[instance.variationIndex];
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('placed-item');
        itemDiv.dataset.instanceId = instanceId;
        itemDiv.classList.toggle('selected', instance.isSelected);

        let statusText = instance.isAnimating ? 'Animating...' : (instance.isBuilt ? 'Built' : 'Unbuilt');

        itemDiv.innerHTML = `
            <div>
                <span class="placed-name">${template.name} (${variation.name})</span>
                <span class="placed-id">(${instanceId.substring(0,4)}..)</span>
            </div>
            <span class="status-indicator">${statusText}</span>
        `;
        itemDiv.addEventListener('click', () => {
            if (instance.isBuilt && !instance.isAnimating) {
                selectPlacedHouseById(instanceId); // Use selection handler
            } else {
                console.log(`UI: Cannot select instance ${instanceId} (built: ${instance.isBuilt}, animating: ${instance.isAnimating})`);
            }
        });
        uiElements.placedHousesListDiv.appendChild(itemDiv);
    });
}

export function updateActionButtons() {
    if (!uiElements.cancelBtn) return; // Check if elements are ready

    uiElements.cancelBtn.style.display = appState.selectedTemplateInfo ? 'block' : 'none';

    const isInstanceSelected = appState.selectedInstanceId && appState.placedHouses[appState.selectedInstanceId];
    const canInteract = isInstanceSelected && appState.placedHouses[appState.selectedInstanceId].isBuilt && !appState.placedHouses[appState.selectedInstanceId].isAnimating;

    uiElements.rotateSelectedBtn.style.display = isInstanceSelected ? 'block' : 'none';
    uiElements.rotateSelectedBtn.disabled = !canInteract;

    uiElements.unbuildSelectedBtn.style.display = isInstanceSelected ? 'block' : 'none';
    uiElements.unbuildSelectedBtn.disabled = !canInteract;
}

export function updateStatusText(text) {
    if (uiElements.statusElement) {
        uiElements.statusElement.textContent = text;
    }
}

export function setContainerCursor(cursorStyle) {
     if (uiElements.container) {
        // Remove previous cursor classes
        uiElements.container.classList.remove('placing', 'moving');
        if (cursorStyle) {
            uiElements.container.classList.add(cursorStyle);
        }
     }
}
