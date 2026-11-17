import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Compass, LocateFixed, RotateCw, Smartphone} from 'lucide-react';
import {getCardinalDirection} from '../services/prayerService';
import type {UserLocation} from '../types/hasanat';

interface QiblaCompassProps {
  location: UserLocation;
  qiblaBearing: number;
  distanceKm: number;
  onDetectGPS: () => void;
  detectingGPS: boolean;
}

interface IOSDeviceOrientationEvent extends DeviceOrientationEvent {
  webkitCompassHeading?: number;
}

interface DeviceOrientationConstructorWithPermission {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

function shortestAngleDelta(a: number, b: number): number {
  const diff = ((a - b + 540) % 360) - 180;
  return Math.abs(diff);
}

export const QiblaCompass: React.FC<QiblaCompassProps> = ({
  location,
  qiblaBearing,
  distanceKm,
  onDetectGPS,
  detectingGPS,
}) => {
  const [sensorHeading, setSensorHeading] = useState<number | null>(null);
  const [manualHeading, setManualHeading] = useState<number>(0);
  const [sensorStatus, setSensorStatus] = useState<'idle' | 'active' | 'permission_needed' | 'unsupported'>('idle');
  const [useManualMode, setUseManualMode] = useState<boolean>(false);
  const wasAlignedRef = useRef(false);

  const attachSensorListener = useCallback(() => {
    let receivedData = false;

    const handleOrientation = (e: Event) => {
      const ev = e as IOSDeviceOrientationEvent;
      let heading: number | null = null;

      if (typeof ev.webkitCompassHeading === 'number' && !Number.isNaN(ev.webkitCompassHeading)) {
        heading = ev.webkitCompassHeading;
      } else if (typeof ev.alpha === 'number' && !Number.isNaN(ev.alpha)) {
        // Compensate for screen orientation angle when available
        const screenAngle =
          typeof window.screen?.orientation?.angle === 'number'
            ? window.screen.orientation.angle
            : 0;
        heading = (360 - ev.alpha + screenAngle) % 360;
      }

      if (heading !== null) {
        receivedData = true;
        setSensorHeading((heading + 360) % 360);
        setSensorStatus('active');
        setUseManualMode(false);
      }
    };

    window.addEventListener('deviceorientationabsolute', handleOrientation, true);
    window.addEventListener('deviceorientation', handleOrientation, true);

    // If desktop browser fires no magnetometer readings within 1.5s, gracefully offer interactive dial
    const timeout = window.setTimeout(() => {
      if (!receivedData) {
        setSensorStatus('unsupported');
      }
    }, 1500);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('DeviceOrientationEvent' in window)) {
      setSensorStatus('unsupported');
      return;
    }

    const DevOrient = window.DeviceOrientationEvent as unknown as DeviceOrientationConstructorWithPermission;
    if (typeof DevOrient.requestPermission === 'function') {
      setSensorStatus('permission_needed');
      return;
    }

    return attachSensorListener();
  }, [attachSensorListener]);

  const handleRequestSensorPermission = async () => {
    const DevOrient = window.DeviceOrientationEvent as unknown as DeviceOrientationConstructorWithPermission;
    if (typeof DevOrient.requestPermission === 'function') {
      try {
        const res = await DevOrient.requestPermission();
        if (res === 'granted') {
          attachSensorListener();
          setUseManualMode(false);
        } else {
          setSensorStatus('unsupported');
          setUseManualMode(true);
        }
      } catch {
        setSensorStatus('unsupported');
        setUseManualMode(true);
      }
    }
  };

  const activeHeading = useManualMode || sensorHeading === null ? manualHeading : sensorHeading;
  // Dial rotates counter-clockwise by device heading so North stays aligned with true North
  const dialRotation = -activeHeading;
  // Relative angle of Kaaba from the top of the phone screen
  const qiblaRelativeAngle = ((qiblaBearing - activeHeading + 540) % 360) - 180;
  const alignmentError = shortestAngleDelta(activeHeading, qiblaBearing);
  const isAligned = alignmentError <= 3;

