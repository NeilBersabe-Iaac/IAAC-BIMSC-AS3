// Import libraries
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.126.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.126.0/examples/jsm/controls/OrbitControls.js";
import rhino3dm from "https://cdn.jsdelivr.net/npm/rhino3dm@0.15.0-beta/rhino3dm.module.js";
import { RhinoCompute } from "https://cdn.jsdelivr.net/npm/compute-rhino3d@0.13.0-beta/compute.rhino3d.module.js";
import { Rhino3dmLoader } from "https://cdn.jsdelivr.net/npm/three@0.124.0/examples/jsm/loaders/3DMLoader.js";

const definitionName = "Solihiya.gh";

// Set up sliders
const zHeight_slider = document.getElementById('zHeight');
zHeight_slider.addEventListener('mouseup', onSliderChange, false);
zHeight_slider.addEventListener('touchend', onSliderChange, false);

const solAngle_slider = document.getElementById('solAngle');
solAngle_slider.addEventListener('mouseup', onSliderChange, false);
solAngle_slider.addEventListener('touchend', onSliderChange, false);

const toD_slider = document.getElementById('toD');
toD_slider.addEventListener('mouseup', onSliderChange, false);
toD_slider.addEventListener('touchend', onSliderChange, false);

const smlOpening_slider = document.getElementById('smlOpening');
smlOpening_slider.addEventListener('mouseup', onSliderChange, false);
smlOpening_slider.addEventListener('touchend', onSliderChange, false);

const lrgOpening_slider = document.getElementById('lrgOpening');
lrgOpening_slider.addEventListener('mouseup', onSliderChange, false);
lrgOpening_slider.addEventListener('touchend', onSliderChange, false);

const loader = new Rhino3dmLoader();
loader.setLibraryPath('https://cdn.jsdelivr.net/npm/rhino3dm@0.15.0-beta/');

//Set up Buttons
    const downloadButton = document.getElementById('downloadButton');
    downloadButton.onclick = download;


let rhino, definition, doc;
rhino3dm().then(async m => {
    console.log('Loaded rhino3dm :)');
    rhino = m; // global


    //RhinoCompute.url = getAuth( 'RHINO_COMPUTE_URL' ) // RhinoCompute server url. Use http://localhost:8081 if debugging locally.
    //RhinoCompute.apiKey = getAuth( 'RHINO_COMPUTE_KEY' )  // RhinoCompute server api key. Leave blank if debugging locally.
    
    RhinoCompute.url = 'http://localhost:8081/'; //if debugging locally.


    // load a grasshopper file!
    const url = definitionName;
    const res = await fetch(url);
    const buffer = await res.arrayBuffer();
    const arr = new Uint8Array(buffer);
    definition = arr;

    init();
    compute();
});

