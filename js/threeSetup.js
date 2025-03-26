// Functions for setting up the core THREE.js components

export function createScene() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 100, 350);
    return scene;
}

export function createCamera() {
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 70, 100);
    return camera;
}

export function createRenderer(container) {
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    return renderer;
}

export function createControls(camera, renderer) {
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 2, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // Prevent looking straight down or below ground
    controls.minDistance = 15;
    controls.maxDistance = 300;
    return controls;
}

export function addLights(scene) {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(70, 90, 80);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 4096;
    directionalLight.shadow.mapSize.height = 4096;
    directionalLight.shadow.camera.near = 1;
    directionalLight.shadow.camera.far = 350;
    const shadowCamSize = 150;
    directionalLight.shadow.camera.left = -shadowCamSize;
    directionalLight.shadow.camera.right = shadowCamSize;
    directionalLight.shadow.camera.top = shadowCamSize;
    directionalLight.shadow.camera.bottom = -shadowCamSize;
    directionalLight.shadow.bias = -0.002;
    scene.add(directionalLight);
    // scene.add( new THREE.CameraHelper( directionalLight.shadow.camera ) ); // DEBUG
}

export function createGround(scene) {
    const groundGeo = new THREE.PlaneGeometry(600, 600);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x78a567, roughness: 1.0 });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = 0;
    groundMesh.receiveShadow = true;
    groundMesh.name = "Ground";
    scene.add(groundMesh);
    return groundMesh;
}

export function createHelpers(scene) {
    const selectionBoxHelper = new THREE.Box3Helper(new THREE.Box3(), 0xffff00);
    selectionBoxHelper.visible = false;
    scene.add(selectionBoxHelper);

    const ghostGeo = new THREE.BoxGeometry(1, 1, 1); // Size set dynamically
    const ghostMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, opacity: 0.4, transparent: true, depthTest: false });
    const moveGhostMesh = new THREE.Mesh(ghostGeo, ghostMat);
    moveGhostMesh.visible = false;
    scene.add(moveGhostMesh);

    return { selectionBoxHelper, moveGhostMesh };
}

export function handleWindowResize(camera, renderer) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
