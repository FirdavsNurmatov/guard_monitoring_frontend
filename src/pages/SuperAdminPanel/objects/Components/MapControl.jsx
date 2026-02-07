import { useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";

const MapControls = ({ onUndo, onRedo, onClear, canUndo, canRedo }) => {
  const map = useMap();

  useEffect(() => {
    const Control = L.Control.extend({
      onAdd() {
        const div = L.DomUtil.create(
          "div",
          "leaflet-bar leaflet-control bg-white rounded shadow p-1 flex gap-1",
        );

        div.innerHTML = `
          <button class="ctrl-btn undo" title="Undo">↶</button>
          <button class="ctrl-btn redo" title="Redo">↷</button>
          <button class="ctrl-btn clear" title="Remove center">✕</button>
        `;

        L.DomEvent.disableClickPropagation(div);

        div.querySelector(".undo").onclick = onUndo;
        div.querySelector(".redo").onclick = onRedo;
        div.querySelector(".clear").onclick = onClear;

        if (!canUndo) div.querySelector(".undo").style.opacity = 0.4;
        if (!canRedo) div.querySelector(".redo").style.opacity = 0.4;

        return div;
      },
    });

    const control = new Control({ position: "topright" });
    map.addControl(control);

    return () => map.removeControl(control);
  }, [map, onUndo, onRedo, onClear, canUndo, canRedo]);

  return null;
};

export default MapControls;
