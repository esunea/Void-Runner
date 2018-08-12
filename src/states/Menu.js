export default class Main extends Phaser.State {

    constructor() {
     super();
   }

    preload() {
      
    }

    create() {
      this.bg = this.game.add.tileSprite(-5000, -5000, 10000, 10000, 'blue');
      this.Menu = this.game.add.image(this.game.world.width/2,this.game.world.height/2,'menu');
      this.Menu.anchor.setTo(.5,.5);
      this.input.onDown.add(this._startGame, this);
      let highSpeed = localStorage.getItem("highSpeed")
      var style = { font: "55px Arial", fill: "#ffffff"};
      if(highSpeed	!= null){
		this.game.add.text(this.game.world.width/2-280,this.game.world.height/2-30,"Highest Speed : "+highSpeed,style);
      }
      let highScore = localStorage.getItem("highScore")
      if(highScore	!= null){
		this.game.add.text(this.game.world.width/2-280,this.game.world.height/2+30,"Highest Score : "+highScore,style);
      }
    }

    _startGame () {
     this.game.state.start('Main');
   }
}