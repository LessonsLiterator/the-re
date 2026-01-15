/**
 * SHADOWMATIC PRO ENGINE
 * Физические тени + Невидимый трафарет
 */

let scene, camera, renderer, artifactGroup, spotlight;
let currentLvl = 1;
let isDragging = false;
let solved = false;

const loader = new THREE.TextureLoader();

function init() {
    scene = new THREE.Scene();
    // Тусклый фон всей комнаты
    scene.background = new THREE.Color(0x111111);

    camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 14);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Качественные тени
    document.getElementById('render-container').appendChild(renderer.domElement);

    // 1. СТЕНА (на весь экран)
    const wallGeo = new THREE.PlaneGeometry(100, 100);
    const wallMat = new THREE.MeshStandardMaterial({ 
        color: 0x222222, 
        roughness: 0.8,
        metalness: 0.1 
    });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.z = -6; // Стена чуть дальше
    wall.receiveShadow = true;
    scene.add(wall);

    // 2. ПРОЖЕКТОР (Источник тени)
    spotlight = new THREE.SpotLight(0xffffff, 3);
    spotlight.position.set(0, 0, 20); // Светит прямо из-за камеры
    spotlight.penumbra = 0.3; // Мягкие края тени
    spotlight.castShadow = true;
    spotlight.shadow.mapSize.width = 2048; 
    spotlight.shadow.mapSize.height = 2048;
    spotlight.shadow.camera.near = 5;
    spotlight.shadow.camera.far = 40;
    scene.add(spotlight);

    // Подсветка, чтобы объект не был черным пятном
    const ambient = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambient);

    // 3. АРТЕФАКТ (Объект в центре)
    artifactGroup = new THREE.Group();
    scene.add(artifactGroup);

    loadLevel(currentLvl);
    addControls();
    animate();
}

function loadLevel(lvl) {
    // Очистка
    while(artifactGroup.children.length > 0) artifactGroup.remove(artifactGroup.children[0]);
    solved = false;
    document.getElementById('lvl-id').innerText = lvl;

    // ГЛАВНЫЙ СЕКРЕТ: Теневой трафарет
    loader.load(`assets/shadows/${lvl}.png`, (texture) => {
        const material = new THREE.MeshPhongMaterial({
            alphaMap: texture,      // Картинка определяет прозрачность
            transparent: true,
            opacity: 1,
            color: 0x000000,
            side: THREE.DoubleSide,
            // colorWrite: false делает объект невидимым для камеры, но он все еще отбрасывает тень!
            colorWrite: false 
        });
        
        const stencil = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), material);
        stencil.castShadow = true;
        artifactGroup.add(stencil);
    });

    // АБСТРАКТНЫЕ ОСКОЛКИ (Вместо цепей)
    // Делаем их из случайных многогранников
    const shardMat = new THREE.MeshStandardMaterial({ 
        color: 0x444444, 
        metalness: 0.6, 
        roughness: 0.3 
    });

    for(let i = 0; i < 20; i++) {
        // Случайная геометрия осколка
        const shardGeo = new THREE.IcosahedronGeometry(Math.random() * 0.6, 0);
        const shard = new THREE.Mesh(shardGeo, shardMat);
        
        // Разбрасываем осколки вокруг центра
        shard.position.set(
            (Math.random() - 0.5) * 4,
            (Math.random() - 0.5) * 4,
            (Math.random() - 0.5) * 1.5
        );
        shard.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        shard.castShadow = true;
        artifactGroup.add(shard);
    }

    // Случайный начальный поворот
    artifactGroup.rotation.set(Math.random() * 5, Math.random() * 5, 0);
}

function addControls() {
    window.addEventListener('mousedown', () => isDragging = true);
    window.addEventListener('mouseup', () => isDragging = false);
    window.addEventListener('mousemove', (e) => {
        if (!isDragging || solved) return;
        
        // Вращение как в Shadowmatic
        artifactGroup.rotation.y += e.movementX * 0.008;
        artifactGroup.rotation.x += e.movementY * 0.008;

        checkSolve();
    });
}

function checkSolve() {
    // Тень совпадает, когда вращение близко к 0
    const rx = Math.abs(artifactGroup.rotation.x % (Math.PI * 2));
    const ry = Math.abs(artifactGroup.rotation.y % (Math.PI * 2));
    
    const limit = 0.2; 
    if ((rx < limit || rx > 6.1) && (ry < limit || ry > 6.1)) {
        win();
    }
}

function win() {
    solved = true;
    gsap.to(artifactGroup.rotation, { x: 0, y: 0, duration: 0.6 });
    gsap.to("#victory-flash", { opacity: 0.3, duration: 0.1, yoyo: true, repeat: 1 });

    setTimeout(() => {
        if (currentLvl < 5) {
            currentLvl++;
            loadLevel(currentLvl);
        } else {
            alert("ЛЕГЕНДАРНО! ВСЕ ТЕНИ СОБРАНЫ.");
        }
    }, 2000);
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

init();
