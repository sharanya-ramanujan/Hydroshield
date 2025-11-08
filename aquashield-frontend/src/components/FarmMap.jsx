import React, { useEffect, useRef } from 'react'
import 'ol/ol.css'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import VectorSource from 'ol/source/Vector'
import VectorLayer from 'ol/layer/Vector'
import { Draw, Modify, Snap } from 'ol/interaction'
import GeoJSON from 'ol/format/GeoJSON'

export default function FarmMap({ onGeometryDrawn, selectedGeometry }) {
  const mapEl = useRef(null)
  const mapRef = useRef(null)
  const vectorSourceRef = useRef(new VectorSource())
  const drawRef = useRef(null)

  // Initialize map
  useEffect(() => {
    if (!mapEl.current) return
    const vectorLayer = new VectorLayer({
      source: vectorSourceRef.current
    })

    const map = new Map({
      target: mapEl.current,
      layers: [
        new TileLayer({ source: new OSM() }),
        vectorLayer
      ],
      view: new View({
        center: [0, 0],
        zoom: 2
      })
    })
    mapRef.current = map

    const modify = new Modify({ source: vectorSourceRef.current })
    map.addInteraction(modify)
    const snap = new Snap({ source: vectorSourceRef.current })
    map.addInteraction(snap)

    return () => {
      map.setTarget(null)
    }
  }, [])

  // Drawing setup
  useEffect(() => {
    if (!mapRef.current) return
    // Remove existing draw interaction if any
    if (drawRef.current) {
      mapRef.current.removeInteraction(drawRef.current)
      drawRef.current = null
    }
    const draw = new Draw({
      source: vectorSourceRef.current,
      type: 'Polygon'
    })
    draw.on('drawend', (e) => {
      // Clear previous features (single polygon workflow)
      vectorSourceRef.current.clear()
      vectorSourceRef.current.addFeature(e.feature)
      const geojson = new GeoJSON().writeFeatureObject(e.feature, {
        featureProjection: 'EPSG:3857',
        dataProjection: 'EPSG:4326'
      })
      onGeometryDrawn && onGeometryDrawn(geojson)
    })
    mapRef.current.addInteraction(draw)
    drawRef.current = draw
  }, [onGeometryDrawn])

  // Reflect external selectedGeometry (e.g., when resetting)
  useEffect(() => {
    if (!mapRef.current) return
    if (!selectedGeometry) {
      vectorSourceRef.current.clear()
    }
  }, [selectedGeometry])

  return (
    <div style={{ position: 'relative', flex: 1 }}>
      <div
        ref={mapEl}
        className="farm-map"
        style={{ width: '100%', height: '100%', minHeight: 420 }}
      />
      <div style={{
        position: 'absolute',
        top: 8,
        left: 8,
        display: 'flex',
        gap: '0.5rem'
      }}>
        <button
          className="primary-btn"
          style={{ fontSize: 12 }}
          onClick={() => {
            vectorSourceRef.current.clear()
            onGeometryDrawn && onGeometryDrawn(null)
          }}
        >
          Clear
        </button>
      </div>
    </div>
  )
}
