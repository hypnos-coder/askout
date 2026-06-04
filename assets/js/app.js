/* Lock It In - Full-Screen 3D Heart Scene & Celebration Engine */
/* Background approach adapted from the anniv project: full-bleed Three.js  */
/* scene with UnrealBloomPass, exponential fog, and heart-shaped particles. */

document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const btnYes = document.getElementById("btn-yes");
  const questionSection = document.getElementById("question-section");
  const successSection = document.getElementById("success-section");
  const confettiCanvas = document.getElementById("confetti-canvas");
  const namesOverlay = document.getElementById("names-overlay");

  /* =========================================================================
     1. THREE.JS — FULL-SCREEN SCENE (anniv-style)
     ========================================================================= */
  let scene, camera, renderer, composer;
  let heartMesh, heartParticles;
  let mouseX = 0, mouseY = 0;
  let targetMouseX = 0, targetMouseY = 0;
  const clock = new THREE.Clock();

  // ---- Heart shape path (same parametric as anniv's HeartBox) ----
  function createHeartShape() {
    const shape = new THREE.Shape();
    const x = 0, y = 0;
    shape.moveTo(x + 2.5, y + 2.5);
    shape.bezierCurveTo(x + 2.5, y + 2.5, x + 2.0, y, x, y);
    shape.bezierCurveTo(x - 3.0, y, x - 3.0, y + 3.5, x - 3.0, y + 3.5);
    shape.bezierCurveTo(x - 3.0, y + 5.5, x - 1.0, y + 7.7, x + 2.5, y + 9.5);
    shape.bezierCurveTo(x + 6.0, y + 7.7, x + 8.0, y + 5.5, x + 8.0, y + 3.5);
    shape.bezierCurveTo(x + 8.0, y + 3.5, x + 8.0, y, x + 5.0, y);
    shape.bezierCurveTo(x + 3.0, y, x + 2.5, y + 2.5, x + 2.5, y + 2.5);
    return shape;
  }

  // ---- Heart canvas texture for particles (same as anniv) ----
  function createHeartTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(32, 18);
    ctx.bezierCurveTo(32, 14, 28, 5, 16, 5);
    ctx.bezierCurveTo(0, 5, 0, 25, 0, 25);
    ctx.bezierCurveTo(0, 39, 16, 52, 32, 60);
    ctx.bezierCurveTo(48, 52, 64, 39, 64, 25);
    ctx.bezierCurveTo(64, 25, 64, 5, 48, 5);
    ctx.bezierCurveTo(36, 5, 32, 14, 32, 18);
    ctx.fillStyle = "#ffffff"; // White so material color tints it
    ctx.fill();
    return new THREE.CanvasTexture(canvas);
  }

  // ---- Center any geometry around its bounding box ----
  function centerGeometry(geometry) {
    geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    const offset = new THREE.Vector3()
      .addVectors(box.max, box.min)
      .multiplyScalar(-0.5);
    geometry.translate(offset.x, offset.y, offset.z);
  }

  // ---- Init full-screen scene ----
  function initScene() {
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.04);

    // Camera
    camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 3, 12);
    camera.lookAt(0, 1, 0);

    // Renderer — full-screen, appended to body (not a container div)
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.position = "fixed";
    renderer.domElement.style.top = "0";
    renderer.domElement.style.left = "0";
    renderer.domElement.style.zIndex = "-1";
    document.body.appendChild(renderer.domElement);

    // ---- Lighting (romantic warm tones) ----
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);

    const spot = new THREE.SpotLight(0xffffff, 1);
    spot.position.set(5, 10, 5);
    spot.castShadow = true;
    scene.add(spot);

    // Lavender inner glow
    const innerLight = new THREE.PointLight(0xe0b0ff, 2.5, 30);
    innerLight.position.set(0, 2, 2);
    scene.add(innerLight);

    // Violet rim light
    const rimLight = new THREE.PointLight(0xba87d1, 1.5, 30);
    rimLight.position.set(-4, -2, 4);
    scene.add(rimLight);

    // ---- Bloom postprocessing (same setup as anniv) ----
    const renderPass = new THREE.RenderPass(scene, camera);
    const bloomPass = new THREE.UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5,
      0.4,
      0.85
    );
    bloomPass.threshold = 0.2;
    bloomPass.strength = 1.2;
    bloomPass.radius = 0.6;

    composer = new THREE.EffectComposer(renderer);
    composer.addPass(renderPass);
    composer.addPass(bloomPass);

    // ---- Heart-shaped floating particles (same as anniv) ----
    const particleCount = 300;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 25;
    }
    particleGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );

    const particleMat = new THREE.PointsMaterial({
      color: 0xe0b0ff,
      size: 0.6,
      map: createHeartTexture(),
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    heartParticles = new THREE.Points(particleGeo, particleMat);
    scene.add(heartParticles);

    // ---- Main 3D Extruded Heart Mesh ----
    const heartShape = createHeartShape();
    const extrudeSettings = {
      depth: 1.8,
      bevelEnabled: true,
      bevelSegments: 5,
      steps: 2,
      bevelSize: 0.3,
      bevelThickness: 0.3,
      curveSegments: 24,
    };
    const heartGeo = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
    centerGeometry(heartGeo);

    const heartMat = new THREE.MeshPhysicalMaterial({
      color: 0x4a0e4a,
      metalness: 0.2,
      roughness: 0.4,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      emissive: 0x220522,
      emissiveIntensity: 0.3,
      side: THREE.DoubleSide,
    });

    heartMesh = new THREE.Mesh(heartGeo, heartMat);
    heartMesh.scale.set(0.4, 0.4, 0.4);
    heartMesh.rotation.x = Math.PI; // Flip upright
    heartMesh.position.set(0, 1, 0);
    scene.add(heartMesh);

    // ---- Resize handler ----
    window.addEventListener("resize", () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
    });

    // ---- Mouse parallax ----
    window.addEventListener("mousemove", (e) => {
      targetMouseX = (e.clientX - window.innerWidth / 2) * 0.02;
      targetMouseY = (e.clientY - window.innerHeight / 2) * 0.02;
    });

    // Start render loop
    animate();
  }

  // ---- Animation loop ----
  function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();

    // Smooth camera parallax
    mouseX += (targetMouseX - mouseX) * 0.04;
    mouseY += (targetMouseY - mouseY) * 0.04;
    camera.position.x = mouseX;
    camera.position.y = 3 - mouseY * 0.3;
    camera.lookAt(0, 1, 0);

    // Heart: gentle hover and slow rotation (same feel as anniv gift box float)
    heartMesh.position.y = 1 + Math.sin(time * 0.8) * 0.3;
    heartMesh.rotation.y += 0.006;
    heartMesh.rotation.z = Math.sin(time * 0.5) * 0.08;

    // Heart particles: slow drift downward and rotate (same as anniv)
    heartParticles.rotation.y += 0.001;
    heartParticles.position.y -= 0.005;
    if (heartParticles.position.y < -5) heartParticles.position.y = 5;

    // Render with bloom
    composer.render();
  }

  // Boot the 3D scene
  initScene();

  /* =========================================================================
     2. WHITE TULIP PHYSICS EXPLOSION SYSTEM
     ========================================================================= */
  let confettiParticles = [];
  let isConfettiRunning = false;
  const ctxConfetti = confettiCanvas.getContext("2d");

  function resizeConfettiCanvas() {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resizeConfettiCanvas);
  resizeConfettiCanvas();

  // Helper to draw a beautiful 2D white tulip on canvas
  function drawTulip(ctx, size, color) {
    ctx.save();
    
    // Create a beautiful white-to-soft-pink/lavender gradient inside each tulip
    const grad = ctx.createLinearGradient(0, -size * 0.5, 0, size * 0.5);
    grad.addColorStop(0, "#ffffff"); // Pure white tip
    grad.addColorStop(0.65, color);  // Curated white shade (lavender blush, alabaster, etc.)
    grad.addColorStop(1, "#ebdceb");   // Soft lavender base
    ctx.fillStyle = grad;

    // Draw the Tulip petals using Bezier curves
    // Left petal
    ctx.beginPath();
    ctx.moveTo(0, size * 0.4);
    ctx.bezierCurveTo(-size * 0.45, size * 0.25, -size * 0.45, -size * 0.2, -size * 0.2, -size * 0.45);
    ctx.bezierCurveTo(-size * 0.1, -size * 0.2, -size * 0.05, 0, 0, size * 0.4);
    ctx.closePath();
    ctx.fill();

    // Right petal
    ctx.beginPath();
    ctx.moveTo(0, size * 0.4);
    ctx.bezierCurveTo(size * 0.45, size * 0.25, size * 0.45, -size * 0.2, size * 0.2, -size * 0.45);
    ctx.bezierCurveTo(size * 0.1, -size * 0.2, size * 0.05, 0, 0, size * 0.4);
    ctx.closePath();
    ctx.fill();

    // Center petal
    ctx.beginPath();
    ctx.moveTo(0, size * 0.4);
    ctx.bezierCurveTo(-size * 0.12, -size * 0.1, -size * 0.08, -size * 0.5, 0, -size * 0.55);
    ctx.bezierCurveTo(size * 0.08, -size * 0.5, size * 0.12, -size * 0.1, 0, size * 0.4);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  function triggerConfettiExplosion(sourceX, sourceY) {
    const count = 120; // Slightly lower count for clean petal physics
    const colors = [
      "#ffffff", // Pure white
      "#fff0f5", // Lavender blush
      "#fdfaf6", // Alabaster/Pearl
      "#fffaf0", // Floral white
      "#fcf6f5", // Soft rose-white
      "#f9f1f6"  // Lilac white
    ];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 8; // Gentler launch speeds

      confettiParticles.push({
        x: sourceX,
        y: sourceY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        size: 10 + Math.random() * 10, // Larger size to make shape visible
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI,
        rotationSpeed: -0.05 + Math.random() * 0.1, // Slower rotation
        opacity: 1,
        fadeSpeed: 0.003 + Math.random() * 0.005, // Slower fading
        gravity: 0.06 + Math.random() * 0.04, // Flutter down slowly
        drag: 0.97 + Math.random() * 0.01,
      });
    }

    if (!isConfettiRunning) {
      isConfettiRunning = true;
      runConfettiLoop();
    }
  }

  function runConfettiLoop() {
    if (!isConfettiRunning) return;
    ctxConfetti.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

    for (let i = confettiParticles.length - 1; i >= 0; i--) {
      const p = confettiParticles[i];

      p.vx *= p.drag;
      p.vy *= p.drag;
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;
      p.opacity -= p.fadeSpeed;

      ctxConfetti.save();
      ctxConfetti.globalAlpha = p.opacity;
      ctxConfetti.translate(p.x, p.y);
      ctxConfetti.rotate(p.rotation);

      // Draw the beautiful white tulip shape
      drawTulip(ctxConfetti, p.size, p.color);

      ctxConfetti.restore();

      if (p.opacity <= 0 || p.y > confettiCanvas.height) {
        confettiParticles.splice(i, 1);
      }
    }

    if (confettiParticles.length > 0) {
      requestAnimationFrame(runConfettiLoop);
    } else {
      isConfettiRunning = false;
      ctxConfetti.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }
  }

  /* =========================================================================
     3. YES BUTTON — SUCCESS STATE TRANSITION
     ========================================================================= */
  
  // Heart-shaped white tulip explosion!
  function triggerHeartConfettiExplosion(sourceX, sourceY) {
    const count = 180; // Elegant heart-shaped petal release
    const colors = [
      "#ffffff", // Pure white
      "#fff0f5", // Lavender blush
      "#fdfaf6", // Alabaster/Pearl
      "#fff5f7", // Cherry blossom white
      "#f9f1f6", // Lilac white
      "#fdf6f5"  // Soft rose-white
    ];

    for (let i = 0; i < count; i++) {
      // Parametric theta from 0 to 2*PI
      const theta = Math.random() * Math.PI * 2;
      // Heart curve vectors
      const hx = 16 * Math.pow(Math.sin(theta), 3);
      const hy = -(13 * Math.cos(theta) - 5 * Math.cos(2 * theta) - 2 * Math.cos(3 * theta) - Math.cos(4 * theta));

      // Scale vector and add randomness for beautiful dispersion
      const speedFactor = 0.18 + Math.random() * 0.35;
      const vx = hx * speedFactor;
      const vy = hy * speedFactor - 1.0; // Slight upward velocity boost

      confettiParticles.push({
        x: sourceX,
        y: sourceY,
        vx: vx,
        vy: vy,
        size: 10 + Math.random() * 8, // Prominent petal sizing
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI,
        rotationSpeed: -0.06 + Math.random() * 0.12,
        opacity: 1,
        fadeSpeed: 0.0025 + Math.random() * 0.004, // Elegant long trails
        gravity: 0.05 + Math.random() * 0.03, // Floating descent
        drag: 0.975 + Math.random() * 0.01
      });
    }

    if (!isConfettiRunning) {
      isConfettiRunning = true;
      runConfettiLoop();
    }
  }

  btnYes.addEventListener("click", (e) => {
    // Start music on accept
    playMusic();

    // 1. Zoom the 3D background camera in dramatically during the transition
    if (camera) {
      // Lerp camera position.z down to 8 to bring the 3D glowing heart closer to the screen!
      let zoomInterval = setInterval(() => {
        if (camera.position.z > 7.5) {
          camera.position.z -= 0.15;
        } else {
          clearInterval(zoomInterval);
        }
      }, 16);
    }

    // 2. Smoothly fade out the primary question section
    questionSection.classList.remove("active");
    questionSection.style.transform = "scale(0.85) translateY(-15px)";

    setTimeout(() => {
      questionSection.classList.add("hidden");
      
      // 3. Initiate flying names collision sequence
      namesOverlay.classList.remove("hidden");
      
      // Force layout recalculation to ensure transition works
      namesOverlay.offsetHeight; 
      
      namesOverlay.classList.add("active");

      // 4. Collision at t = 1200ms
      setTimeout(() => {
        namesOverlay.classList.add("collided");

        // Center coordinates of viewport
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        // Massive exploding love-shape confetti explosion!
        triggerHeartConfettiExplosion(centerX, centerY);

        // 5. Final Schedule reveal at t = 2400ms
        setTimeout(() => {
          namesOverlay.classList.add("hidden");
          successSection.classList.remove("hidden");

          // Force reflow
          successSection.offsetHeight;
          successSection.classList.add("active");

          // Start emitting romantic floating hearts inside the card
          startSuccessHearts();

          // Grand corner firework celebration
          setTimeout(() => triggerConfettiExplosion(100, window.innerHeight - 100), 200);
          setTimeout(() => triggerConfettiExplosion(window.innerWidth - 100, window.innerHeight - 100), 400);

          // Small sparkles loop near the checkmark badge
          const badgeElement = document.querySelector(".success-badge");
          if (badgeElement) {
            const badgeRect = badgeElement.getBoundingClientRect();
            const celebrationInterval = setInterval(() => {
              if (Math.random() > 0.45) {
                triggerConfettiExplosion(
                  badgeRect.left + badgeRect.width / 2 + (Math.random() - 0.5) * 40,
                  badgeRect.top + badgeRect.height / 2
                );
              }
            }, 1200);

            // Clean up loop after 8s
            setTimeout(() => clearInterval(celebrationInterval), 8000);
          }

        }, 1200);

      }, 1200);

    }, 450);
  });

  /* =========================================================================
     4. BACKGROUND MUSIC & AUDIO CONTROLLER
     ========================================================================= */
  const bgMusic = document.getElementById("bg-music");
  const musicCard = document.getElementById("music-card");
  const musicToggle = document.getElementById("btn-music-toggle");
  const musicIcon = musicToggle.querySelector(".music-icon");
  const musicWaves = musicToggle.querySelector(".music-waves");

  let musicStarted = false;

  function playMusic() {
    if (bgMusic && bgMusic.paused) {
      bgMusic.play().then(() => {
        musicStarted = true;
        if (musicCard) musicCard.classList.add("playing");
        musicIcon.classList.add("hidden");
        musicWaves.classList.remove("hidden");
      }).catch(err => {
        console.log("Autoplay blocked by browser. Awaiting gesture:", err);
      });
    }
  }

  function pauseMusic() {
    if (bgMusic && !bgMusic.paused) {
      bgMusic.pause();
      if (musicCard) musicCard.classList.remove("playing");
      musicIcon.classList.remove("hidden");
      musicWaves.classList.add("hidden");
    }
  }

  // Toggle button click handler
  if (musicToggle) {
    musicToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      if (bgMusic && bgMusic.paused) {
        playMusic();
      } else {
        pauseMusic();
      }
    });
  }

  // Attempt to play music immediately upon entering the website
  playMusic();

  // Autoplay fallback: start music on any interaction (click or touch) on the document if blocked
  const playAudioOnGesture = () => {
    playMusic();
    document.removeEventListener("click", playAudioOnGesture);
    document.removeEventListener("touchstart", playAudioOnGesture);
  };

  document.addEventListener("click", playAudioOnGesture);
  document.addEventListener("touchstart", playAudioOnGesture, { passive: true });

  /* =========================================================================
     5. ROMANTIC FLOATING HEARTS EMITTER
     ========================================================================= */
  function startSuccessHearts() {
    const card = document.getElementById("main-card");
    if (!card) return;

    // Create a container for the success hearts
    const heartsContainer = document.createElement("div");
    heartsContainer.className = "success-hearts-container";
    card.appendChild(heartsContainer);

    // Continuous spawn of romantic floating hearts
    setInterval(() => {
      if (successSection.classList.contains("hidden")) return;

      const heart = document.createElement("span");
      heart.className = "floating-heart-particle";
      heart.innerHTML = Math.random() > 0.5 ? "❤️" : "💖";
      
      const size = 12 + Math.random() * 16;
      const left = Math.random() * 100;
      const duration = 4 + Math.random() * 3;
      const opacity = 0.2 + Math.random() * 0.4;
      
      heart.style.left = `${left}%`;
      heart.style.fontSize = `${size}px`;
      heart.style.setProperty("--op", opacity);
      heart.style.animationDuration = `${duration}s`;
      
      heartsContainer.appendChild(heart);

      setTimeout(() => {
        heart.remove();
      }, duration * 1000);
    }, 450);
  }

});

