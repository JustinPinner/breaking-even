
// phaser insists that files are loaded from a server to avoid CORS problems
// if you run this locally you'll need to change localHome to reflect your local server path
var localHome = 'https://justinpinner.github.io';

var hideBackground = false; // for those awkward moments when you're testing in public :-/

var screenSize = {
    width: window.innerWidth,
    height: window.innerHeight
};

var borderSize = {
    width: 20,
    height: 20
};

var readerNumSkins = 3;
var nextReaderSkin = 0;
var maxReaders = 7;

var config = {
    type: Phaser.AUTO,
    width: screenSize.width - borderSize.width,
    height: screenSize.height - borderSize.height,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 200 }
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var game = new Phaser.Game(config);

var characters = {
    kath: {
        id: 'kath',
        spriteSheet: {
            path: 'breaking-even/assets/image/kath.png',
            geometry: { 
                frameWidth: 32, 
                frameHeight: 48 
            }
        },
        collideWorldBounds: true,
        bounce: 0.2,
        anims: {
            left: {
                key: 'moveLeft',
                frames: {
                    start: 0,
                    end: 3
                },
                frameRate: 10,
                repeat: -1
            },
            turn: {
                key: 'turn',
                frames: {
                    frame: 4 
                },
                frameRate: 20        
            },
            right: {
                key: 'moveRight',
                frames: {
                    start: 5, 
                    end: 8 
                },
                frameRate: 10,
                repeat: -1                       
            }
        },
        keys: {
            left: {
                keyCode: Phaser.Input.Keyboard.KeyCodes.A
            },
            right: {
                keyCode: Phaser.Input.Keyboard.KeyCodes.D
            },
            jump: {
                keyCode: Phaser.Input.Keyboard.KeyCodes.W
            },
            fire: {
                keyCode: Phaser.Input.Keyboard.KeyCodes.SPACE,
                minInterval: 1000
            }
        }
    },
    dave: {
        id: 'dave',
        spriteSheet: {
            path: 'breaking-even/assets/image/dave.png',
            geometry: { 
                frameWidth: 32, 
                frameHeight: 48 
            }        
        },
        collideWorldBounds: true,
        bounce: 0.2,
        anims: {
            left: {
                key: 'moveLeft',
                frames: {
                    start: 0,
                    end: 3
                },
                frameRate: 10,
                repeat: -1
            },
            turn: {
                key: 'turn',
                frames: {
                    frame: 4 
                },
                frameRate: 20        
            },
            right: {
                key: 'moveRight',
                frames: {
                    start: 5, 
                    end: 8 
                },
                frameRate: 10,
                repeat: -1                       
            }
        },
        keys: {
            left: {
                keyCode: Phaser.Input.Keyboard.KeyCodes.LEFT
            },
            right: {
                keyCode: Phaser.Input.Keyboard.KeyCodes.RIGHT
            },
            jump: {
                keyCode: Phaser.Input.Keyboard.KeyCodes.UP
            }
        }
    },
    reader : {
        id: 'reader#',
        spriteSheet: {
            path: 'breaking-even/assets/image/reader#.png',
            geometry: { 
                frameWidth: 32, 
                frameHeight: 48 
            }        
        },
        collideWorldBounds: true,
        onWorldBoundsEvents: true,
        bounce: 1,
        anims: {
            left: {
                key: 'moveLeft',
                frames: {
                    start: 0,
                    end: 3
                },
                frameRate: 10,
                repeat: -1
            },
            turn: {
                key: 'turn',
                frames: {
                    frame: 4 
                },
                frameRate: 20        
            },
            right: {
                key: 'moveRight',
                frames: {
                    start: 5, 
                    end: 8 
                },
                frameRate: 10,
                repeat: -1                       
            }
        }
    }    
};


var activeProjectiles = [];

var projectiles = {
    paper: {
        id: `paperGu`,
        spriteSheet: {
            path: 'breaking-even/assets/image/gupaper-spritesheet.png',
            geometry: { 
                frameWidth: 22, 
                frameHeight: 22 
            }        
        },
        collideWorldBounds: false,
        bounce: 0,
        anims: {
            spin: {
                key: 'guSpin',
                frames: {
                    start: 0,
                    end: 7
                },
                frameRate: 10,
                repeat: -1
            },
        }
    },
    coin: {
        id: 'coin',
        collideWorldBounds: false,
        bounce: 0,
        spriteSheet: {
            path: 'breaking-even/assets/image/coin-spritesheet.png',
            geometry: {
                frameWidth: 10,
                frameHeight: 10
            }
        }
    }
};

