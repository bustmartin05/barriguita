/* ==========================================================================
   PASTELERÍA BARRIGUITAS - MOTOR DEL JUEGO, CARRUSELES, SUPABASE & ADMIN
   ========================================================================== */

// Mapeo bidireccional entre Escenas y URLs amigables / Hash
const SCENE_TO_HASH = {
  'scene-01': '#inicio',
  'scene-02': '#cocina',
  'scene-sub-cakes': '#pasteles',
  'scene-sub-fillings': '#rellenos',
  'scene-sub-decor': '#decoracion',
  'scene-sub-tartas': '#tartas',
  'scene-sub-cookies': '#dulces',
  'scene-sub-box': '#box',
  'scene-sub-delivery': '#pedido',
  'scene-05-gallery': '#galeria',
  'scene-06-reviews': '#opiniones',
  'scene-07-promos': '#promociones'
};

const HASH_TO_SCENE = {
  '#inicio': 'scene-01',
  '#home': 'scene-01',
  '#cocina': 'scene-02',
  '#taller': 'scene-02',
  '#armar': 'scene-02',
  '#pasteles': 'scene-sub-cakes',
  '#pastel': 'scene-sub-cakes',
  '#rellenos': 'scene-sub-fillings',
  '#decoracion': 'scene-sub-decor',
  '#tartas': 'scene-sub-tartas',
  '#tarta': 'scene-sub-tartas',
  '#dulces': 'scene-sub-cookies',
  '#cookies': 'scene-sub-cookies',
  '#galletas': 'scene-sub-cookies',
  '#box': 'scene-sub-box',
  '#boxes': 'scene-sub-box',
  '#pedido': 'scene-sub-delivery',
  '#checkout': 'scene-sub-delivery',
  '#entrega': 'scene-sub-delivery',
  '#galeria': 'scene-05-gallery',
  '#galería': 'scene-05-gallery',
  '#fotos': 'scene-05-gallery',
  '#opiniones': 'scene-06-reviews',
  '#comentarios': 'scene-06-reviews',
  '#reseñas': 'scene-06-reviews',
  '#resenas': 'scene-06-reviews',
  '#reviews': 'scene-06-reviews',
  '#promociones': 'scene-07-promos',
  '#promos': 'scene-07-promos',
  '#ofertas': 'scene-07-promos',
  '#combos': 'scene-07-promos'
};

class BarriguitasApp {
  constructor() {
    this.phoneWhatsApp = '5492612571131'; // Número de WhatsApp Oficial de Barriguitas (+54 9 2612 57-1131)

    // Estado del Pedido
    this.order = {
      category: 'pastel',
      cakeSize: '2_5kg',
      fillings: [],
      decorStyle: 'Decoración a elección según referencia',
      tartName: 'Lemon Pie',
      cookieName: 'Galletas Animadas (x12)',
      boxName: 'Box Degustación x12 Mini Tartas',
      comments: '',
      referencePhoto: null,
      deliveryMethod: 'moto',
      deliveryZone: 'centro',
      deliveryAddress: '',
      eventDate: '',
      clientName: '',
      upsellAdded: false,
      upsellOffer: null
    };

    // Precios Iniciales (Sincronizados con admin.html y Firebase)
    this.defaultPrices = {
      cakePricePerKg: 18000,
      cakes: {
        '1_5kg': 27000,
        '2_5kg': 45000,
        '3_5kg': 63000,
        '4_0kg': 72000
      },
      tarts: {
        'Lemon Pie': 15000,
        'Coco con Dulce de Leche': 14500,
        'Cheesecake': 16500,
        'Brownie con Dulce de Leche': 15500,
        'Rogel': 16000
      },
      cookies: {
        'Cake Pops': 12000,
        'Galletas Animadas (x12)': 13500,
        'Galletas Decoradas Granja': 13500,
        'Cupcakes (x6)': 12500,
        'Cupcakes Decorados': 12500,
        'Paletas Dulces (x10)': 14000,
        'Paletas Decoradas': 14000
      },
      box: 18500,
      boxDescription: 'Incluye degustación de 12 mini tartas artesanales variadas (Lemon pie, Coco con DDL, Cheesecake, Brownie y Rogel) en caja de madera especial.',
      delivery: {
        'centro': 1500,
        'norte': 2200,
        'sur': 2500
      }
    };

    const savedPrices = localStorage.getItem('barriguitas_prices');
    this.prices = savedPrices ? JSON.parse(savedPrices) : this.defaultPrices;

    // Calcular precios de pasteles automáticamente a partir del precio por kilo
    if (this.prices.cakePricePerKg) {
      const kg = Number(this.prices.cakePricePerKg);
      this.prices.cakes = {
        '1_5kg': Math.round(kg * 1.5),
        '2_5kg': Math.round(kg * 2.5),
        '3_5kg': Math.round(kg * 3.5),
        '4_0kg': Math.round(kg * 4.0)
      };
    }

    // Zonas de Envío
    this.defaultShippingZones = [
      { id: 'centro', name: 'Zona Centro / Cercanías', price: 1500 },
      { id: 'norte', name: 'Zona Norte / Gran Mendoza', price: 2200 },
      { id: 'sur', name: 'Zona Sur', price: 2500 }
    ];
    const savedZones = localStorage.getItem('barriguitas_shipping_zones');
    this.shippingZones = savedZones ? JSON.parse(savedZones) : this.defaultShippingZones;
    this.deliveryEnabled = localStorage.getItem('barriguitas_delivery_enabled') !== 'false';

    // Ofertas Sugeridas (Upsell Estilo McDonald's)
    this.defaultUpsell = [
      { id: 'upsell_box', triggerCategory: 'box', message: '¿Deseas sumar unas galletitas animadas temáticas a tu Box con $2.000 de descuento?', productName: 'Galletas Animadas Temáticas (x6)', discountPrice: 4800, originalPrice: 6800, active: true },
      { id: 'upsell_tarta', triggerCategory: 'tarta', message: '¿Te gustaría probar además unas ricas paletas dulces de chocolate?', productName: 'Paletas Dulces de Chocolate (x5)', discountPrice: 4500, originalPrice: 6500, active: true },
      { id: 'upsell_cookies', triggerCategory: 'cookies', message: '¿Te gustaría acompañar tus bocaditos con unos ricos Cupcakes rellenos?', productName: 'Cupcakes Rellenos (x4)', discountPrice: 5200, originalPrice: 7800, active: true }
    ];
    const savedUpsell = localStorage.getItem('barriguitas_upsell_offers');
    this.upsellOffers = savedUpsell ? JSON.parse(savedUpsell) : this.defaultUpsell;

    // Promociones Iniciales (Página 7)
    this.defaultPromos = [
      { id: 1, badge: 'Combo Cumpleaños 20% OFF', title: 'Pastel 2.5kg + 12 Cake Pops', desc: 'Pastel decorado temático de 1 piso alto, vela mágica y 12 cake pops surtidos a tono.', price: 36000 },
      { id: 2, badge: 'Dúo Clásico', title: 'Lemon Pie + Tarta Coco con DDL', desc: 'Dos tartas familiares grandes para compartir en tu tarde de té o reunión especial.', price: 26500 },
      { id: 3, badge: 'Mesa Dulce Total', title: '12 Donuts + 12 Galletas + 12 Paletas', desc: 'El combo completo para tu mesa de souvenirs infantiles con detalles artesanales.', price: 33000 }
    ];
    const savedPromos = localStorage.getItem('barriguitas_promos');
    this.promos = savedPromos ? JSON.parse(savedPromos) : this.defaultPromos;

    // Galería Inicial (Página 5)
    this.defaultGallery = [
      { id: 1, title: 'Pastel Granja Mágica 3D', cat: 'infantiles', img: 'assets/images/JUEGO INICIO/Tipo de pasteles/Tipo de decoracion/deco1_transparent.png' },
      { id: 2, title: 'Torta Rayas y Flores', cat: 'adultos', img: 'assets/images/JUEGO INICIO/Tipo de pasteles/Tipo de decoracion/deco2_transparent.png' },
      { id: 3, title: 'Pastel Quince Años Degradé', cat: 'quinces', img: 'assets/images/JUEGO INICIO/Tipo de pasteles/Tipo de decoracion/deco3_transparent.png' },
      { id: 4, title: 'Torta Nupcial 3 Pisos Encaje', cat: 'bodas', img: 'assets/images/JUEGO INICIO/Tipo de pasteles/Tipo de decoracion/deco4_transparent.png' },
      { id: 5, title: 'Box Degustación x12', cat: 'adultos', img: 'assets/images/JUEGO INICIO/Box/caja_15_trans_final.png' }
    ];
    const savedGallery = localStorage.getItem('barriguitas_gallery_v2');
    this.gallery = savedGallery ? JSON.parse(savedGallery) : this.defaultGallery;

    // Comentarios Iniciales (Página 6 - Estilo Google Maps)
    this.defaultReviews = [
      { id: 1, name: 'Mariana Gómez', rating: 5, date: 'Hace 3 días', text: 'La torta de la granja para los 3 añitos de Joaco fue un sueño. ¡Riquísima, súper fresca y con detalles preciosos!' },
      { id: 2, name: 'Esteban Rossi', rating: 5, date: 'Hace 1 semana', text: 'Hicimos el pedido desde la web, pagamos la seña del 50% y nos llegó impecable en moto. Súper puntuales y muy amables.' },
      { id: 3, name: 'Luciana Rivas', rating: 5, date: 'Hace 2 semanas', text: 'El lemon pie fue la sensación del cumple. Todos los invitados fascinados con el sabor.' },
      { id: 4, name: 'Carlos Benítez', rating: 5, date: 'Hace 3 semanas', text: 'Pedimos una torta de 2 pisos para los 15 de mi hija. Hermosa terminación, bizcochuelo bien húmedo y relleno abundante.' },
      { id: 5, name: 'Camila Santoro', rating: 5, date: 'Hace 1 mes', text: 'La caja degustación x12 mini tartas es un 10 total. Perfecta para regalar o para una merienda de domingo. Repetiremos sin dudas.' },
      { id: 6, name: 'Martín Paredes', rating: 5, date: 'Hace 1 mes', text: 'Excelente experiencia de compra. La web interactiva para armar el pastel es genial y la atención por WhatsApp de diez.' },
      { id: 7, name: 'Sofía Almada', rating: 5, date: 'Hace 1 mes', text: 'Torta nupcial de 3 pisos con encaje, tal como les mandé en la foto de referencia. ¡Mil gracias por hacer magia!' },
      { id: 8, name: 'Nicolás Vega', rating: 5, date: 'Hace 2 meses', text: 'Los cupcakes decorados y las galletitas personalizadas estaban impecables. A los chicos del jardín les encantó.' },
      { id: 9, name: 'Valeria Méndez', rating: 5, date: 'Hace 2 meses', text: 'Rogel insuperable con dulce de leche de calidad y merengue en su punto justo. ¡La mejor pastelería de la zona!' }
    ];
    const savedReviews = localStorage.getItem('barriguitas_reviews_v2');
    this.reviews = savedReviews ? JSON.parse(savedReviews) : this.defaultReviews;

    // Estado del Carrusel de Galería (Página 5)
    this.currentGalleryPage = 0;
    this.currentGalleryFilter = 'all';

    // Estado del Carrusel de Reseñas (Página 6)
    this.currentReviewPage = 0;
    this.reviewTimer = null;
    this.reviewProgressTimer = null;
    this.reviewElapsedMs = 0;
    this.reviewCycleMs = 5000; // 5 Segundos
    this.isReviewsHovered = false;

    this.firebase = window.firebaseApi;
    this.isFirebaseConnected = Boolean(this.firebase);
    this.fillings = [];

    this.init();
  }

