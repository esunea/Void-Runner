import throttle from 'lodash.throttle';
import Player from '../objects/Player';
import Asteroid from '../objects/Asteroid';
import Shot from '../objects/Shot';

/**
 * Setup and display the main game state.
 */
 export default class Main extends Phaser.State {
  /**
   * Setup all objects, etc needed for the main game state.
   */
   create() {
    // CST
    this.speed = .05;
    this.accel = .01;
    this.maxCameraX = 200;
    this.spawnOffsetX = 100;
    this.spawnCstX = this.game.world.width - this.spawnOffsetX ;
    this.spawnCstY = 50;
    this.spawnOffsetY = this.game.world.height - this.spawnCstY*2;
    this.phaseCD = 2000;
    this.phaseDuration = 1000;
    this.healthMax = 100;
    this.shieldMax = 100;
    this.shieldRegen = 2;
    this.shotCD = 5000;
    this.boostSpeed = 7;
    this.respawnCD = 2000
    this.playerBasicScaleX = .25;
    this.playerBasicScaleY = .25;

    this.powerMax = 100;
    this.powerRegen = 15;
    this.phaseCost = 30;
    this.shotCost = 50;
    this.boostCost = 20;

    //vars
    this.shipSpeed = 1;
    this.shotTimer = 0;
    this.phaseTimer = 0;
    this.phaseActive=false;
    this.health = this.healthMax;
    this.shield = this.shieldMax;
    this.power= this.powerMax;
    this.highScore = 0;
    this.highSpeed = 0;
    this.running = true;
    this.respawnTimer = 0;
    this.score = 0;
    // Add background tile.
    this.bg = this.game.add.tileSprite(-5000, -5000, 10000, 10000, 'blue');


    // HUD 
    this.game.add.sprite(100,10,'red');
    this.phaseBar = this.game.add.sprite(100,10,'gray');
    this.game.add.sprite(100,25,'red');
    this.healthBar = this.game.add.sprite(100,25,'green')
    this.shieldBar = this.game.add.sprite(100,25,'cyan');
    this.shieldBar.alpha = 0.5;


    var style = { font: "15px Arial", fill: "#ff0044"};
    this.scoreText = this.game.add.text(600,10,"score : "+this.score,style);
    this.speedText = this.game.add.text(600,30,"speed : "+this.speed,style);
    this.highSpeedText = this.game.add.text(600,50,"max speed : "+this.highSpeed,style);
    this.highScoreText = this.game.add.text(600,70,"max score : "+this.highScore,style);
    

    // group under the player

    this.star = this.game.add.group();
    this.star.enableBody = true;
    this.star.physicsBodyType = Phaser.Physics.ARCADE;
    

    // Add a player to the game.
    this.player = new Player({
      game: this.game,
      x: this.game.world.centerX,
      y: this.game.world.centerY,
      key: 'Sprites',
      frame: 'player.png',
    });
    
    this.player.scale.setTo(this.playerBasicScaleX,this.playerBasicScaleY);
    this.game.physics.enable(this.player,Phaser.Physics.ARCADE)
    this.player.body.collideWorldBounds = true;
    //this.player.body.setSize(45,50,25,12);

    // groups 
    this.asteroid = this.game.add.group();
    this.asteroid.enableBody = true;
    this.asteroid.physicsBodyType = Phaser.Physics.ARCADE;

    this.shot = this.game.add.group();
    this.shot.enableBody = true;
    this.shot.physicsBodyType = Phaser.Physics.ARCADE;

    this.collectable = this.game.add.group()
    this.collectable.enableBody = true;
    this.collectable.physicsBodyType = Phaser.Physics.ARCADE;

    

    // Enable arcade physics.
    this.game.physics.startSystem(Phaser.Physics.ARCADE);
    // ...

    // Setup listener for window resize.
    window.addEventListener('resize', throttle(this.resize.bind(this), 50), false);
  }

  /**
   * Resize the game to fit the window.
   */
   resize() {
    const width = window.innerWidth * window.devicePixelRatio;
    const height = window.innerHeight * window.devicePixelRatio;

    this.scale.setGameSize(width, height);
  }
  render() {
    //game.debug.body(this.player);
  }
  /**
   * Game loop
   */
   update() {
    if( this.running){
      this.score += this.shipSpeed/1000;

      this.shipSpeed += this.accel;
      if( this.shipSpeed > this.highSpeed) {
        this.highSpeed = this.shipSpeed;

      }
      this.player.x += this.shipSpeed;
      const scaleRatio = 1 + (this.shipSpeed / 100);
      this.player.scale.setTo(this.playerBasicScaleX * scaleRatio,this.playerBasicScaleY * scaleRatio);

      this.shield += this.shieldRegen/60;
      if(this.shield>this.shieldMax){
        this.shield = this.shieldMax;
      }

      this.power += this.powerRegen/60;
      if(this.power > this.powerMax){
        this.power = this.powerMax
      }

      this.inputs()
      
      
      if (this.phaseActive){
        if(this.game.time.now > this.phaseTimer+this.phaseDuration){
          this.phaseSwap();
        }
      }


    // scrolling 
    this.scroll(true,scaleRatio);

  
  

  
    // Spawn
    if(Math.random() <.05){
      this.addAsteroid(this.spawnCstX + Math.random() * this.spawnOffsetX, this.spawnCstY + Math.random() * this.spawnOffsetY);
    }
    if(Math.random() <.07){
      this.addStar(this.spawnCstX + Math.random() * this.spawnOffsetX, this.spawnCstY + Math.random() * this.spawnOffsetY);
    }
    if(Math.random() <.005){
      this.addCollectable(this.spawnCstX + Math.random() * this.spawnOffsetX, this.spawnCstY + Math.random() * this.spawnOffsetY);
    }

    // collision
    this.game.physics.arcade.overlap(this.asteroid, this.player, (player,asteroid)=>
    {
      if(!this.phaseActive){
        asteroid.kill()
        this.playerGetHit();
      }
    }
    , null, this);
    this.game.physics.arcade.overlap(this.asteroid, this.shot, (asteroid,shot)=>
    {
      asteroid.kill()
      this.score += 3;
    }
    , null, this);
    this.game.physics.arcade.overlap(this.collectable, this.player, (player,collectable)=>
    {
        this.score+= 10;
        collectable.kill();
    }
    , null, this);

    // HUD
    this.phaseBar.scale.setTo(this.power/this.powerMax,1)
    this.healthBar.scale.setTo(this.health/this.healthMax,1);
    this.shieldBar.scale.setTo(this.shield/this.shieldMax,1);




    this.scoreText.setText("score : "+this.format(this.score))
    this.speedText.setText("speed : "+this.format(this.shipSpeed))
    this.highSpeedText.setText("record: "+this.format(this.highSpeed))
    this.highScoreText.setText("record: "+this.format(this.highScore))



    
  }else { // if not running
    this.shipSpeed *= .90;
    this.player.x += this.shipSpeed;
    this.scroll(false);
    
    

    if(this.game.time.now > this.respawnTimer+this.respawnCD){ // die
      this.running = true;
      this.score = 0;
      this.shield = this.shieldMax;
      this.power = this.powerMax;
      this.health = this.healthMax;


      this.game.state.start('Menu');
    }
  }
}
  /**
  * Inputs
  */
  inputs() {

    if (this.game.input.keyboard.isDown(Phaser.Keyboard.LEFT)) {
      this.shipSpeed -= this.accel;
      if (this.shipSpeed < 1) {
        this.shipSpeed = 1;
      }
    }
    if (this.game.input.keyboard.isDown(Phaser.Keyboard.UP)) {
     this.player.y -= 10+(this.speed*this.shipSpeed);
   }
   if (this.game.input.keyboard.isDown(Phaser.Keyboard.DOWN)) {
     this.player.y += 10+(this.speed*this.shipSpeed);
   }
   if (this.game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)) {
    console.log(this.phaseTimer + this.phaseCD);

    if (this.game.time.now > this.phaseTimer + this.phaseCD && this.power > this.phaseCost)
    {
      this.phaseTimer = this.game.time.now ;
      this.phaseSwap();
      this.power -= this.phaseCost;

    }
  }
  if (this.game.input.keyboard.isDown(Phaser.Keyboard.CONTROL)) {
    if (this.game.time.now > this.shotTimer + this.shotCD && this.power > this.shotCost)
    {
      this.shotTimer = this.game.time.now ;
      this.addShot();
      this.power -= this.shotCost;
    }


  }
  if (this.game.input.keyboard.isDown(Phaser.Keyboard.SHIFT)) {
    if(this.power > this.boostCost/60){
      this.power -= this.boostCost/60
      this.shipSpeed += this.boostSpeed/60;
    }
  }
  if (this.game.input.keyboard.isDown(Phaser.Keyboard.R)) {
   this.shipSpeed = 1000000000;
   this.playerGetHit();
   this.shipSpeed = 0;
 }

}




  /**
  * Reuse dead asteroid if possible .
  */
  phaseSwap() {
    console.log("hello")
    if (!this.phaseActive) {
      this.player.alpha = .5;
    }else{
      this.player.alpha = 1;
    }
    this.phaseActive = !this.phaseActive;
  }
  playerGetHit(){

    this.shield -= this.shipSpeed*1.5;
    if(this.shield < 0){
      this.health += this.shield;
      this.shield = 0;
    }
    if(this.health < 0) {
      this.health=0;
      console.log("game over");
      this.running = false;
      this.respawnTimer = this.game.time.now;
      //this.shipSpeed = 0;
      let highSpeed = localStorage.getItem('highSpeed')
      if(highSpeed == null){
        highSpeed = 0
      }
      if(this.highSpeed > highSpeed){
        localStorage.setItem('highSpeed', this.format(this.highSpeed));
      }
      
      if(this.score > this.highScore){
        this.highScore = this.score;
      }

      let highScore = localStorage.getItem('highScore')
      if(highScore == null){
        highScore = 0;
      }
      if(this.highScore > highScore){
        localStorage.setItem('highScore', this.format(this.highScore));
      }
      
    }

    this.shipSpeed *= .67;
  }
  addAsteroid(x,y) {

    let asteroid = this.asteroid.getFirstExists(false);

    if (!asteroid && this.asteroid.length<= 6) {
      asteroid = this.initAsteroid();
    }
    if(asteroid){
      asteroid.reset(x,y);
      asteroid.anchor.setTo(0.5,0.5)
      asteroid.rotation = Math.random()*360;
      asteroid.speed = Math.random()
    }

  }
  /**
  * Init new Asteroid.
  */
  initAsteroid() {



    let asteroid = new Asteroid({
      game: this.game,
      x: 0,
      y: 0,
      key: 'Sprites',
      frame: 'meteor.png',
    });
    this.asteroid.add(asteroid);
    

    asteroid.name = 'asteroid' + (this.asteroid.length + 1)
    asteroid.exists = false
    asteroid.visible = false
    asteroid.checkWorldBounds = true
    asteroid.events.onOutOfBounds.add((asteroid) => asteroid.kill(), this)
    return asteroid
  }
  addShot() {
    let shot = this.shot.getFirstExists(false);

    if (!shot ) {
      shot = this.initShot();
    }
    shot.reset(this.player.x,this.player.y);
    shot.anchor.setTo(0.5,0.5)
    shot.body.velocity.x = 2500;
  }
  initShot() {
    let shot = new Shot({
      game: this.game,
      x: 0,
      y: 0,
      key: 'Sprites',
      frame: 'tir.png',
    });
    this.shot.add(shot);
    shot.name = "shot" + (this.shot.length)
    shot.exists = false;
    shot.visible = false
    shot.checkWorldBounds = true
    shot.events.onOutOfBounds.add((shot) => shot.kill(), this)
    return shot

  }
  addStar(x,y) {
    let star = this.star.getFirstExists(false);

    if (!star ) {
      star = this.initStar();
    }
    star.reset(x,y);
    star.anchor.setTo(0.5,0.5)
    
  }
  initStar() {
    const star = this.star.create(0, 0, 'star');
    star.name = "star" + (this.star.length)
    star.exists = false;
    star.visible = false
    star.checkWorldBounds = true
    star.events.onOutOfBounds.add((star) => star.kill(), this)
    return star

  }
  addCollectable(x,y) {
    let collectable = this.collectable.getFirstExists(false);

    if (!collectable ) {
      collectable = this.initCollectable();
    }
    collectable.reset(x,y);
    collectable.anchor.setTo(0.5,0.5);
    
  }
  initCollectable() {
    const collectable = this.collectable.create(0, 0, 'coin');
    collectable.name = "star" + (this.collectable.length)
    collectable.exists = false;
    collectable.visible = false
    collectable.checkWorldBounds = true
    collectable.events.onOutOfBounds.add((collectable) => collectable.kill(), this)
    return collectable

  }

  scroll(resize, ratio = 0) {
    if (this.player.x >= this.maxCameraX) {
      const offset = Math.pow(this.player.x - this.maxCameraX,.5)
      this.bg.tilePosition.x -= offset;
      
       this.star.forEach((star)=>{
        if(star.exists){
          star.x -= Math.pow(this.player.x - this.maxCameraX,.60) ;
         
            const lenRatio = 1+(this.shipSpeed*.1);
            star.scale.setTo(lenRatio,1);
          
        }
      });

        this.collectable.forEach((collectable)=>{
        if(collectable.exists){
          collectable.x -= Math.pow(this.player.x - this.maxCameraX,.75) ;    
        }
      });



      this.asteroid.forEach((asteroid)=>{
        if(asteroid.exists){
          const baseAsteroidMovement = (this.player.x - this.maxCameraX)*(.7 + asteroid.speed*.6)
          const farSlowDown = ((this.game.world.width - asteroid.x) / this.game.world.width)
          let farFactor = 1
          if(farSlowDown <=.5){
            farFactor = (farSlowDown/.5)
          }

          asteroid.x -= baseAsteroidMovement * (.3 + farFactor*.7) ;
          if(resize){
            asteroid.scale.setTo(ratio,ratio);
          }
        }
      });

      this.player.x = this.maxCameraX;
    }
  }
  format(number){
    return Math.round(number*100)/100;
  }


}

