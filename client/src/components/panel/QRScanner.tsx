import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

interface QRScannerProps {
  onClose: () => void;
  onScan: (data: string) => void;
}

export default function QRScanner({ onClose, onScan }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize scanner when component mounts
    if (containerRef.current) {
      scannerRef.current = new Html5Qrcode("qr-reader");
      
      const config = { fps: 10, qrbox: { width: 250, height: 250 } };
      
      scannerRef.current
        .start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            // Success callback - QR code detected and decoded
            onScan(decodedText);
            
            // Stop scanning after successful scan
            if (scannerRef.current) {
              scannerRef.current.stop();
            }
          },
          (errorMessage) => {
            // Error callback - only log errors, don't show to user
            console.error("QR Scan error:", errorMessage);
          }
        )
        .catch((err) => {
          console.error("Error starting scanner:", err);
        });
    }

    // Cleanup on unmount
    return () => {
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .catch(err => console.error("Error stopping scanner:", err));
      }
    };
  }, [onScan]);

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan QR Code</DialogTitle>
          <DialogDescription>
            Position the QR code within the scanner frame.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          <div 
            id="qr-reader" 
            ref={containerRef}
            style={{ width: "100%" }}
          ></div>
          
          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={onClose}>
              <XCircle className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
