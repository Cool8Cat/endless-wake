export type RoofStyle = "gable" | "hip" | "clerestory";
export type BuildingModule = { kind: "house" | "warehouse"; x: number; z: number; width: number; depth: number; floors: number; roof: RoofStyle; palette: number };
export type HarborPlan = { variant: number; buildings: BuildingModule[]; stalls: number; tower: "lantern" | "watch"; roofPalette: number };
export const HARBOR_VARIANTS = 12;

// All variants share the foundation and eastward docking corridor.
export function harborPlan(variant: number): HarborPlan {
  if(!Number.isInteger(variant)||variant<0||variant>=HARBOR_VARIANTS)throw new RangeError("Invalid harbor assembly");
  const roof = (["gable","hip","clerestory"] as const)[variant%3];
  return { variant, roofPalette:variant%4, stalls:2+(variant%2), tower:variant%4===3?"watch":"lantern",
    buildings:[
      {kind:"house",x:-.27,z:.08,width:2.18,depth:1.68,floors:1+Math.floor(variant/3)%2,roof,palette:variant%4},
      {kind:"warehouse",x:-2.50,z:-.76,width:1.55,depth:1.46,floors:1,roof:variant%2?"hip":"gable",palette:(variant+1)%4},
    ] };
}
