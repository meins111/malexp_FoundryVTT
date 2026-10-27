const ensureActiveEffectChangesSchema = () => {
    const activeEffectModel = CONFIG.ActiveEffect?.dataModels?.base;
    if (!activeEffectModel || activeEffectModel.schema.changes) return;

    activeEffectModel.schema.changes = new foundry.data.fields.ArrayField(
        new foundry.data.fields.SchemaField({
            key: new foundry.data.fields.StringField({ initial: '' }),
            mode: new foundry.data.fields.NumberField({ initial: 0 }),
            value: new foundry.data.fields.StringField({ initial: '' }),
            priority: new foundry.data.fields.NumberField({ initial: 0 })
        }),
        { initial: [] }
    );
};

Hooks.on('init', () => {
    ensureActiveEffectChangesSchema();
    foundry.utils.mergeObject(game.impmal.config.disciplines, {
        nurglitePowers: 'Nurglite Powers'
    });

    foundry.utils.mergeObject(game.impmal.config.npcRoles, {
        master: 'Master',
        overseer: 'Overseer '
    });

    foundry.utils.mergeObject(game.impmal.config.weaponArmourTraits, {
        accurate: 'Accurate',
        fast: 'Fast',
        sanctified: 'Sanctified',
        storm: 'Storm (X)',
        twinLinked: 'Twin-Linked',
        tripleLinked: 'Triple-Linked',
        vratine: 'Vratine',
        quadLinked: 'Quad-Linked',
        haywire: 'Haywire (X)',
        luminagen: 'Luminagen',
        transonic: 'Transonic',
        gyroStabilized: 'Gyro-Stabilized',
        vespid: 'Vespid',
        grav: 'Grav',
        gauss: 'Gauss',
        phase: 'Phase',
        tesla: 'Tesla',
    });

    game.impmal.config.weaponTraitEffects ??= {};
    foundry.utils.mergeObject(game.impmal.config.weaponTraitEffects, {
        gauss: {
            name: 'Gauss',
            system: {
                transferData: { documentType: 'Item' },
                scriptData: [
                    {
                        label: 'Gauss: +5 to Severity',
                        trigger: 'preRollWeaponTest',
                        script: 'args.data.critModifier = (args.data.critModifier || 0) + 5;'
                    },
                    {
                        label: 'Gauss: Critical if it ends in 9',
                        trigger: 'rollWeaponTest',
                        script: "if (args.result.outcome === 'success' && !args.result.critical && (args.result.roll % 10 === 9)) { args.result.critical = true; }"
                    }
                ]
            }
        },
        tesla: {
            name: 'Tesla',
            system: {
                transferData: { documentType: 'Item' },
                scriptData: [{
                    label: 'Tesla: Arc Jump',
                    trigger: 'applyDamage',
                    script: `
                    let attackerTest = args.opposed?.attackerTest;
                    if (!attackerTest) return;

                    let context = args.context;
                    let isFirstLink = !context.teslaChain;
                    context.teslaChain = context.teslaChain || new Set();

                    let qualifies = args.excess > 0; // The hit incapacitates/kills
                    if (isFirstLink) {
                        let digit = attackerTest.result.roll % 10;
                        qualifies = qualifies || digit === 9 || digit === 0;
                    }
                    if (!qualifies) return;

                    let currentToken = args.actor.getActiveTokens()[0];
                    if (!currentToken) return;
                    context.teslaChain.add(currentToken.id);

                    let regions = currentToken.document.regions;
                    if (!regions || regions.size === 0) return; // No Region defined, cannot determine proximity

                    let attackerToken = attackerTest.actor.getActiveTokens()[0];

                    let candidates = canvas.tokens.placeables.filter(t =>
                        !context.teslaChain.has(t.id) &&
                        t.id !== attackerToken?.id &&
                        t.document.regions.size > 0 &&
                        [...t.document.regions].some(r => regions.has(r))
                    );
                    if (!candidates.length) return;

                    let index = Math.floor(CONFIG.Dice.randomUniform() * candidates.length);
                    let target = candidates[index];
                    context.teslaChain.add(target.id);

                    if (!target.actor?.applyDamage) return;

                    ChatMessage.create({
                        content: '<p><i class="fa-solid fa-bolt"></i> Tesla: the arc jumps to ' + target.name + '</p>',
                        speaker: ChatMessage.getSpeaker({actor: attackerTest.actor})
                    });

                    target.actor.applyDamage(args.opposed.damage, {
                        ignoreAP: false,
                        location: 'body',
                        message: true,
                        opposed: args.opposed,
                        context
                    });
                `,
                }]
            }
        },
        Accurate: {
        name: 'Accurate',
        system: {
            transferData: { documentType: 'Item' },
            scriptData: [
                {
                    label: 'Accurate: +1 SL when Aiming',
                    trigger: 'dialog',
                    script: "args.fields.SL++;",
                    options: {
                        hideScript: "return !(args.weapon?.system.isRanged && args.actor.statuses.has('aim'));",
                        activateScript: "return args.weapon?.system.isRanged && args.actor.statuses.has('aim');"
                    }
                },
                {
                    label: 'Accurate: Aimed Marker',
                    trigger: 'preRollWeaponTest',
                    script: "args.context.accurateAimed = args.item.system.isRanged && args.actor.statuses.has('aim');"
                },
                {
                    label: 'Accurate: Extra Damage per SL',
                    trigger: 'rollWeaponTest',
                    script: `
                        if (!args.context.accurateAimed) return;
                        let sl = Math.max(0, args.result.SL || 0);
                        let bsBonus = args.actor.system.characteristics.bs.bonus;
                        let bonus = Math.min(Math.floor(sl / 2), bsBonus);
                        if (bonus > 0) {
                            args.result.additionalDamage = (args.result.additionalDamage || 0) + bonus;
                        }

                    `
                }]
            }
        },
        fast: {
            name: 'Fast',
            system: {
                transferData: { documentType: 'Item' },
                scriptData: [{
                    label: 'Fast: -2 SL when attempting to Parry',
                    trigger: 'dialog',
                    script: "args.fields.SL -= 2;",
                    options: {
                        hideScript: "return !args.actor.defendingAgainst || !args.weapon;",
                        activateScript: "return !!args.actor.defendingAgainst && !!args.weapon;"
                    }
                }]
            }
        },
        inflict: {
            name: 'Inflict (X)',
            system: {
                transferData: { documentType: 'Item' },
                scriptData: [{
                    label: 'Inflict: apply weapon conditions',
                    trigger: 'applyDamage',
                    script: `
                        let conditions = (args.item?.system?.traits?.list || [])
                            .filter(trait => trait.key === 'inflict' && trait.value)
                            .map(trait => String(trait.value).toLowerCase());
                        for (let condition of conditions) {
                            if (args.actor?.toggleStatusEffect) {
                                args.actor.toggleStatusEffect(condition, {active: true});
                            }
                        }
                    `
                }]
            }
        },
        twinLinked: {
            name: 'Twin-Linked',
            system: {
                transferData: { documentType: 'Item' },
                scriptData: [{
                    label: 'Twin-Linked: +1 SL',
                    trigger: 'dialog',
                    script: 'args.fields.SL++;'
                }, {
                    label: 'Twin-Linked: additional hit at SL 4+',
                    trigger: 'rollWeaponTest',
                    script: 'if ((args.result.SL || 0) >= 4) args.result.additionalHits = (args.result.additionalHits || 0) + 1;'
                }]
            }
        },
        tripleLinked: {
            name: 'Triple-Linked',
            system: {
                transferData: { documentType: 'Item' },
                scriptData: [{
                    label: 'Triple-Linked: +2 SL',
                    trigger: 'dialog',
                    script: 'args.fields.SL += 2;'
                }, {
                    label: 'Triple-Linked: additional hit at SL 3+',
                    trigger: 'rollWeaponTest',
                    script: 'if ((args.result.SL || 0) >= 3) args.result.additionalHits = (args.result.additionalHits || 0) + 1;'
                }]
            }
        },
        quadLinked: {
            name: 'Quad-Linked',
            system: {
                transferData: { documentType: 'Item' },
                scriptData: [{
                    label: 'Quad-Linked: +3 SL',
                    trigger: 'dialog',
                    script: 'args.fields.SL += 3;'
                }, {
                    label: 'Quad-Linked: additional hit at SL 2+',
                    trigger: 'rollWeaponTest',
                    script: 'if ((args.result.SL || 0) >= 2) args.result.additionalHits = (args.result.additionalHits || 0) + 1;'
                }]
            }
        },
        gyroStabilized: {
            name: 'Gyro-Stabilized',
            system: {
                transferData: { documentType: 'Item' },
                scriptData: [{
                    label: 'Gyro-Stabilized: effective range is Long',
                    trigger: 'preRollWeaponTest',
                    script: 'if (args.item?.system?.isRanged) args.context.gyroStabilized = true;'
                }]
            }
        },
        transonic: {
            name: 'Transonic',
            system: {
                transferData: { documentType: 'Item' },
                scriptData: [{
                    label: 'Transonic: ignores armour',
                    trigger: 'preApplyDamage',
                    script: 'args.ignoreAP = true;'
                }]
            }
        },
        sanctified: {
            name: 'Sanctified',
            system: {
                transferData: { documentType: 'Item' },
                scriptData: [{
                    label: 'Sanctified: Holy damage',
                    trigger: 'preApplyDamage',
                    script: 'args.holy = true;'
                }]
            }
        },
        vespid: {
            name: 'Vespid',
            system: {
                transferData: { documentType: 'Item' },
                scriptData: [{
                    label: 'Vespid: user restriction',
                    trigger: 'preRollWeaponTest',
                    script: "if (!String(args.actor?.system?.species || '').toLowerCase().includes('vespid')) args.result = { ...(args.result || {}), success: false, failed: true };"
                }]
            }
        },
        haywire: {
            name: 'Haywire (X)',
            system: {
                transferData: { documentType: 'Item' },
                scriptData: [{
                    label: 'Haywire: resolve effect on hit',
                    trigger: 'applyDamage',
                    script: `
                        let trait = args.item?.system?.traits?.list?.find(t => t.key === 'haywire');
                        let bonus = Number(trait?.value || 0);
                        let roll = Math.ceil(CONFIG.Dice.randomUniform() * 10);
                        let total = roll + bonus;
                        let effect = total <= 2 ? 'No noticeable effect.' :
                            total <= 4 ? '-1 SL to powered technology actions; Power Armour Speed becomes Slow.' :
                            total <= 6 ? '-2 SL to powered technology actions; Power Armour Speed becomes Slow.' :
                            total <= 8 ? '-2 SL and Disadvantage to powered technology actions; Power Armour Speed becomes no movement.' :
                            'As above; the effect lasts 1d5 additional rounds.';
                        args.context.haywire = Math.max(args.context.haywire || 0, total);
                        ChatMessage.create({
                            content: '<p><strong>Haywire (' + bonus + ')</strong>: ' + roll + ' + ' + bonus + ' = ' + total + '. ' + effect + '</p>',
                            speaker: ChatMessage.getSpeaker({actor: args.opposed?.attackerTest?.actor || args.actor})
                        });
                    `
                }]
            }
        },
        luminagen: {
            name: 'Luminagen',
            system: {
                transferData: { documentType: 'Item' },
                scriptData: [{
                    label: 'Luminagen: mark target',
                    trigger: 'applyDamage',
                    script: `
                        let rounds = 1 + Math.floor(CONFIG.Dice.randomUniform() * 5) + 1;
                        let ablaze = Math.ceil(CONFIG.Dice.randomUniform() * 10) >= 9;
                        args.context.luminagenRounds = rounds;
                        if (ablaze && args.actor?.toggleStatusEffect) args.actor.toggleStatusEffect('ablaze', {active: true});
                        ChatMessage.create({
                            content: '<p><strong>Luminagen</strong>: target is affected for ' + rounds + ' rounds.' + (ablaze ? ' The target becomes Ablaze.' : '') + '</p>',
                            speaker: ChatMessage.getSpeaker({actor: args.opposed?.attackerTest?.actor || args.actor})
                        });
                    `
                }]
            }
        },
        phase: {
            name: 'Phase',
            system: {
                transferData: { documentType: 'Item' },
                scriptData: [
                    {
                        label: "Phase: Ignores Armour and Force Fields",
                        trigger: 'preApplyDamage',
                        script: `
                            args.ignoreAP = true;
                            if (args.locationData) args.locationData.field = null;
                        `
                    },
                    {
                        label: "Phase: Destruction against C'tan",
                        trigger: 'preApplyDamage',
                        script: `
                            let isCtan = args.actor.items.some(i => i.name === "C'tan");
                            if (!isCtan) return;

                            args.value = 0; // The attack deals no damage to the C'tan

                            new Roll("2d10").roll().then(heal => {
                                heal.toMessage({ flavor: "Phase: the C'tan regenerates", speaker: { alias: args.actor.name } });
                                let newWounds = Math.max(0, args.actor.system.combat.wounds.value - heal.total);
                                args.actor.update({ "system.combat.wounds.value": newWounds });
                            });

                            this.item.delete();
                        `
                    }
                ]
            }
        },

        grav: {
            name: 'Grav',
            system: {
                transferData: { documentType: 'Item' },
                scriptData: [
                    {
                        label: "Grav: Adds Armour Rating to Damage",
                        trigger: 'preApplyDamage',
                        script: `
                            let armourBonus = (args.modifiers || [])
                                .filter(m => m.armour)
                                .reduce((sum, m) => sum - Number(m.value || 0), 0);
                            if (armourBonus < 0) {
                                args.woundsGained = (args.woundsGained || 0) + armourBonus;
                            }
                        `
                    }
                ]
            }
        }
    });


    foundry.utils.mergeObject(game.impmal.config.traitHasValue, {
        storm: true,
        haywire: true
    
    
});
});

Hooks.once('ready', async () => {
    const resets = [];
    for (const actor of game.actors?.contents || []) {
        const flags = actor.flags?.malexp || {};
        for (const key of Object.keys(flags)) {
            if (key.startsWith('talented_') && key.endsWith('_used')) {
                resets.push(actor.unsetFlag('malexp', key));
            }
        }
    }
    await Promise.all(resets);
});