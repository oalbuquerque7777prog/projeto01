const coins = [
    { id: 'btc', symbol: 'BTCUSDT', name: 'Bitcoin' },
    { id: 'eth', symbol: 'ETHUSDT', name: 'Ethereum' },
    { id: 'sol', symbol: 'SOLUSDT', name: 'Solana' }
];

const charts = {};

// Inicializa e desenha os gráficos
function initCharts() {
    coins.forEach(coin => {
        const container = document.getElementById(`${coin.id}-chart`);
        if (!container) return;

        const chart = LightweightCharts.createChart(container, {
            layout: { background: { color: '#121212' }, textColor: '#888' },
            grid: { vertLines: { visible: false }, horzLines: { color: '#222' } },
            width: container.offsetWidth,
            height: 200,
            timeScale: { borderVisible: false }
        });

        const lineSeries = chart.addAreaSeries({
            lineColor: '#ff003c',
            topColor: 'rgba(255, 0, 60, 0.3)',
            bottomColor: 'rgba(255, 0, 60, 0.0)',
            lineWidth: 2,
        });

        charts[coin.id] = lineSeries;
        loadData(coin);
    });
}

// Busca Preço Atual e Dados Históricos
async function loadData(coin) {
    try {
        // 1. Preço Atual (REST API Fallback para não ficar 0)
        const priceRes = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${coin.symbol}`);
        const priceData = await priceRes.json();
        updateUI(coin.id.split('-')[0], priceData.lastPrice, priceData.priceChangePercent);

        // 2. Dados do Gráfico
        const chartRes = await fetch(`https://api.binance.com/api/v3/klines?symbol=${coin.symbol}&interval=1h&limit=50`);
        const chartData = await chartRes.json();
        const formattedData = chartData.map(d => ({
            time: d[0] / 1000,
            value: parseFloat(d[4])
        }));
        charts[coin.id].setData(formattedData);
    } catch (err) {
        console.error("Erro na API:", err);
    }
}

// WebSocket para Atualização em Tempo Real (Live)
function connectWebSocket() {
    const streams = coins.map(c => `${c.symbol.toLowerCase()}@ticker`).join('/');
    const socket = new WebSocket(`wss://stream.binance.com:9443/ws/${streams}`);

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const coin = coins.find(c => c.symbol === data.s);
        if (coin) {
            updateUI(coin.id, data.c, data.P);
            charts[coin.id].update({
                time: Math.floor(Date.now() / 1000),
                value: parseFloat(data.c)
            });
        }
    };

    socket.onclose = () => setTimeout(connectWebSocket, 5000);
}

function updateUI(id, price, change) {
    const priceEl = document.getElementById(`${id}-price`);
    const changeEl = document.getElementById(`${id}-change`);
    if (!priceEl || !changeEl) return;

    priceEl.innerText = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(price);

    const pChange = parseFloat(change);
    changeEl.innerText = `${pChange >= 0 ? '+' : ''}${pChange.toFixed(2)}%`;
    changeEl.className = `change ${pChange >= 0 ? 'pos' : 'neg'}`;
}

async function fetchCryptoNews() {
    const newsContainer = document.getElementById('news-container');
    try {
        const response = await fetch('https://min-api.cryptocompare.com/data/v2/news/?lang=EN');
        const data = await response.json();
        newsContainer.innerHTML = '';
        data.Data.slice(0, 6).forEach(article => {
            newsContainer.innerHTML += `
                <a href="${article.url}" target="_blank" class="news-item">
                    <h4>${article.title}</h4>
                    <span>${article.source} • ${new Date(article.published_on * 1000).toLocaleDateString()}</span>
                </a>`;
        });
    } catch (e) { newsContainer.innerHTML = "Erro ao carregar notícias."; }
}

// Iniciar tudo
window.onload = () => {
    initCharts();
    connectWebSocket();
    fetchCryptoNews();
};
