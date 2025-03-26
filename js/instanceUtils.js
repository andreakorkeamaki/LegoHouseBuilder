import * as C from './constants.js';
import { buildingTemplates } from './templates.js';
import { createLegoBrick } from './legoUtils.js';

// --- Instance Creation ---
export function createHouseInstanceData(templateId, variationIndex, instanceId, placementPosition) {
    const template = buildingTemplates[templateId];
    const variation = template.variations[variationIndex];
    const instanceBricks = [];
    const baseWidth = variation.basePlateSize.width;
    const baseDepth = variation.basePlateSize.depth;
    const grassY = C.PLATE_HEIGHT / 2;

    // Helper to create a brick and store its original relative pos
    const createAndAddBrick = (w, d, h, lx, ly, lz, color, isFenceOrGrass = false) => {
        const brick = createLegoBrick(w, d, h, color); // Use the utility function
        brick.userData.templateId = templateId;
        brick.userData.variationIndex = variationIndex;
        brick.userData.instanceId = instanceId;
        brick.userData.originalRelPos = { x: lx, y: ly, z: lz };

        const finalY = ly + (isFenceOrGrass ? 0 : C.PLATE_HEIGHT); // Building sits on grass plate

        // Initial final state (rotation 0)
        brick.userData.finalPosition.set(placementPosition.x + lx, finalY, placementPosition.z + lz);
        brick.userData.finalRotation.set(0, 0, 0);
        brick.userData.buildOrder = finalY;

        // Animation start state
        const randomOffsetX = (Math.random() - 0.5) * 15;
        const randomOffsetZ = (Math.random() - 0.5) * 15;
        brick.position.set(
            brick.userData.finalPosition.x + randomOffsetX,
            finalY - 30 - Math.random() * 20,
            brick.userData.finalPosition.z + randomOffsetZ
        );
        brick.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2);
        brick.scale.set(0.01, 0.01, 0.01);
        brick.visible = false;

        instanceBricks.push(brick);
    };

    // Grass Plate
    createAndAddBrick(baseWidth, baseDepth, C.PLATE_HEIGHT, 0, grassY, 0, C.LEGO_DARK_GREEN, true);

    // Building Elements
    variation.elements.forEach(([w, d, h, lx, ly, lz, color]) => {
        createAndAddBrick(w, d, h, lx, ly, lz, color);
    });

    // Fence Elements
    const fenceHeight = C.BRICK_HEIGHT;
    const fenceRelY = fenceHeight / 2 + C.PLATE_HEIGHT;
    const halfW_Studs = baseWidth / 2;
    const halfD_Studs = baseDepth / 2;
    const fenceOffset = 0.5;
    const gateWidth = 3;
    const gateStart = -Math.floor(gateWidth / 2);
    const gateEnd = gateStart + gateWidth;

    for (let x = -halfW_Studs + fenceOffset; x < halfW_Studs; x += 1) {
        if (x < gateStart || x >= gateEnd) { // Front fence (excluding gate)
             createAndAddBrick(1, 1, fenceHeight, x, fenceRelY, -halfD_Studs + fenceOffset, C.LEGO_WHITE, true);
        }
         createAndAddBrick(1, 1, fenceHeight, x, fenceRelY, halfD_Studs - fenceOffset, C.LEGO_WHITE, true); // Back fence
    }
    for (let z = -halfD_Studs + fenceOffset + 1; z < halfD_Studs - fenceOffset; z += 1) {
         createAndAddBrick(1, 1, fenceHeight, -halfW_Studs + fenceOffset, fenceRelY, z, C.LEGO_WHITE, true); // Left fence
         createAndAddBrick(1, 1, fenceHeight, halfW_Studs - fenceOffset, fenceRelY, z, C.LEGO_WHITE, true); // Right fence
    }

    // Sort by build order
    instanceBricks.sort((a, b) => a.userData.buildOrder - b.userData.buildOrder);

    // Return the data structure for a placed house
    return {
        templateId,
        variationIndex,
        instanceId,
        position: placementPosition.clone(), // Center position
        rotationY: 0, // Initial rotation
        bricks: instanceBricks, // Array of THREE.Group objects
        isBuilt: false,
        isAnimating: false,
        isSelected: false
    };
}


// --- Rotated Bounding Box Helper ---
export function getRotatedBoundingBox(center, templateId, variationIndex, rotationY, returnWorldBox = false) {
    const variation = buildingTemplates[templateId].variations[variationIndex];
    const baseWidth = variation.basePlateSize.width * C.BRICK_UNIT_SIZE;
    const baseDepth = variation.basePlateSize.depth * C.BRICK_UNIT_SIZE;
    const height = (variation.dimensions.height * C.BRICK_HEIGHT) + C.PLATE_HEIGHT; // Include base plate

    const halfWidth = baseWidth / 2;
    const halfDepth = baseDepth / 2;

    const corners = [
        new THREE.Vector3( halfWidth, 0,  halfDepth), new THREE.Vector3( halfWidth, 0, -halfDepth),
        new THREE.Vector3(-halfWidth, 0,  halfDepth), new THREE.Vector3(-halfWidth, 0, -halfDepth),
    ];

    const rotatedCorners = corners.map(corner => corner.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationY));

    const min = new THREE.Vector3(Infinity, 0, Infinity);
    const max = new THREE.Vector3(-Infinity, height, -Infinity);

    rotatedCorners.forEach(corner => {
        min.x = Math.min(min.x, corner.x); min.z = Math.min(min.z, corner.z);
        max.x = Math.max(max.x, corner.x); max.z = Math.max(max.z, corner.z);
    });

     if (returnWorldBox) {
         min.add(center); max.add(center);
     }

    return new THREE.Box3(min, max);
}
