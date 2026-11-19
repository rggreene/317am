// Named search areas for the current open-plan apartment.
// These are semantic zones, not enclosed rooms: the bedroom divider is open.
export const SEARCH_AREAS=Object.freeze([
  {id:'entry',name:'Entry',point:{x:2.72,z:2.08}},
  {id:'living',name:'Living room',point:{x:0,z:1.95}},
  {id:'hall',name:'Hall passage',point:{x:-.56,z:.45}},
  {id:'bedroom',name:'Bedroom',point:{x:-1.05,z:1.88}},
  {id:'kitchen',name:'Kitchen passage',point:{x:.26,z:-.62}}
]);
export function areaForPosition(position){
  if(position.x>1.9&&position.z>1.65)return 'entry';
  if(position.x>0&&position.z<0)return 'kitchen';
  if(position.x<-.9)return 'bedroom';
  if(position.x<0)return 'hall';
  return 'living';
}
export function searchAreaPoint(index){
  const area=SEARCH_AREAS[((index%SEARCH_AREAS.length)+SEARCH_AREAS.length)%SEARCH_AREAS.length];
  return {...area.point};
}
