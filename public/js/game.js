// === COMPLETE RACING GAME - ALL ISSUES FIXED ===

class RacingGame {
    constructor() {
        console.log('🏎️ Racing Game Loading...');
        
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 100, 600);
        
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.getElementById('game-container').appendChild(this.renderer.domElement);
        
        this.players = {};
        this.myPlayerId = null;
        this.isRacing = false;
        this.raceFinished = false;
        this.finishTime = null;
        this.fireworks = [];
        
        // SIMPLE PHYSICS - IMPROVED
        this.physics = {
            acceleration: 0.05,
            maxSpeed: 2.5,
            braking: 0.25,
            friction: 0.08,
            turnSpeed: 0.04,
            minTurnSpeed: 0.3  // Minimum speed needed to turn
        };
        
        this.keys = {};
        this.touch = { gas: false, brake: false, left: false, right: false };
        
        this.kartColors = [0xFF3333, 0x3333FF, 0x33FF33, 0xFFFF33, 0xFF33FF, 0x33FFFF];
        this.emojis = ['🦁', '🐯', '🐻', '🦊', '🐺', '🐼'];
        
        this.waypoints = [];
        
        this.setupLighting();
        this.createTrackWithLanes();
        this.setupControls();
        this.setupUI();
        
        window.addEventListener('resize', () => this.onWindowResize());
        console.log('✅ Ready!');
    }
    
    setupLighting() {
        const ambient = new THREE.AmbientLight(0xFFFFFF, 1.3);
        this.scene.add(ambient);
        
        const sun = new THREE.DirectionalLight(0xFFFFFF, 2.0);
        sun.position.set(400, 500, 400);
        sun.castShadow = true;
        sun.shadow.mapSize.width = 4096;
        sun.shadow.mapSize.height = 4096;
        sun.shadow.camera.left = -800;
        sun.shadow.camera.right = 800;
        sun.shadow.camera.top = 800;
        sun.shadow.camera.bottom = -800;
        this.scene.add(sun);
    }
    
    createFirework(x, z) {
        const colors = [0xFF0000, 0x00FF00, 0x0000FF, 0xFFFF00, 0xFF00FF, 0x00FFFF, 0xFFFFFF, 0xFFA500];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        const particles = [];
        const numParticles = 100;
        
        for (let i = 0; i < numParticles; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.5, 8, 8),
                new THREE.MeshBasicMaterial({ 
                    color: color,
                    transparent: true,
                    opacity: 1
                })
            );
            
            particle.position.set(x, 30, z);
            
            // Random velocity in all directions
            const speed = 3 + Math.random() * 5;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            particle.userData.velocity = {
                x: speed * Math.sin(phi) * Math.cos(theta),
                y: speed * Math.cos(phi),
                z: speed * Math.sin(phi) * Math.sin(theta)
            };
            
            particle.userData.life = 1.0;
            particle.userData.gravity = -0.15;
            
            this.scene.add(particle);
            particles.push(particle);
        }
        
        return particles;
    }
    
    updateFireworks() {
        this.fireworks = this.fireworks.filter(particles => {
            let allDead = true;
            
            particles.forEach(particle => {
                if (particle.userData.life > 0) {
                    allDead = false;
                    
                    // Update position
                    particle.position.x += particle.userData.velocity.x * 0.3;
                    particle.position.y += particle.userData.velocity.y * 0.3;
                    particle.position.z += particle.userData.velocity.z * 0.3;
                    
                    // Apply gravity
                    particle.userData.velocity.y += particle.userData.gravity;
                    
                    // Fade out
                    particle.userData.life -= 0.015;
                    particle.material.opacity = particle.userData.life;
                    
                    if (particle.userData.life <= 0) {
                        this.scene.remove(particle);
                        particle.geometry.dispose();
                        particle.material.dispose();
                    }
                }
            });
            
            return !allDead;
        });
    }
    
    triggerCelebration() {
        console.log('🎉🎉🎉 RACE COMPLETE! CELEBRATION TIME! 🎉🎉🎉');
        
        // Show celebration overlay
        const celebrationDiv = document.createElement('div');
        celebrationDiv.id = 'celebration';
        celebrationDiv.style.position = 'fixed';
        celebrationDiv.style.top = '0';
        celebrationDiv.style.left = '0';
        celebrationDiv.style.width = '100%';
        celebrationDiv.style.height = '100%';
        celebrationDiv.style.display = 'flex';
        celebrationDiv.style.flexDirection = 'column';
        celebrationDiv.style.justifyContent = 'center';
        celebrationDiv.style.alignItems = 'center';
        celebrationDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        celebrationDiv.style.zIndex = '1000';
        celebrationDiv.style.animation = 'fadeIn 0.5s';
        
        celebrationDiv.innerHTML = `
            <div style="text-align: center; animation: bounceIn 1s;">
                <h1 style="font-size: 120px; margin: 0; color: #FFD700; text-shadow: 0 0 20px #FFD700, 0 0 40px #FFD700;">
                    🏆 WINNER! 🏆
                </h1>
                <h2 style="font-size: 60px; margin: 20px 0; color: #FFFFFF; text-shadow: 0 0 10px #00FF00;">
                    RACE COMPLETE!
                </h2>
                <p style="font-size: 36px; color: #FFFFFF; margin: 10px 0;">
                    🎉 Congratulations! You finished all 3 laps! 🎉
                </p>
                <p style="font-size: 48px; margin: 30px 0;">
                    🎊🎈🎆✨🌟🎯🏁
                </p>
            </div>
        `;
        
        // Add CSS animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes bounceIn {
                0% { transform: scale(0.3); opacity: 0; }
                50% { transform: scale(1.05); }
                70% { transform: scale(0.9); }
                100% { transform: scale(1); opacity: 1; }
            }
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }
            #celebration h1 {
                animation: pulse 1s infinite;
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(celebrationDiv);
        
        // Launch fireworks around the finish line
        for (let i = 0; i < 15; i++) {
            setTimeout(() => {
                const offsetX = (Math.random() - 0.5) * 200;
                const offsetZ = (Math.random() - 0.5) * 100;
                const particles = this.createFirework(this.startLineX + offsetX, offsetZ);
                this.fireworks.push(particles);
                
                // Play sound effect (if available)
                console.log('💥 FIREWORK!');
            }, i * 200);
        }
    }
    
    createTrackWithLanes() {
        // TRACK PARAMETERS
        const straightLen = 500;
        const straightWidth = 80;
        const numLanes = 5;
        const laneWidth = straightWidth / numLanes;
        
        const trackMat = new THREE.MeshStandardMaterial({ 
            color: 0x2a2a2a,
            roughness: 0.9
        });
        
        const greenMat = new THREE.MeshStandardMaterial({ 
            color: 0x00AA00,
            roughness: 0.9
        });
        
        // === BOTTOM STRAIGHT ===
        const bottom = new THREE.Mesh(
            new THREE.BoxGeometry(straightLen, 1, straightWidth),
            trackMat
        );
        bottom.position.set(0, 0, 0);
        bottom.receiveShadow = true;
        this.scene.add(bottom);
        
        // Green edges
        const bottomEdgeL = new THREE.Mesh(
            new THREE.BoxGeometry(straightLen, 2, 4),
            greenMat
        );
        bottomEdgeL.position.set(0, 1, -straightWidth/2 - 2);
        this.scene.add(bottomEdgeL);
        
        const bottomEdgeR = new THREE.Mesh(
            new THREE.BoxGeometry(straightLen, 2, 4),
            greenMat
        );
        bottomEdgeR.position.set(0, 1, straightWidth/2 + 2);
        this.scene.add(bottomEdgeR);
        
        // === TOP STRAIGHT ===
        const top = new THREE.Mesh(
            new THREE.BoxGeometry(straightLen, 1, straightWidth),
            trackMat
        );
        top.position.set(0, 0, -(straightLen + straightWidth));
        top.receiveShadow = true;
        this.scene.add(top);
        
        const topEdgeL = new THREE.Mesh(
            new THREE.BoxGeometry(straightLen, 2, 4),
            greenMat
        );
        topEdgeL.position.set(0, 1, -(straightLen + straightWidth) - straightWidth/2 - 2);
        this.scene.add(topEdgeL);
        
        const topEdgeR = new THREE.Mesh(
            new THREE.BoxGeometry(straightLen, 2, 4),
            greenMat
        );
        topEdgeR.position.set(0, 1, -(straightLen + straightWidth) + straightWidth/2 + 2);
        this.scene.add(topEdgeR);
        
        // === LEFT SIDE ===
        const left = new THREE.Mesh(
            new THREE.BoxGeometry(straightWidth, 1, straightLen + straightWidth * 2),
            trackMat
        );
        left.position.set(-straightLen/2 - straightWidth/2, 0, -straightLen/2 - straightWidth/2);
        left.receiveShadow = true;
        this.scene.add(left);
        
        // ONLY OUTER BOUNDARY - NO INNER GREEN LINE
        const leftEdgeOuter = new THREE.Mesh(
            new THREE.BoxGeometry(4, 2, straightLen + straightWidth * 2),
            greenMat
        );
        leftEdgeOuter.position.set(-straightLen/2 - straightWidth - 2, 1, -straightLen/2 - straightWidth/2);
        this.scene.add(leftEdgeOuter);
        
        // === RIGHT SIDE ===
        const right = new THREE.Mesh(
            new THREE.BoxGeometry(straightWidth, 1, straightLen + straightWidth * 2),
            trackMat
        );
        right.position.set(straightLen/2 + straightWidth/2, 0, -straightLen/2 - straightWidth/2);
        right.receiveShadow = true;
        this.scene.add(right);
        
        // ONLY OUTER BOUNDARY - NO INNER GREEN LINE
        const rightEdgeOuter = new THREE.Mesh(
            new THREE.BoxGeometry(4, 2, straightLen + straightWidth * 2),
            greenMat
        );
        rightEdgeOuter.position.set(straightLen/2 + straightWidth + 2, 1, -straightLen/2 - straightWidth/2);
        this.scene.add(rightEdgeOuter);
        
        // === LANE MARKERS (WHITE DASHED LINES) ===
        const laneMat = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF,
            emissive: 0xFFFFFF,
            emissiveIntensity: 2.5
        });
        
        // Bottom straight lane lines
        for (let lane = 1; lane < numLanes; lane++) {
            const zPos = -straightWidth/2 + lane * laneWidth;
            for (let i = 0; i < 50; i++) {
                const line = new THREE.Mesh(
                    new THREE.BoxGeometry(8, 0.6, 1.5),
                    laneMat
                );
                line.position.set(-straightLen/2 + 5 + i * 10, 0.8, zPos);
                this.scene.add(line);
            }
        }
        
        // Top straight lane lines
        for (let lane = 1; lane < numLanes; lane++) {
            const zPos = -(straightLen + straightWidth) - straightWidth/2 + lane * laneWidth;
            for (let i = 0; i < 50; i++) {
                const line = new THREE.Mesh(
                    new THREE.BoxGeometry(8, 0.6, 1.5),
                    laneMat
                );
                line.position.set(-straightLen/2 + 5 + i * 10, 0.8, zPos);
                this.scene.add(line);
            }
        }
        
        // Left side lane lines
        for (let lane = 1; lane < numLanes; lane++) {
            const xPos = -straightLen/2 - straightWidth/2 - straightWidth/2 + lane * laneWidth;
            for (let i = 0; i < 60; i++) {
                const line = new THREE.Mesh(
                    new THREE.BoxGeometry(1.5, 0.6, 8),
                    laneMat
                );
                line.position.set(xPos, 0.8, straightWidth/2 - 5 - i * 10);
                this.scene.add(line);
            }
        }
        
        // Right side lane lines
        for (let lane = 1; lane < numLanes; lane++) {
            const xPos = straightLen/2 + straightWidth/2 - straightWidth/2 + lane * laneWidth;
            for (let i = 0; i < 60; i++) {
                const line = new THREE.Mesh(
                    new THREE.BoxGeometry(1.5, 0.6, 8),
                    laneMat
                );
                line.position.set(xPos, 0.8, straightWidth/2 - 5 - i * 10);
                this.scene.add(line);
            }
        }
        
        // === START/FINISH LINE ===
        this.startLineX = -180;
        for (let i = 0; i < 20; i++) {
            const checker = new THREE.Mesh(
                new THREE.BoxGeometry(12, 0.7, 4),
                new THREE.MeshStandardMaterial({
                    color: i % 2 === 0 ? 0x000000 : 0xFFFFFF,
                    emissive: i % 2 === 0 ? 0x000000 : 0xFFFFFF,
                    emissiveIntensity: 3.0
                })
            );
            checker.position.set(this.startLineX, 0.8, -straightWidth/2 + i * 4);
            this.scene.add(checker);
        }
        
        // === AI WAYPOINTS ===
        this.waypoints = [
            { x: -180, z: 0 },
            { x: 0, z: 0 },
            { x: 200, z: 0 },
            { x: 280, z: -80 },
            { x: 280, z: -200 },
            { x: 280, z: -300 },
            { x: 280, z: -400 },
            { x: 200, z: -580 },
            { x: 0, z: -580 },
            { x: -200, z: -580 },
            { x: -280, z: -400 },
            { x: -280, z: -300 },
            { x: -280, z: -200 },
            { x: -280, z: -80 }
        ];
        
        // === ENVIRONMENT ===
        const grass = new THREE.Mesh(
            new THREE.CircleGeometry(800, 64),
            new THREE.MeshStandardMaterial({ color: 0x3a6a1a, roughness: 1.0 })
        );
        grass.rotation.x = -Math.PI / 2;
        grass.position.y = -0.5;
        grass.receiveShadow = true;
        this.scene.add(grass);
        
        // Trees - ENSURE MINIMUM DISTANCE FROM TRACK
        for (let i = 0; i < 60; i++) {
            const angle = (i / 60) * Math.PI * 2;
            const dist = 450 + Math.random() * 300; // Increased minimum distance
            const x = Math.cos(angle) * dist;
            const z = -290 + Math.sin(angle) * dist;
            
            // Check if too close to track - skip if so
            const distFromCenter = Math.sqrt(x * x + (z + 290) * (z + 290));
            if (distFromCenter < 400) continue; // Skip trees too close to track
            
            const trunk = new THREE.Mesh(
                new THREE.CylinderGeometry(6, 7, 40, 8),
                new THREE.MeshStandardMaterial({ color: 0x4a2511 })
            );
            trunk.position.set(x, 20, z);
            trunk.castShadow = true;
            this.scene.add(trunk);
            
            const leaves = new THREE.Mesh(
                new THREE.SphereGeometry(25, 8, 8),
                new THREE.MeshStandardMaterial({ color: 0x0a5a0a })
            );
            leaves.position.set(x, 50, z);
            leaves.castShadow = true;
            this.scene.add(leaves);
        }
        
        // === BIRDS IN THE SKY ===
        for (let i = 0; i < 15; i++) {
            const bird = new THREE.Group();
            
            // Simple bird body (just two triangles for wings)
            const wingGeometry = new THREE.ConeGeometry(3, 8, 3);
            const wingMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
            
            const leftWing = new THREE.Mesh(wingGeometry, wingMat);
            leftWing.rotation.z = Math.PI / 4;
            leftWing.position.set(-4, 0, 0);
            bird.add(leftWing);
            
            const rightWing = new THREE.Mesh(wingGeometry, wingMat);
            rightWing.rotation.z = -Math.PI / 4;
            rightWing.position.set(4, 0, 0);
            bird.add(rightWing);
            
            // Position birds in sky
            bird.position.set(
                (Math.random() - 0.5) * 1000,
                100 + Math.random() * 150,
                (Math.random() - 0.5) * 1000
            );
            
            // Random rotation
            bird.rotation.y = Math.random() * Math.PI * 2;
            
            // Store for animation
            bird.userData.speed = 0.2 + Math.random() * 0.3;
            bird.userData.startX = bird.position.x;
            bird.userData.time = Math.random() * 100;
            
            this.scene.add(bird);
            
            // Save reference for animation
            if (!this.birds) this.birds = [];
            this.birds.push(bird);
        }
        
        // === ANIMALS IN THE GRASS (Deer, Rabbits) - ENHANCED GRAPHICS ===
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 500 + Math.random() * 250; // Increased minimum distance to 500
            const x = Math.cos(angle) * dist;
            const z = -290 + Math.sin(angle) * dist;
            
            // STRICT: Skip if too close to track center
            const distFromCenter = Math.sqrt(x * x + (z + 290) * (z + 290));
            if (distFromCenter < 450) continue; // Increased from 400 to 450
            
            const animal = new THREE.Group();
            
            // Determine animal type
            const isDeer = i % 3 === 0;
            
            if (isDeer) {
                // DEER - More detailed
                const bodyColor = 0x8B4513; // Saddle brown
                
                // Main body (larger)
                const bodyGeo = new THREE.BoxGeometry(8, 6, 14);
                const bodyMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.8 });
                const body = new THREE.Mesh(bodyGeo, bodyMat);
                body.position.y = 5;
                body.castShadow = true;
                animal.add(body);
                
                // Neck
                const neckGeo = new THREE.CylinderGeometry(2, 3, 6, 8);
                const neck = new THREE.Mesh(neckGeo, bodyMat);
                neck.position.set(0, 8, 5);
                neck.rotation.x = 0.3;
                neck.castShadow = true;
                animal.add(neck);
                
                // Head (detailed)
                const headGeo = new THREE.BoxGeometry(4, 5, 6);
                const head = new THREE.Mesh(headGeo, bodyMat);
                head.position.set(0, 11, 8);
                head.castShadow = true;
                animal.add(head);
                
                // Snout
                const snoutGeo = new THREE.BoxGeometry(3, 2, 3);
                const snout = new THREE.Mesh(snoutGeo, new THREE.MeshStandardMaterial({ color: 0x654321 }));
                snout.position.set(0, 11, 10);
                animal.add(snout);
                
                // Ears
                const earGeo = new THREE.ConeGeometry(1.5, 4, 8);
                const leftEar = new THREE.Mesh(earGeo, bodyMat);
                leftEar.position.set(-2, 14, 8);
                leftEar.rotation.z = -0.2;
                animal.add(leftEar);
                
                const rightEar = new THREE.Mesh(earGeo, bodyMat);
                rightEar.position.set(2, 14, 8);
                rightEar.rotation.z = 0.2;
                animal.add(rightEar);
                
                // Antlers (for male deer)
                if (Math.random() > 0.5) {
                    const antlerMat = new THREE.MeshStandardMaterial({ color: 0xD2B48C });
                    
                    // Left antler
                    const leftAntler = new THREE.Group();
                    const antlerBase = new THREE.CylinderGeometry(0.5, 0.8, 6, 8);
                    const base1 = new THREE.Mesh(antlerBase, antlerMat);
                    base1.position.y = 3;
                    leftAntler.add(base1);
                    
                    const branch1 = new THREE.CylinderGeometry(0.3, 0.5, 4, 8);
                    const b1 = new THREE.Mesh(branch1, antlerMat);
                    b1.position.set(-1, 5, 0);
                    b1.rotation.z = 0.5;
                    leftAntler.add(b1);
                    
                    leftAntler.position.set(-2, 14, 7);
                    animal.add(leftAntler);
                    
                    // Right antler (mirror)
                    const rightAntler = leftAntler.clone();
                    rightAntler.position.set(2, 14, 7);
                    rightAntler.scale.x = -1;
                    animal.add(rightAntler);
                }
                
                // Legs (more realistic)
                const legGeo = new THREE.CylinderGeometry(1, 1.2, 6, 8);
                const positions = [[-3, 3, -4], [3, 3, -4], [-3, 3, 4], [3, 3, 4]];
                positions.forEach(pos => {
                    const leg = new THREE.Mesh(legGeo, bodyMat);
                    leg.position.set(...pos);
                    leg.castShadow = true;
                    animal.add(leg);
                    
                    // Hooves
                    const hoofGeo = new THREE.CylinderGeometry(1.2, 0.8, 1, 8);
                    const hoof = new THREE.Mesh(hoofGeo, new THREE.MeshStandardMaterial({ color: 0x2F4F4F }));
                    hoof.position.set(pos[0], 0.5, pos[2]);
                    animal.add(hoof);
                });
                
                // Tail
                const tailGeo = new THREE.CylinderGeometry(0.5, 0.3, 5, 8);
                const tail = new THREE.Mesh(tailGeo, bodyMat);
                tail.position.set(0, 5, -7);
                tail.rotation.x = -0.5;
                animal.add(tail);
                
            } else {
                // RABBIT - More detailed
                const rabbitColor = i % 2 === 0 ? 0xD3D3D3 : 0x8B7355; // Gray or brown
                
                // Body (round)
                const bodyGeo = new THREE.SphereGeometry(4, 16, 16);
                const bodyMat = new THREE.MeshStandardMaterial({ color: rabbitColor, roughness: 0.9 });
                const body = new THREE.Mesh(bodyGeo, bodyMat);
                body.position.y = 4;
                body.scale.set(1, 0.8, 1.2); // Elongated
                body.castShadow = true;
                animal.add(body);
                
                // Head (round)
                const headGeo = new THREE.SphereGeometry(3, 16, 16);
                const head = new THREE.Mesh(headGeo, bodyMat);
                head.position.set(0, 6, 4);
                head.castShadow = true;
                animal.add(head);
                
                // Long ears
                const earGeo = new THREE.CylinderGeometry(0.8, 1, 5, 8);
                const leftEar = new THREE.Mesh(earGeo, bodyMat);
                leftEar.position.set(-1.5, 10, 4);
                leftEar.rotation.z = -0.3;
                animal.add(leftEar);
                
                const rightEar = new THREE.Mesh(earGeo, bodyMat);
                rightEar.position.set(1.5, 10, 4);
                rightEar.rotation.z = 0.3;
                animal.add(rightEar);
                
                // Nose (pink)
                const noseGeo = new THREE.SphereGeometry(0.5, 8, 8);
                const nose = new THREE.Mesh(noseGeo, new THREE.MeshStandardMaterial({ color: 0xFFB6C1 }));
                nose.position.set(0, 6, 6);
                animal.add(nose);
                
                // Legs (shorter for rabbit)
                const legGeo = new THREE.CylinderGeometry(0.6, 0.8, 3, 8);
                const positions = [[-2, 1.5, -2], [2, 1.5, -2], [-2, 1.5, 2], [2, 1.5, 2]];
                positions.forEach((pos, idx) => {
                    const leg = new THREE.Mesh(legGeo, bodyMat);
                    leg.position.set(...pos);
                    leg.castShadow = true;
                    // Back legs slightly longer
                    if (idx < 2) leg.scale.y = 1.3;
                    animal.add(leg);
                });
                
                // Fluffy tail
                const tailGeo = new THREE.SphereGeometry(1.5, 8, 8);
                const tail = new THREE.Mesh(tailGeo, bodyMat);
                tail.position.set(0, 4, -4);
                animal.add(tail);
            }
            
            animal.position.set(x, 0, z);
            animal.rotation.y = Math.random() * Math.PI * 2;
            animal.castShadow = true;
            
            // Store for animation - slower movement
            animal.userData.speed = isDeer ? 0.08 : 0.05; // Deer faster than rabbits
            animal.userData.wanderAngle = Math.random() * Math.PI * 2;
            animal.userData.wanderTime = Math.random() * 100;
            animal.userData.isDeer = isDeer;
            animal.userData.minDistance = 450; // Strict minimum distance from track
            
            this.scene.add(animal);
            
            // Save reference for animation
            if (!this.animals) this.animals = [];
            this.animals.push(animal);
        }
        
        // Sky
        const sky = new THREE.Mesh(
            new THREE.SphereGeometry(900, 32, 32),
            new THREE.MeshBasicMaterial({ color: 0x87CEEB, side: THREE.BackSide })
        );
        this.scene.add(sky);
        
        // Sun - MORE VISIBLE
        const sunMesh = new THREE.Mesh(
            new THREE.SphereGeometry(70, 32, 32),
            new THREE.MeshBasicMaterial({ 
                color: 0xFFFFAA, 
                emissive: 0xFFFF00, 
                emissiveIntensity: 5 
            })
        );
        sunMesh.position.set(350, 400, 300);
        this.scene.add(sunMesh);
        
        // Sun rays effect
        const sunGlow = new THREE.Mesh(
            new THREE.SphereGeometry(90, 32, 32),
            new THREE.MeshBasicMaterial({ 
                color: 0xFFFF99, 
                transparent: true, 
                opacity: 0.3 
            })
        );
        sunGlow.position.copy(sunMesh.position);
        this.scene.add(sunGlow);
        
        // Clouds - MORE REALISTIC
        for (let i = 0; i < 30; i++) {
            const cloudGroup = new THREE.Group();
            
            // Multiple spheres for fluffy cloud
            for (let j = 0; j < 5; j++) {
                const cloud = new THREE.Mesh(
                    new THREE.SphereGeometry(30 + Math.random() * 20, 8, 8),
                    new THREE.MeshBasicMaterial({ 
                        color: 0xFFFFFF, 
                        transparent: true, 
                        opacity: 0.7 + Math.random() * 0.2 
                    })
                );
                cloud.position.set(
                    (Math.random() - 0.5) * 60,
                    (Math.random() - 0.5) * 20,
                    (Math.random() - 0.5) * 60
                );
                cloudGroup.add(cloud);
            }
            
            cloudGroup.position.set(
                (Math.random() - 0.5) * 1600,
                200 + Math.random() * 150,
                (Math.random() - 0.5) * 1600
            );
            
            // Store for animation
            cloudGroup.userData.driftSpeed = 0.05 + Math.random() * 0.1;
            
            this.scene.add(cloudGroup);
            
            if (!this.clouds) this.clouds = [];
            this.clouds.push(cloudGroup);
        }
    }
    
    setupControls() {
        // Keyboard controls
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        // Mobile/Touch controls - FIXED for iPad/iPhone
        const setupButton = (id, action) => {
            const btn = document.getElementById(id);
            if (!btn) {
                console.warn(`Button ${id} not found`);
                return;
            }
            
            // Touch events (mobile)
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.touch[action] = true;
                btn.style.opacity = '0.5';
                console.log(`${action} pressed (touch)`);
            }, { passive: false });
            
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.touch[action] = false;
                btn.style.opacity = '1';
                console.log(`${action} released (touch)`);
            }, { passive: false });
            
            // Mouse events (desktop testing)
            btn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.touch[action] = true;
                btn.style.opacity = '0.5';
                console.log(`${action} pressed (mouse)`);
            });
            
            btn.addEventListener('mouseup', (e) => {
                e.preventDefault();
                this.touch[action] = false;
                btn.style.opacity = '1';
                console.log(`${action} released (mouse)`);
            });
            
            // Prevent context menu
            btn.addEventListener('contextmenu', (e) => e.preventDefault());
            
            console.log(`✓ Button ${id} setup complete`);
        };
        
        // Setup all control buttons
        setupButton('btn-gas', 'gas');
        setupButton('btn-brake', 'brake');
        setupButton('btn-left', 'left');
        setupButton('btn-right', 'right');
        
        console.log('✅ All controls setup complete!');
    }
    
    setupUI() {
        document.getElementById('speed-display').textContent = '0';
        document.getElementById('lap-display').textContent = '1/3';
    }
    
    createKart(color, emoji) {
        const kart = new THREE.Group();
        
        // === IMPROVED KART BODY ===
        // Main body - lower and wider
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(12, 2.5, 16),  // X, Y, Z - longer in Z direction
            new THREE.MeshStandardMaterial({ color: color, metalness: 0.7, roughness: 0.3 })
        );
        body.position.y = 2.5;
        body.castShadow = true;
        kart.add(body);
        
        // Cockpit area (raised section)
        const cockpit = new THREE.Mesh(
            new THREE.BoxGeometry(10, 2, 10),
            new THREE.MeshStandardMaterial({ color: color, metalness: 0.6, roughness: 0.4 })
        );
        cockpit.position.y = 4.5;
        cockpit.position.z = -2;
        cockpit.castShadow = true;
        kart.add(cockpit);
        
        // Front bumper
        const bumper = new THREE.Mesh(
            new THREE.BoxGeometry(8, 1.5, 2),
            new THREE.MeshStandardMaterial({ color: 0x333333 })
        );
        bumper.position.y = 1.5;
        bumper.position.z = 9;
        bumper.castShadow = true;
        kart.add(bumper);
        
        // RED ARROW FRONT - Points forward (positive Z direction)
        const arrow = new THREE.Mesh(
            new THREE.ConeGeometry(4, 8, 4),
            new THREE.MeshStandardMaterial({ color: 0xFF0000, emissive: 0xFF0000, emissiveIntensity: 2.5 })
        );
        arrow.rotation.x = -Math.PI / 2; // Point forward along Z axis
        arrow.position.set(0, 2.2, 12);  // At front of kart
        arrow.castShadow = true;
        kart.add(arrow);
        
        // Rear spoiler
        const spoiler = new THREE.Mesh(
            new THREE.BoxGeometry(10, 0.5, 1),
            new THREE.MeshStandardMaterial({ color: color })
        );
        spoiler.position.y = 5;
        spoiler.position.z = -8;
        spoiler.castShadow = true;
        kart.add(spoiler);
        
        // Driver emoji
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.font = '100px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emoji, 64, 64);
        
        const texture = new THREE.CanvasTexture(canvas);
        const driver = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture }));
        driver.scale.set(6, 6, 1);
        driver.position.set(0, 7, -2);
        kart.add(driver);
        kart.userData.driver = driver;
        
        // === PROPERLY ORIENTED WHEELS ===
        // Wheels face forward/backward (along Z axis of kart)
        const wheelRadius = 2;
        const wheelWidth = 2.5;
        const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 16);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
        const rimMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
        
        // Wheel positions: [X, Y, Z]
        // Front wheels (positive Z), Back wheels (negative Z)
        const wheelPositions = [
            [-6, 2, 6],   // Front left
            [6, 2, 6],    // Front right
            [-6, 2, -6],  // Back left
            [6, 2, -6]    // Back right
        ];
        
        kart.userData.wheels = [];
        
        wheelPositions.forEach((pos, idx) => {
            const wheelGroup = new THREE.Group();
            
            // Main tire (cylinder rotated to face forward/backward)
            const tire = new THREE.Mesh(wheelGeo, wheelMat);
            tire.rotation.x = Math.PI / 2;  // Rotate to align with Z axis (forward direction)
            tire.castShadow = true;
            wheelGroup.add(tire);
            
            // Wheel rim (visible circle on side)
            const rim = new THREE.Mesh(
                new THREE.CircleGeometry(wheelRadius - 0.3, 16),
                rimMat
            );
            rim.position.x = pos[0] > 0 ? wheelWidth / 2 + 0.1 : -(wheelWidth / 2 + 0.1);
            rim.rotation.y = Math.PI / 2;
            wheelGroup.add(rim);
            
            // Tire treads (show rotation)
            for (let i = 0; i < 6; i++) {
                const tread = new THREE.Mesh(
                    new THREE.BoxGeometry(wheelWidth + 0.2, 0.3, 0.5),
                    new THREE.MeshStandardMaterial({ color: 0x2a2a2a })
                );
                tread.rotation.x = Math.PI / 2; // Align with wheel
                const angle = (i / 6) * Math.PI * 2;
                tread.position.z = Math.cos(angle) * wheelRadius;
                tread.position.y = Math.sin(angle) * wheelRadius;
                wheelGroup.add(tread);
            }
            
            // Red indicator dot (shows rotation direction)
            const indicator = new THREE.Mesh(
                new THREE.CircleGeometry(0.6, 8),
                new THREE.MeshBasicMaterial({ color: 0xFF0000 })
            );
            indicator.position.x = pos[0] > 0 ? wheelWidth / 2 + 0.15 : -(wheelWidth / 2 + 0.15);
            indicator.rotation.y = Math.PI / 2;
            wheelGroup.add(indicator);
            
            wheelGroup.position.set(...pos);
            kart.add(wheelGroup);
            kart.userData.wheels.push(wheelGroup);
        });
        
        return kart;
    }
    
    addPlayer(playerId, playerData) {
        const idx = Object.keys(this.players).length;
        const kart = this.createKart(this.kartColors[idx % 6], this.emojis[idx % 6]);
        
        const lane = -32 + (idx % 5) * 16;
        const x = -180;
        const z = lane;
        const angle = 0;
        
        kart.position.set(x, 1, z);
        kart.rotation.y = angle;
        this.scene.add(kart);
        
        this.players[playerId] = {
            ...playerData,
            kart, x, y: 1, z, angle,
            speed: 0,
            lap: 1,
            lastX: x,
            passedHalfway: false
        };
        
        console.log(`✅ Player ${idx + 1} added at X:${x}, Z:${z}, Lane ${idx}`);
    }
    
    addAIPlayer(aiIndex) {
        const aiId = 'ai_' + aiIndex;
        const idx = Object.keys(this.players).length;
        const kart = this.createKart(this.kartColors[idx % 6], this.emojis[idx % 6]);
        
        const lane = -32 + (idx % 5) * 16;
        const x = -180;
        const z = lane;
        const angle = 0;
        
        kart.position.set(x, 1, z);
        kart.rotation.y = angle;
        kart.visible = true;  // Explicitly set visible
        kart.castShadow = true;
        kart.receiveShadow = true;
        
        this.scene.add(kart);
        
        this.players[aiId] = {
            id: aiId,
            name: 'CPU ' + (aiIndex + 1),
            isAI: true,
            kart, x, y: 1, z, angle,
            speed: 0,
            lap: 1,
            lastX: x,
            passedHalfway: false,
            waypointIndex: 0
        };
        
        console.log(`🤖 AI ${aiIndex + 1} added at position (${x}, ${z}) - Should be visible!`);
    }
    
    updatePlayer(playerId, playerData) {
        // Update other players from multiplayer data
        const player = this.players[playerId];
        if (!player || playerId === this.myPlayerId) return; // Don't update self
        
        // Update position and rotation
        player.x = playerData.x;
        player.z = playerData.z;
        player.angle = playerData.angle;
        player.speed = playerData.speed || 0;
        player.lap = playerData.lap || 1;
        
        // Update visual
        if (player.kart) {
            player.kart.position.set(player.x, player.y, player.z);
            player.kart.rotation.set(0, -player.angle, 0);
            
            // Update wheels
            if (player.kart.userData.wheels) {
                player.kart.userData.wheels.forEach(w => {
                    w.rotation.z += player.speed * 0.25;
                });
            }
        }
        
        console.log(`📡 Updated player ${playerId} at (${player.x}, ${player.z})`);
    }
    
    gameLoop() {
        this.animate();
    }
    
    animateEnvironment() {
        const time = Date.now() * 0.001;
        
        // Animate birds flying
        if (this.birds) {
            this.birds.forEach(bird => {
                bird.userData.time += 0.016;
                
                // Bird flies in circular pattern
                bird.position.x = bird.userData.startX + Math.sin(bird.userData.time * bird.userData.speed) * 100;
                bird.position.y += Math.sin(bird.userData.time * 2) * 0.5;
                
                // Flap wings (rotate)
                if (bird.children[0]) {
                    bird.children[0].rotation.z = Math.PI / 4 + Math.sin(time * 10) * 0.3;
                }
                if (bird.children[1]) {
                    bird.children[1].rotation.z = -Math.PI / 4 - Math.sin(time * 10) * 0.3;
                }
            });
        }
        
        // Animate animals walking
        if (this.animals) {
            this.animals.forEach(animal => {
                animal.userData.wanderTime += 0.016;
                
                // Wander around slowly
                if (Math.random() < 0.02) {
                    animal.userData.wanderAngle += (Math.random() - 0.5) * 0.5;
                }
                
                // Move in wander direction
                const moveX = Math.cos(animal.userData.wanderAngle) * animal.userData.speed;
                const moveZ = Math.sin(animal.userData.wanderAngle) * animal.userData.speed;
                
                animal.position.x += moveX;
                animal.position.z += moveZ;
                
                // Rotate to face movement direction
                animal.rotation.y = animal.userData.wanderAngle;
                
                // Bobbing animation (walking)
                animal.position.y = Math.abs(Math.sin(animal.userData.wanderTime * (animal.userData.isDeer ? 5 : 8))) * 0.5;
                
                // STRICT BOUNDARY ENFORCEMENT - Stay away from track!
                const distFromOrigin = Math.sqrt(animal.position.x ** 2 + (animal.position.z + 290) ** 2);
                
                // If too close to track center, turn away immediately
                if (distFromOrigin < animal.userData.minDistance) {
                    // Turn 180 degrees away from center
                    const angleToCenter = Math.atan2(-290 - animal.position.z, -animal.position.x);
                    animal.userData.wanderAngle = angleToCenter + Math.PI; // Opposite direction
                    
                    // Move away quickly
                    animal.position.x += Math.cos(animal.userData.wanderAngle) * 2;
                    animal.position.z += Math.sin(animal.userData.wanderAngle) * 2;
                }
                
                // Keep animals in reasonable area (don't wander too far)
                if (distFromOrigin > 750) {
                    // Turn back toward reasonable area
                    const angleToCenter = Math.atan2(-290 - animal.position.z, -animal.position.x);
                    animal.userData.wanderAngle = angleToCenter;
                }
            });
        }
        
        // Animate clouds drifting
        if (this.clouds) {
            this.clouds.forEach(cloud => {
                cloud.position.x += cloud.userData.driftSpeed;
                
                // Wrap around
                if (cloud.position.x > 800) {
                    cloud.position.x = -800;
                }
            });
        }
    }
    
    startRace() {
        this.isRacing = false;
        let count = 3;
        const cd = document.getElementById('countdown');
        cd.style.display = 'block';
        
        const int = setInterval(() => {
            if (count > 0) {
                cd.textContent = count;
                cd.style.fontSize = '180px';
                cd.style.color = '#FFD700';
                count--;
            } else {
                cd.textContent = 'GO!';
                cd.style.fontSize = '220px';
                cd.style.color = '#00FF00';
                this.isRacing = true;
                setTimeout(() => { cd.style.display = 'none'; }, 1200);
                clearInterval(int);
            }
        }, 1000);
    }
    
    update() {
        if (!this.isRacing) return;
        
        const p = this.players[this.myPlayerId];
        if (!p) return;
        
        // If race finished, stop the kart gradually
        if (this.raceFinished) {
            // Gradually slow down to stop
            p.speed = Math.max(0, p.speed - 0.1);
            
            // Update position with remaining speed
            p.x += Math.cos(p.angle) * p.speed;
            p.z += Math.sin(p.angle) * p.speed;
            
            // Update visuals - FORCE STABLE ROTATION
            p.kart.position.set(p.x, p.y, p.z);
            p.kart.rotation.set(0, -p.angle, 0); // NEGATIVE angle to match movement
            
            // Update wheels
            if (p.kart.userData.wheels) {
                p.kart.userData.wheels.forEach(w => {
                    w.rotation.z += p.speed * 0.5;
                });
            }
            
            // Update fireworks and environment
            this.updateFireworks();
            this.animateEnvironment();
            return;
        }
        
        // CONTROLS
        const gas = this.keys['arrowup'] || this.keys['w'] || this.touch.gas;
        const brake = this.keys['arrowdown'] || this.keys['s'] || this.touch.brake;
        const left = this.keys['arrowleft'] || this.keys['a'] || this.touch.left;
        const right = this.keys['arrowright'] || this.keys['d'] || this.touch.right;
        
        // SPEED
        if (gas) {
            p.speed = Math.min(p.speed + this.physics.acceleration, this.physics.maxSpeed);
        } else if (brake) {
            p.speed = Math.max(p.speed - this.physics.braking, -this.physics.maxSpeed * 0.4);
        } else {
            if (p.speed > 0) {
                p.speed = Math.max(0, p.speed - this.physics.friction);
            } else if (p.speed < 0) {
                p.speed = Math.min(0, p.speed + this.physics.friction);
            }
        }
        
        // ROTATION - IMPROVED
        if (Math.abs(p.speed) > this.physics.minTurnSpeed) {
            const turnAmount = this.physics.turnSpeed * Math.abs(p.speed) / this.physics.maxSpeed;
            if (left) p.angle -= turnAmount;
            if (right) p.angle += turnAmount;
        }
        
        // MOVEMENT
        p.x += Math.cos(p.angle) * p.speed;
        p.z += Math.sin(p.angle) * p.speed;
        
        // TRACK BOUNDARIES - Keep kart on track!
        // Track dimensions: X: -290 to 290, Z: -620 to 40
        // But inner track boundaries are more restrictive
        
        // Bottom straight (Z around 0)
        if (p.z > -50 && p.z < 50) {
            // On bottom straight, restrict X
            if (p.x < -260) {
                p.x = -260;
                p.speed *= 0.5; // Slow down when hitting wall
            }
            if (p.x > 260) {
                p.x = 260;
                p.speed *= 0.5;
            }
        }
        
        // Top straight (Z around -580)
        if (p.z > -620 && p.z < -530) {
            // On top straight, restrict X
            if (p.x < -260) {
                p.x = -260;
                p.speed *= 0.5;
            }
            if (p.x > 260) {
                p.x = 260;
                p.speed *= 0.5;
            }
        }
        
        // Left side (X around -290)
        if (p.x < -220) {
            // On left side, restrict Z
            if (p.z < -620) {
                p.z = -620;
                p.speed *= 0.5;
            }
            if (p.z > 50) {
                p.z = 50;
                p.speed *= 0.5;
            }
        }
        
        // Right side (X around 290)
        if (p.x > 220) {
            // On right side, restrict Z
            if (p.z < -620) {
                p.z = -620;
                p.speed *= 0.5;
            }
            if (p.z > 50) {
                p.z = 50;
                p.speed *= 0.5;
            }
        }
        
        // Outer absolute limits (safety)
        if (p.x < -290) p.x = -290;
        if (p.x > 290) p.x = 290;
        if (p.z < -620) p.z = -620;
        if (p.z > 40) p.z = 40;
        
        // LAP COUNTING - SIMPLIFIED AND RELIABLE
        // Finish line is at x = -180
        // Must be on the track (not on sides)
        const onTrack = p.z > -50 && p.z < 50;
        
        // Check if passed halfway point (right side of track)
        if (p.x > 100 && !p.passedHalfway && onTrack) {
            p.passedHalfway = true;
            console.log('✓✓✓ Passed halfway point - ready for lap completion');
        }
        
        // Simple finish line crossing detection
        // Moving from right (positive) to left (negative) through x = -180
        if (p.passedHalfway && onTrack) {
            // Check if we crossed the finish line
            const crossedLine = p.lastX > -180 && p.x <= -180;
            
            if (crossedLine) {
                p.lap++;
                p.passedHalfway = false;
                
                console.log(`🏁🏁🏁 FINISH LINE CROSSED! Completed lap ${p.lap - 1}!`);
                
                if (p.lap <= 3) {
                    console.log(`   >>> Now on lap ${p.lap}/3`);
                } else if (p.lap === 4) {
                    console.log('🎉🎉🎉 ALL 3 LAPS COMPLETE! TRIGGERING CELEBRATION! 🎉🎉🎉');
                    this.raceFinished = true;
                    this.finishTime = Date.now();
                    p.lap = 3; // Set back to 3 for display
                    this.triggerCelebration();
                }
            }
        }
        
        p.lastX = p.x;
        
        // UPDATE VISUALS - FORCE STABLE ROTATION
        // NOTE: Three.js Y rotation is counterclockwise from above, so we negate the angle
        p.kart.position.set(p.x, p.y, p.z);
        p.kart.rotation.set(0, -p.angle, 0); // NEGATIVE angle to match movement direction
        
        if (p.kart.userData.wheels) {
            p.kart.userData.wheels.forEach(w => {
                w.rotation.z += p.speed * 0.5; // Z axis for rolling (since wheels are rotated X=PI/2)
            });
        }
        
        // Driver sprite faces camera but doesn't affect kart rotation
        if (p.kart.userData.driver) {
            const camDir = new THREE.Vector3();
            this.camera.getWorldDirection(camDir);
            // Driver always visible but kart rotation is independent
        }
        
        // CAMERA
        const camD = 40;
        const camH = 20;
        const camX = p.x - Math.cos(p.angle) * camD;
        const camZ = p.z - Math.sin(p.angle) * camD;
        
        this.camera.position.lerp(new THREE.Vector3(camX, camH, camZ), 0.3);
        
        const lookX = p.x + Math.cos(p.angle) * 18;
        const lookZ = p.z + Math.sin(p.angle) * 18;
        this.camera.lookAt(lookX, 3, lookZ);
        
        // HUD
        const kmh = Math.floor(Math.abs(p.speed * 50));
        document.getElementById('speed-display').textContent = kmh;
        
        // Display current lap (1, 2, or 3)
        const displayLap = Math.min(p.lap, 3);
        document.getElementById('lap-display').textContent = `${displayLap}/3`;
        
        // AI
        this.updateAI();
        
        // Update fireworks
        this.updateFireworks();
        
        // Animate environment (birds, animals, clouds)
        this.animateEnvironment();
        
        // MULTIPLAYER
        if (window.socket) {
            window.socket.emit('playerMove', {
                x: p.x,
                z: p.z,
                angle: p.angle,
                speed: p.speed,
                lap: p.lap
            });
        }
    }
    
    updateAI() {
        Object.values(this.players).forEach(ai => {
            if (!ai.isAI) return;
            
            // Stop AI if they completed all 3 laps
            if (ai.lap >= 4) {
                // Gradually slow down
                ai.speed = Math.max(0, ai.speed - 0.05);
                
                // Update position and visuals
                ai.kart.position.set(ai.x, ai.y, ai.z);
                ai.kart.rotation.y = ai.angle;
                
                // Keep kart visible
                ai.kart.visible = true;
                return;
            }
            
            // AI racing speed - MORE CHALLENGING!
            ai.speed = this.physics.maxSpeed * 0.8; // Increased from 0.5 to 0.8 (80% of player max)
            
            const target = this.waypoints[ai.waypointIndex];
            const dx = target.x - ai.x;
            const dz = target.z - ai.z;
            const targetAngle = Math.atan2(dz, dx);
            
            let diff = targetAngle - ai.angle;
            while (diff > Math.PI) diff -= 2 * Math.PI;
            while (diff < -Math.PI) diff += 2 * Math.PI;
            
            if (Math.abs(diff) > 0.04) {
                ai.angle += Math.sign(diff) * 0.04;
            }
            
            ai.x += Math.cos(ai.angle) * ai.speed;
            ai.z += Math.sin(ai.angle) * ai.speed;
            
            const dist = Math.sqrt(dx*dx + dz*dz);
            if (dist < 35) {
                ai.waypointIndex = (ai.waypointIndex + 1) % this.waypoints.length;
            }
            
            // AI LAP COUNTING - SAME AS PLAYER
            const onTrack = ai.z > -50 && ai.z < 50;
            
            // Check if passed halfway point
            if (ai.x > 100 && !ai.passedHalfway && onTrack) {
                ai.passedHalfway = true;
                console.log(`🤖 ${ai.name} passed halfway point`);
            }
            
            // Simple finish line crossing detection
            if (ai.passedHalfway && onTrack) {
                const crossedLine = ai.lastX > -180 && ai.x <= -180;
                
                if (crossedLine) {
                    ai.lap++;
                    ai.passedHalfway = false;
                    
                    console.log(`🤖 ${ai.name} crossed finish line! Lap ${ai.lap - 1} complete!`);
                    
                    if (ai.lap <= 3) {
                        console.log(`   >>> ${ai.name} now on lap ${ai.lap}/3`);
                    } else if (ai.lap === 4) {
                        console.log(`🤖 ${ai.name} FINISHED THE RACE after 3 laps!`);
                        ai.lap = 3; // Set back to 3 for display
                    }
                }
            }
            
            ai.lastX = ai.x;
            
            // Update visuals - ENSURE VISIBILITY AND STABLE ROTATION
            ai.kart.position.set(ai.x, ai.y, ai.z);
            ai.kart.rotation.set(0, -ai.angle, 0); // NEGATIVE angle to match movement
            ai.kart.visible = true;  // Force visibility
            
            if (ai.kart.userData.wheels) {
                ai.kart.userData.wheels.forEach(w => {
                    w.rotation.z += ai.speed * 0.5;
                });
            }
        });
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        this.update();
        this.renderer.render(this.scene, this.camera);
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

window.RacingGame = RacingGame;
