"use client";

import { useState, useCallback, useEffect } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  DrawingManager,
  Polygon,
} from "@react-google-maps/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MapPin, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const containerStyle = {
  width: "100%",
  height: "600px",
};

interface FarmLocationMapProps {
  onLocationSelect: (
    center: { lat: number; lng: number },
    polygon: google.maps.LatLngLiteral[]
  ) => void;
  onDialogClose?: () => void;
  initialCenter?: { lat: number; lng: number };
  initialPolygon?: google.maps.LatLngLiteral[];
}

export default function FarmLocationMap({
  onLocationSelect,
  onDialogClose,
  initialCenter,
  initialPolygon,
}: FarmLocationMapProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [drawingManager, setDrawingManager] =
    useState<google.maps.drawing.DrawingManager | null>(null);
  const [polygon, setPolygon] = useState<google.maps.Polygon | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [currentCoordinates, setCurrentCoordinates] = useState<
    google.maps.LatLngLiteral[]
  >([]);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ["drawing"],
  });

  useEffect(() => {
    setIsSelected(!!initialPolygon && initialPolygon.length > 0);
  }, [initialPolygon]);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const onDrawingManagerLoad = useCallback(
    (drawingManager: google.maps.drawing.DrawingManager) => {
      setDrawingManager(drawingManager);
    },
    []
  );

  const onPolygonComplete = useCallback(
    (polygon: google.maps.Polygon) => {
      if (polygon) {
        setPolygon(polygon);
        setIsSelected(true);
        const path = polygon.getPath();
        const coordinates = path.getArray().map((latLng) => ({
          lat: latLng.lat(),
          lng: latLng.lng(),
        }));

        // Set polygon style
        polygon.setOptions({
          fillColor: "#3B82F6",
          fillOpacity: 0.35,
          strokeColor: "#2563EB",
          strokeWeight: 2,
          strokeOpacity: 1,
        });

        // Calculate center of the polygon
        const bounds = new google.maps.LatLngBounds();
        coordinates.forEach((coord) => bounds.extend(coord));
        const center = bounds.getCenter();

        onLocationSelect({ lat: center.lat(), lng: center.lng() }, coordinates);
      }
    },
    [onLocationSelect]
  );

  const clearPolygon = useCallback(() => {
    if (polygon) {
      polygon.setMap(null);
      setPolygon(null);
      setIsSelected(false);
      setCurrentCoordinates([]);
    }
  }, [polygon]);

  const handleDialogClose = useCallback(() => {
    setIsOpen(false);
    if (!isSelected) {
      clearPolygon();
      onDialogClose?.();
    }
  }, [isSelected, clearPolygon, onDialogClose]);

  useEffect(() => {
    if (map && drawingManager) {
      google.maps.event.addListener(
        drawingManager,
        "polygoncomplete",
        onPolygonComplete
      );
    }
  }, [map, drawingManager, onPolygonComplete]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            isSelected &&
              "border-green-500 text-green-500 hover:bg-green-50 hover:text-green-600"
          )}
        >
          <MapPin className="mr-2 h-4 w-4" />
          {isSelected ? (
            <span className="flex items-center">
              Farm Location Selected <Check className="ml-2 h-4 w-4" />
            </span>
          ) : (
            "Draw Farm Location"
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Draw Farm Location</DialogTitle>
        </DialogHeader>
        {isLoaded ? (
          <div className="space-y-4">
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={initialCenter || { lat: 7.8731, lng: 80.7718 }} // Default to Sri Lanka center
              zoom={8}
              onLoad={onLoad}
              onUnmount={onUnmount}
              mapTypeId="hybrid"
            >
              <DrawingManager
                onLoad={onDrawingManagerLoad}
                drawingMode={google.maps.drawing.OverlayType.POLYGON}
                options={{
                  drawingControl: true,
                  drawingControlOptions: {
                    position: google.maps.ControlPosition.TOP_CENTER,
                    drawingModes: [google.maps.drawing.OverlayType.POLYGON],
                  },
                  polygonOptions: {
                    fillColor: "#3B82F6",
                    fillOpacity: 0.35,
                    strokeColor: "#2563EB",
                    strokeWeight: 2,
                    strokeOpacity: 1,
                    clickable: true,
                    editable: true,
                    zIndex: 1,
                  },
                }}
              />
              {initialPolygon && (
                <Polygon
                  paths={initialPolygon}
                  options={{
                    fillColor: "#4CAF50",
                    fillOpacity: 0.35,
                    strokeColor: "#4CAF50",
                    strokeWeight: 2,
                    strokeOpacity: 1,
                  }}
                />
              )}
            </GoogleMap>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={clearPolygon}>
                Clear
              </Button>
              <Button onClick={handleDialogClose}>Done</Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
