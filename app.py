from flask import Flask, jsonify, request, render_template_string
import os
import psutil
import shutil
import subprocess
import time

app = Flask(__name__)

SERVER_DIR = "/home/vboxuser/minebox/server"
START_SCRIPT = "/home/vboxuser/minebox/scripts/start_minecraft_screen.sh"
SCREEN_NAME = "minebox"
PUBLIC_DOMAIN = "test.mine-box.pl"
PUBLIC_TARGET = "31.70.86.109:25565"

HTML = r'''
<!doctype html>
<html lang="pl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>MineBox Physical Panel</title>
<style>
:root{--bg:#0b1120;--card:#1e293b;--card2:#0f172a;--green:#22c55e;--red:#ef4444;--orange:#f59e0b;--blue:#3b82f6;--muted:#94a3b8;--border:rgba(148,163,184,.18)}
*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at top left,rgba(34,197,94,.18),transparent 32%),var(--bg);color:white;font-family:Arial,Segoe UI,sans-serif}.topbar{background:rgba(15,23,42,.94);padding:18px 22px;border-bottom:2px solid var(--green);display:flex;justify-content:space-between;gap:15px;align-items:center}.title{font-size:28px;font-weight:900;color:var(--green)}.subtitle{color:var(--muted);font-size:13px;margin-top:4px}.container{padding:20px;max-width:1500px;margin:0 auto}.status-box{background:linear-gradient(135deg,rgba(34,197,94,.14),rgba(59,130,246,.08)),var(--card);border-radius:22px;padding:24px;margin-bottom:20px;border:1px solid rgba(34,197,94,.35);box-shadow:0 20px 50px rgba(0,0,0,.28)}.big-status{font-size:42px;font-weight:900;margin-bottom:8px}.online{color:var(--green)}.offline{color:var(--red)}.domain{font-size:22px;font-weight:900;color:#bbf7d0;margin-top:8px;word-break:break-word}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px}.card{background:var(--card);padding:18px;border-radius:20px;border:1px solid var(--border)}.card-title{color:var(--muted);margin-bottom:8px;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.06em}.card-value{font-size:26px;font-weight:900;word-break:break-word}.small{color:var(--muted);font-size:13px;margin-top:6px;line-height:1.35}.actions{margin-top:18px;display:flex;flex-wrap:wrap;gap:10px}button{border:none;padding:13px 18px;border-radius:13px;color:white;font-size:15px;cursor:pointer;font-weight:900}button:hover{filter:brightness(1.12)}.start{background:var(--green)}.stop{background:var(--red)}.restart{background:var(--orange)}.refresh{background:var(--blue)}.dark{background:#334155}.console,.logs-box,.section{margin-top:18px;background:var(--card);padding:18px;border-radius:20px;border:1px solid var(--border)}.console-row{display:flex;gap:10px;flex-wrap:wrap}.console input{flex:1;min-width:260px;padding:13px;border-radius:12px;border:1px solid var(--border);background:var(--card2);color:white}.logs{margin-top:14px;background:#020617;color:#22c55e;padding:16px;border-radius:16px;height:410px;overflow:auto;white-space:pre-wrap;font-family:Consolas,monospace;font-size:13px;line-height:1.4;border:1px solid rgba(34,197,94,.2)}.tab{background:#334155}.tab.active{background:var(--green)}.view{display:none}.view.active{display:block}.table{display:grid;gap:9px}.row{display:flex;justify-content:space-between;gap:12px;padding:12px;border-radius:12px;background:rgba(15,23,42,.55);border:1px solid var(--border)}.row span:first-child{color:var(--muted);font-weight:800}.footer{text-align:center;color:#64748b;margin-top:30px;padding-bottom:20px}@media(max-width:800px){.topbar{flex-direction:column;align-items:flex-start}.big-status{font-size:32px}.card-value{font-size:22px}}
</style>
</head>
<body>
<div class="topbar"><div><div class="title">🟩 MineBox Physical Server</div><div class="subtitle">Lokalny panel fizycznego serwera Minecraft</div></div><div><button onclick="showView('simple',this)" class="tab active">Tryb prosty</button> <button onclick="showView('advanced',this)" class="tab">Tryb zaawansowany</button></div></div>
<div class="container">
<div class="status-box"><div id="mainstatus" class="big-status offline">Ładowanie...</div><div class="small">Adres serwera:</div><div class="domain" id="domain">{{ public_domain }}</div><div class="actions"><button class="start" onclick="serverAction('start')">START</button><button class="stop" onclick="serverAction('stop')">STOP</button><button class="restart" onclick="serverAction('restart')">RESTART</button><button class="refresh" onclick="loadData()">ODŚWIEŻ</button><button class="dark" onclick="copyDomain()">KOPIUJ ADRES</button></div><div class="small" id="lastAction">Gotowy.</div></div>
<div id="simple" class="view active"><div class="grid"><div class="card"><div class="card-title">Minecraft</div><div id="minecraft" class="card-value">...</div><div class="small">Status procesu/screen</div></div><div class="card"><div class="card-title">Publiczny dostęp</div><div id="public" class="card-value">...</div><div class="small">Port 25565 na VPS/tunelu</div></div><div class="card"><div class="card-title">CPU</div><div id="cpu" class="card-value">0%</div><div class="small">Zużycie systemu</div></div><div class="card"><div class="card-title">RAM</div><div id="ram" class="card-value">0%</div><div class="small">Pamięć VM</div></div><div class="card"><div class="card-title">Dysk</div><div id="disk" class="card-value">0%</div><div class="small">Dysk systemowy</div></div><div class="card"><div class="card-title">Uptime</div><div id="uptime" class="card-value">...</div><div class="small">Czas działania VM</div></div></div><div class="console"><h2>Konsola Minecraft</h2><div class="console-row"><input id="command" placeholder="np. say MineBox działa albo list"><button class="start" onclick="sendCommand()">Wyślij</button><button class="dark" onclick="quickCommand('list')">LIST</button><button class="dark" onclick="quickCommand('say MineBox online')">TEST SAY</button></div></div><div class="logs-box"><h2>Ostatnie logi</h2><div class="actions"><button class="refresh" onclick="loadLogs()">Odśwież logi</button></div><div class="logs" id="logs">Ładowanie logów...</div></div></div>
<div id="advanced" class="view"><div class="grid"><div class="card"><div class="card-title">Screen</div><div id="screen" class="card-value">...</div><div class="small">Sesja screen minebox</div></div><div class="card"><div class="card-title">Minecraft service</div><div id="mcservice" class="card-value">...</div><div class="small">systemd --user</div></div><div class="card"><div class="card-title">Panel service</div><div id="panelservice" class="card-value">...</div><div class="small">systemd --user</div></div><div class="card"><div class="card-title">Java process</div><div id="javaprocess" class="card-value">...</div><div class="small">Proces serwera</div></div></div><div class="section"><h2>Backupy</h2><div class="actions"><button class="refresh" onclick="createBackup()">Utwórz backup świata</button></div><div class="small" id="backupResult">Backup zapisuje folder world do ~/minebox/backups.</div></div><div class="section"><h2>Pluginy / VIP</h2><div class="table"><div class="row"><span>Folder pluginów</span><b>/home/vboxuser/minebox/server/plugins</b></div><div class="row"><span>MineBoxUltimate</span><b id="mineboxPlugin">sprawdzanie...</b></div><div class="row"><span>VIP command</span><b>/vip</b></div><div class="row"><span>Admin command</span><b>/minebox</b></div></div><div class="actions"><button class="dark" onclick="quickCommand('plugins')">Pokaż pluginy</button><button class="dark" onclick="quickCommand('minebox status')">/minebox status</button><button class="dark" onclick="quickCommand('minebox reload')">/minebox reload</button></div></div><div class="section"><h2>Techniczne</h2><div class="table" id="techTable"></div></div></div><div class="footer">MineBox Physical Alpha 3</div></div>
<script>
function showView(id,btn){document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));document.getElementById(id).classList.add('active');document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));btn.classList.add('active')}function setAction(msg){document.getElementById('lastAction').innerText=msg}function copyDomain(){navigator.clipboard.writeText(document.getElementById('domain').innerText);setAction('Skopiowano adres.')}async function loadData(){const r=await fetch('/api/status');const d=await r.json();document.getElementById('cpu').innerText=d.cpu+'%';document.getElementById('ram').innerText=d.ram+'%';document.getElementById('disk').innerText=d.disk+'%';document.getElementById('uptime').innerText=d.uptime;document.getElementById('minecraft').innerText=d.online?'ONLINE':'OFFLINE';document.getElementById('public').innerText=d.public_port_open?'ONLINE':'OFFLINE';document.getElementById('screen').innerText=d.screen;document.getElementById('mcservice').innerText=d.minecraft_service;document.getElementById('panelservice').innerText=d.panel_service;document.getElementById('javaprocess').innerText=d.java_process?'RUNNING':'NO';document.getElementById('mineboxPlugin').innerText=d.minebox_plugin?'JAR W PLUGINS':'BRAK JAR';const ms=document.getElementById('mainstatus');if(d.online){ms.innerHTML='🟢 SERVER ONLINE';ms.className='big-status online'}else{ms.innerHTML='🔴 SERVER OFFLINE';ms.className='big-status offline'}document.getElementById('techTable').innerHTML=`<div class="row"><span>Server dir</span><b>${d.server_dir}</b></div><div class="row"><span>Start script</span><b>${d.start_script}</b></div><div class="row"><span>Public domain</span><b>${d.public_domain}</b></div><div class="row"><span>Public target</span><b>${d.public_target}</b></div>`}async function loadLogs(){const r=await fetch('/api/logs');document.getElementById('logs').innerText=await r.text()}async function serverAction(action){setAction('Wykonuję: '+action+'...');const r=await fetch('/api/'+action,{method:'POST'});const d=await r.json();setAction(d.message||JSON.stringify(d));setTimeout(()=>{loadData();loadLogs()},1800)}async function sendCommand(){const input=document.getElementById('command');const cmd=input.value.trim();if(!cmd)return;const r=await fetch('/api/command',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({command:cmd})});const d=await r.json();setAction(d.message||JSON.stringify(d));input.value='';setTimeout(loadLogs,1000)}function quickCommand(cmd){document.getElementById('command').value=cmd;sendCommand()}async function createBackup(){setAction('Tworzę backup...');const r=await fetch('/api/backup',{method:'POST'});const d=await r.json();document.getElementById('backupResult').innerText=d.message||JSON.stringify(d);setAction(d.message||'Backup zakończony.')}loadData();loadLogs();setInterval(loadData,5000);setInterval(loadLogs,7000);
</script>
</body></html>
'''

