let seaweeds = []; // 用來存放所有水草屬性的陣列
let bubbles = [];  // 用來存放水泡的陣列
let jellyfishes = []; // 用來存放發光水母的陣列
let fishes = [];   // 用來存放小丑魚的陣列
let whale;         // 用來存放鯨魚的變數
let turtles = [];  // 用來存放海龜的陣列
let audioCtx;      // Web Audio API 的 Context，用來程式化合成鯨魚聲音
let myCanvas;      // 存放畫布物件的全域變數
let myIframe;      // 存放 iframe 物件的全域變數
let modeButton;    // 模式切換按鈕
let isInteractiveMode = false; // 目前是否為互動模式

function setup() {
  myCanvas = createCanvas(windowWidth, windowHeight);
  myCanvas.position(0, 0);
  myCanvas.style('z-index', '1');
  myCanvas.style('pointer-events', 'none'); // 預設：讓滑鼠事件穿透畫布，恢復網頁的上下滑動與點擊操作
  
  myIframe = createElement('iframe');
  myIframe.attribute('src', 'https://www.et.tku.edu.tw');
  myIframe.position(0, 0);
  myIframe.style('width', '100%');
  myIframe.style('height', '100%');
  myIframe.style('z-index', '0'); // 將 iframe 放在畫布後方
  myIframe.style('border', 'none');
  myIframe.style('pointer-events', 'auto'); // 預設：讓 iframe 正常接收並處理滑鼠與滾輪事件
  
  // 建立右上角的切換按鈕
  modeButton = createButton('切換為互動模式');
  modeButton.position(windowWidth - 180, 20);
  modeButton.style('z-index', '10'); // 確保按鈕層級在最上方
  modeButton.style('padding', '10px 15px');
  modeButton.style('background-color', '#ffffff');
  modeButton.style('border', '2px solid #a2d2ff');
  modeButton.style('border-radius', '8px');
  modeButton.style('cursor', 'pointer');
  modeButton.style('font-weight', 'bold');
  modeButton.style('color', '#4a4e69');
  modeButton.mousePressed(toggleMode); // 點擊時觸發切換函式

  initSeaweeds();
  let jColors = ['#22223b', '#4a4e69', '#9a8c98', '#c9ada7', '#f2e9e4'];
  for (let c of jColors) {
    jellyfishes.push(new Jellyfish(c)); // 產生 5 隻特定顏色的水母
  }
  
  // 產生 6 隻小丑魚
  for (let i = 0; i < 6; i++) {
    fishes.push(new Clownfish());
  }
  
  // 產生 2 隻海龜
  for (let i = 0; i < 2; i++) {
    turtles.push(new Turtle());
  }

  whale = new Whale(); // 產生一隻鯨魚
}

// 初始化產生所有水草的屬性
function initSeaweeds() {
  randomSeed(42); // 確保每次重新產生時，亂數結果一致
  seaweeds = [];
  let colors = ['#cdb4db', '#ffc8dd', '#ffafcc', '#bde0fe', '#a2d2ff'];
  for (let i = 0; i < 40; i++) { // 減少水草數量，降低密度
    let c = color(random(colors));
    c.setAlpha(150);
    
    seaweeds.push({
      baseX: map(i, 0, 39, 0, width), // 對應新的數量來計算位置
      color: c,                       // 顏色
      weight: random(40, 50),         // 粗細
      hRatio: random(0.1, 0.33),      // 高度比例有高有低，最高至視窗高度的 1/3 (0.33)
      speed: random(0.001, 0.005),    // 再次放慢搖晃頻率，與水母和水泡同步
      noiseOffset: random(1000)       // 亂數偏移量，讓搖晃不同步
    });
  }
}

