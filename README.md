# malexp_FoundryVTT
FoundryVTT module, bringing in the community currated Maledictum Expanded homebrew expansion for the Imperium Maledictum game system.

# Usage
- Go to [Releases](https://github.com/meins111/malexp_FoundryVTT/releases)
- Copy the link to the latest version's manifest.json file
- Go to foundry setup screen, then to Add-On Modules
- Install Module
- Paste link to the manifest.json into the field at the bottom of the Install Module screen
- Press Install
- Start foundry world once install is completed
- Active the Module in the Module Settings

## Status
### Expanded Talents
Contains many more talents, mostly imported from the older FFG 40k titles, expecially from Only War, Rogue Trader and Dark Heresy 1&2.
- [x] Import Data
- [x] Create prerequisite rules
- [ ] Import Expanded Talents
  - [x] Raw Data Import
- [ ] Create automations for talents
  - [x] Sound Constitution
  - [x] Superior Chirurgeon / Nerves of Steel (+x SL type talents)

### Expanded Armouries
Contains many more item options (weapons, armor, drugs, wargear, etc) from various sources.
- [ ] Import Data
  - [x] Weapons
  - [ ] Armor
  - [ ] Gear
  - [ ] Cybernetics
  - [ ] Consumables
- [ ] Automate complex items, like cybernetic and drugs which may require writing effects
- [x] Inject Expanded Weapon Traits to ImpMal system

### Expanded Bestiary
- [x] Import Star Children (credits: Stexinator)
- [ ] Import Necron (credits: Miguel)
- [ ] Import Adeptus Mechanicus (credits: Miguel)

### Expanded Character Creation
- [ ] Import New Species
  - [x] Ogryns (Species PoC as transfer Item)
- [ ] Import Origins
- [ ] Import Factions

# Changelog
- v1.0.0: Initial module setup with talents only.
- v1.0.2: Weapon import, release script
- v1.1.0: First Bestiary entries
- v1.2.0: Ogryn PoC, more Bestiary
- v1.3.0: Necrons & AdMech Bestiary

# Development
**Setup:** Make sure you have npm and nodejs (20+) installed. Run `npm install` in the repository root folder.

## Workflow: Foundry-to-git
1. Make changes in foundry.
2. Lock the compendium once changes are done. Shutdown foundry world.
3. Copy foundry ldb file from the module to `build/packs/`
4. Run `npm run extractPacks`
5. Review and Commit changes applied to the extracted json files in `packs/...`

## Workflow: Json-to-Foundry
1. Make changes to json files under `packs/...`
2. Run `npm run build` to pack json's into *.ldb file
3. Shutdown foundry. Copy ldb file over the existing one in foundry module/data
4. Start foundry and check changes

## Release
There is a github action hooked to making a new release, that will pack the json content from `packs/...` into ldb(s), adjust the module version in `module.json` and create a release zip artifact.
Adjust the version number in [module.json](module.json) - it will be used to name the packed release file.


