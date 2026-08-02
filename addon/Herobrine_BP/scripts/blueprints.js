function add(list, phase, zone, x, y, z, typeId, sound = "dig.wood") {
  list.push({ phase, zone, offset: { x, y, z }, typeId, sound });
}

function cabin() {
  const blocks = [];
  // Support layer is only placed where the terrain is one block lower.
  // Existing natural ground is preserved by the builder.
  for (let x = -3; x <= 3; x++) for (let z = -3; z <= 3; z++)
    add(blocks, -1, "foundation", x, -1, z, "minecraft:cobbled_deepslate", "dig.stone");
  for (let x = -3; x <= 3; x++) for (let z = -3; z <= 3; z++)
    add(blocks, 0, "floor", x, 0, z, "minecraft:polished_deepslate", "dig.stone");

  for (const [x,z] of [[-3,-3],[3,-3],[-3,3],[3,3]])
    for (let y=1;y<=4;y++) add(blocks,1,`${x}:${z}`,x,y,z,"minecraft:stripped_spruce_log");

  for (let y=1;y<=3;y++) {
    for (let x=-2;x<=2;x++) {
      if (!(x===0 && y<=2)) add(blocks,2,"north",x,y,-3,(y===2 && Math.abs(x)===2)?"minecraft:gray_stained_glass":"minecraft:spruce_planks");
      add(blocks,2,"south",x,y,3,(y===2 && x===0)?"minecraft:gray_stained_glass":"minecraft:spruce_planks");
    }
    for (let z=-2;z<=2;z++) {
      add(blocks,2,"west",-3,y,z,(y===2 && z===0)?"minecraft:gray_stained_glass":"minecraft:spruce_planks");
      add(blocks,2,"east",3,y,z,(y===2 && z===0)?"minecraft:gray_stained_glass":"minecraft:spruce_planks");
    }
  }

  for (const layer of [{y:4,r:4},{y:5,r:3},{y:6,r:2},{y:7,r:1}]) {
    for (let x=-layer.r;x<=layer.r;x++) for (let z=-layer.r;z<=layer.r;z++)
      if (Math.abs(x)===layer.r || Math.abs(z)===layer.r || layer.r===1)
        add(blocks,3,"roof",x,layer.y,z,"minecraft:dark_oak_planks");
  }

  add(blocks,4,"inside",-2,1,1,"minecraft:crafting_table");
  add(blocks,4,"inside",-2,1,2,"minecraft:furnace","dig.stone");
  add(blocks,4,"inside",2,1,2,"minecraft:chest");
  add(blocks,4,"inside",2,1,1,"minecraft:barrel");
  add(blocks,4,"entrance",0,1,-4,"minecraft:redstone_torch");
  for (const [x,y,z] of [[0,1,2],[0,2,2],[0,3,2],[-1,2,2],[1,2,2]])
    add(blocks,4,"inside",x,y,z,"minecraft:nether_bricks","dig.stone");

  return {
    id:"cabin", name:"Mroczna chata", radius:5, height:8,
    blocks,
    stations:[
      {name:"wejscie",offset:{x:0.5,y:1,z:-4.5},item:"minecraft:iron_sword",animation:"animation.hiw.herobrine.stare",wait:80},
      {name:"stol",offset:{x:-1.4,y:1,z:1.3},item:"minecraft:wooden_axe",animation:"animation.hiw.herobrine.attack",wait:55},
      {name:"piec",offset:{x:-1.4,y:1,z:2.1},item:"minecraft:coal",animation:"animation.hiw.herobrine.attack",wait:65},
      {name:"skrzynia",offset:{x:1.4,y:1,z:2.1},animation:"animation.hiw.herobrine.attack",wait:70},
      {name:"ciemny_kat",offset:{x:0.5,y:1,z:0.5},animation:"animation.hiw.herobrine.stare",wait:100},
    ]
  };
}

function watchtower() {
  const blocks=[];
  for (let x=-2;x<=2;x++) for(let z=-2;z<=2;z++)
    add(blocks,-1,"foundation",x,-1,z,"minecraft:cobbled_deepslate","dig.stone");
  for (let x=-2;x<=2;x++) for(let z=-2;z<=2;z++)
    add(blocks,0,"floor",x,0,z,"minecraft:cobbled_deepslate","dig.stone");
  for (const [x,z] of [[-2,-2],[2,-2],[-2,2],[2,2]])
    for(let y=1;y<=7;y++) add(blocks,1,`${x}:${z}`,x,y,z,"minecraft:dark_oak_log");
  for(let y=1;y<=5;y++) {
    for(let x=-1;x<=1;x++) {
      if (!(x===0 && y<=2)) add(blocks,2,"north",x,y,-2,"minecraft:dark_oak_planks");
      add(blocks,2,"south",x,y,2,(y===3 && x===0)?"minecraft:gray_stained_glass":"minecraft:dark_oak_planks");
    }
    for(let z=-1;z<=1;z++) {
      add(blocks,2,"west",-2,y,z,(y===3&&z===0)?"minecraft:gray_stained_glass":"minecraft:dark_oak_planks");
      add(blocks,2,"east",2,y,z,(y===3&&z===0)?"minecraft:gray_stained_glass":"minecraft:dark_oak_planks");
    }
  }
  for(let x=-3;x<=3;x++) for(let z=-3;z<=3;z++)
    if(Math.abs(x)===3||Math.abs(z)===3) add(blocks,3,"roof",x,7,z,"minecraft:polished_blackstone_bricks","dig.stone");
  add(blocks,4,"inside",0,1,1,"minecraft:redstone_torch");
  add(blocks,4,"inside",1,1,1,"minecraft:barrel");
  add(blocks,4,"entrance",0,1,-3,"minecraft:soul_torch");
  return {
    id:"watchtower", name:"Wieza obserwacyjna", radius:4, height:8, blocks,
    stations:[
      {name:"wejscie",offset:{x:0.5,y:1,z:-3.5},item:"minecraft:spyglass",animation:"animation.hiw.herobrine.stare",wait:90},
      {name:"beczka",offset:{x:0.8,y:1,z:1.0},animation:"animation.hiw.herobrine.attack",wait:70},
      {name:"srodek",offset:{x:0.5,y:1,z:0.5},animation:"animation.hiw.herobrine.stare",wait:110},
    ]
  };
}

const BLUEPRINTS = { cabin: cabin(), watchtower: watchtower() };
export function getBlueprint(id) { return BLUEPRINTS[id] ?? BLUEPRINTS.cabin; }
export function blueprintNames() { return Object.values(BLUEPRINTS).map(v => ({id:v.id,name:v.name})); }
