import React, { useEffect, useRef, useState } from 'react'
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
import Feature from 'ol/Feature'
import CircleGeom from 'ol/geom/Circle'
import TileArcGISRest from 'ol/source/TileArcGISRest'

// helper: build a canvas clip path from a Polygon or MultiPolygon in EPSG:3857
function clipGeomOnCanvas(ctx, map, geom, pixelRatio = 1) {
  // Normalize: array of polygons; each polygon = array of rings; each ring = array of [x,y]
  const type = geom.getType()
  let polys = []
  if (type === 'Polygon') {
    polys = [geom.getCoordinates()]
  } else if (type === 'MultiPolygon') {
    polys = geom.getCoordinates()
  } else {
    return false
  }

  let drewAny = false
  ctx.beginPath()
  for (const rings of polys) {
    for (const ring of rings) {
      for (let i = 0; i < ring.length; i++) {
        const c = ring[i]
        const px = map.getPixelFromCoordinate(c)
        if (!px) continue
        const x = px[0] * pixelRatio
        const y = px[1] * pixelRatio
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      drewAny = true
    }
  }
  if (!drewAny) return false
  // even-odd so holes render correctly
  ctx.clip('evenodd')
  return true
}

export default function FarmMap(props) {
  const {
    onGeometryDrawn,
    selectedGeometry,
    lands = [],
    focusLandId,
    scenarioActive = false,
    scenarioCenter3857 = null,
    fireRadiusKm = 0,
    scenarioPickMode = false,
    onScenarioPick,
    addressCenter3857
  } = props

  const mapEl = useRef(null)
  const mapRef = useRef(null)
  const savedSourceRef = useRef(new VectorSource({ wrapX: false }))
  const draftSourceRef = useRef(new VectorSource({ wrapX: false }))
  const scenarioSourceRef = useRef(new VectorSource({ wrapX: false }))
  const drawRef = useRef(null)
  const formatRef = useRef(new GeoJSON())

  const whpLayerRef = useRef(null)
  const clipHandlersRef = useRef({ pre: null, post: null })

  // Styles (stroke-only and stroke+fill variants)
  const savedStrokeOnlyStyle = new Style({
    stroke: new Stroke({ color: '#22c55e', width: 2 })
  })
  const savedStrokeFillStyle = new Style({
    stroke: new Stroke({ color: '#22c55e', width: 2 }),
    fill: new Fill({ color: 'rgba(34,197,94,0.20)' })
  })
  const draftStyle = new Style({
    stroke: new Stroke({ color: '#38bdf8', width: 2, lineDash: [6,6] }),
    fill: new Fill({ color: 'rgba(56,189,248,0.15)' })
  })
  const scenarioStyle = new Style({
    stroke: new Stroke({ color: '#ef4444', width: 2 }),
    fill: new Fill({ color: 'rgba(239,68,68,0.20)' })
  })

  const [savedLayerRef, setSavedLayerRef] = useState(null)

  // Init map once
  useEffect(() => {
    if (!mapEl.current) return
    const savedLayer = new VectorLayer({ source: savedSourceRef.current, style: savedStrokeFillStyle })
    const draftLayer = new VectorLayer({ source: draftSourceRef.current, style: draftStyle })
    const scenarioLayer = new VectorLayer({ source: scenarioSourceRef.current, style: scenarioStyle })

    const map = new Map({
      target: mapEl.current,
      layers: [
        new TileLayer({ source: new OSM() }),
        // Hazard layer inserted at index 1 later
        savedLayer,
        draftLayer,
        scenarioLayer
      ],
      view: new View({ center: [0,0], zoom: 2 })
    })
    mapRef.current = map
    setSavedLayerRef(savedLayer)

    // Wildfire Hazard Potential (USFS 2020)
    const whpLayer = new TileLayer({
      source: new TileArcGISRest({
        url: 'https://apps.fs.usda.gov/arcgis/rest/services/EDW/EDW_Wildfire_Hazard_Potential_2020/ImageServer',
        crossOrigin: 'anonymous'
      }),
      opacity: 0.75,
      visible: false
    })
    // Insert right after base map so vector strokes draw above it
    map.getLayers().insertAt(1, whpLayer)
    whpLayerRef.current = whpLayer

    map.addInteraction(new Modify({ source: draftSourceRef.current }))
    map.addInteraction(new Snap({ source: draftSourceRef.current }))
    return () => map.setTarget(null)
  }, [])

  // Scenario pick listener
  const pickHandlerRef = useRef(null)
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (pickHandlerRef.current) {
      map.un('click', pickHandlerRef.current)
      pickHandlerRef.current = null
    }
    if (scenarioPickMode) {
      const handler = (evt) => onScenarioPick && onScenarioPick(evt.coordinate)
      map.on('click', handler)
      pickHandlerRef.current = handler
      map.getTargetElement().style.cursor = 'crosshair'
    } else {
      map.getTargetElement().style.cursor = ''
    }
  }, [scenarioPickMode, onScenarioPick])

  // Drawing interaction
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (drawRef.current) {
      map.removeInteraction(drawRef.current)
      drawRef.current = null
    }
    if (scenarioPickMode) return
    const draw = new Draw({ source: draftSourceRef.current, type: 'Polygon' })
    draw.on('drawstart', () => draftSourceRef.current.clear())
    draw.on('drawend', (e) => {
      const geojson = formatRef.current.writeFeatureObject(e.feature, {
        featureProjection: 'EPSG:3857',
        dataProjection: 'EPSG:4326'
      })
      onGeometryDrawn && onGeometryDrawn(geojson)
    })
    map.addInteraction(draw)
    drawRef.current = draw
  }, [onGeometryDrawn, scenarioPickMode])

  // Draft polygon
  useEffect(() => {
    draftSourceRef.current.clear()
    if (!selectedGeometry) return
    try {
      const feat = formatRef.current.readFeature(selectedGeometry, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857'
      })
      draftSourceRef.current.addFeature(feat)
    } catch {}
  }, [selectedGeometry])

  // Saved polygons
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

  // Focus fit
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

  // Fire circle (optional)
  useEffect(() => {
    const src = scenarioSourceRef.current
    src.clear()
    if (!scenarioActive || !scenarioCenter3857 || !fireRadiusKm) return
    try {
      const circle = new CircleGeom(scenarioCenter3857, fireRadiusKm * 1000)
      src.addFeature(new Feature({ geometry: circle }))
    } catch {}
  }, [scenarioActive, scenarioCenter3857, fireRadiusKm])

  // Hazard overlay + clipping
  useEffect(() => {
    const map = mapRef.current
    const whp = whpLayerRef.current
    if (!map || !whp) return

    // Remove old clip handlers
    if (clipHandlersRef.current.pre) whp.un('prerender', clipHandlersRef.current.pre)
    if (clipHandlersRef.current.post) whp.un('postrender', clipHandlersRef.current.post)
    clipHandlersRef.current = { pre: null, post: null }

    // Choose geometry: focused -> single -> draft
    let feature = null
    const focused = lands.find(l => l.id === focusLandId)
    const single = !focused && lands.length === 1 ? lands[0] : null
    try {
      if (focused?.geometry) {
        feature = formatRef.current.readFeature(focused.geometry, { dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' })
      } else if (single?.geometry) {
        feature = formatRef.current.readFeature(single.geometry, { dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' })
      } else if (selectedGeometry) {
        feature = formatRef.current.readFeature(selectedGeometry, { dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' })
      }
    } catch {}

    const geom = feature?.getGeometry()
    if (!geom) {
      whp.setVisible(false)
      whp.setExtent(undefined)
      // restore fill when hazard not shown
      if (savedLayerRef) savedLayerRef.setStyle(savedStrokeFillStyle)
      return
    }

    whp.setExtent(geom.getExtent())
    whp.setVisible(true)

    // Show only stroke on saved polygons so hazard colors inside are visible
    if (savedLayerRef) savedLayerRef.setStyle(savedStrokeOnlyStyle)

    const pre = (evt) => {
      const ctx = evt.context
      if (!ctx) return
      ctx.save()
      const ratio = evt.frameState.pixelRatio || 1
      const ok = clipGeomOnCanvas(ctx, map, geom, ratio)
      if (!ok) ctx.restore()
    }
    const post = (evt) => { if (evt.context) evt.context.restore() }

    whp.on('prerender', pre)
    whp.on('postrender', post)
    clipHandlersRef.current = { pre, post }

    return () => {
      if (clipHandlersRef.current.pre) whp.un('prerender', clipHandlersRef.current.pre)
      if (clipHandlersRef.current.post) whp.un('postrender', clipHandlersRef.current.post)
      clipHandlersRef.current = { pre: null, post: null }
      // restore style on cleanup
      if (savedLayerRef) savedLayerRef.setStyle(savedStrokeFillStyle)
    }
  }, [focusLandId, lands, selectedGeometry, savedLayerRef])

  // Recenter when an address is located (soft zoom)
  useEffect(() => {
    if (!addressCenter3857 || !mapRef.current) return
    try {
      mapRef.current.getView().animate({
        center: addressCenter3857,
        zoom: Math.max(12, mapRef.current.getView().getZoom() || 2),
        duration: 600
      })
    } catch {}
  }, [addressCenter3857])

  return (
    <div style={{ position:'relative', flex:1 }}>
      <div ref={mapEl} className="farm-map" style={{ width:'100%', height:'100%', minHeight:420 }} />
    </div>
  )
}