def run(cmd, timeout=8):
    try:
        p = subprocess.run(cmd, shell=True, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=timeout)
        return p.stdout.strip(), p.stderr.strip(), p.returncode
    except subprocess.TimeoutExpired:
        return "", "timeout", 124

def screen_status():
    out, _, _ = run("screen -ls | grep minebox || true")
    if "minebox" in out:
        if "Detached" in out:
            return "DETACHED"
        if "Attached" in out:
            return "ATTACHED"
        return "ONLINE"
    return "OFFLINE"

def is_minecraft_online():
    return screen_status() != "OFFLINE"

def java_process_running():
    out, _, _ = run("pgrep -af 'java.*server.jar' || true")
    return bool(out.strip())

def service_state(name):
    out, _, _ = run(f"systemctl --user is-active {name} 2>/dev/null || true")
    return (out or "unknown").upper()

def public_port_open():
    out, _, _ = run("ss -ltn | grep ':25565 ' || true")
    return bool(out.strip())

def send_to_screen(cmd):
    safe = str(cmd or "").replace("\n", " ").replace("\r", " ").strip()
    if not safe:
        return False, "Pusta komenda."
    if len(safe) > 220:
        return False, "Komenda za długa."
    _, err, code = run(f"screen -S {SCREEN_NAME} -p 0 -X stuff '{safe}\\n'")
    if code != 0:
        return False, err or "Nie udało się wysłać komendy do screen."
    return True, f"Wysłano: {safe}"

