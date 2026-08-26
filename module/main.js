Hooks.on('init', () => {
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
        fast: 'Fast',
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