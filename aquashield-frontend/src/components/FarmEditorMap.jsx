import React, { useEffect, useRef } from 'react'
import 'ol/ol.css'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import VectorSource from 'ol/source/Vector'
import VectorLayer from 'ol/layer/Vector'
import GeoJSON from 'ol/format/GeoJSON'
import Style from 'ol/style/Style'
import Stroke from 'ol/style/Stroke'
import Fill from 'ol/style/Fill'
import CircleStyle from 'ol/style/Circle'
import { toLonLat } from 'ol/proj'

export default function FarmEditorMap({ polygonGeoJSON, features = [], onAddFeature }) {
  const mapEl = useRef(null)
  const mapRef = useRef(null)
  const farmSourceRef = useRef(new VectorSource())
  const featureSourceRef = useRef(new VectorSource())
  const formatRef = useRef(new GeoJSON())

  const farmStyle = new Style({
    stroke: new Stroke({ color: '#38bdf8', width: 2 }),
    fill: new Fill({ color: 'rgba(56,189,248,0.25)' })
  })
  const pointStyle = new Style({
    image: new CircleStyle({
      radius: 6,
      fill: new Fill({ color: '#22c55e' }),
      stroke: new Stroke({ color: '#14532d', width: 2 })
    })
  })

  // Init map once
  useEffect(() => {
    if (!mapEl.current || mapRef.current) return
    const farmLayer = new VectorLayer({ source: farmSourceRef.current, style: farmStyle })
    const featureLayer = new VectorLayer({ source: featureSourceRef.current, style: pointStyle })

    const map = new Map({
      target: mapEl.current,
      layers: [
        new TileLayer({ source: new OSM() }),
        farmLayer,
        featureLayer
      ],
      view: new View({ center: [0, 0], zoom: 2 })
    })
    mapRef.current = map

    // Add point if click hits polygon
    map.on('click', (evt) => {
      const hitFarm = map.hasFeatureAtPixel(evt.pixel, {
        layerFilter: (layer) => layer.getSource() === farmSourceRef.current
      })
      if (!hitFarm) return
      const coord3857 = evt.coordinate
      const [lon, lat] = toLonLat(coord3857)
      const id = Date.now()
      onAddFeature && onAddFeature({ id, type: 'Point', lonLat: [lon, lat], coordinate3857: coord3857 })
      try {
        const feat = formatRef.current.readFeature(
          { type: 'Feature', geometry: { type: 'Point', coordinates: [lon, lat] }, properties: { id } },
          { dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' }
        )
        featureSourceRef.current.addFeature(feat)
      } catch {}
    })
  }, [onAddFeature])

  // Load polygon and fit
  useEffect(() => {
    if (!mapRef.current) return
    farmSourceRef.current.clear()
    if (!polygonGeoJSON) return
    try {
      const feat = formatRef.current.readFeature(polygonGeoJSON, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857'
      })
      farmSourceRef.current.addFeature(feat)
      const extent = feat.getGeometry().getExtent()
      mapRef.current.getView().fit(extent, {
        padding: [40, 40, 40, 40],
        maxZoom: 19,
        duration: 300
      })
    } catch (e) {
      console.error('Polygon load failed', e)
    }
  }, [polygonGeoJSON])

  // Render existing features (no refit)
  useEffect(() => {
    featureSourceRef.current.clear()
    features.forEach(f => {
      if (!f.lonLat) return
      try {
        const feat = formatRef.current.readFeature(
          { type: 'Feature', geometry: { type: 'Point', coordinates: f.lonLat }, properties: { id: f.id } },
          { dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' }
        )
        featureSourceRef.current.addFeature(feat)
      } catch {}
    })
  }, [features])

  return (
    <div style={{ position: 'relative', flex: 1 }}>
      <div
        ref={mapEl}
        className="farm-map"
        style={{ width: '100%', height: '100%', minHeight: 420 }}
      />
      <div style={{ position:'absolute', top:8, left:8, zIndex:10 }}>
        <button
          className="primary-btn"
          style={{ fontSize:12 }}
          onClick={() => {
            const feat = farmSourceRef.current.getFeatures()[0]
            if (!feat || !mapRef.current) return
            mapRef.current.getView().fit(feat.getGeometry().getExtent(), {
              padding:[40,40,40,40],
              maxZoom:19,
              duration:250
            })
          }}
        >
          Fit to farm
        </button>
      </div>
    </div>
  )
}