@app.route("/")
def index():
    return render_template_string(HTML, public_domain=PUBLIC_DOMAIN)

@app.route("/api/status")
def status():
    uptime, _, _ = run("uptime -p")
    minebox_plugin = os.path.exists(os.path.join(SERVER_DIR, "plugins", "MineBoxUltimate.jar"))
    return jsonify({"cpu": psutil.cpu_percent(), "ram": psutil.virtual_memory().percent, "disk": psutil.disk_usage("/").percent, "uptime": uptime or "brak", "online": is_minecraft_online(), "screen": screen_status(), "java_process": java_process_running(), "minecraft_service": service_state("minebox-minecraft.service"), "panel_service": service_state("minebox-panel.service"), "public_port_open": public_port_open(), "server_dir": SERVER_DIR, "start_script": START_SCRIPT, "public_domain": PUBLIC_DOMAIN, "public_target": PUBLIC_TARGET, "minebox_plugin": minebox_plugin})

@app.route("/api/start", methods=["POST"])
def start():
    if is_minecraft_online():
        return jsonify({"ok": True, "message": "Minecraft już działa."})
    _, err, code = run(START_SCRIPT, timeout=15)
    return jsonify({"ok": code == 0, "message": "Start wysłany." if code == 0 else err})

@app.route("/api/stop", methods=["POST"])
def stop():
    ok, msg = send_to_screen("stop")
    return jsonify({"ok": ok, "message": msg})

@app.route("/api/restart", methods=["POST"])
def restart():
    if is_minecraft_online():
        send_to_screen("stop")
        time.sleep(10)
    _, err, code = run(START_SCRIPT, timeout=15)
    return jsonify({"ok": code == 0, "message": "Restart wykonany." if code == 0 else err})

@app.route("/api/command", methods=["POST"])
def command():
    data = request.get_json(silent=True) or {}
    ok, msg = send_to_screen(data.get("command", ""))
    return jsonify({"ok": ok, "message": msg})

@app.route("/api/logs")
def logs():
    log_path = os.path.join(SERVER_DIR, "logs", "latest.log")
    if not os.path.exists(log_path):
        return "Brak latest.log"
    with open(log_path, "r", encoding="utf-8", errors="ignore") as f:
        return "".join(f.readlines()[-140:])

@app.route("/api/backup", methods=["POST"])
def backup():
    backups_dir = "/home/vboxuser/minebox/backups"
    os.makedirs(backups_dir, exist_ok=True)
    world_dir = os.path.join(SERVER_DIR, "world")
    if not os.path.exists(world_dir):
        return jsonify({"ok": False, "message": "Brak folderu world."}), 400
    name = "world_backup_" + time.strftime("%Y%m%d_%H%M%S")
    target = os.path.join(backups_dir, name)
    shutil.make_archive(target, "zip", SERVER_DIR, "world")
    return jsonify({"ok": True, "message": f"Utworzono backup: {name}.zip"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