  // Subtle haptic pulse upon locking onto Qibla
  useEffect(() => {
    if (isAligned && !wasAlignedRef.current) {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(40);
      }
    }
    wasAlignedRef.current = isAligned;
  }, [isAligned]);

  const tickMarks = useMemo(() => Array.from({length: 72}, (_, i) => i * 5), []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
      {/* Left/Center: Ornate Dark-Gold Astrolabe Qibla Compass */}
      <div className="lg:col-span-7 bg-[#12100C] border border-[#2B251A] rounded-3xl p-4 sm:p-8 flex flex-col items-center justify-between gap-5 sm:gap-6">
        <div className="w-full flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-[#8B816E]">Qibla Direction (اتجاه القبلة)</p>
            <h2 className="text-lg sm:text-xl font-semibold text-[#F5EFE2]">
              {location.name} · <span className="font-arabic text-[#E8CA68]">{location.arabicName}</span>
            </h2>
          </div>

          <div className="text-left sm:text-right tabular-nums">
            <div className="text-2xl font-mono-tabular font-semibold text-[#E8CA68]">
              {qiblaBearing.toFixed(1)}° {getCardinalDirection(qiblaBearing)}
            </div>
            <div className="text-xs text-[#8B816E]">{distanceKm.toLocaleString()} km to Makkah</div>
          </div>
        </div>

        {/* Fixed Top Phone Index Indicator */}
        <div className="relative w-full max-w-[275px] sm:max-w-[340px] aspect-square flex items-center justify-center my-1 sm:my-2">
          {/* Top Fixed Device Pointer */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
            <div
              className={`w-3.5 h-3.5 rotate-45 border-t-2 border-l-2 transition-colors duration-150 ${
                isAligned ? 'border-[#E8CA68] bg-[#D4AF37]' : 'border-[#D4AF37] bg-[#090806]'
              }`}
            />
          </div>

          {/* Outer Alignment Halo */}
          <div
            className={`absolute inset-2 rounded-full transition-all duration-300 pointer-events-none ${
              isAligned
                ? 'ring-2 ring-[#D4AF37] shadow-[0_0_45px_rgba(212,175,55,0.28)]'
                : 'ring-1 ring-[#2B251A]'
            }`}
          />

          {/* Rotating Compass Rose SVG */}
          <div
            className="w-full h-full will-change-transform transition-transform duration-150 ease-out"
            style={{transform: `rotate(${dialRotation}deg)`}}
          >
            <svg viewBox="0 0 320 320" className="w-full h-full">
              {/* Background Obsidian Disc */}
              <circle cx="160" cy="160" r="146" fill="#0B0A07" stroke="#2B251A" strokeWidth="1.5" />
              <circle cx="160" cy="160" r="118" fill="none" stroke="#2B251A" strokeWidth="1" strokeDasharray="3 5" />
              <circle cx="160" cy="160" r="64" fill="#12100C" stroke="#D4AF37" strokeOpacity="0.25" strokeWidth="1" />

              {/* Degree Ticks */}
              {tickMarks.map((deg) => {
                const major = deg % 30 === 0;
                const cardinal = deg % 90 === 0;
                const rad = ((deg - 90) * Math.PI) / 180;
                const r1 = cardinal ? 128 : major ? 133 : 138;
                const r2 = 144;
                return (
                  <line
                    key={deg}
                    x1={160 + r1 * Math.cos(rad)}
                    y1={160 + r1 * Math.sin(rad)}
                    x2={160 + r2 * Math.cos(rad)}
                    y2={160 + r2 * Math.sin(rad)}
                    stroke={cardinal ? '#D4AF37' : major ? '#8B816E' : '#3A3224'}
                    strokeWidth={cardinal ? 2 : major ? 1.5 : 1}
                  />
                );
              })}

              {/* Cardinal Labels */}
              <text x="160" y="38" textAnchor="middle" fill="#E8CA68" fontSize="13" fontWeight="700">N</text>
              <text x="284" y="165" textAnchor="middle" fill="#8B816E" fontSize="12" fontWeight="600">E</text>
              <text x="160" y="292" textAnchor="middle" fill="#8B816E" fontSize="12" fontWeight="600">S</text>
              <text x="36" y="165" textAnchor="middle" fill="#8B816E" fontSize="12" fontWeight="600">W</text>

              {/* Qibla Bearing Needle & Kaaba Emblem inside the rotating rose */}
              <g transform={`rotate(${qiblaBearing} 160 160)`}>
                {/* Needle Shaft */}
                <line
                  x1="160"
                  y1="160"
                  x2="160"
                  y2="46"
                  stroke={isAligned ? '#F5DC84' : '#D4AF37'}
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                {/* Tail Counterweight */}
                <line
                  x1="160"
                  y1="160"
                  x2="160"
                  y2="215"
                  stroke="#3A3224"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                {/* Kaaba Icon at Qibla Tip */}
                <g transform="translate(148 24)">
                  <rect
                    x="0"
                    y="0"
                    width="24"
                    height="24"
                    rx="4"
                    fill="#090806"
                    stroke={isAligned ? '#F5DC84' : '#D4AF37'}
                    strokeWidth="2"
                  />
                  <line x1="2" y1="8" x2="22" y2="8" stroke="#D4AF37" strokeWidth="2.5" />
                </g>
              </g>

              {/* Center Pivot */}
              <circle cx="160" cy="160" r="8" fill="#D4AF37" />
              <circle cx="160" cy="160" r="3" fill="#090806" />
            </svg>
          </div>
        </div>

        {/* Alignment Status Readout (Clean Text, Zero-Pill) */}
        <div className="w-full pt-4 border-t border-[#2B251A] flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className={`text-sm font-semibold ${isAligned ? 'text-[#E8CA68]' : 'text-[#F5EFE2]'}`}>
              {isAligned
                ? 'Aligned with Qibla · أنت تواجه القبلة الآن'
                : qiblaRelativeAngle > 0
                  ? `Turn ${Math.abs(Math.round(qiblaRelativeAngle))}° right toward Makkah`
                  : `Turn ${Math.abs(Math.round(qiblaRelativeAngle))}° left toward Makkah`}
            </div>
            <div className="text-xs text-[#8B816E] font-mono-tabular">
              Device Heading: {Math.round(activeHeading)}° · Qibla Bearing: {qiblaBearing.toFixed(1)}°
            </div>
          </div>

          {sensorStatus === 'permission_needed' && (
            <button
              type="button"
              onClick={handleRequestSensorPermission}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#D4AF37] text-[#090806] text-xs font-semibold flex items-center gap-2 cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>Enable Device Compass</span>
            </button>
          )}
        </div>
      </div>

      {/* Right Column: Sensor Calibration, Location & Desktop Simulator */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        <div className="bg-[#12100C] border border-[#2B251A] rounded-2xl p-4 sm:p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-[#F5EFE2]">Device Orientation &amp; Calibration</h3>
              <p className="text-xs text-[#8B816E] mt-1">
                On phones and tablets, the compass dial rotates automatically with your device magnetometer.
              </p>
            </div>
            <Smartphone className="w-5 h-5 text-[#D4AF37] shrink-0" />
          </div>

          <div className="p-4 rounded-xl bg-[#090806] border border-[#2B251A] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#C7BDA8]">Compass Input Mode</span>
              <span className="font-medium text-[#E8CA68]">
                {!useManualMode && sensorStatus === 'active'
                  ? 'Live Device Sensor'
                  : 'Manual Rotation Dial'}
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs text-[#8B816E] mb-2">
                <label htmlFor="manual-heading-slider">Rotate Device Heading (Calibration / Desktop)</label>
                <span className="font-mono-tabular text-[#F5EFE2]">{Math.round(activeHeading)}°</span>
              </div>
              <input
                id="manual-heading-slider"
                type="range"
                min={0}
                max={359}
                value={Math.round(activeHeading)}
                onChange={(e) => {
                  setUseManualMode(true);
                  setManualHeading(Number(e.target.value));
                }}
                className="w-full accent-[#D4AF37] cursor-pointer"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setUseManualMode(true);
                  setManualHeading(Math.round(qiblaBearing));
                }}
                className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#1A1711] hover:bg-[#242018] border border-[#2B251A] text-xs font-medium text-[#E8CA68] flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Align to Qibla ({Math.round(qiblaBearing)}°)</span>
              </button>

              {sensorStatus === 'active' && useManualMode && (
                <button
                  type="button"
                  onClick={() => setUseManualMode(false)}
                  className="min-h-[40px] px-3 py-1.5 rounded-xl border border-[#D4AF37]/50 text-xs font-medium text-[#D4AF37] cursor-pointer"
                >
                  Resume Live Sensor
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-[#12100C] border border-[#2B251A] rounded-2xl p-4 sm:p-6 space-y-4 flex-1 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-[#F5EFE2]">Location Coordinates</h3>
            <p className="text-xs text-[#8B816E]">
              Qibla bearing is computed using spherical trigonometry toward the Holy Kaaba (21.4225° N, 39.8262° E).
            </p>
            <dl className="divide-y divide-[#2B251A] text-xs">
              <div className="py-2.5 flex justify-between gap-3">
                <dt className="text-[#8B816E] shrink-0">Active Location</dt>
                <dd className="text-[#F5EFE2] font-medium text-right">{location.name}, {location.country}</dd>
              </div>
              <div className="py-2.5 flex justify-between gap-3">
                <dt className="text-[#8B816E] shrink-0">Latitude / Longitude</dt>
                <dd className="font-mono-tabular text-[#C7BDA8] text-right">
                  {location.latitude.toFixed(4)}°, {location.longitude.toFixed(4)}°
                </dd>
              </div>
              <div className="py-2.5 flex justify-between gap-3">
                <dt className="text-[#8B816E] shrink-0">Great-Circle Bearing</dt>
                <dd className="font-mono-tabular text-[#E8CA68] text-right">{qiblaBearing.toFixed(2)}° CW from True North</dd>
              </div>
              <div className="py-2.5 flex justify-between gap-3">
                <dt className="text-[#8B816E] shrink-0">Distance to Makkah</dt>
                <dd className="font-mono-tabular text-[#F5EFE2] text-right">{distanceKm.toLocaleString()} km</dd>
              </div>
            </dl>
          </div>

          <button
            type="button"
            onClick={onDetectGPS}
            disabled={detectingGPS}
            className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#E8CA68] disabled:opacity-60 text-[#090806] text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LocateFixed className="w-4 h-4" />
            <span>{detectingGPS ? 'Locating via GPS...' : 'Update GPS Coordinates'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
