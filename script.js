/**
 * SHADOWMATIC - REGENESIS V3
 * Механика: 3 видимых осколка, одна тень слева.
 */

let scene, camera, renderer, artifactGroup, spotlight;
let currentLvl = 1;
let isDragging = false;
let solved = false;

const loader = new THREE.TextureLoader();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);

    camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 15);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Качественные мягкие тени
    document.getElementById('render-container').appendChild(renderer.domElement);

    // 1. ОГРОМНАЯ СТЕНА (сливается с фоном)
    const wallGeo = new THREE.PlaneGeometry(100, 100);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 1 });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.z = -8; 
    wall.receiveShadow = true;
    scene.add(wall);

    // 2. ПРОЖЕКТОР (Смещен вправо, чтобы тень ушла влево)
    spotlight = new THREE.SpotLight(0xffffff, 4);
    spotlight.position.set(12, 5, 20); 
    spotlight.target.position.set(-5, 0, -8); 
    spotlight.castShadow = true;
    
    // Настройки тени (чтобы PNG просвечивал)
    spotlight.shadow.mapSize.width = 2048;
    spotlight.shadow.mapSize.height = 2048;
    spotlight.shadow.camera.near = 5;
    spotlight.shadow.camera.far = 50;
    scene.add(spotlight);
    scene.add(spotlight.target);

    // 3. ОБЩИЙ СВЕТ (чтобы видеть сами осколки)
    const amb = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(amb);

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

    // Загружаем маскота
    loader.load(`assets/shadows/${lvl}.png`, (texture) => {
        
        // Создаем 3 части маскота
        for (let i = 0; i < 3; i++) {
            const partTex = texture.clone();
            partTex.needsUpdate = true;
            
            // Разрезаем текстуру на 3 части по горизонтали
            partTex.repeat.set(0.33, 1);
            partTex.offset.set(i * 0.33, 0);

            // Материал: теперь он ВИДИМЫЙ (темный металл)
            const material = new THREE.MeshPhongMaterial({
                map: partTex,           // Рисуем часть маскота
                transparent: true,      // Включаем прозрачность
                alphaTest: 0.5,         // ВАЖНО: убирает "черный квадрат" в тени
                color: 0x222222,        // Делаем осколки темно-серыми
                shininess: 100,
                side: THREE.DoubleSide
            });

            // Создаем меш (чуть вытянутый по вертикали)
            const mesh = new THREE.Mesh(new THREE.PlaneGeometry(3, 7), material);
            
            // Раскидываем части в 3D пространстве (Хаос)
            mesh.position.set(
                (i - 1) * 3,                // Разнос по X
                (Math.random() - 0.5) * 4,  // Разнос по Y
                (i - 1) * 2                 // Разнос по Z (глубина)
            );
            
            mesh.rotation.z = Math.random() * 2; // Разный наклон
            mesh.castShadow = true;             // ОТБРАСЫВАЕТ ТЕНЬ
            artifactGroup.add(mesh);
        }
    });

    // Случайный поворот всей кучи в начале
    artifactGroup.rotation.set(Math.random() * 5, Math.random() * 5, 0);
}

function addControls() {
    window.addEventListener('mousedown', () => isDragging = true);
    window.addEventListener('mouseup', () => isDragging = false);
    window.addEventListener('mousemove', (e) => {
        if (!isDragging || solved) return;
        artifactGroup.rotation.y += e.movementX * 0.008;
        artifactGroup.rotation.x += e.movementY * 0.008;
        checkSolve();
    });
}

function checkSolve() {
    const rx = Math.abs(artifactGroup.rotation.x % (Math.PI * 2));
    const ry = Math.abs(artifactGroup.rotation.y % (Math.PI * 2));
    
    // Когда вращение группы около нуля - части совпали
    if ((rx < 0.25 || rx > 6.0) && (ry < 0.25 || ry > 6.0)) {
        solved = true;
        // Плавная доводка до идеальной тени
        gsap.to(artifactGroup.rotation, { x: 0, y: 0, duration: 0.8 });
        gsap.to("#victory-flash", { opacity: 0.5, duration: 0.1, yoyo: true, repeat: 1 });

        setTimeout(() => {
            if (currentLvl < 5) {
                currentLvl++;
                loadLevel(currentLvl);
            } else {
                alert("ВСЕ ОБЪЕКТЫ СОБРАНЫ!");
            }
        }, 2000);
    }
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

init();
