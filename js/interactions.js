import { appState } from './state.js';
import { buildingTemplates } from './templates.js';
import { isPositionValid } from './collisions.js';
import { snapToGrid } from './legoUtils.js';
import { selectTemplateByItemKey, cancelPlacementSelection, selectPlacedHouseById, deselectPlacedHouse } from './selection.js';
import { placeBuildingAction, moveBuildingAction, rotateBuildingAction, unbuildBuildingAction } from './actions.js';
import { updateStatusText, setContainerCursor, uiElements } from './ui.js';
import * as C from './constants.js'; // Import constants if needed here
import { isMobileDevice } from './mobile.js';


// --- Event Handlers ---

export function handlePointerDown(event) {
    if (appState.isAnyAnimationRunning()) return; // Prevent interaction during animations

    // For mobile devices, check if the click is on the UI panel and if so, don't process 3D interactions
    if (isMobileDevice() && isClickOnUIPanel(event)) {
        return;
    }

    updateMouseCoords(event); // Update appState.mouse
    appState.raycaster.setFromCamera(appState.mouse, appState.camera);

    // 1. Check for clicks on existing built houses
    let interactableBricks = [];
    Object.values(appState.placedHouses).forEach(house => {
        if (house.isBuilt && !house.isAnimating) interactableBricks = interactableBricks.concat(house.bricks);
    });

    if (interactableBricks.length > 0) {
        const intersects = appState.raycaster.intersectObjects(interactableBricks, true);
        if (intersects.length > 0) {
            let clickedBrick = intersects[0].object;
            while (clickedBrick && !clickedBrick.userData.instanceId) {
                clickedBrick = clickedBrick.parent;
            }

            if (clickedBrick && clickedBrick.userData.instanceId) {
                const instanceId = clickedBrick.userData.instanceId;
                console.log(`Interaction: Pointer Down hit instance ${instanceId}`);

                if (appState.selectedInstanceId === instanceId) { // Start dragging
                    appState.isDragging = true;
                    appState.dragInstanceId = instanceId;
                    appState.controls.enabled = false;
                    setContainerCursor('moving');
                    updateStatusText(`Moving ${buildingTemplates[appState.placedHouses[instanceId].templateId].name}...`);
                    console.log(`Interaction: Starting drag for ${instanceId}`);
                } else { // Select the clicked house
                    selectPlacedHouseById(instanceId);
                }
                return; // Prevent ground click logic
            }
        }
    }

    // 2. Check for placing a new house
    if (appState.selectedTemplateInfo) {
        const intersects = appState.raycaster.intersectObject(appState.groundMesh);
        if (intersects.length > 0 && intersects[0].object === appState.groundMesh) {
            const point = intersects[0].point;
            const { id: templateId, index: variationIndex } = appState.selectedTemplateInfo;
            const placementPosition = snapToGrid(point);

            if (isPositionValid(placementPosition, 0, null, templateId, variationIndex)) {
                // Trigger the placement action
                placeBuildingAction(templateId, variationIndex, placementPosition);
            } else {
                console.log("Interaction: Invalid placement location (collision).");
                updateStatusText("Cannot place here (overlaps road or another building).");
            }
        } else {
            updateStatusText("Click on the green ground to place.");
        }
    // 3. Clicked on empty space/road without a template selected
    } else {
        console.log("Interaction: Click missed interactable objects and no template selected.");
        deselectPlacedHouse();
        updateStatusText('Select a template or click a building/list item.');
    }
}

export function handlePointerMove(event) {
    // For mobile devices, add a small delay to prevent jittery movement
    if (isMobileDevice() && appState.isDragging && !appState.lastMoveTime) {
        appState.lastMoveTime = Date.now();
    }
    
    if (isMobileDevice() && appState.isDragging && Date.now() - appState.lastMoveTime < 16) {
        return; // Throttle move events on mobile
    }
    
    appState.lastMoveTime = Date.now();
    
    if (!appState.isDragging || !appState.dragInstanceId) return; // Only if dragging

    updateMouseCoords(event);
    appState.raycaster.setFromCamera(appState.mouse, appState.camera);
    const intersects = appState.raycaster.intersectObject(appState.groundMesh);

    if (intersects.length > 0 && appState.moveGhostMesh) {
        const point = intersects[0].point;
        const instance = appState.placedHouses[appState.dragInstanceId];
        const targetPosition = snapToGrid(point);
        const currentRotationY = instance.rotationY;

        const isValid = isPositionValid(targetPosition, currentRotationY, appState.dragInstanceId, instance.templateId, instance.variationIndex);

        // Update ghost appearance
        const variation = buildingTemplates[instance.templateId].variations[instance.variationIndex];
        const size = variation.basePlateSize;
        const height = (variation.dimensions.height * C.BRICK_HEIGHT) + C.PLATE_HEIGHT;
        appState.moveGhostMesh.scale.set(size.width * C.BRICK_UNIT_SIZE, height, size.depth * C.BRICK_UNIT_SIZE);
        appState.moveGhostMesh.position.copy(targetPosition);
        appState.moveGhostMesh.position.y = height / 2;
        appState.moveGhostMesh.rotation.y = currentRotationY;
        appState.moveGhostMesh.material.color.set(isValid ? 0x00ff00 : 0xff0000);
        appState.moveGhostMesh.visible = true;
    } else if (appState.moveGhostMesh) {
        // Hide ghost if mouse is off the ground
        appState.moveGhostMesh.visible = false;
    }
}