function draw() {
  clear(); // 先清除上一幀的畫面，避免透明背景疊加與物件殘影
  background('rgba(162, 210, 255, 0.3)'); // #a2d2ff 的 RGB (162, 210, 255) 加上 0.3 透明度
  
  noFill();
  
  // 設定混合模式為 BLEND，讓後續繪製的半透明水草可以自然重疊
  blendMode(BLEND);
  
  // 讀取陣列中記錄的水草屬性來繪製
  for (let sw of seaweeds) {
    stroke(sw.color);
    strokeWeight(sw.weight);
    
    let topY = height - (height * sw.hRatio); 
    
    beginShape();
    for (let y = height; y > topY; y -= 10) {
      let n = noise(sw.noiseOffset + y * 0.01, frameCount * sw.speed);
      let offsetX = map(n, 0, 1, -300, 300);
      let swayFactor = map(y, height, topY, 0, 1);
      
      let currentX = sw.baseX + offsetX * swayFactor;
      
      curveVertex(currentX, y);
    }
    endShape();
  }

  // 更新與繪製鯨魚
  whale.update();
  whale.display();

  // 更新與繪製發光水母 (在水草後繪製，讓濾色光暈能完美提亮底下水草)
  for (let jf of jellyfishes) {
    jf.update();
    jf.display();
  }

  // 更新與繪製小丑魚
  for (let fish of fishes) {
    fish.update();
    fish.display();
  }

  // 更新與繪製海龜
  for (let turtle of turtles) {
    turtle.update();
    turtle.display();
  }



  // 隨機產生水泡 (每 15 個 frame 產生一顆)
  if (frameCount % 15 === 0) {
    bubbles.push(new Bubble());
  }
  
  // 更新與繪製水泡 (由後往前讀取迴圈，方便在水泡破裂結束後將其刪除)
  for (let i = bubbles.length - 1; i >= 0; i--) {
    bubbles[i].update();
    bubbles[i].display();
    if (bubbles[i].isDead) {
      bubbles.splice(i, 1); // 移除已經結束破裂動畫的水泡
    }
  }

  // 繪製模式切換的提示文字
  if (isInteractiveMode) {
    push();
    textAlign(RIGHT, TOP); // 改為靠右對齊
    textSize(12); // 將字體進一步縮小
    textStyle(BOLD);
    noStroke();
    fill(0); // 更改字體顏色為黑色
    drawingContext.shadowColor = 'rgba(255, 255, 255, 0.5)'; // 配合黑色字體，將陰影改為白色光暈以確保清晰
    drawingContext.shadowBlur = 4;
    text('可以和魚群互動囉', width - 30, 65); // 更改提示詞內容
    drawingContext.shadowBlur = 0; // 手動重置陰影，避免部分瀏覽器 pop() 未清除導致全域卡頓
    drawingContext.shadowColor = 'transparent';
    pop();
  }
}

// 定義小丑魚類別
class Clownfish {
  constructor() {
    this.x = random(width);
    this.y = random(height * 0.3, height * 0.9);
    this.size = random(0.5, 1.2);                   // 隨機大小
    this.speed = random(0.3, 0.8);                  // 緩慢游動的速度
    this.dir = random() > 0.5 ? 1 : -1;             // 1 為向右游，-1 為向左游
    this.wobbleOffset = random(1000);               // 上下起伏的雜訊偏移
    if (this.dir === -1) this.speed *= -1;          // 根據方向決定速度正負
    this.baseSpeed = this.speed;                    // 記憶原始速度
    this.currentSpeed = this.speed;                 // 目前的實際速度
  }

  update() {
    // 計算與滑鼠的距離
    let d = dist(this.x, this.y, mouseX, mouseY);
    if (isInteractiveMode && d < 250) { // 必須在互動模式下，且擴大驚嚇判定範圍
      // 靠近時受到驚嚇，大幅提升加速逃離的速度與靈敏度
      let runSpeed = map(d, 0, 250, 30, 8); 
      let targetSpeed = this.x > mouseX ? runSpeed : -runSpeed;
      this.currentSpeed = lerp(this.currentSpeed, targetSpeed, 0.3);
      this.y += this.y > mouseY ? 2 : -2; // 增加上下亂竄的閃躲感
    } else {
      // 遠離後慢慢恢復原本的悠閒速度
      this.currentSpeed = lerp(this.currentSpeed, this.baseSpeed, 0.05);
    }

    this.x += this.currentSpeed;
    this.y += sin(frameCount * 0.015 + this.wobbleOffset) * 0.5; // 隨水波微幅上下擺動

    // 根據移動方向更新面向 (防止魚倒著游)
    if (this.currentSpeed > 0.5) this.dir = 1;
    else if (this.currentSpeed < -0.5) this.dir = -1;

    // 當小丑魚游出畫面邊界時，從另一側重新出現，並重新決定高度
    if (this.currentSpeed > 0 && this.x > width + 100) {
      this.x = -100;
      this.y = random(height * 0.3, height * 0.9);
    } else if (this.currentSpeed < 0 && this.x < -100) {
      this.x = width + 100;
      this.y = random(height * 0.3, height * 0.9);
    }
  }

  display() {
    push();
    translate(this.x, this.y);
    scale(this.size);
    if (this.dir === -1) scale(-1, 1); // 如果往左游，水平翻轉畫布
    
    noStroke();
    fill('#ffa62b'); // 使用新的指定顏色

    // 繪製簡化的身體
    ellipse(0, 0, 40, 20);
    // 繪製簡化的尾鰭
    triangle(-20, 0, -35, -10, -35, 10);

    pop();
  }
}

