const coins = [
    { id: 'btc', symbol: 'BTCUSDT' },
    { id: 'eth', symbol: 'ETHUSDT' },
    { id: 'sol', symbol: 'SOLUSDT' }
];

const charts = {};

// 1. Iniciar Gráficos
function initCharts() {
    coins.forEach(coin => {
        const container = document.getElementById(`${coin.id}-chart`);
        const chart = LightweightCharts.createChart(container, {
            layout: { background: { color: 'transparent' }, textColor: '#888' },
            grid: { vertLines: { visible: false }, horzLines: { color: '#222' } },
            width: container.offsetWidth,
            height: 200,
            timeScale: { borderVisible: false, timeVisible: true }
        });

        const series = chart.addAreaSeries({
            lineColor: '#ff003c',
            topColor: 'rgba(255, 0, 60, 0.4)',
            bottomColor: 'rgba(255, 0, 60, 0)',
            lineWidth: 2
        });

        charts[coin.id] = series;
        fetchCoinData(coin);
    });
}

// 2. Buscar Dados (Preço + Gráfico)
async function fetchCoinData(coin) {
    try {
        // Preço atual da Binance
        const priceRes = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${coin.symbol}`);
        const priceData = await priceRes.json();
        
        updateUI(coin.id, priceData.lastPrice, priceData.priceChangePercent);

        // Dados do gráfico (Klines/Candlesticks de 1h)
        const candleRes = await fetch(`https://api.binance.com/api/v3/klines?symbol=${coin.symbol}&interval=1h&limit=100`);
        const candleData = await candleRes.json();
        
        const chartPoints = candleData.map(c => ({
            time: c[0] / 1000,
            value: parseFloat(c[4]) // Preço de fechamento
        }));

        charts[coin.id].setData(chartPoints);
    } catch (error) {
        console.error("Erro na API da Binance:", error);
        document.getElementById(`${coin.id}-price`).innerText = "Erro API";
    }
}

function updateUI(id, price, change) {
    const priceEl = document.getElementById(`${id}-price`);
    const changeEl = document.getElementById(`${id}-change`);
    
    const p = parseFloat(price);
    priceEl.innerText = p.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    
    const c = parseFloat(change);
    changeEl.innerText = `${c >= 0 ? '+' : ''}${c.toFixed(2)}%`;
    changeEl.style.color = c >= 0 ? "#00ff88" : "#ff003c";
}

// 3. Notícias (CryptoCompare)
async function fetchNews() {
    try {
        const res = await fetch('https://min-api.cryptocompare.com/data/v2/news/?lang=EN');
        const data = await res.json();
        const container = document.getElementById('news-container');
        container.innerHTML = data.Data.slice(0, 5).map(n => `
            <a href="${n.url}" target="_blank" class="news-item">
                <h4>${n.title}</h4>
                <span>${n.source}</span>
            </a>
        `).join('');
    } catch (e) {
        console.log("Erro nas notícias");
    }
}

// Rodar tudo
window.onload = () => {
    initCharts();
    fetchNews();
    // Atualiza os preços a cada 30 segundos
    setInterval(() => coins.forEach(fetchCoinData), 30000);
};
