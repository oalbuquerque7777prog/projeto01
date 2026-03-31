const cryptoList = [
    { id: 'bitcoin', short: 'btc' },
    { id: 'ethereum', short: 'eth' },
    { id: 'solana', short: 'sol' }
];

const charts = {};

// 1. Iniciar os gráficos (vazios)
function initCharts() {
    cryptoList.forEach(coin => {
        const container = document.getElementById(`${coin.short}-chart`);
        const chart = LightweightCharts.createChart(container, {
            layout: { background: { color: 'transparent' }, textColor: '#888' },
            grid: { vertLines: { visible: false }, horzLines: { color: '#222' } },
            width: container.offsetWidth,
            height: 200,
            timeScale: { borderVisible: false }
        });

        const series = chart.addAreaSeries({
            lineColor: '#ff003c',
            topColor: 'rgba(255, 0, 60, 0.3)',
            bottomColor: 'rgba(255, 0, 60, 0)',
            lineWidth: 2
        });

        charts[coin.short] = series;
    });
}

// 2. Buscar Preços e Dados do Gráfico
async function updateData() {
    try {
        for (const coin of cryptoList) {
            // Preço e Variação
            const priceRes = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coin.id}&vs_currencies=usd&include_24hr_change=true`);
            const priceData = await priceRes.json();
            
            const price = priceData[coin.id].usd;
            const change = priceData[coin.id].usd_24h_change;

            document.getElementById(`${coin.short}-price`).innerText = `$${price.toLocaleString()}`;
            const changeEl = document.getElementById(`${coin.short}-change`);
            changeEl.innerText = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
            changeEl.className = `change ${change >= 0 ? 'pos' : 'neg'}`;

            // Dados do Gráfico (Últimas 24h)
            const chartRes = await fetch(`https://api.coingecko.com/api/v3/coins/${coin.id}/market_chart?vs_currency=usd&days=1`);
            const chartData = await chartRes.json();
            
            const formattedHistory = chartData.prices.map(p => ({
                time: p[0] / 1000,
                value: p[1]
            }));
            
            charts[coin.short].setData(formattedHistory);
        }
    } catch (error) {
        console.error("Erro ao buscar dados:", error);
    }
}

// 3. Notícias (Fallback seguro)
async function getNews() {
    try {
        const res = await fetch('https://min-api.cryptocompare.com/data/v2/news/?lang=EN');
        const data = await res.json();
        const container = document.getElementById('news-container');
        container.innerHTML = '';
        data.Data.slice(0, 5).forEach(item => {
            container.innerHTML += `
                <a href="${item.url}" target="_blank" class="news-item">
                    <h4>${item.title}</h4>
                    <span>${item.source}</span>
                </a>`;
        });
    } catch (e) {
        document.getElementById('news-container').innerText = "Erro ao carregar notícias.";
    }
}

// Inicialização
window.onload = () => {
    initCharts();
    updateData();
    getNews();
    // Atualiza a cada 60 segundos para não estourar o limite gratuito da API
    setInterval(updateData, 60000);
};
