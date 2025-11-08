import React, { useEffect, useRef } from 'react'

const FarmMap = ({ onGeometryDrawn }) => {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)

  useEffect(() => {
    // wait for script to be loaded
    if (!window.farmOS || !window.farmOS.map) {
      console.warn('farmOS-map is not available on window. Check index.html script tags.')
      return
    }

    // create the map
    const fm = new window.farmOS.map.Map({
      target: mapRef.current,
      // you can set center/zoom here
      view: {
        center: [0, 0],
        zoom: 2,
      },
    })

    // add drawing behavior
    fm.addBehavior('draw')

    // listen for geometry features (depends on version; adjust if needed)
    fm.on('feature:drawend', (e) => {
      // export to GeoJSON
      const geojson = fm.getGeoJSON()
      if (onGeometryDrawn) {
        onGeometryDrawn(geojson)
      }
    })

    mapInstanceRef.current = fm

    return () => {
      // cleanup
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy()
      }
    }
  }, [onGeometryDrawn])

  return (
    <div className="farm-map-container">
      <div ref={mapRef} className="farm-map" />
    </div>
  )
}

export default FarmMap
