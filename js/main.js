// Import THREE core
// Note: THREE needs to be available globally OR imported if using npm/bundler
// Assuming global availability from script tag for now

// Import other libs assumed global
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'; // Use this if loading THREE as module

// Import app modules
import { appState } from './state.js';
import * as THREE_SETUP from './threeSetup.js';
import * as LEGO_UTILS from './legoUtils.js';
import * as UI from './ui.js';
import * as INTERACTIONS from './interactions.js';
import * as SELECTION from './selection.js'; // Might only need specific functions
import { initMobileUI, initTouchInteractions, isMobileDevice } from './mobile.js';

// --- Initialization ---
function init() {
    console.log("Main: Initializing...");

    // Assign DOM elements to state/UI module
    UI.initializeUIElements(); // Assigns to UI.uiElements
    appState.ui = UI.uiElements; // Optionally link back to central state

    // Setup THREE.js components and store in state
    appState.scene = THREE_SETUP.createScene();
    appState.camera = THREE_SETUP.createCamera();
    appState.renderer = THREE_SETUP.createRenderer(appState.ui.container);
    appState.controls = THREE_SETUP.createControls(appState.camera, appState.renderer);
    THREE_SETUP.addLights(appState.scene);
    appState.groundMesh = THREE_SETUP.createGround(appState.scene);
    appState.raycaster = new THREE.Raycaster();
    const helpers = THREE_SETUP.createHelpers(appState.scene);
    appState.selectionBoxHelper = helpers.selectionBoxHelper;
    appState.moveGhostMesh = helpers.moveGhostMesh;

    // Create initial roads and store meshes in state
    appState.roadSegments.push(LEGO_UTILS.createRoadSegment(appState.scene, 12, 300, new THREE.Vector3(0, 0, 0)));
    appState.roadSegments.push(LEGO_UTILS.createRoadSegment(appState.scene, 200, 10, new THREE.Vector3(0, 0, -60)));
    appState.roadSegments.push(LEGO_UTILS.createRoadSegment(appState.scene, 200, 10, new THREE.Vector3(0, 0, 60)));

    // Setup UI
    UI.createTemplateUI();
    UI.updatePlacedHousesUI();
    UI.updateActionButtons();
    UI.updateStatusText('Select a template or click a building/list item.');

    // Initialize mobile-specific UI and interactions
    initMobileUI();
    if (isMobileDevice()) {
        initTouchInteractions();
        // Adjust camera for mobile
        appState.camera.position.set(0, 200, 200); // Higher position for better overview on mobile
        appState.controls.update();
    }

    // Setup Event Listeners
    window.addEventListener('resize', onWindowResize, false);
    appState.ui.container.addEventListener('pointerdown', INTERACTIONS.handlePointerDown, false);
    appState.ui.container.addEventListener('pointermove', INTERACTIONS.handlePointerMove, false);
    window.addEventListener('pointerup', INTERACTIONS.handlePointerUp, false); // Use window for up
    appState.ui.cancelBtn.addEventListener('click', INTERACTIONS.handleCancelClick, false);
    appState.ui.rotateSelectedBtn.addEventListener('click', INTERACTIONS.handleRotateClick, false);
    appState.ui.unbuildSelectedBtn.addEventListener('click', INTERACTIONS.handleUnbuildClick, false);

    console.log("Main: Initialization Complete. Starting animation loop.");
    animate(); // Start the animation loop
}

// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);
    appState.controls.update(); // Update controls if damping is enabled
    appState.renderer.render(appState.scene, appState.camera);
}

// --- Resize Handler ---
function onWindowResize() {
    THREE_SETUP.handleWindowResize(appState.camera, appState.renderer);
}

// --- Start Application ---
init();
