import { appState } from './state.js';
import { buildingTemplates } from './templates.js';
import { updateActionButtons, updatePlacedHousesUI, updateStatusText } from './ui.js';
import { highlightSelectedHouse } from './selection.js'; // Needed for move/rotate completion

// --- Build/Unbuild/Move/Rotate Animations using GSAP ---

export function animateBuild(instanceId, onCompleteCallback) {
    const instance = appState.placedHouses[instanceId];
    if (!instance || instance.isBuilt || instance.isAnimating) return;
    console.log(`Animation: Building ${instanceId}`);
    instance.isAnimating = true;

    const timeline = gsap.timeline({
        onComplete: () => {
            instance.isBuilt = true;
            instance.isAnimating = false;
            console.log(`Animation: ${instanceId} build complete.`);
            if (onCompleteCallback) onCompleteCallback();
        }
    });

    // Ensure bricks are in the scene and visible
    instance.bricks.forEach(brick => {
        if (!brick.parent) appState.scene.add(brick);
        brick.visible = true;
    });

    instance.bricks.forEach((brick, index) => {
        const delay = index * 0.007;
        timeline.add(gsap.to(brick.position, {
            duration: 1.0 + Math.random() * 0.5,
            x: brick.userData.finalPosition.x, y: brick.userData.finalPosition.y, z: brick.userData.finalPosition.z,
            ease: "elastic.out(1, 0.65)",
        }), delay);
        timeline.add(gsap.to(brick.rotation, {
            duration: 1.0 + Math.random() * 0.5,
            x: brick.userData.finalRotation.x, y: brick.userData.finalRotation.y, z: brick.userData.finalRotation.z,
            ease: "power3.out",
        }), delay);
        timeline.add(gsap.to(brick.scale, {
            duration: 0.8 + Math.random() * 0.3,
            x: 1, y: 1, z: 1,
            ease: "back.out(2)",
        }), delay);
    });
}

export function animateUnbuild(instanceId, onCompleteCallback) {
    const instance = appState.placedHouses[instanceId];
    if (!instance || !instance.isBuilt || instance.isAnimating) return;
    console.log(`Animation: Unbuilding ${instanceId}`);
    instance.isAnimating = true;
    instance.isBuilt = false; // Mark as unbuilt immediately

    const timeline = gsap.timeline({
        onComplete: () => {
            instance.bricks.forEach(brick => {
                if (brick.parent) appState.scene.remove(brick);
                brick.visible = false;
            });
            // The actual deletion from appState happens in actions.js after animation
            console.log(`Animation: ${instanceId} unbuild animation complete.`);
             if (onCompleteCallback) onCompleteCallback();
        }
    });

    [...instance.bricks].reverse().forEach((brick, index) => {
        const delay = index * 0.005;
        const currentFinalPos = brick.userData.finalPosition; // Base targets on last known good pos
        const targetX = currentFinalPos.x + (Math.random() - 0.5) * 25;
        const targetY = currentFinalPos.y - 30 - Math.random() * 20;
        const targetZ = currentFinalPos.z + (Math.random() - 0.5) * 25;
        const targetRotX = Math.random() * Math.PI * 4;
        const targetRotY = Math.random() * Math.PI * 4;
        const targetRotZ = Math.random() * Math.PI * 4;

        timeline.add(gsap.to(brick.position, { duration: 0.8 + Math.random() * 0.6, x: targetX, y: targetY, z: targetZ, ease: "power2.in" }), delay);
        timeline.add(gsap.to(brick.rotation, { duration: 0.8 + Math.random() * 0.6, x: targetRotX, y: targetRotY, z: targetRotZ, ease: "power1.in" }), delay);
        timeline.add(gsap.to(brick.scale, { duration: 0.6 + Math.random() * 0.3, x: 0.01, y: 0.01, z: 0.01, ease: "power2.in" }), delay + 0.1);
    });
}

export function animateMove(instanceId, newPosition, onCompleteCallback) {
    const instance = appState.placedHouses[instanceId];
    if (!instance || !instance.isBuilt || instance.isAnimating) return;
    console.log(`Animation: Moving ${instanceId}`);
    instance.isAnimating = true;

    const currentRotationY = instance.rotationY; // Store current rotation

    const timeline = gsap.timeline({
        onComplete: () => {
            instance.isAnimating = false;
            console.log(`Animation: ${instanceId} move complete.`);
            if (onCompleteCallback) onCompleteCallback();
        }
    });

    // Update final positions FIRST based on new center and current rotation
    instance.bricks.forEach(brick => {
        const relPos = brick.userData.originalRelPos;
        const rotatedRelX = relPos.x * Math.cos(currentRotationY) + relPos.z * Math.sin(currentRotationY);
        const rotatedRelZ = -relPos.x * Math.sin(currentRotationY) + relPos.z * Math.cos(currentRotationY);
        const newFinalPosX = newPosition.x + rotatedRelX;
        const newFinalPosY = brick.userData.finalPosition.y;
        const newFinalPosZ = newPosition.z + rotatedRelZ;
        brick.userData.finalPosition.set(newFinalPosX, newFinalPosY, newFinalPosZ); // Update target
        // Rotation target (brick.userData.finalRotation.y) should already match currentRotationY

        // Add animation to move the brick
        timeline.add( gsap.to(brick.position, {
            duration: 0.6 + Math.random() * 0.3,
            x: newFinalPosX, y: newFinalPosY, z: newFinalPosZ,
            ease: "power2.out",
        }), 0 ); // Start all at once
    });

    // Update instance position state AFTER calculating targets
    instance.position.copy(newPosition);
}


export function animateRotate(instanceId, newRotationY, onCompleteCallback) {
    const instance = appState.placedHouses[instanceId];
    if (!instance || !instance.isBuilt || instance.isAnimating) return;
    console.log(`Animation: Rotating ${instanceId}`);
    instance.isAnimating = true;

    const center = instance.position; // Center of rotation

    const timeline = gsap.timeline({
        onComplete: () => {
            instance.isAnimating = false;
            console.log(`Animation: ${instanceId} rotation complete.`);
             if (onCompleteCallback) onCompleteCallback();
        }
    });

    // Update final position AND rotation for each brick based on new instance rotation
    instance.bricks.forEach(brick => {
        const relPos = brick.userData.originalRelPos;
        const rotatedRelX = relPos.x * Math.cos(newRotationY) + relPos.z * Math.sin(newRotationY);
        const rotatedRelZ = -relPos.x * Math.sin(newRotationY) + relPos.z * Math.cos(newRotationY);
        const newFinalPosX = center.x + rotatedRelX;
        const newFinalPosY = brick.userData.finalPosition.y;
        const newFinalPosZ = center.z + rotatedRelZ;

        // Update stored final state
        brick.userData.finalPosition.set(newFinalPosX, newFinalPosY, newFinalPosZ);
        brick.userData.finalRotation.y = newRotationY;

        // Animate position
        timeline.add(gsap.to(brick.position, {
            duration: 0.7 + Math.random() * 0.2,
            x: newFinalPosX, y: newFinalPosY, z: newFinalPosZ,
            ease: "power2.inOut",
        }), 0);
        // Animate Y rotation
        timeline.add(gsap.to(brick.rotation, {
            duration: 0.7 + Math.random() * 0.2,
            y: newRotationY, // GSAP handles shortest direction
            ease: "power2.inOut",
        }), 0);
    });

    // Update instance rotation state AFTER calculating targets
    instance.rotationY = newRotationY;
}
