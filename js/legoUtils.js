import * as C from './constants.js';

// --- Lego Brick Creator ---
export function createLegoBrick(width = 1, depth = 1, height = C.BRICK_HEIGHT, color = 0xffffff) {
    const group = new THREE.Group();
    const isPlate = Math.abs(height - C.PLATE_HEIGHT) < 0.01;
    const brickMat = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.5,
        metalness: 0.05,
        transparent: color === C.LEGO_TRANSCLEARBLUE,
        opacity: color === C.LEGO_TRANSCLEARBLUE ? 0.6 : 1.0
    });
    const brickGeo = new THREE.BoxGeometry(width * C.BRICK_UNIT_SIZE, height, depth * C.BRICK_UNIT_SIZE);
    const brickMesh = new THREE.Mesh(brickGeo, brickMat);
    brickMesh.castShadow = true;
    brickMesh.receiveShadow = true;
    group.add(brickMesh);

    // Studs
    if (height >= C.PLATE_HEIGHT && color !== C.LEGO_TRANSCLEARBLUE) {
        const studGeo = new THREE.CylinderGeometry(C.STUD_RADIUS, C.STUD_RADIUS, C.STUD_HEIGHT, 16);
        const studMat = brickMat; // Use same material
        const startX = -((width - 1) / 2) * C.BRICK_UNIT_SIZE;
        const startZ = -((depth - 1) / 2) * C.BRICK_UNIT_SIZE;
        const studY = (height / 2) + (C.STUD_HEIGHT / 2);
        for (let i = 0; i < width; i++) {
            for (let j = 0; j < depth; j++) {
                const studMesh = new THREE.Mesh(studGeo, studMat);
                studMesh.position.set(startX + i * C.BRICK_UNIT_SIZE, studY, startZ + j * C.BRICK_UNIT_SIZE);
                studMesh.castShadow = true;
                group.add(studMesh);
            }
        }
    }

    // User Data - Initialize properties
    group.userData.originalRelPos = null; // Will be set in createHouseInstance
    group.userData.finalPosition = new THREE.Vector3();
    group.userData.finalRotation = new THREE.Euler();
    group.userData.templateId = null;
    group.userData.variationIndex = null;
    group.userData.instanceId = null;
    group.userData.buildOrder = 0;

    return group;
}

// --- Road Creation ---
export function createRoadSegment(scene, width, length, position, rotationY = 0) {
    const roadGeo = new THREE.BoxGeometry(width, C.ROAD_HEIGHT, length);
    const roadMat = new THREE.MeshStandardMaterial({ color: C.LEGO_DARK_GREY, roughness: 0.8 });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.position.copy(position);
    roadMesh.position.y = C.ROAD_HEIGHT / 2;
    roadMesh.rotation.y = rotationY;
    roadMesh.receiveShadow = true;
    roadMesh.name = "RoadSegment";
    scene.add(roadMesh);
    return roadMesh; // Return the mesh to be added to the roadSegments array
}

// --- Grid Snapping ---
export function snapToGrid(point) {
    // Snap to the center of the nearest grid unit
    const snappedX = Math.round(point.x / C.BRICK_UNIT_SIZE) * C.BRICK_UNIT_SIZE;
    const snappedZ = Math.round(point.z / C.BRICK_UNIT_SIZE) * C.BRICK_UNIT_SIZE;
    return new THREE.Vector3(snappedX, 0, snappedZ); // Y is always 0 for ground placement
}
