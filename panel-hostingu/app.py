import os
import json
from datetime import datetime, timezone
from functools import wraps
from pathlib import Path

from flask import Flask, jsonify, redirect, render_template, request, session, url_for
from werkzeug.security import check_password_hash, generate_password_hash

BASE_DIR = Path(__file__).resolve().parent
DATA_FILE = BASE_DIR / "data.json"

app = Flask(__name__)
app.secret_key = os.environ.get("MINEBOX_SECRET_KEY", "dev-secret-change-me")

ADMIN_EMAIL = os.environ.get("MINEBOX_ADMIN_EMAIL", "admin@mine-box.pl")
ADMIN_PASSWORD_HASH = os.environ.get("MINEBOX_ADMIN_PASSWORD_HASH")
ADMIN_PASSWORD = os.environ.get("MINEBOX_ADMIN_PASSWORD", "minebox-demo")
AGENT_TOKEN = os.environ.get("MINEBOX_AGENT_TOKEN", "dev-agent-token-change-me")

if not ADMIN_PASSWORD_HASH:
    ADMIN_PASSWORD_HASH = generate_password_hash(ADMIN_PASSWORD)


def now_iso():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def default_data():
    return {
        "servers": [
            {
                "id": "minebox-home-001",
                "name": "Survival znajomych",
                "owner_email": ADMIN_EMAIL,
                "address": "survival.mine-box.pl",
                "status": "offline",
                "players_online": 0,
                "players_max": 10,
                "ram_gb": 4,
                "version": "Paper 1.21",
                "location": "Fizyczny MineBox",
                "last_seen": None,
                "last_backup": None,
                "pending_command": None,
                "logs": ["Panel przygotowany. Czekam na połączenie agenta MineBox."]
            }
        ]
    }


def load_data():
    if not DATA_FILE.exists():
        save_data(default_data())
    with DATA_FILE.open("r", encoding="utf-8") as file:
        return json.load(file)


def save_data(data):
    with DATA_FILE.open("w", encoding="utf-8") as file:
        json.dump(data, file, ensure_ascii=False, indent=2)


def find_server(data, server_id):
    return next((server for server in data["servers"] if server["id"] == server_id), None)


def login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if not session.get("user_email"):
            return redirect(url_for("login"))
        return view(*args, **kwargs)
    return wrapped


@app.get("/")
def home():
    if session.get("user_email"):
        return redirect(url_for("dashboard"))
    return redirect(url_for("login"))


@app.route("/login", methods=["GET", "POST"])
def login():
    error = None
    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        if email == ADMIN_EMAIL.lower() and check_password_hash(ADMIN_PASSWORD_HASH, password):
            session["user_email"] = ADMIN_EMAIL
            return redirect(url_for("dashboard"))
        error = "Nieprawidłowy e-mail lub hasło."
    return render_template("login.html", error=error, admin_email=ADMIN_EMAIL)


@app.get("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))


@app.get("/dashboard")
@login_required
def dashboard():
    data = load_data()
    servers = [server for server in data["servers"] if server["owner_email"] == session["user_email"]]
    return render_template("dashboard.html", servers=servers, user_email=session["user_email"])


@app.post("/server/<server_id>/command")
@login_required
def set_command(server_id):
    command = request.form.get("command")
    allowed = {"start", "stop", "restart", "backup"}
    if command not in allowed:
        return redirect(url_for("dashboard"))

    data = load_data()
    server = find_server(data, server_id)
    if server and server["owner_email"] == session["user_email"]:
        server["pending_command"] = command
        server["logs"].insert(0, f"{now_iso()} — panel zlecił komendę: {command}")
        save_data(data)
    return redirect(url_for("dashboard"))


@app.get("/api/agent/<server_id>/poll")
def agent_poll(server_id):
    token = request.headers.get("X-MineBox-Token", "")
    if token != AGENT_TOKEN:
        return jsonify({"error": "unauthorized"}), 401

    data = load_data()
    server = find_server(data, server_id)
    if not server:
        return jsonify({"error": "server_not_found"}), 404

    server["last_seen"] = now_iso()
    command = server.get("pending_command")
    server["pending_command"] = None
    save_data(data)
    return jsonify({"command": command})


@app.post("/api/agent/<server_id>/status")
def agent_status(server_id):
    token = request.headers.get("X-MineBox-Token", "")
    if token != AGENT_TOKEN:
        return jsonify({"error": "unauthorized"}), 401

    payload = request.get_json(silent=True) or {}
    data = load_data()
    server = find_server(data, server_id)
    if not server:
        return jsonify({"error": "server_not_found"}), 404

    server["status"] = payload.get("status", server["status"])
    server["players_online"] = int(payload.get("players_online", server["players_online"]))
    server["players_max"] = int(payload.get("players_max", server["players_max"]))
    server["last_seen"] = now_iso()
    if payload.get("last_backup"):
        server["last_backup"] = payload["last_backup"]
    if payload.get("log"):
        server["logs"].insert(0, f"{now_iso()} — {payload['log']}")
        server["logs"] = server["logs"][:30]
    save_data(data)
    return jsonify({"ok": True})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