// 定義發光水母類別
class Jellyfish {
  constructor(col) {
    this.x = random(width);
    this.y = random(height * 0.2, height * 0.8);
    this.tx = random(1000); // 獨立的 X 軸雜訊種子，用於計算移動速度
    this.ty = random(2000); // 獨立的 Y 軸雜訊種子，用於計算移動速度
    this.col = color(col);  // 儲存水母專屬的顏色
    this.currentVy = 0;     // 記錄目前的垂直速度以計算形變
  }

  update() {
    // 利用 noise() 產生有機、平滑的移動速度 (範圍 -2 到 2)
    let vx = map(noise(this.tx), 0, 1, -2, 2);
    // 稍微縮小 Y 軸的雜訊隨機游動範圍，將主要的起伏交給 sin() 來呈現
    let vy = map(noise(this.ty), 0, 1, -1, 1);
    
    // 計算與滑鼠的距離
    let d = dist(this.x, this.y, mouseX, mouseY);
    if (isInteractiveMode && d < 250) { // 限制只有在互動模式下才受滑鼠吸引
      // 靠近時受到吸引，往滑鼠方向產生拉力
      let attractX = map(d, 0, 250, 0.03, 0.005) * (mouseX - this.x);
      let attractY = map(d, 0, 250, 0.03, 0.005) * (mouseY - this.y);
      vx += attractX;
      vy += attractY;
    }

    this.x += vx;
    
    this.currentVy = vy + sin(frameCount * 0.015 + this.tx) * 1.5; // 放慢上下起伏的速度
    this.y += this.currentVy;
    
    // 推進時間維度
    this.tx += 0.002; // 放慢游動的雜訊變化
    this.ty += 0.002;

    // 讓水母超出邊界時，會從另一邊游回來
    if (this.x < -150) this.x = width + 150;
    if (this.x > width + 150) this.x = -150;
    if (this.y < -150) this.y = height + 150;
    if (this.y > height + 150) this.y = -150;
  }

