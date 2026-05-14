// --- CONFIGURAÇÃO THREE.JS ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// --- ESTADO GLOBAL E PERSISTÊNCIA ---
let ball, helixGroup, finishLineY;
let ballVelocityY = 0;
const gravity = -0.012, jumpForce = 0.25;
let gameRunning = false, lucroRodada = 0, currentLevel = 1, lastFloorPassed = -1;

// Objeto de dados do usuário
let user = {
    nome: "",
    banca: 100.00
};

// Carregar do LocalStorage
function loadUser() {
    const saved = localStorage.getItem('helix_user');
    if(saved) {
        user = JSON.parse(saved);
        showGameMenu();
    }
}

function saveUser() {
    localStorage.setItem('helix_user', JSON.stringify(user));
    updateUI();
}

function updateUI() {
    document.getElementById('saldo').innerText = user.banca.toFixed(2);
    document.getElementById('bancaMenu').innerText = user.banca.toFixed(2);
    document.getElementById('lucro').innerText = lucroRodada.toFixed(2);
    document.getElementById('level').innerText = currentLevel;
    document.getElementById('displayUser').innerText = user.nome;
}

// --- CADASTRO ---
document.getElementById('btnCadastrar').onclick = () => {
    const nome = document.getElementById('regUser').value;
    if(nome.length < 3) return alert("Digite um nome válido!");
    user.nome = nome;
    user.banca = 100.00; // Bonus inicial
    saveUser();
    showGameMenu();
};

function showGameMenu() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('main-menu').style.display = 'flex';
    updateUI();
}

function clearData() {
    localStorage.removeItem('helix_user');
    location.reload();
}

// --- CONTROLES DE APOSTA ---
window.adjustBet = (val) => {
    const input = document.getElementById('valorAposta');
    let nv = parseFloat(input.value) + val;
    if(nv >= 0.5 && nv <= user.banca) input.value = nv.toFixed(2);
};

// --- LOGICA DO JOGO ---
const raycaster = new THREE.Raycaster();
const downVector = new THREE.Vector3(0, -1, 0);

document.getElementById('btnIniciar').onclick = () => {
    const valor = parseFloat(document.getElementById('valorAposta').value);
    if(valor > user.banca) return alert("Saldo insuficiente!");
    
    user.banca -= valor;
    lucroRodada = 0; currentLevel = 1; lastFloorPassed = -1;
    saveUser();
    
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('ui').style.display = 'block';
    generateLevel();
    gameRunning = true;
};

document.getElementById('btnSacar').onclick = () => {
    gameRunning = false;
    user.banca += lucroRodada;
    lucroRodada = 0;
    saveUser();
    document.getElementById('btnSacar').style.display = 'none';
    document.getElementById('ui').style.display = 'none';
    document.getElementById('main-menu').style.display = 'flex';
};

function generateLevel() {
    if(!helixGroup) { helixGroup = new THREE.Group(); scene.add(helixGroup); }
    while(helixGroup.children.length > 0) helixGroup.remove(helixGroup.children[0]);
    
    const andares = 8 + (currentLevel * 2);
    finishLineY = -(andares * 5);

    // Torre e Discos
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, (andares * 5) + 30, 16), new THREE.MeshPhongMaterial({ color: 0x111111 }));
    tower.position.y = finishLineY / 2;
    helixGroup.add(tower);

    for (let i = 0; i < andares; i++) {
        const disco = new THREE.Group();
        const buraco = Math.floor(Math.random() * 10);
        for (let j = 0; j < 10; j++) {
            if (j === buraco) continue;
            const fatal = Math.random() < 0.22;
            const fatia = new THREE.Mesh(
                new THREE.CylinderGeometry(2.5, 2.5, 0.5, 12, 1, false, (j * Math.PI * 2) / 10, (Math.PI * 2) / 10),
                new THREE.MeshPhongMaterial({ color: fatal ? 0xff0000 : 0x00ccff })
            );
            fatia.userData = { fatal };
            disco.add(fatia);
        }
        disco.position.y = -i * 5;
        helixGroup.add(disco);
    }

    const finish = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.5, 1.2, 20), new THREE.MeshPhongMaterial({ color: 0x00ff00 }));
    finish.position.y = finishLineY;
    finish.userData = { isFinish: true };
    helixGroup.add(finish);

    ball.position.set(0, 3, 2.2);
    ballVelocityY = 0;
}

function animate() {
    requestAnimationFrame(animate);
    if (!gameRunning) return;

    ballVelocityY += gravity;
    ball.position.y += ballVelocityY;

    if (ball.position.y <= finishLineY + 0.5) {
        victory(); return;
    }

    raycaster.set(ball.position, downVector);
    const intersects = raycaster.intersectObjects(helixGroup.children, true);

    if (intersects.length > 0 && ballVelocityY < 0) {
        const target = intersects[0].object;
        if (intersects[0].distance < 0.28) {
            if (target.userData.fatal) {
                gameOver(); return;
            } else if (target.userData.isFinish) {
                victory(); return;
            } else {
                ballVelocityY = jumpForce;
                ball.position.y = intersects[0].point.y + 0.28;
            }
        }
    }

    let currentFloor = Math.floor(Math.abs(ball.position.y / 5));
    if (currentFloor > lastFloorPassed && ball.position.y < -1) {
        lucroRodada += parseFloat(document.getElementById('valorAposta').value) * 0.15;
        lastFloorPassed = currentFloor;
        updateUI();
    }

    camera.position.y = ball.position.y + 5;
    camera.lookAt(0, ball.position.y, 0);
    renderer.render(scene, camera);
}

function victory() {
    gameRunning = false;
    lucroRodada += parseFloat(document.getElementById('valorAposta').value) * 2;
    currentLevel++;
    updateUI();
    document.getElementById('msg').style.display = 'block';
    setTimeout(() => {
        document.getElementById('msg').style.display = 'none';
        document.getElementById('btnSacar').style.display = 'block';
        generateLevel();
        gameRunning = true;
    }, 1000);
}

function gameOver() {
    gameRunning = false; lucroRodada = 0;
    alert("Bateu no vermelho! Perdeu tudo desta rodada.");
    document.getElementById('ui').style.display = 'none';
    document.getElementById('main-menu').style.display = 'flex';
    updateUI();
}

// --- TOUCH ---
let touchX = 0;
window.ontouchstart = (e) => touchX = e.touches[0].clientX;
window.ontouchmove = (e) => {
    let dx = e.touches[0].clientX - touchX;
    if(helixGroup) helixGroup.rotation.y += dx * 0.015;
    touchX = e.touches[0].clientX;
};

// --- INIT ---
function init() {
    ball = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 16), new THREE.MeshPhongMaterial({ color: 0xffff00 }));
    scene.add(ball);
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const light = new THREE.DirectionalLight(0xffffff, 0.5); light.position.set(5, 10, 5); scene.add(light);
    camera.position.set(0, 5, 10);
    loadUser();
    animate();
}
init();
