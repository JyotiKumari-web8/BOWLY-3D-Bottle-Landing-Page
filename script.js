import * as THREE from "three";



const scene = new THREE.Scene();



const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

camera.position.set(0,0,7);



const renderer = new THREE.WebGLRenderer({
    antialias:true,
    alpha:true
});


renderer.setSize(
    window.innerWidth,
    window.innerHeight
);


renderer.setPixelRatio(
    window.devicePixelRatio
);


document
.getElementById("three-container")
.appendChild(renderer.domElement);




scene.add(
    new THREE.AmbientLight(
        0xffffff,
        2
    )
);



const light =
new THREE.DirectionalLight(
    0xffffff,
    5
);


light.position.set(
    4,
    5,
    6
);


scene.add(light);




const blueLight =
new THREE.PointLight(
    0x00aaff,
    3
);


blueLight.position.set(
    -3,
    2,
    4
);


scene.add(blueLight);



const bottleGroup =
new THREE.Group();


scene.add(
    bottleGroup
);



const canvas =
document.createElement("canvas");


canvas.width=1024;

canvas.height=1024;


const ctx =
canvas.getContext("2d");


// bottle color

ctx.fillStyle="#1597e5";

ctx.fillRect(
0,
0,
1024,
1024
);


ctx.fillStyle="#ffffff";

ctx.font=
"bold 170px Arial";

ctx.textAlign="center";


ctx.fillText(
"BOWLY",
512,
520
);



ctx.font=
"40px Arial";


ctx.fillText(
"PREMIUM CARE",
512,
600
);



const bottleTexture =
new THREE.CanvasTexture(
    canvas
);

const bottleMaterial =
new THREE.MeshPhysicalMaterial({

    map:bottleTexture,

    roughness:0.18,

    clearcoat:1,

    clearcoatRoughness:0.05

});



const body =
new THREE.Mesh(

    new THREE.CapsuleGeometry(
        1,
        2.8,
        32,
        64
    ),

    bottleMaterial

);


bottleGroup.add(body);


const neck =
new THREE.Mesh(

    new THREE.CylinderGeometry(
        0.35,
        0.5,
        0.8,
        48
    ),

    bottleMaterial

);


neck.position.y=2.2;


bottleGroup.add(neck);



const cap =
new THREE.Mesh(

    new THREE.CylinderGeometry(
        0.45,
        0.45,
        0.7,
        48
    ),

    new THREE.MeshPhysicalMaterial({

        color:0xd8dde5,

        roughness:0.25,

        metalness:0.3,

        clearcoat:1

    })

);


cap.position.y=2.95;


bottleGroup.add(cap);


let rotate=false;

let angle=0;



renderer.domElement.addEventListener(
"click",
()=>{

rotate=true;

angle=0;

});







// =====================
// ANIMATION
// =====================

let time=0;



function animate(){

requestAnimationFrame(
animate
);



// 360 ROTATION

if(rotate){

    bottleGroup.rotation.y +=0.03;

    angle+=0.03;


    if(angle>=Math.PI*2){

        rotate=false;

    }

}




// FLOATING

time+=0.03;


bottleGroup.position.y =
Math.sin(time)*0.08;



renderer.render(
scene,
camera
);


}


animate();






// =====================
// RESPONSIVE
// =====================

window.addEventListener(
"resize",
()=>{


camera.aspect =
window.innerWidth/
window.innerHeight;


camera.updateProjectionMatrix();


renderer.setSize(
window.innerWidth,
window.innerHeight
);


});