// Centralized state management

export const appState = {
    // THREE.js core objects (initialized in main.js)
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    raycaster: null,
    groundMesh: null,
    selectionBoxHelper: null,
    moveGhostMesh: null,

    // Application Data
    placedHouses: {}, // Store instances: { instanceId: instanceData }
    roadSegments: [], // Store road meshes

    // UI / Interaction State
    selectedTemplateInfo: null, // { id: templateId, index: variationIndex }
    selectedInstanceId: null,   // instanceId of the selected house
    isDragging: false,
    dragInstanceId: null,
    mouse: new THREE.Vector2(), // Normalized device coordinates
    
    // Mobile-specific state
    lastMoveTime: null,         // For throttling move events on mobile
    lastTapTime: null,          // For detecting double taps
    lastTapId: null,            // For detecting double taps on the same object
    isMobileView: false,        // Set by mobile detection

    // DOM Elements (initialized in main.js)
    ui: {
        container: null,
        templateSelectorDiv: null,
        placedHousesListDiv: null,
        statusElement: null,
        cancelBtn: null,
        rotateSelectedBtn: null,
        unbuildSelectedBtn: null,
    },

    // --- State Checkers ---
    isAnyAnimationRunning() {
        return Object.values(this.placedHouses).some(h => h.isAnimating);
    }
};

// --- State Modifiers ---
// (It's often better practice to have specific functions update state
// rather than allowing direct modification from anywhere, but for simplicity
// now, we'll allow direct modification via the imported appState object)

// Example of modifier functions if needed later:
/*
export function setSelectedInstance(instanceId) {
    // potentially handle deselection of previous here
    appState.selectedInstanceId = instanceId;
    // potentially trigger UI updates here
}

export function addPlacedHouse(instanceId, houseData) {
    appState.placedHouses[instanceId] = houseData;
    // potentially trigger UI updates here
}
*/
