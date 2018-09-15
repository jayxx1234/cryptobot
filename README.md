# cryptobot
Cryptocurrency trader autobot
Currently supports the following exchanges:
- Cryptopia

## API config setup
Create a file `config/config.mjs` (note the mjs extension, which tells node to use experimental modules for `export` to work).
In that file, place the following:
```
export default {
	"API_KEY": "YOUR_API_KEY",
	"API_SECRET": "YOUR_API_SECRET",
	"HOST_URL": "https://www.cryptopia.co.nz/api"
}
```
And replace with your api keys from the exchange.