var playerKath;
var playerDave;
var playerKeys;
var readerGroup;
var coinGroup;
var particleManagers = [];
var emitters = [];
var activeReaders = [];
var coins = [];
var expenses = 0;
var expensesText = null;
var revenue = 0;
var revenueText = null;
var profit = 0;
var profitText = null;
var paperCost = 3;
var paperVelocity = screenSize.height * (450/663);
var jumpVelocity = screenSize.height * (230/663);

function preload () {
    this.load.setBaseURL(localHome);
    this.load.image('background', 'assets/image/Breaking-even-KD.png');
    this.load.image('blue', 'assets/image/particle-blue.png');
    this.load.image('coin', 'assets/image/coin.png');

    this.load.spritesheet(characters.kath.id, characters.kath.spriteSheet.path, characters.kath.spriteSheet.geometry);
    this.load.spritesheet(characters.dave.id, characters.dave.spriteSheet.path, characters.dave.spriteSheet.geometry);
    this.load.spritesheet(projectiles.paper.id, projectiles.paper.spriteSheet.path, projectiles.paper.spriteSheet.geometry);

    for (var readerSkin = 0; readerSkin < readerNumSkins; readerSkin += 1) {
        this.load.spritesheet(
            characters.reader.id.replace('#', readerSkin), 
            characters.reader.spriteSheet.path.replace('#', readerSkin), 
            characters.reader.spriteSheet.geometry
        );
    }
}

function addSprite(sceneRef, spawnPos, id) {
    var sprite = sceneRef.physics.add.sprite(Math.floor(spawnPos.x), Math.floor(spawnPos.y), id);
    sprite.name = id;
    return sprite;
}

function genSprite(sceneRef, model, spawnPos, collection, skin) {
    var seq = collection ? collection.length : undefined;
    var modelId = (isNaN(seq) ? model.id : `${model.id.replace('#', seq)}`)
    var sprite = addSprite(sceneRef, spawnPos, modelId);

    sprite.setBounce(model.bounce);
    sprite.setCollideWorldBounds(model.collideWorldBounds);
    sprite.body.onWorldBounds = model.onWorldBoundsEvents || false;
   
    for (var a in model.anims) {
        var anim = model.anims[a];
        var animKey = modelId.concat(`.${(isNaN(skin) ? anim.key : `${anim.key.replace('#', skin)}`)}`);
        var skinKey = (isNaN(skin) ? model.id : `${model.id.replace('#', skin)}`);
        if (sceneRef.anims.get(animKey)) {
            sceneRef.anims.remove(animKey)
        }       
        sceneRef.anims.create({
            key: animKey,
            frames: (anim.frames && !isNaN(anim.frames.start) && !isNaN(anim.frames.end)) ?
                sceneRef.anims.generateFrameNumbers(skinKey, { start: anim.frames.start, end: anim.frames.end }) :
                [ { key: skinKey, frame: anim.frames.frame } ],
            frameRate: anim.frameRate,
            repeat: anim.repeat
        });        
    }

    if (collection) {
        collection.push(sprite);
    }

    return sprite;

}

function createReader(sceneRef) {
    var x = Math.random() * screenSize.width;
    var y = Math.random() * screenSize.height - 200;
    var reader = genSprite(sceneRef, characters.reader, {x: x, y: y}, activeReaders, nextReaderSkin);
    nextReaderSkin += 1;
    if (nextReaderSkin >= readerNumSkins) {
        nextReaderSkin = 0;
    }
    reader.body.allowGravity = false;
    reader.setVelocityX(Math.floor(Math.random() * 160 * ((Math.random() * 100 > 50) ? -1 : 1 )));
    reader.setVelocityY(0);
    reader.body.maxVelocity.y = 0;
    reader.wallet = Math.floor(Math.random() * 10);
    readerGroup.add(reader);
    if (reader.body.velocity.x < 0) {
        reader.anims.play(reader.name.concat('.moveLeft'));
    } else if (reader.body.velocity.x > 0) {
        reader.anims.play(reader.name.concat('.moveRight'));
    } else {
        reader.anims.play(reader.name.concat('.turn'));
    }
}

function createKeys(sceneRef) {
    playerKeys = sceneRef.input.keyboard.addKeys({
        kathJump: characters.kath.keys.jump.keyCode,
        kathLeft: characters.kath.keys.left.keyCode,
        kathRight: characters.kath.keys.right.keyCode,
        kathFire: characters.kath.keys.fire.keyCode,
        daveJump: characters.dave.keys.jump.keyCode,
        daveLeft: characters.dave.keys.left.keyCode,
        daveRight: characters.dave.keys.right.keyCode,
        pause: Phaser.Input.Keyboard.KeyCodes.ESC
    });
}

