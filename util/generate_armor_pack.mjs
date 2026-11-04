import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const sourcePath = path.join(root, 'rawdata', 'armor_src.json');
const outputDir = path.join(root, 'packs', 'malexp_protection');
const image = 'modules/impmal-core/assets/icons/protection/armour.webp';

const locationMap = {
    all: ['rightLeg', 'leftLeg', 'rightArm', 'leftArm', 'body', 'head'],
    armsBodyLegs: ['rightLeg', 'leftLeg', 'rightArm', 'leftArm', 'body'],
    armsBodyHead: ['rightArm', 'leftArm', 'body', 'head'],
    armsBody: ['rightArm', 'leftArm', 'body'],
    head: ['head'],
    legs: ['rightLeg', 'leftLeg'],
    body: ['body'],
    special: []
};

const traitMap = {
    'Heavy (4)': { key: 'heavy', value: '4' },
    'Heavy (5)': { key: 'heavy', value: '5' },
    'Shield (3)': { key: 'shield', value: '3' },
    'Shield (4)': { key: 'shield', value: '4' },
    'Shield (5)': { key: 'shield', value: '5' },
    Loud: { key: 'loud' },
    Subtle: { key: 'subtle' },
    Sanctified: { key: 'sanctified' }
};

const idFor = name => crypto.createHash('sha256').update(`malexp-protection:${name}`).digest('hex').slice(0, 16);
const fileNameFor = (name, id) => `${name.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '')}_${id}.json`;

const items = JSON.parse(await fs.readFile(sourcePath, 'utf8'));
await fs.rm(outputDir, { recursive: true, force: true });
await fs.mkdir(outputDir, { recursive: true });

await Promise.all(items.map(async item => {
    const id = idFor(item.name);
    const document = {
        name: item.name,
        type: 'protection',
        system: {
            notes: { player: item.notes ?? '', gm: '' },
            encumbrance: { value: item.enc },
            cost: item.cost,
            availability: item.availability,
            quantity: 1,
            equipped: { value: false, force: false },
            traits: { list: item.traits.map(trait => traitMap[trait] ?? { key: trait }) },
            category: item.category,
            armour: item.armour,
            locations: { list: locationMap[item.locations], label: item.locations === 'all' ? 'All' : item.locations },
            damage: {},
            rended: {},
            slots: { list: [], value: 0 },
            mods: { list: [] }
        },
        effects: [],
        flags: {},
        _stats: { compendiumSource: null, duplicateSource: null, exportSource: null, coreVersion: '13.348', systemId: 'impmal', systemVersion: '3.2.0' },
        _id: id,
        img: image,
        folder: null,
        sort: 0,
        ownership: { default: 0 },
        _key: `!items!${id}`
    };
    await fs.writeFile(path.join(outputDir, fileNameFor(item.name, id)), `${JSON.stringify(document, null, 2)}\n`);
}));

console.log(`Generated ${items.length} protection items in ${path.relative(root, outputDir)}`);