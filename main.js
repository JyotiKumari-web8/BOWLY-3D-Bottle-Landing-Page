// ==========================================================================
// BOLLY 3D LUXURY PRODUCT ENGINE & LANDING EXPERIENCE
// ==========================================================================

// Product Editions & Scent Configurations
const PRODUCT_VARIANTS = {
  violet: {
    name: 'Clarify Violet',
    labelTitle: 'clarify',
    subtext: 'SHAMPOO',
    descText: 'FOR DANDRUFF-FREE HAIR',
    colorHex: '#5c35b6',
    threeColor: 0x4f26a1,
    rimColor: 0x7b58c7,
    glowRgba: 'rgba(92, 53, 182, 0.22)',
    scentName: 'Aroma Profile: French Lavender & White Tea',
    scentDesc: 'Calming botanical notes with crisp herbal finish that leaves hair smelling salon-fresh for 48 hours.',
    editionTag: 'VIOLET CLARIFY',
    emoji: '🧴'
  },
  emerald: {
    name: 'Fresh Mint',
    labelTitle: 'refresh',
    subtext: 'SHAMPOO',
    descText: 'FOR INVIGORATED SCALP',
    colorHex: '#0d7a5f',
    threeColor: 0x095e49,
    rimColor: 0x22c55e,
    glowRgba: 'rgba(13, 122, 95, 0.22)',
    scentName: 'Aroma Profile: Wild Eucalyptus & Tea Tree',
    scentDesc: 'Cooling menthol burst that soothes immediate itchiness and delivers an invigorating shower rush.',
    editionTag: 'FRESH MINT',
    emoji: '🌿'
  },
  amber: {
    name: 'Argan Glow',
    labelTitle: 'nourish',
    subtext: 'SHAMPOO',
    descText: 'FOR INTENSE HYDRATION',
    colorHex: '#c2610d',
    threeColor: 0x9e4c05,
    rimColor: 0xf59e0b,
    glowRgba: 'rgba(194, 97, 13, 0.22)',
    scentName: 'Aroma Profile: Golden Amber & Warm Honeycomb',
    scentDesc: 'Rich, comforting amber and vanilla blossom that wraps curls and strands in warm moisture.',
    editionTag: 'ARGAN GLOW',
    emoji: '✨'
  },
  rose: {
    name: 'Rose Blossom',
    labelTitle: 'balance',
    subtext: 'SHAMPOO',
    descText: 'FOR SENSITIVE SCALPS',
    colorHex: '#b8326e',
    threeColor: 0x932455,
    rimColor: 0xf472b6,
    glowRgba: 'rgba(184, 50, 110, 0.22)',
    scentName: 'Aroma Profile: Damask Rose & Crisp Peony',
    scentDesc: 'Delicate floral essence infused with rosewater to rebalance delicate micro-flora and calm redness.',
    editionTag: 'ROSE BLOSSOM',
    emoji: '🌸'
  }
};

// Global Shopping Cart State
const CartState = {
  items: [
    {
      id: 'violet-sub',
      variantKey: 'violet',
      name: 'Bolly Clarify (250ml)',
      edition: 'Violet Clarify',
      scent: 'French Lavender & White Tea',
      price: 22.40,
      qty: 1,
      type: 'Subscription (Every 60 days)',
      icon: '🧴'
    }
  ],
  discountCode: '',
  discountPercent: 0,
  freeShippingThreshold: 40.00,
  flatShippingRate: 4.99
};

