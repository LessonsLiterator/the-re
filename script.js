let scene, camera, renderer, partsGroup, spotlight;
let currentLvl = 1;
let isDragging = false;
let solved = false;

const loader = new THREE.TextureLoader();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a); // Фон совпадает со стеной

    camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 16);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('render-container').appendChild(renderer.domElement);

    // 1. ОГРОМНАЯ СТЕНА
    const wallGeo = new THREE.PlaneGeometry(200, 200);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 1 });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.z = -10; 
    wall.receiveShadow = true;
    scene.add(wall);

    // 2. ПРОЖЕКТОР СМЕЩЕН ВПРАВО (чтобы тень падала ВЛЕВО)
    spotlight = new THREE.SpotLight(0xffffff, 4);
    spotlight.position.set(10, 5, 25); // Смещен вправо и вверх
    spotlight.target.position.set(-5, 0, -10); // Целится левее центра стены
    spotlight.castShadow = true;
    spotlight.shadow.mapSize.width = 2048;
    spotlight.shadow.mapSize.height = 2048;
    spotlight.shadow.camera.near = 10;
    spotlight.shadow.camera.far = 50;
    spotlight.shadow.bias = -0.0001;
    scene.add(spotlight);
    scene.add(spotlight.target);

    // 3. ГРУППА ДЕТАЛЕЙ
    partsGroup = new THREE.Group();
    scene.add(partsGroup);

    loadLevel(currentLvl);
    addControls();
    animate();
}

function loadLevel(lvl) {
    while(partsGroup.children.length > 0) partsGroup.remove(partsGroup.children[0]);
    solved = false;
    document.getElementById('lvl-id').innerText = lvl;

    // Загружаем текстуру и режем её на 3 части
    loader.load(`assets/shadows/${lvl}.png`, (texture) => {
        
        // Параметры для 3-х частей (левая, центральная, правая)
        const partsCount = 3;
        for (let i = 0; i < partsCount; i++) {
            const partTex = texture.clone();
            partTex.needsUpdate = true;
            
            // Настройка UV-смещения для каждой части
            partTex.repeat.set(1 / partsCount, 1);
            partTex.offset.set(i / partsCount, 0);

            const material = new THREE.MeshPhongMaterial({
                alphaMap: partTex,
                transparent: true,
                alphaTest: 0.5,
                colorWrite: false, // Сами детали невидимы
                depthWrite: false,
                side: THREE.DoubleSide
            });

            const mesh = new THREE.Mesh(new THREE.PlaneGeometry(3, 7), material);
            
            // Разносим части в пространстве, чтобы в хаосе они не были похожи на маскота
            mesh.position.set((i - 1) * 2.5, (Math.random() - 0.5) * 2, (i - 1) * 1.5);
            // Добавляем им индивидуальный наклон
            mesh.rotation.z = (Math.random() - 0.5) * 1;
            
            mesh.castShadow = true;
            partsGroup.add(mesh);
        }
    });

    // Случайный поворот всей группы
    partsGroup.rotation.set(Math.random() * 4, Math.random() * 4, 0);
}

function addControls() {
    window.addEventListener('mousedown', () => isDragging = true);
    window.addEventListener('mouseup', () => isDragging = false);
    window.addEventListener('mousemove', (e) => {
        if (!isDragging || solved) return;
        
        // Вращение группы
        partsGroup.rotation.y += e.movementX * 0.008;
        partsGroup.rotation.x += e.movementY * 0.008;

        checkSolve();
    });
}

function checkSolve() {
    const rx = Math.abs(partsGroup.rotation.x % (Math.PI * 2));
    const ry = Math.abs(partsGroup.rotation.y % (Math.PI * 2));
    
    // Идеальное положение, когда вращение группы стремится к 0
    if ((rx < 0.2 || rx > 6.1) && (ry < 0.2 || ry > 6.1)) {
        solved = true;
        gsap.to(partsGroup.rotation, { x: 0, y: 0, duration: 0.8 });
        gsap.to("#victory-flash", { opacity: 0.4, duration: 0.1, yoyo: true, repeat: 1 });

        setTimeout(() => {
            if (currentLvl < 5) {
                currentLvl++;
                loadLevel(currentLvl);
            } else {
                alert("КОЛЛЕКЦИЯ СОБРАНА");
            }
        }, 2000);
    }
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

init();
