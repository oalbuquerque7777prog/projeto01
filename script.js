const coins = [
    { id: '90', symbol: 'BTCUSDT' },
    { id: '80', symbol: 'ETHUSDT' },
    { id: '48543', symbol: 'SOLUSDT' }
];

const charts = {};

function initCharts() {
    coins.forEach(coin => {
        const container = document.getElementById(`${coin.id}-chart`);
        if (!container) return;

        const chart = LightweightCharts.createChart(container, {
            layout: { background: { color: 'transparent' }, textColor: '#888' },
            grid: { vertLines: { visible: false }, horzLines: { color: '#222' } },
            width: container.offsetWidth,
            height: 180,
            timeScale: { borderVisible: false }
        });

        const series = chart.addAreaSeries({
            lineColor: '#ff003c',
            topColor: 'rgba(255, 0, 60, 0.3)',
            bottomColor: 'transparent',
            lineWidth: 2
        });

        charts[coin.id] = series;
        updateData(coin);
    });
}

async function updateData(coin) {
    try {
        // CoinLore API com cache breaker para evitar o "Carregando..."
        const response = await fetch(`https://api.coinlore.net/api/ticker/?id=${coin.id}&t=${Math.random()}`);
        const data = await response.json();
        const info = data[0];

        // Atualiza UI
        const priceEl = document.getElementById(`${coin.id}-price`);
        const changeEl = document.getElementById(`${coin.id}-change`);
        
        const price = parseFloat(info.price_usd);
        const change = parseFloat(info.percent_change_24h);

        priceEl.innerText = `$${price.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
        changeEl.innerText = `${change >= 0 ? '+' : ''}${change}%`;
        changeEl.style.color = change >= 0 ? '#00ff88' : '#ff003c';

        // Gráfico via Binance (Fallback estável)
        const chartRes = await fetch(`https://api.binance.com/api/v3/klines?symbol=${coin.symbol}&interval=1h&limit=30`);
        const chartData = await chartRes.json();
        const points = chartData.map(d => ({
            time: d[0] / 1000,
            value: parseFloat(d[4])
        }));
        
        charts[coin.id].setData(points);
        document.getElementById('status').innerText = "Sistema Online";

    } catch (error) {
        console.error("Erro na carga:", error);
        document.getElementById('status').innerText = "Erro na API";
    }
}

// Inicializa ao carregar a página
window.addEventListener('load', () => {
    initCharts();
    // Atualiza a cada 30 segundos
    setInterval(() => {
        coins.forEach(updateData);
    }, 30000);
});
