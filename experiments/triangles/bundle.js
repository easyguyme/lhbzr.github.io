THREE.EffectComposer=function(renderer,renderTarget){this.renderer=renderer;if(renderTarget===undefined){var pixelRatio=renderer.getPixelRatio();var width=Math.floor(renderer.context.canvas.width/pixelRatio)||1;var height=Math.floor(renderer.context.canvas.height/pixelRatio)||1;var parameters={minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,format:THREE.RGBFormat,stencilBuffer:false};renderTarget=new THREE.WebGLRenderTarget(width,height,parameters)}this.renderTarget1=renderTarget;this.renderTarget2=renderTarget.clone();this.writeBuffer=this.renderTarget1;this.readBuffer=this.renderTarget2;this.passes=[];if(THREE.CopyShader===undefined)console.error("THREE.EffectComposer relies on THREE.CopyShader");this.copyPass=new THREE.ShaderPass(THREE.CopyShader)};THREE.EffectComposer.prototype={swapBuffers:function(){var tmp=this.readBuffer;this.readBuffer=this.writeBuffer;this.writeBuffer=tmp},addPass:function(pass){this.passes.push(pass)},insertPass:function(pass,index){this.passes.splice(index,0,pass)},render:function(delta){this.writeBuffer=this.renderTarget1;this.readBuffer=this.renderTarget2;var maskActive=false;var pass,i,il=this.passes.length;for(i=0;i<il;i++){pass=this.passes[i];if(!pass.enabled)continue;pass.render(this.renderer,this.writeBuffer,this.readBuffer,delta,maskActive);if(pass.needsSwap){if(maskActive){var context=this.renderer.context;context.stencilFunc(context.NOTEQUAL,1,4294967295);this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,delta);context.stencilFunc(context.EQUAL,1,4294967295)}this.swapBuffers()}if(pass instanceof THREE.MaskPass){maskActive=true}else if(pass instanceof THREE.ClearMaskPass){maskActive=false}}},reset:function(renderTarget){if(renderTarget===undefined){renderTarget=this.renderTarget1.clone();var pixelRatio=this.renderer.getPixelRatio();renderTarget.width=Math.floor(this.renderer.context.canvas.width/pixelRatio);renderTarget.height=Math.floor(this.renderer.context.canvas.height/pixelRatio)}this.renderTarget1.dispose();this.renderTarget1=renderTarget;this.renderTarget2.dispose();this.renderTarget2=renderTarget.clone();this.writeBuffer=this.renderTarget1;this.readBuffer=this.renderTarget2},setSize:function(width,height){this.renderTarget1.setSize(width,height);this.renderTarget2.setSize(width,height)}};THREE.MaskPass=function(scene,camera){this.scene=scene;this.camera=camera;this.enabled=true;this.clear=true;this.needsSwap=false;this.inverse=false};THREE.MaskPass.prototype={render:function(renderer,writeBuffer,readBuffer,delta){var context=renderer.context;context.colorMask(false,false,false,false);context.depthMask(false);var writeValue,clearValue;if(this.inverse){writeValue=0;clearValue=1}else{writeValue=1;clearValue=0}context.enable(context.STENCIL_TEST);context.stencilOp(context.REPLACE,context.REPLACE,context.REPLACE);context.stencilFunc(context.ALWAYS,writeValue,4294967295);context.clearStencil(clearValue);renderer.render(this.scene,this.camera,readBuffer,this.clear);renderer.render(this.scene,this.camera,writeBuffer,this.clear);context.colorMask(true,true,true,true);context.depthMask(true);context.stencilFunc(context.EQUAL,1,4294967295);context.stencilOp(context.KEEP,context.KEEP,context.KEEP)}};THREE.ClearMaskPass=function(){this.enabled=true};THREE.ClearMaskPass.prototype={render:function(renderer,writeBuffer,readBuffer,delta){var context=renderer.context;context.disable(context.STENCIL_TEST)}};THREE.RenderPass=function(scene,camera,overrideMaterial,clearColor,clearAlpha){this.scene=scene;this.camera=camera;this.overrideMaterial=overrideMaterial;this.clearColor=clearColor;this.clearAlpha=clearAlpha!==undefined?clearAlpha:1;this.oldClearColor=new THREE.Color;this.oldClearAlpha=1;this.enabled=true;this.clear=true;this.needsSwap=false};THREE.RenderPass.prototype={render:function(renderer,writeBuffer,readBuffer,delta){this.scene.overrideMaterial=this.overrideMaterial;if(this.clearColor){this.oldClearColor.copy(renderer.getClearColor());this.oldClearAlpha=renderer.getClearAlpha();renderer.setClearColor(this.clearColor,this.clearAlpha)}renderer.render(this.scene,this.camera,readBuffer,this.clear);if(this.clearColor){renderer.setClearColor(this.oldClearColor,this.oldClearAlpha)}this.scene.overrideMaterial=null}};THREE.ShaderPass=function(shader,textureID){this.textureID=textureID!==undefined?textureID:"tDiffuse";this.uniforms=THREE.UniformsUtils.clone(shader.uniforms);this.material=new THREE.ShaderMaterial({defines:shader.defines||{},uniforms:this.uniforms,vertexShader:shader.vertexShader,fragmentShader:shader.fragmentShader});this.renderToScreen=false;this.enabled=true;this.needsSwap=true;this.clear=false;this.camera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);this.scene=new THREE.Scene;this.quad=new THREE.Mesh(new THREE.PlaneBufferGeometry(2,2),null);this.scene.add(this.quad)};THREE.ShaderPass.prototype={render:function(renderer,writeBuffer,readBuffer,delta){if(this.uniforms[this.textureID]){this.uniforms[this.textureID].value=readBuffer}this.quad.material=this.material;if(this.renderToScreen){renderer.render(this.scene,this.camera)}else{renderer.render(this.scene,this.camera,writeBuffer,this.clear)}}};THREE.CopyShader={uniforms:{tDiffuse:{type:"t",value:null},opacity:{type:"f",value:1}},vertexShader:["varying vec2 vUv;","void main() {","vUv = uv;","gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );","}"].join("\n"),fragmentShader:["uniform float opacity;","uniform sampler2D tDiffuse;","varying vec2 vUv;","void main() {","vec4 texel = texture2D( tDiffuse, vUv );","gl_FragColor = opacity * texel;","}"].join("\n")};THREE.DotScreenShader={uniforms:{tDiffuse:{type:"t",value:null},tSize:{type:"v2",value:new THREE.Vector2(256,256)},center:{type:"v2",value:new THREE.Vector2(.5,.5)},angle:{type:"f",value:1.57},scale:{type:"f",value:1}},vertexShader:["varying vec2 vUv;","void main() {","vUv = uv;","gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );","}"].join("\n"),fragmentShader:["uniform vec2 center;","uniform float angle;","uniform float scale;","uniform vec2 tSize;","uniform sampler2D tDiffuse;","varying vec2 vUv;","float pattern() {","float s = sin( angle ), c = cos( angle );","vec2 tex = vUv * tSize - center;","vec2 point = vec2( c * tex.x - s * tex.y, s * tex.x + c * tex.y ) * scale;","return ( sin( point.x ) * sin( point.y ) ) * 4.0;","}","void main() {","vec4 color = texture2D( tDiffuse, vUv );","float average = ( color.r + color.g + color.b ) / 3.0;","gl_FragColor = vec4( vec3( average * 10.0 - 5.0 + pattern() ), color.a );","}"].join("\n")};THREE.RGBShiftShader={uniforms:{tDiffuse:{type:"t",value:null},amount:{type:"f",value:.005},angle:{type:"f",value:0}},vertexShader:["varying vec2 vUv;","void main() {","vUv = uv;","gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );","}"].join("\n"),fragmentShader:["uniform sampler2D tDiffuse;","uniform float amount;","uniform float angle;","varying vec2 vUv;","void main() {","vec2 offset = amount * vec2( cos(angle), sin(angle));","vec4 cr = texture2D(tDiffuse, vUv + offset);","vec4 cga = texture2D(tDiffuse, vUv);","vec4 cb = texture2D(tDiffuse, vUv - offset);","gl_FragColor = vec4(cr.r, cga.g, cb.b, cga.a);","}"].join("\n")};(function(){var windowWidth=window.innerWidth,windowHeight=window.innerHeight,windowClicked=false;var mouseX=0,mouseY=0;function int(min,max){return Math.floor(Math.random()*(max-min+1)+min)}var audio,audioContext,audioAnalyser,audioBuffer,audioSource,audioFrequency,request;function initAudio(){audio=new Audio;audio.crossOrigin="anonymous";audioContext=new(window.AudioContext||window.webkitAudioContext);audioSource=audioContext.createMediaElementSource(audio);audioSource.connect(audioContext.destination);audioAnalyser=audioContext.createAnalyser();audioAnalyser.smoothingTimeConstant=.1;audioAnalyser.fftSize=512*4;audioSource.connect(audioAnalyser);request=new XMLHttpRequest;request.onreadystatechange=function(){if(request.readyState===4&&request.status===200){var information=JSON.parse(request.responseText);audio.src=information.stream_url+"?client_id=78c6552c14b382e23be3bce2fc411a82";audio.play();var music=document.createElement("a");music.className="soundcloud-link";music.setAttribute("href",information.permalink_url);music.innerHTML='<img src="https://developers.soundcloud.com/assets/logo_white.png" class="soundcloud-img">'+information.title+" - "+information.user.username;document.body.appendChild(music)}};request.open("GET","//api.soundcloud.com/resolve.json?url=https://soundcloud.com/theblackkeys/gold-on-the-ceiling&client_id=78c6552c14b382e23be3bce2fc411a82",true);request.send();audioAnalyser.connect(audioContext.destination);audioFrequency=new Uint8Array(audioAnalyser.frequencyBinCount);audio.addEventListener("ended",function(){audio.play()})}var scene,camera,renderer,light,composer,circle,triangle,triangleGeometry,triangleMaterial,triangleSleeve,triangleLength=100,effectOne,effectTwo;function initScene(){scene=new THREE.Scene;camera=new THREE.PerspectiveCamera(75,windowWidth/windowHeight,.1,1e3);camera.position.z=250;scene.add(camera);renderer=new THREE.WebGLRenderer({alpha:true});renderer.setClearColor(16777215,0);renderer.setSize(windowWidth,windowHeight);light=new THREE.DirectionalLight(16777215,1);light.position.set(1,1,1);scene.add(light);light=new THREE.DirectionalLight(16777215,1);light.position.set(-1,-1,1);scene.add(light);circle=new THREE.Object3D;triangle=[];triangleGeometry=new THREE.TetrahedronGeometry(45,0);triangleMaterial=new THREE.MeshPhongMaterial({color:16777215});triangleSleeve=[];for(var i=0;i<triangleLength;i++){triangle[i]=new THREE.Mesh(triangleGeometry,triangleMaterial);triangle[i].position.y=100;triangleSleeve[i]=new THREE.Object3D;triangleSleeve[i].add(triangle[i]);triangleSleeve[i].rotation.z=i*(360/triangleLength)*Math.PI/180;circle.add(triangleSleeve[i])}scene.add(circle);composer=new THREE.EffectComposer(renderer);composer.addPass(new THREE.RenderPass(scene,camera));effectOne=new THREE.ShaderPass(THREE.DotScreenShader);effectOne.uniforms["scale"].value=5;composer.addPass(effectOne);effectTwo=new THREE.ShaderPass(THREE.RGBShiftShader);effectTwo.uniforms["amount"].value=.005;effectTwo.renderToScreen=true;composer.addPass(effectTwo);renderer.render(scene,camera);document.body.appendChild(renderer.domElement)}function render(){requestAnimationFrame(render);for(var i=0;i<triangleLength;i++){var value=audioFrequency[i]/256*2.5+.01;if(windowClicked){TweenLite.to(triangle[i].scale,.1,{x:value,y:value,z:value});if(i%2==0){TweenLite.to(triangle[i].rotation,.1,{z:"+= 0.1"})}else{TweenLite.to(triangle[i].rotation,.1,{z:"-= 0.1"})}}else{TweenLite.to(triangle[i].scale,.1,{z:value})}}circle.rotation.z+=.01;if(windowClicked){TweenLite.to(effectTwo.uniforms["amount"],1,{value:.005})}else{TweenLite.to(effectTwo.uniforms["amount"],1,{value:mouseX/window.innerWidth})}audioAnalyser.getByteFrequencyData(audioFrequency);renderer.render(scene,camera);composer.render()}window.addEventListener("click",function(){if(windowClicked){for(var i=0;i<triangleLength;i++){TweenLite.to(triangle[i].scale,1,{x:1,y:1,z:1});TweenLite.to(triangle[i].rotation,1,{x:0,y:0,z:0});TweenLite.to(triangle[i].position,1,{x:0,y:100,z:0})}effectOne.uniforms["scale"].value=5;triangleMaterial.wireframe=false;windowClicked=false}else{for(var i=0;i<triangleLength;i++){TweenLite.to(triangle[i].rotation,1,{x:int(0,Math.PI),y:int(0,Math.PI),z:int(0,Math.PI)});TweenLite.to(triangle[i].position,1,{x:"+= "+int(-1e3,1e3),y:"+= "+int(-1e3,1e3),z:"+= "+int(-500,-250)})}effectOne.uniforms["scale"].value=0;triangleMaterial.wireframe=true;windowClicked=true}});window.addEventListener("resize",function(){windowHeight=window.innerHeight;windowWidth=window.innerWidth;camera.aspect=windowWidth/windowHeight;camera.updateProjectionMatrix();renderer.setSize(windowWidth,windowHeight)});window.addEventListener("mousewheel",function(e){var volume=Math.round(audio.volume*100)/100;if(e.wheelDelta<0&&volume-.05>=0){volume=Math.abs(volume-.05)}else if(e.wheelDelta>0&&volume+.05<=1){volume=Math.abs(volume+.05)}audio.volume=volume});window.addEventListener("mousemove",function(e){mouseX=e.clientX-windowWidth/2;mouseY=e.clientY-windowHeight/2});initAudio();initScene();render()})();