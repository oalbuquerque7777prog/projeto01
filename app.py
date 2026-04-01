from flask import Flask, render_template, jsonify
import requests

app = Flask(__name__)

# Configuração das Moedas (ID CoinLore)
CRYPTO_CONFIG = [
    {"id": "90", "name": "Bitcoin", "symbol": "BTC", "img": "bitcoin"},
    {"id": "80", "name": "Ethereum", "symbol": "ETH", "img": "ethereum"},
    {"id": "48543", "name": "Solana", "symbol": "SOL", "img": "solana"}
]

def get_crypto_data():
    results = []
    try:
        # Busca todos os tickers de uma vez
        response = requests.get("https://api.coinlore.net/api/tickers/").json()
        all_coins = {coin['id']: coin for coin in response['data']}
        
        for config in CRYPTO_CONFIG:
            coin_data = all_coins.get(config['id'])
            if coin_data:
                results.append({
                    **config,
                    "price": f"${float(coin_data['price_usd']):,.2f}",
                    "change": float(coin_data['percent_change_24h'])
                })
    except Exception as e:
        print(f"Erro ao buscar preços: {e}")
    return results

def get_news():
    try:
        res = requests.get("https://min-api.cryptocompare.com/data/v2/news/?lang=EN").json()
        return res['Data'][:5]
    except:
        return []

@app.route('/')
def index():
    cryptos = get_crypto_data()
    news = get_news()
    return render_template('index.html', cryptos=cryptos, news=news)

if __name__ == '__main__':
    app.run(debug=True, port=5000)