/**
 * THE ROOM: SHADOW REALM ENGINE
 */

let scene, camera, renderer, spotlight, artifactGroup, shadowPlane, colorPlane;
let currentLvl = 1;
let isDragging = false;
let solved = false;

// Целевые углы (каждый уровень требует своего поворота)
const targets = [
    { x: 0, y: 0 },         // 1: Эмблема
    { x: 1.5, y: 2.2 },     // 2: Пистолет
    { x: 3.5, y: 1.0 },     // 3: Думающий
    { x: 5.2, y: 4.1 },     // 4: Обычный
    { x: 2.0, y: 3.5 }      // 5: Девочка
];

const loader = new THREE.TextureLoader();

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 10);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('container').appendChild(renderer.domElement);

    // 1. СТЕНА
    const wallGeo = new THREE.PlaneGeometry(25, 25);
    const wallMat = new THREE.MeshStandardMaterial({ 
        color: 0x1a1a1a, 
        roughness: 0.9 
    });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.z = -5;
    scene.add(wall);

    // 2. СЛОЙ ТЕНИ (assets/shadows)
    shadowPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(6, 6),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, color: 0x000000 })
    );
    shadowPlane.position.z = -4.9;
    scene.add(shadowPlane);

    // 3. СЛОЙ ЦВЕТА (assets/colors)
    colorPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(6, 6),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
    );
    colorPlane.position.z = -4.8;
    scene.add(colorPlane);

    // 4. АРТЕФАКТ (Механический хаос)
    artifactGroup = new THREE.Group();
    createArtifact();
    scene.add(artifactGroup);

    // 5. СВЕТ
    spotlight = new THREE.PointLight(0xffeebb, 2, 20);
    spotlight.position.set(0, 2, 8);
    scene.add(spotlight);
    scene.add(new THREE.AmbientLight(0x404040, 0.5));

    loadLevel(currentLvl);
    addControls();
    animate();
}

function createArtifact() {
    // Создаем "сложный" объект из случайных золотых деталей
    const geometries = [
        new THREE.TorusGeometry(0.5, 0.1, 8, 16),
        new THREE.BoxGeometry(0.3, 0.8, 0.2),
        new THREE.CylinderGeometry(0.1, 0.1, 1, 8),
        new THREE.SphereGeometry(0.2, 8, 8)
    ];
    const goldMat = new THREE.MeshStandardMaterial({ 
        color: 0xaa8844, 
        metalness: 0.9, 
        roughness: 0.1 
    });

    for(let i = 0; i < 40; i++) {
        const mesh = new THREE.Mesh(geometries[Math.floor(Math.random()*geometries.length)], goldMat);
        mesh.position.set((Math.random()-0.5)*3, (Math.random()-0.5)*3, (Math.random()-0.5)*3);
        mesh.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, 0);
        artifactGroup.add(mesh);
    }
}

function loadLevel(lvl) {
    solved = false;
    document.getElementById('lvl-idx').innerText = lvl;
    
    // Сбрасываем прозрачность
    shadowPlane.material.opacity = 0;
    colorPlane.material.opacity = 0;

    // Загружаем картинки
    loader.load(`assets/shadows/${lvl}.png`, (tex) => {
        shadowPlane.material.map = tex;
        shadowPlane.material.needsUpdate = true;
    });
    loader.load(`assets/colors/${lvl}.png`, (tex) => {
        colorPlane.material.map = tex;
        colorPlane.material.needsUpdate = true;
    });

    // Случайный поворот артефакта
    artifactGroup.rotation.set(Math.random()*5, Math.random()*5, 0);
}

function addControls() {
    window.addEventListener('mousedown', () => isDragging = true);
    window.addEventListener('mouseup', () => isDragging = false);
    window.addEventListener('mousemove', (e) => {
        if (!isDragging || solved) return;
        artifactGroup.rotation.y += e.movementX * 0.01;
        artifactGroup.rotation.x += e.movementY * 0.01;
        updateShadowLogic();
    });
}

function updateShadowLogic() {
    const target = targets[currentLvl - 1];
    const rx = artifactGroup.rotation.x % (Math.PI * 2);
    const ry = artifactGroup.rotation.y % (Math.PI * 2);

    // Считаем дистанцию до цели
    const dist = Math.sqrt(Math.pow(rx - target.x, 2) + Math.pow(ry - target.y, 2));

    // Проявление тени (чем ближе, тем четче)
    if (dist < 1.0) {
        shadowPlane.material.opacity = 1.0 - dist;
        // Эффект "блюра" через масштаб (имитация)
        const s = 1.0 + dist * 0.5;
        shadowPlane.scale.set(s, s, s);
    } else {
        shadowPlane.material.opacity = 0;
    }

    // Если очень близко - победа
    if (dist < 0.15) {
        win();
    }
}

function win() {
    solved = true;
    gsap.to(artifactGroup.rotation, { x: targets[currentLvl-1].x, y: targets[currentLvl-1].y, duration: 0.5 });
    
    // Вспышка и проявление цвета
    gsap.to("#flash", { opacity: 0.6, duration: 0.1, yoyo: true, repeat: 1 });
    gsap.to(colorPlane.material, { opacity: 1, duration: 1.5 });

    setTimeout(() => {
        if (currentLvl < 5) {
            currentLvl++;
            loadLevel(currentLvl);
        } else {
            alert("Все тайны раскрыты.");
        }
    }, 3000);
}

function animate() {
    requestAnimationFrame(animate);
    // Легкое парение артефакта
    if (!isDragging) {
        artifactGroup.position.y = Math.sin(Date.now()*0.001)*0.1;
    }
    renderer.render(scene, camera);
}

init();