  display() {
    // 提取 RGB 顏色，方便後續加入不同透明度
    let r = red(this.col);
    let g = green(this.col);
    let b = blue(this.col);

    // 1. 繪製發光的光暈
    blendMode(SCREEN); 
    let pulse = sin(frameCount * 0.015); // 放慢呼吸閃爍的速度
    let glowRadius = 150 + pulse * 20; // 讓光暈隨時間產生像呼吸一樣的微弱閃爍
    let grad = drawingContext.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowRadius);
    grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.6)`); 
    grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);   
    drawingContext.fillStyle = grad;
    noStroke();
    circle(this.x, this.y, glowRadius * 2);
    blendMode(BLEND); 

    // 2. 繪製水母本體
    fill(r, g, b, 200);
    // 利用 currentVy 產生擠壓與拉伸 (Squash & Stretch) 效果
    let stretch = map(this.currentVy, -2.5, 2.5, 12, -12);
    let headWidth = 40 - stretch * 0.8 + pulse * 5; // 往上時變窄，往下時變寬
    let headHeight = 40 + stretch;                  // 往上時拉長，往下時變扁
    arc(this.x, this.y, headWidth, headHeight, PI, 0); 
    
    // 3. 繪製水母觸手
    stroke(r, g, b, 150);
    strokeWeight(2);
    noFill();
    for (let i = -10; i <= 10; i += 10) {
      beginShape();
      for (let j = 0; j <= 50; j += 10) {
        let sway = sin(frameCount * 0.015 + j * 0.1) * 8; // 放慢觸手飄逸的速度
        let ptX = this.x + i + sway;
        let ptY = this.y + j;
        // 頭尾端點重複給予，讓 curveVertex 能平滑連接到終點
        if (j === 0 || j === 50) curveVertex(ptX, ptY);
        curveVertex(ptX, ptY);
      }
      endShape();
    }
  }
}

// 定義鯨魚類別
class Whale {
  constructor() {
    this.size = 2.5; // 尺寸縮放
    this.dir = random() > 0.5 ? 1 : -1;
    this.speed = random(0.3, 0.8) * this.dir; // 調整為與小丑魚相同的游動速度
    // 初始位置在畫面外
    this.x = this.dir > 0 ? -300 * this.size : width + 300 * this.size;
    this.y = random(height * 0.2, height * 0.5); // 在畫面上半部游動
    this.wobbleOffset = random(1000);
    this.particles = []; // 存放噴水粒子的陣列
    this.isHovered = false; // 記錄滑鼠是否正懸停在鯨魚身上，避免重複播放音效
  }

  update() {
    this.x += this.speed;
    this.y += sin(frameCount * 0.01 + this.wobbleOffset) * 0.2; // 非常緩慢的垂直擺動

    // 判斷滑鼠是否靠近鯨魚 (僅限互動模式)
    let d = dist(this.x, this.y, mouseX, mouseY);
    if (isInteractiveMode && d < 120) {
      if (!this.isHovered) {
        this.isHovered = true; // 標記為已懸停
        this.playWhaleSound(); // 播放音效
      }
    } else {
      // 滑鼠離開鯨魚範圍後，重置懸停狀態
      this.isHovered = false;
    }

    // 游出邊界時，從另一側重新出現
    if (this.speed > 0 && this.x > width + 300 * this.size) {
      this.x = -300 * this.size;
      this.y = random(height * 0.2, height * 0.5);
    } else if (this.speed < 0 && this.x < -300 * this.size) {
      this.x = width + 300 * this.size;
      this.y = random(height * 0.2, height * 0.5);
    }

    // 更新噴水粒子
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update();
      if (this.particles[i].isDead()) {
        this.particles.splice(i, 1);
      }
    }
  }

  display() {
    // 繪製水粒子 (使用全域座標繪製在鯨魚身後，不受鯨魚縮放/翻轉影響)
    for (let p of this.particles) {
      p.display();
    }

    push();
    translate(this.x, this.y);
    scale(this.size);
    if (this.dir === -1) scale(-1, 1);

    noStroke();
    fill(40, 45, 70, 100); // 深藍、半透明的剪影顏色

    // 繪製尾巴
    beginShape();
    vertex(-100, 0);
    quadraticVertex(-130, -30, -150, -15);
    quadraticVertex(-130, 0, -120, 15);
    quadraticVertex(-110, 10, -100, 0);
    endShape(CLOSE);

    // 繪製身體
    arc(0, 0, 200, 60, PI, 0);
    arc(0, 2, 200, 40, 0, PI);
    
    pop();
  }

  checkClick(mx, my) {
    // 判斷滑鼠是否點擊在鯨魚範圍內 (利用橢圓半徑粗略判斷距離)
    let d = dist(mx, my, this.x, this.y);
    if (d < 120) { 
      this.triggerSpout();
    }
  }

  triggerSpout() {
    // 計算噴氣孔位置：相對於鯨魚中心略為偏前與偏上的位置
    let blowholeX = this.x + (this.dir * 40 * this.size);
    let blowholeY = this.y - (28 * this.size);
    for (let i = 0; i < 50; i++) { // 一次產生 50 顆粒子製造大量水花
      this.particles.push(new WaterParticle(blowholeX, blowholeY));
    }
  }

  playWhaleSound() {
    if (whaleSound) {
      // 將播放時間歸零，讓音效每次都能從頭開始播放
      whaleSound.currentTime = 0; 
      // 捕捉可能因為瀏覽器安全政策 (需使用者互動) 而造成的自動播放錯誤
      whaleSound.play().catch(e => console.log('播放音效被瀏覽器攔截，點擊畫面後即會恢復正常。'));
    }
  }
}

// 切換畫布與 iframe 的互動模式
function toggleMode() {
  isInteractiveMode = !isInteractiveMode;
  
  if (isInteractiveMode) {
    myCanvas.style('pointer-events', 'auto');
    myIframe.style('pointer-events', 'none');
    modeButton.html('切換為網頁瀏覽模式');
    modeButton.style('background-color', '#a2d2ff'); // 按下後按鈕變藍色，表示開啟互動特效
    modeButton.style('color', '#ffffff');
  } else {
    myCanvas.style('pointer-events', 'none');
    myIframe.style('pointer-events', 'auto');
    modeButton.html('切換為互動模式');
    modeButton.style('background-color', '#ffffff'); // 恢復白底
    modeButton.style('color', '#4a4e69');
  }
}

// 全域滑鼠點擊事件
function mousePressed() {
  // 在互動模式下，點擊鯨魚觸發噴水
  if (isInteractiveMode) {
    whale.checkClick(mouseX, mouseY);
  }
}

// 當視窗大小改變時，自動調整畫布尺寸以維持全螢幕
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  modeButton.position(windowWidth - 180, 20); // 視窗縮放時也要重新定位按鈕，確保維持在右上角
  initSeaweeds(); // 視窗改變時重新計算一次水草的X位置以適應新寬度
}

// 定義水泡類別
class Bubble {
  constructor() {
    this.x = random(width);
    this.y = height + 50;                           // 從畫面底部以下開始
    this.size = random(15, 35);                     // 水泡大小
    this.speed = random(0.2, 0.8);                  // 大幅放慢上升速度
    this.popY = random(height * 0.1, height * 0.8); // 隨機決定破掉的高度
    this.wobble = random(1000);                     // 左右飄動的偏移量
    this.isPopping = false;                         // 狀態：是否正在破裂
    this.popRadius = this.size;                     // 破裂時的半徑
    this.popAlpha = 127;                            // 破裂時的透明度
    this.isDead = false;                            // 狀態：是否需要從陣列移除
  }

  update() {
    if (!this.isPopping) {
      this.y -= this.speed;
      this.x += sin(frameCount * 0.015 + this.wobble) * 0.5; // 放慢水泡左右搖晃速度
      
      if (this.y < this.popY) {
        this.isPopping = true;
      }
    } else {
      // 破裂動畫更新：半徑擴大、透明度降低
      this.popRadius += 2;
      this.popAlpha -= 10;
      if (this.popAlpha <= 0) {
        this.isDead = true;
      }
    }
  }

  display() {
    if (!this.isPopping) {
      noStroke();
      fill(255, 127); // 水泡主體：白色，透明度 0.5 (255 * 0.5 ≒ 127)
      circle(this.x, this.y, this.size);
      
      fill(255, 204); // 左上角高光：白色，透明度 0.8 (255 * 0.8 ≒ 204)
      circle(this.x - this.size * 0.2, this.y - this.size * 0.2, this.size * 0.3);
    } else {
      noFill();
      stroke(255, this.popAlpha);
      strokeWeight(2);
      circle(this.x, this.y, this.popRadius);
    }
  }
}

// 定義鯨魚噴水的粒子類別
class WaterParticle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = random(-1.5, 1.5);
    this.vy = random(-8, -4); // 初始向上衝刺速度快
    this.alpha = 255;
    this.size = random(3, 8);
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2;  // 模擬重力，讓水花在頂端慢慢落下
    this.alpha -= 5; // 逐漸變透明消散
  }

  display() {
    noStroke();
    fill(255, 255, 255, this.alpha);
    circle(this.x, this.y, this.size);
  }

  isDead() {
    return this.alpha <= 0;
  }
}

// 定義海龜類別
class Turtle {
  constructor() {
    this.size = random(0.8, 1.2);                   // 海龜大小
    this.dir = random() > 0.5 ? 1 : -1;             // 隨機向左或向右
    this.speed = random(0.3, 0.6) * this.dir;       // 游動速度較慢
    this.x = this.dir > 0 ? -100 : width + 100;     // 從畫面外出現
    this.y = random(height - 150, height - 50);     // 限制在畫面最底部
    this.wobbleOffset = random(1000);               // 動畫偏移量
  }

  update() {
    this.x += this.speed;
    this.y += sin(frameCount * 0.01 + this.wobbleOffset) * 0.2; // 緩慢上下起伏

    // 游出邊界時重新從另一側出現
    if (this.speed > 0 && this.x > width + 150) {
      this.x = -150;
      this.y = random(height - 150, height - 50);
    } else if (this.speed < 0 && this.x < -150) {
      this.x = width + 150;
      this.y = random(height - 150, height - 50);
    }
  }

  display() {
    push();
    translate(this.x, this.y);
    scale(this.size);
    if (this.dir === -1) scale(-1, 1); // 如果往左游，水平翻轉畫布

    noStroke();

    // 畫後腳 (帶有微幅擺動動畫)
    fill('#8A9A5B'); // 柔和的墨綠色
    push();
    translate(-25, 5);
    rotate(cos(frameCount * 0.03 + this.wobbleOffset) * 0.5);
    ellipse(0, 5, 15, 8);
    pop();

    // 畫前腳 (帶有較大划水動畫)
    fill('#8A9A5B');
    push();
    translate(15, 5);
    rotate(sin(frameCount * 0.03 + this.wobbleOffset) * 0.6);
    ellipse(0, 10, 12, 30);
    pop();

    // 畫頭部
    fill('#8A9A5B');
    ellipse(35, 5, 20, 12);
    fill(0);
    circle(38, 2, 3); // 眼睛

    // 畫龜殼
    fill('#4F772D'); // 深一點的綠色作為龜殼
    arc(0, 5, 70, 35, PI, TWO_PI); // 龜殼上半部 (修正角度 PI 到 0 造成的無窮迴圈/破圖 bug)
    fill('#31572C');
    ellipse(0, 5, 70, 10);    // 龜殼底部邊緣

    pop();
  }
}