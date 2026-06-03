import json
import glob

# El script de JavaScript optimizado y con el estilo visual nativo de IM
JS_REANIMATION = """const token = canvas.tokens.controlled[0];
if (!token) {
    ui.notifications.warn("Please, select a Necron token on the map before executing this macro.");
    return;
}
const actor = token.actor;
const targetNumber = 7;
const roll = new Roll("1d10");
await roll.evaluate();
let chatContent = "";
if (roll.total >= targetNumber) {
    const recoveredWounds = roll.total;
    const currentWounds = actor.system.combat.wounds.value;
    const newWounds = Math.max(currentWounds - recoveredWounds, 0);
    await actor.update({ "system.combat.wounds.value": newWounds });
    const deadEffect = actor.effects.find(e => e.statuses.has("dead") || e.statuses.has("unconscious") || e.name?.toLowerCase().includes("dead") || e.name?.toLowerCase().includes("unconscious") || e.name?.toLowerCase().includes("muerto") || e.name?.toLowerCase().includes("incapacitado"));
    let effectRemovedText = "";
    if (deadEffect) {
        await deadEffect.delete();
        effectRemovedText = `<div style="font-family: 'Courier New', monospace; font-size: 11px; color: #85c1e9; text-transform: uppercase; margin-top: 5px; border-left: 2px solid #85c1e9; padding-left: 5px;">>> STATUS_UPDATE: UNIT_RESTORED_TO_COMBAT</div>`;
    }
    chatContent = `<div class="im-reanimation-card" style="background: #191e1e; border: 1px solid #4a5d5e; border-top: 3px solid #2ecc71; border-bottom: 3px solid #2ecc71; padding: 10px; font-family: 'Signika', 'Helvetica Neue', Helvetica, Arial, sans-serif; box-shadow: inset 0 0 10px rgba(0,0,0,0.8);"><div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #4a5d5e; padding-bottom: 4px; margin-bottom: 8px;"><span style="font-family: 'Courier New', monospace; font-weight: bold; font-size: 12px; color: #2ecc71; text-transform: uppercase; letter-spacing: 1px;">[ PROTOCOLS ACTIVE ]</span><span style="font-family: 'Courier New', monospace; font-size: 11px; color: #889999;">TARGET: ${targetNumber}+</span></div><div style="font-size: 13px; color: #d1dada; line-height: 1.4; margin-bottom: 8px; font-style: italic;">"Necrodermis structural matrix re-engaging. Sub-routines operational."</div><div style="background: rgba(0, 0, 0, 0.4); border: 1px solid #2d3839; padding: 6px; margin-bottom: 5px;"><table style="width: 100%; margin: 0; border-collapse: collapse; font-size: 12px; color: #b2c0c0;"><tr><td style="padding: 2px 0;">Roll Evaluation:</td><td style="text-align: right; font-weight: bold; color: #fff; font-family: 'Courier New', monospace;">${roll.total}</td></tr><tr><td style="padding: 2px 0;">Wounds Reconfigured:</td><td style="text-align: right; font-weight: bold; color: #2ecc71; font-family: 'Courier New', monospace;">-${recoveredWounds}</td></tr><tr style="border-top: 1px solid #3d4c4d;"><td style="padding: 4px 0 2px 0; font-weight: bold;">Current Wounds:</td><td style="text-align: right; padding: 4px 0 2px 0; font-family: 'Courier New', monospace; font-weight: bold;"><span style="text-decoration: line-through; color: #e74c3c;">${currentWounds}</span> ➔ <span style="color: #2ecc71;">${newWounds}</span></td></tr></table></div>${effectRemovedText}</div>`;
} else {
    chatContent = `<div class="im-reanimation-card" style="background: #1c1414; border: 1px solid #5e4444; border-top: 3px solid #e74c3c; border-bottom: 3px solid #e74c3c; padding: 10px; font-family: 'Signika', 'Helvetica Neue', Helvetica, Arial, sans-serif; box-shadow: inset 0 0 10px rgba(0,0,0,0.8);"><div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #5e4444; padding-bottom: 4px; margin-bottom: 8px;"><span style="font-family: 'Courier New', monospace; font-weight: bold; font-size: 12px; color: #e74c3c; text-transform: uppercase; letter-spacing: 1px;">[ REANIMATION FAILED ]</span><span style="font-family: 'Courier New', monospace; font-size: 11px; color: #998888;">TARGET: ${targetNumber}+</span></div><div style="font-size: 13px; color: #dad1d1; line-height: 1.4; margin-bottom: 8px; font-style: italic;">"Critical hardware corruption detected. System drive remaining static."</div><div style="background: rgba(0, 0, 0, 0.4); border: 1px solid #392d2d; padding: 6px; font-size: 12px; color: #c0b2b2;"><table style="width: 100%; margin: 0; border-collapse: collapse;"><tr><td>Roll Evaluation:</td><td style="text-align: right; font-weight: bold; color: #fff; font-family: 'Courier New', monospace;">${roll.total}</td></tr><tr><td style="color: #e74c3c; font-weight: bold; padding-top: 4px;" colspan="2">>> CRITICAL_FAILURE: UNIT_OFFLINE</td></tr></table></div></div>`;
}
roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor: actor }), flavor: chatContent });"""

files = glob.glob("*.json")
modified_count = 0

print(f"Analyzing {len(files)} JSON files to inject Reanimation Protocols...")

for fpath in files:
    if "_Folder.json" in fpath or fpath in ["inyectar_living_metal.py", "inyectar_reanimation.py"]:
        continue
        
    with open(fpath, "r", encoding="utf-8") as f:
        try:
            data = json.load(f)
        except:
            continue

    if data.get("type") == "npc" and "items" in data:
        modified = False
        for item in data["items"]:
            item_name = item.get("name", "").lower().strip()
            item_type = item.get("type", "")
            
            # Condición de búsqueda basada en el diagnóstico exitoso anterior
            if item_type == "trait" and item_name.startswith("reanimation protocols"):
                if "flags" not in item:
                    item["flags"] = {}
                
                # Inyección de la macro estructural
                item["flags"]["macro"] = {
                    "type": "script",
                    "scope": "macro",
                    "command": JS_REANIMATION,
                    "author": "MiguelWanderer",
                    "trigger": "onUse"
                }
                modified = True
                modified_count += 1
                print(f"  [+] Automated code injected into: {data.get('name')} -> {item.get('name')}")
        
        if modified:
            with open(fpath, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)

print(f"\n¡Process completed successfully!")
print(f"Automated macros injected into {modified_count} Reanimation Protocols traits.")