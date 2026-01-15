/**
 * The Room: Shadow Engine
 * Логика: Тень из assets/shadows -> Цвет из assets/colors
 */

let scene, camera, renderer, artifact, spotlight, wall, colorOverlay;
let currentLvl = 1;
let isDragging = false;
let solved = false;

const manager = new THREE.LoadingManager();
const loader = new THREE.TextureLoader(manager);

manager.onError = (url) => console.error('Ошибка загрузки:', url);

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 12);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('container').appendChild(renderer.domElement);

    // Фоновая стена
    const wallGeo = new THREE.PlaneGeometry(30, 30);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 1 });
    wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.z = -5;
    wall.receiveShadow = true;
    scene.add(wall);

    // Плоскость для цветного маскота (появляется при победе)
    const colorGeo = new THREE.PlaneGeometry(6, 6);
    colorOverlay = new THREE.Mesh(colorGeo, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }));
    colorOverlay.position.z = -4.9;
    scene.add(colorOverlay);

    // Прожектор
    spotlight = new THREE.SpotLight(0xffffff, 2.5);
    spotlight.position.set(0, 0, 15);
    spotlight.castShadow = true;
    spotlight.shadow.mapSize.width = 2048;
    spotlight.shadow.mapSize.height = 2048;
    scene.add(spotlight);

    scene.add(new THREE.AmbientLight(0xffffff, 0.2));

    loadLevel(currentLvl);
    setupEvents();
    animate();
}

function loadLevel(lvl) {
    if (artifact) scene.remove(artifact);
    solved = false;
    colorOverlay.material.opacity = 0;
    document.getElementById('lvl-idx').innerText = lvl;

    artifact = new THREE.Group();

    // Загружаем тень
    loader.load(`assets/shadows/${lvl}.png`, (shadowTex) => {
        // Создаем "слоеный" объект из тени
        for (let i = 0; i < 5; i++) {
            const mat = new THREE.MeshPhongMaterial({
                map: shadowTex,
                transparent: true,
                alphaTest: 0.5,
                color: 0x443322, // Цвет старого металла
                side: THREE.DoubleSide
            });
            const p = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), mat);
            p.position.z = (i - 2) * 0.4;
            p.position.x = (Math.random() - 0.5) * 0.3;
            p.castShadow = true;
            artifact.add(p);
        }
    });

    // Загружаем цветную версию для финала уровня
    loader.load(`assets/colors/${lvl}.png`, (colorTex) => {
        colorOverlay.material.map = colorTex;
        colorOverlay.material.needsUpdate = true;
    });

    // Стартовый хаотичный поворот
    artifact.rotation.set(Math.random() * 5, Math.random() * 5, 0);
    scene.add(artifact);
}

function setupEvents() {
    let prevMouse = { x: 0, y: 0 };

    const startAction = () => isDragging = true;
    const endAction = () => isDragging = false;
    const moveAction = (e) => {
        if (!isDragging || solved) return;
        
        const moveX = e.movementX || 0;
        const moveY = e.movementY || 0;

        artifact.rotation.y += moveX * 0.01;
        artifact.rotation.x += moveY * 0.01;

        checkSolve();
    };

    window.addEventListener('mousedown', startAction);
    window.addEventListener('mouseup', endAction);
    window.addEventListener('mousemove', moveAction);
    
    // Поддержка тач-скринов
    window.addEventListener('touchstart', startAction);
    window.addEventListener('touchend', endAction);
    window.addEventListener('touchmove', (e) => {
        const touch = e.touches[0];
        artifact.rotation.y += 0.02;
        checkSolve();
    });
}

function checkSolve() {
    // Проверка совпадения (угол близок к 0 или 2PI)
    const rx = Math.abs(artifact.rotation.x % (Math.PI * 2));
    const ry = Math.abs(artifact.rotation.y % (Math.PI * 2));
    const threshold = 0.25;

    if ((rx < threshold || rx > 6.0) && (ry < threshold || ry > 6.0)) {
        triggerWin();
    }
}

function triggerWin() {
    solved = true;
    gsap.to(artifact.rotation, { x: 0, y: 0, duration: 0.6 });
    
    // Вспышка и проявление цвета
    gsap.to("#flash", { opacity: 0.8, duration: 0.1, yoyo: true, repeat: 1 });
    gsap.to(colorOverlay.material, { opacity: 1, duration: 1.2 });

    setTimeout(() => {
        if (currentLvl < 5) {
            currentLvl++;
            gsap.to(artifact.scale, { x: 0, y: 0, duration: 0.5, onComplete: () => loadLevel(currentLvl) });
        } else {
            document.body.innerHTML = "<div style='color:#d4af37; font-size:30px; text-align:center; padding-top:20%'>АРТЕФАКТ ВОССТАНОВЛЕН</div>";
        }
    }, 2500);
}

function animate() {
    requestAnimationFrame(animate);
    if(artifact && !solved) {
        // Легкое покачивание для реализма
        artifact.position.y = Math.sin(Date.now() * 0.001) * 0.1;
    }
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

init();