from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from subprocess import run
import json
import os
from web3 import Web3
from eth_abi import decode

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


UNISWAP_POOLS = {
    ("WETH", "USDC"): "0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc",
    ("WETH", "DAI"): "0xA478c2975Ab1Ea89e8196811F51A7B7Ade33eB11",
    ("USDC", "DAI"): "0x35101c731b1548B5e48bb23F99eDBc2f5c341935"
}

INFURA_RPC = "https://ethereum.publicnode.com"
web3 = Web3(Web3.HTTPProvider(INFURA_RPC))


@app.get("/price")
def get_price(from_token: str = Query(...), to_token: str = Query(...)):
    try:
        from_token = from_token.upper()
        to_token = to_token.upper()

        pool_key = (from_token, to_token)
        reverse_key = (to_token, from_token)

        if pool_key in UNISWAP_POOLS:
            pool_address = UNISWAP_POOLS[pool_key]
            reverse = False
        elif reverse_key in UNISWAP_POOLS:
            pool_address = UNISWAP_POOLS[reverse_key]
            reverse = True
        else:
            return JSONResponse(content={"error": "Unsupported token pair"}, status_code=400)

        function_signature = "0x0902f1ac"
        call = {"to": pool_address, "data": function_signature}
        raw = web3.eth.call(call)
        reserve0, reserve1, _ = decode(["uint112", "uint112", "uint32"], raw)

        if reverse:
            price = reserve0 / reserve1
        else:
            price = reserve1 / reserve0

        return {"price": price}

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

# Base on Wormhole, check the current status
@app.get("/crosschain/status")
def get_swap_status():
    script_path = os.path.join(os.path.dirname(__file__), "node-query-wrapper.js")
    result = run(["node", script_path], capture_output=True)

    if result.returncode != 0:
        return JSONResponse(content={"error": "Node script failed"}, status_code=500)

    try:
        token_data = json.loads(result.stdout.decode().strip())

        steps = []
        for token_name, info in token_data.items():
            try:
                supply = int(info["totalSupply"])
                decimals = int(info["decimals"])
            except (KeyError, ValueError, TypeError):
                status = "pending"
            else:
                if supply > 0 and decimals > 0:
                    status = "done"
                elif supply == 0:
                    status = "in-progress"
                else:
                    status = "pending"

            steps.append({
                "label": f"{info.get('symbol', token_name)} Supply Loaded",
                "status": status
            })

        overall_status = "in-progress" if any(s["status"] != "done" for s in steps) else "done"

        return {
            "status": overall_status,
            "steps": steps
        }

    except Exception as e:
        return JSONResponse(content={"error": "Invalid JSON or Wormhole Query failed"}, status_code=500)


@app.get("/tokens/supply")
def get_multi_token_supply():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    result = run(["node", "node-query-wrapper.js"], capture_output=True)

    try:
        parsed = json.loads(result.stdout.decode().strip())
        return parsed
    except Exception as e:
        print("Failed to parse JSON:", e)
        return {"error": "invalid response"}
