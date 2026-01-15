/**
 * SHADOWMATIC ULTIMATE ENGINE
 */

let scene, camera, renderer, artifactGroup, spotlight, wall;
let currentLvl = 1;
let isDragging = false;
let solved = false;

const loader = new THREE.TextureLoader();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505); // Глубокий черный фон

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 15);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Очень мягкие тени
    document.getElementById('render-container').appendChild(renderer.domElement);

    // 1. ОГРОМНАЯ СТЕНА (Чтобы не было видно краев)
    const wallGeo = new THREE.PlaneGeometry(200, 200);
    const wallMat = new THREE.MeshStandardMaterial({ 
        color: 0x1a1a1a, 
        roughness: 1,
        metalness: 0
    });
    wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.z = -8; 
    wall.receiveShadow = true;
    scene.add(wall);

    // 2. ПРОЖЕКТОР (Как в кино)
    spotlight = new THREE.SpotLight(0xffffff, 4);
    spotlight.position.set(0, 0, 25);
    spotlight.angle = Math.PI / 6;
    spotlight.penumbra = 0.5; // Размытые края светового пятна
    spotlight.decay = 2;
    spotlight.distance = 100;
    
    spotlight.castShadow = true;
    spotlight.shadow.mapSize.width = 2048;
    spotlight.shadow.mapSize.height = 2048;
    spotlight.shadow.camera.near = 10;
    spotlight.shadow.camera.far = 50;
    spotlight.shadow.radius = 4; // Дополнительное размытие тени
    scene.add(spotlight);

    // Дополнительный свет для объема объектов
    const backLight = new THREE.PointLight(0xffffff, 0.5);
    backLight.position.set(5, 5, 10);
    scene.add(backLight);

    // 3. АРТЕФАКТ
    artifactGroup = new THREE.Group();
    scene.add(artifactGroup);

    loadLevel(currentLvl);
    addControls();
    animate();
}

function loadLevel(lvl) {
    while(artifactGroup.children.length > 0) artifactGroup.remove(artifactGroup.children[0]);
    solved = false;
    document.getElementById('lvl-id').innerText = lvl;

    // ЗАГРУЗКА СКРЫТОГО ТРАФАРЕТА
    loader.load(`assets/shadows/${lvl}.png`, (texture) => {
        // Убираем черный квадрат вокруг маскота через alphaTest
        const material = new THREE.MeshPhongMaterial({
            alphaMap: texture,
            transparent: true,
            alphaTest: 0.5, // ГАРАНТИРУЕТ, ЧТО ПРОЗРАЧНОЕ НЕ БУДЕТ ДАВАТЬ ТЕНЬ
            side: THREE.DoubleSide,
            colorWrite: false, // Объект полностью невидим
            depthWrite: false
        });
        
        const stencil = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), material);
        stencil.castShadow = true;
        artifactGroup.add(stencil);
    });

    // СОЗДАЕМ КРАСИВЫЕ ОБЪЕКТЫ (МЕТАЛЛИЧЕСКИЕ ОСКОЛКИ)
    const shardMat = new THREE.MeshStandardMaterial({ 
        color: 0x222222, 
        metalness: 1, 
        roughness: 0.2 
    });

    for(let i = 0; i < 15; i++) {
        const size = Math.random() * 0.7 + 0.3;
        const shardGeo = new THREE.IcosahedronGeometry(size, 0);
        const shard = new THREE.Mesh(shardGeo, shardMat);
        
        shard.position.set(
            (Math.random() - 0.5) * 5,
            (Math.random() - 0.5) * 5,
            (Math.random() - 0.5) * 2
        );
        shard.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        shard.castShadow = true;
        artifactGroup.add(shard);
    }

    artifactGroup.rotation.set(Math.random() * 5, Math.random() * 5, 0);
}

function addControls() {
    window.addEventListener('mousedown', () => isDragging = true);
    window.addEventListener('mouseup', () => isDragging = false);
    window.addEventListener('mousemove', (e) => {
        if (!isDragging || solved) return;
        
        // Плавное вращение
        artifactGroup.rotation.y += e.movementX * 0.007;
        artifactGroup.rotation.x += e.movementY * 0.007;

        checkSolve();
    });
}

function checkSolve() {
    const rx = Math.abs(artifactGroup.rotation.x % (Math.PI * 2));
    const ry = Math.abs(artifactGroup.rotation.y % (Math.PI * 2));
    
    if ((rx < 0.2 || rx > 6.1) && (ry < 0.2 || ry > 6.1)) {
        solved = true;
        gsap.to(artifactGroup.rotation, { x: 0, y: 0, duration: 0.8, ease: "back.out(1.7)" });
        gsap.to("#victory-flash", { opacity: 0.4, duration: 0.1, yoyo: true, repeat: 1 });

        setTimeout(() => {
            if (currentLvl < 5) {
                currentLvl++;
                loadLevel(currentLvl);
            } else {
                alert("ВСЕ ТЕНИ СОБРАНЫ!");
            }
        }, 2500);
    }
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

init();
