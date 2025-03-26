import { appState } from './state.js';
import { buildingTemplates } from './templates.js';
import { updateActionButtons, updatePlacedHousesUI, updateStatusText, setContainerCursor, uiElements } from './ui.js';
import { getRotatedBoundingBox } from './instanceUtils.js';

// --- Selection Logic ---

export function selectTemplateByItemKey(itemKey) {
    if (appState.isAnyAnimationRunning()) return;
    deselectPlacedHouse(); // Deselect any house first

    const [templateId, variationIndexStr] = itemKey.split(':');
    const variationIndex = parseInt(variationIndexStr, 10);
    appState.selectedTemplateInfo = { id: templateId, index: variationIndex };
    console.log(`Selection: Selected template: ${templateId}, Variation: ${variationIndex}`);

    // Highlight in UI
    document.querySelectorAll('.template-item').forEach(el => {
        el.classList.toggle('selected', el.dataset.itemKey === itemKey);
    });

    const template = buildingTemplates[templateId];
    const variation = template.variations[variationIndex];
    const dims = variation.dimensions;
    setContainerCursor('placing');
    updateStatusText(`Click ground to place ${template.name} (${variation.name}) - ${dims.width}x${dims.depth}.`);
    updateActionButtons();
}

export function cancelPlacementSelection() {
    appState.selectedTemplateInfo = null;
    console.log('Selection: Placement cancelled.');
    document.querySelectorAll('.template-item').forEach(el => {
        el.classList.remove('selected');
    });
    setContainerCursor(null); // Reset cursor
    updateStatusText('Select a template or click a building/list item.');
    updateActionButtons();
}

export function selectPlacedHouseById(instanceId) {
    const instance = appState.placedHouses[instanceId];
    if (!instance || !instance.isBuilt || instance.isAnimating) {
        console.log(`Selection: Cannot select instance ${instanceId} (doesn't exist, not built, or animating)`);
        return;
    }
    if (appState.selectedTemplateInfo) cancelPlacementSelection(); // Cancel template placement if active
    if (appState.selectedInstanceId === instanceId) return; // Already selected

    console.log(`Selection: Selecting instance ${instanceId}`);
    deselectPlacedHouse(); // Deselect previous

    appState.selectedInstanceId = instanceId;
    instance.isSelected = true;

    highlightSelectedHouse(true); // Update 3D highlight
    updatePlacedHousesUI(); // Update list highlighting
    updateActionButtons(); // Show/enable Rotate/Unbuild

    const template = buildingTemplates[instance.templateId];
    const variation = template.variations[instance.variationIndex];
    updateStatusText(`Selected ${template.name} (${variation.name}). Drag to move, Rotate, or Unbuild.`);
}

export function deselectPlacedHouse() {
    if (appState.selectedInstanceId && appState.placedHouses[appState.selectedInstanceId]) {
        console.log(`Selection: Deselecting instance ${appState.selectedInstanceId}`);
        appState.placedHouses[appState.selectedInstanceId].isSelected = false;
    }
    if (appState.selectedInstanceId) { // Only update UI etc. if something *was* selected
        appState.selectedInstanceId = null;
        highlightSelectedHouse(false);
        updatePlacedHousesUI();
        updateActionButtons();
        // Don't reset status text here, might be set by another action
    }
     appState.selectedInstanceId = null; // Ensure it's always nullified
}

// --- Highlight Helper ---
export function highlightSelectedHouse(show) {
    if (show && appState.selectedInstanceId && appState.placedHouses[appState.selectedInstanceId]) {
        const instance = appState.placedHouses[appState.selectedInstanceId];
        const box = getRotatedBoundingBox(instance.position, instance.templateId, instance.variationIndex, instance.rotationY, true);
        if (appState.selectionBoxHelper && !box.isEmpty()) {
            appState.selectionBoxHelper.box.copy(box);
            appState.selectionBoxHelper.visible = true;
        } else if (appState.selectionBoxHelper) {
            appState.selectionBoxHelper.visible = false;
        }
    } else if (appState.selectionBoxHelper) {
        appState.selectionBoxHelper.visible = false;
    }
}