function createText(sceneRef) {
    // Expenses text
    expensesText = sceneRef.add.text(sceneRef.cameras.main.originX + 20, sceneRef.cameras.main.originY + 20, " COSTS: ");
    //  centers the text
    expensesText.style.align = 'center';
    //  font, size & colour
    expensesText.style.setFontFamily('Arial');
    expensesText.style.setFontStyle('bold');
    expensesText.style.setFontSize(30);
    expensesText.style.color = '#ff0000';
    
    // Profit text
    profitText = sceneRef.add.text(sceneRef.cameras.main.midPoint.x - 60, sceneRef.cameras.main.originY + 20, " PROFIT: ");
    //  centers the text
    profitText.style.align = 'center';
    //  font, size & colour
    profitText.style.setFontFamily('Arial');
    profitText.style.setFontStyle('bold');
    profitText.style.setFontSize(30);
    profitText.style.color = '#ffff00';

    // Revenue text
    revenueText = sceneRef.add.text(sceneRef.cameras.main._width - 260, sceneRef.cameras.main.originY + 20, " REVENUE: ");
    //  centers the text
    revenueText.style.align = 'center';
    //  font, size & colour
    revenueText.style.setFontFamily('Arial');
    revenueText.style.setFontStyle('bold');
    revenueText.style.setFontSize(30);
    revenueText.style.color = '#00ff00';
}

function create() {
    if (!hideBackground) {
        this.add.image(config.width/2, config.height/2, 'background');
    }

    createText(this);

    // set up players
    playerKath = genSprite(this, characters.kath, {x: 100, y: 450});  
    playerDave = genSprite(this, characters.dave, {x: screenSize.width - 100, y: 450});
    playerDave.coins = 0;

    // set up readers
    readerGroup = this.add.group();
    for (var readerNum = 0; readerNum < maxReaders; readerNum += 1) {
        createReader(this);
    }

    this.physics.add.collider(playerKath, playerDave);

    createKeys(this);

    this.physics.world.on('worldbounds', function(obj){
        if (obj.blocked.left) {
            obj.gameObject.anims.play(obj.gameObject.name.concat('.moveRight'));
        }
        if (obj.blocked.right) {
            obj.gameObject.anims.play(obj.gameObject.name.concat('.moveLeft'))
        }
    });
}

function testReaderHit(a, b) {
    return a.name.startsWith('reader') || b.name.startsWith('reader');
}

function readerHit(projectile, reader) {
    // runs within the context of the scene (this === scene)
    // explosion
    // reduce reader's wallet
    for (var r = 0; r < activeReaders.length; r += 1) {
        if (activeReaders[r] === reader) {
            if (reader.wallet) {
                var coinsToDrop = Math.floor(Math.random() * (reader.wallet + 1));
                reader.wallet -= coinsToDrop;
                // drop coin(s)
                for (c = 0; c < coinsToDrop; c += 1) {
                    var coin = genSprite(this, projectiles.coin, { x: activeReaders[r].x, y: activeReaders[r].y }, coins);
                    coin.setVelocityX(Math.floor(Math.random() * 100));
                    coin.setVelocityY(Math.floor(Math.random() * 100));
                    this.physics.add.collider(coin, playerDave, coinCaught);
                }    
            }
        }
    }
    reader.setVelocityX(Math.floor(Math.random()  * 160 * ((Math.random() * 100 > 50) ? -1 : 1 )));
    reader.setVelocityY(0);
}

function updateKath(sceneRef) {
    // kath controls
    if (playerKeys.kathLeft.isDown) {
        playerKath.setVelocityX(-160);
        playerKath.anims.play(playerKath.name.concat('.moveLeft'), true);
    } else if (playerKeys.kathRight.isDown) {
        playerKath.setVelocityX(160);
        playerKath.anims.play(playerKath.name.concat('.moveRight'), true);
    } else if (playerKeys.kathLeft.isUp && playerKeys.kathRight.isUp) {
        playerKath.setVelocityX(0);
        playerKath.anims.play(playerKath.name.concat('.turn'));
    }
    if (playerKeys.kathFire.isDown) {
        if (characters.kath.keys.fire.lastDown && ((new Date().getTime() - characters.kath.keys.fire.lastDown) < characters.kath.keys.fire.minInterval)) {
            return;
        }
        characters.kath.keys.fire.lastDown = new Date().getTime();       
        var paper = genSprite(sceneRef, projectiles.paper, { x: playerKath.x + 5, y: playerKath.y - 15 });
        paper.setVelocityY(-paperVelocity);
        paper.anims.play(paper.name.concat('.guSpin'));
        sceneRef.physics.add.collider(paper, readerGroup, testReaderHit, readerHit, sceneRef);
        activeProjectiles.push(paper);
        expenses += paperCost;
        var paperParticles = sceneRef.add.particles('blue');
        particleManagers.push(paperParticles);
        var paperTrailEmitter = paperParticles.createEmitter({
            speed: 30,
            scale: { start: 0.1, end: 0.2 },
            blendMode: 'ADD'
        });
        emitters.push(paperTrailEmitter);
        paperTrailEmitter.startFollow(paper);
    }
    if (playerKeys.kathJump.isDown) {
        if (!playerKath.body.blocked.down) {
            return;
        }
        playerKath.setVelocityY(-jumpVelocity);
    }
}