export function handlePointerUp(event) {
    // Reset the move time tracker
    appState.lastMoveTime = null;
    
    if (appState.isDragging && appState.dragInstanceId) {
        console.log(`Interaction: Pointer Up during drag for ${appState.dragInstanceId}`);
        const instance = appState.placedHouses[appState.dragInstanceId];
        const finalTargetPosition = appState.moveGhostMesh.position.clone(); // Get ghost pos
        finalTargetPosition.y = 0; // Ensure ground level

        // Check validity one last time
        const isValid = isPositionValid(finalTargetPosition, instance.rotationY, appState.dragInstanceId, instance.templateId, instance.variationIndex);

        // --- Clean up drag state ---
        if (appState.moveGhostMesh) appState.moveGhostMesh.visible = false;
        appState.isDragging = false;
        appState.controls.enabled = true;
        setContainerCursor(null); // Reset cursor

        // --- Perform move if valid and position actually changed ---
        if (isValid && !finalTargetPosition.equals(instance.position)) {
            // Trigger the move action
            moveBuildingAction(appState.dragInstanceId, finalTargetPosition);
        } else {
            // Invalid move OR no position change
            const template = buildingTemplates[instance.templateId];
            const variation = template.variations[instance.variationIndex];
            console.log(`Interaction: Invalid/No move for ${appState.dragInstanceId}, reverting/keeping selection.`);
            updateStatusText(isValid
                ? `Selected ${template.name} (${variation.name}). Drag to move, Rotate, or Unbuild.` // No move occurred
                : `Move cancelled (invalid location). ${template.name} (${variation.name}) selected.`); // Invalid move
            // Ensure the instance remains selected visually
            selectPlacedHouseById(appState.dragInstanceId); // Re-select to update UI/highlight correctly
        }

         appState.dragInstanceId = null; // Clear drag target AFTER triggering action or reverting

    } else if (appState.isDragging) { // Edge case cleanup
        console.warn("Interaction: PointerUp inconsistency: isDragging=true but no dragInstanceId.");
        if (appState.moveGhostMesh) appState.moveGhostMesh.visible = false;
        appState.isDragging = false;
        appState.dragInstanceId = null;
        appState.controls.enabled = true;
        setContainerCursor(null);
    }
}

export function handleCancelClick() {
    console.log("Interaction: Cancel button clicked");
    if (appState.selectedTemplateInfo) {
        cancelPlacementSelection();
    }
    // If implementing cancel during move/rotate later, add here
}

export function handleRotateClick() {
     console.log("Interaction: Rotate button clicked");
    if (appState.selectedInstanceId) {
        rotateBuildingAction(appState.selectedInstanceId);
    }
}

export function handleUnbuildClick() {
     console.log("Interaction: Unbuild button clicked");
    if (appState.selectedInstanceId) {
        unbuildBuildingAction(appState.selectedInstanceId);
    }
}


// --- Helpers ---
function updateMouseCoords(event) {
    const rect = uiElements.container.getBoundingClientRect(); // Use stored element
    appState.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    appState.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

// Check if a click event is on the UI panel
function isClickOnUIPanel(event) {
    const infoPanel = document.getElementById('info');
    const rect = infoPanel.getBoundingClientRect();
    
    return (
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom
    );
}

// Add a double tap handler for mobile devices
export function handleDoubleTap(instanceId) {
    if (appState.selectedInstanceId === instanceId) {
        // Double tap on selected building - rotate it
        rotateBuildingAction(instanceId);
    }
}
