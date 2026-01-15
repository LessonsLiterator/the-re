/**
 * SHADOWMATIC ENGINE (REAL SHADOW PROJECTION)
 */

let scene, camera, renderer, artifactGroup, spotlight, shadowCaster;
let currentLvl = 1;
let isDragging = false;
let solved = false;

const loader = new THREE.TextureLoader();

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 15);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Мягкие тени
    document.getElementById('render-container').appendChild(renderer.domElement);

    // 1. СТЕНА ДЛЯ ТЕНИ
    const wallGeo = new THREE.PlaneGeometry(50, 50);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x202020, roughness: 1 });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.z = -5;
    wall.receiveShadow = true;
    scene.add(wall);

    // 2. ПРОЖЕКТОР (Главный источник тени)
    spotlight = new THREE.SpotLight(0xffffff, 2.5);
    spotlight.position.set(0, 0, 20); // Светит спереди
    spotlight.castShadow = true;
    spotlight.shadow.mapSize.width = 2048; // Высокое качество тени
    spotlight.shadow.mapSize.height = 2048;
    spotlight.shadow.camera.near = 1;
    spotlight.shadow.camera.far = 30;
    spotlight.shadow.focus = 1;
    scene.add(spotlight);

    // 3. АРТЕФАКТ (Группа, которую крутим)
    artifactGroup = new THREE.Group();
    scene.add(artifactGroup);

    // Фоновый свет (чтобы объект не был совсем черным)
    const fillLight = new THREE.PointLight(0x4444ff, 0.5);
    fillLight.position.set(5, 5, 5);
    scene.add(fillLight);

    loadLevel(currentLvl);
    addControls();
    animate();
}

function loadLevel(lvl) {
    // Очистка старого уровня
    while(artifactGroup.children.length > 0) artifactGroup.remove(artifactGroup.children[0]);
    
    solved = false;
    document.getElementById('lvl-id').innerText = lvl;

    // СОЗДАЕМ ТЕНЕВОЙ ТРАФАРЕТ (Скрытая часть, которая дает силуэт маскота)
    // Мы используем картинку как карту прозрачности
    loader.load(`assets/shadows/${lvl}.png`, (texture) => {
        const material = new THREE.MeshPhongMaterial({
            map: texture,
            transparent: true,
            alphaTest: 0.5,
            side: THREE.DoubleSide,
            color: 0x000000 // Сам по себе он черный
        });
        
        // Эта плоскость будет давать идеальную тень маскота, когда повернута к свету
        shadowCaster = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), material);
        shadowCaster.castShadow = true;
        artifactGroup.add(shadowCaster);
    });

    // ДОБАВЛЯЕМ "МУСОР" (Для запутывания игрока, как в Shadowmatic)
    const junkMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7, roughness: 0.2 });
    for(let i = 0; i < 12; i++) {
        const junk = new THREE.Mesh(
            new THREE.TorusKnotGeometry(Math.random()*0.5, 0.1, 32, 8),
            junkMat
        );
        junk.position.set((Math.random()-0.5)*4, (Math.random()-0.5)*4, (Math.random()-0.5)*1.5);
        junk.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, 0);
        junk.castShadow = true;
        artifactGroup.add(junk);
    }

    // Рандомный поворот в начале
    artifactGroup.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, 0);
}

function addControls() {
    window.addEventListener('mousedown', () => isDragging = true);
    window.addEventListener('mouseup', () => isDragging = false);
    window.addEventListener('mousemove', (e) => {
        if (!isDragging || solved) return;
        
        // Вращение по двум осям
        artifactGroup.rotation.y += e.movementX * 0.01;
        artifactGroup.rotation.x += e.movementY * 0.01;

        checkAlignment();
    });
}

function checkAlignment() {
    // Проверяем, насколько текущий угол близок к "лицевому" (0, 0)
    // В Shadowmatic тень собирается, когда секретный трафарет стоит ровно перед лампой
    const rx = Math.abs(artifactGroup.rotation.x % (Math.PI * 2));
    const ry = Math.abs(artifactGroup.rotation.y % (Math.PI * 2));
    
    const threshold = 0.2; // Порог точности

    if ((rx < threshold || rx > 6.1) && (ry < threshold || ry > 6.1)) {
        onWin();
    }
}

function onWin() {
    solved = true;
    
    // Плавная доводка до идеала
    gsap.to(artifactGroup.rotation, { x: 0, y: 0, duration: 0.5 });
    
    // Вспышка
    gsap.to("#victory-flash", { opacity: 0.4, duration: 0.1, yoyo: true, repeat: 1 });

    setTimeout(() => {
        if (currentLvl < 5) {
            currentLvl++;
            loadLevel(currentLvl);
        } else {
            alert("ВЫ СОБРАЛИ ВСЕ ТЕНИ!");
        }
    }, 2000);
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

init();
