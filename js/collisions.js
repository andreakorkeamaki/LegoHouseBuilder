import * as C from './constants.js';
import { appState } from './state.js';
import { getRotatedBoundingBox } from './instanceUtils.js';

export function isPositionValid(targetPosition, rotationY, placingInstanceId = null, templateId, variationIndex) {

    // Get the Axis-Aligned Bounding Box (AABB) of the rotated object being placed/moved
    const placingBox = getRotatedBoundingBox(targetPosition, templateId, variationIndex, rotationY, true); // Get world box

    // Apply buffer inwards slightly
    placingBox.min.x += C.COLLISION_CHECK_BUFFER;
    placingBox.min.z += C.COLLISION_CHECK_BUFFER;
    placingBox.max.x -= C.COLLISION_CHECK_BUFFER;
    placingBox.max.z -= C.COLLISION_CHECK_BUFFER;

    // 1. Check against other placed houses
    for (const instanceId in appState.placedHouses) {
        if (instanceId === placingInstanceId || !appState.placedHouses[instanceId].isBuilt) continue;

        const otherHouse = appState.placedHouses[instanceId];
        const otherBox = getRotatedBoundingBox(otherHouse.position, otherHouse.templateId, otherHouse.variationIndex, otherHouse.rotationY, true); // World box

        if (placingBox.intersectsBox(otherBox)) {
            console.log(`Collision detected: Placing object intersects with house ${instanceId}`);
            return false;
        }
    }

    // 2. Check against road segments
    for (const road of appState.roadSegments) {
        const roadBox = new THREE.Box3().setFromObject(road);
        roadBox.expandByScalar(0.1); // Inflate road box slightly for safety
        if (placingBox.intersectsBox(roadBox)) {
            console.log(`Collision detected: Placing object intersects with a road segment`);
            return false;
        }
    }

    return true; // No collisions found
}
