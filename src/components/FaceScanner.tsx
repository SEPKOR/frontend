'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from '@vladmandic/face-api';
import { Camera, Sparkles, Loader2, Save } from 'lucide-react';
import api from '@/lib/api';

const MODEL_URL = 'https://vladmandic.github.io/face-api/model/';

export default function FaceScanner({ onScanSaved }: { onScanSaved: () => void }) {
  const webcamRef = useRef<Webcam>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
          faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
      } catch (err) {
        console.error('Error loading models:', err);
      }
    };
    loadModels();
  }, []);

  const interpretSkinCondition = (emotion: string) => {
    if (['happy', 'surprised'].includes(emotion)) {
      return {
        condition: 'Radiant but underlying dehydration',
        treatment: 'Hyaluronic Acid infusion and Rosehip Oil massage to seal moisture.',
        products: ['Luminous Rosehip Serum', 'Revitalizing Essence Water']
      };
    } else if (['sad', 'angry', 'fearful', 'disgusted'].includes(emotion)) {
      return {
        condition: 'Stressed skin barrier, prone to inflammation',
        treatment: 'Cooling Chamomile Compress and gentle lipid-restoring barrier cream.',
        products: ['Botanical Clarifying Cleanser', 'Velvet Moisture Cream']
      };
    } else {
      return {
        condition: 'Balanced but slightly dull texture',
        treatment: 'Gentle fruit enzyme exfoliation followed by an antioxidant-rich essence.',
        products: ['Revitalizing Essence Water', 'Velvet Moisture Cream']
      };
    }
  };

  const captureAndScan = useCallback(async () => {
    if (!webcamRef.current || !modelsLoaded) return;
    
    setScanning(true);
    setResult(null);

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      setScanning(false);
      return;
    }

    try {
      const img = new Image();
      img.src = imageSrc;
      await new Promise((resolve) => { img.onload = resolve; });

      const detection = await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions()
        .withAgeAndGender();

      if (detection) {
        const expressions = detection.expressions;
        const dominantEmotion = Object.keys(expressions).reduce((a, b) => 
          // @ts-ignore
          expressions[a] > expressions[b] ? a : b
        );

        const diagnostic = interpretSkinCondition(dominantEmotion);

        setResult({
          age: Math.round(detection.age),
          emotion: dominantEmotion,
          condition: diagnostic.condition,
          treatment: diagnostic.treatment,
          products: diagnostic.products
        });
      } else {
        setResult({ error: 'Please align your face clearly within the frame.' });
      }
    } catch (err) {
      console.error(err);
      setResult({ error: 'An error occurred during diagnostic imaging.' });
    } finally {
      setScanning(false);
    }
  }, [webcamRef, modelsLoaded]);

  const saveScan = async () => {
    if (!result || result.error) return;
    
    setSaving(true);
    try {
      await api.post('/scans', {
        skin_condition: result.condition,
        treatment_recommendation: result.treatment,
        recommended_products: result.products,
        age_estimate: result.age,
      });
      onScanSaved();
      setResult(null);
    } catch (err) {
      console.error('Failed to save record', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative rounded-xl overflow-hidden glass-panel mb-6 w-full max-w-md aspect-[4/3] bg-foreground/5 flex items-center justify-center border border-border">
        {!modelsLoaded ? (
          <div className="flex flex-col items-center text-foreground/50">
            <Loader2 className="w-6 h-6 animate-spin mb-3 text-primary" />
            <p className="text-xs tracking-widest uppercase">Initializing Canvas...</p>
          </div>
        ) : (
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: "user" }}
            className="w-full h-full object-cover"
          />
        )}

        {scanning && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center z-10">
            <Sparkles className="w-8 h-8 text-primary animate-pulse mb-3" />
            <p className="text-foreground tracking-widest uppercase text-xs font-medium">Analyzing Texture & Tone</p>
          </div>
        )}
      </div>

      <div className="flex w-full justify-center">
        <button
          onClick={captureAndScan}
          disabled={!modelsLoaded || scanning}
          className="w-full max-w-xs btn-primary py-3 flex items-center justify-center gap-2"
        >
          <Camera className="w-4 h-4" />
          <span>{scanning ? 'Processing...' : 'Start Diagnostic'}</span>
        </button>
      </div>

      {result && (
        <div className="mt-10 w-full glass-panel p-8 rounded-xl animate-in slide-in-from-bottom-4 relative">
          {result.error ? (
            <p className="text-red-600/80 text-center font-light text-sm">{result.error}</p>
          ) : (
            <>
              <div className="text-center mb-6">
                <h3 className="text-2xl font-serif text-foreground">Diagnostic Result</h3>
                <p className="text-xs uppercase tracking-widest text-foreground/50 mt-1">Based on facial imaging</p>
              </div>
              
              <div className="space-y-6 mb-8">
                <div>
                  <p className="text-xs uppercase tracking-widest text-primary font-medium mb-1">Detected Skin Condition</p>
                  <p className="text-foreground font-light text-lg">{result.condition}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-primary font-medium mb-1">Recommended Natural Treatment</p>
                  <p className="text-foreground/80 font-light leading-relaxed">{result.treatment}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-primary font-medium mb-2">Curated Products</p>
                  <div className="flex flex-wrap gap-2">
                    {result.products.map((p: string) => (
                      <span key={p} className="px-3 py-1 bg-secondary text-foreground text-xs rounded-full border border-border">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                onClick={saveScan}
                disabled={saving}
                className="w-full py-3 bg-transparent hover:bg-black/5 border border-foreground/20 text-foreground rounded-lg transition-all font-medium text-xs tracking-widest uppercase flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
