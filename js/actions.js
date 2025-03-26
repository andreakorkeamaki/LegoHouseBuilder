import { appState } from './state.js';
import { buildingTemplates } from './templates.js';
import { createHouseInstanceData } from './instanceUtils.js';
import { isPositionValid } from './collisions.js';
import { animateBuild, animateUnbuild, animateMove, animateRotate } from './animations.js';
import { updateActionButtons, updatePlacedHousesUI, updateStatusText } from './ui.js';
import { cancelPlacementSelection, deselectPlacedHouse, selectPlacedHouseById, highlightSelectedHouse } from './selection.js';

// --- High-Level Actions ---

export function placeBuildingAction(templateId, variationIndex, placementPosition) {
    console.log("Action: Placing building...");
    const instanceId = globalThis.uuid.v4(); // Use uuid from global scope (loaded via script tag)
    const newInstance = createHouseInstanceData(templateId, variationIndex, instanceId, placementPosition);

    // Add to state
    appState.placedHouses[instanceId] = newInstance;

    // Update UI immediately (shows 'Animating...')
    updatePlacedHousesUI();
    updateActionButtons();
    updateStatusText(`Building ${buildingTemplates[templateId].name}...`);

    // Start animation
    animateBuild(instanceId, () => {
        // Animation complete callback
        updatePlacedHousesUI(); // Update status to 'Built'
        updateActionButtons();
        if (!appState.isAnyAnimationRunning()) {
            updateStatusText(`Ready. Select template or click building/list item.`);
        }
    });

    // Clear template selection state
    cancelPlacementSelection();
}

export function unbuildBuildingAction(instanceId) {
    if (!instanceId || !appState.placedHouses[instanceId] || appState.placedHouses[instanceId].isAnimating) {
        console.warn(`Action: Cannot unbuild ${instanceId} (invalid state)`);
        return;
    }
    console.log(`Action: Unbuilding ${instanceId}`);

    const instance = appState.placedHouses[instanceId];
    const template = buildingTemplates[instance.templateId];

    // Deselect if it was selected
    if (appState.selectedInstanceId === instanceId) {
        deselectPlacedHouse(); // This updates UI/buttons
    } else {
         updateActionButtons(); // Still update buttons in case another was selected
    }

    highlightSelectedHouse(false); // Ensure highlight is off
    updateStatusText(`Unbuilding ${template.name}...`);
    updatePlacedHousesUI(); // Show 'Animating...' status

    // Start animation
    animateUnbuild(instanceId, () => {
         // Animation complete callback
         delete appState.placedHouses[instanceId]; // Remove from state AFTER animation
         console.log(`Action: Instance ${instanceId} removed from state.`);
         updatePlacedHousesUI(); // Remove from list
         updateActionButtons();
         if (!appState.isAnyAnimationRunning()) {
            updateStatusText(`Ready. Select template or click building/list item.`);
         }
    });
}

export function moveBuildingAction(instanceId, newPosition) {
     if (!instanceId || !appState.placedHouses[instanceId] || appState.placedHouses[instanceId].isAnimating) {
        console.warn(`Action: Cannot move ${instanceId} (invalid state)`);
        return;
    }
    console.log(`Action: Moving ${instanceId} to ${newPosition.toArray().join(',')}`);

    const instance = appState.placedHouses[instanceId];
    const template = buildingTemplates[instance.templateId];
    const variation = template.variations[instance.variationIndex];

    // Update UI immediately
    updateStatusText(`Moving ${template.name}...`);
    updatePlacedHousesUI(); // Show 'Animating...'
    updateActionButtons(); // Disable buttons

    // Start animation
    animateMove(instanceId, newPosition, () => {
        // Animation complete callback
        updatePlacedHousesUI(); // Update status
        updateActionButtons(); // Re-enable buttons

        // Update status and highlight ONLY if it's still the selected one
        if(appState.selectedInstanceId === instanceId) {
            highlightSelectedHouse(true); // Update highlight box
            updateStatusText(`Selected ${template.name} (${variation.name}). Drag to move, Rotate, or Unbuild.`);
        } else if (!appState.isAnyAnimationRunning()) {
             // Reset status if nothing else is animating
             updateStatusText(`Ready. Select template or click building/list item.`);
        }
    });
}

export function rotateBuildingAction(instanceId) {
    if (!instanceId || !appState.placedHouses[instanceId] || appState.placedHouses[instanceId].isAnimating) {
        console.warn(`Action: Cannot rotate ${instanceId} (invalid state)`);
        return;
    }
    console.log(`Action: Rotating ${instanceId}`);

    const instance = appState.placedHouses[instanceId];
    const template = buildingTemplates[instance.templateId];
    const variation = template.variations[instance.variationIndex];
    const currentRotationY = instance.rotationY;
    const newRotationY = (currentRotationY + C.ROTATION_INCREMENT) % (Math.PI * 2);

    // Validate position with NEW rotation
    if (!isPositionValid(instance.position, newRotationY, instanceId, instance.templateId, instance.variationIndex)) {
        console.log(`Action: Cannot rotate ${instanceId}, collision detected.`);
        updateStatusText("Cannot rotate: Space blocked.");
        // Optional visual feedback (flash highlight?) handled maybe in interactions
        return;
    }

    // Update UI immediately
    updateStatusText(`Rotating ${template.name}...`);
    updatePlacedHousesUI(); // Show 'Animating...'
    updateActionButtons(); // Disable buttons

    // Start animation
    animateRotate(instanceId, newRotationY, () => {
         // Animation complete callback
        updatePlacedHousesUI(); // Update status
        updateActionButtons(); // Re-enable buttons

        // Update status and highlight ONLY if it's still the selected one
        if(appState.selectedInstanceId === instanceId) {
            highlightSelectedHouse(true); // Update highlight box for new rotation/AABB
            updateStatusText(`Selected ${template.name} (${variation.name}). Drag to move, Rotate, or Unbuild.`);
        } else if (!appState.isAnyAnimationRunning()) {
             updateStatusText(`Ready. Select template or click building/list item.`);
        }
    });
}
