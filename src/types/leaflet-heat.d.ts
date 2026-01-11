// Type definitions for leaflet.heat
import * as L from 'leaflet';

declare module 'leaflet' {
  function heatLayer(
    latlngs: Array<[number, number, number?]> | Array<L.LatLngExpression>,
    options?: HeatLayerOptions
  ): HeatLayer;

  interface HeatLayerOptions extends LayerOptions {
    minOpacity?: number;
    maxZoom?: number;
    max?: number;
    radius?: number;
    blur?: number;
    gradient?: { [key: number]: string };
  }

  interface HeatLayer extends Layer {
    setOptions(options: HeatLayerOptions): this;
    addLatLng(latlng: L.LatLngExpression | [number, number, number]): this;
    setLatLngs(latlngs: Array<[number, number, number?]> | Array<L.LatLngExpression>): this;
    redraw(): this;
  }
}
