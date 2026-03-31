const coins = [
    { id: 'btc', symbol: 'btcusdt', name: 'Bitcoin' },
    { id: 'eth', symbol: 'ethusdt', name: 'Ethereum' },
    { id: 'sol', symbol: 'solusdt', name: 'Solana' }
];

const charts = {};

// Inicializa os Gráficos
function initCharts() {
    coins.forEach(coin => {
        const container = document.getElementById(`${coin.id}-chart`);
        const chart = LightweightCharts.createChart(container, {
            layout: {
                background: { color: '#121212' },
                textColor: '#888',
            },
            grid: {
                vertLines: { color: '#222' },
                horzLines: { color: '#222' },
            },
            width: container.offsetWidth,
            height: 200,
            handleScroll: false,
            handleScale: false,
        });

        const lineSeries = chart.addAreaSeries({
            lineColor: '#ff003c',
            topColor: 'rgba(255, 0, 60, 0.4)',
            bottomColor: 'rgba(255, 0, 60, 0.0)',
            lineWidth: 2,
        });

        charts[coin.id] = lineSeries;
        loadHistoricalData(coin.symbol, lineSeries);
    });
}

// Busca dados históricos iniciais
async function loadHistoricalData(symbol, series) {
    try {
        const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=1h&limit=50`);
        const data = await response.json();
        const formattedData = data.map(d => ({
            time: d[0] / 1000,
            value: parseFloat(d[4])
        }));
        series.setData(formattedData);
    } catch (err) {
        console.error("Erro ao carregar histórico:", err);
    }
}

// Conexão WebSocket para Preço em Tempo Real
function connectWebSocket() {
    const streams = coins.map(c => `${c.symbol}@ticker`).join('/');
    const socket = new WebSocket(`wss://stream.binance.com:9443/ws/${streams}`);

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const coin = coins.find(c => c.symbol === data.s.toLowerCase());
        
        if (coin) {
            updateUI(coin.id, data.c, data.P);
            // Atualiza gráfico em tempo real
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
    
    const formattedPrice = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(price);

    priceEl.innerText = formattedPrice;
    changeEl.innerText = `${parseFloat(change).toFixed(2)}%`;
    changeEl.className = `change ${parseFloat(change) >= 0 ? 'pos' : 'neg'}`;
}

window.addEventListener('resize', () => {
    // Ajustar redimensionamento se necessário
});

initCharts();
connectWebSocket();
