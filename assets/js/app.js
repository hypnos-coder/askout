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
     2. CONFETTI PHYSICS SYSTEM
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

  function triggerConfettiExplosion(sourceX, sourceY) {
    const count = 180;
    const colors = [
      "#ff4b8b",
      "#ff85b3",
      "#9b51e0",
      "#ffd700",
      "#ffffff",
      "#00e5ff",
    ];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 12;

      confettiParticles.push({
        x: sourceX,
        y: sourceY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4,
        size: 5 + Math.random() * 9,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: Math.random() > 0.4 ? "rect" : "circle",
        rotation: Math.random() * Math.PI,
        rotationSpeed: -0.1 + Math.random() * 0.2,
        opacity: 1,
        fadeSpeed: 0.005 + Math.random() * 0.01,
        gravity: 0.18 + Math.random() * 0.1,
        drag: 0.96 + Math.random() * 0.02,
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
      ctxConfetti.fillStyle = p.color;

      if (p.shape === "rect") {
        ctxConfetti.fillRect(
          -p.size / 2,
          -p.size / 2,
          p.size,
          p.size * 1.5
        );
      } else {
        ctxConfetti.beginPath();
        ctxConfetti.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctxConfetti.fill();
      }
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
  
  // Heart-shaped confetti explosion using mathematical parametric formulas!
  function triggerHeartConfettiExplosion(sourceX, sourceY) {
    const count = 260; // Massive heart explosion
    const colors = [
      "#ff4b8b",
      "#ff85b3",
      "#9b51e0",
      "#ffd700",
      "#ffffff",
      "#ff1a53",
      "#00e5ff"
    ];

    for (let i = 0; i < count; i++) {
      // Parametric theta from 0 to 2*PI
      const theta = Math.random() * Math.PI * 2;
      // Heart curve vectors
      const hx = 16 * Math.pow(Math.sin(theta), 3);
      const hy = -(13 * Math.cos(theta) - 5 * Math.cos(2 * theta) - 2 * Math.cos(3 * theta) - Math.cos(4 * theta));

      // Scale vector and add randomness for beautiful dispersion
      const speedFactor = 0.22 + Math.random() * 0.45;
      const vx = hx * speedFactor;
      const vy = hy * speedFactor - 1.5; // Slight upward velocity boost

      confettiParticles.push({
        x: sourceX,
        y: sourceY,
        vx: vx,
        vy: vy,
        size: 5 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: Math.random() > 0.35 ? "rect" : "circle",
        rotation: Math.random() * Math.PI,
        rotationSpeed: -0.1 + Math.random() * 0.2,
        opacity: 1,
        fadeSpeed: 0.0035 + Math.random() * 0.006, // Slightly longer trail
        gravity: 0.13 + Math.random() * 0.07, // Float down elegantly
        drag: 0.965 + Math.random() * 0.015
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
  const musicToggle = document.getElementById("btn-music-toggle");
  const musicIcon = musicToggle.querySelector(".music-icon");
  const musicWaves = musicToggle.querySelector(".music-waves");

  let musicStarted = false;

  function playMusic() {
    if (bgMusic && bgMusic.paused) {
      bgMusic.play().then(() => {
        musicStarted = true;
        musicToggle.classList.add("playing");
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
      musicToggle.classList.remove("playing");
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