async function compute() {
    const param1 = new RhinoCompute.Grasshopper.DataTree("zHeight");
    param1.append([0], [zHeight_slider.valueAsNumber]);

    const param2 = new RhinoCompute.Grasshopper.DataTree("solAngle")   ;
    param2.append([0], [solAngle_slider.valueAsNumber]);
    
    const param3 = new RhinoCompute.Grasshopper.DataTree("toD");
    param3.append([0], [toD_slider.valueAsNumber]);

    const param4 = new RhinoCompute.Grasshopper.DataTree("smlOpening") ;
    param4.append([0], [smlOpening_slider.valueAsNumber]);

    const param5 = new RhinoCompute.Grasshopper.DataTree("lrgOpening") ;
    param5.append([0], [lrgOpening_slider.valueAsNumber]);


  
    // clear values
    
        const trees = [];
        trees.push(param1);
        trees.push(param2);
        trees.push(param3);
        trees.push(param4);
        trees.push(param5);
        
  
  
    const res = await RhinoCompute.Grasshopper.evaluateDefinition(definition, trees);
    // console.log(res);
     
    doc = new rhino.File3dm();

    // hide spinner
        document.getElementById("loader").style.display = 'none';

    //decode grasshopper objects and put them into a rhino document    
        for (let i = 0; i < res.values.length; i++) {
            for (const [key, value] of Object.entries(res.values[i].InnerTree)) {
                for (const d of value) {
                    const data = JSON.parse(d.data);
                    const rhinoObject = rhino.CommonObject.decode(data);
                    doc.objects().add(rhinoObject, null);

                }
            }
        }


    // go through the objects in the Rhino document
    let objects = doc.objects();
    for ( let i = 0; i < objects.count; i++ ) {
    
        const rhinoObject = objects.get( i );
    
    
            // asign geometry userstrings to object attributes
            if ( rhinoObject.geometry().userStringCount > 0 ) {
            const g_userStrings = rhinoObject.geometry().getUserStrings()
            rhinoObject.attributes().setUserString(g_userStrings[0][0], g_userStrings[0][1])
            
            ////////////////////////////////////////////////////////////
            const length = rhinoObject.geometry().getUserStrings()[1]
            console.log(length)
            ////////////////////////////////////////////////////////////
        }
    }

    // clear objects from scene
    scene.traverse(child => {
        if (!child.isLight) {
            scene.remove(child);
        }
    });


    const buffer = new Uint8Array(doc.toByteArray()).buffer;
    loader.parse(buffer, function (object) {
        // console.log(object);
        


  // go through all objects, check for userstrings and assing colors

object.traverse((child) => {
    if (child.isMesh) {
        const mat = new THREE.MeshStandardMaterial( {color: (0x202020),roughness: 0.01 ,transparent: true, opacity: 0.50 } )
        child.material = mat;
              if (child.userData.attributes.geometry.userStringCount > 0) {
                

                //get color from userStrings
                const colorData = child.userData.attributes.userStrings[0]
                const col = colorData[1];

                //convert color from userstring to THREE color and assign it
                const threeColor = new THREE.Color("rgb(" + col + ")");
                const mat = new THREE.LineBasicMaterial({ color: threeColor });
                child.material = mat;
              }
    }
  });

  object.traverse((child) => {
    if (child.isLine) {

      if (child.userData.attributes.geometry.userStringCount > 0) {
        
        //get color from userStrings
        const colorData = child.userData.attributes.userStrings[0]
        const col = colorData[1];

        //convert color from userstring to THREE color and assign it
        const threeColor = new THREE.Color("rgb(" + col + ")");
        const mat = new THREE.LineBasicMaterial({ color: threeColor });
        child.material = mat;
      }
    }
  });

  object.traverse((child) => {
    if (child.isBrep) {
        const mat = new THREE.MeshStandardMaterial( {color: (0x000000),roughness: 0.01 ,transparent: true, opacity: 1 } )
        child.material = mat;
              
    }
  });
////////////////////////////////////////////

        scene.add(object);


    })
}




function onSliderChange() {
    // show spinner
    document.getElementById('loader').style.display = 'block';
    compute();
}




        // camera.position.set(0, 150, 0);
        // camera.lookAt( scene.position)
        
        // //camera.position.z = -30;

        // container = document.getElementById('container');
        // var contWidth = container.offsetWidth;
        // var contHeight = container.offsetHeight

        // raycaster = new THREE.Raycaster()


        // animate();
        // }

        // let container_att; 


        // function onClick( event ) {

        // console.log( `click! (${event.clientX}, ${event.clientY})`)

        // // calculate mouse position in normalized device coordinates
        // // (-1 to +1) for both components

        // mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1
        // mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1
        
        // raycaster.setFromCamera( mouse, camera )

        // // calculate objects intersecting the picking ray
        // const intersects = raycaster.intersectObjects( scene.children, true )

        // let container_clck = document.getElementById( 'container_clck' )
        // if (container_clck) container_clck.remove()

        // // reset object colours
        // scene.traverse((child, i) => {
        //     if (child.userData.hasOwnProperty( 'material' )) {
        //         child.material = child.userData.material
        //         child.material = selectedMaterial_b
        //     }
        // })

        // if (intersects.length > 0) {

        //     // get closest object
        //     const object = intersects[0].object
        //     console.log(object) // debug



        //     // get user strings
        //     let data, count
        //     if (object.userData.attributes !== undefined) {
        //         data = object.userData.attributes.userStrings
        //     } else {
        //         // breps store user strings differently...
        //         data = object.parent.userData.attributes.userStrings
        //     }

        //     // do nothing if no user strings
        //     if ( data === undefined ) return

        //     console.log( data )
            
        //     // create container div with table inside
        //     container_clck = document.createElement( 'div' )
        //     container_clck.id = 'container_clck'
            
        //     const table = document.createElement( 'table' )
        //     container_clck.appendChild( table )
        
        //     for ( let i = 0; i < data.length; i ++ ) {

        //         const row = document.createElement( 'tr' )
        //         row.innerHTML = `<td>${data[ i ][ 0 ]}</td><td>${data[ i ][ 1 ]}</td>`
        //         table.appendChild( row )
        //     }

        //     container_att = document.getElementById('sidebar')
        //     container_att.appendChild( container_clck )
        // }


        // }

        // window.addEventListener('click', onClick, false)