  init() {
    this.initSplash();
    this.initNavigation();
    this.initGameFlow();
    this.initDelivery();
    this.renderProductPrices();
    this.renderShippingZoneOptions();
    this.initGalleryCarousel();
    this.initReviewsCarousel();
    this.renderPromos();
    this.initPublicReviewDialog();
    this.initFirebaseConnector();
    this.initStorageListener();
    this.initGlobalSceneScroll();
    this.resolveInitialRoute();
    this.updateCheckoutCalculation();
  }

  // 1. Splash Screen
  initSplash() {
    const splash = document.getElementById('splash-screen');
    if (splash) {
      setTimeout(() => {
        splash.classList.add('hidden');
      }, 1800);
    }
  }

  // 2. Navegación entre Escenas & URLs Únicas / Hash
  goToScene(sceneId, updateHash = true) {
    document.querySelectorAll('.scene-frame').forEach(f => f.classList.remove('active'));
    const target = document.getElementById(sceneId);
    if (target) {
      target.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Si entramos al paso final de entrega/checkout, preparar upsell y cálculo
    if (sceneId === 'scene-sub-delivery') {
      this.renderCheckoutUpsell();
      this.updateCheckoutCalculation();
    }

    // Sincronizar estado activo de pestañas en desktop y drawer móvil
    document.querySelectorAll('.nav-btn-link[data-scene]').forEach(b => {
      b.classList.toggle('active', b.dataset.scene === sceneId);
    });
    document.querySelectorAll('.drawer-nav-btn[data-scene]').forEach(b => {
      b.classList.toggle('active', b.dataset.scene === sceneId);
    });

    // Actualizar URL en la barra de direcciones sin recargar para poder compartir links
    if (updateHash && SCENE_TO_HASH[sceneId]) {
      const hash = SCENE_TO_HASH[sceneId];
      if (window.location.hash !== hash) {
        history.pushState(null, '', hash);
      }
    }
  }

  resolveInitialRoute() {
    const rawHash = (window.location.hash || '').toLowerCase();
    if (rawHash && HASH_TO_SCENE[rawHash]) {
      this.goToScene(HASH_TO_SCENE[rawHash], false);
    }
  }

  resolveRouteFromHash() {
    const rawHash = (window.location.hash || '').toLowerCase();
    if (rawHash && HASH_TO_SCENE[rawHash]) {
      this.goToScene(HASH_TO_SCENE[rawHash], false);
    }
  }

  initNavigation() {
    // Escuchar navegación del historial (Botones atrás / adelante del navegador)
    window.addEventListener('hashchange', () => this.resolveRouteFromHash());
    window.addEventListener('popstate', () => this.resolveRouteFromHash());

    // Navegación Desktop
    document.querySelectorAll('.nav-btn-link[data-scene]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.goToScene(btn.dataset.scene);
      });
    });

    // Menú Hamburguesa Móvil (Drawer)
    const btnToggle = document.getElementById('btn-toggle-mobile-menu');
    const drawer = document.getElementById('mobile-drawer-menu');
    const overlay = document.getElementById('mobile-drawer-overlay');
    const btnClose = document.getElementById('btn-close-mobile-menu');

    const openDrawer = () => {
      if (drawer) drawer.classList.add('active');
      if (overlay) overlay.classList.add('active');
    };

    const closeDrawer = () => {
      if (drawer) drawer.classList.remove('active');
      if (overlay) overlay.classList.remove('active');
    };

    if (btnToggle) btnToggle.addEventListener('click', openDrawer);
    if (btnClose) btnClose.addEventListener('click', closeDrawer);
    if (overlay) overlay.addEventListener('click', closeDrawer);

    // Enlaces dentro del Drawer Móvil
    document.querySelectorAll('.drawer-nav-btn[data-scene]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.goToScene(btn.dataset.scene);
        closeDrawer();
      });
    });

    // Botones de Regreso (Back)
    document.querySelectorAll('.btn-scene-back').forEach(btn => {
      btn.addEventListener('click', () => {
        const to = btn.dataset.to;
        if (to) this.goToScene(to);
      });
    });
  }

  // Renderizar precios dinámicos en las tarjetas del juego
  renderProductPrices() {
    if (this.prices.cakePricePerKg) {
      const kg = Number(this.prices.cakePricePerKg);
      this.prices.cakes = {
        '1_5kg': Math.round(kg * 1.5),
        '2_5kg': Math.round(kg * 2.5),
        '3_5kg': Math.round(kg * 3.5),
        '4_0kg': Math.round(kg * 4.0)
      };
    }

    // Pasteles
    const p1_5 = document.getElementById('price-cake-1_5');
    const p2_5 = document.getElementById('price-cake-2_5');
    const p3_5 = document.getElementById('price-cake-3_5');
    const p4_0 = document.getElementById('price-cake-4_0');

    if (p1_5 && this.prices.cakes['1_5kg']) p1_5.textContent = '$' + this.prices.cakes['1_5kg'].toLocaleString('es-AR');
    if (p2_5 && this.prices.cakes['2_5kg']) p2_5.textContent = '$' + this.prices.cakes['2_5kg'].toLocaleString('es-AR');
    if (p3_5 && this.prices.cakes['3_5kg']) p3_5.textContent = '$' + this.prices.cakes['3_5kg'].toLocaleString('es-AR');
    if (p4_0 && this.prices.cakes['4_0kg']) p4_0.textContent = '$' + this.prices.cakes['4_0kg'].toLocaleString('es-AR');

    // Tartas
    if (this.prices.tarts) {
      const pLemon = document.getElementById('price-tart-lemon');
      const pCoco = document.getElementById('price-tart-coco');
      const pCheese = document.getElementById('price-tart-cheese');
      const pBrownie = document.getElementById('price-tart-brownie');
      const pRogel = document.getElementById('price-tart-rogel');

      if (pLemon && this.prices.tarts['Lemon Pie']) pLemon.textContent = '$' + this.prices.tarts['Lemon Pie'].toLocaleString('es-AR');
      if (pCoco && this.prices.tarts['Coco con Dulce de Leche']) pCoco.textContent = '$' + this.prices.tarts['Coco con Dulce de Leche'].toLocaleString('es-AR');
      if (pCheese && this.prices.tarts['Cheesecake']) pCheese.textContent = '$' + this.prices.tarts['Cheesecake'].toLocaleString('es-AR');
      if (pBrownie && this.prices.tarts['Brownie con Dulce de Leche']) pBrownie.textContent = '$' + this.prices.tarts['Brownie con Dulce de Leche'].toLocaleString('es-AR');
      if (pRogel && this.prices.tarts['Rogel']) pRogel.textContent = '$' + this.prices.tarts['Rogel'].toLocaleString('es-AR');
    }

    // Bocaditos y Cookies
    if (this.prices.cookies) {
      const pCakepops = document.getElementById('price-cookie-cakepops');
      const pGranja = document.getElementById('price-cookie-granja');
      const pCupcakes = document.getElementById('price-cookie-cupcakes');
      const pPaletas = document.getElementById('price-cookie-paletas');

      if (pCakepops && this.prices.cookies['Cake Pops']) pCakepops.textContent = '$' + this.prices.cookies['Cake Pops'].toLocaleString('es-AR');
      const priceG = this.prices.cookies['Galletas Animadas (x12)'] || this.prices.cookies['Galletas Decoradas Granja'];
      if (pGranja && priceG) pGranja.textContent = '$' + priceG.toLocaleString('es-AR');
      
      const priceC = this.prices.cookies['Cupcakes (x6)'] || this.prices.cookies['Cupcakes Decorados'];
      if (pCupcakes && priceC) pCupcakes.textContent = '$' + priceC.toLocaleString('es-AR');
      
      const priceP = this.prices.cookies['Paletas Dulces (x10)'] || this.prices.cookies['Paletas Decoradas'];
      if (pPaletas && priceP) pPaletas.textContent = '$' + priceP.toLocaleString('es-AR');
    }

    // Box
    const pBox = document.getElementById('box-scene-price');
    if (pBox && this.prices.box) pBox.textContent = '$' + this.prices.box.toLocaleString('es-AR');

    const descBox = document.getElementById('box-scene-desc');
    if (descBox && this.prices.boxDescription) descBox.textContent = this.prices.boxDescription;
  }

  // Sincronización en vivo ante cambios desde admin.html
  initStorageListener() {
    window.addEventListener('storage', (e) => {
      if (e.key === 'barriguitas_prices') {
        this.prices = JSON.parse(e.newValue);
        this.renderProductPrices();
        this.updateCheckoutCalculation();
      }
      if (e.key === 'barriguitas_shipping_zones') {
        this.shippingZones = JSON.parse(e.newValue);
        this.renderShippingZoneOptions();
        this.updateCheckoutCalculation();
      }
      if (e.key === 'barriguitas_upsell_offers') {
        this.upsellOffers = JSON.parse(e.newValue);
        this.renderCheckoutUpsell();
        this.updateCheckoutCalculation();
      }
      if (e.key === 'barriguitas_promos') {
        this.promos = JSON.parse(e.newValue);
        this.renderPromos();
      }
      if (e.key === 'barriguitas_gallery_v2') {
        this.gallery = JSON.parse(e.newValue);
        this.renderGalleryCarousel('all');
      }
    });
  }

  // 3. Flujo del Minijuego
  initGameFlow() {
    // Escena 1 -> Escena 2
    const btnStart = document.getElementById('btn-hero-start');
    if (btnStart) {
      btnStart.addEventListener('click', () => this.goToScene('scene-02'));
    }

    // Escena 2: 4 Productos en el Mostrador
    document.querySelectorAll('.btn-main-product').forEach(card => {
      card.addEventListener('click', () => {
        const cat = card.dataset.category;
        this.order.category = cat;

        if (cat === 'pastel') {
          this.goToScene('scene-sub-cakes');
        } else if (cat === 'tarta') {
          this.goToScene('scene-sub-tartas');
        } else if (cat === 'cookies') {
          this.goToScene('scene-sub-cookies');
        } else if (cat === 'box') {
          this.goToScene('scene-sub-box');
        }
      });
    });

    // Sub-Escena Pasteles: Tamaños
    document.querySelectorAll('.btn-cake-size-item').forEach(card => {
      card.addEventListener('click', async () => {
        const size = card.dataset.size;
        this.order.cakeSize = size;
        this.order.fillings = this.order.fillings.slice(0, this.getMaxFillings());
        const continueButton = document.getElementById('btn-to-decor-fillings');
        if (continueButton) continueButton.disabled = true;
        const error = document.getElementById('filling-load-error');
        if (error) {
          error.hidden = true;
          error.textContent = '';
        }
        this.goToScene('scene-sub-fillings');
        this.updateCheckoutCalculation();
        try {
          await this.loadFillings();
        } catch (loadError) {
          console.error('No se pudieron cargar los rellenos:', loadError);
          if (continueButton) continueButton.disabled = true;
          if (error) {
            error.textContent = 'No se pudieron cargar los rellenos. Intenta nuevamente en unos segundos.';
            error.hidden = false;
          }
        }
      });
    });

    const continueToDecor = document.getElementById('btn-to-decor-fillings');
    if (continueToDecor) {
      continueToDecor.addEventListener('click', () => {
        this.goToScene('scene-sub-decor');
      });
    }

    const commentInput = document.getElementById('decor-comments-box');
    if (commentInput) {
      commentInput.addEventListener('input', (e) => {
        this.order.comments = e.target.value;
      });
    }

    const photoInput = document.getElementById('decor-photo-uploader');
    if (photoInput) {
      photoInput.addEventListener('change', (e) => {
        const f = e.target.files[0];
        if (f) {
          const r = new FileReader();
          r.onload = (ev) => {
            this.order.referencePhoto = ev.target.result;
            const prev = document.getElementById('decor-preview-photo');
            if (prev) {
              prev.src = ev.target.result;
              prev.style.display = 'block';
            }
          };
          r.readAsDataURL(f);
        }
      });
    }

    const btnToDeliveryFromDecor = document.getElementById('btn-to-delivery-decor');
    if (btnToDeliveryFromDecor) {
      btnToDeliveryFromDecor.addEventListener('click', () => {
        this.goToScene('scene-sub-delivery');
        this.updateCheckoutCalculation();
      });
    }

    // Sub-Escena Tartas
    document.querySelectorAll('.btn-tart-item').forEach(card => {
      card.addEventListener('click', () => {
        this.order.tartName = card.dataset.tart;
        this.goToScene('scene-sub-delivery');
        this.updateCheckoutCalculation();
      });
    });

    // Sub-Escena Galletas y Dulces
    document.querySelectorAll('.btn-cookie-item').forEach(card => {
      card.addEventListener('click', () => {
        this.order.cookieName = card.dataset.item;
        this.goToScene('scene-sub-delivery');
        this.updateCheckoutCalculation();
      });
    });

    // Sub-Escena Box
    const btnBoxOrder = document.getElementById('btn-order-box-tray');
    if (btnBoxOrder) {
      btnBoxOrder.addEventListener('click', () => {
        this.goToScene('scene-sub-delivery');
        this.updateCheckoutCalculation();
      });
    }
  }

  // Renderizar Zonas de Envío Dinámicas
  renderShippingZoneOptions() {
    const dropdown = document.getElementById('delivery-zone-dropdown');
    if (!dropdown) return;

    dropdown.innerHTML = this.shippingZones.map(z => `
      <option value="${z.id}" ${this.order.deliveryZone === z.id ? 'selected' : ''}>
        ${z.name} (+$${Number(z.price).toLocaleString('es-AR')})
      </option>
    `).join('');

    if (!this.shippingZones.some(z => z.id === this.order.deliveryZone) && this.shippingZones.length > 0) {
      this.order.deliveryZone = this.shippingZones[0].id;
    }
  }

  // Renderizar Oferta Sugerida al Finalizar (Upsell Estilo McDonald's)
  renderCheckoutUpsell() {
    const container = document.getElementById('checkout-upsell-container');
    if (!container) return;

    // Buscar una oferta activa para la categoría actual (o general para 'all')
    const currentCategory = this.order.category || 'pastel';
    const matchingOffer = this.upsellOffers.find(o => o.active && (o.triggerCategory === currentCategory || o.triggerCategory === 'all'));

    if (!matchingOffer) {
      container.style.display = 'none';
      container.innerHTML = '';
      this.order.upsellAdded = false;
      this.order.upsellOffer = null;
      return;
    }

    container.style.display = 'block';

    const isAdded = Boolean(this.order.upsellAdded && this.order.upsellOffer && (this.order.upsellOffer.id === matchingOffer.id || this.order.upsellOffer.productName === matchingOffer.productName));
    const savings = (matchingOffer.originalPrice && matchingOffer.originalPrice > matchingOffer.discountPrice)
      ? (matchingOffer.originalPrice - matchingOffer.discountPrice)
      : 0;

    container.innerHTML = `
      <div class="checkout-upsell-banner ${isAdded ? 'selected' : ''}">
        <div class="upsell-header-badge">
          <span class="upsell-badge-pill">
            <span>🎁</span>
            <span>¡OFERTA ESPECIAL AL FINALIZAR!</span>
          </span>
          ${savings > 0 ? `<span class="upsell-save-badge">¡Ahorrás $${savings.toLocaleString('es-AR')}!</span>` : ''}
        </div>

        <div class="upsell-body-content">
          <div class="upsell-question-text">${matchingOffer.message}</div>
          <div class="upsell-product-row">
            <div class="upsell-product-name">${matchingOffer.productName}</div>
            <div class="upsell-pricing-box">
              <span class="upsell-deal-price">$${Number(matchingOffer.discountPrice).toLocaleString('es-AR')}</span>
              ${matchingOffer.originalPrice ? `<span class="upsell-old-price">$${Number(matchingOffer.originalPrice).toLocaleString('es-AR')}</span>` : ''}
            </div>
          </div>
        </div>

        <button type="button" id="btn-toggle-checkout-upsell" class="btn-toggle-upsell ${isAdded ? 'active' : ''}">
          ${isAdded
            ? `✅ ¡Agregado a tu pedido! (Toca para quitar)`
            : `+ Sumar a mi Pedido 🎁 (+$${Number(matchingOffer.discountPrice).toLocaleString('es-AR')})`}
        </button>
      </div>
    `;

    const btnToggle = document.getElementById('btn-toggle-checkout-upsell');
    if (btnToggle) {
      btnToggle.onclick = () => {
        this.toggleUpsellOffer(matchingOffer);
      };
    }
  }

  toggleUpsellOffer(offer) {
    if (this.order.upsellAdded && this.order.upsellOffer && (this.order.upsellOffer.id === offer.id || this.order.upsellOffer.productName === offer.productName)) {
      this.order.upsellAdded = false;
      this.order.upsellOffer = null;
    } else {
      this.order.upsellAdded = true;
      this.order.upsellOffer = offer;
    }

    this.renderCheckoutUpsell();
    this.updateCheckoutCalculation();
  }

  // 4. Entrega (Panel Izquierdo) y Checkout
  initDelivery() {
    const cardMoto = document.getElementById('card-choice-moto');
    const cardCasa = document.getElementById('card-choice-casa');
    const addrBlock = document.getElementById('delivery-address-group');
    const zoneSelect = document.getElementById('delivery-zone-dropdown');

    if (cardMoto && cardCasa) {
      cardMoto.addEventListener('click', () => {
        if (!this.deliveryEnabled) return;
        this.order.deliveryMethod = 'moto';
        cardMoto.classList.add('selected');
        cardCasa.classList.remove('selected');
        if (addrBlock) addrBlock.style.display = 'block';
        this.updateCheckoutCalculation();
      });

      cardCasa.addEventListener('click', () => {
        this.order.deliveryMethod = 'casa';
        cardCasa.classList.add('selected');
        cardMoto.classList.remove('selected');
        if (addrBlock) addrBlock.style.display = 'none';
        this.updateCheckoutCalculation();
      });
    }
    if (zoneSelect) {
      zoneSelect.addEventListener('change', (e) => {
        this.order.deliveryZone = e.target.value;
        this.updateCheckoutCalculation();
      });
    }

    // Configuración de fecha mínima de 72 horas (3 días) de anticipación
    const dateInput = document.getElementById('delivery-input-date');
    if (dateInput) {
      const minDate = new Date();
      minDate.setDate(minDate.getDate() + 3);
      const yyyy = minDate.getFullYear();
      const mm = String(minDate.getMonth() + 1).padStart(2, '0');
      const dd = String(minDate.getDate()).padStart(2, '0');
      const minDateStr = `${yyyy}-${mm}-${dd}`;
      dateInput.min = minDateStr;
      if (!dateInput.value) dateInput.value = minDateStr;

      dateInput.addEventListener('change', (e) => {
        if (e.target.value && e.target.value < minDateStr) {
          alert('⏰ Los pedidos requieren un mínimo de 72 horas (3 días) de anticipación. Por favor selecciona una fecha posterior.');
          e.target.value = minDateStr;
        }
        this.order.eventDate = e.target.value;
      });
    }

    // Botones WhatsApp y Pago de Seña Online
    const btnWhatsApp = document.getElementById('btn-delivery-whatsapp');
    if (btnWhatsApp) {
      btnWhatsApp.addEventListener('click', () => this.sendWhatsAppOrder());
    }

    // Botón Copiar Alias
    const btnCopyAlias = document.getElementById('btn-copy-alias');
    if (btnCopyAlias) {
      btnCopyAlias.addEventListener('click', () => {
        navigator.clipboard.writeText('barriguita.1').then(() => {
          const status = document.getElementById('alias-copy-status');
          if (status) {
            status.textContent = '✅ ¡Copiado!';
            setTimeout(() => { status.textContent = '📋 Copiar'; }, 2500);
          }
        }).catch(() => {
          prompt('Copia el alias para transferir la seña:', 'barriguita.1');
        });
      });
    }
    this.applyDeliveryAvailability();
  }

  applyDeliveryAvailability() {
    const cardMoto = document.getElementById('card-choice-moto');
    const cardCasa = document.getElementById('card-choice-casa');
    const addrBlock = document.getElementById('delivery-address-group');
    const cardsRow = document.querySelector('.delivery-choice-cards-row');
    if (cardMoto) cardMoto.hidden = !this.deliveryEnabled;
    if (cardsRow) cardsRow.style.gridTemplateColumns = this.deliveryEnabled ? '' : '1fr';
    if (!this.deliveryEnabled) this.order.deliveryMethod = 'casa';

    const isHomeDelivery = this.deliveryEnabled && this.order.deliveryMethod === 'moto';
    if (addrBlock) addrBlock.style.display = isHomeDelivery ? 'block' : 'none';
    if (cardMoto) cardMoto.classList.toggle('selected', isHomeDelivery);
    if (cardCasa) cardCasa.classList.toggle('selected', !isHomeDelivery);
    this.updateCheckoutCalculation();
  }

  updateCheckoutCalculation() {
    let basePrice = 0;
    let description = '';

    if (this.order.category === 'pastel') {
      basePrice = this.prices.cakes[this.order.cakeSize] || 27000;
      const sizeNames = {
        '1_5kg': 'Pastel 1.5 kg (1 Piso)',
        '2_5kg': 'Pastel 2.5 kg (1 Piso Alto)',
        '3_5kg': 'Pastel 3.5 kg (2 pisos a elección)',
        '4_0kg': 'Pastel 4.0 kg (2 pisos a elección)'
      };
      description = `${sizeNames[this.order.cakeSize] || 'Pastel'} - ${this.order.decorStyle}`;
      if (this.order.fillings.length) {
        description += ` - Rellenos: ${this.order.fillings.map(filling => filling.name).join(', ')}`;
      }
    } else if (this.order.category === 'tarta') {
      basePrice = this.prices.tarts[this.order.tartName] || 15000;
      description = `Tarta Artesanal: ${this.order.tartName}`;
    } else if (this.order.category === 'cookies') {
      basePrice = this.prices.cookies[this.order.cookieName] || 13500;
      description = `${this.order.cookieName}`;
    } else if (this.order.category === 'box') {
      basePrice = this.prices.box || 18500;
      description = `${this.order.boxName}`;
    }

    let deliveryFee = 0;
    if (this.deliveryEnabled && this.order.deliveryMethod === 'moto') {
      const selectedZone = this.shippingZones.find(z => z.id === this.order.deliveryZone);
      if (selectedZone) {
        deliveryFee = Number(selectedZone.price) || 0;
      } else if (this.prices.delivery && this.prices.delivery[this.order.deliveryZone]) {
        deliveryFee = this.prices.delivery[this.order.deliveryZone];
      } else {
        deliveryFee = 1500;
      }
    }

    let upsellPrice = 0;
    if (this.order.upsellAdded && this.order.upsellOffer) {
      upsellPrice = Number(this.order.upsellOffer.discountPrice) || 0;
    }

    const total = basePrice + deliveryFee + upsellPrice;
    const deposit = Math.round(total * 0.5); // 50% de Seña
    const balance = total - deposit;

    this.calculated = {
      description,
      basePrice,
      deliveryFee,
      upsellPrice,
      total,
      deposit,
      balance
    };

    const descEl = document.getElementById('delivery-summary-desc');
    const totalEl = document.getElementById('delivery-summary-total');
    const depositEl = document.getElementById('delivery-summary-deposit');
    const upsellRow = document.getElementById('summary-upsell-row');
    const upsellLabel = document.getElementById('summary-upsell-label');
    const upsellPriceEl = document.getElementById('summary-upsell-price');

    if (descEl) descEl.textContent = description;
    if (totalEl) totalEl.textContent = `$${total.toLocaleString('es-AR')}`;
    if (depositEl) depositEl.textContent = `$${deposit.toLocaleString('es-AR')}`;

    if (upsellRow) {
      if (this.order.upsellAdded && this.order.upsellOffer) {
        upsellRow.style.display = 'flex';
        if (upsellLabel) upsellLabel.textContent = `🎁 Oferta: ${this.order.upsellOffer.productName}`;
        if (upsellPriceEl) upsellPriceEl.textContent = `+$${upsellPrice.toLocaleString('es-AR')}`;
      } else {
        upsellRow.style.display = 'none';
      }
    }
  }

  sendWhatsAppOrder() {
    if (!this.deliveryEnabled) this.order.deliveryMethod = 'casa';
    const addr = document.getElementById('delivery-input-addr')?.value.trim() || '';
    const dateInput = document.getElementById('delivery-input-date');
    const date = dateInput?.value || '';
    const name = document.getElementById('delivery-input-name')?.value.trim() || '';

    if (!name) {
      alert('Por favor ingresa tu nombre completo.');
      document.getElementById('delivery-input-name')?.focus();
      return;
    }

    if (!date) {
      alert('Por favor selecciona la fecha del evento (mínimo 72 horas de anticipación).');
      dateInput?.focus();
      return;
    }

    if (this.order.deliveryMethod === 'moto' && !addr) {
      alert('Por favor ingresa tu dirección exacta para el envío en moto.');
      document.getElementById('delivery-input-addr')?.focus();
      return;
    }

    // Guardar en Base de Datos Firebase (si está conectada)
    this.recordOrderInDatabase('whatsapp_pendiente', { addr, date, name });

    let msg = `✨🎂 *¡HOLA PASTELERÍA BARRIGUITAS! QUIERO CONFIRMAR MI PEDIDO* 🎂✨\n\n`;
    msg += `🧁 *Producto:* ${this.calculated.description}\n`;

    if (this.order.upsellAdded && this.order.upsellOffer) {
      const u = this.order.upsellOffer;
      const savings = (u.originalPrice && u.originalPrice > u.discountPrice) ? ` (Ahorro $${(u.originalPrice - u.discountPrice).toLocaleString('es-AR')})` : '';
      msg += `🎁 *Oferta Sugerida Agregada:* ${u.productName} por $${Number(u.discountPrice).toLocaleString('es-AR')}${savings}\n`;
    }

    if (this.order.category === 'pastel' && this.order.comments) {
      msg += `📝 *Notas para la decoración:* "${this.order.comments}"\n`;
    }

    const selectedZone = this.shippingZones.find(z => z.id === this.order.deliveryZone);
    const zoneName = selectedZone ? selectedZone.name : (this.order.deliveryZone || 'CENTRO').toUpperCase();

    msg += `🚚 *Entrega:* ${this.order.deliveryMethod === 'moto' && this.deliveryEnabled ? `Envío a domicilio a ${addr} (${zoneName})` : 'Retirar en nuestra casita de chocolate'}\n`;
    if (this.order.category === 'pastel' && this.order.referencePhoto) {
      msg += '📎 Voy a adjuntar la imagen de referencia en este chat.\n';
    }
    msg += `📅 *Fecha del evento:* ${date}\n`;
    msg += `👤 *Cliente:* ${name}\n\n`;

    msg += `💰 *Total Presupuestado:* $${this.calculated.total.toLocaleString('es-AR')}\n`;
    msg += `🔒 *Seña del 50%: * $${this.calculated.deposit.toLocaleString('es-AR')}\n`;
    msg += `🏦 *Alias para la Seña:* barriguita.1\n`;
    msg += `💵 *Saldo restante en entrega:* $${this.calculated.balance.toLocaleString('es-AR')}\n\n`;
    msg += `_(Pedido realizado con 72hs de anticipación conforme a las políticas de la pastelería)_\n`;
    msg += `¡Aguardo su confirmación para transferir la seña!`;

    window.open(`https://wa.me/${this.phoneWhatsApp}?text=${encodeURIComponent(msg)}`, '_blank');
  }

  async recordOrderInDatabase(status = 'pendiente', details = {}) {
    const orderRecord = {
      client_name: details.name || document.getElementById('delivery-input-name')?.value || 'Cliente Web',
      category: this.order.category,
      cake_size: this.order.cakeSize,
      fillings: this.order.fillings.map(filling => filling.name),
      decor_style: this.order.decorStyle,
      comments: this.order.comments,
      delivery_method: this.deliveryEnabled ? this.order.deliveryMethod : 'casa',
      delivery_zone: this.order.deliveryZone,
      delivery_address: details.addr || document.getElementById('delivery-input-addr')?.value || '',
      event_date: details.date || document.getElementById('delivery-input-date')?.value || '',
      total_price: this.calculated.total,
      deposit_50: this.calculated.deposit,
      upsell_item: (this.order.upsellAdded && this.order.upsellOffer) ? `${this.order.upsellOffer.productName} ($${this.order.upsellOffer.discountPrice})` : null,
      payment_status: status
    };

    if (this.firebase && this.isFirebaseConnected) {
      try {
        await this.firebase.from('barriguitas_orders').insert([orderRecord]);
        console.log('Pedido registrado en Firebase con éxito');
      } catch (e) {
        console.warn('Error al registrar pedido en Firebase:', e);
      }
    }
  }

  // 5. Página 5: Carrusel de Galería (3 fotos simultáneas en Desktop, 1 en Móvil)
  initGalleryCarousel() {
    this.renderGalleryCarousel(this.currentGalleryFilter);

    const btnPrev = document.getElementById('btn-gallery-prev');
    const btnNext = document.getElementById('btn-gallery-next');

    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        this.prevGallerySlide();
      });
    }

    if (btnNext) {
      btnNext.addEventListener('click', () => {
        this.nextGallerySlide();
      });
    }

    // Filtros de categoría
    document.querySelectorAll('.filter-pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentGalleryFilter = btn.dataset.filter || 'all';
        this.currentGalleryPage = 0;
        this.renderGalleryCarousel(this.currentGalleryFilter);
      });
    });

    // Re-calcular al cambiar tamaño de pantalla (Desktop 3 vs Móvil 1)
    window.addEventListener('resize', () => {
      this.renderGalleryCarousel(this.currentGalleryFilter);
    });
  }

  prevGallerySlide() {
    const isMobile = window.innerWidth <= 768;
    const pageSize = isMobile ? 1 : 3;
    const filtered = this.currentGalleryFilter === 'all'
      ? this.gallery
      : this.gallery.filter(item => item.cat === this.currentGalleryFilter);
    const totalPages = Math.ceil(filtered.length / pageSize) || 1;

    this.currentGalleryPage = (this.currentGalleryPage - 1 + totalPages) % totalPages;
    this.renderGalleryCarousel(this.currentGalleryFilter);
  }

  nextGallerySlide() {
    const isMobile = window.innerWidth <= 768;
    const pageSize = isMobile ? 1 : 3;
    const filtered = this.currentGalleryFilter === 'all'
      ? this.gallery
      : this.gallery.filter(item => item.cat === this.currentGalleryFilter);
    const totalPages = Math.ceil(filtered.length / pageSize) || 1;

    this.currentGalleryPage = (this.currentGalleryPage + 1) % totalPages;
    this.renderGalleryCarousel(this.currentGalleryFilter);
  }

  renderGalleryCarousel(filter = 'all') {
    const track = document.getElementById('gallery-carousel-track');
    const dotsRow = document.getElementById('gallery-dots-container');
    if (!track) return;

    this.currentGalleryFilter = filter;
    const filtered = filter === 'all'
      ? this.gallery
      : this.gallery.filter(item => item.cat === filter);

    const isMobile = window.innerWidth <= 768;
    const pageSize = isMobile ? 1 : 3;
    const totalPages = Math.ceil(filtered.length / pageSize) || 1;

    if (this.currentGalleryPage >= totalPages) {
      this.currentGalleryPage = 0;
    }

    const startIndex = this.currentGalleryPage * pageSize;
    const currentItems = filtered.slice(startIndex, startIndex + pageSize);

    track.innerHTML = currentItems.map(item => `
      <div class="gallery-cake-card">
        <img src="${item.img}" alt="${item.title}">
        <div class="gallery-card-title">${item.title}</div>
        <span class="gallery-card-cat-badge">${item.cat}</span>
      </div>
    `).join('');

    // Puntitos de paginación interactivos
    if (dotsRow) {
      dotsRow.innerHTML = Array.from({ length: totalPages }).map((_, i) => `
        <div class="reviews-dot ${i === this.currentGalleryPage ? 'active' : ''}" data-gallery-index="${i}"></div>
      `).join('');

      dotsRow.querySelectorAll('.reviews-dot').forEach(dot => {
        dot.onclick = () => {
          this.currentGalleryPage = Number(dot.dataset.galleryIndex);
          this.renderGalleryCarousel(this.currentGalleryFilter);
        };
      });
    }
  }

  // 6. Página 6: Carrusel de Reseñas / Google Maps (3 comentarios, auto-slide 5s)
  initReviewsCarousel() {
    this.renderReviewsCarousel();

    const btnPrev = document.getElementById('btn-reviews-prev');
    const btnNext = document.getElementById('btn-reviews-next');

    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        this.prevReviewSlide();
        this.resetReviewTimer();
      });
    }

    if (btnNext) {
      btnNext.addEventListener('click', () => {
        this.nextReviewSlide();
        this.resetReviewTimer();
      });
    }

    // Pausar rotación automática al pasar el mouse
    const stage = document.querySelector('.reviews-carousel-box');
    if (stage) {
      stage.addEventListener('mouseenter', () => { this.isReviewsHovered = true; });
      stage.addEventListener('mouseleave', () => { this.isReviewsHovered = false; });
      stage.addEventListener('touchstart', () => { this.isReviewsHovered = true; }, { passive: true });
      stage.addEventListener('touchend', () => { this.isReviewsHovered = false; }, { passive: true });
    }

    // Iniciar temporizador automático de 5 segundos
    this.startReviewTimer();

    // Re-calcular al cambiar tamaño de pantalla (Desktop 3 vs Móvil 1)
    window.addEventListener('resize', () => {
      this.renderReviewsCarousel();
    });
  }

  renderReviewsCarousel() {
    const track = document.getElementById('reviews-carousel-track');
    const dotsRow = document.getElementById('reviews-dots-container');
    if (!track) return;

    const isMobile = window.innerWidth <= 768;
    const pageSize = isMobile ? 1 : 3;
    const totalPages = Math.ceil(this.reviews.length / pageSize);

    if (this.currentReviewPage >= totalPages) {
      this.currentReviewPage = 0;
    }

    const startIndex = this.currentReviewPage * pageSize;
    const currentReviews = this.reviews.slice(startIndex, startIndex + pageSize);

    track.replaceChildren();
    currentReviews.forEach(rev => {
      const card = document.createElement('div');
      card.className = 'google-review-card';

      const userHeader = document.createElement('div');
      userHeader.className = 'rev-user-header';
      const avatar = document.createElement('div');
      avatar.className = 'rev-avatar-circle';
      avatar.textContent = (String(rev.name || 'C')).charAt(0).toUpperCase();
      const userInfo = document.createElement('div');
      userInfo.className = 'rev-user-info';
      const userName = document.createElement('div');
      userName.className = 'rev-user-name';
      userName.textContent = rev.name || '';
      const date = document.createElement('div');
      date.className = 'rev-post-date';
      date.textContent = rev.date || 'Reciente';
      userInfo.append(userName, date);
      userHeader.append(avatar, userInfo);

      const stars = document.createElement('div');
      stars.className = 'rev-stars-row';
      const rating = Math.min(5, Math.max(1, Number(rev.rating) || 5));
      stars.textContent = '★'.repeat(rating);
      const quote = document.createElement('p');
      quote.className = 'rev-quote-text';
      quote.textContent = `"${rev.text || ''}"`;

      const verified = document.createElement('div');
      verified.className = 'rev-verified-tag';
      const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      icon.setAttribute('viewBox', '0 0 24 24');
      icon.setAttribute('width', '14');
      icon.setAttribute('height', '14');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('fill', '#059669');
      path.setAttribute('d', 'M12 0L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-5zm-2 16l-4-4 1.41-1.41L10 13.17l6.59-6.59L18 8l-8 8z');
      icon.append(path);
      verified.append(icon, document.createTextNode(' Opinión de Google Maps'));

      card.append(userHeader, stars, quote, verified);
      track.append(card);
    });

    // Puntitos de paginación
    if (dotsRow) {
      dotsRow.innerHTML = Array.from({ length: totalPages }).map((_, i) => `
        <div class="reviews-dot ${i === this.currentReviewPage ? 'active' : ''}" data-index="${i}"></div>
      `).join('');

      dotsRow.querySelectorAll('.reviews-dot').forEach(dot => {
        dot.addEventListener('click', (e) => {
          this.currentReviewPage = parseInt(e.target.dataset.index);
          this.renderReviewsCarousel();
          this.resetReviewTimer();
        });
      });
    }
  }

  nextReviewSlide() {
    const isMobile = window.innerWidth <= 768;
    const pageSize = isMobile ? 1 : 3;
    const totalPages = Math.ceil(this.reviews.length / pageSize);

    this.currentReviewPage = (this.currentReviewPage + 1) % totalPages;
    this.renderReviewsCarousel();
  }

  prevReviewSlide() {
    const isMobile = window.innerWidth <= 768;
    const pageSize = isMobile ? 1 : 3;
    const totalPages = Math.ceil(this.reviews.length / pageSize);

    this.currentReviewPage = (this.currentReviewPage - 1 + totalPages) % totalPages;
    this.renderReviewsCarousel();
  }

  startReviewTimer() {
    clearInterval(this.reviewProgressTimer);
    const progressBar = document.getElementById('reviews-timer-bar');

    this.reviewProgressTimer = setInterval(() => {
      if (!this.isReviewsHovered) {
        this.reviewElapsedMs += 100;
        if (progressBar) {
          const pct = Math.min(100, (this.reviewElapsedMs / this.reviewCycleMs) * 100);
          progressBar.style.width = pct + '%';
        }

        if (this.reviewElapsedMs >= this.reviewCycleMs) {
          this.reviewElapsedMs = 0;
          this.nextReviewSlide();
        }
      }
    }, 100);
  }

  resetReviewTimer() {
    this.reviewElapsedMs = 0;
    const progressBar = document.getElementById('reviews-timer-bar');
    if (progressBar) progressBar.style.width = '0%';
  }

  // 7. Página 7: Promociones Elevadas
  renderPromos() {
    const grid = document.getElementById('promos-container-grid');
    if (!grid) return;

    grid.replaceChildren();
    this.promos.forEach(promo => {
      const card = document.createElement('article');
      card.className = 'promo-bubble-card';
      if (promo.img) {
        const image = document.createElement('img');
        image.className = 'promo-card-image';
        image.src = promo.img;
        image.alt = `Imagen de ${promo.title}`;
        card.append(image);
      }

      const details = document.createElement('div');
      const badge = document.createElement('span');
      badge.className = 'hero-tag-pill';
      badge.textContent = promo.badge || 'Promo Especial';
      const title = document.createElement('h4');
      title.className = 'promo-card-title';
      title.textContent = promo.title;
      const description = document.createElement('p');
      description.className = 'promo-card-description';
      description.textContent = promo.desc;
      details.append(badge, title, description);

      const footer = document.createElement('div');
      footer.className = 'promo-card-footer';
      const price = document.createElement('span');
      price.className = 'promo-card-price';
      price.textContent = `$${Number(promo.price).toLocaleString('es-AR')}`;
      const link = document.createElement('a');
      link.href = `https://wa.me/${this.phoneWhatsApp}?text=${encodeURIComponent(`Hola! Quiero pedir la promo: ${promo.title}`)}`;
      link.target = '_blank';
      link.rel = 'noopener';
      link.className = 'nav-admin-btn promo-card-order';
      link.textContent = 'Pedir por WhatsApp';
      footer.append(price, link);
      card.append(details, footer);
      grid.append(card);
    });
  }

  // 8. Diálogo Público de Reseñas para Google Maps
  initPublicReviewDialog() {
    const btnOpen = document.getElementById('btn-open-review-dialog');
    const dialog = document.getElementById('dialog-add-review');
    const btnClose = document.getElementById('btn-close-review-dialog');
    const formReview = document.getElementById('form-add-public-review');

    if (btnOpen && dialog) {
      btnOpen.addEventListener('click', () => {
        dialog.style.display = 'flex';
      });
    }

    if (btnClose && dialog) {
      btnClose.addEventListener('click', () => {
        dialog.style.display = 'none';
      });
    }

    if (dialog) {
      dialog.addEventListener('click', (e) => {
        if (e.target === dialog) dialog.style.display = 'none';
      });
    }

    if (formReview) {
      formReview.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('public-review-name').value.trim();
        const text = document.getElementById('public-review-text').value.trim();
        const rating = parseInt(document.getElementById('public-review-stars').value) || 5;

        const newReview = { id: Date.now(), name, rating, date: 'Hoy', text };
        this.reviews.unshift(newReview);
        localStorage.setItem('barriguitas_reviews_v2', JSON.stringify(this.reviews));
        this.renderReviewsCarousel();

        if (this.firebase && this.isFirebaseConnected) {
          try {
            await this.firebase.from('barriguitas_reviews').insert([{
              name, rating, text, date_text: 'Hoy'
            }]);
          } catch (err) {
            console.warn('Error al enviar reseña a Firebase:', err);
          }
        }

        alert('¡Muchas gracias por dejarnos tu reseña en Google Maps!');
        formReview.reset();
        if (dialog) dialog.style.display = 'none';
      });
    }
  }

  // 9. Integración Silenciosa con Firebase
  initFirebaseConnector() {
    this.firebase = window.firebaseApi;
    this.isFirebaseConnected = Boolean(this.firebase);
    if (this.isFirebaseConnected) this.fetchDataFromFirebase(false);
  }

  async loadFillings() {
    const result = await this.firebase.from('barriguitas_fillings').select('*');
    if (result.error) throw result.error;
    this.fillings = (result.data || [])
      .filter(filling => filling.active === true)
      .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
    this.renderFillings();
  }

  getMaxFillings() {
    const kilograms = Number(this.order.cakeSize.replace('kg', '').replace('_', '.'));
    return kilograms <= 2 ? 2 : 3;
  }

  renderFillings() {
    const container = document.getElementById('filling-categories');
    const guidance = document.getElementById('filling-selection-guidance');
    const continueButton = document.getElementById('btn-to-decor-fillings');
    const maxFillings = this.getMaxFillings();
    if (guidance) {
      const sizeGuidance = maxFillings === 3
        ? 'Para este tamaño podés elegir hasta 3 rellenos.'
        : 'Para pasteles de hasta 2 kg podés elegir hasta 2 rellenos.';
      guidance.textContent = `Si elegís más de 2 kg podés elegir hasta 3 rellenos (consultar disponibilidad). ${sizeGuidance}`;
    }
    if (!container) return;

    const groups = [
      { category: 'without_cold_chain', title: 'RELLENOS RIQUÍSIMOS (SIN FRÍO OBLIGATORIO)' },
      { category: 'requires_cold_chain', title: 'RELLENOS MÁS RICOS (NECESITAN FRÍO)' }
    ];
    container.replaceChildren();
    groups.forEach((group) => {
      const details = document.createElement('details');
      details.className = 'filling-category';
      details.open = true;
      const summary = document.createElement('summary');
      summary.textContent = group.title;
      const list = document.createElement('div');
      list.className = 'filling-options-list';
      this.fillings.filter(filling => filling.category === group.category).forEach((filling) => {
        const label = document.createElement('label');
        label.className = 'filling-option';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = filling.id;
        checkbox.checked = this.order.fillings.some(selected => selected.id === filling.id);
        const name = document.createElement('span');
        name.textContent = filling.name;
        checkbox.addEventListener('change', () => {
          if (checkbox.checked) {
            if (this.order.fillings.length >= maxFillings) {
              checkbox.checked = false;
              window.alert(`Para este tamaño podés elegir hasta ${maxFillings} rellenos.`);
              return;
            }
            this.order.fillings.push({ id: filling.id, name: filling.name });
          } else {
            this.order.fillings = this.order.fillings.filter(selected => selected.id !== filling.id);
          }
          this.renderFillings();
          this.updateCheckoutCalculation();
        });
        label.append(checkbox, name);
        list.append(label);
      });
      details.append(summary, list);
      container.append(details);
    });
    if (continueButton) {
      continueButton.disabled = this.order.fillings.length === 0;
      continueButton.textContent = `Continuar a la decoración (${this.order.fillings.length}/${maxFillings}) 🎂`;
    }
  }

  async connectFirebase(showAlert = false) {
    if (!window.firebaseApi) {
      if (showAlert) alert('La librería Firebase JS no pudo cargarse.');
      return;
    }

    try {
      this.firebase = window.firebaseApi;
      this.isFirebaseConnected = true;
      await this.fetchDataFromFirebase(false);

      if (showAlert) {
        alert('✅ ¡Conexión con Firebase establecida con éxito! Tu base de datos está sincronizada.');
      }
    } catch (err) {
      this.isFirebaseConnected = false;
      if (showAlert) {
        alert('⚠️ No se pudo conectar a Firebase:\n' + (err.message || 'Revisa el despliegue de la API y sus variables de entorno.'));
      }
    }
  }

  async fetchDataFromFirebase(showAlert = false) {
    if (!this.firebase || !this.isFirebaseConnected) {
      if (showAlert) alert('Primero conecta tu proyecto de Firebase.');
      return;
    }

    try {
      // 1. Precios
      const { data: pricesData } = await this.firebase.from('barriguitas_prices').select('*');
      if (pricesData && pricesData.length > 0) {
        pricesData.forEach(p => {
          if (p.category === 'cakes') this.prices.cakes[p.item_key] = Number(p.price);
          if (p.category === 'cake_kg') this.prices.cakePricePerKg = Number(p.price);
          if (p.category === 'tarts') {
            if (!this.prices.tarts) this.prices.tarts = {};
            this.prices.tarts[p.item_key] = Number(p.price);
          }
          if (p.category === 'cookies') {
            if (!this.prices.cookies) this.prices.cookies = {};
            this.prices.cookies[p.item_key] = Number(p.price);
          }
          if (p.category === 'box') {
            this.prices.box = Number(p.price);
            if (p.metadata) this.prices.boxDescription = p.metadata;
          }
        });
        localStorage.setItem('barriguitas_prices', JSON.stringify(this.prices));
        this.renderProductPrices();
        this.updateCheckoutCalculation();
      }

      // 2. Zonas de Envío
      const { data: settingsData, error: settingsError } = await this.firebase.from('barriguitas_store_settings').select('*');
      if (settingsError) throw settingsError;
      const deliverySettings = (settingsData || []).find(setting => setting.id === 'delivery');
      if (deliverySettings && typeof deliverySettings.enabled === 'boolean') {
        this.deliveryEnabled = deliverySettings.enabled;
        localStorage.setItem('barriguitas_delivery_enabled', String(this.deliveryEnabled));
        this.applyDeliveryAvailability();
      }

      const { data: shippingData } = await this.firebase.from('barriguitas_shipping_zones').select('*');
      if (shippingData && shippingData.length > 0) {
        this.shippingZones = shippingData.map(z => ({
          id: z.id,
          name: z.name,
          price: Number(z.price),
          active: z.active ?? true
        }));
        localStorage.setItem('barriguitas_shipping_zones', JSON.stringify(this.shippingZones));
        this.renderShippingZoneOptions();
        this.updateCheckoutCalculation();
      }

      // 3. Ofertas Sugeridas (Upsell McDonald's)
      const { data: upsellData } = await this.firebase.from('barriguitas_upsell_offers').select('*');
      if (upsellData && upsellData.length > 0) {
        this.upsellOffers = upsellData.map(u => ({
          id: u.id,
          triggerCategory: u.trigger_category || 'all',
          message: u.message,
          productName: u.product_name,
          discountPrice: Number(u.discount_price),
          originalPrice: Number(u.original_price || 0),
          active: u.active ?? true
        }));
        localStorage.setItem('barriguitas_upsell_offers', JSON.stringify(this.upsellOffers));
        this.renderCheckoutUpsell();
      }

      // 4. Promociones
      const { data: promosData } = await this.firebase.from('barriguitas_promos').select('*').order('id', { ascending: false });
      if (promosData && promosData.length > 0) {
        this.promos = promosData.map(p => ({
          id: p.id,
          badge: p.badge,
          title: p.title,
          desc: p.description,
          price: Number(p.price),
          img: p.image_url || ''
        }));
        localStorage.setItem('barriguitas_promos', JSON.stringify(this.promos));
        this.renderPromos();
      }

      // 5. Reseñas
      const { data: reviewsData } = await this.firebase.from('barriguitas_reviews').select('*').order('id', { ascending: false });
      if (reviewsData && reviewsData.length > 0) {
        this.reviews = reviewsData.map(r => ({
          id: r.id,
          name: r.name,
          rating: Number(r.rating) || 5,
          date: r.date_text || 'Reciente',
          text: r.text
        }));
        localStorage.setItem('barriguitas_reviews_v2', JSON.stringify(this.reviews));
        this.renderReviewsCarousel();
      }

      // 6. Galería
      const { data: galleryData } = await this.firebase.from('barriguitas_gallery').select('*').order('id', { ascending: false });
      if (galleryData && galleryData.length > 0) {
        this.gallery = galleryData.map(g => ({
          id: g.id,
          title: g.title,
          cat: g.category,
          img: g.image_url
        }));
        localStorage.setItem('barriguitas_gallery_v2', JSON.stringify(this.gallery));
        this.renderGalleryCarousel('all');
      }

      if (showAlert) alert('¡Datos descargados y sincronizados desde Firebase!');
    } catch (err) {
      console.warn('Error al descargar de Firebase:', err);
      if (showAlert) alert('Error al descargar datos: ' + err.message);
    }
  }

  async syncLocalDataToFirebase() {
    if (!this.firebase || !this.isFirebaseConnected) {
      alert('Conecta primero tu proyecto Firebase.');
      return;
    }

    try {
      // Subir Precios
      const priceRecords = [
        { id: 'cake_price_kg', category: 'cake_kg', item_key: 'kg', price: this.prices.cakePricePerKg || 18000, metadata: 'Precio base por kg' },
        { id: 'cake_1_5kg', category: 'cakes', item_key: '1_5kg', price: this.prices.cakes['1_5kg'] },
        { id: 'cake_2_5kg', category: 'cakes', item_key: '2_5kg', price: this.prices.cakes['2_5kg'] },
        { id: 'cake_3_5kg', category: 'cakes', item_key: '3_5kg', price: this.prices.cakes['3_5kg'] },
        { id: 'cake_4_0kg', category: 'cakes', item_key: '4_0kg', price: this.prices.cakes['4_0kg'] },
        { id: 'box_degustacion', category: 'box', item_key: 'box', price: this.prices.box, metadata: this.prices.boxDescription }
      ];

      Object.entries(this.prices.tarts || {}).forEach(([name, price]) => {
        const idKey = 'tart_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        priceRecords.push({ id: idKey, category: 'tarts', item_key: name, price });
      });

      Object.entries(this.prices.cookies || {}).forEach(([name, price]) => {
        const idKey = 'cookie_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        priceRecords.push({ id: idKey, category: 'cookies', item_key: name, price });
      });

      await this.firebase.from('barriguitas_prices').upsert(priceRecords);

      // Subir Zonas de Envío
      for (const z of this.shippingZones) {
        await this.firebase.from('barriguitas_shipping_zones').upsert([{
          id: z.id,
          name: z.name,
          price: z.price,
          active: z.active ?? true
        }]);
      }

      // Subir Ofertas de Upsell
      for (const u of this.upsellOffers) {
        await this.firebase.from('barriguitas_upsell_offers').upsert([{
          id: u.id,
          trigger_category: u.triggerCategory,
          message: u.message,
          product_name: u.productName,
          discount_price: u.discountPrice,
          original_price: u.originalPrice,
          active: u.active ?? true
        }]);
      }

      // Subir Promos
      for (const p of this.promos) {
        await this.firebase.from('barriguitas_promos').upsert([{
          badge: p.badge,
          title: p.title,
          description: p.desc,
          price: p.price
        }]);
      }

      // Subir Reseñas
      for (const r of this.reviews) {
        await this.firebase.from('barriguitas_reviews').upsert([{
          name: r.name,
          rating: r.rating,
          date_text: r.date,
          text: r.text
        }]);
      }

      alert('✅ ¡Todos los datos locales se han subido con éxito a tu base de datos Firebase!');
    } catch (err) {
      alert('Error al subir datos a Firebase:\n' + err.message);
    }
  }

  // 10. Escuchar cambios de localStorage en tiempo real entre pestañas
  initStorageListener() {
    window.addEventListener('storage', (e) => {
      if (e.key === 'barriguitas_prices') {
        try {
          this.prices = JSON.parse(e.newValue);
          this.renderProductPrices();
          this.updateCheckoutCalculation();
        } catch (err) {}
      }
      if (e.key === 'barriguitas_shipping_zones') {
        try {
          this.shippingZones = JSON.parse(e.newValue);
          this.renderShippingZoneOptions();
          this.updateCheckoutCalculation();
        } catch (err) {}
      }
      if (e.key === 'barriguitas_upsell_offers') {
        try {
          this.upsellOffers = JSON.parse(e.newValue);
          this.renderCheckoutUpsell();
        } catch (err) {}
      }
      if (e.key === 'barriguitas_promos') {
        try {
          this.promos = JSON.parse(e.newValue);
          this.renderPromos();
        } catch (err) {}
      }
      if (e.key === 'barriguitas_gallery_v2') {
        try {
          this.gallery = JSON.parse(e.newValue);
          this.renderGalleryCarousel(this.currentGalleryFilter || 'all');
        } catch (err) {}
      }
      if (e.key === 'barriguitas_reviews_v2') {
        try {
          this.reviews = JSON.parse(e.newValue);
          this.renderReviewsCarousel();
        } catch (err) {}
      }
    });
  }

  // 14. Desplazamiento Táctil Global: Permite desplazar/scrollear el marco interactivo tocando cualquier parte de la pantalla o la imagen de fondo
  initGlobalSceneScroll() {
    let touchStartY = 0;
    let touchStartX = 0;
    let lastTouchY = 0;
    let lastTime = 0;
    let velocityY = 0;
    let isDraggingBackground = false;
    let momentumAnimId = null;

    const isInteractiveTarget = target => target instanceof Element
      && Boolean(target.closest('a, button, input, select, textarea, [contenteditable="true"]'));

    const getActiveScrollable = () => {
      const activeScene = document.querySelector('.scene-frame.active');
      if (!activeScene) return null;
      return activeScene.querySelector(
        '.overlay-hero-glass, .counter-table-stage, .decor-panel-right, .delivery-panel-left, .box-presentation-card, .promos-container-elevated, .carousel-container-box, .reviews-carousel-box, .gallery-carousel-transparent-stage'
      );
    };

    const stopMomentum = () => {
      if (momentumAnimId) {
        cancelAnimationFrame(momentumAnimId);
        momentumAnimId = null;
      }
    };

    // Eventos táctiles en toda la pantalla
    document.addEventListener('touchstart', (e) => {
      stopMomentum();
      if (!e.touches || e.touches.length !== 1) return;

      const touch = e.touches[0];
      touchStartY = touch.clientY;
      touchStartX = touch.clientX;
      lastTouchY = touch.clientY;
      lastTime = performance.now();
      velocityY = 0;

      isDraggingBackground = Boolean(getActiveScrollable()) && !isInteractiveTarget(e.target);
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
      if (!isDraggingBackground || !e.touches || e.touches.length !== 1) return;
      const scrollable = getActiveScrollable();
      if (!scrollable) return;

      const touch = e.touches[0];
      const currentY = touch.clientY;
      const currentX = touch.clientX;
      const deltaY = lastTouchY - currentY;
      const deltaX = touchStartX - currentX;

      // Movimiento vertical prioritario
      if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 2) {
        e.preventDefault();
        const now = performance.now();
        const dt = Math.max(now - lastTime, 8);
        velocityY = deltaY / dt;

        // Desplazar el contenido del marco suavemente
        scrollable.scrollTop += deltaY;

        lastTouchY = currentY;
        lastTime = now;
      }
    }, { passive: false });

    document.addEventListener('touchend', () => {
      if (isDraggingBackground) {
        const scrollable = getActiveScrollable();
        if (scrollable && Math.abs(velocityY) > 0.12) {
          // Desplazamiento fluido con inercia
          let currentVelocity = velocityY * 15;
          const applyMomentum = () => {
            if (Math.abs(currentVelocity) > 0.4) {
              scrollable.scrollTop += currentVelocity;
              currentVelocity *= 0.92;
              momentumAnimId = requestAnimationFrame(applyMomentum);
            } else {
              stopMomentum();
            }
          };
          momentumAnimId = requestAnimationFrame(applyMomentum);
        }
      }
      isDraggingBackground = false;
    }, { passive: true });

    // Desplazamiento con rueda de mouse en PC cuando el cursor está sobre el fondo
    window.addEventListener('wheel', (e) => {
      const scrollable = getActiveScrollable();
      if (scrollable && !isInteractiveTarget(e.target)) {
        e.preventDefault();
        scrollable.scrollTop += e.deltaY;
      }
    }, { passive: false });
  }

}

document.addEventListener('DOMContentLoaded', () => {
  window.barriguitas = new BarriguitasApp();
});
