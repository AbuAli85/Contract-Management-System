'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pen, Trash2, Check, Download } from 'lucide-react';

interface SignaturePadProps {
  onSave: (signatureBase64: string) => void;
  onCancel?: () => void;
  signerName?: string;
  signerRole?: string;
  width?: number;
  height?: number;
}

export function SignaturePad({
  onSave,
  onCancel,
  signerName,
  signerRole,
  width = 600,
  height = 200,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.moveTo(20, height - 30);
    ctx.lineTo(width - 20, height - 30);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2;
  }, [width, height]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    setIsEmpty(false);
    const pos = getPos(e);
    setLastPos(pos);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) { ctx.beginPath(); ctx.moveTo(pos.x, pos.y); }
  }, []);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing || !lastPos) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setLastPos(pos);
  }, [isDrawing, lastPos]);

  const stopDrawing = useCallback(() => { setIsDrawing(false); setLastPos(null); }, []);

  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.moveTo(20, height - 30);
    ctx.lineTo(width - 20, height - 30);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2;
    setIsEmpty(true);
  }, [width, height]);

  const saveSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || isEmpty) return;
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const exportCtx = exportCanvas.getContext('2d');
    if (!exportCtx) return;
    exportCtx.fillStyle = '#ffffff';
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    exportCtx.drawImage(canvas, 0, 0);
    onSave(exportCanvas.toDataURL('image/png'));
  }, [isEmpty, onSave]);

  const downloadSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || isEmpty) return;
    const link = document.createElement('a');
    link.download = 'signature.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [isEmpty]);

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pen className="h-5 w-5 text-blue-600" />
          Digital Signature
        </CardTitle>
        {(signerName || signerRole) && (
          <div className="flex gap-2">
            {signerName && <Badge variant="outline">{signerName}</Badge>}
            {signerRole && <Badge variant="secondary">{signerRole}</Badge>}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">Sign in the box below using your mouse or touchscreen.</p>
        <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-white cursor-crosshair">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="touch-none"
          />
        </div>
        {isEmpty && <p className="text-xs text-center text-muted-foreground italic">Draw your signature above</p>}
        <div className="flex gap-2 justify-between">
          <Button variant="outline" size="sm" onClick={clearSignature}>
            <Trash2 className="h-4 w-4 mr-2" />Clear
          </Button>
          <div className="flex gap-2">
            {onCancel && <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>}
            <Button variant="outline" size="sm" onClick={downloadSignature} disabled={isEmpty}>
              <Download className="h-4 w-4 mr-2" />Download
            </Button>
            <Button size="sm" onClick={saveSignature} disabled={isEmpty}>
              <Check className="h-4 w-4 mr-2" />Apply Signature
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          By clicking "Apply Signature", you agree this electronic signature is legally binding.
        </p>
      </CardContent>
    </Card>
  );
}