// --------------------------------------------------------------------------
// 3D BOTTLE VIEWER (Three.js WebGL Engine)
// --------------------------------------------------------------------------
class BottleViewer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;

    // 3D Groups and Meshes
    this.bottleGroup = null;
    this.bottleBody = null;
    this.labelMesh = null;
    this.particleGroup = null;
    this.rimLight = null;

    // Interaction State
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.isHovered = false;
    this.currentVariant = 'violet';

    // Rotations & Inertia
    this.targetRotationY = -0.3;
    this.currentRotationY = -0.3;
    this.targetRotationX = 0.2;
    this.currentRotationX = 0.2;
    this.rotationDamping = 0.08;
    this.dragSensitivity = 0.007;

    // Idle & Bobbing
    this.time = 0;
    this.lastTime = 0;
    this.autoRotateSpeed = 0.006;

    this.init();
  }

  init() {
    this.setupScene();
    this.setupCamera();
    this.setupRenderer();
    this.setupLights();
    this.buildBottle();
    this.setupFloatingBubbles();
    this.setupShadowPlane();
    this.setupEvents();
    this.animate(0);
  }

  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0xf7f6f9, 0.1);
  }

  setupCamera() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    this.camera.position.set(0, 0.2, 5.5);
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });

    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.container.appendChild(this.renderer.domElement);
  }

  setupLights() {
    // 1. Soft Ambient Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    this.scene.add(ambientLight);

    // 2. Main Key Light (Shadows)
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.25);
    keyLight.position.set(5, 6, 4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005;
    this.scene.add(keyLight);

    // 3. Fill Light
    const fillLight = new THREE.DirectionalLight(0xf2e8ff, 0.55);
    fillLight.position.set(-5, 2, 2);
    this.scene.add(fillLight);

    // 4. Back / Rim Light (Dynamic color matching edition)
    this.rimLight = new THREE.DirectionalLight(PRODUCT_VARIANTS.violet.rimColor, 1.6);
    this.rimLight.position.set(-3, 3, -4);
    this.scene.add(this.rimLight);

    // 5. Specular highlight point light
    const highlightLight = new THREE.PointLight(0xffffff, 0.9, 10);
    highlightLight.position.set(2.5, 0.8, 3);
    this.scene.add(highlightLight);
  }

  createLabelTexture(variantKey) {
    const config = PRODUCT_VARIANTS[variantKey] || PRODUCT_VARIANTS.violet;
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Gradient Background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, config.colorHex);
    gradient.addColorStop(1, '#1b0f33');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Outer subtle border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 12;
    ctx.strokeRect(24, 24, canvas.width - 48, canvas.height - 48);

    // 1. LOGO: 'bolly'
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 135px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('bolly', canvas.width / 2, 360);

    // 2. SUB-LOGO (e.g. 'clarify', 'refresh')
    ctx.font = 'italic 500 54px "Playfair Display", serif';
    ctx.fillStyle = '#d2f53c';
    ctx.fillText(config.labelTitle, canvas.width / 2, 475);

    // 3. PRODUCT TYPE
    ctx.font = '800 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    this.drawSpacedText(ctx, config.subtext, canvas.width / 2, 560, 6);

    // 4. BENEFIT / DESCRIPTION
    ctx.font = '600 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    this.drawSpacedText(ctx, config.descText, canvas.width / 2, 615, 2.5);

    // 5. INGREDIENTS ACTIVE CALLOUT
    ctx.font = '700 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    this.drawSpacedText(ctx, '2% ZINC PYRITHIONE + BHA + CERAMIDES', canvas.width / 2, 680, 2);

    // 6. VOLUME DETAILS
    ctx.font = '600 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    this.drawSpacedText(ctx, '250 ML e 8.4 FL. OZ.', canvas.width / 2, 790, 4);

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 4;
    texture.needsUpdate = true;
    return texture;
  }

  drawSpacedText(ctx, text, x, y, spacing) {
    const characters = text.split('');
    let totalWidth = 0;
    for (let i = 0; i < characters.length; i++) {
      totalWidth += ctx.measureText(characters[i]).width + (i < characters.length - 1 ? spacing : 0);
    }
    let currentX = x - totalWidth / 2;
    for (let i = 0; i < characters.length; i++) {
      ctx.fillText(characters[i], currentX, y);
      currentX += ctx.measureText(characters[i]).width + spacing;
    }
  }

  buildBottle() {
    this.bottleGroup = new THREE.Group();

    // 1. Lathe Geometry Profile
    const points = [];
    points.push(new THREE.Vector2(0, -1.7));
    points.push(new THREE.Vector2(0.65, -1.7));
    points.push(new THREE.Vector2(0.79, -1.63));
    points.push(new THREE.Vector2(0.80, -1.55));

    const bodySegments = 10;
    for (let i = 0; i <= bodySegments; i++) {
      const t = i / bodySegments;
      const y = -1.5 + t * 2.1;
      const r = 0.81 - t * 0.02;
      points.push(new THREE.Vector2(r, y));
    }

    const shoulderSegments = 12;
    const startY = 0.6;
    const endY = 1.15;
    const startR = 0.79;
    const endR = 0.28;
    for (let i = 0; i <= shoulderSegments; i++) {
      const t = i / shoulderSegments;
      const angle = t * Math.PI / 2;
      const r = startR - (startR - endR) * Math.sin(angle);
      const y = startY + (endY - startY) * (1 - Math.cos(angle));
      points.push(new THREE.Vector2(r, y));
    }

    points.push(new THREE.Vector2(0.28, 1.15));
    points.push(new THREE.Vector2(0.28, 1.4));
    points.push(new THREE.Vector2(0.31, 1.42));
    points.push(new THREE.Vector2(0.31, 1.46));
    points.push(new THREE.Vector2(0, 1.46));

    const latheGeometry = new THREE.LatheGeometry(points, 64);

    const bottleMaterial = new THREE.MeshPhysicalMaterial({
      color: PRODUCT_VARIANTS.violet.threeColor,
      roughness: 0.18,
      metalness: 0.05,
      clearcoat: 0.85,
      clearcoatRoughness: 0.12,
      transmission: 0.15,
      thickness: 0.5,
      specularIntensity: 0.8
    });

    this.bottleBody = new THREE.Mesh(latheGeometry, bottleMaterial);
    this.bottleBody.castShadow = true;
    this.bottleBody.receiveShadow = true;
    this.bottleGroup.add(this.bottleBody);

    // 2. Label Cylinder
    const labelHeight = 1.4;
    const labelRadiusTop = 0.803;
    const labelRadiusBottom = 0.813;
    const labelGeometry = new THREE.CylinderGeometry(
      labelRadiusTop,
      labelRadiusBottom,
      labelHeight,
      64,
      1,
      true,
      -Math.PI * 0.7,
      Math.PI * 1.4
    );

    const labelTexture = this.createLabelTexture('violet');
    const labelMaterial = new THREE.MeshPhysicalMaterial({
      map: labelTexture,
      roughness: 0.25,
      metalness: 0.02,
      clearcoat: 0.05,
      side: THREE.DoubleSide
    });

    this.labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);
    this.labelMesh.position.y = -0.35;
    this.labelMesh.rotation.y = Math.PI;
    this.labelMesh.castShadow = true;
    this.labelMesh.receiveShadow = true;
    this.bottleGroup.add(this.labelMesh);

    // 3. Pump Cap Collar & Head
    const whitePlasticMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0.0,
      clearcoat: 0.15
    });

    const capCollarGeo = new THREE.CylinderGeometry(0.29, 0.29, 0.18, 32);
    const capCollar = new THREE.Mesh(capCollarGeo, whitePlasticMaterial);
    capCollar.position.y = 1.47;
    capCollar.castShadow = true;
    this.bottleGroup.add(capCollar);

    const pumpHeadGroup = new THREE.Group();
    pumpHeadGroup.position.y = 1.56;

    const stemGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.1, 16);
    const stem = new THREE.Mesh(stemGeo, whitePlasticMaterial);
    stem.position.y = 0.05;
    pumpHeadGroup.add(stem);

    const headBlockGeo = new THREE.CylinderGeometry(0.27, 0.25, 0.26, 32);
    const headBlock = new THREE.Mesh(headBlockGeo, whitePlasticMaterial);
    headBlock.position.y = 0.23;
    headBlock.castShadow = true;
    pumpHeadGroup.add(headBlock);

    const nozzleLength = 0.5;
    const nozzleGeo = new THREE.CylinderGeometry(0.07, 0.11, nozzleLength, 16);
    nozzleGeo.rotateZ(Math.PI / 2);
    const nozzle = new THREE.Mesh(nozzleGeo, whitePlasticMaterial);
    nozzle.position.set(-0.25, 0.27, 0);
    nozzle.castShadow = true;
    pumpHeadGroup.add(nozzle);

    const tipGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.08, 16);
    const tip = new THREE.Mesh(tipGeo, whitePlasticMaterial);
    tip.position.set(-0.5, 0.23, 0);
    pumpHeadGroup.add(tip);

    this.bottleGroup.add(pumpHeadGroup);

    this.scene.add(this.bottleGroup);
    this.bottleGroup.rotation.z = -0.15;
  }

  setupFloatingBubbles() {
    this.particleGroup = new THREE.Group();
    const bubbleGeo = new THREE.SphereGeometry(0.06, 16, 16);
    const bubbleMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.9,
      roughness: 0.1,
      metalness: 0.05,
      transparent: true,
      opacity: 0.45
    });

    for (let i = 0; i < 20; i++) {
      const bubble = new THREE.Mesh(bubbleGeo, bubbleMat);
      bubble.position.set(
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 3 - 1
      );
      const scale = 0.4 + Math.random() * 0.9;
      bubble.scale.set(scale, scale, scale);
      bubble.userData = {
        speedY: 0.2 + Math.random() * 0.3,
        seed: Math.random() * 10
      };
      this.particleGroup.add(bubble);
    }
    this.scene.add(this.particleGroup);
  }

  setupShadowPlane() {
    const shadowGeo = new THREE.PlaneGeometry(8, 8);
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.16 });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -2.1;
    shadowPlane.receiveShadow = true;
    this.scene.add(shadowPlane);
  }

  switchVariant(variantKey) {
    const config = PRODUCT_VARIANTS[variantKey];
    if (!config) return;
    this.currentVariant = variantKey;

    // Update Bottle Shader Material Color
    if (this.bottleBody) {
      this.bottleBody.material.color.setHex(config.threeColor);
    }

    // Update Label Texture
    if (this.labelMesh) {
      const newTexture = this.createLabelTexture(variantKey);
      this.labelMesh.material.map = newTexture;
      this.labelMesh.material.needsUpdate = true;
    }

    // Update Rim Light
    if (this.rimLight) {
      this.rimLight.color.setHex(config.rimColor);
    }

    // Update Ambient CSS Variables and Title Accents
    document.documentElement.style.setProperty('--color-brand-primary', config.colorHex);
    document.documentElement.style.setProperty('--color-brand-glow', config.glowRgba);

    const accentElem = document.getElementById('hero-title-accent');
    if (accentElem) accentElem.style.color = config.colorHex;

    const editionTag = document.getElementById('hero-edition-tag');
    if (editionTag) {
      editionTag.textContent = config.editionTag;
      editionTag.style.backgroundColor = config.colorHex;
    }

    const scentName = document.getElementById('scent-name');
    if (scentName) scentName.textContent = config.scentName;

    const scentDesc = document.getElementById('scent-desc');
    if (scentDesc) scentDesc.textContent = config.scentDesc;

    const ctaVariantSubtext = document.getElementById('cta-variant-subtext');
    if (ctaVariantSubtext) {
      const price = document.querySelector('input[name="purchase-type"]:checked').value === 'subscription' ? '$22.40' : '$28.00';
      ctaVariantSubtext.textContent = `${config.name} • ${price}`;
    }

    // Quick bottle spin punch on switch
    this.targetRotationY += 0.8;
  }

  resetView() {
    this.targetRotationY = -0.3;
    this.targetRotationX = 0.2;
    this.currentRotationY = -0.3;
    this.currentRotationX = 0.2;
    if (this.bottleGroup) {
      this.bottleGroup.rotation.z = -0.15;
    }
  }

  setupEvents() {
    const onPointerDown = (e) => {
      this.isDragging = true;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      this.previousMousePosition = { x: clientX, y: clientY };
      document.body.style.cursor = 'grabbing';
    };

    const onPointerMove = (e) => {
      if (!this.isDragging) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - this.previousMousePosition.x;
      const deltaY = clientY - this.previousMousePosition.y;

      this.targetRotationY += deltaX * this.dragSensitivity;
      this.targetRotationX = Math.max(-0.4, Math.min(0.6, this.targetRotationX + deltaY * this.dragSensitivity));

      this.previousMousePosition = { x: clientX, y: clientY };
    };

    const onPointerUp = () => {
      this.isDragging = false;
      document.body.style.cursor = '';
    };

    this.container.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    this.container.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);

    this.container.addEventListener('mouseenter', () => { this.isHovered = true; });
    this.container.addEventListener('mouseleave', () => {
      this.isHovered = false;
      this.isDragging = false;
      document.body.style.cursor = '';
    });

    window.addEventListener('resize', () => {
      if (!this.container) return;
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    });
  }

  animate(timestamp) {
    requestAnimationFrame((t) => this.animate(t));

    if (!this.lastTime) this.lastTime = timestamp;
    const delta = (timestamp - this.lastTime) * 0.001;
    this.lastTime = timestamp;
    this.time += delta;

    this.currentRotationY += (this.targetRotationY - this.currentRotationY) * this.rotationDamping;
    this.currentRotationX += (this.targetRotationX - this.currentRotationX) * this.rotationDamping;

    if (this.bottleGroup) {
      this.bottleGroup.rotation.y = this.currentRotationY;
      this.bottleGroup.rotation.x = this.currentRotationX;

      if (!this.isDragging) {
        if (this.isHovered) {
          this.targetRotationY += this.autoRotateSpeed;
          const bobOffset = Math.sin(this.time * 1.6) * 0.12;
          const tiltOffset = Math.sin(this.time * 1.0) * 0.03;
          this.bottleGroup.position.y = THREE.MathUtils.lerp(this.bottleGroup.position.y, bobOffset, 0.05);
          this.bottleGroup.rotation.z = THREE.MathUtils.lerp(this.bottleGroup.rotation.z, -0.15 + tiltOffset, 0.05);
        } else {
          this.bottleGroup.position.y = THREE.MathUtils.lerp(this.bottleGroup.position.y, 0, 0.05);
          this.bottleGroup.rotation.z = THREE.MathUtils.lerp(this.bottleGroup.rotation.z, -0.15, 0.05);
        }
      }
    }

    // Animate Floating Bubbles
    if (this.particleGroup) {
      this.particleGroup.children.forEach((bubble) => {
        bubble.position.y += delta * bubble.userData.speedY;
        bubble.position.x += Math.sin(this.time + bubble.userData.seed) * 0.003;
        if (bubble.position.y > 3) {
          bubble.position.y = -2.5;
        }
      });
    }

    this.renderer.render(this.scene, this.camera);
  }
}