/* =========================================================================
   6. ITINERARY MAP + AGENTS ANIMATION
   Replaces vertical timeline with a gameboard-style SVG map and two agents moving together.
   ========================================================================= */
/* =========================================================================
   6. ITINERARY MAP + AGENTS ANIMATION
   Replaces vertical timeline with an interactive curved SVG map and two agents moving together.
   ========================================================================= */
document.addEventListener('DOMContentLoaded', () => {
  const svg = document.getElementById('itinerary-svg');
  if (!svg) return;

  const places = [
    { title: 'Como Garden', desc: 'Morning 10:30', icon: '🌿' },
    { title: 'Mystery Stop', desc: 'Afternoon 14:00', icon: '🎁' },
    { title: 'Dinner & Drinks', desc: 'Evening 19:30', icon: '🍽️' }
  ];

  // Coordinates of pins directly on the path
  const coords = [
    { x: 150, y: 220 },
    { x: 400, y: 290 },
    { x: 650, y: 220 }
  ];

  // Floating coordinates for card labels
  const cardCoords = [
    { x: 150, y: 130 },
    { x: 400, y: 365 },
    { x: 650, y: 130 }
  ];

  const ns = 'http://www.w3.org/2000/svg';
  const defs = document.createElementNS(ns, 'defs');

  // --- Gradients ---
  // Route track gradient
  const grad = document.createElementNS(ns, 'linearGradient');
  grad.setAttribute('id', 'route-grad');
  grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
  grad.setAttribute('x2', '100%'); grad.setAttribute('y2', '0%');
  const stop1 = document.createElementNS(ns, 'stop'); stop1.setAttribute('offset', '0%'); stop1.setAttribute('stop-color', '#ff4b8b');
  const stop2 = document.createElementNS(ns, 'stop'); stop2.setAttribute('offset', '50%'); stop2.setAttribute('stop-color', '#9b51e0');
  const stop3 = document.createElementNS(ns, 'stop'); stop3.setAttribute('offset', '100%'); stop3.setAttribute('stop-color', '#ffd700');
  grad.appendChild(stop1);
  grad.appendChild(stop2);
  grad.appendChild(stop3);
  defs.appendChild(grad);

  // Amen avatar gradient (Indigo to Pink)
  const gradA = document.createElementNS(ns, 'linearGradient');
  gradA.setAttribute('id', 'agent-a-grad');
  gradA.setAttribute('x1', '0%'); gradA.setAttribute('y1', '0%');
  gradA.setAttribute('x2', '100%'); gradA.setAttribute('y2', '100%');
  const stopA1 = document.createElementNS(ns, 'stop'); stopA1.setAttribute('offset', '0%'); stopA1.setAttribute('stop-color', '#4b6cb7');
  const stopA2 = document.createElementNS(ns, 'stop'); stopA2.setAttribute('offset', '100%'); stopA2.setAttribute('stop-color', '#ff4b8b');
  gradA.appendChild(stopA1);
  gradA.appendChild(stopA2);
  defs.appendChild(gradA);

  // Rejoyce avatar gradient (Pink to Gold)
  const gradB = document.createElementNS(ns, 'linearGradient');
  gradB.setAttribute('id', 'agent-b-grad');
  gradB.setAttribute('x1', '0%'); gradB.setAttribute('y1', '0%');
  gradB.setAttribute('x2', '100%'); gradB.setAttribute('y2', '100%');
  const stopB1 = document.createElementNS(ns, 'stop'); stopB1.setAttribute('offset', '0%'); stopB1.setAttribute('stop-color', '#ff4b8b');
  const stopB2 = document.createElementNS(ns, 'stop'); stopB2.setAttribute('offset', '100%'); stopB2.setAttribute('stop-color', '#ffd700');
  gradB.appendChild(stopB1);
  gradB.appendChild(stopB2);
  defs.appendChild(gradB);

  // --- Glow Filter ---
  const routeGlow = document.createElementNS(ns, 'filter');
  routeGlow.setAttribute('id', 'route-glow');
  const feBlur = document.createElementNS(ns, 'feGaussianBlur');
  feBlur.setAttribute('stdDeviation', '4');
  feBlur.setAttribute('result', 'blur');
  routeGlow.appendChild(feBlur);
  defs.appendChild(routeGlow);

  svg.appendChild(defs);

  // --- Decorative Landmarks (Background) ---
  // Clouds
  const cloud1 = document.createElementNS(ns, 'text');
  cloud1.setAttribute('class', 'map-cloud');
  cloud1.setAttribute('x', '0'); cloud1.setAttribute('y', '50');
  cloud1.style.fontSize = '24px';
  cloud1.textContent = '☁️';
  svg.appendChild(cloud1);

  const cloud2 = document.createElementNS(ns, 'text');
  cloud2.setAttribute('class', 'map-cloud');
  cloud2.setAttribute('x', '0'); cloud2.setAttribute('y', '110');
  cloud2.style.fontSize = '18px';
  cloud2.style.animationDelay = '-22s';
  cloud2.style.animationDuration = '50s';
  cloud2.textContent = '☁️';
  svg.appendChild(cloud2);

  // Compass Rose (Top-Right)
  const compassGroup = document.createElementNS(ns, 'g');
  compassGroup.setAttribute('class', 'map-compass');
  compassGroup.setAttribute('transform', 'translate(740, 65)');
  
  const compCircle1 = document.createElementNS(ns, 'circle');
  compCircle1.setAttribute('r', '22'); compCircle1.setAttribute('fill', 'none');
  compCircle1.setAttribute('stroke', 'rgba(255, 215, 0, 0.15)'); compCircle1.setAttribute('stroke-width', '1.5');
  compassGroup.appendChild(compCircle1);

  const compCircle2 = document.createElementNS(ns, 'circle');
  compCircle2.setAttribute('r', '18'); compCircle2.setAttribute('fill', 'none');
  compCircle2.setAttribute('stroke', 'rgba(255, 215, 0, 0.3)'); compCircle2.setAttribute('stroke-width', '1');
  compCircle2.setAttribute('stroke-dasharray', '3 3');
  compassGroup.appendChild(compCircle2);

  const compNeedle = document.createElementNS(ns, 'polygon');
  compNeedle.setAttribute('points', '0,-16 4,-4 16,0 4,4 0,16 -4,4 -16,0 -4,-4');
  compNeedle.setAttribute('fill', 'url(#lock-gold-gradient)');
  compassGroup.appendChild(compNeedle);

  const compCenter = document.createElementNS(ns, 'circle');
  compCenter.setAttribute('r', '3.5'); compCenter.setAttribute('fill', '#ffffff');
  compassGroup.appendChild(compCenter);
  svg.appendChild(compassGroup);

  // Mini-Landmarks
  const landmarks = [
    { x: 90, y: 200, emoji: '🌳' },
    { x: 190, y: 250, emoji: '🌸' },
    { x: 350, y: 260, emoji: '✨' },
    { x: 450, y: 310, emoji: '🎈' },
    { x: 600, y: 250, emoji: '🌹' },
    { x: 700, y: 200, emoji: '🥂' }
  ];
  landmarks.forEach(lm => {
    const el = document.createElementNS(ns, 'text');
    el.setAttribute('x', String(lm.x));
    el.setAttribute('y', String(lm.y));
    el.setAttribute('opacity', '0.45');
    el.style.fontSize = '16px';
    el.style.pointerEvents = 'none';
    el.textContent = lm.emoji;
    svg.appendChild(el);
  });

  // --- Beautiful Bezier Scenic Curved Path ---
  // A smooth winding curve connecting Como Garden (150, 220), Mystery Stop (400, 290), Dinner (650, 220)
  const pathD = "M 150 220 C 270 160, 280 290, 400 290 C 520 290, 530 160, 650 220";

  const glowPath = document.createElementNS(ns, 'path');
  glowPath.setAttribute('d', pathD);
  glowPath.setAttribute('class', 'map-path-glow');
  glowPath.setAttribute('filter', 'url(#route-glow)');
  glowPath.setAttribute('stroke', 'rgba(255,255,255,0.05)');
  svg.appendChild(glowPath);

  const routePath = document.createElementNS(ns, 'path');
  routePath.setAttribute('d', pathD);
  routePath.setAttribute('class', 'map-path');
  routePath.setAttribute('stroke', 'url(#route-grad)');
  svg.appendChild(routePath);

  // --- Node Pins & Cards Setup ---
  const cardGroups = [];
  coords.forEach((coord, index) => {
    const cardCoord = cardCoords[index];

    // Decorative anchor line connecting pin to floating label card
    const anchor = document.createElementNS(ns, 'line');
    anchor.setAttribute('x1', String(coord.x));
    anchor.setAttribute('y1', String(coord.y));
    anchor.setAttribute('x2', String(cardCoord.x));
    anchor.setAttribute('y2', String(cardCoord.y));
    anchor.setAttribute('stroke', 'rgba(255, 255, 255, 0.12)');
    anchor.setAttribute('stroke-width', '1.5');
    anchor.setAttribute('stroke-dasharray', '3 3');
    svg.appendChild(anchor);

    // Pin Group (drawn on path)
    const pinGroup = document.createElementNS(ns, 'g');
    pinGroup.setAttribute('transform', `translate(${coord.x}, ${coord.y})`);

    const ring = document.createElementNS(ns, 'circle');
    ring.setAttribute('class', 'map-node-ring');
    ring.setAttribute('r', '11');
    pinGroup.appendChild(ring);

    const dot = document.createElementNS(ns, 'circle');
    dot.setAttribute('class', 'map-node-dot');
    dot.setAttribute('r', '5.5');
    if (index === 0) dot.style.fill = '#ff4b8b';
    if (index === 1) dot.style.fill = '#9b51e0';
    if (index === 2) dot.style.fill = '#ffd700';
    pinGroup.appendChild(dot);
    svg.appendChild(pinGroup);

    // Floating glassmorphic card bubble
    const group = document.createElementNS(ns, 'g');
    group.setAttribute('class', 'map-node-card');
    group.setAttribute('transform', `translate(${cardCoord.x}, ${cardCoord.y})`);

    const card = document.createElementNS(ns, 'rect');
    card.setAttribute('x', '-80');
    card.setAttribute('y', '-28');
    card.setAttribute('rx', '14');
    card.setAttribute('ry', '14');
    card.setAttribute('width', '160');
    card.setAttribute('height', '56');
    group.appendChild(card);

    const icon = document.createElementNS(ns, 'text');
    icon.setAttribute('class', 'map-node-icon');
    icon.setAttribute('x', '-60');
    icon.setAttribute('y', '6');
    icon.textContent = places[index].icon;
    group.appendChild(icon);

    const title = document.createElementNS(ns, 'text');
    title.setAttribute('class', 'map-node-title');
    title.setAttribute('x', '-35');
    title.setAttribute('y', '-4');
    title.setAttribute('text-anchor', 'start');
    title.textContent = places[index].title;
    group.appendChild(title);

    const desc = document.createElementNS(ns, 'text');
    desc.setAttribute('class', 'map-node-desc');
    desc.setAttribute('x', '-35');
    desc.setAttribute('y', '13');
    desc.setAttribute('text-anchor', 'start');
    desc.textContent = places[index].desc;
    group.appendChild(desc);

    svg.appendChild(group);
    cardGroups.push(group);
  });

  // --- Speech Bubble Setup (midpoint floating text) ---
  const bubble = document.createElementNS(ns, 'g');
  bubble.setAttribute('class', 'agent-bubble');

  const bubbleContent = document.createElementNS(ns, 'g');
  bubbleContent.setAttribute('class', 'agent-bubble-content');

  const bubbleBg = document.createElementNS(ns, 'path');
  bubbleBg.setAttribute('class', 'agent-bubble-bg');
  // Speech bubble path (160 width, 42 height, pointed down in center)
  bubbleBg.setAttribute('d', 'M -80 -46 h 160 a 6 6 0 0 1 6 6 v 30 a 6 6 0 0 1 -6 6 h -74 l -6 6 l -6 -6 h -74 a 6 6 0 0 1 -6 -6 v -30 a 6 6 0 0 1 6 -6 z');
  bubbleContent.appendChild(bubbleBg);

  const bubbleText = document.createElementNS(ns, 'text');
  bubbleText.setAttribute('class', 'agent-bubble-text');
  bubbleText.setAttribute('y', '-25');
  bubbleText.textContent = '';
  bubbleContent.appendChild(bubbleText);
  
  bubble.appendChild(bubbleContent);
  svg.appendChild(bubble);

  // --- Agents Setup ---
  function makeAgent(id, gradId, label, initial) {
    const agent = document.createElementNS(ns, 'g');
    agent.setAttribute('class', 'agent');
    agent.setAttribute('id', id);

    const shadow = document.createElementNS(ns, 'circle');
    shadow.setAttribute('class', 'map-agent-shadow');
    shadow.setAttribute('cx', '0');
    shadow.setAttribute('cy', '18');
    shadow.setAttribute('r', '13');
    agent.appendChild(shadow);

    const pulse = document.createElementNS(ns, 'circle');
    pulse.setAttribute('class', 'agent-pulse-ring');
    pulse.setAttribute('r', '17');
    agent.appendChild(pulse);

    const circle = document.createElementNS(ns, 'circle');
    circle.setAttribute('class', 'agent-avatar-bg');
    circle.setAttribute('r', '13');
    circle.setAttribute('fill', `url(#${gradId})`);
    agent.appendChild(circle);

    const textInit = document.createElementNS(ns, 'text');
    textInit.setAttribute('class', 'agent-avatar-text');
    textInit.textContent = initial;
    agent.appendChild(textInit);

    const textLabel = document.createElementNS(ns, 'text');
    textLabel.setAttribute('class', 'agent-label');
    textLabel.setAttribute('y', '20');
    textLabel.textContent = label;
    agent.appendChild(textLabel);

    svg.appendChild(agent);
    return agent;
  }

  const agentA = makeAgent('agent-a', 'agent-a-grad', 'Amen', 'A');
  const agentB = makeAgent('agent-b', 'agent-b-grad', 'Rejoyce', 'R');

  // --- Heart Particle Emitter ---
  let lastHeartTime = 0;
  function emitNodeHeart(x, y) {
    const now = performance.now();
    if (now - lastHeartTime < 450) return; // rate limit
    lastHeartTime = now;

    const heart = document.createElementNS(ns, 'text');
    heart.setAttribute('x', String(x + (Math.random() - 0.5) * 15));
    heart.setAttribute('y', String(y - 12));
    heart.style.fontSize = `${10 + Math.random() * 8}px`;
    heart.style.fill = '#ff4b8b';
    heart.style.opacity = '0.9';
    heart.style.pointerEvents = 'none';
    heart.style.transition = 'transform 2.2s cubic-bezier(0.1, 0.8, 0.3, 1), opacity 2.2s ease-out';
    heart.textContent = Math.random() > 0.5 ? '❤️' : '💖';
    
    // insert right before bubble to stay in background
    svg.insertBefore(heart, bubble);

    // Force reflow
    heart.getBoundingClientRect();

    const tx = (Math.random() - 0.5) * 45;
    const ty = -65 - Math.random() * 35;
    heart.style.transform = `translate(${tx}px, ${ty}px) scale(0.6)`;
    heart.style.opacity = '0';

    setTimeout(() => {
      heart.remove();
    }, 2200);
  }

  // --- Path Animation & Narrative State Machine ---
  const pathLen = routePath.getTotalLength();
  
  // automatic narrative loop timetable (32 seconds total)
  function getTimelineState(timeMs) {
    const cycle = (timeMs / 1000) % 32;
    if (cycle < 4) {
      return { phase: 'pause', nodeIndex: 0, progress: 0.0, text: "Como Garden first! 🌿" };
    } else if (cycle < 10) {
      // Walk 0 -> 1. Duration: 6s.
      const t = (cycle - 4) / 6;
      return { phase: 'walk', from: 0, to: 1, progress: t * 0.5 };
    } else if (cycle < 14) {
      return { phase: 'pause', nodeIndex: 1, progress: 0.5, text: "What is the surprise? 🎁" };
    } else if (cycle < 20) {
      // Walk 1 -> 2. Duration: 6s.
      const t = (cycle - 14) / 6;
      return { phase: 'walk', from: 1, to: 2, progress: 0.5 + t * 0.5 };
    } else if (cycle < 24) {
      return { phase: 'pause', nodeIndex: 2, progress: 1.0, text: "Dinner & Wine! 🥂" };
    } else if (cycle < 28) {
      // Walk 2 -> 1 (reverse). Duration: 4s.
      const t = (cycle - 20) / 4;
      return { phase: 'walk', from: 2, to: 1, progress: 1.0 - t * 0.5 };
    } else {
      // Walk 1 -> 0 (reverse). Duration: 4s.
      const t = (cycle - 28) / 4;
      return { phase: 'walk', from: 1, to: 0, progress: 0.5 - t * 0.5 };
    }
  }

  function positionOnPath(progress) {
    const length = Math.max(0, Math.min(progress, 1)) * pathLen;
    const point = routePath.getPointAtLength(length);
    
    // Find nearby point for tangent direction
    const delta = length > pathLen - 2 ? -2 : 2;
    const nextPoint = routePath.getPointAtLength(length + delta);
    
    let dx = nextPoint.x - point.x;
    let dy = nextPoint.y - point.y;
    if (delta < 0) {
      dx = -dx;
      dy = -dy;
    }
    
    const distance = Math.hypot(dx, dy) || 1;
    const tangent = { x: dx / distance, y: dy / distance };
    const perp = { x: -tangent.y, y: tangent.x };
    return { x: point.x, y: point.y, perp };
  }

  let currentProgress = 0.0;
  let isManualMode = false;
  let manualTargetNode = 0;
  let manualIdleTimer = null;

  // Clicking a card routes agents there
  cardGroups.forEach((cardGroup, index) => {
    cardGroup.addEventListener('click', () => {
      isManualMode = true;
      manualTargetNode = index;
      
      if (manualIdleTimer) clearTimeout(manualIdleTimer);
      
      // Auto tour resumes after 10 seconds of idle
      manualIdleTimer = setTimeout(() => {
        isManualMode = false;
      }, 10000);
    });
  });

  function animate() {
    const now = performance.now();
    let targetProgress = 0.0;
    let phase = 'walk';
    let bubbleText = '';
    let activeNode = -1;

    if (isManualMode) {
      const targetProgressMap = [0.0, 0.5, 1.0];
      const destProgress = targetProgressMap[manualTargetNode];
      const diff = destProgress - currentProgress;
      
      if (Math.abs(diff) < 0.004) {
        currentProgress = destProgress;
        phase = 'pause';
        activeNode = manualTargetNode;
        const manualTexts = [
          "Let's visit Como Garden! 🌿",
          "What is the Mystery Stop? 🎁",
          "Yay, Dinner & Drinks! 🥂"
        ];
        bubbleText = manualTexts[manualTargetNode];
      } else {
        // Move towards target
        currentProgress += Math.sign(diff) * 0.005;
        phase = 'walk';
      }
    } else {
      const state = getTimelineState(now);
      const diff = state.progress - currentProgress;

      // Smoothly catch up when resuming from manual mode
      if (Math.abs(diff) > 0.01) {
        currentProgress += Math.sign(diff) * 0.005;
        phase = 'walk';
      } else {
        currentProgress = state.progress;
        phase = state.phase;
        if (phase === 'pause') {
          activeNode = state.nodeIndex;
          bubbleText = state.text;
        }
      }
    }

    // Set active states on cards
    cardGroups.forEach((cardGroup, idx) => {
      if (idx === activeNode) {
        cardGroup.classList.add('active');
      } else {
        cardGroup.classList.remove('active');
      }
    });

    // Compute base coordinate on curve
    const pos = positionOnPath(currentProgress);
    
    // Perpendicular side offsets for side-by-side walk (14px apart)
    const side = 14;
    let posX_A = pos.x + pos.perp.x * side;
    let posY_A = pos.y + pos.perp.y * side;
    let posX_B = pos.x - pos.perp.x * side;
    let posY_B = pos.y - pos.perp.y * side;

    // Apply vertical stepping bob animation while walking
    if (phase === 'walk') {
      const bobA = Math.abs(Math.sin(now * 0.012)) * 5;
      const bobB = Math.abs(Math.sin(now * 0.012 + Math.PI / 2)) * 5;
      posY_A -= bobA;
      posY_B -= bobB;
    }

    // Set agent transforms
    agentA.setAttribute('transform', `translate(${posX_A}, ${posY_A})`);
    agentB.setAttribute('transform', `translate(${posX_B}, ${posY_B})`);

    // Manage bubble speech popup
    if (phase === 'pause' && activeNode !== -1) {
      const midX = (posX_A + posX_B) / 2;
      const midY = Math.min(posY_A, posY_B) - 24;
      bubble.setAttribute('transform', `translate(${midX}, ${midY})`);
      bubble.querySelector('.agent-bubble-text').textContent = bubbleText;
      bubble.classList.add('visible');
      
      // Emit hearts from pin coordinate
      const nodeCoord = coords[activeNode];
      emitNodeHeart(nodeCoord.x, nodeCoord.y);
    } else {
      bubble.classList.remove('visible');
    }

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
});

