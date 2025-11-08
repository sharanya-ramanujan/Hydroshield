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
import Style from 'ol/style/Style'
import Stroke from 'ol/style/Stroke'
import Fill from 'ol/style/Fill'

export default function FarmMap({ onGeometryDrawn, selectedGeometry, lands = [] }) {
  const mapEl = useRef(null)
  const mapRef = useRef(null)

  // Separate sources: one for saved features, one for draft drawing
  const savedSourceRef = useRef(new VectorSource({ wrapX: false }))
  const draftSourceRef = useRef(new VectorSource({ wrapX: false }))
  const drawRef = useRef(null)

  const formatRef = useRef(new GeoJSON())

  const savedStyle = new Style({
    stroke: new Stroke({ color: '#22c55e', width: 2 }),
    fill: new Fill({ color: 'rgba(34,197,94,0.20)' })
  })
  const draftStyle = new Style({
    stroke: new Stroke({ color: '#38bdf8', width: 2, lineDash: [6, 6] }),
    fill: new Fill({ color: 'rgba(56,189,248,0.15)' })
  })

  // Initialize map and layers
  useEffect(() => {
    if (!mapEl.current) return

    const savedLayer = new VectorLayer({
      source: savedSourceRef.current,
      style: savedStyle
    })
    const draftLayer = new VectorLayer({
      source: draftSourceRef.current,
      style: draftStyle
    })

    const map = new Map({
      target: mapEl.current,
      layers: [
        new TileLayer({ source: new OSM() }),
        savedLayer,       // show saved lands
        draftLayer        // show current drawing
      ],
      view: new View({
        center: [0, 0],
        zoom: 2
      })
    })
    mapRef.current = map

    // Allow modifying draft geometry
    const modify = new Modify({ source: draftSourceRef.current })
    map.addInteraction(modify)

    // Snap to vertices while drawing/modifying
    const snap = new Snap({ source: draftSourceRef.current })
    map.addInteraction(snap)

    return () => {
      map.setTarget(null)
    }
  }, []) // run once

  // Enable polygon drawing into the draft layer
  useEffect(() => {
    if (!mapRef.current) return

    // Remove existing draw interaction
    if (drawRef.current) {
      mapRef.current.removeInteraction(drawRef.current)
      drawRef.current = null
    }

    const draw = new Draw({
      source: draftSourceRef.current,
      type: 'Polygon'
    })

    draw.on('drawstart', () => {
      // single-draft workflow: clear previous draft polygon
      draftSourceRef.current.clear()
    })

    draw.on('drawend', (e) => {
      // Convert drawn feature to GeoJSON (EPSG:4326 lon/lat)
      const geojson = formatRef.current.writeFeatureObject(e.feature, {
        featureProjection: 'EPSG:3857',
        dataProjection: 'EPSG:4326'
      })
      onGeometryDrawn && onGeometryDrawn(geojson)
      // Keep draft visible until Save or Clear
    })

    mapRef.current.addInteraction(draw)
    drawRef.current = draw
  }, [onGeometryDrawn])

  // Reflect external selectedGeometry: clear draft when it’s reset after save
  useEffect(() => {
    if (!mapRef.current) return
    if (!selectedGeometry) {
      // After Save Land (or Clear), remove draft from map
      draftSourceRef.current.clear()
    } else {
      // If an external geometry is supplied, show it in the draft layer
      draftSourceRef.current.clear()
      try {
        const feat = formatRef.current.readFeature(selectedGeometry, {
          dataProjection: 'EPSG:4326',
          featureProjection: 'EPSG:3857'
        })
        draftSourceRef.current.addFeature(feat)
      } catch {
        // ignore bad geometry
      }
    }
  }, [selectedGeometry])

  // Render saved lands on the saved layer whenever lands change
  useEffect(() => {
    if (!mapRef.current) return
    const source = savedSourceRef.current
    source.clear()

    const feats = []
    for (const land of lands) {
      if (!land?.geometry) continue
      try {
        const f = formatRef.current.readFeature(land.geometry, {
          dataProjection: 'EPSG:4326',
          featureProjection: 'EPSG:3857'
        })
        // Optionally attach ID/name as properties
        f.set('name', land.name || '')
        f.setId(land.id)
        feats.push(f)
      } catch {
        // skip invalid geometry
      }
    }
    if (feats.length) {
      source.addFeatures(feats)
    }
  }, [lands])

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
            draftSourceRef.current.clear()
            onGeometryDrawn && onGeometryDrawn(null)
          }}
        >
          Clear draft
        </button>
      </div>
    </div>
  )
}