// --------------------------------------------------------------------------
// CART & COMMERCE CONTROLLER
// --------------------------------------------------------------------------
const CartController = {
  init() {
    this.bindEvents();
    this.renderCart();
  },

  bindEvents() {
    const cartToggle = document.getElementById('cart-toggle');
    const cartClose = document.getElementById('cart-close-btn');
    const backdrop = document.getElementById('drawer-backdrop');
    const shopCta = document.getElementById('shop-cta');

    if (cartToggle) cartToggle.addEventListener('click', () => this.openCart());
    if (cartClose) cartClose.addEventListener('click', () => this.closeCart());
    if (backdrop) backdrop.addEventListener('click', () => {
      this.closeCart();
      SearchController.closeSearch();
      CheckoutController.closeCheckout();
    });

    if (shopCta) {
      shopCta.addEventListener('click', (e) => {
        e.preventDefault();
        const activeVariant = document.querySelector('.variant-pill.active')?.dataset.variant || 'violet';
        const purchaseType = document.querySelector('input[name="purchase-type"]:checked').value;
        const price = purchaseType === 'subscription' ? 22.40 : 28.00;
        const typeText = purchaseType === 'subscription' ? 'Subscription (Every 60 days)' : 'One-Time Purchase';
        const config = PRODUCT_VARIANTS[activeVariant];

        this.addItem({
          id: `${activeVariant}-${purchaseType}`,
          variantKey: activeVariant,
          name: `Bolly Clarify (250ml)`,
          edition: config.name,
          scent: config.scentName.replace('Aroma Profile: ', ''),
          price: price,
          qty: 1,
          type: typeText,
          icon: config.emoji
        });

        showToast(`Added ${config.name} to your bag!`);
        this.openCart();
      });
    }

    // Purchase option radio selector change
    const purchaseRadios = document.querySelectorAll('input[name="purchase-type"]');
    purchaseRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        document.querySelectorAll('.purchase-option').forEach(opt => opt.classList.remove('active'));
        e.target.closest('.purchase-option').classList.add('active');

        const activeVariant = document.querySelector('.variant-pill.active')?.dataset.variant || 'violet';
        const config = PRODUCT_VARIANTS[activeVariant];
        const isSub = e.target.value === 'subscription';
        const price = isSub ? '$22.40' : '$28.00';

        const heroPrice = document.getElementById('hero-price');
        if (heroPrice) heroPrice.textContent = price;

        const ctaSubtext = document.getElementById('cta-variant-subtext');
        if (ctaSubtext) ctaSubtext.textContent = `${config.name} • ${price}`;
      });
    });

    // Promo code input
    const promoBtn = document.getElementById('promo-apply-btn');
    if (promoBtn) {
      promoBtn.addEventListener('click', () => {
        const input = document.getElementById('promo-input');
        const code = input.value.trim().toUpperCase();
        if (code === 'FRESH15') {
          CartState.discountCode = 'FRESH15';
          CartState.discountPercent = 0.15;
          input.value = '';
          showToast('Promo code FRESH15 applied! (15% OFF)');
          this.renderCart();
        } else if (code) {
          showToast('Invalid promo code. Try "FRESH15"!');
        }
      });
    }

    const promoRemoveBtn = document.getElementById('promo-remove-btn');
    if (promoRemoveBtn) {
      promoRemoveBtn.addEventListener('click', () => {
        CartState.discountCode = '';
        CartState.discountPercent = 0;
        showToast('Promo code removed.');
        this.renderCart();
      });
    }

    // Checkout Proceed
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => {
        if (CartState.items.length === 0) {
          showToast('Your cart is empty.');
          return;
        }
        this.closeCart();
        CheckoutController.openCheckout();
      });
    }
  },

  openCart() {
    document.getElementById('cart-drawer')?.classList.add('open');
    document.getElementById('drawer-backdrop')?.classList.add('open');
  },

  closeCart() {
    document.getElementById('cart-drawer')?.classList.remove('open');
    document.getElementById('drawer-backdrop')?.classList.remove('open');
  },

  addItem(item) {
    const existing = CartState.items.find(i => i.id === item.id);
    if (existing) {
      existing.qty += 1;
    } else {
      CartState.items.push(item);
    }
    this.renderCart();
  },

  updateQty(itemId, delta) {
    const item = CartState.items.find(i => i.id === itemId);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
      CartState.items = CartState.items.filter(i => i.id !== itemId);
    }
    this.renderCart();
  },

  renderCart() {
    const container = document.getElementById('cart-items-container');
    const badge = document.getElementById('cart-count-badge');
    const drawerCount = document.getElementById('cart-drawer-count');
    const subtotalElem = document.getElementById('cart-subtotal-amount');
    const discountRow = document.getElementById('cart-discount-row');
    const discountElem = document.getElementById('cart-discount-amount');
    const shippingElem = document.getElementById('cart-shipping-amount');
    const totalElem = document.getElementById('cart-total-amount');
    const progressText = document.getElementById('shipping-progress-text');
    const progressBar = document.getElementById('shipping-progress-bar');
    const promoBadge = document.getElementById('promo-applied-badge');
    const checkoutBtn = document.getElementById('checkout-btn');

    const totalQty = CartState.items.reduce((sum, item) => sum + item.qty, 0);
    if (badge) {
      badge.textContent = totalQty;
      badge.style.transform = 'scale(1.3)';
      setTimeout(() => { badge.style.transform = 'scale(1)'; }, 200);
    }
    if (drawerCount) drawerCount.textContent = `(${totalQty} ${totalQty === 1 ? 'item' : 'items'})`;

    if (!container) return;

    if (CartState.items.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 3rem 1rem; color: #6b647c;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">🛍️</div>
          <h3 style="font-size: 1.15rem; color: #120f1a; margin-bottom: 0.5rem;">Your bag is empty</h3>
          <p style="font-size: 0.85rem; margin-bottom: 1.5rem;">Experience flake-free luxury hair care today.</p>
          <button class="cta-button" onclick="CartController.closeCart();" style="width: auto; padding: 0.6rem 1.5rem;">Explore 3D Bottle</button>
        </div>
      `;
      if (subtotalElem) subtotalElem.textContent = '$0.00';
      if (totalElem) totalElem.textContent = '$0.00';
      if (shippingElem) shippingElem.textContent = '$0.00';
      if (discountRow) discountRow.style.display = 'none';
      if (promoBadge) promoBadge.style.display = 'none';
      if (checkoutBtn) checkoutBtn.disabled = true;
      if (progressBar) progressBar.style.width = '0%';
      if (progressText) progressText.innerHTML = `Add <strong>$40.00</strong> more for <strong>FREE Express Shipping</strong>`;
      return;
    }

    if (checkoutBtn) checkoutBtn.disabled = false;

    // Render Items
    container.innerHTML = CartState.items.map(item => `
      <div class="cart-item-card">
        <div class="cart-item-img">${item.icon}</div>
        <div class="cart-item-details">
          <div class="cart-item-title">${item.name}</div>
          <div class="cart-item-variant">${item.edition} • ${item.type}</div>
          <div class="cart-item-actions">
            <div class="qty-control">
              <button class="qty-btn" onclick="CartController.updateQty('${item.id}', -1)">-</button>
              <span class="qty-number">${item.qty}</span>
              <button class="qty-btn" onclick="CartController.updateQty('${item.id}', 1)">+</button>
            </div>
            <div class="cart-item-price">$${(item.price * item.qty).toFixed(2)}</div>
          </div>
        </div>
      </div>
    `).join('');

    // Calculations
    const subtotal = CartState.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const discount = subtotal * CartState.discountPercent;
    const isFreeShipping = subtotal >= CartState.freeShippingThreshold;
    const shipping = isFreeShipping ? 0 : CartState.flatShippingRate;
    const total = (subtotal - discount) + shipping;

    if (subtotalElem) subtotalElem.textContent = `$${subtotal.toFixed(2)}`;
    if (shippingElem) shippingElem.textContent = isFreeShipping ? 'FREE' : `$${shipping.toFixed(2)}`;
    if (totalElem) totalElem.textContent = `$${total.toFixed(2)}`;

    // Promo code badge
    if (CartState.discountPercent > 0) {
      if (discountRow) {
        discountRow.style.display = 'flex';
        discountElem.textContent = `-$${discount.toFixed(2)}`;
      }
      if (promoBadge) {
        promoBadge.style.display = 'flex';
      }
    } else {
      if (discountRow) discountRow.style.display = 'none';
      if (promoBadge) promoBadge.style.display = 'none';
    }

    // Shipping Progress Bar
    const progressPct = Math.min(100, (subtotal / CartState.freeShippingThreshold) * 100);
    if (progressBar) progressBar.style.width = `${progressPct}%`;
    if (progressText) {
      if (isFreeShipping) {
        progressText.innerHTML = `🎉 You unlocked <strong>FREE Express Worldwide Shipping!</strong>`;
      } else {
        const remaining = (CartState.freeShippingThreshold - subtotal).toFixed(2);
        progressText.innerHTML = `Add <strong>$${remaining}</strong> more for <strong>FREE Express Shipping</strong>`;
      }
    }
  }
};

// --------------------------------------------------------------------------
// SEARCH CONTROLLER
// --------------------------------------------------------------------------
const SearchController = {
  searchDatabase: [
    { name: 'Bolly Clarify (Violet Edition)', type: 'Product', tag: 'Lavender & White Tea', price: '$22.40', variant: 'violet' },
    { name: 'Bolly Fresh Mint (Emerald Edition)', type: 'Product', tag: 'Eucalyptus & Tea Tree', price: '$22.40', variant: 'emerald' },
    { name: 'Bolly Argan Glow (Amber Edition)', type: 'Product', tag: 'Warm Amber & Honeycomb', price: '$22.40', variant: 'amber' },
    { name: 'Bolly Rose Blossom (Pink Edition)', type: 'Product', tag: 'Damask Rose & Peony', price: '$22.40', variant: 'rose' },
    { name: 'Zinc Pyrithione (ZPT)', type: 'Active Ingredient', tag: '1.0% Clinical Antifungal', price: 'Active', variant: 'violet' },
    { name: 'Micro Salicylic Acid (BHA)', type: 'Active Ingredient', tag: '1.5% Exfoliant', price: 'Active', variant: 'violet' },
    { name: 'Plant Ceramides & Niacinamide', type: 'Active Ingredient', tag: '3.0% Barrier Restorer', price: 'Active', variant: 'violet' }
  ],

  init() {
    const searchToggle = document.getElementById('search-toggle');
    const searchClose = document.getElementById('search-close-btn');
    const searchOverlay = document.getElementById('search-overlay');
    const searchInput = document.getElementById('search-input');

    if (searchToggle) searchToggle.addEventListener('click', () => this.openSearch());
    if (searchClose) searchClose.addEventListener('click', () => this.closeSearch());

    if (searchInput) {
      searchInput.addEventListener('input', (e) => this.performSearch(e.target.value));
    }

    const tagChips = document.querySelectorAll('.search-tag-chip');
    tagChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const q = chip.dataset.query;
        if (searchInput) {
          searchInput.value = q;
          this.performSearch(q);
        }
      });
    });
  },

  openSearch() {
    const overlay = document.getElementById('search-overlay');
    overlay?.classList.add('open');
    const input = document.getElementById('search-input');
    if (input) {
      input.focus();
      this.performSearch(input.value);
    }
  },

  closeSearch() {
    document.getElementById('search-overlay')?.classList.remove('open');
  },

  performSearch(query) {
    const container = document.getElementById('search-results-container');
    if (!container) return;

    const q = (query || '').toLowerCase().trim();
    const results = this.searchDatabase.filter(item =>
      item.name.toLowerCase().includes(q) ||
      item.tag.toLowerCase().includes(q) ||
      item.type.toLowerCase().includes(q)
    );

    if (results.length === 0) {
      container.innerHTML = `<p style="text-align: center; color: #9890a8; padding: 2rem;">No matching results found for "${query}"</p>`;
      return;
    }

    container.innerHTML = results.map(item => `
      <div class="search-result-item" onclick="SearchController.handleSelect('${item.variant}')">
        <div>
          <strong style="font-size: 0.92rem; color: #120f1a; display: block;">${item.name}</strong>
          <span style="font-size: 0.78rem; color: #6b647c;">${item.type} • ${item.tag}</span>
        </div>
        <div style="font-weight: 700; font-size: 0.88rem; color: #5c35b6;">${item.price} →</div>
      </div>
    `).join('');
  },

  handleSelect(variantKey) {
    this.closeSearch();
    const pill = document.querySelector(`.variant-pill[data-variant="${variantKey}"]`);
    if (pill) pill.click();
    window.location.hash = '#hero';
  }
};

// --------------------------------------------------------------------------
// CHECKOUT SIMULATION CONTROLLER
// --------------------------------------------------------------------------
const CheckoutController = {
  init() {
    const closeBtn = document.getElementById('checkout-modal-close');
    const form = document.getElementById('checkout-form');
    const successDoneBtn = document.getElementById('success-done-btn');

    if (closeBtn) closeBtn.addEventListener('click', () => this.closeCheckout());
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.closeCheckout();
        this.openSuccess();
      });
    }

    if (successDoneBtn) {
      successDoneBtn.addEventListener('click', () => {
        this.closeSuccess();
        CartState.items = [];
        CartController.renderCart();
      });
    }
  },

  openCheckout() {
    const modal = document.getElementById('checkout-modal');
    const preview = document.getElementById('checkout-order-preview');
    if (preview) {
      const subtotal = CartState.items.reduce((sum, i) => sum + (i.price * i.qty), 0);
      const discount = subtotal * CartState.discountPercent;
      const total = (subtotal - discount) + (subtotal >= 40 ? 0 : 4.99);
      preview.innerHTML = `
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.35rem;">
          <span>Items (${CartState.items.length}):</span>
          <strong>$${subtotal.toFixed(2)}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 1rem; color: #120f1a;">
          <span>Order Total:</span>
          <span style="color: #5c35b6;">$${total.toFixed(2)}</span>
        </div>
      `;
    }
    modal?.classList.add('open');
  },

  closeCheckout() {
    document.getElementById('checkout-modal')?.classList.remove('open');
  },

  openSuccess() {
    document.getElementById('success-modal')?.classList.add('open');
  },

  closeSuccess() {
    document.getElementById('success-modal')?.classList.remove('open');
  }
};

// --------------------------------------------------------------------------
// TOAST NOTIFICATION HELPER
// --------------------------------------------------------------------------
function showToast(message) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>✨</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

// --------------------------------------------------------------------------
// PAGE INITIALIZATION & UI INTERACTION
// --------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize 3D Engine
  const bottleViewer = new BottleViewer('canvas-container');

  // 2. Initialize Controllers
  CartController.init();
  SearchController.init();
  CheckoutController.init();

  // 3. Variant Pills Click Handler
  const variantPills = document.querySelectorAll('.variant-pill');
  variantPills.forEach(pill => {
    pill.addEventListener('click', () => {
      variantPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const variantKey = pill.dataset.variant;
      bottleViewer.switchVariant(variantKey);
    });
  });

  // 4. Reset 3D View Button
  const resetBtn = document.getElementById('reset-view-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      bottleViewer.resetView();
      showToast('3D View reset');
    });
  }

  // 5. Header Sticky Scroll & Nav Active Tracker
  const header = document.getElementById('main-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }
  });

  // 6. Mobile Menu Toggle
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const mobileNav = document.getElementById('mobile-nav');
  if (mobileToggle && mobileNav) {
    mobileToggle.addEventListener('click', () => {
      mobileNav.classList.toggle('open');
    });
    document.querySelectorAll('.mobile-nav-link').forEach(link => {
      link.addEventListener('click', () => mobileNav.classList.remove('open'));
    });
  }

  // 7. Top Announcement Banner Dismiss
  const bannerClose = document.getElementById('announcement-close');
  if (bannerClose) {
    bannerClose.addEventListener('click', () => {
      document.getElementById('announcement-bar')?.remove();
    });
  }

  // 8. FAQ Accordion Open/Close
  const faqQuestions = document.querySelectorAll('.faq-question');
  faqQuestions.forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      if (!isOpen) {
        item.classList.add('open');
      }
    });
  });

  // 9. Newsletter Form Submission
  const newsletterForm = document.getElementById('newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('newsletter-email').value;
      showToast(`Welcome! 15% promo code FRESH15 unlocked for ${email}`);
      newsletterForm.reset();
    });
  }

  // 10. Hotspot interactive toggle
  const hotspotPins = document.querySelectorAll('.hotspot-pin');
  hotspotPins.forEach(pin => {
    pin.addEventListener('click', (e) => {
      e.stopPropagation();
      hotspotPins.forEach(p => p !== pin && p.classList.remove('active'));
      pin.classList.toggle('active');
    });
  });

  document.addEventListener('click', () => {
    hotspotPins.forEach(pin => pin.classList.remove('active'));
  });
});