function coinCaught(coin, player) {
    // coinCaught runs in the scene context (this === scene)
    if (player.name === playerDave.name) {
        // stick it in the bank
        revenue += 1;
        // destroy the coin
        coin.destroy(this);
    }
}

function updateDave() {
    // dave controls
    if (playerKeys.daveLeft.isDown) {
        playerDave.setVelocityX(-160);
        playerDave.anims.play(playerDave.name.concat('.moveLeft'), true);
    } else if (playerKeys.daveRight.isDown) {
        playerDave.setVelocityX(160);
        playerDave.anims.play(playerDave.name.concat('.moveRight'), true);
    } else if (playerKeys.daveLeft.isUp && playerKeys.daveRight.isUp) {
        playerDave.setVelocityX(0);
        playerDave.anims.play(playerDave.name.concat('.turn'));
    }
    if (playerKeys.daveJump.isDown) {
        if (!playerDave.body.blocked.down) {
            return;
        }
        playerDave.setVelocityY(-jumpVelocity);
    }
}

function updateReaders(sceneRef) {
    for(var r = 0; r < activeReaders.length; r += 1) {
        var reader = activeReaders[r];
        // hack around default effect of a projectile transferring energy to a reader
        if (reader.body.velocity.y !== 0) {
            reader.setVelocityY(0);
        }
    };
    if (activeReaders.length < maxReaders) {
        const missingReaders = maxReaders - activeReaders.length;
        for (r = 0; r < missingReaders; r += 1) {
            createReader(sceneRef);
        }
    }
}

function removeDeadObjects() {
    // split out live and dead projectiles
    const partitionedProjectiles = activeProjectiles.partition(function(obj) {
        return !obj.active || obj.x > screenSize.width || obj.y > screenSize.height;
    });
    // deactivate dead objects
    for (var o = 0; o < partitionedProjectiles[0].length; o += 1) {
        deadObj = partitionedProjectiles[0][o];
        deadObj.active = false;
        const partitionedEmitters = emitters.partition(function(em) {
            return em.follow === deadObj;
        })       
        for (var e = 0; e < partitionedEmitters[0].length; e += 1) {
            partitionedEmitters[0][e].manager.active = false;
            particleManagers = particleManagers.filter(function(particleManager) {
                return particleManager !== partitionedEmitters[0][e].manager;
            })
        }
        emitters = partitionedEmitters[1];
    }
    // turn off particle emitters for live projectiles that have reached their apex
    for (var o = 0; o < partitionedProjectiles[1].length; o += 1) {
        liveObj = partitionedProjectiles[1][o];
        if (liveObj.body.velocity.y > 0) {
            for (var e = 0; e < emitters.length; e += 1) {
                if (emitters[e].follow === liveObj && emitters[e].on) {
                    emitters[e].on = false;
                }
            }
        }
    }
    // keep still-alive projectiles
    activeProjectiles = partitionedProjectiles[1];

    // remove collected / off screen coins
    const partitionedCoins = coins.partition(function(obj) {
        return !obj.active || obj.x < 0 || obj.x > screenSize.width || obj.y > screenSize.height;
    });
    for (c = 0; c < partitionedCoins[0].length; c += 1) {
        partitionedCoins[0][c].destroy();
    }
    coins = partitionedCoins[1];

    // remove exhausted readers
    const partitionedReaders = activeReaders.partition(function(obj){
        return !obj.active || obj.wallet <= 0;
    });
    for (r = 0; r < partitionedReaders[0].length; r += 1) {
        partitionedReaders[0][r].destroy();
    }
    activeReaders = partitionedReaders[1];

}

function updateScores() {
    expensesText.text = ` EXPENSES: ${expenses}`;
    revenueText.text = ` REVENUE: ${revenue}`;
    if (revenue - expenses >= 0) {
        profitText.text = ` PROFIT: ${revenue - expenses}`;
        profitText.setColor('#00ff00');
    } else {
        profitText.text = ` PROFIT: (${Math.abs(revenue - expenses)})`;
        profitText.setColor('#ff0000');
    }
}

function update () {
    if (playerKeys.pause.isDown) {
        debugger;
        playerKeys.pause.isDown = false;
        playerKeys.pause.isUp = true;
    }
    updateKath(this);
    updateDave();
    updateReaders(this);
    removeDeadObjects();
    updateScores();
}
