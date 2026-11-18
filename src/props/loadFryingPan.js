import panUrl from '../../assets/models/frying_pan.glb?url';
import { loadGLB } from '../assets/loadGLB.js';

// A real, versioned .glb file — no canvas or procedural mesh at runtime.
export function loadFryingPan(){return loadGLB(panUrl);}
