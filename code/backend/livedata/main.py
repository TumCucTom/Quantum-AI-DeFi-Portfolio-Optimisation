# from fastapi import FastAPI, WebSocket
# from contextlib import asynccontextmanager
# import asyncio

# from livedata import broadcast_loop, connected_clients

# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     task = asyncio.create_task(broadcast_loop())
#     print(f"Server start")
#     yield
#     task.cancel()
#     print(f"server finish")

# app = FastAPI(lifespan=lifespan)

# @app.websocket("/ws")
# async def websocket_endpoint(websocket: WebSocket):
#     await websocket.accept()
#     connected_clients.add(websocket)
#     print("✅ WebSocket 클라이언트 연결됨")

#     try:
#         while True:
#             msg = await websocket.receive_text()
#             print(f"📨 클라이언트로부터 메시지 수신: {msg}")
#     except Exception as e:
#         print(f"❌ WebSocket 연결 종료: {repr(e)}")
#     finally:
#         connected_clients.remove(websocket)
#         print("👋 클라이언트 연결 해제됨")

from fastapi import FastAPI
from subprocess import run
import json
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 또는 ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/tokens/supply")
def get_multi_token_supply():
    # node-query-multi-token.js가 현재 main.py와 같은 디렉토리에 있을 경우
    script_dir = os.path.dirname(os.path.abspath(__file__))
    result = run(["node", "node-query-wrapper.js"], capture_output=True)
    
    # print("📦 Raw Node Output:", result.stdout.decode())

    try:
        parsed = json.loads(result.stdout.decode().strip())
        return parsed
    except Exception as e:
        print("❌ JSON 파싱 실패:", e)
        return {"error": "invalid response"}
