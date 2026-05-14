// --- SETUP ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// --- ESTADOS ---
let ball, helixGroup, finishLineY;
let ballVelocityY = 0;
const gravity = -0.012;
const jumpForce = 0.25;
let gameRunning = false;
let saldoBanca = 100.00; 
let lucroRodada = 0;
let currentLevel = 1;
let lastFloorPassed = -1;

const raycaster = new THREE.Raycaster();
const downVector = new THREE.Vector3(0, -1, 0);

// --- ELEMENTOS ---
const inputAposta = document.getElementById('valorAposta');
const btnSacar = document.getElementById('btnSacar');

// --- BOTÕES DE APOSTA (CORREÇÃO DE EDIÇÃO) ---
document.getElementById('btnMais').onclick = () => {
    let v = parseFloat(inputAposta.value);
    if(v + 0.5 <= saldoBanca) inputAposta.value = (v + 0.5).toFixed(2);
};
document.getElementById('btnMenos').onclick = () => {
    let v = parseFloat(inputAposta.value);
    if(v - 0.5 >= 0.5) inputAposta.value = (v - 0.5).toFixed(2);
};

function updateUI() {
    document.getElementById('saldo').innerText = saldoBanca.toFixed(2);
    document.getElementById('bancaMenu').innerText = saldoBanca.toFixed(2);
    document.getElementById('lucro').innerText = lucroRodada.toFixed(2);
    document.getElementById('level').innerText = currentLevel;
}

// --- SOM ---
let audioCtx = null;
function playCoinSound() {
    if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.setValueAtTime(1000, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.1);
}

// --- LOGICA DE JOGO ---
document.getElementById('btnIniciar').onclick = () => {
    let valor = parseFloat(inputAposta.value);
    if(valor > saldoBanca) return alert("Saldo insuficiente!");
    
    saldoBanca -= valor;
    lucroRodada = 0;
    currentLevel = 1;
    lastFloorPassed = -1;
    updateUI();
    
    document.getElementById('menu').style.display = 'none';
    document.getElementById('ui').style.display = 'block';
    btnSacar.style.display = 'none';
    generateLevel();
    gameRunning = true;
};

btnSacar.onclick = () => {
    gameRunning = false;
    saldoBanca += lucroRodada;
    lucroRodada = 0;
    btnSacar.style.display = 'none';
    document.getElementById('ui').style.display = 'none';
    document.getElementById('menu').style.display = 'block';
    updateUI();
};

function generateLevel() {
    if(!helixGroup) {
        helixGroup = new THREE.Group();
        scene.add(helixGroup);
    }
    while(helixGroup.children.length > 0) helixGroup.remove(helixGroup.children[0]);
    
    const andares = 10 + currentLevel;
    finishLineY = -(andares * 5); // Define a altura exata da chegada

    // Poste
    const tower = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.6, (andares * 5) + 20, 16),
        new THREE.MeshPhongMaterial({ color: 0x222222 })
    );
    tower.position.y = finishLineY / 2;
    helixGroup.add(tower);

    // Discos
    for (let i = 0; i < andares; i++) {
        const disco = new THREE.Group();
        const buraco = Math.floor(Math.random() * 10);
        for (let j = 0; j < 10; j++) {
            if (j === buraco) continue;
            const fatal = Math.random() < 0.18;
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

    // Chegada (Aumentamos a altura visual da plataforma verde para 1.0 para garantir colisão)
    const finish = new THREE.Mesh(
        new THREE.CylinderGeometry(3, 3, 1.0, 20),
        new THREE.MeshPhongMaterial({ color: 0x00ff00, emissive: 0x004400 })
    );
    finish.position.y = finishLineY;
    finish.userData = { isFinish: true };
    helixGroup.add(finish);

    ball.position.set(0, 3, 2.2);
    ballVelocityY = 0;
}

function handleWin() {
    gameRunning = false;
    let aposta = parseFloat(inputAposta.value);
    lucroRodada += aposta * 1.5; // Bônus generoso de vitória
    currentLevel++;
    btnSacar.style.display = 'block';
    document.getElementById('msg').style.display = 'block';
    playCoinSound();
    updateUI();
    
    setTimeout(() => {
        document.getElementById('msg').style.display = 'none';
        generateLevel();
        gameRunning = true;
    }, 1200);
}

function handleLose() {
    gameRunning = false;
    lucroRodada = 0;
    alert("Bateu no vermelho! Perdeu o lucro.");
    btnSacar.style.display = 'none';
    document.getElementById('menu').style.display = 'block';
    document.getElementById('ui').style.display = 'none';
    updateUI();
}

function init() {
    ball = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 16, 16),
        new THREE.MeshPhongMaterial({ color: 0xffff00 })
    );
    scene.add(ball);

    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const light = new THREE.DirectionalLight(0xffffff, 0.5);
    light.position.set(5, 10, 5);
    scene.add(light);

    camera.position.set(0, 5, 10);
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    if (!gameRunning) return;

    ballVelocityY += gravity;
    ball.position.y += ballVelocityY;

    // --- CORREÇÃO DA LINHA DE CHEGADA (CHECAGEM POR ALTURA) ---
    if (ball.position.y <= finishLineY + 0.3) {
        handleWin();
        return;
    }

    raycaster.set(ball.position, downVector);
    const intersects = raycaster.intersectObjects(helixGroup.children, true);

    if (intersects.length > 0 && ballVelocityY < 0) {
        const target = intersects[0].object;
        if (intersects[0].distance < 0.28) {
            if (target.userData.fatal) {
                handleLose();
                return;
            } else {
                ballVelocityY = jumpForce;
                ball.position.y = intersects[0].point.y + 0.25;
            }
        }
    }

    // Ganhos por andar
    let currentFloor = Math.floor(Math.abs(ball.position.y / 5));
    if (currentFloor > lastFloorPassed && ball.position.y < -1) {
        lucroRodada += parseFloat(inputAposta.value) * 0.10;
        lastFloorPassed = currentFloor;
        playCoinSound();
        updateUI();
    }

    camera.position.y = ball.position.y + 5;
    camera.lookAt(0, ball.position.y, 0);
    renderer.render(scene, camera);
}

// --- CONTROLES MOBILE ---
let touchX = 0;
window.ontouchstart = (e) => touchX = e.touches[0].clientX;
window.ontouchmove = (e) => {
    let dx = e.touches[0].clientX - touchX;
    helixGroup.rotation.y += dx * 0.015;
    touchX = e.touches[0].clientX;
};
// Suporte para Mouse
window.onmousedown = (e) => { touchX = e.clientX; window.onmousemove = (ev) => {
    let dx = ev.clientX - touchX;
    helixGroup.rotation.y += dx * 0.015;
    touchX = ev.clientX;
}};
window.onmouseup = () => window.onmousemove = null;

init();