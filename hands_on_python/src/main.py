import json
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from starlette.staticfiles import StaticFiles

app = FastAPI()

# Serve static files from the same folder as index.html
app.mount(
    "/static",
    StaticFiles(directory=Path(__file__).parent.resolve() / "static"),
    name="static",
)

@app.get("/")
async def get():
    # TODO: for developing only - remove before prod
    with open(f"{Path(__file__).parent.resolve()}/index.html", "r") as f:
        html = f.read()
    return HTMLResponse(content=html, status_code=200)

class Room:
    def __init__(self):
        self.connections = []
        self.locals = {}
        self.loc = {}
        self.ready = False


class RoomManager:
    def __init__(self):
        self.rooms = {}

    async def connect_user(self, websocket: WebSocket, client_id: int, room_id: int):
        if room_id not in self.rooms:
            self.create_room(room_id)

        await websocket.accept()
        self.rooms[room_id].connections.append(websocket)
        self.rooms[room_id].loc[client_id] = {"ready": False, "code": ""}

    async def broadcast(self, room_id: int, response: dict):
        print(json.dumps(response))
        for connection in self.rooms[room_id].connections:
            await connection.send_text(json.dumps(response))

    def create_room(self, room_id: int):
        self.rooms[room_id] = Room()

    async def disconnect_user(self, websocket: WebSocket, client_id: int, room_id: int):
        self.rooms[room_id].connections.remove(websocket)
        del self.rooms[room_id].loc[client_id]

    def remove_empty_room(self, room_id: int):
        if room_id in self.rooms and not self.rooms[room_id].connections:
            del self.rooms[room_id]

    def process_message(self, json_string: str, client_id: int, room_id: int):
        message = json.loads(json_string)
        if room_id in self.rooms:
            if message["type"] == "code":
                self.rooms[room_id].loc[client_id] = {
                    "ready": True,
                    "code": message["value"],
                }
            elif message["type"] == "run":
                # set global readiness to True
                self.rooms[room_id].ready = True

    def run_loc_check(self, room_id: int):
        messages = []
        # run LOC if all users are "ready"
        if self.rooms[room_id].ready:
            # concatenate code together with " " separator
            loc = "".join(
                [
                    user_data["code"]
                    for user_id, user_data in self.rooms[room_id].loc.items()
                ]
            )
            messages.append(loc)

            try:
                # exec the LOC within the room variable space
                exec(loc, {}, self.rooms[room_id].locals)
                messages.append(str(self.rooms[room_id].locals))

            except Exception as e:
                messages.append(str(e))

        # reset global readiness check
        self.rooms[room_id].ready = False
        return messages


room_manager = RoomManager()


@app.websocket("/ws/{client_id}/{room_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: int, room_id: int):
    try:
        await room_manager.connect_user(
            websocket=websocket, client_id=client_id, room_id=room_id
        )

        # broadcast an initial message with the current room participants
        await room_manager.broadcast(
            room_id=room_id,
            response={"terminal": [], "loc": room_manager.rooms[room_id].loc},
        )

        while True:
            json_string = await websocket.receive_text()

            room_manager.process_message(
                json_string=json_string, client_id=client_id, room_id=room_id
            )
            messages = room_manager.run_loc_check(room_id=room_id)

            await room_manager.broadcast(
                room_id=room_id,
                response={"terminal": messages, "loc": room_manager.rooms[room_id].loc},
            )

    except WebSocketDisconnect:
        # Handle disconnection
        await room_manager.disconnect_user(websocket, client_id, room_id)

        await room_manager.broadcast(
            room_id=room_id,
            response={"terminal": "", "loc": room_manager.rooms[room_id].loc},
        )

        room_manager.remove_empty_room(room_id)


def cli():
    import uvicorn
    import socket

    myip = (
        (
            [
                ip
                for ip in socket.gethostbyname_ex(socket.gethostname())[2]
                if not ip.startswith("127.")
            ]
            or [
                [
                    (s.connect(("8.8.8.8", 53)), s.getsockname()[0], s.close())
                    for s in [socket.socket(socket.AF_INET, socket.SOCK_DGRAM)]
                ][0][1]
            ]
        )
        + ["no IP found"]
    )[0]
    print(
        f"Starting on: http://0.0.0.0:8000/, http://127.0.0.1:8000/, http://{myip}:8000/"
    )
    uvicorn.run(app, host="0.0.0.0", port=8000)


if __name__ == "__main__":
    cli()
