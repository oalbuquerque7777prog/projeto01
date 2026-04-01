// IDs CoinLore: BTC=90, ETH=80, SOL=48543
const coins = [
    { id: '90', symbol: 'BTCUSDT' },
    { id: '80', symbol: 'ETHUSDT' },
    { id: '48543', symbol: 'SOLUSDT' }
];

const charts = {};

// Inicializa os gráficos
function initCharts() {
    coins.forEach(coin => {
        const container = document.getElementById(`${coin.id}-chart`);
        const chart = LightweightCharts.createChart(container, {
            layout: { background: { color: 'transparent' }, textColor: '#888' },
            grid: { vertLines: { visible: false }, horzLines: { color: '#222' } },
            width: container.offsetWidth,
            height: 200,
            timeScale: { borderVisible: false }
        });

        const series = chart.addAreaSeries({
            lineColor: '#ff003c',
            topColor: 'rgba(255, 0, 60, 0.4)',
            bottomColor: 'rgba(255, 0, 60, 0)',
            lineWidth: 2
        });

        charts[coin.id] = series;
        updateCoinData(coin);
    });
}

// Busca Preço (CoinLore) e Gráfico (Binance para maior precisão histórica)
async function updateCoinData(coin) {
    try {
        // 1. Pegar Preço Atual via CoinLore
        const res = await fetch(`https://api.coinlore.net/api/ticker/?id=${coin.id}`);
        const data = await res.json();
        const info = data[0];

        const priceEl = document.getElementById(`${coin.id}-price`);
        const changeEl = document.getElementById(`${coin.id}-change`);

        const price = parseFloat(info.price_usd);
        const change = parseFloat(info.percent_change_24h);

        priceEl.innerText = price.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
        changeEl.innerText = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
        changeEl.style.color = change >= 0 ? "#00ff88" : "#ff003c";

        // 2. Atualizar Histórico do Gráfico (Binance - 1h)
        const chartRes = await fetch(`https://api.binance.com/api/v3/klines?symbol=${coin.symbol}&interval=1h&limit=50`);
        const chartData = await chartRes.json();
        const points = chartData.map(d => ({
            time: d[0] / 1000,
            value: parseFloat(d[4])
        }));
        charts[coin.id].setData(points);

    } catch (error) {
        console.error("Erro ao carregar dados:", error);
    }
}

// Feed de Notícias
async function getNews() {
    const container = document.getElementById('news-container');
    try {
        const res = await fetch('https://min-api.cryptocompare.com/data/v2/news/?lang=EN');
        const news = await res.json();
        container.innerHTML = news.Data.slice(0, 5).map(n => `
            <a href="${n.url}" target="_blank" class="news-item">
                <h4>${n.title}</h4>
                <span>${n.source}</span>
            </a>
        `).join('');
    } catch (e) {
        container.innerText = "Erro ao carregar notícias.";
    }
}

// Iniciar sistema
window.onload = () => {
    initCharts();
    getNews();
    // Atualizar dados a cada 45 segundos (tempo seguro para CoinLore)
    setInterval(() => {
        coins.forEach(updateCoinData);
    }, 45000);
};
