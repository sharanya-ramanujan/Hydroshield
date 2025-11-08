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

export default function FarmMap({ onGeometryDrawn, selectedGeometry, lands = [], focusLandId }) {
  const mapEl = useRef(null)
  const mapRef = useRef(null)
  const savedSourceRef = useRef(new VectorSource({ wrapX: false }))
  const draftSourceRef = useRef(new VectorSource({ wrapX: false }))
  const drawRef = useRef(null)
  const formatRef = useRef(new GeoJSON())

  const savedStyle = new Style({
    stroke: new Stroke({ color: '#22c55e', width: 2 }),
    fill: new Fill({ color: 'rgba(34,197,94,0.20)' })
  })
  const draftStyle = new Style({
    stroke: new Stroke({ color: '#38bdf8', width: 2, lineDash: [6,6] }),
    fill: new Fill({ color: 'rgba(56,189,248,0.15)' })
  })

  useEffect(() => {
    if (!mapEl.current) return
    const savedLayer = new VectorLayer({ source: savedSourceRef.current, style: savedStyle })
    const draftLayer = new VectorLayer({ source: draftSourceRef.current, style: draftStyle })
    const map = new Map({
      target: mapEl.current,
      layers: [new TileLayer({ source: new OSM() }), savedLayer, draftLayer],
      view: new View({ center: [0,0], zoom: 2 })
    })
    mapRef.current = map
    map.addInteraction(new Modify({ source: draftSourceRef.current }))
    map.addInteraction(new Snap({ source: draftSourceRef.current }))
    return () => map.setTarget(null)
  }, [])

  useEffect(() => {
    if (!mapRef.current) return
    if (drawRef.current) {
      mapRef.current.removeInteraction(drawRef.current)
      drawRef.current = null
    }
    const draw = new Draw({ source: draftSourceRef.current, type: 'Polygon' })
    draw.on('drawstart', () => draftSourceRef.current.clear())
    draw.on('drawend', (e) => {
      const geojson = formatRef.current.writeFeatureObject(e.feature, {
        featureProjection: 'EPSG:3857',
        dataProjection: 'EPSG:4326'
      })
      onGeometryDrawn && onGeometryDrawn(geojson)
    })
    mapRef.current.addInteraction(draw)
    drawRef.current = draw
  }, [onGeometryDrawn])

  useEffect(() => {
    draftSourceRef.current.clear()
    if (selectedGeometry) {
      try {
        const feat = formatRef.current.readFeature(selectedGeometry, {
          dataProjection: 'EPSG:4326',
          featureProjection: 'EPSG:3857'
        })
        draftSourceRef.current.addFeature(feat)
      } catch {}
    }
  }, [selectedGeometry])

  useEffect(() => {
    const src = savedSourceRef.current
    src.clear()
    const feats = []
    for (const land of lands) {
      if (!land?.geometry) continue
      try {
        const f = formatRef.current.readFeature(land.geometry, {
          dataProjection: 'EPSG:4326',
          featureProjection: 'EPSG:3857'
        })
        f.setId(land.id)
        feats.push(f)
      } catch {}
    }
    if (feats.length) src.addFeatures(feats)
  }, [lands])

  useEffect(() => {
    if (!mapRef.current || !focusLandId) return
    const land = lands.find(l => l.id === focusLandId)
    if (!land?.geometry) return
    try {
      const feat = formatRef.current.readFeature(land.geometry, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857'
      })
      mapRef.current.getView().fit(feat.getGeometry().getExtent(), {
        padding: [40,40,40,40],
        maxZoom: 18,
        duration: 400
      })
    } catch {}
  }, [focusLandId, lands])

  return (
    <div style={{ position:'relative', flex:1 }}>
      <div
        ref={mapEl}
        className="farm-map"
        style={{ width:'100%', height:'100%', minHeight:420 }}
      />
      <div style={{ position:'absolute', top:8, left:8, zIndex:10 }}>
        <button
          type="button"
          className="primary-btn"
          style={{ fontSize:12 }}
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