// BOILERPLATE //
let scene, camera, renderer, controls;

function init() {

    THREE.Object3D.DefaultUp = new THREE.Vector3( 0, 0, 1 )
    // create a scene and a camera
    scene = new THREE.Scene();


    ///////////////////////////
    ////Scene Background
    let material, cubeMap
    cubeMap = new THREE.CubeTextureLoader()
    .setPath('./assets/')
    .load( [ 'px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png' ] )
    scene.background = cubeMap


    // scene.background = new THREE.Color(0x1f1f1f);


    ////////////////////////////
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);

    camera.position.x = -20;
    camera.position.y = -30;
    camera.position.z = 45;


    // create the renderer and add it to the html
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // add some controls to orbit the camera
    controls = new OrbitControls(camera, renderer.domElement);
    controls.autoRotate = true;
    

   ///////////////////
        //controls.update() must be called after any manual changes to the camera's transform
        // camera.position.set( 0, 20, 100 );
    //     controls.update();

    //     function animate() {

    //         requestAnimationFrame( animate );

    //         // required if controls.enableDamping or controls.autoRotate are set to true
    //         controls.update();

	// renderer.render( scene, camera );

   ///////////////////

    // add a directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff);
    directionalLight.intensity = 2;
    scene.add(directionalLight);

    const ambientLight = new THREE.AmbientLight();
    scene.add(ambientLight);

    animate();
}
///////////////

// object.traverse( (child) => {
//     if (child.parent.userData.objectType === 'Brep') {
//         child.parent.traverse( (c) => {
//             if (c.userData.hasOwnProperty( 'material' )) {
//                 c.material = selectedMaterial
//             }
//         })
//     } else {
//         if (child.userData.hasOwnProperty( 'material' )) {
//             child.material = selectedMaterial
//         }
    
    
//     }
// })
////////////////

// if (intersects.length > 0) {

//     // get closest object
//     const object = intersects[0].object
//     console.log(object) // debug

//     object.traverse( (child) => {
//         if (child.parent.userData.objectType === 'Brep') {
//             child.parent.traverse( (c) => {
//                 if (c.userData.hasOwnProperty( 'material' )) {
//                     c.material = selectedMaterial
//                 }
//             })
//         } else {
//             if (child.userData.hasOwnProperty( 'material' )) {
//                 child.material = selectedMaterial
//             }
        
        
//         }
//     })

//     // get user strings
//     let data, count
//     if (object.userData.attributes !== undefined) {
//         data = object.userData.attributes.userStrings
//     } else {
//         // breps store user strings differently...
//         data = object.parent.userData.attributes.userStrings
//     }

    
//     // create container div with table inside
//     container_clck = document.createElement( 'div' )
//     container_clck.id = 'container_clck'
    
//     const table = document.createElement( 'table' )
//     container_clck.appendChild( table )

//     for ( let i = 0; i < data.length; i ++ ) {

//         const row = document.createElement( 'tr' )
//         row.innerHTML = `<td>${data[ i ][ 0 ]}</td><td>${data[ i ][ 1 ]}</td>`
//         table.appendChild( row )
//     }

//     container_att = document.getElementById('sidebar')
//     container_att.appendChild( container_clck )
// }




///////////////

// function animate() {
//     requestAnimationFrame(animate);
//     renderer.render(scene, camera);
// }
function animate() {

    requestAnimationFrame( animate )

    // rotate torus a little bit each frame
    scene.rotation.z += 0.0002
    scene.rotation.y += 0.000
    scene.rotation.x += 0.000

    renderer.render( scene, camera )

}



function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    animate();
}

function meshToThreejs(mesh, material) {
  const loader = new THREE.BufferGeometryLoader();
  const geometry = loader.parse(mesh.toThreejsJSON());
  return new THREE.Mesh(geometry, material);
}

// download button handler
function download () {
    let buffer = doc.toByteArray();
    let blob = new Blob([ buffer ], { type: "application/octect-stream" });
    let link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'solihiya.3dm';
    link.click();
}
