import json
import glob

# El script de JavaScript para Foundry VTT
JS_SCRIPT = """const actor = this.actor;
if (!actor) return;
const currentWounds = actor.system.combat.wounds.value;
const maxWounds = actor.system.combat.wounds.max;
if (currentWounds > 0 && currentWounds < maxWounds) {
    const newWounds = Math.max(currentWounds - 2, 0);
    await actor.update({ "system.combat.wounds.value": newWounds });
    ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: actor }),
        content: `<div class="im-chat-card" style="border: 1px solid #00ffcc; padding: 8px; border-radius: 4px; background: #111;"><h3 style="color: #00ffcc; margin-top: 0; display: flex; align-items: center; gap: 5px;">🤖 Metal Viviente</h3><p style="font-size: 13px; margin-bottom: 5px;">La estructura de la máquina se reconfigura de forma autónoma.</p><hr style="border: 0; border-top: 1px solid #333;"><p style="font-size: 12px; margin: 0;"><b>Efecto:</b> Se reducen 2 Heridas.</p><p style="font-size: 11px; color: #888; margin: 3px 0 0 0;">Heridas: <code>${currentWounds}</code> ➔ <code style="color: #00ffcc; font-weight: bold;">${newWounds}</code></p></div>`
    });
}"""

files = glob.glob("*.json")
modified_count = 0

print(f"Analizando {len(files)} archivos JSON...")

for fpath in files:
    if "_Folder.json" in fpath or fpath == "inyectar_living_metal.py":
        continue
        
    with open(fpath, "r", encoding="utf-8") as f:
        try:
            data = json.load(f)
        except:
            continue

    if data.get("type") == "npc" and "items" in data:  # Cambiado a 'npc' según tu diagnóstico
        modified = False
        for item in data["items"]:
            # Normalizar el nombre para la comparación
            item_name = item.get("name", "").lower().strip()
            item_type = item.get("type", "")
            
            # Verificamos si el tipo es trait y si EMPIEZA con el texto clave
            if item_type == "trait" and (item_name.startswith("living metal") or item_name.startswith("metal viviente")):
                
                if "flags" not in item:
                    item["flags"] = {}
                
                # Inyectamos la macro con el trigger correcto
                item["flags"]["macro"] = {
                    "type": "script",
                    "scope": "macro",
                    "command": JS_SCRIPT,
                    "author": "MiguelWanderer",
                    "trigger": "startTurn"
                }
                modified = True
                modified_count += 1
                print(f"  [+] Macro inyectada en: {data.get('name')} -> {item.get('name')}")
        
        if modified:
            with open(fpath, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)

print(f"\n¡Proceso completado con éxito!")
print(f"Se modificaron {modified_count} traits de Metal Viviente en total.")